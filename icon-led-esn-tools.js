(function(root){
  'use strict';

  var STORAGE_KEY='dsc-new-powerseries-icon-led-esn-tools-v4';
  var PREVIOUS_STORAGE_KEY='dsc-new-powerseries-icon-led-esn-tools-v3';
  var LEGACY_STORAGE_KEY='dsc-new-powerseries-icon-led-esn-tools-v2';
  var OLDEST_STORAGE_KEY='dsc-new-powerseries-icon-led-esn-tools-v1';
  var host=null;
  var header=null;

  var KEYPAD_MAP=[
    {lcd:'0',led:'-',note:'Blank'},
    {lcd:'1',led:'1'},
    {lcd:'2',led:'2'},
    {lcd:'3',led:'12'},
    {lcd:'4',led:'3'},
    {lcd:'5',led:'13'},
    {lcd:'6',led:'23'},
    {lcd:'7',led:'123'},
    {lcd:'8',led:'4'},
    {lcd:'9',led:'14'},
    {lcd:'A',led:'24'},
    {lcd:'B',led:'124'},
    {lcd:'C',led:'34'},
    {lcd:'D',led:'134'},
    {lcd:'E',led:'234'},
    {lcd:'F',led:'1234'}
  ];
  var LCD_TO_LED={};
  var LED_TO_LCD={};
  KEYPAD_MAP.forEach(function(item){LCD_TO_LED[item.lcd]=item.led;LED_TO_LCD[item.led]=item.lcd;});
  LED_TO_LCD['0']='0';

  function defaultState(){
    return {
      maxEntries:8,
      inputMode:'auto',
      entry:'',
      settingsOpen:false,
      activePanel:'converter',
      sectionVisible:{table:true,converter:true,esn:true},
      sectionExpanded:{table:false,converter:true,esn:true},
      copyMenu:null
    };
  }
  var state=defaultState();
  var copyResetTimer=null;

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function normalizeLedToken(token){
    token=String(token==null?'':token).trim();
    if(token==='-'||token==='0') return '-';
    if(!/^[1-4]+$/.test(token)) return '';
    var chars=token.split('').sort();
    for(var i=1;i<chars.length;i++) if(chars[i]===chars[i-1]) return '';
    return chars.join('');
  }
  function splitLedEntries(value){
    var raw=String(value==null?'':value).trim();
    if(!raw) return [];
    var tokens=[],buffer='';
    function flush(){if(buffer){tokens.push(buffer);buffer='';}}
    for(var i=0;i<raw.length;i++){
      var ch=raw.charAt(i);
      if(/[\s/,]/.test(ch)){flush();continue;}
      if(ch==='-'||ch==='0'){flush();tokens.push(ch);continue;}
      buffer+=ch;
    }
    flush();
    return tokens;
  }
  function convertLcdToLed(value,maxEntries){
    var raw=String(value==null?'':value).replace(/\s+/g,'').toUpperCase();
    var max=clamp(parseInt(maxEntries,10)||8,1,64);
    if(!raw) return {ok:true,source:'lcd',input:'',lcd:'',led:'',entries:[],error:''};
    if(raw.length>max) return {ok:false,source:'lcd',input:raw,lcd:'',led:'',entries:[],error:'Maximum '+max+' keypad digits. Change the limit in Settings to enter more.'};
    var entries=[];
    for(var i=0;i<raw.length;i++){
      var lcd=raw.charAt(i),led=LCD_TO_LED[lcd];
      if(!led) return {ok:false,source:'lcd',input:raw,lcd:'',led:'',entries:[],error:'LCD entry “'+lcd+'” is not in the 0–9 / A–F conversion table.'};
      entries.push({index:i+1,lcd:lcd,led:led});
    }
    return {ok:true,source:'lcd',input:raw,lcd:raw,led:entries.map(function(item){return item.led;}).join(' '),entries:entries,error:''};
  }
  function convertLedToLcd(value,maxEntries){
    var raw=String(value==null?'':value).trim();
    var max=clamp(parseInt(maxEntries,10)||8,1,64);
    if(!raw) return {ok:true,source:'led',input:'',lcd:'',led:'',entries:[],error:''};
    var tokens=splitLedEntries(raw);
    if(tokens.length>max) return {ok:false,source:'led',input:raw,lcd:'',led:'',entries:[],error:'Maximum '+max+' keypad digits. Change the limit in Settings to enter more.'};
    var entries=[];
    for(var i=0;i<tokens.length;i++){
      var normalized=normalizeLedToken(tokens[i]);
      var lcd=normalized&&LED_TO_LCD[normalized];
      if(!lcd) return {ok:false,source:'led',input:raw,lcd:'',led:'',entries:[],error:'ICON / LED entry “'+tokens[i]+'” is not in the conversion table. Separate entries with a space, /, or comma; use 0 or - for a blank digit.'};
      entries.push({index:i+1,lcd:lcd,led:normalized});
    }
    return {ok:true,source:'led',input:raw,lcd:entries.map(function(item){return item.lcd;}).join(''),led:entries.map(function(item){return item.led;}).join(' '),entries:entries,error:''};
  }
  function convertKeypadInput(value,mode,maxEntries){
    var raw=String(value==null?'':value),selected=mode==='lcd'||mode==='led'?mode:'auto';
    var source=selected;
    if(selected==='auto') source=/[\s/,]/.test(raw)||raw.indexOf('-')!==-1?'led':'lcd';
    return source==='led'?convertLedToLcd(raw,maxEntries):convertLcdToLed(raw,maxEntries);
  }

  function normalizeEsn(value){return String(value==null?'':value).trim().toUpperCase();}
  function sixToFiveEsn(six){
    six=normalizeEsn(six);
    if(!/^[0-9A-F]{6}$/.test(six)) return {ok:false,value:'',reason:'A 6-digit ESN must contain only hexadecimal characters 0–9 and A–F.'};
    if(!/^[0-9]/.test(six)) return {ok:false,value:'',reason:'The supplied 6→5 rule requires the first ESN character to be a decimal digit.'};
    var middle=parseInt(six.slice(1,4),16);
    if(!Number.isFinite(middle)) return {ok:false,value:'',reason:'Digits 2–4 could not be converted from hexadecimal.'};
    return {ok:true,value:six.charAt(0)+String(middle).padStart(4,'0'),reason:''};
  }
  function convertEsn(value){
    var raw=normalizeEsn(value);
    var out={ok:false,sourceLength:null,raw:raw,five:null,six:null,eight:null,fiveNote:'',sixNote:'',eightNote:'',message:''};
    if(!raw){out.message='No ESN entered.';return out;}
    if(/\s/.test(raw)){out.message='ESNs are entered as one continuous 5-, 6-, or 8-character value.';return out;}
    if(raw.length!==5&&raw.length!==6&&raw.length!==8){out.message='Enter a 5-, 6-, or 8-character ESN.';return out;}
    if(raw.length===5){
      if(!/^[0-9]{5}$/.test(raw)){out.message='A 5-digit ESN is decimal, so it can contain only 0–9.';return out;}
      out.ok=true;out.sourceLength=5;out.five=raw;out.six='0'+raw;out.eight='00'+out.six;
      out.fiveNote='Source value';out.sixNote='Add 0 in front';out.eightNote='Convert to 6 digits, then add 00 in front';
      return out;
    }
    if(raw.length===6){
      if(!/^[0-9A-F]{6}$/.test(raw)){out.message='A 6-digit ESN must contain only hexadecimal characters 0–9 and A–F.';return out;}
      var five=sixToFiveEsn(raw);
      out.ok=true;out.sourceLength=6;out.six=raw;out.eight='00'+raw;out.five=five.ok?five.value:null;
      out.sixNote='Source value';out.eightNote='Add 00 in front';out.fiveNote=five.ok?'Digits 2–4 hex → decimal, pad to 4 digits, then prefix digit 1':five.reason;
      return out;
    }
    if(!/^[0-9A-F]{8}$/.test(raw)){out.message='An 8-digit ESN can contain only hexadecimal characters 0–9 and A–F.';return out;}
    out.ok=true;out.sourceLength=8;out.eight=raw;out.eightNote='Source value';
    if(raw.slice(0,2)==='00'){
      out.six=raw.slice(2);out.sixNote='Remove the leading 00 to recover the 6-digit ESN';
      var fromEight=sixToFiveEsn(out.six);
      out.five=fromEight.ok?fromEight.value:null;
      out.fiveNote=fromEight.ok?'Derived from the recovered 6-digit ESN':fromEight.reason;
    }else{
      out.sixNote='Cannot convert this 8-digit ESN to 6 digits because it does not begin with 00.';
      out.fiveNote='Cannot convert this 8-digit ESN to 5 digits because it does not begin with 00.';
    }
    return out;
  }

  function readState(){
    state=defaultState();
    try{
      var currentRaw=root.localStorage.getItem(STORAGE_KEY);
      var raw=currentRaw||root.localStorage.getItem(PREVIOUS_STORAGE_KEY)||root.localStorage.getItem(LEGACY_STORAGE_KEY)||root.localStorage.getItem(OLDEST_STORAGE_KEY)||'null';
      var saved=JSON.parse(raw);
      if(saved&&typeof saved==='object'){
        if(Number.isFinite(Number(saved.maxEntries))) state.maxEntries=clamp(parseInt(saved.maxEntries,10)||8,1,64);
        if(saved.inputMode==='auto'||saved.inputMode==='lcd'||saved.inputMode==='led') state.inputMode=saved.inputMode;
        if(typeof saved.entry==='string') state.entry=saved.entry;
        else if(typeof saved.keypadInput==='string'&&saved.keypadInput) state.entry=saved.keypadInput;
        else if(typeof saved.esnInput==='string') state.entry=saved.esnInput;
        if(currentRaw){
          if(saved.activePanel==='table'||saved.activePanel==='converter'||saved.activePanel==='esn') state.activePanel=saved.activePanel;
          if(saved.sectionVisible&&typeof saved.sectionVisible==='object') ['table','converter','esn'].forEach(function(key){if(typeof saved.sectionVisible[key]==='boolean') state.sectionVisible[key]=saved.sectionVisible[key];});
          if(saved.sectionExpanded&&typeof saved.sectionExpanded==='object') ['table','converter','esn'].forEach(function(key){if(typeof saved.sectionExpanded[key]==='boolean') state.sectionExpanded[key]=saved.sectionExpanded[key];});
        }
      }
    }catch(_error){}
  }
  function saveState(){
    try{
      root.localStorage.setItem(STORAGE_KEY,JSON.stringify({
        maxEntries:state.maxEntries,
        inputMode:state.inputMode,
        entry:state.entry,
        activePanel:state.activePanel,
        sectionVisible:state.sectionVisible,
        sectionExpanded:state.sectionExpanded
      }));
    }catch(_error){}
  }
  function sectionIsVisible(id){return !state.sectionVisible||state.sectionVisible[id]!==false;}
  function setSectionVisible(id,value){
    if(!state.sectionVisible||typeof state.sectionVisible!=='object') state.sectionVisible={table:true,converter:true,esn:true};
    state.sectionVisible[id]=!!value;
  }
  function sectionIsExpanded(id){return !state.sectionExpanded||state.sectionExpanded[id]!==false;}
  function setSectionExpanded(id,value){
    if(!state.sectionExpanded||typeof state.sectionExpanded!=='object') state.sectionExpanded={table:false,converter:true,esn:true};
    state.sectionExpanded[id]=!!value;
  }

  function syncSectionExpandedDom(id,expanded){
    if(!host) return false;
    var panel=host.querySelector('[data-icon-led-tool-panel="'+id+'"]');
    if(!panel) return false;
    expanded=!!expanded;
    panel.classList.toggle('is-open',expanded);
    panel.classList.toggle('is-collapsed',!expanded);
    var toggle=panel.querySelector('[data-icon-led-section-toggle="'+id+'"]');
    var body=panel.querySelector('.icon-led-tool-panel-body');
    if(toggle){
      toggle.setAttribute('aria-expanded',expanded?'true':'false');
      toggle.setAttribute('aria-label',(expanded?'Collapse ':'Expand ')+sectionTitle(id));
      toggle.setAttribute('title',(expanded?'Collapse ':'Expand ')+sectionTitle(id));
    }
    if(body) body.hidden=!expanded;
    return !!toggle&&!!body;
  }

  function syncNavigationCurrent(id){
    if(!host) return;
    host.querySelectorAll('.reporting-tools-navigation-item').forEach(function(item){item.classList.toggle('current',!!item.querySelector('[data-icon-led-tool="'+id+'"]'));});
  }

  function sectionTitle(id){
    return id==='table'?'Keypad Conversion Table':id==='converter'?'LCD / ICON-LED Converter':'ESN Converter';
  }
  function renderNavigation(){
    var ids=['table','converter','esn'];
    return '<nav class="reporting-tools-navigation icon-led-tools-navigation" aria-label="ICON / LED Keypad and ESN Tools sections">'+ids.map(function(id){
      var visible=sectionIsVisible(id),current=state.activePanel===id;
      return '<div class="reporting-tools-navigation-item '+(visible?'active ':'')+(current?'current':'')+'">'+
        '<button type="button" class="reporting-tools-navigation-button '+(visible?'active':'')+'" data-icon-led-tool="'+id+'" aria-expanded="'+(visible?'true':'false')+'" title="Open and go to '+esc(sectionTitle(id))+'"><span class="reporting-tool-button-label"><strong>'+esc(sectionTitle(id))+'</strong></span></button>'+
        '<button type="button" class="reporting-tools-toggle-indicator '+(visible?'active':'')+'" data-icon-led-tool-toggle="'+id+'" aria-pressed="'+(visible?'true':'false')+'" aria-label="'+(visible?'Hide ':'Show ')+esc(sectionTitle(id))+'" title="'+(visible?'Hide ':'Show ')+esc(sectionTitle(id))+'">'+(visible?'−':'+')+'</button>'+
      '</div>';
    }).join('')+'</nav>';
  }
  function renderMainSectionBulkControls(){
    return '<div class="reporting-search-bulk-controls icon-led-main-section-bulk-controls" aria-label="Expand and collapse all visible tool sections">'+
      '<button type="button" class="secondary compact-action-button compact-icon-action" data-icon-led-sections="expand" aria-label="Expand all visible sections" title="Expand all visible sections"><span aria-hidden="true">＋</span></button>'+
      '<button type="button" class="secondary compact-action-button compact-icon-action" data-icon-led-sections="collapse" aria-label="Collapse all visible sections" title="Collapse all visible sections"><span aria-hidden="true">−</span></button>'+
    '</div>';
  }
  function renderTopBar(){
    var hasEntry=!!String(state.entry||'').length;
    return '<section class="card reporting-decoder-card reporting-decoder-search-card reporting-decoder-search-card-v373 icon-led-top-card">'+
      '<div class="reporting-decoder-search-row icon-led-top-row">'+
        '<div class="search reporting-decoder-search-field reporting-global-search-field icon-led-global-entry" role="search">'+
          '<input id="iconLedEsnGlobalEntry" data-icon-led-global-entry type="search" autocomplete="off" spellcheck="false" value="'+esc(state.entry)+'" placeholder="Enter LCD / ICON-LED value or a 5, 6, or 8 digit ESN" aria-label="LCD, ICON / LED, or ESN value">'+
          '<span class="workspace-search-input-actions reporting-search-input-actions">'+
            '<button type="button" class="workspace-search-clear reporting-search-clear '+(hasEntry?'is-visible':'')+'" data-icon-led-clear-entry aria-label="Clear entry" title="Clear" '+(hasEntry?'':'disabled')+'><span aria-hidden="true">×</span></button>'+
            '<button type="button" class="workspace-search-submit reporting-search-submit" data-icon-led-run-entry aria-label="Run conversion" title="Convert" '+(hasEntry?'':'disabled')+'><span aria-hidden="true">↵</span></button>'+
          '</span>'+
        '</div>'+
        '<div class="reporting-navigation-cluster icon-led-navigation-cluster">'+renderNavigation()+renderMainSectionBulkControls()+'</div>'+
      '</div>'+
    '</section>';
  }
  function renderSettings(){
    if(!state.settingsOpen) return '';
    return '<div class="icon-led-settings-panel card" data-icon-led-settings-panel role="dialog" aria-label="ICON / LED Keypad and ESN Tools settings">'+
      '<div class="icon-led-settings-row"><label for="iconLedMaxEntries"><strong>Maximum keypad digits</strong><small>Default is 8. The Keypad Digits Display Breakdown displays this many individual digits.</small></label><input id="iconLedMaxEntries" data-icon-led-max-entries type="number" min="1" max="64" step="1" value="'+state.maxEntries+'"></div>'+
    '</div>';
  }
  function renderConversionTable(){
    return '<div class="icon-led-conversion-table-wrap"><table class="icon-led-conversion-table"><thead><tr><th>LCD Keypad Display</th><th>ICON / LED Keypad Display</th></tr></thead><tbody>'+KEYPAD_MAP.map(function(item){return '<tr><td><code>'+esc(item.lcd)+'</code></td><td><code>'+esc(item.led)+'</code>'+(item.note?'<span class="icon-led-table-note">('+esc(item.note)+')</span>':'')+'</td></tr>';}).join('')+'</tbody></table></div>';
  }
  function keypadReferenceTablePayload(){
    var headers=['LCD Keypad Display','ICON / LED Keypad Display'];
    var rows=KEYPAD_MAP.map(function(item){return [item.lcd,item.led+(item.note?' ('+item.note+')':'')];});
    return {
      text:[headers.join('\t')].concat(rows.map(function(row){return row.join('\t');})).join('\n'),
      html:tableHtml(headers,rows)
    };
  }
  function renderSection(id,subtitle,body){
    if(!sectionIsVisible(id)) return '';
    var open=sectionIsExpanded(id);
    var head='<div class="icon-led-tool-panel-head icon-led-tool-panel-head-arrow">'+
      '<button type="button" class="icon-led-section-toggle-left" data-icon-led-section-toggle="'+id+'" aria-expanded="'+(open?'true':'false')+'" aria-label="'+(open?'Collapse':'Expand')+' '+esc(sectionTitle(id))+'" title="'+(open?'Collapse':'Expand')+' '+esc(sectionTitle(id))+'"><span aria-hidden="true">›</span></button>'+
      '<div class="icon-led-panel-heading-copy"><h2>'+esc(sectionTitle(id))+'</h2><p>'+esc(subtitle)+'</p></div>'+
      '<div class="icon-led-panel-head-actions">';
    if(id==='table'){
      head+='<button type="button" class="secondary compact-action-button icon-led-copy-results" data-icon-led-copy-reference-table title="Copy Keypad Conversion Table">Copy</button>';
    }else{
      head+='<div class="icon-led-copy-menu-wrap">'+
        '<button type="button" class="secondary compact-action-button icon-led-copy-results" data-icon-led-copy-menu="'+id+'" aria-expanded="'+(state.copyMenu===id?'true':'false')+'" title="Copy '+esc(sectionTitle(id))+' results">Copy <span class="icon-led-copy-caret" aria-hidden="true">▾</span></button>'+
        (state.copyMenu===id?'<div class="icon-led-copy-menu" role="menu" aria-label="Copy '+esc(sectionTitle(id))+'"><button type="button" role="menuitem" data-icon-led-copy-option="conversion" data-icon-led-copy-kind="'+id+'">Copy Conversion</button><button type="button" role="menuitem" data-icon-led-copy-option="table" data-icon-led-copy-kind="'+id+'">Copy Table</button><button type="button" role="menuitem" data-icon-led-copy-option="both" data-icon-led-copy-kind="'+id+'">Copy Both</button></div>':'')+
      '</div>';
    }
    head+='</div></div>';
    return '<section class="card icon-led-tool-panel '+(open?'is-open':'is-collapsed')+'" data-icon-led-tool-panel="'+id+'">'+head+
      '<div class="icon-led-tool-panel-body" '+(open?'':'hidden')+'>'+body+'</div>'+ 
    '</section>';
  }
  function renderModeToggle(){
    var options=[{id:'auto',label:'Auto'},{id:'lcd',label:'LCD'},{id:'led',label:'ICON / LED'}];
    return '<div class="icon-led-mode-control"><span>Keypad input format</span><div class="reporting-table-toggle-strip icon-led-mode-toggle" role="group" aria-label="Keypad input format">'+options.map(function(option){var active=state.inputMode===option.id;return '<button type="button" class="'+(active?'active':'')+'" data-icon-led-input-mode="'+option.id+'" aria-pressed="'+(active?'true':'false')+'">'+esc(option.label)+'</button>';}).join('')+'</div></div>';
  }
  function renderSlotRow(label,className,result,key){
    var byIndex={};
    if(result&&result.ok) result.entries.forEach(function(item){byIndex[item.index]=item;});
    var cells=[];
    for(var i=1;i<=state.maxEntries;i++){
      var item=byIndex[i],value=item?item[key]:'—',tone=((i-1)%8)+1;
      var editAttrs=item?' data-icon-led-edit-digit="'+key+'" data-icon-led-edit-index="'+i+'" role="button" tabindex="0" title="Click to edit Digit '+i+' as '+(key==='lcd'?'LCD':'ICON / LED')+'"':'';
      cells.push('<div class="icon-led-slot-cell digit-tone-'+tone+' '+(item?'has-value is-editable':'is-empty')+'"'+editAttrs+'><span>Digit '+i+'</span><strong>'+esc(value)+'</strong></div>');
    }
    var sourceKey=result&&result.source==='led'?'led':'lcd';
    var isSource=!!(result&&result.ok&&result.entries.length&&key===sourceKey);
    return '<div class="icon-led-slot-row '+className+' '+(isSource?'is-entered-source':'')+'"><div class="icon-led-slot-row-label"><strong>'+esc(label)+'</strong>'+(isSource?'<b class="icon-led-keypad-source-badge">Entered</b>':'')+'</div>'+cells.join('')+'</div>';
  }
  function renderBreakdown(result){
    if(!result.ok) return '<div class="icon-led-message is-error" role="status"><strong>Cannot convert</strong><span>'+esc(result.error)+'</span></div>';
    var count=result.entries.length;
    return '<div class="icon-led-conversion-results">'+
      '<div class="icon-led-breakdown-head"><strong>Keypad Digits Display Breakdown</strong><span>'+count+' / '+state.maxEntries+' digits used</span></div>'+
      '<div class="icon-led-slot-breakdown-wrap"><div class="icon-led-slot-breakdown" style="--icon-led-slot-count:'+state.maxEntries+'">'+
        renderSlotRow('LCD','is-lcd',result,'lcd')+
        renderSlotRow('ICON / LED','is-led',result,'led')+
      '</div></div>'+
    '</div>';
  }
  function renderConverter(){
    var result=convertKeypadInput(state.entry,state.inputMode,state.maxEntries);
    var detected=result.source==='led'?'ICON / LED':'LCD';
    var hasEntry=!!String(state.entry||'').trim();
    return '<div class="icon-led-converter">'+
      '<div class="icon-led-converter-toolbar">'+renderModeToggle()+'<span class="icon-led-detected-badge '+(hasEntry?'is-detected':'')+'">'+(hasEntry?'Entered as '+detected:'Waiting for the entry above')+'</span></div>'+
      '<p class="icon-led-input-help">Separate digits with a <strong>space</strong>, <strong>"/"</strong>, or <strong>","</strong>. Enter zero as <strong>"0"</strong> or <strong>"-"</strong>.</p>'+ 
      renderBreakdown(result)+
    '</div>';
  }
  function renderEsnOutputCard(length,value,note,sourceLength){
    var isSource=sourceLength===length;
    return '<article class="esn-length-'+length+' '+(isSource?'is-source ':'')+(value?'has-value':'is-unavailable')+'"><div class="icon-led-esn-card-heading"><span>'+length+'-digit ESN</span>'+(isSource?'<b class="icon-led-esn-source-badge">Entered</b>':'')+'</div><strong>'+esc(value||'—')+'</strong><small>'+esc(note||'No conversion available')+'</small></article>';
  }
  function renderEsnReference(){
    return '<div class="icon-led-esn-reference">'+
      '<div class="icon-led-esn-format-reference">'+
        '<article class="esn-length-5"><strong>5-digit decimal ESN</strong><span>Older 900 MHz wireless devices.</span></article>'+
        '<article class="esn-length-6"><strong>6-digit hexadecimal ESN</strong><span>Newer 900 MHz devices and all 433 MHz one-way wireless devices.</span></article>'+
        '<article class="esn-length-8"><strong>8-digit ESN</strong><span>All two-way wireless devices.</span></article>'+
      '</div>'+
      '<div class="icon-led-esn-rule-grid">'+
        '<article><h3>5 → 6 digits</h3><p>For a 5-digit ESN on a modern panel that asks for 6 digits, add <code>0</code> in front.</p><p class="icon-led-esn-example"><code>23459</code> → <strong><code>023459</code></strong></p></article>'+
        '<article><h3>6 → 5 digits</h3><p>For older equipment that asks for 5 digits (PC5010 V1.0 or PC5132 V2.0 and lower), convert digits 2–4 from hex to decimal, pad that result to four decimal digits, then place digit 1 in front.</p><p class="icon-led-esn-example"><code>2B398C</code>: <code>B39</code> hex = <code>2873</code> → <strong><code>22873</code></strong></p><p class="icon-led-esn-example"><code>21425B</code>: <code>142</code> hex = <code>322</code> → <code>0322</code> → <strong><code>20322</code></strong></p></article>'+
        '<article><h3>6 → 8 digits</h3><p>When a TR5164 two-way wireless transceiver requires an 8-digit ESN for a one-way device, add <code>00</code> in front of the 6-digit ESN.</p><p class="icon-led-esn-example"><code>2B398C</code> → <strong><code>002B398C</code></strong></p></article>'+
      '</div>'+
    '</div>';
  }
  function resolveEsnInput(value,mode,maxEntries){
    var raw=normalizeEsn(value);
    var direct=convertEsn(raw);
    var keypad=convertKeypadInput(value,mode,maxEntries);
    var hasKeypadSeparators=/[\s/,-]/.test(String(value==null?'':value));
    if(direct.ok&&!hasKeypadSeparators) return {result:direct,candidate:raw,basis:'direct',keypad:keypad};
    if(keypad.ok&&keypad.lcd&&(keypad.lcd.length===5||keypad.lcd.length===6||keypad.lcd.length===8)){
      var fromKeypad=convertEsn(keypad.lcd);
      if(fromKeypad.ok){
        if(fromKeypad.sourceLength===5) fromKeypad.fiveNote='Source value from keypad LCD conversion';
        if(fromKeypad.sourceLength===6) fromKeypad.sixNote='Source value from keypad LCD conversion';
        if(fromKeypad.sourceLength===8) fromKeypad.eightNote='Source value from keypad LCD conversion';
        return {result:fromKeypad,candidate:keypad.lcd,basis:'keypad',keypad:keypad};
      }
      return {result:fromKeypad,candidate:keypad.lcd,basis:'keypad-invalid',keypad:keypad};
    }
    return {result:direct,candidate:raw,basis:'direct-invalid',keypad:keypad};
  }
  function keypadConversionText(){
    var result=convertKeypadInput(state.entry,state.inputMode,state.maxEntries);
    if(!result.ok) return 'Cannot convert: '+result.error;
    var lcd=result.lcd||'—';
    var led=result.entries.length?result.entries.map(function(item){return item.led;}).join('/'):'—';
    if(result.source==='led'){
      return 'Entered ICON/LED Digits: '+led+'\nConverted LCD Digits: '+lcd;
    }
    return 'Entered LCD Digits: '+lcd+'\nConverted ICON/LED Digits: '+led;
  }
  function tableHtml(headers,rows){
    var cellStyle='border:1px solid #8a94a6;padding:6px 9px;text-align:center;vertical-align:middle;';
    var headStyle=cellStyle+'font-weight:700;background:#eef3f8;';
    return '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:10pt;">'+
      '<thead><tr>'+headers.map(function(value){return '<th style="'+headStyle+'">'+esc(value)+'</th>';}).join('')+'</tr></thead>'+
      '<tbody>'+rows.map(function(row){return '<tr>'+row.map(function(value,index){return '<'+(index===0?'th':'td')+' style="'+(index===0?headStyle:cellStyle)+'">'+esc(value)+'</'+(index===0?'th':'td')+'>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
  }
  function keypadTablePayload(){
    var result=convertKeypadInput(state.entry,state.inputMode,state.maxEntries);
    if(!result.ok){
      var error='Keypad Digits Display Breakdown\nCannot convert: '+result.error;
      return {text:error,html:'<p>'+esc(error).replace(/\n/g,'<br>')+'</p>'};
    }
    var headers=['Display'];
    for(var i=1;i<=state.maxEntries;i++) headers.push('Digit '+i);
    var lcdLabel='LCD'+(result.source==='lcd'?' (Entered)':'');
    var ledLabel='ICON / LED'+(result.source==='led'?' (Entered)':'');
    var lcdRow=[lcdLabel],ledRow=[ledLabel],byIndex={};
    result.entries.forEach(function(item){byIndex[item.index]=item;});
    for(var j=1;j<=state.maxEntries;j++){
      var item=byIndex[j];
      lcdRow.push(item?item.lcd:'—');
      ledRow.push(item?item.led:'—');
    }
    var rows=[lcdRow,ledRow];
    return {text:[headers.join('\t'),lcdRow.join('\t'),ledRow.join('\t')].join('\n'),html:tableHtml(headers,rows)};
  }
  function keypadTableText(){return keypadTablePayload().text;}
  function linesHtml(text){return '<div style="font-family:Arial,sans-serif;font-size:10pt;">'+String(text||'').split('\n').map(function(line){return '<div>'+esc(line)+'</div>';}).join('')+'</div>';}
  function keypadCopyPayload(mode){
    mode=mode||'both';
    var conversion=keypadConversionText(),table=keypadTablePayload();
    if(mode==='conversion') return {text:conversion,html:linesHtml(conversion)};
    if(mode==='table') return table;
    return {text:conversion+'\n\n'+table.text,html:linesHtml(conversion)+'<div style="height:8px"></div>'+table.html};
  }
  function keypadResultsText(mode){return keypadCopyPayload(mode).text;}
  function esnConversionText(){
    var resolved=resolveEsnInput(state.entry,state.inputMode,state.maxEntries),result=resolved.result;
    if(!result.ok) return 'No valid 5-, 6-, or 8-digit ESN detected.'+(result.message?'\n'+result.message:'');
    var lines=[];
    var sourceValue=result.sourceLength===5?result.five:result.sourceLength===6?result.six:result.eight;
    lines.push((resolved.basis==='keypad'?'Detected ':'Entered ')+result.sourceLength+'-digit ESN: '+sourceValue);
    [5,6,8].forEach(function(length){
      if(length===result.sourceLength) return;
      var value=length===5?result.five:length===6?result.six:result.eight;
      if(value) lines.push('Converted '+length+'-digit ESN: '+value);
    });
    return lines.join('\n');
  }
  function esnTablePayload(){
    var resolved=resolveEsnInput(state.entry,state.inputMode,state.maxEntries),result=resolved.result;
    if(!result.ok){
      var error='ESN Conversion Table\nNo valid 5-, 6-, or 8-digit ESN detected.'+(result.message?'\n'+result.message:'');
      return {text:error,html:'<p>'+esc(error).replace(/\n/g,'<br>')+'</p>'};
    }
    var headers=['ESN Format','Value','Status'],rows=[];
    [5,6,8].forEach(function(length){
      var value=length===5?result.five:length===6?result.six:result.eight;
      var status=length===result.sourceLength?(resolved.basis==='keypad'?'Detected from keypad':'Entered'):(value?'Converted':'Unavailable');
      rows.push([length+'-digit ESN',value||'—',status]);
    });
    return {text:[headers.join('\t')].concat(rows.map(function(row){return row.join('\t');})).join('\n'),html:tableHtml(headers,rows)};
  }
  function esnTableText(){return esnTablePayload().text;}
  function esnCopyPayload(mode){
    mode=mode||'both';
    var conversion=esnConversionText(),table=esnTablePayload();
    if(mode==='conversion') return {text:conversion,html:linesHtml(conversion)};
    if(mode==='table') return table;
    return {text:conversion+'\n\n'+table.text,html:linesHtml(conversion)+'<div style="height:8px"></div>'+table.html};
  }
  function esnResultsText(mode){return esnCopyPayload(mode).text;}
  function copyPayload(payload,button){
    payload=typeof payload==='string'?{text:payload}:payload||{text:''};
    function markCopied(){
      if(!button) return;
      var previous=button.textContent;
      button.textContent='Copied';
      button.classList.add('is-copied');
      if(copyResetTimer&&root.clearTimeout) root.clearTimeout(copyResetTimer);
      if(root.setTimeout) copyResetTimer=root.setTimeout(function(){if(button&&button.isConnected){button.textContent=previous;button.classList.remove('is-copied');}},1200);
    }
    if(payload.html&&root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.write==='function'&&root.ClipboardItem&&root.Blob){
      try{
        var item=new root.ClipboardItem({
          'text/plain':new root.Blob([payload.text||''],{type:'text/plain'}),
          'text/html':new root.Blob([payload.html],{type:'text/html'})
        });
        root.navigator.clipboard.write([item]).then(markCopied).catch(function(){fallbackCopyHtml(payload.html,payload.text,markCopied);});
        return;
      }catch(_error){}
    }
    if(payload.html){fallbackCopyHtml(payload.html,payload.text,markCopied);return;}
    if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==='function'){
      root.navigator.clipboard.writeText(payload.text||'').then(markCopied).catch(function(){fallbackCopyText(payload.text||'',markCopied);});
      return;
    }
    fallbackCopyText(payload.text||'',markCopied);
  }
  function fallbackCopyHtml(html,text,onSuccess){
    if(!root.document){fallbackCopyText(text||'',onSuccess);return;}
    var holder=root.document.createElement('div');
    holder.contentEditable='true';holder.innerHTML=html;
    holder.style.position='fixed';holder.style.left='-10000px';holder.style.top='0';holder.style.opacity='0';holder.style.pointerEvents='none';
    root.document.body.appendChild(holder);
    var range=root.document.createRange(),selection=root.getSelection&&root.getSelection();
    range.selectNodeContents(holder);
    if(selection){selection.removeAllRanges();selection.addRange(range);}
    var ok=false;try{ok=!!root.document.execCommand('copy');}catch(_error){}
    if(selection)selection.removeAllRanges();
    root.document.body.removeChild(holder);
    if(ok){if(onSuccess)onSuccess();return;}
    fallbackCopyText(text||'',onSuccess);
  }
  function fallbackCopyText(text,onSuccess){
    if(!root.document) return;
    var area=root.document.createElement('textarea');
    area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';area.style.pointerEvents='none';
    root.document.body.appendChild(area);area.select();
    var ok=false;try{ok=!!root.document.execCommand('copy');}catch(_error){}
    root.document.body.removeChild(area);if(ok&&onSuccess)onSuccess();
  }

  function beginDigitEdit(cell){
    if(!cell||!root.document||cell.querySelector('.icon-led-slot-edit')) return;
    var key=cell.getAttribute('data-icon-led-edit-digit');
    var index=parseInt(cell.getAttribute('data-icon-led-edit-index'),10);
    var result=convertKeypadInput(state.entry,state.inputMode,state.maxEntries);
    if(!result.ok||!index||index<1||index>result.entries.length) return;
    var item=result.entries[index-1],strong=cell.querySelector('strong');
    if(!item||!strong) return;
    var input=root.document.createElement('input');
    input.type='text';input.className='icon-led-slot-edit';input.autocomplete='off';input.spellcheck=false;
    input.maxLength=key==='lcd'?1:4;input.value=key==='lcd'?item.lcd:item.led;
    strong.style.display='none';cell.appendChild(input);input.focus();input.select();
    var finished=false;
    function restore(){if(finished)return;finished=true;if(input.parentNode)input.parentNode.removeChild(input);strong.style.display='';}
    function commit(){
      if(finished) return;
      var raw=String(input.value||'').trim().toUpperCase(),normalized='';
      if(key==='lcd'){
        if(!/^[0-9A-F]$/.test(raw)){input.classList.add('is-invalid');input.focus();input.select();return;}
        normalized=raw;
      }else{
        normalized=normalizeLedToken(raw);
        if(!normalized){input.classList.add('is-invalid');input.focus();input.select();return;}
      }
      finished=true;
      var values=result.entries.map(function(entry){return key==='lcd'?entry.lcd:entry.led;});
      values[index-1]=normalized;
      state.inputMode=key==='lcd'?'lcd':'led';
      state.entry=key==='lcd'?values.join(''):values.join('/');
      saveState();render();
    }
    input.addEventListener('keydown',function(event){
      if(event.key==='Enter'){event.preventDefault();commit();}
      else if(event.key==='Escape'){event.preventDefault();restore();}
    });
    input.addEventListener('blur',function(){commit();});
  }

  function renderEsn(){
    var resolved=resolveEsnInput(state.entry,state.inputMode,state.maxEntries);
    var result=resolved.result;
    var raw=normalizeEsn(state.entry);
    var candidate=normalizeEsn(resolved.candidate);
    var status=!raw?'Waiting for the entry above':result.ok?(result.sourceLength+'-digit ESN detected'+(resolved.basis==='keypad'?' from keypad conversion':'')):'Not a valid ESN entry';
    var message='';
    if(raw&&!result.ok){
      var keypadIsOtherLength=resolved.keypad&&resolved.keypad.ok&&resolved.keypad.lcd&&resolved.keypad.lcd.length!==5&&resolved.keypad.lcd.length!==6&&resolved.keypad.lcd.length!==8;
      if(keypadIsOtherLength) status='No 5-, 6-, or 8-digit ESN detected';
      else message='<div class="icon-led-message is-error" role="status"><strong>ESN conversion unavailable</strong><span>'+esc(result.message)+'</span></div>';
    }
    return '<div class="icon-led-esn-converter">'+
      '<div class="icon-led-esn-status-row"><span class="icon-led-detected-badge '+(result.ok?'is-detected':'')+'">'+esc(status)+'</span></div>'+message+
      '<div class="icon-led-esn-output-grid">'+
        renderEsnOutputCard(5,result.five,result.fiveNote,result.sourceLength)+
        renderEsnOutputCard(6,result.six,result.sixNote,result.sourceLength)+
        renderEsnOutputCard(8,result.eight,result.eightNote,result.sourceLength)+
      '</div>'+renderEsnReference()+
    '</div>';
  }
  function render(){
    if(!host) return;
    host.innerHTML='<div class="icon-led-esn-tools">'+renderSettings()+'<div class="icon-led-tools-sticky-stack">'+renderTopBar()+'</div>'+
      renderSection('table','Reference mapping between regular LCD characters and ICON / LED keypad display segments.',renderConversionTable())+
      renderSection('converter','Use the single entry above to convert LCD and ICON / LED keypad values. Each configured digit is shown separately.',renderConverter())+
      renderSection('esn','Use the same entry above to convert 5-, 6-, and 8-digit ESN formats.',renderEsn())+
    '</div>';
    syncHeader();
    if(state.settingsOpen&&root.dscPositionFloatingSettings){
      var trigger=header&&header.querySelector('[data-icon-led-settings-toggle]');
      var panel=host.querySelector('[data-icon-led-settings-panel]');
      if(trigger&&panel){
        var position=function(){root.dscPositionFloatingSettings(trigger,panel,{width:460,maxHeight:420});};
        if(root.requestAnimationFrame) root.requestAnimationFrame(position); else position();
      }
    }
  }
  function syncHeader(){
    if(!header) return;
    header.innerHTML='<button type="button" class="secondary compact-action-button tool-header-reset-button" data-icon-led-reset aria-label="Reset ICON / LED Keypad and ESN Tools" title="Reset ICON / LED Keypad and ESN Tools">Reset</button><button type="button" class="secondary compact-action-button compact-icon-action icon-led-settings-button '+(state.settingsOpen?'active':'')+'" data-icon-led-settings-toggle aria-pressed="'+(state.settingsOpen?'true':'false')+'" aria-label="Settings" title="Settings"><span aria-hidden="true">⚙</span></button>';
  }
  function scrollToSection(id){
    var panel=host&&host.querySelector('[data-icon-led-tool-panel="'+id+'"]');
    if(!panel) return;
    var sticky=host.querySelector('.icon-led-tools-sticky-stack');
    var offset=(sticky?sticky.getBoundingClientRect().height:76)+8;
    var view=host;
    var scrollable=false;
    if(root.getComputedStyle){
      var overflow=root.getComputedStyle(view).overflowY||'';
      scrollable=/(auto|scroll)/.test(overflow)&&view.scrollHeight>view.clientHeight+1;
    }
    if(!scrollable) view=host.closest('.view.active');
    if(view&&root.getComputedStyle){
      var viewOverflow=root.getComputedStyle(view).overflowY||'';
      scrollable=/(auto|scroll)/.test(viewOverflow)&&view.scrollHeight>view.clientHeight+1;
    }
    if(scrollable&&view){
      var vr=view.getBoundingClientRect(),pr=panel.getBoundingClientRect(),target=Math.max(0,view.scrollTop+(pr.top-vr.top)-offset);
      try{view.scrollTo({top:target,behavior:'smooth'});}catch(_error){view.scrollTop=target;}
    }else{
      var y=(root.pageYOffset||0)+panel.getBoundingClientRect().top-offset;
      try{root.scrollTo({top:Math.max(0,y),behavior:'smooth'});}catch(_error){root.scrollTo(0,Math.max(0,y));}
    }
  }
  function scheduleSectionNavigation(id){
    var fn=function(){scrollToSection(id);};
    if(root.requestAnimationFrame) root.requestAnimationFrame(function(){root.requestAnimationFrame(fn);});
    else if(root.setTimeout) root.setTimeout(fn,0); else fn();
  }
  function rerenderWithEntryFocus(start,end){
    render();
    var input=host&&host.querySelector('[data-icon-led-global-entry]');
    if(input){input.focus();try{input.setSelectionRange(start==null?input.value.length:start,end==null?(start==null?input.value.length:start):end);}catch(_error){}}
  }
  function onClick(event){
    if(event.target&&event.target.closest&&event.target.closest('.icon-led-slot-edit')) return;
    var target=event.target.closest?event.target.closest('[data-icon-led-reset],[data-icon-led-settings-toggle],[data-icon-led-tool],[data-icon-led-tool-toggle],[data-icon-led-sections],[data-icon-led-section-toggle],[data-icon-led-input-mode],[data-icon-led-clear-entry],[data-icon-led-run-entry],[data-icon-led-copy-menu],[data-icon-led-copy-option],[data-icon-led-copy-reference-table],[data-icon-led-edit-digit]'):null;
    if(!target) return;
    event.preventDefault();
    event.stopPropagation();
    if(target.hasAttribute('data-icon-led-copy-reference-table')){
      copyPayload(keypadReferenceTablePayload(),target);
      return;
    }
    if(target.hasAttribute('data-icon-led-copy-menu')){
      var menuKind=target.getAttribute('data-icon-led-copy-menu');
      state.copyMenu=state.copyMenu===menuKind?null:menuKind;
      render();
      return;
    }
    if(target.hasAttribute('data-icon-led-copy-option')){
      var copyMode=target.getAttribute('data-icon-led-copy-option');
      var copyKind=target.getAttribute('data-icon-led-copy-kind');
      copyPayload(copyKind==='esn'?esnCopyPayload(copyMode):keypadCopyPayload(copyMode),target);
      return;
    }
    if(target.hasAttribute('data-icon-led-edit-digit')){beginDigitEdit(target);return;}
    if(target.hasAttribute('data-icon-led-reset')){
      try{root.localStorage.removeItem(STORAGE_KEY);root.localStorage.removeItem(PREVIOUS_STORAGE_KEY);root.localStorage.removeItem(LEGACY_STORAGE_KEY);root.localStorage.removeItem(OLDEST_STORAGE_KEY);}catch(_error){}
      if(state.settingsOpen){var oldPanel=host&&host.querySelector('[data-icon-led-settings-panel]');if(oldPanel&&root.dscClearFloatingSettingsPosition)root.dscClearFloatingSettingsPosition(oldPanel);}
      state=defaultState();saveState();render();var resetInput=host&&host.querySelector('[data-icon-led-global-entry]');if(resetInput)resetInput.focus();return;
    }
    if(target.hasAttribute('data-icon-led-settings-toggle')){
      if(state.settingsOpen){var settings=host&&host.querySelector('[data-icon-led-settings-panel]');if(settings&&root.dscClearFloatingSettingsPosition)root.dscClearFloatingSettingsPosition(settings);}
      state.settingsOpen=!state.settingsOpen;render();return;
    }
    if(target.hasAttribute('data-icon-led-tool')){
      var tool=target.getAttribute('data-icon-led-tool'),wasVisible=sectionIsVisible(tool),wasExpanded=sectionIsExpanded(tool);
      setSectionVisible(tool,true);setSectionExpanded(tool,true);state.activePanel=tool;saveState();
      if(!wasVisible||!wasExpanded) render(); else host.querySelectorAll('.reporting-tools-navigation-item').forEach(function(item){item.classList.toggle('current',!!item.querySelector('[data-icon-led-tool="'+tool+'"]'));});
      scheduleSectionNavigation(tool);return;
    }
    if(target.hasAttribute('data-icon-led-tool-toggle')){
      var navId=target.getAttribute('data-icon-led-tool-toggle');
      var willShow=!sectionIsVisible(navId);
      setSectionVisible(navId,willShow);
      if(willShow) setSectionExpanded(navId,true);
      state.activePanel=navId;saveState();render();if(willShow)scheduleSectionNavigation(navId);return;
    }
    if(target.hasAttribute('data-icon-led-section-toggle')){
      var sectionId=target.getAttribute('data-icon-led-section-toggle');
      var willExpand=!sectionIsExpanded(sectionId);
      setSectionExpanded(sectionId,willExpand);state.activePanel=sectionId;saveState();
      if(!syncSectionExpandedDom(sectionId,willExpand)) render(); else syncNavigationCurrent(sectionId);
      if(willExpand)scheduleSectionNavigation(sectionId);return;
    }
    if(target.hasAttribute('data-icon-led-sections')){
      var expand=target.getAttribute('data-icon-led-sections')==='expand',bulkSyncOk=true;
      ['table','converter','esn'].forEach(function(id){if(sectionIsVisible(id)){setSectionExpanded(id,expand);if(!syncSectionExpandedDom(id,expand))bulkSyncOk=false;}});
      saveState();if(!bulkSyncOk)render();return;
    }
    if(target.hasAttribute('data-icon-led-input-mode')){
      state.inputMode=target.getAttribute('data-icon-led-input-mode');saveState();render();return;
    }
    if(target.hasAttribute('data-icon-led-clear-entry')){state.entry='';saveState();rerenderWithEntryFocus();return;}
    if(target.hasAttribute('data-icon-led-run-entry')){saveState();rerenderWithEntryFocus();return;}
  }
  function onInput(event){
    var target=event.target;
    if(target&&target.hasAttribute('data-icon-led-global-entry')){
      var start=typeof target.selectionStart==='number'?target.selectionStart:target.value.length,end=typeof target.selectionEnd==='number'?target.selectionEnd:start;
      state.entry=target.value;saveState();rerenderWithEntryFocus(start,end);return;
    }
  }
  function onChange(event){
    var target=event.target;
    if(!target||!target.hasAttribute('data-icon-led-max-entries')) return;
    state.maxEntries=clamp(parseInt(target.value,10)||8,1,64);saveState();render();
  }
  function onKeyDown(event){
    var target=event.target;
    if((event.key==='Enter'||event.key===' ')&&target&&target.hasAttribute&&target.hasAttribute('data-icon-led-edit-digit')){
      event.preventDefault();beginDigitEdit(target);return;
    }
    if(event.key!=='Enter'||!target||!target.hasAttribute('data-icon-led-global-entry')) return;
    event.preventDefault();saveState();rerenderWithEntryFocus();
  }
  function onDocumentClick(event){
    if(!event.target||!event.target.closest) return;
    var changed=false;
    if(state.copyMenu&&!event.target.closest('.icon-led-copy-menu-wrap')){state.copyMenu=null;changed=true;}
    if(state.settingsOpen&&!event.target.closest('[data-icon-led-settings-panel]')&&!event.target.closest('[data-icon-led-settings-toggle]')){
      var panel=host&&host.querySelector('[data-icon-led-settings-panel]');
      if(panel&&root.dscClearFloatingSettingsPosition) root.dscClearFloatingSettingsPosition(panel);
      state.settingsOpen=false;changed=true;
    }
    if(changed) render();
  }
  function init(){
    host=root.document&&root.document.getElementById('newPowerSeriesIconLedEsnTools');
    header=root.document&&root.document.getElementById('newPowerSeriesIconLedEsnHeaderControls');
    if(!host||!header) return;
    readState();render();
    host.addEventListener('click',onClick);
    header.addEventListener('click',onClick);
    host.addEventListener('input',onInput);
    host.addEventListener('change',onChange);
    host.addEventListener('keydown',onKeyDown);
    root.document.addEventListener('click',onDocumentClick);
  }

  root.DSC_ICON_LED_ESN_ENGINE={
    keypadMap:KEYPAD_MAP.map(function(item){return {lcd:item.lcd,led:item.led,note:item.note||''};}),
    splitLedEntries:splitLedEntries,
    normalizeLedToken:normalizeLedToken,
    convertLcdToLed:convertLcdToLed,
    convertLedToLcd:convertLedToLcd,
    convertKeypadInput:convertKeypadInput,
    sixToFiveEsn:sixToFiveEsn,
    convertEsn:convertEsn,
    resolveEsnInput:resolveEsnInput,
    keypadConversionText:keypadConversionText,
    keypadReferenceTablePayload:keypadReferenceTablePayload,
    keypadTableText:keypadTableText,
    keypadResultsText:keypadResultsText,
    keypadTablePayload:keypadTablePayload,
    keypadCopyPayload:keypadCopyPayload,
    esnConversionText:esnConversionText,
    esnTableText:esnTableText,
    esnResultsText:esnResultsText,
    esnTablePayload:esnTablePayload,
    esnCopyPayload:esnCopyPayload
  };

  if(root&&root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);else init();}
})(typeof window!=='undefined'?window:this);
