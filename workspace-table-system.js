(function(){
  'use strict';

  /* v598 — preserve collapsible DOM contracts and batch table/copy enhancement
     so large reporting references cannot trigger re-entrant control work. */

  var TABLE_SELECTOR='table';
  var tableSequence=0;
  var enhancedTables=new Set();
  var filterState=new Map();
  var activeFilter=null;
  var raf=0;
  var portal=null;
  var portalInner=null;
  var currentPortalTable=null;
  var observer=null;
  var controlSyncRaf=0;
  var syncingCopyControls=false;

  function qsa(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector));}
  function normalize(value){return String(value===undefined||value===null?'':value).replace(/\s+/g,' ').trim();}
  function lower(value){return normalize(value).toLocaleLowerCase();}
  function isVisible(element){
    if(!element||!element.isConnected) return false;
    if(element.hidden) return false;
    var style=window.getComputedStyle(element);
    if(style.display==='none'||style.visibility==='hidden') return false;
    return element.getClientRects().length>0;
  }
  function funnelIcon(){
    return '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.2 3.1h11.6L9.5 8v4.1l-3 1.6V8L2.2 3.1z" fill="currentColor"></path></svg>';
  }
  function tableId(table){
    if(!table.dataset.dscTableId){
      tableSequence+=1;
      table.dataset.dscTableId='dsc-table-'+tableSequence;
    }
    return table.dataset.dscTableId;
  }
  function tableState(table){
    var id=tableId(table);
    if(!filterState.has(id)) filterState.set(id,{filters:{}});
    return filterState.get(id);
  }
  function shouldUseExistingZoneCatalogFilters(table){
    return table.matches('.zone-catalog-table-zone-types[data-zone-catalog-filterable-table]');
  }
  function isFilterableTable(table){
    if(!table||!table.tHead||!table.tBodies||!table.tBodies.length) return false;
    if(shouldUseExistingZoneCatalogFilters(table)) return false;
    if(table.hasAttribute('data-no-table-filters')) return false;
    /* Data/reference tables get Excel-style filters. Configuration grids that
       contain live controls keep the same visual/sticky-header system, but we
       do not hide rows containing inputs/buttons because that could interrupt
       an editing workflow. */
    if(table.querySelector('tbody input,tbody select,tbody textarea,tbody [contenteditable="true"],tbody button')) return false;
    var headerRow=table.tHead.rows[table.tHead.rows.length-1];
    if(!headerRow||!headerRow.cells.length) return false;
    var rows=Array.prototype.slice.call(table.tBodies[0].rows||[]);
    return rows.some(function(row){return row.cells&&row.cells.length;});
  }
  function headerLogicalIndex(row,cell){
    var index=0;
    for(var i=0;i<row.cells.length;i++){
      var current=row.cells[i];
      if(current===cell) return index;
      index+=Math.max(1,Number(current.colSpan)||1);
    }
    return index;
  }
  function ensureHeaderFilter(table,th,row){
    if(!th||th.colSpan>1||th.rowSpan>1) return;
    if(th.querySelector(':scope > .dsc-table-filterable-heading')) return;
    if(th.querySelector('[data-zone-catalog-column-filter]')) return;
    var columnIndex=headerLogicalIndex(row,th);
    /* v748 — keep the TOGGLE column filterable on PGM Attribute tables. Its
       header geometry now reserves a dedicated label track and a dedicated
       funnel track, so the control never overlaps the text. */
    var label=normalize(th.textContent)||('Column '+(columnIndex+1));
    th.dataset.dscTableColumnIndex=String(columnIndex);
    th.dataset.dscTableColumnLabel=label;
    var wrapper=document.createElement('div');
    wrapper.className='dsc-table-filterable-heading';
    var labelNode=document.createElement('span');
    labelNode.className='dsc-table-heading-label';
    while(th.firstChild) labelNode.appendChild(th.firstChild);
    var button=document.createElement('button');
    button.type='button';
    button.className='dsc-table-column-filter-button';
    button.setAttribute('data-dsc-table-filter-button','');
    button.setAttribute('data-dsc-table-id',tableId(table));
    button.setAttribute('data-dsc-table-column-index',String(columnIndex));
    button.setAttribute('aria-label','Filter '+label);
    button.setAttribute('aria-pressed','false');
    button.title='Filter '+label;
    button.innerHTML=funnelIcon();
    wrapper.appendChild(labelNode);
    wrapper.appendChild(button);
    th.appendChild(wrapper);
  }
  function enhanceHeaders(table){
    if(!isFilterableTable(table)) return;
    var row=table.tHead.rows[table.tHead.rows.length-1];
    Array.prototype.forEach.call(row.cells,function(th){ensureHeaderFilter(table,th,row);});
    syncFilterButtons(table);
  }

  function reconcileHiddenColumnFilters(table){
    if(!table||!table.tHead) return;
    var state=tableState(table),changed=false;
    qsa('thead th[data-dsc-table-column-index]',table).forEach(function(th){
      var key=th.getAttribute('data-dsc-table-column-index')||'';
      var hidden=th.hidden||window.getComputedStyle(th).display==='none';
      if(hidden&&Object.prototype.hasOwnProperty.call(state.filters,key)){delete state.filters[key];changed=true;}
    });
    if(changed) applyFilters(table);
  }

  function tableHasDedicatedCopyControl(table){
    var body=table&&table.closest?table.closest('#referenceBody'):null;
    if(!body) return false;
    var ref=body.getAttribute('data-reference-id')||'';
    if((ref==='neo-zone-types'||ref==='new-powerseries-zone-types')&&table.matches('.zone-types-table')){
      return !!document.querySelector('#referenceHeaderControls [data-zone-types-table-copy]');
    }
    if((ref==='neo-zone-types-table'||ref==='new-powerseries-zone-types-table')&&table.matches('.zone-catalog-table-zone-types')){
      return !!document.querySelector('#referenceHeaderControls [data-zone-catalog-table-copy]');
    }
    if(document.querySelector('#referenceHeaderControls [data-zone-attribute-copy]')&&(
      table.matches('.zone-attributes-v2-table,.zone-attribute-table,.zone-attributes-table,.default-zone-attributes-table')||
      /zone-attributes|default-zone-attributes/.test(ref)
    )) return true;
    return false;
  }
  function directChildMatching(node,selectors){
    if(!node||!node.children) return null;
    var list=String(selectors||'').split(',').map(function(value){return value.trim();}).filter(Boolean);
    for(var i=0;i<node.children.length;i++){
      var child=node.children[i];
      for(var j=0;j<list.length;j++) if(child.matches&&child.matches(list[j])) return child;
    }
    return null;
  }
  function localCopyScopeForTable(table){
    if(!table||!table.closest) return null;
    var view=table.closest('.view');
    var node=table.parentElement;
    while(node&&node!==view&&node!==document.body){
      var header=null,overlay=false;
      if(node.matches&&node.matches('.collapsible-document-section,.module-detail-section,.compatible-device-group,.neo-specification-section,.neo-installation-section,.panel-model-specification-section')){
        header=directChildMatching(node,'.collapsible-document-heading');
        if(header) overlay=true;
      }
      if(!header&&node.tagName==='DETAILS'){
        header=directChildMatching(node,'summary');
        if(header) overlay=true;
      }
      if(!header&&node.matches&&node.matches('.collapsible-card')) header=directChildMatching(node,'.collapsible-card-head,.card-head');
      if(!header&&node.matches&&node.matches('.module-info-card,.reporting-format-card,.card:not(.reference-content-card):not(.workspace-data-card)')){
        header=directChildMatching(node,'.card-head,.module-diagrams-head,.section-header,h2,h3,h4');
      }
      if(!header&&node.matches&&node.matches('section,article')){
        header=directChildMatching(node,'.card-head,.section-header,.tool-section-header,.module-diagrams-head,h2,h3,h4');
      }
      if(header) return {scope:node,header:header,overlay:overlay||header.tagName==='SUMMARY'||header.tagName==='BUTTON'};
      if(node.id==='referenceBody'||node.id==='inventoryBody') break;
      node=node.parentElement;
    }
    return null;
  }
  function tableAllowedInCurrentLayout(table,view){
    if(!table||!table.isConnected||table.closest('.dsc-sticky-table-header-portal')) return false;
    var node=table;
    while(node&&node!==view){
      if(node.hidden&&!node.hasAttribute('data-collapsible-section-body')) return false;
      node=node.parentElement;
    }
    return true;
  }
  function copyableTablesInView(view){
    return qsa('table.dsc-unified-table',view).filter(function(table){return tableAllowedInCurrentLayout(table,view);});
  }
  function copyTargetIds(tables){
    return tables.map(tableId).join(',');
  }
  function copyButton(label,title){
    var button=document.createElement('button');
    button.type='button';
    button.className='secondary compact-action-button dsc-table-copy-button';
    button.setAttribute('data-dsc-copy-group','');
    button.textContent=label||'Copy';
    button.title=title||'Copy table';
    button.setAttribute('aria-label',title||'Copy table');
    return button;
  }
  function positionOverlayCopyButton(button,header,host){
    if(!button||!header||!host||!button.isConnected) return;
    var hostRect=host.getBoundingClientRect(),headerRect=header.getBoundingClientRect();
    var meta=header.querySelector&&header.querySelector('.collapsible-heading-meta');
    var right=10;
    if(meta&&meta.getClientRects().length){
      var metaRect=meta.getBoundingClientRect();
      right=Math.max(10,hostRect.right-metaRect.left+8);
    }
    var height=button.offsetHeight||31;
    var top=Math.max(4,headerRect.top-hostRect.top+(headerRect.height-height)/2);
    button.style.right=Math.round(right)+'px';
    button.style.top=Math.round(top)+'px';
  }
  function ensureLocalCopyControl(info,tables){
    if(!info||!info.scope||!info.header||!tables.length) return;
    var scope=info.scope,ids=copyTargetIds(tables);
    if(!scope.dataset.dscCopyScopeId){tableSequence+=1;scope.dataset.dscCopyScopeId='dsc-copy-scope-'+tableSequence;}
    var key=scope.dataset.dscCopyScopeId;
    var button=scope.querySelector(':scope > [data-dsc-local-copy="'+key+'"]');
    if(!button){
      button=copyButton('Copy',tables.length>1?'Copy all tables in this section':'Copy this table');
      button.setAttribute('data-dsc-local-copy',key);
      if(info.overlay){
        scope.classList.add('dsc-copy-heading-host');
        info.header.classList.add('dsc-has-section-copy');
        button.classList.add('dsc-section-copy-overlay');
        /* Keep the owning section's native heading -> body DOM adjacency intact.
           Several workspace components treat that adjacency as part of their
           collapsible contract. The Copy button is absolutely positioned, so
           its DOM order does not need to sit between the heading and body. */
        scope.appendChild(button);
      }else{
        info.header.classList.add('dsc-copy-inline-header');
        button.classList.add('dsc-section-copy-inline');
        var meta=info.header.querySelector&&info.header.querySelector('.collapsible-heading-meta,.section-count,.count,.meta');
        info.header.insertBefore(button,meta||null);
      }
    }
    button.setAttribute('data-dsc-copy-table-ids',ids);
    button.setAttribute('data-dsc-copy-kind',tables.length>1?'section-all':'table');
    if(info.overlay) window.requestAnimationFrame(function(){positionOverlayCopyButton(button,info.header,scope);});
  }
  function viewHeaderControls(view){
    if(!view) return null;
    return directChildMatching(view,'.section-title')?directChildMatching(directChildMatching(view,'.section-title'),'.view-header-controls'):view.querySelector('.view-header-controls');
  }
  function ensureViewCopyControl(view,tables,mode){
    var controls=viewHeaderControls(view);if(!controls) return;
    var existing=controls.querySelector('[data-dsc-view-copy]');
    if(!mode){if(existing) existing.remove();return;}
    if(!existing){
      existing=copyButton(mode==='all'?'Copy All':'Copy',mode==='all'?'Copy all tables in this section':'Copy this table');
      existing.setAttribute('data-dsc-view-copy','');
      var settings=controls.querySelector('[data-zone-types-search-settings-toggle],[data-zone-catalog-table-settings-toggle],[data-zone-attribute-settings-toggle],[data-settings-toggle],button[title*="Settings" i],button[aria-label*="Settings" i]');
      controls.insertBefore(existing,settings||null);
    }
    existing.textContent=mode==='all'?'Copy All':'Copy';
    existing.title=mode==='all'?'Copy all tables in this section':'Copy this table';
    existing.setAttribute('aria-label',existing.title);
    existing.setAttribute('data-dsc-copy-table-ids',copyTargetIds(tables));
    existing.setAttribute('data-dsc-copy-kind',mode==='all'?'view-all':'table');
  }
  function cleanupCopyControls(desiredLocalKeys,desiredViews){
    qsa('.dsc-table-copy-toolbar,[data-dsc-table-copy-for]',document).forEach(function(node){node.remove();});
    qsa('[data-dsc-local-copy]',document).forEach(function(button){
      var key=button.getAttribute('data-dsc-local-copy')||'';
      if(!desiredLocalKeys.has(key)){
        var host=button.parentElement;
        var heading=host&&host.querySelector(':scope > .dsc-has-section-copy');
        if(heading) heading.classList.remove('dsc-has-section-copy');
        if(host){host.classList.remove('dsc-copy-heading-host');host.classList.remove('dsc-copy-inline-header');}
        button.remove();
      }
    });
    qsa('[data-dsc-view-copy]',document).forEach(function(button){
      var view=button.closest('.view');
      if(!view||!desiredViews.has(view)) button.remove();
    });
  }
  function syncCopyControls(){
    if(syncingCopyControls) return;
    syncingCopyControls=true;
    try{
      var desiredLocalKeys=new Set(),desiredViews=new Set();
      qsa('.view',document).forEach(function(view){
        if(!view.classList.contains('active')){ensureViewCopyControl(view,[],null);return;}
        var tables=copyableTablesInView(view);
        if(!tables.length){ensureViewCopyControl(view,[],null);return;}
        var localGroups=new Map(),unscoped=[];
        tables.forEach(function(table){
          if(tableHasDedicatedCopyControl(table)) return;
          var info=localCopyScopeForTable(table);
          if(!info){unscoped.push(table);return;}
          var entry=localGroups.get(info.scope);
          if(!entry){entry={info:info,tables:[]};localGroups.set(info.scope,entry);}
          entry.tables.push(table);
        });
        localGroups.forEach(function(entry){
          ensureLocalCopyControl(entry.info,entry.tables);
          desiredLocalKeys.add(entry.info.scope.dataset.dscCopyScopeId);
        });
        var mode=null;
        if(tables.length>1) mode='all';
        else if(unscoped.length===1&&!tableHasDedicatedCopyControl(unscoped[0])) mode='single';
        if(mode){ensureViewCopyControl(view,tables,mode);desiredViews.add(view);}else ensureViewCopyControl(view,[],null);
      });
      cleanupCopyControls(desiredLocalKeys,desiredViews);
    }finally{
      syncingCopyControls=false;
    }
  }
  function scheduleControlSync(){
    if(controlSyncRaf) return;
    var run=function(){
      controlSyncRaf=0;
      syncZoneTypeToolsCopyControl();
      syncCopyControls();
      scheduleStickyUpdate();
    };
    controlSyncRaf=window.requestAnimationFrame?window.requestAnimationFrame(run):window.setTimeout(run,16);
  }
  function enhanceTable(table){
    if(!table||table.closest('.dsc-sticky-table-header-portal')||table.hasAttribute('data-no-table-system')) return;
    table.classList.add('dsc-unified-table');
    tableId(table);
    enhancedTables.add(table);
    enhanceHeaders(table);
    if(table.matches('.zone-types-table')) table.classList.add('dsc-zone-tools-table-parity');
    scheduleStickyUpdate();
  }
  function enhanceWithin(root,deferControlSync){
    if(!root) return;
    if(root.nodeType===1&&root.matches&&root.matches(TABLE_SELECTOR)) enhanceTable(root);
    qsa(TABLE_SELECTOR,root).forEach(enhanceTable);
    if(deferControlSync) scheduleControlSync();
    else{
      syncZoneTypeToolsCopyControl();
      syncCopyControls();
    }
  }

  function copyTextForCell(cell){
    if(!cell) return '';
    var clone=cell.cloneNode(true);
    qsa('[data-dsc-table-filter-button],[data-zone-catalog-column-filter],.dsc-table-column-filter-button',clone).forEach(function(node){node.remove();});
    var sourceControls=qsa('input,select,textarea',cell),cloneControls=qsa('input,select,textarea',clone);
    sourceControls.forEach(function(control,index){
      var target=cloneControls[index];
      if(!target||!target.parentNode) return;
      var value='';
      if(control.tagName==='SELECT'){
        var option=control.options&&control.selectedIndex>=0?control.options[control.selectedIndex]:null;
        value=option?normalize(option.textContent||option.value):normalize(control.value);
      }else if(control.type==='checkbox'||control.type==='radio'){
        value=control.checked?'Yes':'No';
      }else value=normalize(control.value);
      target.parentNode.replaceChild(document.createTextNode(value),target);
    });
    return normalize(clone.textContent||'');
  }
  function rowCellText(row,columnIndex){
    if(!row||!row.cells) return '';
    var logical=0;
    for(var i=0;i<row.cells.length;i++){
      var cell=row.cells[i];
      var span=Math.max(1,Number(cell.colSpan)||1);
      if(columnIndex>=logical&&columnIndex<logical+span) return copyTextForCell(cell);
      logical+=span;
    }
    return '';
  }
  function isSectionRow(row){
    if(!row) return false;
    if(row.classList.contains('section-row')) return true;
    if(row.cells&&row.cells.length===1&&Number(row.cells[0].colSpan||1)>1) return true;
    return false;
  }
  function allBodyRows(table){
    if(!table.tBodies||!table.tBodies.length) return [];
    var rows=[];
    Array.prototype.forEach.call(table.tBodies,function(body){rows=rows.concat(Array.prototype.slice.call(body.rows||[]));});
    return rows;
  }
  function rawDataRows(table){
    return allBodyRows(table).filter(function(row){return !isSectionRow(row);});
  }
  function valuesForColumn(table,columnIndex){
    var seen=new Map();
    rawDataRows(table).forEach(function(row){
      var raw=rowCellText(row,columnIndex);
      var key=raw;
      if(!seen.has(key)) seen.set(key,raw||'(Blank)');
    });
    return Array.from(seen.entries()).sort(function(a,b){return a[1].localeCompare(b[1],undefined,{numeric:true,sensitivity:'base'});});
  }
  function applyFilters(table){
    var state=tableState(table),filters=state.filters||{};
    var rows=allBodyRows(table);
    rows.forEach(function(row){
      if(isSectionRow(row)) return;
      var pass=true;
      Object.keys(filters).forEach(function(key){
        if(!pass) return;
        var set=filters[key];
        if(!(set instanceof Set)) return;
        var value=rowCellText(row,Number(key));
        if(!set.has(value)) pass=false;
      });
      row.classList.toggle('dsc-table-filter-hidden',!pass);
    });
    var currentSection=null,sectionHasVisible=false;
    rows.forEach(function(row,index){
      if(isSectionRow(row)){
        if(currentSection) currentSection.classList.toggle('dsc-table-filter-hidden',!sectionHasVisible);
        currentSection=row; sectionHasVisible=false;
      }else if(!row.classList.contains('dsc-table-filter-hidden')&&!row.hidden){
        sectionHasVisible=true;
      }
      if(index===rows.length-1&&currentSection) currentSection.classList.toggle('dsc-table-filter-hidden',!sectionHasVisible);
    });
    syncFilterButtons(table);
    scheduleStickyUpdate();
  }
  function syncFilterButtons(table){
    var id=tableId(table),state=tableState(table),filters=state.filters||{};
    qsa('[data-dsc-table-filter-button][data-dsc-table-id="'+id+'"]',document).forEach(function(button){
      var key=button.getAttribute('data-dsc-table-column-index')||'';
      var active=Object.prototype.hasOwnProperty.call(filters,key)&&filters[key] instanceof Set;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
  }
  function closeFilterPanel(){
    if(!activeFilter) return;
    if(activeFilter.panel&&activeFilter.panel.parentNode) activeFilter.panel.parentNode.removeChild(activeFilter.panel);
    activeFilter=null;
  }
  function positionFilterPanel(panel,anchor){
    if(!panel||!anchor||!anchor.isConnected) return;
    var header=anchor.closest('th')||anchor;
    var rect=header.getBoundingClientRect();
    var viewportWidth=document.documentElement.clientWidth||window.innerWidth;
    var viewportHeight=document.documentElement.clientHeight||window.innerHeight;
    var width=Math.max(270,Math.min(360,Math.max(rect.width,300)));
    width=Math.min(width,viewportWidth-20);
    var left=Math.max(10,Math.min(rect.left,viewportWidth-width-10));
    var top=Math.max(10,rect.bottom+5);
    var maxHeight=Math.max(170,viewportHeight-top-10);
    panel.style.setProperty('--dsc-table-filter-left',Math.round(left)+'px');
    panel.style.setProperty('--dsc-table-filter-top',Math.round(top)+'px');
    panel.style.setProperty('--dsc-table-filter-width',Math.round(width)+'px');
    panel.style.setProperty('--dsc-table-filter-max-height',Math.round(maxHeight)+'px');
  }
  function updateSelectAll(panel,selectedCount,totalCount){
    var selectAll=panel.querySelector('[data-dsc-filter-select-all]');
    if(selectAll){
      selectAll.checked=selectedCount===totalCount&&totalCount>0;
      selectAll.indeterminate=selectedCount>0&&selectedCount<totalCount;
    }
  }
  function openFilterPanel(button){
    var id=button.getAttribute('data-dsc-table-id'),columnIndex=Number(button.getAttribute('data-dsc-table-column-index'));
    var table=qsa('table[data-dsc-table-id="'+id+'"]',document)[0];
    if(!table) return;
    if(activeFilter&&activeFilter.table===table&&activeFilter.columnIndex===columnIndex){closeFilterPanel();return;}
    closeFilterPanel();
    var header=table.querySelector('thead th[data-dsc-table-column-index="'+columnIndex+'"]');
    var label=header?header.getAttribute('data-dsc-table-column-label')||normalize(header.textContent):('Column '+(columnIndex+1));
    var entries=valuesForColumn(table,columnIndex);
    var state=tableState(table),existing=state.filters[String(columnIndex)];
    var allValues=entries.map(function(entry){return entry[0];});
    var selected=existing instanceof Set?new Set(Array.from(existing)):new Set(allValues);
    var panel=document.createElement('div');
    panel.className='dsc-table-filter-panel';
    panel.setAttribute('data-dsc-table-filter-panel','');
    var options=entries.map(function(entry,index){
      var value=entry[0],display=entry[1];
      return '<label class="dsc-table-filter-option" data-dsc-filter-option data-search="'+escapeHtml(lower(display))+'"><input type="checkbox" data-dsc-filter-value="'+index+'" '+(selected.has(value)?'checked ':'')+'><span class="dsc-table-filter-check-box" aria-hidden="true"></span><span class="dsc-table-filter-option-label">'+escapeHtml(display)+'</span></label>';
    }).join('');
    panel.innerHTML='<div class="dsc-table-filter-panel-head"><strong>'+escapeHtml(label)+'</strong><button type="button" class="secondary compact-action-button dsc-table-filter-clear" data-dsc-filter-clear '+(existing?'':'disabled')+'>Clear</button></div>'+
      '<div class="dsc-table-filter-search-wrap"><input type="search" class="dsc-table-filter-search" data-dsc-filter-search placeholder="Search values..." autocomplete="off" spellcheck="false" aria-label="Search '+escapeHtml(label)+' filter values"></div>'+
      '<label class="dsc-table-filter-option dsc-table-filter-select-all"><input type="checkbox" data-dsc-filter-select-all '+(selected.size===allValues.length&&allValues.length?'checked ':'')+'><span class="dsc-table-filter-check-box" aria-hidden="true"></span><span class="dsc-table-filter-option-label">Select all</span></label>'+
      '<div class="dsc-table-filter-values" data-dsc-filter-values>'+options+'</div>';
    document.body.appendChild(panel);
    positionFilterPanel(panel,button);
    activeFilter={panel:panel,anchor:button,table:table,columnIndex:columnIndex,entries:entries,selected:selected};
    var search=panel.querySelector('[data-dsc-filter-search]');
    if(search){
      search.addEventListener('input',function(){
        var query=lower(search.value);
        qsa('[data-dsc-filter-option]',panel).forEach(function(option){option.hidden=!!query&&String(option.getAttribute('data-search')||'').indexOf(query)<0;});
      });
      try{search.focus({preventScroll:true});}catch(_error){search.focus();}
    }
    function commit(){
      var chosen=new Set();
      qsa('[data-dsc-filter-value]',panel).forEach(function(input,index){if(input.checked&&entries[index]) chosen.add(entries[index][0]);});
      if(chosen.size===allValues.length) delete state.filters[String(columnIndex)];
      else state.filters[String(columnIndex)]=chosen;
      selected=chosen;
      applyFilters(table);
      updateSelectAll(panel,chosen.size,allValues.length);
      var clear=panel.querySelector('[data-dsc-filter-clear]');if(clear) clear.disabled=!Object.prototype.hasOwnProperty.call(state.filters,String(columnIndex));
    }
    qsa('[data-dsc-filter-value]',panel).forEach(function(input){input.addEventListener('change',commit);});
    var selectAll=panel.querySelector('[data-dsc-filter-select-all]');
    if(selectAll) selectAll.addEventListener('change',function(){qsa('[data-dsc-filter-value]',panel).forEach(function(input){input.checked=selectAll.checked;});commit();});
    var clear=panel.querySelector('[data-dsc-filter-clear]');
    if(clear) clear.addEventListener('click',function(){
      delete state.filters[String(columnIndex)];
      qsa('[data-dsc-filter-value]',panel).forEach(function(input){input.checked=true;});
      applyFilters(table);updateSelectAll(panel,allValues.length,allValues.length);clear.disabled=true;
    });
  }
  function escapeHtml(value){
    return String(value===undefined||value===null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }

  function scrollHostFor(table){
    var node=table.parentElement;
    while(node&&node!==document.body&&node!==document.documentElement){
      var style=window.getComputedStyle(node);
      var scrollable=(style.overflowY==='auto'||style.overflowY==='scroll')&&node.scrollHeight>node.clientHeight+3;
      if(scrollable) return node;
      node=node.parentElement;
    }
    return window;
  }
  function immediateTableScroll(table){return table.closest('.table-scroll,.comparison-scroll-surface,.program-default-zone-attributes-scroll,.program-table-scroll');}
  function usesNativeSticky(table){
    var wrapper=immediateTableScroll(table);
    if(!wrapper) return false;
    var host=scrollHostFor(table);
    return host===wrapper;
  }
  function ensurePortal(){
    if(portal) return;
    portal=document.createElement('div');
    portal.className='dsc-sticky-table-header-portal';
    portal.hidden=true;
    portal.setAttribute('aria-hidden','false');
    portalInner=document.createElement('div');
    portalInner.className='dsc-sticky-table-header-viewport';
    portal.appendChild(portalInner);
    document.body.appendChild(portal);
  }
  /* v731 — sticky portal visibility guard for collapsed programming reference tables. */
  function visibleEnhancedTables(){
    var activeView=document.querySelector('.view.active');
    return Array.from(enhancedTables).filter(function(table){
      if(!table.isConnected||!table.tHead||usesNativeSticky(table)) return false;
      if(activeView&&!activeView.contains(table)) return false;
      /* offsetParent alone is not sufficient for descendants of a closed <details>:
         some browsers can retain layout ancestry long enough for the sticky portal
         to select a table whose disclosure is no longer rendered.  Reject any
         table inside a closed disclosure and any table with no rendered client box.
         This keeps reference headers (including PGM Attributes List) from floating
         after their table has been collapsed in either New programming view. */
      if(table.offsetParent===null) return false;
      var disclosure=table.closest('details');
      while(disclosure){
        if(!disclosure.open) return false;
        disclosure=disclosure.parentElement&&disclosure.parentElement.closest?disclosure.parentElement.closest('details'):null;
      }
      return table.getClientRects().length>0;
    });
  }
  function hostViewport(host){
    if(host===window) return {top:0,left:0,right:document.documentElement.clientWidth||window.innerWidth,bottom:document.documentElement.clientHeight||window.innerHeight};
    var rect=host.getBoundingClientRect();
    return {top:rect.top,left:rect.left,right:rect.right,bottom:rect.bottom};
  }
  /* v666: programming tables may sit below multiple frozen context rows.
     Calculate the actual bottom edge of the active programming stack instead
     of assuming the table can own the top of the viewport. This includes the
     fixed Full Field Info owner-row mirror introduced in v666. */
  function programmingContextReserve(table,host,vp){
    if(!table||!table.closest||!vp) return 0;
    var body=table.closest('#documentBody[data-programming-presentation="compact-summary-table"]');
    if(!body) return 0;
    var reserve=0;
    var infoPanel=table.closest('.program-field-info');
    if(infoPanel){
      /* v669: the Full Field Info mirror is body-ported so fixed coordinates
         are true viewport coordinates. Keep the table-header handoff aware of
         that portal instead of looking only inside the info panel. */
      var infoSticky=infoPanel.__programInfoStickyHeader || null;
      if(!infoSticky || !infoSticky.isConnected){
        var portalCandidates=qsa('body > .program-info-sticky-header.program-info-sticky-portal.is-stuck-visible',document);
        for(var p=0;p<portalCandidates.length;p++){
          if(portalCandidates[p].__programInfoPanel===infoPanel){infoSticky=portalCandidates[p];break;}
        }
      }
      if(infoSticky&&isVisible(infoSticky)){
        var infoRect=infoSticky.getBoundingClientRect();
        if(infoRect.bottom>vp.top) reserve=Math.max(reserve,infoRect.bottom-vp.top);
      }
    }
    qsa('.program-block > .program-row[data-program-toggle],.program-static-parent > .program-static-parent-summary[data-program-compact-static-toggle]',body).forEach(function(header){
      var block=header.parentElement;
      if(!block||!block.contains(table)||!isVisible(header)) return;
      var style=window.getComputedStyle(header);
      if(!style||style.position!=='sticky') return;
      var rect=header.getBoundingClientRect();
      if(rect.bottom<=vp.top||rect.top>vp.top+180) return;
      reserve=Math.max(reserve,rect.bottom-vp.top);
    });
    return Math.max(0,reserve);
  }

  /* v627: nested frozen headers share one vertical stack. A table header
     portal must start below every already-sticky ancestor header that belongs
     to the table's current branch instead of claiming the host's top edge. */
  function stickyAncestorReserve(table,host,vp){
    if(!table||!vp) return 0;
    var reserve=0,branch=table,ancestor=table.parentElement,seen=[];
    while(ancestor&&ancestor!==document.body&&ancestor!==document.documentElement){
      var children=ancestor.children||[];
      for(var i=0;i<children.length;i++){
        var child=children[i];
        if(child===branch||child.contains(table)) continue;
        /* Only preceding siblings can be contextual headers for this branch. */
        if(child.compareDocumentPosition&&branch&&!(child.compareDocumentPosition(branch)&Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        var style=window.getComputedStyle(child);
        if(!style||style.position!=='sticky'||style.display==='none'||style.visibility==='hidden') continue;
        var rect=child.getBoundingClientRect(),height=Math.max(0,rect.height||child.offsetHeight||0);
        if(height<1||rect.bottom<=vp.top+1) continue;
        /* Once the table itself has crossed the host top, any sticky sibling
           on its ancestor path is active or about to be active. Stack it once. */
        if(rect.top<=vp.top+reserve+2){
          if(seen.indexOf(child)<0){seen.push(child);reserve+=height;}
        }
      }
      if(ancestor===host) break;
      branch=ancestor;ancestor=ancestor.parentElement;
    }
    reserve=Math.max(reserve,programmingContextReserve(table,host,vp));
    return reserve;
  }
  function activeTableForHost(host,tables){
    var vp=hostViewport(host),candidates=[];
    tables.forEach(function(table){
      if(scrollHostFor(table)!==host) return;
      var rect=table.getBoundingClientRect();
      /* Most programming/reference tables are far outside the viewport. Skip
         their expensive sticky-ancestor/style calculations until they are near
         the active scroll window. */
      if(rect.bottom<vp.top-160||rect.top>vp.bottom+160) return;
      var head=table.tHead.getBoundingClientRect();
      var h=Math.max(1,head.height||32);
      /* v666: a table becomes sticky only after it reaches the bottom of its
         contextual sticky-header stack, and it stops before there is no room
         to render a complete header below that stack. */
      var reserve=stickyAncestorReserve(table,host,vp);
      var threshold=vp.top+reserve;
      if(rect.top<threshold+1&&rect.bottom>threshold+h) candidates.push({table:table,rect:rect,head:head,reserve:reserve});
    });
    candidates.sort(function(a,b){return b.rect.top-a.rect.top;});
    return candidates[0]||null;
  }
  function preferredActiveHost(tables){
    var grouped=[];
    tables.forEach(function(table){
      var host=scrollHostFor(table);
      if(!grouped.some(function(group){return group.host===host;})) grouped.push({host:host,tables:[]});
      grouped.filter(function(group){return group.host===host;})[0].tables.push(table);
    });
    var active=[];
    grouped.forEach(function(group){var current=activeTableForHost(group.host,group.tables);if(current) active.push({host:group.host,current:current,tables:group.tables});});
    if(!active.length) return null;
    active.sort(function(a,b){
      var av=hostViewport(a.host),bv=hostViewport(b.host);
      var ac=Math.max(0,Math.min(av.bottom,window.innerHeight)-Math.max(av.top,0));
      var bc=Math.max(0,Math.min(bv.bottom,window.innerHeight)-Math.max(bv.top,0));
      return bc-ac;
    });
    return active[0];
  }
  function nextTableTop(host,currentTable,tables){
    var currentRect=currentTable.getBoundingClientRect(),nextTop=Infinity;
    tables.forEach(function(table){
      if(table===currentTable||scrollHostFor(table)!==host||!isVisible(table)) return;
      var rect=table.getBoundingClientRect();
      if(rect.top>currentRect.top&&rect.top<nextTop) nextTop=rect.top;
    });
    return nextTop;
  }
  function buildPortalHeader(table,host,tables,fastScroll){
    ensurePortal();
    var vp=hostViewport(host),tableRect=table.getBoundingClientRect(),headRect=table.tHead.getBoundingClientRect();
    var wrapper=immediateTableScroll(table),wrapperRect=wrapper?wrapper.getBoundingClientRect():tableRect;
    var visibleLeft=Math.max(vp.left,wrapperRect.left),visibleRight=Math.min(vp.right,wrapperRect.right);
    if(visibleRight-visibleLeft<40){portal.hidden=true;return;}
    var headerHeight=Math.max(1,headRect.height||32);
    var stickyReserve=stickyAncestorReserve(table,host,vp);
    var baseTop=vp.top+stickyReserve;
    var top=baseTop;
    var nextTop=nextTableTop(host,table,tables);
    if(nextTop<top+headerHeight) top=Math.max(baseTop,nextTop-headerHeight);
    if(tableRect.bottom<top+headerHeight) top=Math.max(baseTop,tableRect.bottom-headerHeight);
    portal.style.left=Math.round(visibleLeft)+'px';
    portal.style.top=Math.round(top)+'px';
    portal.style.width=Math.round(visibleRight-visibleLeft)+'px';
    portal.style.height=Math.round(headerHeight)+'px';
    var sourceHeaderLeft=Number.isFinite(headRect.left)?headRect.left:tableRect.left;
    var sourceHeaderWidth=Math.max(1,headRect.width||tableRect.width);
    var offset=sourceHeaderLeft-visibleLeft;
    var existingClone=(fastScroll && currentPortalTable===table) ? portalInner.querySelector('table.dsc-sticky-clone-table') : null;
    if(existingClone){
      existingClone.style.setProperty('width',Math.round(sourceHeaderWidth)+'px','important');
      existingClone.style.setProperty('min-width',Math.round(sourceHeaderWidth)+'px','important');
      existingClone.style.setProperty('max-width',Math.round(sourceHeaderWidth)+'px','important');
      existingClone.style.setProperty('margin-left',Math.round(offset)+'px','important');
      portal.hidden=false;
      return;
    }
    portalInner.innerHTML='';
    var cloneTable=document.createElement('table');
    /* Keep the source table classes. Many workspace tables intentionally use
       table-specific alignment/typography rules. The sticky clone lives under
       <body>, outside those original scoped ancestors, so classes alone are not
       sufficient; measured/computed header geometry is mirrored below too. */
    cloneTable.className=(table.className||'')+' dsc-sticky-clone-table';
    cloneTable.classList.add('dsc-unified-table');
    cloneTable.setAttribute('data-dsc-sticky-clone-for',tableId(table));
    var cloneHead=table.tHead.cloneNode(true);
    qsa('[id]',cloneHead).forEach(function(node){node.removeAttribute('id');});
    cloneTable.appendChild(cloneHead);
    var sourceTableStyle=window.getComputedStyle(table);
    cloneTable.style.setProperty('width',Math.round(sourceHeaderWidth)+'px','important');
    cloneTable.style.setProperty('min-width',Math.round(sourceHeaderWidth)+'px','important');
    cloneTable.style.setProperty('max-width',Math.round(sourceHeaderWidth)+'px','important');
    cloneTable.style.setProperty('margin-left',Math.round(offset)+'px','important');
    cloneTable.style.setProperty('table-layout','fixed','important');
    cloneTable.style.setProperty('font-family',sourceTableStyle.fontFamily,'important');
    cloneTable.style.setProperty('font-size',sourceTableStyle.fontSize,'important');
    cloneTable.style.setProperty('color',sourceTableStyle.color,'important');
    portalInner.appendChild(cloneTable);

    function mirrorStyle(source,target,properties){
      if(!source||!target) return;
      var computed=window.getComputedStyle(source);
      properties.forEach(function(property){
        var value=computed.getPropertyValue(property);
        if(value) target.style.setProperty(property,value,'important');
      });
    }
    var cellVisualProperties=[
      'box-sizing','padding-top','padding-right','padding-bottom','padding-left',
      'border-top-width','border-top-style','border-top-color',
      'border-right-width','border-right-style','border-right-color',
      'border-bottom-width','border-bottom-style','border-bottom-color',
      'border-left-width','border-left-style','border-left-color',
      'background-color','background-image','color','font-family','font-size',
      'font-style','font-weight','line-height','letter-spacing','text-transform',
      'text-align','vertical-align','white-space','overflow-wrap','word-break'
    ];
    var descendantVisualProperties=[
      'box-sizing','display','align-items','justify-content','align-self','justify-self','gap',
      'grid-template-columns','grid-template-rows','grid-column','grid-row','column-gap','row-gap',
      'flex','flex-grow','flex-shrink','flex-basis','position','top','right','bottom','left','inset',
      'width','min-width','max-width','height','min-height',
      'max-height','margin-top','margin-right','margin-bottom','margin-left',
      'padding-top','padding-right','padding-bottom','padding-left','border-top-width',
      'border-top-style','border-top-color','border-right-width','border-right-style',
      'border-right-color','border-bottom-width','border-bottom-style','border-bottom-color',
      'border-left-width','border-left-style','border-left-color','border-radius',
      'background-color','color','font-family','font-size','font-style','font-weight',
      'line-height','letter-spacing','text-transform','text-align','white-space',
      'overflow','overflow-wrap','word-break'
    ];
    var originalRows=Array.prototype.slice.call(table.tHead.rows||[]);
    var cloneRows=Array.prototype.slice.call(cloneHead.rows||[]);
    originalRows.forEach(function(row,rowIndex){
      var cloneRow=cloneRows[rowIndex];
      if(!cloneRow) return;
      var rowRect=row.getBoundingClientRect();
      cloneRow.style.setProperty('height',Math.round(rowRect.height)+'px','important');
      Array.prototype.forEach.call(row.cells,function(th,cellIndex){
        var cloneTh=cloneRow.cells[cellIndex];
        if(!cloneTh) return;
        var rect=th.getBoundingClientRect();
        mirrorStyle(th,cloneTh,cellVisualProperties);
        cloneTh.style.setProperty('position','static','important');
        cloneTh.style.setProperty('top','auto','important');
        cloneTh.style.setProperty('z-index','auto','important');
        cloneTh.style.setProperty('width',Math.max(0,rect.width)+'px','important');
        cloneTh.style.setProperty('min-width',Math.max(0,rect.width)+'px','important');
        cloneTh.style.setProperty('max-width',Math.max(0,rect.width)+'px','important');
        cloneTh.style.setProperty('height',Math.max(0,rect.height)+'px','important');
        var sourceDesc=qsa('*',th),cloneDesc=qsa('*',cloneTh);
        sourceDesc.forEach(function(sourceNode,descIndex){
          if(cloneDesc[descIndex]) mirrorStyle(sourceNode,cloneDesc[descIndex],descendantVisualProperties);
        });
      });
    });
    portal.hidden=false;
    currentPortalTable=table;
    syncFilterButtons(table);
  }
  var stickyFastScroll=false;
  function updateStickyHeader(){
    raf=0;
    var fastScroll=stickyFastScroll;
    stickyFastScroll=false;
    var tables=visibleEnhancedTables();
    if(!tables.length){if(portal) portal.hidden=true;currentPortalTable=null;return;}
    var chosen=preferredActiveHost(tables);
    if(!chosen){if(portal) portal.hidden=true;currentPortalTable=null;return;}
    buildPortalHeader(chosen.current.table,chosen.host,chosen.tables,fastScroll);
  }
  function scheduleStickyUpdate(fastScroll){
    if(fastScroll) stickyFastScroll=true;
    if(raf) return;
    raf=window.requestAnimationFrame?window.requestAnimationFrame(updateStickyHeader):window.setTimeout(updateStickyHeader,16);
  }

  function tableTextMatrix(table){
    var headerRow=table.tHead&&table.tHead.rows.length?table.tHead.rows[table.tHead.rows.length-1]:null;
    var columns=[];
    if(headerRow){
      Array.prototype.forEach.call(headerRow.cells,function(th){
        if(th.hidden||window.getComputedStyle(th).display==='none') return;
        var index=Number(th.dataset.dscTableColumnIndex);
        if(!Number.isFinite(index)) index=headerLogicalIndex(headerRow,th);
        columns.push({index:index,label:th.dataset.dscTableColumnLabel||copyTextForCell(th)});
      });
    }else{
      var sample=allBodyRows(table).find(function(row){return row.cells&&row.cells.length&&!row.hidden&&window.getComputedStyle(row).display!=='none'&&!isSectionRow(row);});
      if(sample){
        var logical=0;
        Array.prototype.forEach.call(sample.cells,function(cell){
          if(cell.hidden||window.getComputedStyle(cell).display==='none'){logical+=Math.max(1,Number(cell.colSpan)||1);return;}
          columns.push({index:logical,label:''});
          logical+=Math.max(1,Number(cell.colSpan)||1);
        });
      }
    }
    var rows=[];
    allBodyRows(table).forEach(function(row){
      if(row.hidden||row.classList.contains('dsc-table-filter-hidden')||window.getComputedStyle(row).display==='none') return;
      if(isSectionRow(row)){
        var sectionLabel=copyTextForCell(row.cells&&row.cells[0]);
        if(sectionLabel){
          var sectionRow=new Array(columns.length).fill('');
          if(sectionRow.length) sectionRow[0]=sectionLabel;
          rows.push(sectionRow);
        }
        return;
      }
      rows.push(columns.map(function(column){return rowCellText(row,column.index);}));
    });
    return {headers:headerRow?columns.map(function(column){return column.label;}):[],rows:rows};
  }
  function showToast(message){
    var toast=document.getElementById('toast');if(!toast) return;
    toast.textContent=message;toast.classList.add('show');
    window.clearTimeout(showToast._timer);showToast._timer=window.setTimeout(function(){toast.classList.remove('show');},1800);
  }
  function tableCopyTitle(table,index,total){
    var info=localCopyScopeForTable(table);
    if(info&&info.header){
      var clone=info.header.cloneNode(true);
      qsa('.chev,.collapsible-heading-meta,[data-dsc-copy-group],[data-dsc-local-copy]',clone).forEach(function(node){node.remove();});
      var title=normalize(clone.textContent||'');
      if(title) return total>1&&info.scope.querySelectorAll('table.dsc-unified-table').length>1?title+' – Table '+String(index+1):title;
    }
    var label=normalize(table.getAttribute('aria-label')||table.getAttribute('data-title')||'');
    if(label) return label;
    var view=table.closest('.view');
    var heading=view&&view.querySelector('.section-title h1');
    var pageTitle=normalize(heading&&heading.textContent||'Table');
    return total>1?pageTitle+' – Table '+String(index+1):pageTitle;
  }
  function tableHtmlFromMatrix(matrix){
    var head=matrix.headers.length?'<thead><tr>'+matrix.headers.map(function(value){return '<th style="padding:6px 8px;border:1px solid #cbd5e1;background:#eef6fb;font-weight:700;text-align:left;">'+escapeHtml(value)+'</th>';}).join('')+'</tr></thead>':'';
    return '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:10pt;margin:0 0 14px;">'+head+'<tbody>'+matrix.rows.map(function(row){return '<tr>'+row.map(function(value){return '<td style="padding:6px 8px;border:1px solid #cbd5e1;vertical-align:top;">'+escapeHtml(value)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
  }
  function writeClipboard(text,html,message){
    if(navigator.clipboard&&window.ClipboardItem){
      try{
        var item=new ClipboardItem({'text/plain':new Blob([text],{type:'text/plain'}),'text/html':new Blob([html],{type:'text/html'})});
        navigator.clipboard.write([item]).then(function(){showToast(message);},function(){fallbackCopy(text,message);});
        return;
      }catch(_error){}
    }
    fallbackCopy(text,message);
  }
  function copyTables(tables){
    var unique=[],seen=new Set();
    (tables||[]).forEach(function(table){
      if(!table||!table.isConnected||seen.has(table)||!table.tBodies||!table.tBodies.length) return;
      seen.add(table);unique.push(table);
    });
    var blocks=[];
    unique.forEach(function(table,index){
      var matrix=tableTextMatrix(table);
      if(!matrix.headers.length&&!matrix.rows.length) return;
      blocks.push({title:tableCopyTitle(table,index,unique.length),matrix:matrix});
    });
    if(!blocks.length){showToast('Nothing to copy.');return;}
    var multiple=blocks.length>1;
    var text=blocks.map(function(block){
      var lines=(block.matrix.headers.length?[block.matrix.headers]:[]).concat(block.matrix.rows).map(function(row){return row.join('\t');}).join('\n');
      return multiple?block.title+'\n'+lines:lines;
    }).join('\n\n');
    var html=blocks.map(function(block){
      return (multiple?'<h3 style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 6px;">'+escapeHtml(block.title)+'</h3>':'')+tableHtmlFromMatrix(block.matrix);
    }).join('');
    writeClipboard(text,html,multiple?'All tables copied.':'Table copied.');
  }
  function copyTable(table){copyTables([table]);}
  function fallbackCopy(text,message){
    var area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
    try{document.execCommand('copy');showToast(message||'Copied.');}catch(_error){showToast('Copy failed.');}
    document.body.removeChild(area);
  }
  function tablesFromCopyButton(button){
    var ids=String(button&&button.getAttribute('data-dsc-copy-table-ids')||'').split(',').map(function(value){return value.trim();}).filter(Boolean);
    return ids.map(function(id){return document.querySelector('table[data-dsc-table-id="'+id+'"]');}).filter(Boolean);
  }
  function syncZoneTypeToolsCopyControl(){
    var body=document.getElementById('referenceBody'),controls=document.getElementById('referenceHeaderControls');
    if(!body||!controls) return;
    var ref=body.getAttribute('data-reference-id')||'';
    var isZoneTools=ref==='neo-zone-types'||ref==='new-powerseries-zone-types';
    var existing=controls.querySelector('[data-zone-types-table-copy]');
    if(!isZoneTools){if(existing) existing.remove();return;}
    if(!existing){
      existing=document.createElement('button');existing.type='button';existing.className='secondary compact-action-button';existing.setAttribute('data-zone-types-table-copy','');existing.textContent='Copy';existing.title='Copy the currently displayed Zone Types table';existing.setAttribute('aria-label','Copy Zone Types table');
      var settings=controls.querySelector('[data-zone-types-search-settings-toggle]');controls.insertBefore(existing,settings||null);
    }
    var shell=body.querySelector('[data-zone-types]');existing.hidden=!(shell&&shell.classList.contains('zone-view-table'));
  }
  function clearTableFilters(table){
    if(!table) return;
    var state=tableState(table);state.filters={};
    qsa('tbody tr.dsc-table-filter-hidden',table).forEach(function(row){row.classList.remove('dsc-table-filter-hidden');});
    syncFilterButtons(table);
  }

  document.addEventListener('click',function(event){
    var filterButton=event.target.closest&&event.target.closest('[data-dsc-table-filter-button]');
    if(filterButton){event.preventDefault();event.stopPropagation();openFilterPanel(filterButton);return;}
    var genericCopy=event.target.closest&&event.target.closest('[data-dsc-copy-group]');
    if(genericCopy){
      event.preventDefault();
      event.stopPropagation();
      copyTables(tablesFromCopyButton(genericCopy));
      return;
    }
    var copy=event.target.closest&&event.target.closest('[data-zone-types-table-copy]');
    if(copy){
      var body=document.getElementById('referenceBody'),table=body&&body.querySelector('.zone-types-table');
      if(table) copyTable(table);
      return;
    }
    var reset=event.target.closest&&event.target.closest('[data-zone-types-reset]');
    if(reset){
      var zoneTable=document.querySelector('#referenceBody .zone-types-table');if(zoneTable) clearTableFilters(zoneTable);
      return;
    }
    if(activeFilter&&activeFilter.panel&&!activeFilter.panel.contains(event.target)&&!event.target.closest('[data-dsc-table-filter-button]')) closeFilterPanel();
  },true);
  document.addEventListener('keydown',function(event){if(event.key==='Escape') closeFilterPanel();});
  document.addEventListener('scroll',function(event){
    if(activeFilter&&activeFilter.panel&&event.target&&activeFilter.panel.contains(event.target)) return;
    if(activeFilter) closeFilterPanel();
    scheduleStickyUpdate(true);
  },true);
  window.addEventListener('resize',function(){if(activeFilter) positionFilterPanel(activeFilter.panel,activeFilter.anchor);scheduleControlSync();},{passive:true});

  function init(){
    enhanceWithin(document);
    observer=new MutationObserver(function(mutations){
      var tablesToEnhance=new Set(),shouldSync=false,shouldSticky=false;
      function addTable(table){
        if(!table||!table.matches||table.closest('.dsc-sticky-table-header-portal')) return;
        tablesToEnhance.add(table);
      }
      mutations.forEach(function(mutation){
        var target=mutation.target;
        if(target&&target.closest&&target.closest('.dsc-sticky-table-header-portal')) return;
        if(mutation.type==='childList'){
          var ownerTable=target&&target.closest&&target.closest('table');
          if(ownerTable) addTable(ownerTable);
          Array.prototype.forEach.call(mutation.addedNodes||[],function(node){
            if(node.nodeType!==1) return;
            if(node.closest&&node.closest('.dsc-sticky-table-header-portal')) return;
            if(node.matches&&node.matches(TABLE_SELECTOR)) addTable(node);
            qsa(TABLE_SELECTOR,node).forEach(addTable);
            /* v625: Section Search appends its yellow result badge after table
               Copy controls are already positioned. Re-sync so Copy, native
               section/code count, and search-result count cannot overlap. */
            if((node.matches&&node.matches('.workspace-section-search-count-v607'))||
               (node.querySelector&&node.querySelector('.workspace-section-search-count-v607'))) shouldSync=true;
            if((node.matches&&node.matches('.program-info-sticky-header,.program-field-info'))||
               (node.querySelector&&node.querySelector('.program-info-sticky-header,.program-field-info'))) shouldSticky=true;
          });
          Array.prototype.forEach.call(mutation.removedNodes||[],function(node){
            if(node.nodeType!==1) return;
            if((node.matches&&node.matches('table,[data-dsc-local-copy],[data-dsc-view-copy],.workspace-section-search-count-v607'))||
               (node.querySelector&&node.querySelector('table,[data-dsc-local-copy],[data-dsc-view-copy],.workspace-section-search-count-v607'))) shouldSync=true;
          });
          if(tablesToEnhance.size) shouldSync=true;
        }
        if(mutation.type==='attributes'){
          if(target&&target.matches&&target.matches('.view,[data-zone-types],table,tbody,tr,th,.table-scroll,[data-collapsible-section-body],.collapsible-document-section,.program-field-info,.program-info-sticky-header')){
            shouldSync=true;
            shouldSticky=true;
            var table=target.closest&&target.closest('table.dsc-unified-table');
            if(table) reconcileHiddenColumnFilters(table);
          }
        }
      });
      tablesToEnhance.forEach(function(table){enhanceTable(table);});
      if(tablesToEnhance.size) shouldSticky=true;
      if(shouldSync) scheduleControlSync();
      else if(shouldSticky) scheduleStickyUpdate();
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});
    if(window.ResizeObserver){
      var ro=new ResizeObserver(scheduleStickyUpdate);ro.observe(document.documentElement);document._dscUnifiedTableResizeObserver=ro;
    }
    scheduleStickyUpdate();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
