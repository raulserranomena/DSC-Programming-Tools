(function(root,factory){
  'use strict';
  var api=factory(root||{});
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.DSCReportingCodeDecoder=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  var STORAGE_KEY='dsc-neo-reporting-code-decoder-v17';
  /* v458: unified title-header Settings and Zone-Types-style sticky filters below search. */
  var LEGACY_STORAGE_KEY='dsc-neo-reporting-code-decoder-v16';
  var OLDER_STORAGE_KEY='dsc-neo-reporting-code-decoder-v15';
  var ANCIENT_STORAGE_KEY='dsc-neo-reporting-code-decoder-v13';
  var OLDEST_STORAGE_KEY='dsc-neo-reporting-code-decoder-v12';
  var DEFAULT_SIGNAL_MATCH_FIELDS={account:false,status:true,eventId:true,reportingCode:true,partition:false,identifier:true};
  var DEFAULT_TEXT_SEARCH_COLUMNS={section:true,definition:true,description:true,category:true,severity:true,direction:true,contactId:true,sia:true};
  function defaultReportingState(){
    return {query:'',draftQuery:'',showDescription:true,showCategory:true,showSeverity:true,showDirection:true,showContactId:true,showSia:true,metadataSource:'sia',contactIdZeroDisplay:true,contactIdQualifierDisplay:'er',settingsOpen:false,searchSettingsOpen:false,showFilters:true,showColumns:false,columnsOpen:false,reportingTypeColors:true,viewMode:'list',reportingTypeColumns:1,resultCategory:'all',resultsOnly:true,liveSearch:true,filterField:'all',filters:{reportingType:[],description:[],category:[],severity:[],direction:[]},signalMatchFields:Object.assign({},DEFAULT_SIGNAL_MATCH_FIELDS),textSearchColumns:Object.assign({},DEFAULT_TEXT_SEARCH_COLUMNS),expandedRows:{},breakdownOpen:false,structureVisible:false,completeTableOpen:true,activePanel:'table',tableSectionsOpen:false,sectionOpen:{},sectionExpanded:{structure:true,breakdown:false,table:true}};
  }
  var state=defaultReportingState();
  var host=null;
  var stickyResizeObserver=null;
  var cachedIndex=null;
  var cachedRegularQuery=null;
  var cachedRegularRows=null;
  var cachedKnownSiaPrefixes=null;
  var cachedReferenceMatchKey=null;
  var cachedReferenceMatchSet=null;
  var cachedTextPrefixIndex=null;
  var semanticSegmentCache=Object.create(null);

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function regexEscape(value){return String(value==null?'':value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  function commonPrefixLength(a,b){
    a=String(a==null?'':a);b=String(b==null?'':b);
    var n=Math.min(a.length,b.length),i=0;
    while(i<n&&a.charAt(i)===b.charAt(i)) i++;
    return i;
  }
  function highlightPlainText(value,query){
    var raw=String(value==null?'':value),tokens=tokenizeText(query);
    if(!raw||!tokens.length) return esc(raw);
    var spans=[],wordRe=/[A-Za-z0-9]+/g,match;
    while((match=wordRe.exec(raw))){
      var word=match[0],best=null;
      tokens.forEach(function(token){
        if(!token) return;
        var hit=textWordMatchRange(word,token,true);
        if(hit&&(!best||hit.quality>best.quality||(hit.quality===best.quality&&hit.length>best.length))) best=hit;
      });
      if(best&&best.length>0) spans.push({start:match.index+best.start,end:match.index+best.start+best.length});
    }
    if(!spans.length) return esc(raw);
    var out='',last=0;
    spans.forEach(function(span){
      if(span.start<last) return;
      out+=esc(raw.slice(last,span.start))+'<mark class="dsc-search-hit reporting-search-hit">'+esc(raw.slice(span.start,span.end))+'</mark>';
      last=span.end;
    });
    return out+esc(raw.slice(last));
  }
  function normalizedCodeWithMap(value,format){
    var raw=String(value==null?'':value),normalized='',map=[];
    for(var i=0;i<raw.length;i++){
      var ch=raw.charAt(i).toUpperCase();
      if(!/[A-Z0-9]/.test(ch)) continue;
      if(format==='contact-id'&&ch==='A') ch='0';
      normalized+=ch;map.push(i);
    }
    return {raw:raw,normalized:normalized,map:map};
  }
  function highlightContactIdRangeMatch(value,query){
    var descriptor=parseContactIdCodeListInput(query);
    if(!descriptor||!descriptor.eventId||!descriptor.reportingCode) return null;
    var raw=String(value==null?'':value),pieces=raw.split(/(\s+\/\s+)/),found=false;
    var html=pieces.map(function(piece){
      if(/^\s+\/\s+$/.test(piece)) return esc(piece);
      var trimmed=piece.trim(),part=cidTemplateParts(trimmed);
      if(!part||!part.eventId||!part.reportingCode) return esc(piece);
      if(descriptor.eventId&&normalizeContactIdCode(part.eventId)!==normalizeContactIdCode(descriptor.eventId)) return esc(piece);
      if(descriptor.reportingCode&&normalizeContactIdCode(part.reportingCode)!==normalizeContactIdCode(descriptor.reportingCode)) return esc(piece);
      if(descriptor.status&&part.status&&descriptor.status!==part.status) return esc(piece);
      if(descriptor.range&&descriptor.range.start){
        if(!identifierQueryMatchesRange(part.range,descriptor.range)) return esc(piece);
      }
      found=true;
      var lead=piece.slice(0,piece.indexOf(trimmed)),trail=piece.slice(piece.indexOf(trimmed)+trimmed.length);
      /* Highlight only the Contact ID fields the user actually matched. A
         parent range such as E(3)AA-001-016 must not highlight 001-016 when
         the search is only E300. If an expanded individual row is an exact
         identifier match, include that identifier in the highlight. */
      var prefixMatch=trimmed.match(/^([ER])(\s*\(?\s*)([0-9A-F])(\s*\)?\s*)([0-9A-F]{2})(.*)$/i);
      if(!prefixMatch) return esc(lead)+esc(trimmed)+esc(trail);
      var useStatus=!!descriptor.status;
      var useEvent=!!descriptor.eventId;
      var useReport=!!descriptor.reportingCode;
      var useIdentifier=descriptor.range&&descriptor.range.start&&!descriptor.range.partial&&part.range&&!part.range.end&&String(part.range.start)===String(descriptor.range.start);
      if(useStatus&&useEvent&&useReport){
        var hitText=prefixMatch[1]+prefixMatch[2]+prefixMatch[3]+prefixMatch[4]+prefixMatch[5];
        if(useIdentifier){var suffixMatch=prefixMatch[6].match(/^\s*-\s*([0-9A-FZUX]{3,4})/i);if(suffixMatch) hitText+=suffixMatch[0];}
        return esc(lead)+'<mark class="dsc-search-hit reporting-search-hit">'+esc(hitText)+'</mark>'+esc(trimmed.slice(hitText.length))+esc(trail);
      }
      function markPart(text,on){return on?'<mark class="dsc-search-hit reporting-search-hit">'+esc(text)+'</mark>':esc(text);}
      var suffixHtml=esc(prefixMatch[6]);
      if(useIdentifier){
        var sm=prefixMatch[6].match(/^(\s*-\s*)([0-9A-FZUX]{3,4})(.*)$/i);
        if(sm) suffixHtml=esc(sm[1])+'<mark class="dsc-search-hit reporting-search-hit">'+esc(sm[2])+'</mark>'+esc(sm[3]);
      }
      return esc(lead)+markPart(prefixMatch[1],useStatus)+esc(prefixMatch[2])+markPart(prefixMatch[3],useEvent)+esc(prefixMatch[4])+markPart(prefixMatch[5],useReport)+suffixHtml+esc(trail);
    }).join('');
    return found?{found:true,html:html}:null;
  }
  function highlightCodeEquivalent(value,query,format){
    if(format==='contact-id'){
      var rangedHit=highlightContactIdRangeMatch(value,query);
      if(rangedHit) return rangedHit;
    }
    var target=normalizedCodeWithMap(value,format),lookup=codeLookupValue(query,format);
    var q=format==='contact-id'?normalizeContactIdCode(lookup):normalizeCode(lookup);
    if(!target.raw||!q) return {found:false,html:esc(target.raw)};
    var ranges=[],from=0,index;
    while((index=target.normalized.indexOf(q,from))>=0){
      var start=target.map[index],end=target.map[index+q.length-1]+1;
      if(start!=null&&end!=null) ranges.push([start,end]);
      from=index+Math.max(1,q.length);
    }
    if(!ranges.length&&format==='contact-id'&&/^[0-9A-F]{3}$/.test(normalizeCode(query))){
      q=normalizeContactIdCode(query);from=0;
      while((index=target.normalized.indexOf(q,from))>=0){
        var s0=target.map[index],e0=target.map[index+q.length-1]+1;
        if(s0!=null&&e0!=null) ranges.push([s0,e0]);
        from=index+Math.max(1,q.length);
      }
    }
    if(!ranges.length){
      var prefixLength=commonPrefixLength(target.normalized,q);
      if(prefixLength>=3&&target.map[prefixLength-1]!=null) ranges.push([target.map[0],target.map[prefixLength-1]+1]);
    }
    if(!ranges.length) return {found:false,html:esc(target.raw)};
    ranges.sort(function(a,b){return a[0]-b[0];});
    var merged=[];
    ranges.forEach(function(range){
      var last=merged[merged.length-1];
      if(last&&range[0]<=last[1]) last[1]=Math.max(last[1],range[1]);
      else merged.push(range.slice());
    });
    var out='',cursor=0;
    merged.forEach(function(range){
      out+=esc(target.raw.slice(cursor,range[0]));
      out+='<mark class="dsc-search-hit reporting-search-hit">'+esc(target.raw.slice(range[0],range[1]))+'</mark>';
      cursor=range[1];
    });
    out+=esc(target.raw.slice(cursor));
    return {found:true,html:out};
  }
  function highlightTableValue(value,query,kind,detection){
    if(!String(query||'').trim()) return esc(value);
    detection=detection||detectQueryType(query);
    /* Once the query has been identified as a reporting format, only apply
       code-equivalent highlighting to that format. A Contact ID fragment such
       as E4 must not be reinterpreted as a partial SIA code (E...) in the SIA
       column, and vice versa. */
    if(kind==='cid'&&(!detection.format||detection.format==='contact-id')){
      var cidHit=highlightCodeEquivalent(value,query,'contact-id');
      if(cidHit.found) return cidHit.html;
    }
    if(kind==='sia'&&(!detection.format||detection.format==='sia')){
      var siaHit=highlightCodeEquivalent(value,query,'sia');
      if(siaHit.found) return siaHit.html;
    }
    return highlightPlainText(value,query);
  }
  function readState(){
    try{
      var raw=root.localStorage?root.localStorage.getItem(STORAGE_KEY):'';
      var migrated=false;
      if(!raw && root.localStorage){raw=root.localStorage.getItem(LEGACY_STORAGE_KEY)||root.localStorage.getItem(OLDER_STORAGE_KEY)||root.localStorage.getItem(ANCIENT_STORAGE_KEY)||root.localStorage.getItem(OLDEST_STORAGE_KEY)||'';migrated=!!raw;}
      if(!raw) return;
      var parsed=JSON.parse(raw);
      if(!parsed||typeof parsed!=='object') return;
      if(!migrated){
        state.query=String(parsed.query||'');
        state.draftQuery=String(parsed.draftQuery!=null?parsed.draftQuery:parsed.query||'');
      }
      if(typeof parsed.showDescription==='boolean') state.showDescription=parsed.showDescription;
      if(typeof parsed.showCategory==='boolean') state.showCategory=parsed.showCategory;
      if(typeof parsed.showSeverity==='boolean') state.showSeverity=parsed.showSeverity;
      if(typeof parsed.showDirection==='boolean') state.showDirection=parsed.showDirection;
      if(typeof parsed.showContactId==='boolean') state.showContactId=parsed.showContactId;
      if(typeof parsed.showSia==='boolean') state.showSia=parsed.showSia;
      if(parsed.metadataSource==='cid'||parsed.metadataSource==='sia') state.metadataSource=parsed.metadataSource;
      if(typeof parsed.contactIdZeroDisplay==='boolean') state.contactIdZeroDisplay=parsed.contactIdZeroDisplay;
      if(parsed.contactIdQualifierDisplay==='er'||parsed.contactIdQualifierDisplay==='13') state.contactIdQualifierDisplay=parsed.contactIdQualifierDisplay;
      if(typeof parsed.settingsOpen==='boolean') state.settingsOpen=parsed.settingsOpen;
      if(typeof parsed.searchSettingsOpen==='boolean') state.searchSettingsOpen=parsed.searchSettingsOpen;
      if(typeof parsed.showFilters==='boolean') state.showFilters=parsed.showFilters;
      if(typeof parsed.showColumns==='boolean') state.showColumns=parsed.showColumns;
      if(typeof parsed.reportingTypeColors==='boolean') state.reportingTypeColors=parsed.reportingTypeColors;
      if(parsed.viewMode==='list'||parsed.viewMode==='table') state.viewMode=parsed.viewMode;
      if(Number.isFinite(Number(parsed.reportingTypeColumns))) state.reportingTypeColumns=Math.max(1,Math.min(4,Number(parsed.reportingTypeColumns)||1));
      if(parsed.resultCategory) state.resultCategory=String(parsed.resultCategory||'all');
      if(typeof parsed.resultsOnly==='boolean') state.resultsOnly=parsed.resultsOnly;
      if(typeof parsed.liveSearch==='boolean') state.liveSearch=parsed.liveSearch;
      if(parsed.signalMatchFields&&typeof parsed.signalMatchFields==='object'){
        Object.keys(DEFAULT_SIGNAL_MATCH_FIELDS).forEach(function(key){if(typeof parsed.signalMatchFields[key]==='boolean') state.signalMatchFields[key]=parsed.signalMatchFields[key];});
      }
      if(parsed.textSearchColumns&&typeof parsed.textSearchColumns==='object'){
        Object.keys(DEFAULT_TEXT_SEARCH_COLUMNS).forEach(function(key){if(typeof parsed.textSearchColumns[key]==='boolean') state.textSearchColumns[key]=parsed.textSearchColumns[key];});
      }
      if(['all','reportingType','description','category','severity','direction'].indexOf(parsed.filterField)>=0) state.filterField=parsed.filterField;
      if(parsed.filters&&typeof parsed.filters==='object'){
        ['reportingType','description','category','severity','direction'].forEach(function(key){
          if(Array.isArray(parsed.filters[key])) state.filters[key]=parsed.filters[key].map(function(value){return String(value);}).filter(Boolean);
        });
      }
      if(!migrated&&typeof parsed.breakdownOpen==='boolean') state.breakdownOpen=parsed.breakdownOpen;
      if(typeof parsed.structureVisible==='boolean') state.structureVisible=parsed.structureVisible;
      if(['structure','breakdown','table'].indexOf(parsed.activePanel)>=0) state.activePanel=parsed.activePanel;
      if(!migrated&&typeof parsed.completeTableOpen==='boolean') state.completeTableOpen=parsed.completeTableOpen;
      if(!migrated&&typeof parsed.tableSectionsOpen==='boolean') state.tableSectionsOpen=parsed.tableSectionsOpen;
      if(!migrated&&parsed.sectionOpen&&typeof parsed.sectionOpen==='object') state.sectionOpen=parsed.sectionOpen;
      if(parsed.sectionExpanded&&typeof parsed.sectionExpanded==='object'){
        ['structure','breakdown','table'].forEach(function(key){if(typeof parsed.sectionExpanded[key]==='boolean') state.sectionExpanded[key]=parsed.sectionExpanded[key];});
      }
      if(migrated){
        /* v382 adopts the new decoder defaults on upgrade while retaining
           display-column preferences and other non-default UI choices. */
        state.query='';state.draftQuery='';state.resultCategory='all';state.resultsOnly=true;state.liveSearch=true;
        state.metadataSource='sia';state.contactIdZeroDisplay=true;state.contactIdQualifierDisplay='er';state.settingsOpen=false;state.searchSettingsOpen=false;state.showFilters=true;state.showColumns=false;state.columnsOpen=false;state.reportingTypeColors=true;state.viewMode='list';state.reportingTypeColumns=1;state.filterField='all';state.filters={reportingType:[],description:[],category:[],severity:[],direction:[]};
        state.breakdownOpen=false;state.completeTableOpen=true;state.tableSectionsOpen=false;state.sectionOpen={};state.sectionExpanded={structure:true,breakdown:false,table:true};
        saveState();
      }
    }catch(err){}
  }
  function saveState(){
    try{if(root.localStorage) root.localStorage.setItem(STORAGE_KEY,JSON.stringify({query:state.query,draftQuery:state.draftQuery,showDescription:state.showDescription,showCategory:state.showCategory,showSeverity:state.showSeverity,showDirection:state.showDirection,showContactId:state.showContactId,showSia:state.showSia,metadataSource:state.metadataSource,contactIdZeroDisplay:state.contactIdZeroDisplay,contactIdQualifierDisplay:state.contactIdQualifierDisplay,settingsOpen:state.settingsOpen,searchSettingsOpen:state.searchSettingsOpen,showFilters:state.showFilters,showColumns:state.showColumns,reportingTypeColors:state.reportingTypeColors,viewMode:state.viewMode,reportingTypeColumns:state.reportingTypeColumns,resultCategory:state.resultCategory,resultsOnly:state.resultsOnly,liveSearch:state.liveSearch,signalMatchFields:state.signalMatchFields,textSearchColumns:state.textSearchColumns,filterField:state.filterField,filters:state.filters,breakdownOpen:state.breakdownOpen,structureVisible:state.structureVisible,completeTableOpen:state.completeTableOpen,activePanel:state.activePanel,tableSectionsOpen:state.tableSectionsOpen,sectionOpen:state.sectionOpen,sectionExpanded:state.sectionExpanded}));}catch(err){}
  }
  function normalizeText(value){
    var text=String(value==null?'':value).toLowerCase();
    try{text=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(err){}
    return text.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function tokenizeText(value){var text=normalizeText(value);return text?text.split(' ').filter(Boolean):[];}
  function semanticWordSegmentsNormalized(word){
    word=String(word||'');
    if(!word) return [];
    if(semanticSegmentCache[word]) return semanticSegmentCache[word];
    var matches=word.match(/[a-z]+|[0-9]+/g)||[word],out=[],offset=0;
    matches.forEach(function(part){
      var index=word.indexOf(part,offset);
      if(index<0) index=0;
      out.push({text:part,start:index});
      offset=index+part.length;
    });
    semanticSegmentCache[word]=out;
    return out;
  }
  function normalizedWordMatchRange(normalized,token,allowFuzzy){
    normalized=String(normalized||'');token=String(token||'');
    if(!normalized||!token) return null;
    if(normalized===token) return {start:0,length:token.length,quality:4};
    if(normalized.indexOf(token)===0) return {start:0,length:token.length,quality:3};
    var segments=semanticWordSegmentsNormalized(normalized),best=null;
    for(var i=0;i<segments.length;i++){
      var segment=segments[i],hit=null;
      if(segment.text===token) hit={start:segment.start,length:token.length,quality:4};
      else if(segment.text.indexOf(token)===0) hit={start:segment.start,length:token.length,quality:3};
      if(hit&&(!best||hit.quality>best.quality||hit.length>best.length)) best=hit;
    }
    if(best||allowFuzzy===false||token.length<4) return best;
    var required=token.length>=5?token.length-1:3;
    function consider(text,start){
      var prefix=commonPrefixLength(token,text);
      if(prefix>=required){var hit={start:start,length:prefix,quality:2};if(!best||hit.length>best.length)best=hit;}
    }
    consider(normalized,0);
    for(var j=0;j<segments.length;j++) consider(segments[j].text,segments[j].start);
    return best;
  }
  function textWordMatchRange(word,queryToken,allowFuzzy){
    var normalized=normalizeText(word).replace(/\s+/g,''),token=normalizeText(queryToken).replace(/\s+/g,'');
    return normalizedWordMatchRange(normalized,token,allowFuzzy);
  }
  function addTokenPrefixes(index,token){
    token=String(token||'');
    if(!token) return;
    for(var i=1;i<=token.length;i++) index[token.slice(0,i)]=true;
  }
  function prefixIndexForTokens(tokens){
    var index=Object.create(null);
    (tokens||[]).forEach(function(token){
      addTokenPrefixes(index,token);
      semanticWordSegmentsNormalized(token).forEach(function(segment){addTokenPrefixes(index,segment.text);});
    });
    return index;
  }
  function normalizedDirectionQuery(value){
    var key=String(value==null?'':value).toUpperCase().replace(/\s+/g,'');
    return ({'A/R':'A/R','T/R':'T/R','O/C':'O/C','MA/R':'MA/R','T':'T'})[key]||'';
  }
  function looksLikeProgrammingSectionQuery(value){
    return /^\s*\[\d{3}\](?:\s*>\s*\[\d{3}\])?\s*$/.test(String(value==null?'':value));
  }
  function normalizeCode(value){return String(value==null?'':value).toUpperCase().replace(/[^A-Z0-9]/g,'');}
  function normalizeContactIdCode(value){return normalizeCode(value).replace(/A/g,'0');}
  function normalizeContactIdQuery(value){
    var raw=String(value==null?'':value).trim(),clean=normalizeCode(raw);
    /* A transmitted Contact ID signal may contain the protocol's numeric
       event/restoral qualifier (1 = E, 3 = R) after the 4- or 6-digit account.
       Normalize that form before applying the compact-code rules below. */
    var signalPrefix=contactIdSignalPrefix(raw);
    if(signalPrefix) return signalPrefix.accountRaw+signalPrefix.status+signalPrefix.body;
    var qualifierMatch=raw.match(/^\s*([13])(?=\s|[\/_\-(])/);
    if(qualifierMatch){
      var qualifier=qualifierMatch[1]==='1'?'E':'R';
      var rest=raw.slice(qualifierMatch[0].length).replace(/^[\s\/_-]+/,'');
      return qualifier+normalizeCode(rest);
    }
    /* Contact ID transmits the event/restoral qualifier as 1/3. Accept the
       same qualifier in compact reporting-code input: 13AA == E(3)AA and
       33AA == R(3)AA. Keep three-character values such as 130 as bare event
       codes; a numeric E/R qualifier is only inferred when another complete
       three-character Contact ID event code follows it. */
    if(/^[13][0-9A-F]{3,8}$/.test(clean)) return (clean.charAt(0)==='1'?'E':'R')+clean.slice(1);
    return clean;
  }
  function decodeTransmittedZero(value){return String(value==null?'':value).toUpperCase().replace(/A/g,'0');}
  function numericSignalDigits(value){var text=decodeTransmittedZero(value);return /^\d+$/.test(text)?text:'';}
  function splitPair(value){
    var text=String(value==null?'':value).trim();
    if(!text) return [];
    /* Some NEO SIA pairs are printed without spaces around '/', e.g.
       TS-UUUU/TE-UUUU and YX/YZ-ZZZZ. Split those only when every segment
       looks like a reporting-code template so prose such as Alarm/Restore is
       never broken apart accidentally. */
    var compact=text.split(/\s*\/\s*/).map(function(part){return String(part||'').trim();}).filter(Boolean);
    if(compact.length>1&&compact.every(function(part){return /^(?:[ER]\s*\(?\s*[0-9A-F]|[A-Z]{2}(?:-|$))/i.test(part);})) return compact;
    var parts=text.split(/\s+\/\s+/).map(function(part){return String(part||'').trim();}).filter(Boolean);
    return parts.length?parts:[text];
  }
  function codeVariants(value,format){
    return splitPair(value).map(function(part){return {raw:part,normalized:normalizeCode(part),relaxed:format==='contact-id'?normalizeContactIdCode(part):normalizeCode(part)};});
  }
  function templatePattern(template,format){
    var raw=String(template==null?'':template).trim();
    var lastDash=raw.lastIndexOf('-');
    var normalize=format==='contact-id'?normalizeContactIdCode:normalizeCode;
    if(lastDash>=0){
      var suffix=normalizeCode(raw.slice(lastDash+1));
      if(/^[ZUX]+$/.test(suffix)) return {prefix:normalize(raw.slice(0,lastDash)),wildcardLength:suffix.length,normalized:normalize(raw)};
    }
    return {prefix:normalize(raw),wildcardLength:0,normalized:normalize(raw)};
  }
  function templateMatches(template,query,format){
    var pattern=templatePattern(template,format);
    var q=format==='contact-id'?normalizeContactIdCode(query):normalizeCode(query);
    if(!pattern.prefix||!q) return false;
    if(pattern.normalized.indexOf(q)===0) return true;
    if(pattern.wildcardLength&&q.length===pattern.prefix.length+pattern.wildcardLength&&q.indexOf(pattern.prefix)===0) return true;
    return false;
  }
  /* AddView Contact ID Event Code Table metadata, keyed by the three-digit
     Contact ID event code (Event ID + two-character reporting code, with A=0).
     Description, category, and severity are lookup metadata only; they do not participate in
     DSC signal reconstruction. Values not present/verified in the standard
     AddView table intentionally remain unmapped rather than being inferred. */
  var CONTACT_ID_EVENT_METADATA={
    '100':{description:'Medical Alarm',category:'Medical',severity:'HIGH'},
    '101':{description:'Emergency Alarm',category:'PanicEmergency',severity:'HIGH'},
    '102':{description:'Fail to Report',category:'Medical',severity:'LOW'},
    '110':{description:'Fire Alarm',category:'Fire',severity:'HIGH'},
    '111':{description:'Smoke',category:'Fire',severity:'HIGH'},
    '113':{description:'Water Flow',category:'Environmental',severity:'MEDIUM'},
    '120':{description:'Panic Alarm',category:'PanicEmergency',severity:'HIGH'},
    '121':{description:'Duress',category:'PanicEmergency',severity:'HIGH'},
    '122':{description:'Silent Panic',category:'PanicEmergency',severity:'HIGH'},
    '130':{description:'Burglary',category:'Intrusion',severity:'HIGH'},
    '139':{description:'Intrusion Verifier',category:'Intrusion',severity:'HIGH'},
    '140':{description:'General Alarm',category:'Intrusion',severity:'MEDIUM'},
    '143':{description:'Expansion Module Failure',category:'Technical',severity:'MEDIUM'},
    '146':{description:'Silent Burglary',category:'Intrusion',severity:'HIGH'},
    '150':{description:'24 Hour Non-Burglary',category:'Intrusion',severity:'MEDIUM'},
    '151':{description:'Gas Detection',category:'Environmental',severity:'HIGH'},
    '154':{description:'Water Leakage',category:'Environmental',severity:'MEDIUM'},
    '158':{description:'High Temperature',category:'Environmental',severity:'LOW'},
    '159':{description:'Low Temperature',category:'Environmental',severity:'HIGH'},
    '162':{description:'Carbon Monoxide',category:'Environmental',severity:'LOW'},
    '200':{description:'Fire Supervisory',category:'Fire',severity:'MEDIUM'},
    '300':{description:'System Trouble',category:'Technical',severity:'LOW'},
    '301':{description:'AC Loss',category:'Technical',severity:'MEDIUM'},
    '302':{description:'Low System Battery',category:'Technical',severity:'MEDIUM'},
    '311':{description:'Battery Missing/Dead',category:'Technical',severity:'LOW'},
    '312':{description:'Power Supply Overcurrent',category:'Technical',severity:'LOW'},
    '321':{description:'Bell 1 Trouble',category:'Technical',severity:'LOW'},
    '330':{description:'System Peripheral Trouble',category:'Technical',severity:'LOW'},
    '341':{description:'Expansion Module Tamper',category:'Technical',severity:'LOW'},
    '350':{description:'Communication Trouble',category:'Technical',severity:'LOW'},
    '351':{description:'Telco Line 1 Fault',category:'Technical',severity:'MEDIUM'},
    '354':{description:'Failure to Communicate',category:'Technical',severity:'LOW'},
    '373':{description:'Fire Trouble',category:'Fire',severity:'MEDIUM'},
    '374':{description:'Exit Error Alarm',category:'Technical',severity:'LOW'},
    '378':{description:'Cross-Zone Trouble',category:'Technical',severity:'LOW'},
    '380':{description:'Sensor Trouble',category:'Technical',severity:'LOW'},
    '383':{description:'Sensor Tamper',category:'Technical',severity:'MEDIUM'},
    '384':{description:'RF Low Battery',category:'Technical',severity:'LOW'},
    '389':{description:'Sensor Self-Test Failure',category:'Technical',severity:'LOW'},
    '400':{description:'Open/Close',category:'ArmDisarm',severity:'SILENT'},
    '401':{description:'Open/Close by User',category:'ArmDisarm',severity:'SILENT'},
    '403':{description:'Automatic Open/Close',category:'ArmDisarm',severity:'SILENT'},
    '406':{description:'Cancel by User',category:'ArmDisarm',severity:'SILENT'},
    '409':{description:'Keyswitch Open/Close',category:'ArmDisarm',severity:'SILENT'},
    '411':{description:'Callback Request Made',category:'Technical',severity:'INFO'},
    '412':{description:'Successful Download/Access',category:'DoorAccess',severity:'INFO'},
    '453':{description:'Failed to Open',category:'ArmDisarm',severity:'INFO'},
    '454':{description:'Failed to Close',category:'ArmDisarm',severity:'SILENT'},
    '456':{description:'Partial Arm',category:'ArmDisarm',severity:'SILENT'},
    '458':{description:'User on Premises',category:'Unclassified',severity:'INFO'},
    '459':{description:'Recent Close',category:'ArmDisarm',severity:'SILENT'},
    '461':{description:'Wrong Code Entry',category:'ArmDisarm',severity:'SILENT'},
    '464':{description:'Auto-Arm Time Extended',category:'ArmDisarm',severity:'SILENT'},
    '570':{description:'Bypass',category:'Intrusion',severity:'MEDIUM'},
    '601':{description:'Manual Trigger Test',category:'Technical',severity:'INFO'},
    '602':{description:'Periodic Test',category:'Technical',severity:'INFO'},
    '607':{description:'Walk Test Mode',category:'Technical',severity:'INFO'},
    '608':{description:'Periodic Test - System Trouble Present',category:'Technical',severity:'INFO'},
    '622':{description:'Event Log 50% Full',category:'Technical',severity:'INFO'},
    '627':{description:'Program Mode Entry',category:'Technical',severity:'INFO'},
    '628':{description:'Program Mode Exit',category:'Technical',severity:'INFO'},
    '654':{description:'System Inactivity',category:'Technical',severity:'INFO'}
  };
  function contactIdBaseEventCodes(value){
    var codes=[];
    splitPair(value).forEach(function(part){
      var parsed=cidTemplateParts(part);
      if(!parsed||!parsed.eventId||!parsed.reportingCode) return;
      var code=normalizeContactIdCode(parsed.eventId+parsed.reportingCode);
      if(/^\d{3}$/.test(code)&&codes.indexOf(code)<0) codes.push(code);
    });
    return codes;
  }
  function contactIdEventMetadata(value){
    var codes=contactIdBaseEventCodes(value),descriptions=[],categories=[],severities=[];
    codes.forEach(function(code){
      var meta=CONTACT_ID_EVENT_METADATA[code];
      if(!meta) return;
      if(meta.description&&descriptions.indexOf(meta.description)<0) descriptions.push(meta.description);
      if(meta.category&&categories.indexOf(meta.category)<0) categories.push(meta.category);
      if(meta.severity&&severities.indexOf(meta.severity)<0) severities.push(meta.severity);
    });
    return {codes:codes,description:descriptions.join(' / ')||'—',category:categories.join(' / ')||'—',severity:severities.join(' / ')||'—'};
  }


  /* SIA metadata is keyed independently by the two-letter SIA event code.
     The descriptions follow the SIA Event Block Data Code definitions used by
     central-station receivers. Category/severity are intentionally stored in a
     separate table from Contact ID so protocol-specific classifications can
     differ without leaking one format's metadata into the other. A dash means
     the AddView classification was not independently verified; it is never guessed. */
  var SIA_EVENT_METADATA={
    'AR':{description:'AC Restoral',category:'Technical',severity:'—'},
    'AT':{description:'AC Trouble',category:'Technical',severity:'MEDIUM'},
    'BA':{description:'Burglary Alarm',category:'Intrusion',severity:'HIGH'},
    'BG':{description:'Unverified Event - Burglary',category:'Intrusion',severity:'—'},
    'BH':{description:'Burglary Alarm Restore',category:'Intrusion',severity:'—'},
    'BV':{description:'Burglary Verified',category:'Intrusion',severity:'HIGH'},
    'CA':{description:'Automatic Closing',category:'ArmDisarm',severity:'SILENT'},
    'CD':{description:'Closing Delinquent',category:'ArmDisarm',severity:'—'},
    'CG':{description:'Close Area',category:'ArmDisarm',severity:'SILENT'},
    'CI':{description:'Fail to Close',category:'ArmDisarm',severity:'SILENT'},
    'CL':{description:'Closing Report',category:'ArmDisarm',severity:'SILENT'},
    'CR':{description:'Recent Closing',category:'ArmDisarm',severity:'SILENT'},
    'CS':{description:'Closing Keyswitch',category:'ArmDisarm',severity:'SILENT'},
    'CT':{description:'Late to Open',category:'ArmDisarm',severity:'—'},
    'EA':{description:'Exit Alarm',category:'Technical',severity:'LOW'},
    'EJ':{description:'Expansion Tamper Restore',category:'Technical',severity:'—'},
    'EM':{description:'Expansion Device Missing',category:'Technical',severity:'LOW'},
    'EN':{description:'Expansion Missing Restore',category:'Technical',severity:'—'},
    'ER':{description:'Expansion Restoral',category:'Technical',severity:'—'},
    'ES':{description:'Expansion Device Tamper',category:'Technical',severity:'LOW'},
    'ET':{description:'Expansion Trouble',category:'Technical',severity:'LOW'},
    'FA':{description:'Fire Alarm',category:'Fire',severity:'HIGH'},
    'FH':{description:'Fire Alarm Restore',category:'Fire',severity:'—'},
    'FJ':{description:'Fire Trouble Restore',category:'Fire',severity:'—'},
    'FS':{description:'Fire Supervisory',category:'Fire',severity:'MEDIUM'},
    'FT':{description:'Fire Trouble',category:'Fire',severity:'MEDIUM'},
    'FV':{description:'Fire Supervision Restore',category:'Fire',severity:'—'},
    'GA':{description:'Gas Alarm',category:'Environmental',severity:'HIGH'},
    'GH':{description:'Gas Alarm Restore',category:'Environmental',severity:'—'},
    'GJ':{description:'Gas Trouble Restore',category:'Environmental',severity:'—'},
    'GT':{description:'Gas Trouble',category:'Environmental',severity:'—'},
    'HA':{description:'Holdup Alarm',category:'PanicEmergency',severity:'HIGH'},
    'HH':{description:'Holdup Alarm Restore',category:'PanicEmergency',severity:'—'},
    'HV':{description:'Holdup Verified',category:'PanicEmergency',severity:'HIGH'},
    'JA':{description:'User Code Tamper',category:'ArmDisarm',severity:'SILENT'},
    'JL':{description:'Log Threshold',category:'Technical',severity:'INFO'},
    'KA':{description:'Heat Alarm',category:'Environmental',severity:'—'},
    'KH':{description:'Heat Alarm Restore',category:'Environmental',severity:'—'},
    'KJ':{description:'Heat Trouble Restore',category:'Environmental',severity:'—'},
    'KT':{description:'Heat Trouble',category:'Environmental',severity:'—'},
    'LB':{description:'Local Program',category:'Technical',severity:'INFO'},
    'LR':{description:'Phone Line Restoral',category:'Technical',severity:'—'},
    'LS':{description:'Local Program Success',category:'Technical',severity:'INFO'},
    'LT':{description:'Phone Line Trouble',category:'Technical',severity:'MEDIUM'},
    'LU':{description:'Local Program Fail',category:'Technical',severity:'—'},
    'MA':{description:'Medical Alarm',category:'Medical',severity:'HIGH'},
    'MH':{description:'Medical Alarm Restore',category:'Medical',severity:'—'},
    'OA':{description:'Automatic Opening',category:'ArmDisarm',severity:'SILENT'},
    'OC':{description:'Cancel Report',category:'ArmDisarm',severity:'SILENT'},
    'OP':{description:'Opening Report',category:'ArmDisarm',severity:'SILENT'},
    'OR':{description:'Disarm From Alarm',category:'ArmDisarm',severity:'—'},
    'OS':{description:'Opening Keyswitch',category:'ArmDisarm',severity:'SILENT'},
    'PA':{description:'Panic Alarm',category:'PanicEmergency',severity:'HIGH'},
    'PH':{description:'Panic Alarm Restore',category:'PanicEmergency',severity:'—'},
    'QA':{description:'Emergency Alarm',category:'PanicEmergency',severity:'HIGH'},
    'QH':{description:'Emergency Alarm Restore',category:'PanicEmergency',severity:'—'},
    'RB':{description:'Remote Program Begin',category:'Technical',severity:'INFO'},
    'RP':{description:'Automatic Test',category:'Technical',severity:'INFO'},
    'RR':{description:'Power Up',category:'Technical',severity:'INFO'},
    'RS':{description:'Remote Program Success',category:'Technical',severity:'INFO'},
    'RX':{description:'Manual Test',category:'Technical',severity:'INFO'},
    'RY':{description:'Test Off Normal',category:'Technical',severity:'INFO'},
    'SA':{description:'Sprinkler Alarm',category:'Environmental',severity:'—'},
    'SH':{description:'Sprinkler Alarm Restore',category:'Environmental',severity:'—'},
    'TA':{description:'Tamper Alarm',category:'Technical',severity:'MEDIUM'},
    'TE':{description:'Test End',category:'Technical',severity:'INFO'},
    'TR':{description:'Tamper Restoral',category:'Technical',severity:'—'},
    'TS':{description:'Test Start',category:'Technical',severity:'INFO'},
    'UA':{description:'Untyped Zone Alarm',category:'—',severity:'—'},
    'UB':{description:'Untyped Zone Bypass',category:'—',severity:'—'},
    'UH':{description:'Untyped Alarm Restore',category:'—',severity:'—'},
    'UJ':{description:'Untyped Trouble Restore',category:'Intrusion',severity:'MEDIUM'},
    'UR':{description:'Untyped Zone Restoral',category:'Intrusion',severity:'MEDIUM'},
    'US':{description:'Untyped Zone Supervisory',category:'Intrusion',severity:'MEDIUM'},
    'UT':{description:'Untyped Zone Trouble',category:'Intrusion',severity:'MEDIUM'},
    'UU':{description:'Untyped Zone Unbypass',category:'—',severity:'—'},
    'WA':{description:'Water Alarm',category:'Environmental',severity:'MEDIUM'},
    'WH':{description:'Water Alarm Restore',category:'Environmental',severity:'—'},
    'XR':{description:'Transmitter Battery Restoral',category:'Technical',severity:'—'},
    'XT':{description:'Transmitter Battery Trouble',category:'Technical',severity:'LOW'},
    'YA':{description:'Bell Fault',category:'Technical',severity:'LOW'},
    'YH':{description:'Bell Restored',category:'Technical',severity:'—'},
    'YI':{description:'Overcurrent Trouble',category:'Technical',severity:'LOW'},
    'YJ':{description:'Overcurrent Restore',category:'Technical',severity:'—'},
    'YK':{description:'Communications Restoral',category:'Technical',severity:'—'},
    'YM':{description:'System Battery Missing',category:'Technical',severity:'LOW'},
    'YP':{description:'Power Supply Trouble',category:'Technical',severity:'LOW'},
    'YQ':{description:'Power Supply Restored',category:'Technical',severity:'—'},
    'YR':{description:'System Battery Restoral',category:'Technical',severity:'—'},
    'YS':{description:'Communications Trouble',category:'Technical',severity:'LOW'},
    'YT':{description:'System Battery Trouble',category:'Technical',severity:'MEDIUM'},
    'YX':{description:'Service Required',category:'Technical',severity:'LOW'},
    'YZ':{description:'Service Completed',category:'Technical',severity:'—'},
    'ZA':{description:'Freeze Alarm',category:'Environmental',severity:'HIGH'},
    'ZH':{description:'Freeze Alarm Restore',category:'Environmental',severity:'—'},
    'ZJ':{description:'Freeze Trouble Restore',category:'Environmental',severity:'—'},
    'ZT':{description:'Freeze Trouble',category:'Environmental',severity:'—'}
  };
  function siaBaseEventCodes(value){
    var codes=[];
    splitPair(value).forEach(function(part){
      var raw=String(part||'').trim(),match=raw.match(/^([A-Z]{2})(?:\s*-|$)/);
      if(!match) return;
      var code=match[1];
      if(codes.indexOf(code)<0) codes.push(code);
    });
    return codes;
  }
  function siaEventMetadata(value){
    var codes=siaBaseEventCodes(value),descriptions=[],categories=[],severities=[];
    codes.forEach(function(code){
      var meta=SIA_EVENT_METADATA[code];
      if(!meta) return;
      if(meta.description&&descriptions.indexOf(meta.description)<0) descriptions.push(meta.description);
      if(meta.category&&meta.category!=='—'&&categories.indexOf(meta.category)<0) categories.push(meta.category);
      if(meta.severity&&meta.severity!=='—'&&severities.indexOf(meta.severity)<0) severities.push(meta.severity);
    });
    return {codes:codes,description:descriptions.join(' / ')||'—',category:categories.join(' / ')||'—',severity:severities.join(' / ')||'—'};
  }
  /* v387 — line-aligned severity metadata comes from the native standard SIA/CID
     event tables already bundled with the Reporting Codes reference. The standard
     tables remain the authority for each individual event/restoral line; legacy
     compact metadata stays available as a fallback for proprietary/unmapped codes. */
  var STANDARD_EVENT_METADATA_CACHE=null;
  function normalizeStandardSeverity(value){
    var text=String(value==null?'':value).trim().toUpperCase();
    return (!text||text==='-'||text==='—')?'—':text;
  }
  function standardEventMetadataMaps(){
    if(STANDARD_EVENT_METADATA_CACHE) return STANDARD_EVENT_METADATA_CACHE;
    var reporting=((root.DSC_NEO_REFERENCE_DATA||{}).reportingCodes)||{},sections=reporting.sections||[],siaRows=[],cidRows=[];
    sections.forEach(function(section){
      if((section||{}).id==='sia-event-code-table') siaRows=section.rows||[];
      if((section||{}).id==='contact-id-event-code-table') cidRows=section.rows||[];
    });
    var sia={},cid={};
    siaRows.forEach(function(row){
      var code=String((row||[])[0]||'').trim().toUpperCase();
      if(!code) return;
      sia[code]={description:String(row[1]||'—'),category:String(row[2]||'—'),severity:normalizeStandardSeverity(row[3]),type:String(row[4]||'—').toUpperCase()};
    });
    cidRows.forEach(function(row){
      var qualifier=String((row||[])[4]||'').trim().toUpperCase(),code=normalizeContactIdCode((row||[])[5]||'');
      if(!/^[ER]$/.test(qualifier)||!/^[0-9]{3}$/.test(code)) return;
      cid[qualifier+':'+code]={description:String(row[0]||'—'),category:String(row[1]||'—'),severity:normalizeStandardSeverity(row[2]),type:String(row[3]||'—').toUpperCase(),qualifier:qualifier,code:code};
    });
    STANDARD_EVENT_METADATA_CACHE={sia:sia,cid:cid};
    return STANDARD_EVENT_METADATA_CACHE;
  }
  function standardMetadataForPart(part,format){
    if(!part) return {description:'—',category:'—',severity:'—',type:'—'};
    var maps=standardEventMetadataMaps();
    if(format==='contact-id'){
      var cidCode=normalizeContactIdCode(String(part.eventId||'')+String(part.reportingCode||'')),qualifier=String(part.status||'').toUpperCase();
      var cidExact=maps.cid[qualifier+':'+cidCode];
      if(cidExact) return cidExact;
      /* The legacy compact CID map is event-code metadata, not qualifier-specific
         metadata. It is safe as an E-event fallback only. Never copy an event
         severity/category onto an R line when the supplied CID table does not
         define that restore entry. */
      if(qualifier==='E'){
        var cidFallback=CONTACT_ID_EVENT_METADATA[cidCode]||{};
        return {description:cidFallback.description||'—',category:cidFallback.category||'—',severity:cidFallback.severity||'—',type:'—'};
      }
      return {description:'—',category:'—',severity:'—',type:'—'};
    }
    var siaCode=String(part.reportingCode||'').toUpperCase(),siaExact=maps.sia[siaCode];
    if(siaExact) return siaExact;
    var siaFallback=SIA_EVENT_METADATA[siaCode]||{};
    return {description:siaFallback.description||'—',category:siaFallback.category||'—',severity:siaFallback.severity||'—',type:'—'};
  }
  function metadataLinesForValue(value,format){
    var semantic=pairSemantic(value,format),lines=[];
    if(semantic.event) lines.push({part:semantic.event,role:'event',metadata:standardMetadataForPart(semantic.event,format)});
    if(semantic.restore) lines.push({part:semantic.restore,role:'restore',metadata:standardMetadataForPart(semantic.restore,format)});
    return lines;
  }
  function metadataLinesForRow(row,format){
    row=row||{};
    return metadataLinesForValue(format==='contact-id'?row.contactId:row.sia,format);
  }
  function metadataSummaryForValue(value,format){
    var lines=metadataLinesForValue(value,format),codes=[],descriptions=[],categories=[],severities=[];
    lines.forEach(function(line){
      var part=line.part||{},meta=line.metadata||{},code='';
      if(format==='contact-id') code=normalizeContactIdCode(String(part.eventId||'')+String(part.reportingCode||''));
      else code=String(part.reportingCode||'').toUpperCase();
      if(code&&codes.indexOf(code)<0) codes.push(code);
      var description=String(meta.description||'—'),category=String(meta.category||'—'),severity=normalizeStandardSeverity(meta.severity);
      if(description!=='—'&&descriptions.indexOf(description)<0) descriptions.push(description);
      if(category!=='—'&&categories.indexOf(category)<0) categories.push(category);
      if(severity!=='—'&&severities.indexOf(severity)<0) severities.push(severity);
    });
    return {codes:codes,description:descriptions.join(' / ')||'—',category:categories.join(' / ')||'—',severity:severities.join(' / ')||'—'};
  }
  function selectedMetadataLines(row){
    return metadataLinesForRow(row,state.metadataSource==='sia'?'sia':'contact-id');
  }
  function selectedMetadataLineValues(row,field){
    var values=selectedMetadataLines(row).map(function(line){
      var value=(line.metadata||{})[field];
      return field==='severity'?normalizeStandardSeverity(value):String(value||'—');
    });
    if(values.length) return values;
    var fallback=selectedMetadata(row),fallbackValue=fallback[field];
    return [field==='severity'?normalizeStandardSeverity(fallbackValue):String(fallbackValue||'—')];
  }
  function reportingDescriptionLines(row){return selectedMetadataLineValues(row,'description');}
  function reportingCategoryLines(row){
    var values=selectedMetadataLineValues(row,'category');
    if(values.length>1&&values.every(function(value){return value===values[0];})) return [values[0]];
    return values;
  }
  function reportingSeverityLines(row){return selectedMetadataLineValues(row,'severity');}

  function selectedMetadata(row){
    if(state.metadataSource==='sia') return {description:(row||{}).siaDescription||'—',category:(row||{}).siaCategory||'—',severity:(row||{}).siaSeverity||'—'};
    return {description:(row||{}).cidDescription||'—',category:(row||{}).cidCategory||(row||{}).category||'—',severity:(row||{}).cidSeverity||(row||{}).severity||'—'};
  }
  function metadataHeaderPrefix(){return state.metadataSource==='sia'?'SIA':'CID';}
  var DIALER_DIRECTION_HELP={
    'A/R':'A/R = alarms/restores',
    'T/R':'T/R = tampers/restores',
    'O/C':'O/C = openings/closings',
    'MA/R':'MA/R = maintenance alarms/restores',
    'T':'T = test transmissions'
  };
  function renderDirectionValue(value,query,detection){
    var raw=String(value||'—'),key=raw.trim().toUpperCase(),help=DIALER_DIRECTION_HELP[key]||'';
    return '<span class="reporting-direction-value"'+(help?' title="'+esc(help)+'" data-direction-help="'+esc(help)+'" aria-label="'+esc(help)+'"':'')+'>'+highlightTableValue(raw,query,'text',detection)+'</span>';
  }
  var DIALER_DIRECTION_LINES={
    'A/R':{event:'A',restore:'R'},
    'T/R':{event:'T',restore:'R'},
    'O/C':{event:'O',restore:'C'},
    'MA/R':{event:'MA',restore:'R'},
    'T':{event:'T',restore:'T'}
  };
  function renderAlignedLines(values,query,detection,className){
    values=(values||[]).length?values:['—'];
    return '<span class="reporting-aligned-lines '+esc(className||'')+'">'+values.map(function(value){return '<span class="reporting-aligned-line">'+highlightTableValue(value,query,'text',detection)+'</span>';}).join('')+'</span>';
  }
  function renderDescriptionLinesForRow(row,query,detection){
    return renderAlignedLines(reportingDescriptionLines(row),query,detection,'reporting-description-lines');
  }
  function renderCategoryLinesForRow(row,query,detection){
    return renderAlignedLines(reportingCategoryLines(row),query,detection,'reporting-category-lines');
  }
  function renderSeverityLinesForRow(row,query,detection){
    return renderAlignedLines(reportingSeverityLines(row),query,detection,'reporting-severity-lines');
  }
  function directionLineSpecsForRow(row){
    row=row||{};
    var raw=String(row.dialerDirection||'—'),key=raw.trim().toUpperCase(),map=DIALER_DIRECTION_LINES[key],help=DIALER_DIRECTION_HELP[key]||'';
    if(!map) return [{value:raw,help:help}];

    /* Direction is a dialer-routing meaning, not protocol metadata. Use the
       reporting row's actual code-line count and preserve its line order. When
       a row has only one O/C code, the section/definition determines whether
       that line is Opening or Closing; this avoids treating every CID E as O. */
    var cidSemantic=pairSemantic(row.contactId||'','contact-id'),cidParts=[];
    if(cidSemantic.event&&cidSemantic.event.status&&cidSemantic.event.eventId&&cidSemantic.event.reportingCode) cidParts.push(cidSemantic.event);
    if(cidSemantic.restore&&cidSemantic.restore.status&&cidSemantic.restore.eventId&&cidSemantic.restore.reportingCode) cidParts.push(cidSemantic.restore);
    var siaSemantic=pairSemantic(row.sia||'','sia'),siaParts=[];
    if(siaSemantic.event&&siaSemantic.event.reportingCode) siaParts.push(siaSemantic.event);
    if(siaSemantic.restore&&siaSemantic.restore.reportingCode) siaParts.push(siaSemantic.restore);
    var count=Math.max(cidParts.length,siaParts.length);
    if(key==='T') return Array(Math.max(1,count)).fill(0).map(function(){return {value:'T',help:help};});
    if(count>=2) return [{value:map.event,help:help},{value:map.restore,help:help}];

    var section=normalizeText(row.sectionTitle||''),definition=normalizeText(row.definition||'');
    var restoreLike=false;
    if(key==='O/C'){
      if(/closing/.test(section)) restoreLike=true;
      else if(/opening/.test(section)) restoreLike=false;
      else if(/closing|close|armed|arming/.test(definition)&&!/opening|open|disarm/.test(definition)) restoreLike=true;
      else if(/opening|open|disarm/.test(definition)) restoreLike=false;
      else if(cidParts[0]&&String(cidParts[0].status||'').toUpperCase()==='R') restoreLike=true;
    }else{
      if(cidParts[0]&&String(cidParts[0].status||'').toUpperCase()==='R') restoreLike=true;
      else if(siaParts[0]){
        var type=String((standardMetadataForPart(siaParts[0],'sia')||{}).type||'').toUpperCase();
        restoreLike=type.indexOf('RESTORE')>=0;
      }
      if(/restore|restoral|restored|unbypass/.test(definition)) restoreLike=true;
    }
    return [{value:restoreLike?map.restore:map.event,help:help}];
  }
  function renderDirectionLinesForRow(row,query,detection){
    var specs=directionLineSpecsForRow(row),html=specs.map(function(spec){
      var help=spec.help||'';
      return '<span class="reporting-aligned-line"><span class="reporting-direction-value"'+(help?' title="'+esc(help)+'" data-direction-help="'+esc(help)+'" aria-label="'+esc(help)+'"':'')+'>'+highlightTableValue(spec.value,query,'text',detection)+'</span></span>';
    }).join('');
    return '<span class="reporting-aligned-lines reporting-direction-lines">'+html+'</span>';
  }

  function buildIndex(){
    if(cachedIndex) return cachedIndex;
    var reference=((root.DSC_NEO_REFERENCE_DATA||{}).reportingCodes)||{};
    var sections=reference.sections||[];
    var rows=[];
    for(var s=0;s<sections.length;s++){
      var section=sections[s]||{};
      if(section.kind==='overview'||section.kind==='standard-sia'||section.kind==='standard-cid') continue;
      var sectionRows=section.rows||[];
      for(var r=0;r<sectionRows.length;r++){
        var row=sectionRows[r]||[];
        var definition='',programmingSection='',dialerDirection='',contactId='',sia='';
        if(section.kind==='zone-alarm'){
          definition=String(row[0]||'');
          programmingSection='—';
          dialerDirection='A/R';
          sia=String(row[1]||'');
          contactId=String(row[2]||'');
        }else{
          programmingSection=String(row[0]||'');
          definition=String(row[1]||'');
          dialerDirection=String(row[2]||'');
          contactId=String(row[3]||'');
          sia=String(row[4]||'');
        }
        var relationship=null;
        (section.relationships||[]).some(function(item){
          if(String((item||{}).definition||'')!==definition) return false;
          if(item.programmingSection&&String(item.programmingSection)!==programmingSection) return false;
          relationship=item;return true;
        });
        /* Resolve the decoder index through the native protocol tables so text
           search, filters, and rendered metadata all share the same authoritative
           code-to-metadata relationship. */
        var cidMetadata=metadataSummaryForValue(contactId,'contact-id'),siaMetadata=metadataSummaryForValue(sia,'sia');
        rows.push({
          id:section.id+'-'+String(r+1),sectionId:section.id,sectionTitle:String(section.title||''),sectionKind:String(section.kind||'table'),sectionIndex:s,rowIndex:r,
          programmingSection:programmingSection,definition:definition,cidDescription:cidMetadata.description,cidCategory:cidMetadata.category,cidSeverity:cidMetadata.severity,category:cidMetadata.category,severity:cidMetadata.severity,contactIdEventCodes:cidMetadata.codes,siaDescription:siaMetadata.description,siaCategory:siaMetadata.category,siaSeverity:siaMetadata.severity,siaEventCodes:siaMetadata.codes,dialerDirection:dialerDirection,contactId:contactId,sia:sia,
          relatedSectionId:relationship?String(relationship.targetSectionId||''):'',relatedSectionTitle:relationship?String(relationship.targetTitle||''):'',
          contactIdVariants:codeVariants(contactId,'contact-id'),siaVariants:codeVariants(sia,'sia'),
          definitionText:normalizeText(definition),sectionText:normalizeText(section.title||''),sectionProgrammingText:normalizeText([programmingSection,section.title||''].join(' ')),
          definitionTokens:tokenizeText(definition),sectionProgrammingTokens:tokenizeText([programmingSection,section.title||''].join(' ')),
          searchText:normalizeText([section.title,programmingSection,definition,cidMetadata.description,cidMetadata.category,cidMetadata.severity,siaMetadata.description,siaMetadata.category,siaMetadata.severity,dialerDirection,contactId,sia,(section.notes||[]).join(' ')].join(' ')),
          _definitionPrefixIndex:null,_sectionPrefixIndex:null,_textProjectionKey:'',_textProjectionText:'',_textProjectionTokens:[],_textProjectionPrefixIndex:null
        });
      }
    }
    cachedIndex={reference:reference,rows:rows};
    return cachedIndex;
  }

  function knownSiaPrefixes(){
    if(cachedKnownSiaPrefixes) return cachedKnownSiaPrefixes;
    var values={};
    buildIndex().rows.forEach(function(row){
      row.siaVariants.forEach(function(variant){
        var clean=variant.normalized;
        if(clean.length>=2 && /^[A-Z]{2}/.test(clean)) values[clean.slice(0,2)]=true;
      });
    });
    cachedKnownSiaPrefixes=values;
    return cachedKnownSiaPrefixes;
  }
  function displayPartialAccount(value){
    var account=String(value||'').toUpperCase();
    if(!account) return '';
    if(account.length<4) return account.padStart(4,'X');
    if(account.length===5) return account.padStart(6,'X');
    return account;
  }
  function contactIdSignalPrefix(value){
    var raw=String(value==null?'':value).trim();
    var clean=normalizeCode(raw),m=clean.match(/^([0-9A]{1,6})([ER])(.*)$/i),rawAccount,status,body;
    if(m){
      rawAccount=m[1].toUpperCase();status=m[2].toUpperCase();body=String(m[3]||'').toUpperCase();
    }else{
      /* A leading numeric qualifier plus explicit reporting-code notation is
         a code-list lookup, not an account-prefixed signal. Example:
         1300-101 == E(3)00-101. Leave that form for the code-list parser. */
      if(/^\s*[13]\s*\(?\s*[0-9A]\s*\)?\s*[0-9A]{2}\s*-\s*[0-9A]{1,3}(?:\s*-\s*[0-9A]{1,3})?\s*$/i.test(raw)) return null;
      /* Contact ID sends E/R as 1/3 on the wire. For a compact full signal,
         accept that numeric qualifier at the boundary after a valid 4- or
         6-character account. The account itself can contain only decimal
         digits (with A accepted as transmitted zero). This validation is
         essential: otherwise an ordinary code such as E300-101 is wrongly
         split as account E300 + numeric qualifier 1. */
      var widths=[4,6],candidate=null;
      for(var i=0;i<widths.length;i++){
        var width=widths[i],remaining=clean.length-width-1;
        if(remaining<1||remaining>8) continue;
        var accountCandidate=clean.slice(0,width);
        if(!/^[0-9A]+$/.test(accountCandidate)) continue;
        var qualifier=clean.charAt(width),eventId=clean.charAt(width+1);
        if((qualifier==='1'||qualifier==='3')&&/[0-9A]/.test(eventId||'')){
          candidate={width:width,qualifier:qualifier,account:accountCandidate};break;
        }
      }
      if(!candidate) return null;
      rawAccount=candidate.account.toUpperCase();
      status=candidate.qualifier==='1'?'E':'R';
      body=clean.slice(candidate.width+1).toUpperCase();
    }
    return {
      clean:rawAccount+status+body,accountRaw:rawAccount,account:displayPartialAccount(rawAccount),
      accountPartial:rawAccount.length!==4&&rawAccount.length!==6,
      status:status,body:body
    };
  }
  function contactIdFullSignalPrefix(value){
    var parsed=contactIdSignalPrefix(value);
    return parsed&&!parsed.accountPartial?parsed:null;
  }
  function compactSiaAccountPrefix(value){
    var clean=normalizeCode(value),m=clean.match(/^([0-9A]{2,6})([A-Z]{2})([0-9AZUX]{0,4})$/i);
    if(!m||!knownSiaPrefixes()[m[2].toUpperCase()]) return null;
    var rawAccount=m[1].toUpperCase();
    return {clean:clean,accountRaw:rawAccount,account:displayPartialAccount(rawAccount),accountPartial:rawAccount.length!==4&&rawAccount.length!==6,reportingCode:m[2].toUpperCase(),target:String(m[3]||'').toUpperCase()};
  }
  function detectQueryType(value){
    var raw=String(value==null?'':value).trim();
    var clean=normalizeCode(raw),cidClean=normalizeContactIdQuery(raw);
    if(!raw) return {kind:'empty',format:null,label:'No search'};
    var directionQuery=normalizedDirectionQuery(raw);
    if(directionQuery) return {kind:'text',format:null,label:'Direction',syntax:'direction',direction:directionQuery};
    if(looksLikeProgrammingSectionQuery(raw)) return {kind:'text',format:null,label:'Programming section',syntax:'section'};
    if(/\bN\s*R\s*I\b/i.test(raw)||clean.indexOf('NRI')>=0) return {kind:'code',format:'sia',label:'SIA'};
    var cidSignalPrefix=contactIdSignalPrefix(raw);
    if(cidSignalPrefix) return {kind:'code',format:'contact-id',label:'Contact ID',syntax:cidSignalPrefix.accountPartial?'partial-account-signal':'full-signal'};
    var listCid=parseContactIdCodeListInput(raw);
    if(listCid) return {kind:'code',format:'contact-id',label:'Contact ID',syntax:'code-list'};
    if(/^[0-9A]{3}$/.test(clean)) return {kind:'code',format:'contact-id',label:'Contact ID'};
    /* Resolve known SIA codes before the loose E/R live-partial heuristic. This
       prevents numeric account prefixes such as 33BA0001 from being mistaken
       for a Contact ID restore simply because 3 can also represent R. */
    var siaPrefixes=knownSiaPrefixes();
    var siaAccountPrefix=compactSiaAccountPrefix(raw);
    if(siaAccountPrefix) return {kind:'code',format:'sia',label:'SIA',syntax:siaAccountPrefix.accountPartial?'partial-account-signal':'compact-account-signal'};
    if(/^[A-Z]{2}$/.test(clean)&&siaPrefixes[clean]) return {kind:'code',format:'sia',label:'SIA'};
    var compactSia=clean.match(/^([0-8A])?([A-Z]{2})([0-9AZUX]{0,4})$/);
    if(compactSia&&siaPrefixes[compactSia[2]]) return {kind:'code',format:'sia',label:'SIA'};
    /* Treat E/R as a Contact ID qualifier only when what follows is actually
       signal-like. Contact ID numeric fields use decimal digits (with A accepted
       as transmitted zero), so require 0-9/A after the qualifier. */
    if(/(?:^|[^A-Z0-9])[ER]\s*\(?\s*[0-9A]/i.test(raw)||/^(?:[0-9A]{4}|[0-9A]{6})[ER][0-9A]/.test(clean)||/^[ER][0-9A]/.test(cidClean)) return {kind:'code',format:'contact-id',label:'Contact ID'};
    return {kind:'text',format:null,label:'Text / description'};
  }
  function parseContactIdBreakdownLayout(value){
    var raw=String(value==null?'':value).trim(),clean=normalizeCode(raw),account='',accountRaw='',accountPartial=false,status='',body=clean,cursor=0,usedAccountPrefix=false;
    if(!raw) return {raw:raw,clean:clean,account:'',accountRaw:'',accountPartial:false,status:'',eventId:'',reportingCode:'',partition:'',target:'',reportingCodePartial:false,partitionPartial:false,targetPartial:false,fullSignal:false,canonical:'',canonicalRelaxed:'',looksLikeSignal:false};

    /* v488: breakdown toggles are display/layout controls, never match switches.
       The unambiguous Contact ID core (account prefix when present, E/R, event ID,
       reporting code) is still recognized so normal searching cannot regress.
       Partition is the ambiguous optional block: when it is disabled it consumes
       no characters, so the next digits go directly to Identifier. */
    var prefix=contactIdSignalPrefix(raw);
    if(prefix){
      account=prefix.account;accountRaw=prefix.accountRaw;accountPartial=!!prefix.accountPartial;
      status=prefix.status;body=String(prefix.body||'').toUpperCase();usedAccountPrefix=true;
    }else{
      body=clean;
      var first=body.charAt(0).toUpperCase();
      if(first==='E'||first==='R'){status=first;cursor=1;}
      else if((first==='1'||first==='3')&&body.length>=4){status=first==='1'?'E':'R';cursor=1;}
    }

    function take(width){var out=body.slice(cursor,cursor+width);cursor+=out.length;return out;}
    var eventId=take(1);
    var reportingCode=take(2);
    var partition=breakdownFieldEnabled('partition')?take(2):'';
    var target=breakdownFieldEnabled('identifier')?take(3):'';
    var canonical=(account?account+' ':'')+(status?(status+' '):'')+(eventId?'('+eventId+') ':'')+(reportingCode?(reportingCode+' '):'')+(partition?(partition+' '):'')+(target||'');
    canonical=canonical.trim();
    return {
      raw:raw,clean:clean,account:account,accountRaw:accountRaw,accountPartial:accountPartial,status:status,eventId:eventId,reportingCode:reportingCode,partition:partition,target:target,
      reportingCodePartial:!!(reportingCode&&reportingCode.length<2),partitionPartial:!!(partition&&partition.length<2),targetPartial:!!(target&&target.length<3),
      fullSignal:!!(usedAccountPrefix&&account&&!accountPartial),canonical:canonical,canonicalRelaxed:canonical.replace(/A/g,'0'),looksLikeSignal:!!((status||eventId)&&reportingCode)
    };
  }

  function parseContactIdCodeListInput(value){
    var raw=String(value==null?'':value).trim();
    if(!raw) return null;
    var compact=normalizeContactIdQuery(raw),m=null,partition='',partitionPartial=false,explicitSyntax=/[()\-]/.test(raw);

    /* A full account-prefixed signal is handled by the signal-layout parser.
       Account visibility does not change reporting-code matching. */
    if(contactIdSignalPrefix(raw)) return null;

    /* Explicit reporting-code notation is intentionally independent from the
       breakdown layout. E300-101 must always remain a direct code-list lookup. */
    if(explicitSyntax){
      var numericExplicit=raw.match(/^\s*([13])\s*\(?\s*([0-9A])\s*\)?\s*([0-9A]{2})(?:\s*-\s*([0-9A]{1,3})(?:\s*-\s*([0-9A]{1,3}))?)\s*$/i);
      if(numericExplicit){numericExplicit[1]=numericExplicit[1]==='1'?'E':'R';m=numericExplicit;}
    }
    if(!m&&explicitSyntax&&!/^\s*[13](?=\s|[\/_\-(])/.test(raw)){
      var explicit=raw.match(/^\s*([ER])?\s*\(?\s*([0-9A])\s*\)?\s*([0-9A]{2})(?:\s*-\s*([0-9A]{1,3})(?:\s*-\s*([0-9A]{1,3}))?)?\s*$/i);
      if(explicit) m=explicit;
    }

    if(!m&&!explicitSyntax){
      var layout=parseContactIdBreakdownLayout(raw);
      /* A compact Contact ID lookup needs at least the row-specific event/report
         portion. Disabled breakdown blocks consume no characters. */
      var validCompact=layout.eventId&&layout.reportingCode&&/^[0-9A]$/i.test(layout.eventId)&&/^[0-9A]{1,2}$/i.test(layout.reportingCode)&&(!layout.partition||/^[0-9A]{1,2}$/i.test(layout.partition))&&(!layout.target||/^[0-9A]{1,3}$/i.test(layout.target));
      if(validCompact){
        partition=layout.partition||'';partitionPartial=!!layout.partitionPartial;
        m=[raw,layout.status||'',layout.eventId||'',layout.reportingCode||'',layout.target||'',''];
      }
    }
    if(!m) return null;

    var start=String(m[4]||'').toUpperCase(),end=String(m[5]||'').toUpperCase();
    var startDigits=numericSignalDigits(start),endDigits=numericSignalDigits(end);
    var numericStart=startDigits&&startDigits.length<=3?Number(startDigits):null;
    var numericEnd=endDigits&&endDigits.length<=3?Number(endDigits):null;
    var partial=!!(start && !end && startDigits && startDigits.length<=2);
    var range=start?{
      start:start,end:end,
      display:end?('('+start+' to '+end+')'):(partial?(start+Array(4-start.length).join('X')):start),
      count:(numericStart!=null&&numericEnd!=null&&numericEnd>=numericStart)?numericEnd-numericStart+1:(start&&!partial?1:null),
      isRange:!!end,partial:partial,prefixLength:partial?start.length:0
    }:null;
    return {
      raw:raw,kind:explicitSyntax?'code-list':'compact-signal',status:String(m[1]||'').toUpperCase(),eventId:String(m[2]||'').toUpperCase(),
      reportingCode:String(m[3]||'').toUpperCase(),partition:partition,partitionPartial:partitionPartial,range:range,
      baseNormalized:normalizeContactIdCode(String(m[2]||'')+String(m[3]||'')),
      programmedReportingCode:String(m[3]||'').toUpperCase().replace(/0/g,'A')
    };
  }
  function contactIdLookupDescriptor(value){
    var list=parseContactIdCodeListInput(value);
    if(list) return list;
    var full=parseContactIdInput(value);
    var target=String(full.target||''),targetPartial=!!(target&&target.length<3);
    return {
      raw:String(value==null?'':value),kind:'full-signal',status:full.status||'',eventId:full.eventId||'',reportingCode:full.reportingCode||'',
      reportingCodePartial:!!full.reportingCodePartial,
      range:target?{start:target,end:'',display:targetPartial?(target+Array(4-target.length).join('X')):target,count:targetPartial?null:1,isRange:false,partial:targetPartial,prefixLength:targetPartial?target.length:0}:null,
      baseNormalized:normalizeContactIdCode((full.eventId||'')+(full.reportingCode||'')),fullSignal:full
    };
  }
  function numericContactIdAliasDescriptor(value){
    var raw=String(value==null?'':value).trim(),clean=normalizeCode(raw);
    if(!/^[13][0-9A]{3,6}$/.test(clean)) return null;
    var tail=clean.slice(4),start=tail.slice(0,3),partial=!!(start&&start.length<3);
    return {
      raw:raw,kind:'numeric-code-list',status:clean.charAt(0)==='1'?'E':'R',eventId:clean.charAt(1),reportingCode:clean.slice(2,4),partition:'',partitionPartial:false,
      range:start?{start:start,end:'',display:partial?(start+Array(4-start.length).join('X')):start,count:partial?null:1,isRange:false,partial:partial,prefixLength:partial?start.length:0}:null,
      baseNormalized:normalizeContactIdCode(clean.slice(1,4)),programmedReportingCode:clean.slice(2,4).replace(/0/g,'A')
    };
  }
  function contactIdDescriptorSignature(descriptor){
    descriptor=descriptor||{};var range=descriptor.range||{};
    return [descriptor.status||'',descriptor.eventId||'',normalizeContactIdCode(descriptor.reportingCode||''),range.start||'',range.end||'',range.partial?1:0].join('|');
  }
  function contactIdLookupDescriptors(value){
    var out=[],seen={},primary=contactIdLookupDescriptor(value),alias=numericContactIdAliasDescriptor(value);
    [primary,alias].forEach(function(descriptor){
      if(!descriptor) return;var signature=contactIdDescriptorSignature(descriptor);
      if(seen[signature]) return;seen[signature]=true;out.push(descriptor);
    });
    return out;
  }
  function codeLookupValue(query,format){
    var raw=String(query==null?'':query),clean=normalizeCode(raw);
    if(format==='sia'){
      var parsedSia=parseSiaInput(raw);
      if(parsedSia.reportingCode) return parsedSia.reportingCode+(parsedSia.target||'');
      return clean;
    }
    var descriptor=contactIdLookupDescriptor(raw);
    if(descriptor&&descriptor.eventId&&descriptor.reportingCode){
      var prefix=(descriptor.status||'')+descriptor.eventId+descriptor.reportingCode;
      if(descriptor.range&&descriptor.range.start) prefix+=descriptor.range.start;
      return prefix;
    }
    var erIndex=clean.search(/[ER]/);
    return erIndex>=0?clean.slice(erIndex):clean;
  }
  function numericRangeContains(range,value){
    if(!range||value==null) return false;
    var text=numericSignalDigits(value);
    if(!text) return false;
    var number=Number(text);
    if(range.placeholder) return true;
    var rangeStart=numericSignalDigits(range.start||'');
    if(!rangeStart) return false;
    var rangeEnd=range.end?numericSignalDigits(range.end):'';
    var start=Number(rangeStart),end=rangeEnd?Number(rangeEnd):start;
    return number>=start&&number<=end;
  }
  function identifierQueryMatchesRange(partRange,queryRange){
    if(!queryRange||!queryRange.start) return true;
    if(!partRange) return false;
    if(queryRange.end){
      var qStart=numericSignalDigits(queryRange.start),qEnd=numericSignalDigits(queryRange.end),pStart=numericSignalDigits(partRange.start),pEnd=numericSignalDigits(partRange.end||partRange.start);
      if(!qStart||!qEnd||!pStart||!pEnd) return false;
      var qs=Number(qStart),qe=Number(qEnd),ps=Number(pStart),pe=Number(pEnd);
      return [qs,qe,ps,pe].every(isFinite)&&qs>=ps&&qe<=pe;
    }
    if(queryRange.partial){
      if(partRange.placeholder) return true;
      var bounds=numericRangeBounds(partRange);
      if(!bounds) return false;
      var prefix=numericSignalDigits(queryRange.start),width=Math.max(3,bounds.width||3);
      if(!prefix) return false;
      for(var value=bounds.start;value<=bounds.end;value++){
        if(String(value).padStart(width,'0').indexOf(prefix)===0) return true;
      }
      return false;
    }
    return numericRangeContains(partRange,queryRange.start);
  }
  function breakdownFieldEnabled(key){
    if(!Object.prototype.hasOwnProperty.call(DEFAULT_SIGNAL_MATCH_FIELDS,key)) return true;
    return !state.signalMatchFields||state.signalMatchFields[key]!==false;
  }
  /* Backward-compatible internal alias. v488: these toggles describe which
     blocks exist in Signal Breakdown; they are not row-matching on/off switches. */
  function compareFieldEnabled(key){return breakdownFieldEnabled(key);}
  function textSearchColumnEnabled(key){return !state.textSearchColumns||state.textSearchColumns[key]!==false;}
  function invalidateRegularSearchCache(){cachedRegularQuery=null;cachedRegularRows=null;}
  function contactIdSemanticScoreForDescriptor(template,descriptor){
    var part=cidTemplateParts(template);
    if(!part||!descriptor) return 0;
    var compared=0,score=100;
    if(descriptor.status){
      if(part.status&&descriptor.status!==part.status) return 0;
      compared++;score+=12;
    }
    if(descriptor.eventId){
      if(!part.eventId||normalizeContactIdCode(descriptor.eventId)!==normalizeContactIdCode(part.eventId)) return 0;
      compared++;score+=32;
    }
    if(descriptor.reportingCode){
      var queryReportingCode=normalizeContactIdCode(descriptor.reportingCode),partReportingCode=normalizeContactIdCode(part.reportingCode||'');
      if(!part.reportingCode||(descriptor.reportingCodePartial?partReportingCode.indexOf(queryReportingCode)!==0:queryReportingCode!==partReportingCode)) return 0;
      compared++;score+=descriptor.reportingCodePartial?24:42;
    }
    if(descriptor.range&&descriptor.range.start){
      if(!identifierQueryMatchesRange(part.range,descriptor.range)) return 0;
      if(descriptor.range.end) score+=60;
      else if(descriptor.range.partial) score+=46+descriptor.range.prefixLength;
      else score+=part.range&&part.range.end?56:60;
      compared++;
    }
    return compared?score:1;
  }
  function contactIdSemanticScore(template,query,prepared){
    var descriptors=prepared&&prepared.descriptors&&prepared.descriptors.length?prepared.descriptors:(prepared&&prepared.descriptor?[prepared.descriptor]:contactIdLookupDescriptors(query));
    var score=0;
    for(var i=0;i<descriptors.length;i++) score=Math.max(score,contactIdSemanticScoreForDescriptor(template,descriptors[i]));
    return score;
  }
  function siaSemanticScore(template,query,prepared){
    var part=siaTemplateParts(template);
    if(!part) return 0;
    var parsed=prepared&&prepared.sia?prepared.sia:parseSiaInput(query),clean=prepared&&prepared.clean!=null?prepared.clean:normalizeCode(query),code=parsed.reportingCode||'';
    if(!code&&/^[A-Z]{2}/.test(clean)) code=clean.slice(0,2);
    var target=parsed.target||'';
    if(!target&&code&&clean.indexOf(code)===0) target=clean.slice(2,6);
    var compared=0,score=100;
    if(code){
      var queryCode=normalizeCode(code),partCode=normalizeCode(part.reportingCode||'');
      if(!part.reportingCode||(parsed.reportingCodePartial?partCode.indexOf(queryCode)!==0:queryCode!==partCode)) return 0;
      compared++;score+=parsed.reportingCodePartial?26:45;
    }
    if(target){
      if(!part.range) return 0;
      if(parsed.targetPartial){
        if(!identifierQueryMatchesRange(part.range,{start:target,end:'',partial:true,prefixLength:target.length})) return 0;
        compared++;score+=46+target.length;
      }else{
        if(!numericRangeContains(part.range,target)) return 0;
        compared++;score+=part.range.end?55:60;
      }
    }
    return compared?score:1;
  }
  function signalStructureGate(){
    /* Account and partition are breakdown/context fields and never gate reporting-code rows. */
    return true;
  }
  function normalizedTemplatePrefix(template,format){
    if(format==='contact-id'){
      var part=cidTemplateParts(template);
      if(!part) return '';
      var out=String(part.status||'')+normalizeContactIdCode(String(part.eventId||'')+String(part.reportingCode||''));
      if(part.range&&part.range.start&&!part.range.placeholder) out+=normalizeContactIdCode(part.range.start);
      return out;
    }
    var sia=siaTemplateParts(template);
    if(!sia) return '';
    var out=normalizeCode(sia.reportingCode||'');
    if(sia.range&&sia.range.start&&!sia.range.placeholder) out+=normalizeCode(sia.range.start);
    return out;
  }
  function normalizedQueryPrefix(query,format){
    if(format==='contact-id'){
      var d=contactIdLookupDescriptor(query);
      if(!d) return '';
      var out=String(d.status||'')+normalizeContactIdCode(String(d.eventId||'')+String(d.reportingCode||''));
      if(d.range&&d.range.start) out+=normalizeContactIdCode(d.range.start);
      return out;
    }
    var p=parseSiaInput(query),out=normalizeCode(p.reportingCode||'');
    if(p.target) out+=normalizeCode(p.target);
    return out;
  }
  function approximateCodeScore(template,query,format,prepared){
    var target=normalizedTemplatePrefix(template,format),lookups=prepared&&prepared.lookupPrefixes&&prepared.lookupPrefixes.length?prepared.lookupPrefixes:[prepared&&prepared.lookupPrefix!=null?prepared.lookupPrefix:normalizedQueryPrefix(query,format)];
    if(!target) return 0;
    var best=0;
    lookups.forEach(function(lookup){if(!lookup)return;var prefix=commonPrefixLength(target,lookup);if(prefix>=3)best=Math.max(best,35+prefix);});
    return best;
  }
  function rowCodeScore(row,query,format,prepared){
    if(!signalStructureGate(query,format,prepared)) return 0;
    var variants=format==='contact-id'?row.contactIdVariants:row.siaVariants;
    var score=0;
    for(var i=0;i<variants.length;i++){
      var variant=variants[i];
      if(!variant.raw) continue;
      var semantic=format==='contact-id'?contactIdSemanticScore(variant.raw,query,prepared):siaSemanticScore(variant.raw,query,prepared);
      score=Math.max(score,semantic);
    }
    return score;
  }
  function rowApproxCodeScore(row,query,format,prepared){
    if(!signalStructureGate(query,format,prepared)) return 0;
    var variants=format==='contact-id'?row.contactIdVariants:row.siaVariants;
    var score=0;
    for(var i=0;i<variants.length;i++){
      var variant=variants[i];
      if(!variant.raw) continue;
      score=Math.max(score,approximateCodeScore(variant.raw,query,format,prepared));
    }
    return score;
  }
  function textProjectionKey(){
    var c=state.textSearchColumns||{};
    return [c.section!==false?1:0,c.definition!==false?1:0,c.description!==false?1:0,c.category!==false?1:0,c.severity!==false?1:0,c.direction!==false?1:0,c.contactId!==false?1:0,c.sia!==false?1:0].join('|');
  }
  function rowTextSearchText(row){
    row=row||{};
    var key=textProjectionKey();
    if(row._textProjectionKey===key) return row._textProjectionText||'';
    var parts=[];
    if(textSearchColumnEnabled('section')) parts.push(row.programmingSection||'',row.sectionTitle||'');
    if(textSearchColumnEnabled('definition')) parts.push(row.definition||'');
    /* Text-search settings define the searchable data independently from the
       current display layout. Description/category/severity search both CID and
       SIA metadata so a valid description never disappears merely because the
       other metadata toggle is selected. */
    if(textSearchColumnEnabled('description')) parts.push(row.cidDescription||'',row.siaDescription||'');
    if(textSearchColumnEnabled('category')) parts.push(row.cidCategory||'',row.siaCategory||'');
    if(textSearchColumnEnabled('severity')) parts.push(row.cidSeverity||'',row.siaSeverity||'');
    if(textSearchColumnEnabled('direction')) parts.push(row.dialerDirection||'');
    if(textSearchColumnEnabled('contactId')) parts.push(row.contactId||'');
    if(textSearchColumnEnabled('sia')) parts.push(row.sia||'');
    var text=normalizeText(parts.join(' '));
    row._textProjectionKey=key;
    row._textProjectionText=text;
    row._textProjectionTokens=text?text.split(' ').filter(Boolean):[];
    row._textProjectionPrefixIndex=prefixIndexForTokens(row._textProjectionTokens);
    return text;
  }
  function textFieldValuesForIndex(row,field){
    row=row||{};
    if(field==='section') return [row.programmingSection||'',row.sectionTitle||''];
    if(field==='definition') return [row.definition||''];
    if(field==='description') return [row.cidDescription||'',row.siaDescription||''];
    if(field==='category') return [row.cidCategory||'',row.siaCategory||''];
    if(field==='severity') return [row.cidSeverity||'',row.siaSeverity||''];
    if(field==='direction') return [row.dialerDirection||''];
    if(field==='contactId') return [row.contactId||''];
    if(field==='sia') return [row.sia||''];
    return [];
  }
  function textPrefixesForValues(values){
    var prefixes=Object.create(null);
    (values||[]).forEach(function(value){
      tokenizeText(value).forEach(function(token){
        addTokenPrefixes(prefixes,token);
        semanticWordSegmentsNormalized(token).forEach(function(segment){addTokenPrefixes(prefixes,segment.text);});
      });
    });
    return Object.keys(prefixes);
  }
  function buildTextPrefixIndex(){
    if(cachedTextPrefixIndex) return cachedTextPrefixIndex;
    var fields=['section','definition','description','category','severity','direction','contactId','sia'],index={};
    fields.forEach(function(field){index[field]=Object.create(null);});
    buildIndex().rows.forEach(function(row){
      fields.forEach(function(field){
        textPrefixesForValues(textFieldValuesForIndex(row,field)).forEach(function(prefix){
          var bucket=index[field][prefix];
          if(!bucket) bucket=index[field][prefix]=[];
          if(!bucket.length||bucket[bucket.length-1]!==row) bucket.push(row);
        });
      });
    });
    cachedTextPrefixIndex=index;
    return index;
  }
  function candidateRowsForTextQuery(prepared){
    prepared=prepared||{tokens:[]};
    var tokens=prepared.tokens||[];
    if(!tokens.length) return null;
    var fields=['section','definition','description','category','severity','direction','contactId','sia'].filter(textSearchColumnEnabled),index=buildTextPrefixIndex(),current=null;
    for(var t=0;t<tokens.length;t++){
      var token=tokens[t],tokenRows=Object.create(null),count=0;
      fields.forEach(function(field){
        var bucket=(index[field]&&index[field][token])||[];
        bucket.forEach(function(row){if(!tokenRows[row.id]){tokenRows[row.id]=row;count++;}});
      });
      /* No prefix candidate may still be a valid fuzzy typo; signal that the
         caller should use the full scan in that uncommon case. */
      if(!count) return null;
      if(current===null) current=tokenRows;
      else{
        var next=Object.create(null);
        Object.keys(current).forEach(function(id){if(tokenRows[id]) next[id]=current[id];});
        current=next;
        if(!Object.keys(current).length) return [];
      }
    }
    return current===null?null:Object.keys(current).map(function(id){return current[id];});
  }
  function prepareTextQuery(query){
    var q=normalizeText(query);
    return {normalized:q,tokens:q?q.split(' ').filter(Boolean):[]};
  }
  function orderedPhrasePrefixTokens(textTokens,queryTokens){
    if(!queryTokens.length||queryTokens.length>textTokens.length) return false;
    for(var start=0;start<=textTokens.length-queryTokens.length;start++){
      var ok=true;
      for(var i=0;i<queryTokens.length;i++){
        if(!normalizedWordMatchRange(textTokens[start+i],queryTokens[i],false)){ok=false;break;}
      }
      if(ok) return true;
    }
    return false;
  }
  function rowTextScore(row,query,prepared){
    var directionQuery=normalizedDirectionQuery(query);
    if(directionQuery) return String((row||{}).dialerDirection||'').toUpperCase()===directionQuery?180:0;
    prepared=prepared||prepareTextQuery(query);
    var q=prepared.normalized,queryTokens=prepared.tokens;
    if(!q) return 0;
    var definitionText=textSearchColumnEnabled('definition')?row.definitionText:'';
    var definitionTokens=textSearchColumnEnabled('definition')?(row.definitionTokens||tokenizeText(row.definitionText||'')):[];
    var sectionText=textSearchColumnEnabled('section')?(row.sectionProgrammingText||normalizeText([row.programmingSection||'',row.sectionTitle||''].join(' '))):'';
    var sectionTokens=textSearchColumnEnabled('section')?(row.sectionProgrammingTokens||tokenizeText(sectionText)):[];
    rowTextSearchText(row);
    var words=row._textProjectionTokens||[],projectionPrefixIndex=row._textProjectionPrefixIndex||Object.create(null);
    if(!row._definitionPrefixIndex) row._definitionPrefixIndex=prefixIndexForTokens(row.definitionTokens||[]);
    if(!row._sectionPrefixIndex) row._sectionPrefixIndex=prefixIndexForTokens(row.sectionProgrammingTokens||[]);
    function tokenPrefixMatch(textTokens,queryToken){
      for(var i=0;i<textTokens.length;i++) if(normalizedWordMatchRange(textTokens[i],queryToken,false)) return true;
      return false;
    }
    if(definitionText===q) return 150;
    if(definitionText&&((queryTokens.length===1&&row._definitionPrefixIndex[queryTokens[0]])||(queryTokens.length>1&&orderedPhrasePrefixTokens(definitionTokens,queryTokens)))) return 125;
    if(sectionText===q) return 105;
    if(sectionText&&((queryTokens.length===1&&row._sectionPrefixIndex[queryTokens[0]])||(queryTokens.length>1&&orderedPhrasePrefixTokens(sectionTokens,queryTokens)))) return 90;
    var fuzzyCount=0;
    if(queryTokens.length){
      var every=queryTokens.every(function(token){
        /* Exact/prefix/identifier-segment matching is an O(1) index lookup.
           Only fall back to the small fuzzy scan when no prefix exists. */
        if(projectionPrefixIndex[token]) return true;
        if(token.length<4) return false;
        var fuzzy=false;
        for(var i=0;i<words.length;i++){var hit=normalizedWordMatchRange(words[i],token,true);if(hit&&hit.quality===2){fuzzy=true;break;}}
        if(fuzzy){fuzzyCount++;return true;}
        return false;
      });
      if(every) return fuzzyCount?82+Math.max(0,8-fuzzyCount):100;
    }
    return 0;
  }
  function prepareCodeQuery(query,format){
    if(format==='contact-id'){
      var descriptors=contactIdLookupDescriptors(query),prefixes=descriptors.map(function(descriptor){
        var prefix=String(descriptor.status||'')+normalizeContactIdCode(String(descriptor.eventId||'')+String(descriptor.reportingCode||''));
        if(descriptor.range&&descriptor.range.start) prefix+=normalizeContactIdCode(descriptor.range.start);
        return prefix;
      }).filter(Boolean);
      return {format:format,descriptor:descriptors[0]||null,descriptors:descriptors,lookupPrefix:prefixes[0]||'',lookupPrefixes:prefixes,structureGate:true};
    }
    var parsed=parseSiaInput(query),clean=normalizeCode(query),siaPrefix=normalizeCode(parsed.reportingCode||'');
    if(parsed.target) siaPrefix+=normalizeCode(parsed.target);
    return {format:format,sia:parsed,clean:clean,lookupPrefix:siaPrefix,lookupPrefixes:[siaPrefix],structureGate:true};
  }
  function bestContactIdDescriptorForRows(query,rows){
    var descriptors=contactIdLookupDescriptors(query),best=null,bestScore=0;
    descriptors.forEach(function(descriptor){
      var score=0;
      (rows||[]).forEach(function(row){
        (row.contactIdVariants||[]).forEach(function(variant){score=Math.max(score,contactIdSemanticScoreForDescriptor(variant.raw,descriptor));});
      });
      if(score>bestScore){bestScore=score;best=descriptor;}
    });
    return best||descriptors[0]||null;
  }
  function allowsImplicitTextFallback(query,detection){
    if(!detection||detection.kind!=='code'||detection.format!=='contact-id') return false;
    var raw=String(query==null?'':query).trim();
    return /^[0-9A]{3,8}$/i.test(raw);
  }
  function rowRegularScore(row,query,detection,queryParts,preparedCode,preparedText){
    detection=detection||detectQueryType(query);
    var cidScore=0,siaScore=0;
    if(detection.kind==='code'&&detection.format){
      /* Once an entry is structurally recognized as a protocol code, match it
         only as that protocol. Punctuation in a Contact ID signal must not be
         reinterpreted as loose text tokens that create unrelated table rows. */
      queryParts=queryParts||splitPair(query);
      if(detection.format==='contact-id'){
        cidScore=rowCodeScore(row,query,'contact-id',preparedCode||prepareCodeQuery(query,'contact-id'));
        if(queryParts.length>1) queryParts.forEach(function(part){cidScore=Math.max(cidScore,rowCodeScore(row,part,'contact-id',prepareCodeQuery(part,'contact-id')));});
        return cidScore;
      }
      siaScore=rowCodeScore(row,query,'sia',preparedCode||prepareCodeQuery(query,'sia'));
      if(queryParts.length>1) queryParts.forEach(function(part){siaScore=Math.max(siaScore,rowCodeScore(row,part,'sia',prepareCodeQuery(part,'sia')));});
      return siaScore;
    }
    return rowTextScore(row,query,preparedText||prepareTextQuery(query));
  }
  function searchRows(query,forcedFormat,forcedMode){
    var queryText=String(query||'');
    var mode=forcedMode||'regular';
    if(mode==='regular'&&!forcedFormat&&cachedRegularRows&&cachedRegularQuery===queryText) return cachedRegularRows.slice();
    var rows=buildIndex().rows.slice();
    if(!queryText.trim()) return rows.map(function(row){row.__score=1;return row;});
    var detection=forcedFormat?{kind:'code',format:forcedFormat}:detectQueryType(queryText);
    /* Preserve the original regular-search behavior: forcedFormat controls the
       protocol fallback, while regular matching still classifies the actual
       query text on its own. */
    var scoringDetection=mode==='regular'?detectQueryType(queryText):detection;
    var queryParts=scoringDetection.kind==='code'&&scoringDetection.format?splitPair(queryText):[];
    var preparedCode=scoringDetection.kind==='code'&&scoringDetection.format?prepareCodeQuery(queryText,scoringDetection.format):null;
    var preparedText=scoringDetection.kind==='text'?prepareTextQuery(queryText):null;
    var fallbackPrepared=detection.kind==='code'&&detection.format?prepareCodeQuery(queryText,detection.format):null;
    if(scoringDetection.kind==='text'&&preparedText){var textCandidates=candidateRowsForTextQuery(preparedText);if(textCandidates!==null) rows=textCandidates.slice();}
    var matched=[];
    rows.forEach(function(row){
      var score=0;
      if(mode==='regular') score=rowRegularScore(row,queryText,scoringDetection,queryParts,preparedCode,preparedText);
      else if(detection.kind==='code'&&detection.format) score=rowCodeScore(row,queryText,detection.format,fallbackPrepared);
      else score=rowTextScore(row,queryText,preparedText||prepareTextQuery(queryText));
      if(score>0){row.__score=score;matched.push(row);}
    });
    /* Bare numeric Contact ID-like input can also be ordinary searchable text
       (for example 2108 in HSM2108 or 308 as a programming section). Prefer an
       actual protocol match; only if none exists, fall back to the text index. */
    if(!matched.length&&mode==='regular'&&!forcedFormat&&allowsImplicitTextFallback(queryText,scoringDetection)){
      var implicitPreparedText=prepareTextQuery(queryText),implicitCandidates=candidateRowsForTextQuery(implicitPreparedText),implicitRows=implicitCandidates===null?buildIndex().rows:implicitCandidates;
      implicitRows.forEach(function(row){var score=rowTextScore(row,queryText,implicitPreparedText);if(score>0){row.__score=score;matched.push(row);}});
    }
    /* Approximate protocol matching is a fallback, not an additional result set.
       This preserves Results only for exact identifiers (for example, KP1 only
       for E300001) while still giving a useful best match for a near miss such
       as OR0001 -> OR-0000. */
    if(!matched.length&&detection.kind==='code'&&detection.format){
      rows.forEach(function(row){
        var score=rowApproxCodeScore(row,queryText,detection.format,fallbackPrepared);
        if(score>0){row.__score=score;matched.push(row);}
      });
    }
    matched.sort(function(a,b){
      if((b.__score||0)!==(a.__score||0)) return (b.__score||0)-(a.__score||0);
      if(a.sectionIndex!==b.sectionIndex) return a.sectionIndex-b.sectionIndex;
      return a.rowIndex-b.rowIndex;
    });
    if(mode==='regular'&&!forcedFormat){cachedRegularQuery=queryText;cachedRegularRows=matched.slice();}
    return matched;
  }
  function groupedRows(rows){
    var groups=[],byId={};
    rows.forEach(function(row){
      if(!byId[row.sectionId]){byId[row.sectionId]={id:row.sectionId,title:row.sectionTitle,rows:[]};groups.push(byId[row.sectionId]);}
      byId[row.sectionId].rows.push(row);
    });
    return groups;
  }
  function groupedTableRows(allRows,matchedRows,query){
    var groups=[],byId={},hasQuery=!!String(query||'').trim();
    (allRows||[]).forEach(function(row){
      if(!byId[row.sectionId]){
        byId[row.sectionId]={id:row.sectionId,title:row.sectionTitle,allRows:[],rows:[],matchRows:[],matchCount:0};
        groups.push(byId[row.sectionId]);
      }
      byId[row.sectionId].allRows.push(row);
    });
    (matchedRows||[]).forEach(function(row){
      var group=byId[row.sectionId];
      if(group) group.matchRows.push(row);
    });
    groups.forEach(function(group){
      group.matchCount=group.matchRows.length;
      group.rows=hasQuery&&state.resultsOnly?group.matchRows:group.allRows;
    });
    return groups;
  }
  function hasOwn(obj,key){return Object.prototype.hasOwnProperty.call(obj||{},key);}
  function tableSectionIsOpen(group,query){
    if(hasOwn(state.sectionOpen,group.id)) return !!state.sectionOpen[group.id];
    if(state.tableSectionsOpen===true) return true;
    return !!(String(query||'').trim()&&group.matchCount>0);
  }
  function reportingReferenceJumpTarget(row){
    return row&&row.relatedSectionId?String(row.relatedSectionId):'';
  }
  function eventMeaning(eventId){
    var map={'1':'Alarm','2':'Supervisory / special event','3':'Trouble / tamper','4':'Open / close','5':'Bypass','6':'Test / maintenance','9':'Update / firmware'};
    return map[String(eventId||'').toUpperCase()]||'Event family';
  }
  function cidStateMeaning(status){return String(status||'').toUpperCase()==='R'?'Restore':'New event';}
  function cidTargetMeaning(value){
    var text=String(value||'');
    if(!text) return 'Zone / user / system';
    if(text==='000'||text==='AAA') return 'System event';
    var number=parseInt(text.replace(/A/g,'0'),10);
    if(isFinite(number)&&number>=1&&number<=128) return 'Zone '+number;
    if(isFinite(number)&&number>=129) return 'User / device / indexed event';
    return 'Zone / user / system';
  }
  function siaTargetMeaning(value){
    var text=decodeTransmittedZero(value||'');
    if(!text) return 'Zone / user / system';
    if(text==='0000') return 'System event';
    var number=parseInt(text,10);
    if(isFinite(number)&&number>=1&&number<=128) return 'Zone '+number;
    if(isFinite(number)&&number>=129) return 'User / device / indexed event';
    return 'Zone / user / system';
  }
  function parseContactIdInput(value){
    return parseContactIdBreakdownLayout(value);
  }
  function parseSiaInput(value){
    var raw=String(value==null?'':value),clean=normalizeCode(raw),account='',accountRaw='',accountPartial=false,partition='',reportingCode='',target='',hasNri=false,remainder=clean;
    var nriIndex=remainder.indexOf('NRI');
    if(nriIndex>=0){
      hasNri=true;
      var accountCandidate=remainder.slice(0,nriIndex);
      if(/^[0-9A]{1,6}$/i.test(accountCandidate)){
        accountRaw=accountCandidate.toUpperCase();account=displayPartialAccount(accountRaw);
        accountPartial=accountRaw.length!==4&&accountRaw.length!==6;
      }
      remainder=remainder.slice(nriIndex+3);
      if(breakdownFieldEnabled('partition')&&remainder&&/^[0-8A]/.test(remainder)){partition=remainder.charAt(0);remainder=remainder.slice(1);}
    }else{
      var compactAccount=compactSiaAccountPrefix(raw);
      if(compactAccount){
        account=compactAccount.account;accountRaw=compactAccount.accountRaw;accountPartial=!!compactAccount.accountPartial;
        reportingCode=compactAccount.reportingCode;remainder=compactAccount.target;
      }else if(breakdownFieldEnabled('partition')){
        if(/^[0-8][A-Z]/.test(remainder)){partition=remainder.charAt(0);remainder=remainder.slice(1);}
        else if(/^A[A-Z]{2}/.test(remainder)&&knownSiaPrefixes()[remainder.slice(1,3)]){partition='A';remainder=remainder.slice(1);}
      }
    }

    if(!reportingCode&&/^[A-Z]/.test(remainder)){
      reportingCode=remainder.slice(0,Math.min(2,(remainder.match(/^[A-Z]+/)||[''])[0].length));
      remainder=remainder.slice(reportingCode.length);
    }
    if(breakdownFieldEnabled('identifier')&&reportingCode.length===2) target=remainder.slice(0,4);
    var reportingCodePartial=!!(reportingCode&&reportingCode.length<2);
    var targetPartial=!!(target&&target.length<4);
    var canonical=(account?account+' ':'')+(hasNri?'Nri ':'')+(partition?partition+' ':'')+(reportingCode||'')+(target?' '+target:'');
    return {
      raw:raw,clean:clean,account:account,accountRaw:accountRaw,accountPartial:accountPartial,structure:hasNri?'Nri':'—',partition:partition,
      reportingCode:reportingCode,target:target,reportingCodePartial:reportingCodePartial,targetPartial:targetPartial,
      fullSignal:!!(hasNri&&account&&!accountPartial),canonical:canonical.trim(),looksLikeSignal:!!reportingCode
    };
  }
  function directionMeaning(value){
    var key=String(value||'').toUpperCase();
    var map={
      'A/R':'Alarm / restore','T/R':'Tamper / restore','O/C':'Opening / closing','MA/R':'Maintenance / restore','T':'Test transmission'
    };
    return map[key]||String(value||'Event / restore relationship');
  }
  function rangeInfoFromTemplate(value){
    var raw=String(value||'').trim();
    if(!raw) return null;
    var matches=raw.match(/-([0-9ZUXA]{3,4})(?:-([0-9ZUXA]{3,4}))?\s*$/i);
    if(!matches) return null;
    var start=String(matches[1]||''),end=String(matches[2]||'');
    var numericStart=/^\d+$/.test(start)?Number(start):null;
    var numericEnd=/^\d+$/.test(end)?Number(end):null;
    return {
      start:start,end:end,
      display:end?(start+'–'+end):start,
      count:(numericStart!=null&&numericEnd!=null&&numericEnd>=numericStart)?(numericEnd-numericStart+1):null,
      placeholder:/^[ZUX]+$/i.test(start),
      raw:raw
    };
  }
  function cidTemplateParts(value){
    var raw=String(value||'').trim();
    if(!raw) return null;
    var m=raw.match(/^([ER])\s*\(?\s*([0-9A-F])\s*\)?\s*([0-9A-F]{2})(?:-([0-9A-FZUX]{3,4})(?:-([0-9A-FZUX]{3,4}))?)?$/i);
    if(!m) return {raw:raw,status:'',eventId:'',reportingCode:'',range:rangeInfoFromTemplate(raw)};
    return {raw:raw,status:m[1].toUpperCase(),eventId:m[2].toUpperCase(),reportingCode:m[3].toUpperCase(),range:m[4]?{start:m[4].toUpperCase(),end:(m[5]||'').toUpperCase(),display:m[5]?(m[4].toUpperCase()+'–'+m[5].toUpperCase()):m[4].toUpperCase(),count:(/^\d+$/.test(m[4])&&/^\d+$/.test(m[5]||''))?(Number(m[5])-Number(m[4])+1):null,placeholder:/^[ZUX]+$/i.test(m[4])}:null};
  }
  function siaTemplateParts(value){
    var raw=String(value||'').trim();
    if(!raw) return null;
    var m=raw.match(/^([A-Z]{2})(?:-([0-9ZUX]{4})(?:-([0-9ZUX]{4}))?)?$/i);
    if(!m) return {raw:raw,reportingCode:'',range:rangeInfoFromTemplate(raw)};
    return {raw:raw,reportingCode:m[1].toUpperCase(),range:m[2]?{start:m[2].toUpperCase(),end:(m[3]||'').toUpperCase(),display:m[3]?(m[2].toUpperCase()+'–'+m[3].toUpperCase()):m[2].toUpperCase(),count:(/^\d+$/.test(m[2])&&/^\d+$/.test(m[3]||''))?(Number(m[3])-Number(m[2])+1):null,placeholder:/^[ZUX]+$/i.test(m[2])}:null};
  }
  function rowScope(row){
    var definition=String((row||{}).definition||'');
    var lower=definition.toLowerCase();
    var dash=definition.lastIndexOf(' - ');
    var suffix=dash>=0?definition.slice(dash+3).trim():'';
    if(/\bkeypads?\b/i.test(suffix)||/\bkeypad\s+\d+\b/i.test(definition)) return {label:suffix||((definition.match(/keypad\s+\d+/i)||[])[0]||'Keypads'),kind:'keypads'};
    if(/\bhsm2108\b/i.test(suffix||definition)) return {label:suffix||'HSM2108',kind:'HSM2108'};
    if(/\bhsm2208\b/i.test(suffix||definition)) return {label:suffix||'HSM2208',kind:'HSM2208'};
    if(/\bhsm2204\b/i.test(suffix||definition)) return {label:suffix||'HSM2204',kind:'HSM2204'};
    if(/\bhsm2300\b/i.test(suffix||definition)) return {label:suffix||'HSM2300',kind:'HSM2300'};
    if(/\bhsm2164rf\b/i.test(suffix||definition)) return {label:suffix||'HSM2164RF',kind:'HSM2164RF'};
    if(/\bhsm2host\b/i.test(suffix||definition)) return {label:suffix||'HSM2HOST',kind:'HSM2HOST'};
    if(/\bhsm2955\b/i.test(suffix||definition)) return {label:suffix||'HSM2955',kind:'HSM2955'};
    if(/\bsiren\s+\d+\b/i.test(definition)) return {label:(definition.match(/siren\s+\d+/i)||[])[0],kind:'wirelessSirens'};
    if(/\brepeater\s+\d+\b/i.test(definition)) return {label:(definition.match(/repeater\s+\d+/i)||[])[0],kind:'wirelessRepeaters'};
    if(/\bwireless zone\b/i.test(definition)||/\bzone\b/i.test(definition)) return {label:'Zone / zone identifier',kind:'zones'};
    if(/\buser\b/i.test(definition)) return {label:'User identifier',kind:'users'};
    if(/\bsystem\b/i.test(definition)&&!/zone/i.test(definition)) return {label:'System event',kind:'system'};
    if(suffix) return {label:suffix,kind:''};
    return {label:'Event identifier / indexed device',kind:''};
  }
  function neoFamilyMaximum(kind){
    var profiles=root.NEO_PANEL_MODEL_PROFILES||{};
    var keys=Object.keys(profiles),max=null;
    keys.forEach(function(key){
      var p=profiles[key]||{},value=null;
      if(kind==='keypads') value=p.keypads;
      else if(kind==='zones') value=p.maxZones;
      else if(kind==='users') value=p.users;
      else if(kind==='wirelessSirens') value=p.wirelessSirens;
      else if(kind==='wirelessRepeaters') value=p.wirelessRepeaters;
      else if(kind&&p.modules) value=p.modules[kind];
      value=Number(value);
      if(isFinite(value)) max=max==null?value:Math.max(max,value);
    });
    return max;
  }
  function identifierMeaning(row,range){
    var scope=rowScope(row), parts=[];
    if(range){
      if(range.placeholder){
        if(/^Z/i.test(range.start)) parts.push('Variable zone / device identifier');
        else if(/^U/i.test(range.start)) parts.push('Variable user identifier');
        else parts.push('Variable identifier');
      }else if(range.end){
        parts.push(scope.label+' identifiers '+range.display);
        if(range.count!=null) parts.push(String(range.count)+' identifier values');
      }else if(range.start){
        parts.push(scope.label+' identifier '+range.start);
      }
    }else parts.push(scope.label);
    var familyMax=neoFamilyMaximum(scope.kind);
    if(range&&range.count!=null&&familyMax!=null&&range.count===familyMax){
      parts.push('This range matches the PowerSeries NEO family maximum of '+familyMax+' '+(scope.kind==='keypads'?'keypads':scope.label)+'.');
    }else if(range&&range.count!=null&&familyMax!=null&&range.count!==familyMax){
      parts.push('The reporting identifier space contains '+range.count+' values; installed-device capacity remains model-dependent.');
    }
    return {scope:scope,summary:parts.join(' · ')};
  }
  function pairSemantic(value,format){
    var pair=splitPair(value), eventPart=pair[0]||'', restorePart=pair[1]||'';
    return {event:format==='contact-id'?cidTemplateParts(eventPart):siaTemplateParts(eventPart),restore:format==='contact-id'?cidTemplateParts(restorePart):siaTemplateParts(restorePart)};
  }
  function numericRangeBounds(range){
    if(!range||range.placeholder) return null;
    var startText=numericSignalDigits(range.start||''),endText=range.end?numericSignalDigits(range.end):'';
    if(!startText) return null;
    var start=Number(startText),end=endText?Number(endText):start;
    if(!isFinite(start)||!isFinite(end)||end<start) return null;
    return {start:start,end:end,count:end-start+1,width:String(range.start).length};
  }
  function formatIdentifier(value,width){return String(value).padStart(Math.max(1,Number(width)||3),'0');}
  function individualTemplatePart(part,format,index,total){
    if(!part) return '';
    var bounds=numericRangeBounds(part.range);
    if(!bounds||bounds.count!==total) return part.raw||'';
    var identifier=formatIdentifier(bounds.start+index,bounds.width);
    if(format==='contact-id') return (part.status||'')+'('+(part.eventId||'')+')'+(part.reportingCode||'')+'-'+identifier;
    return (part.reportingCode||'')+'-'+identifier;
  }
  function individualizePair(value,format,index,total){
    var semantic=pairSemantic(value,format),first=individualTemplatePart(semantic.event,format,index,total),second=individualTemplatePart(semantic.restore,format,index,total);
    return second?first+' / '+second:first;
  }
  function expandedInstanceLabel(row,identifier,index){
    var scope=rowScope(row),position=index+1;
    if(scope.kind==='keypads') return 'Keypad '+position;
    if(scope.kind==='HSM2108') return 'HSM2108 #'+position;
    if(scope.kind==='HSM2208') return 'HSM2208 #'+position;
    if(scope.kind==='HSM2204') return 'HSM2204 #'+position;
    if(scope.kind==='HSM2300') return 'HSM2300 #'+position;
    if(scope.kind==='HSM2164RF') return 'HSM2164RF #'+position;
    if(scope.kind==='HSM2HOST') return 'HSM2HOST #'+position;
    if(scope.kind==='HSM2955') return 'HSM2955 #'+position;
    if(scope.kind==='wirelessSirens') return 'Siren '+position;
    if(scope.kind==='wirelessRepeaters') return 'Repeater '+position;
    if(scope.kind==='zones') return 'Zone '+String(Number(identifier));
    if(scope.kind==='users') return 'User '+String(Number(identifier));
    return (scope.label&&scope.label!=='Event identifier / indexed device'?scope.label:'Identifier')+' '+position;
  }
  function expandedRowDefinition(row,identifier,index,total){
    var definition=String(row.definition||''),instance=expandedInstanceLabel(row,identifier,index);
    var dash=definition.lastIndexOf(' - ');
    if(dash>=0) return definition.slice(0,dash+3)+instance;
    return definition+' - '+instance;
  }
  function makeExpandedRow(row,index,total,bounds){
    var identifier=formatIdentifier(bounds.start+index,bounds.width);
    var contactId=individualizePair(row.contactId,'contact-id',index,total);
    var sia=individualizePair(row.sia,'sia',index,total);
    var instanceLabel=expandedInstanceLabel(row,identifier,index);
    var expanded=Object.assign({},row,{
      id:row.id+'-identifier-'+identifier,definition:expandedRowDefinition(row,identifier,index,total),contactId:contactId,sia:sia,
      __expandedRange:true,__sourceRow:row,__identifier:identifier,__rangePosition:index+1,__rangeCount:total,__instanceLabel:instanceLabel,
      reportingRelationship:{type:'identifier-instance',parentReportingRowId:row.id,identifier:identifier,instanceIndex:index+1,instanceLabel:instanceLabel}
    });
    expanded.contactIdVariants=codeVariants(contactId,'contact-id');
    expanded.siaVariants=codeVariants(sia,'sia');
    expanded.definitionText=normalizeText(expanded.definition);
    expanded.searchText=normalizeText([expanded.sectionTitle,expanded.programmingSection,expanded.definition,expanded.cidDescription,expanded.cidCategory||expanded.category,expanded.cidSeverity||expanded.severity,expanded.siaDescription,expanded.siaCategory,expanded.siaSeverity,expanded.dialerDirection,contactId,sia].join(' '));
    return expanded;
  }
  function expandedRowsForReferenceRow(row){
    var cid=pairSemantic((row||{}).contactId||'','contact-id');
    var sia=pairSemantic((row||{}).sia||'','sia');
    var range=(cid.event&&cid.event.range)||(cid.restore&&cid.restore.range)||(sia.event&&sia.event.range)||(sia.restore&&sia.restore.range)||null;
    var bounds=numericRangeBounds(range);
    if(!bounds||bounds.count<=1||bounds.count>128) return [row];
    var expanded=[];
    for(var i=0;i<bounds.count;i++) expanded.push(makeExpandedRow(row,i,bounds.count,bounds));
    return expanded;
  }
  function expandRowsForDisplay(rows,query,mode){
    if(state.rangeDisplay!=='expanded') return rows.slice();
    var out=[];
    rows.forEach(function(row){out=out.concat(expandedRowsForReferenceRow(row));});
    if(String(query||'').trim()){
      out=out.filter(function(row){return mode==='regular'?rowRegularScore(row,query)>0:(detectQueryType(query).format?rowCodeScore(row,query,detectQueryType(query).format)>0:rowTextScore(row,query)>0);});
    }
    return out;
  }
  function resultCategoryKeyForReference(row){
    var category=normalizeText(String((row||{}).sectionTitle||''));
    var name=normalizeText(String((row||{}).definition||''));
    var combined=category+' '+name;
    if(/alarm|burglary|fire|gas|holdup|panic|medical|heat|water|sprinkler|emergency|freeze/.test(combined) && !/trouble|restore|restoral|supervis/.test(name)) return 'alarm';
    if(/supervis/.test(combined)) return 'supervisory';
    if(/trouble|fault|failure|missing|loss|low battery|checksum|overcurrent|jam|interference|offline|out of paper/.test(combined)) return 'trouble';
    if(/opening|closing|open close|arm|disarm|late close|late to open|early open|keyswitch/.test(combined)) return 'open-close';
    if(/access|door|card|egress|request to exit|reader/.test(combined)) return 'access';
    if(/bypass|disable|unbypass|shunt/.test(combined)) return 'bypass-disable';
    if(/test|walk test|program|download|upload|event buffer|schedule|diagnostic|service request|firmware/.test(combined)) return 'test-misc';
    return 'system-other';
  }
  function resultCategoryLabel(value){
    var labels={all:'All',alarm:'Alarm',supervisory:'Supervisory',trouble:'Trouble','open-close':'Open / Close',access:'Access','bypass-disable':'Bypass / Disable','test-misc':'Test / Misc.','system-other':'System / Other'};
    return labels[value]||value;
  }
  function resultCategoryPass(value){
    return state.resultCategory==='all'||state.resultCategory===value;
  }
  function reportingFilters(){
    if(!state.filters||typeof state.filters!=='object') state.filters={reportingType:[],description:[],category:[],severity:[],direction:[]};
    ['reportingType','description','category','severity','direction'].forEach(function(key){if(!Array.isArray(state.filters[key])) state.filters[key]=[];});
    return state.filters;
  }
  function reportingFilterValues(row,field){
    if(field==='reportingType') return [String((row||{}).sectionTitle||'—')];
    if(field==='description') return reportingDescriptionLines(row||{});
    if(field==='category') return reportingCategoryLines(row||{});
    if(field==='severity') return reportingSeverityLines(row||{});
    if(field==='direction') return [String((row||{}).dialerDirection||'—')];
    return [];
  }
  function reportingFilterValue(row,field){return reportingFilterValues(row,field)[0]||'';}
  function rowPassesReportingFilters(row){
    var filters=reportingFilters();
    return ['reportingType','description','category','severity','direction'].every(function(field){
      var selected=filters[field]||[],values=reportingFilterValues(row,field);
      return !selected.length||selected.some(function(value){return values.indexOf(value)>=0;});
    });
  }
  function reportingFilterOptions(field){
    var values=[],seen={};
    buildIndex().rows.forEach(function(row){
      reportingFilterValues(row,field).forEach(function(value){
        if(!hasOwn(seen,value)){seen[value]=true;values.push(value);}
      });
    });
    if(field==='reportingType'){
      var typeOrder={};buildIndex().rows.forEach(function(row){if(!hasOwn(typeOrder,row.sectionTitle)) typeOrder[row.sectionTitle]=row.sectionIndex;});
      values.sort(function(a,b){return Number(typeOrder[a]||0)-Number(typeOrder[b]||0)||a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});});
    }else if(field==='direction'){
      var order=['A/R','T/R','O/C','MA/R','T','—'];
      values.sort(function(a,b){var ai=order.indexOf(a),bi=order.indexOf(b);if(ai<0)ai=99;if(bi<0)bi=99;return ai-bi||a.localeCompare(b);});
    }else values.sort(function(a,b){if(a==='—')return 1;if(b==='—')return -1;return a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});});
    return values;
  }
  function reportingTypeThemeKey(value){
    var key=String(value==null?'':value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    return key||'other';
  }
  function reportingTypeIdForTitle(title){
    var rows=buildIndex().rows,target=String(title||'');
    for(var i=0;i<rows.length;i++) if(String(rows[i].sectionTitle||'')===target) return rows[i].sectionId||reportingTypeThemeKey(target);
    return reportingTypeThemeKey(target);
  }
  function reportingTypeSwatch(sectionId,title){
    var key=reportingTypeThemeKey(sectionId||reportingTypeIdForTitle(title));
    return '<span class="reporting-type-swatch" data-reporting-type-theme="'+esc(key)+'" aria-hidden="true"></span>';
  }
  function reportingFilterFieldLabel(field){
    if(field==='reportingType') return 'Reporting code type';
    if(field==='description') return 'Description';
    if(field==='category') return 'Category';
    if(field==='severity') return 'Severity';
    if(field==='direction') return 'Direction';
    return field;
  }
  function reportingFilterOptionLabel(field,value){
    if(field==='direction'){
      var directions={'A/R':'Alarms / Restores','T/R':'Tampers / Restores','O/C':'Openings / Closings','MA/R':'Maintenance Alarms / Restores','T':'Test Transmissions','—':'No direction'};
      return directions[value]||value;
    }
    if(field==='category'){
      var categories={ArmDisarm:'Arm / Disarm',DoorAccess:'Door Access',PanicEmergency:'Panic / Emergency',Unclassified:'Unclassified','—':'Not mapped'};
      return categories[value]||value;
    }
    if(field==='severity'&&value==='—') return 'Not mapped';
    if(field==='description'&&value==='—') return 'Not mapped';
    return value;
  }
  function reportingFilterSelectionCount(){
    var filters=reportingFilters(),count=0;
    ['reportingType','description','category','severity','direction'].forEach(function(field){count+=filters[field].length;});
    return count;
  }
  function reportingFilterCheckbox(label,checked,attributes,extraClass,swatch){
    return '<label class="reporting-filter-check '+(extraClass||'')+'" '+attributes+'><input type="checkbox" '+(checked?'checked ':'')+'aria-label="'+esc(label)+'"><span class="reporting-filter-check-box" aria-hidden="true"></span>'+(swatch||'')+'<span class="reporting-filter-check-label">'+esc(label)+'</span></label>';
  }
  function renderResultCategoryFilters(total){
    if(!state.showFilters) return '';
    var fields=['reportingType','description','category','severity','direction'],filters=reportingFilters(),activeCount=reportingFilterSelectionCount();
    var allActive=activeCount===0;
    var fieldButtons=['all'].concat(fields).map(function(field){
      var label=field==='all'?'All':reportingFilterFieldLabel(field);
      var selected=field==='all'?[]:(filters[field]||[]);
      var open=state.filterField===field;
      var active=(field==='all'?allActive:open);
      return '<button type="button" class="zone-types-filter reporting-filter-field '+(active?'active ':'')+(selected.length?'has-selection':'')+'" data-reporting-filter-field="'+field+'" aria-pressed="'+(open?'true':'false')+'"><span>'+esc(label)+'</span>'+(selected.length?'<span class="reporting-filter-badge">'+String(selected.length)+'</span>':'')+'</button>';
    }).join('');
    var optionRow='';
    if(fields.indexOf(state.filterField)>=0){
      var field=state.filterField,selected=filters[field]||[],values=reportingFilterOptions(field),label=reportingFilterFieldLabel(field);
      var options=reportingFilterCheckbox('All',!selected.length,'data-reporting-filter-clear="'+field+'"','reporting-filter-check-field-all');
      options+=values.map(function(value){
        var on=selected.indexOf(value)>=0,optionLabel=reportingFilterOptionLabel(field,value),swatch='';
        if(field==='reportingType') swatch=reportingTypeSwatch(reportingTypeIdForTitle(value),value);
        return reportingFilterCheckbox(optionLabel,on,'data-reporting-filter-value="'+esc(value)+'" data-reporting-filter-kind="'+field+'" title="'+esc(optionLabel)+'"','reporting-filter-option',swatch);
      }).join('');
      optionRow='<div class="reporting-filter-options-row reporting-filter-checkbox-panel" data-reporting-filter-options><span class="reporting-filter-options-label">'+esc(label)+'</span><div class="reporting-filter-option-grid" role="group" aria-label="Filter by '+esc(label)+'">'+options+'</div></div>';
    }
    return '<div class="reporting-result-filter-panel reporting-filters-panel-v451" data-reporting-filters-panel><div class="reporting-filter-toolbar"><span class="zone-types-filter-label">Filters</span><div class="zone-types-filter-list reporting-filter-field-list" role="group" aria-label="Reporting code filter fields">'+fieldButtons+'</div><span class="reporting-result-count"><strong>'+String(total)+'</strong> results</span></div>'+optionRow+'</div>';
  }
  function reportingVisibilityColumns(){
    return [
      {key:'description',label:'Description',on:state.showDescription},
      {key:'category',label:'Category',on:state.showCategory},
      {key:'severity',label:'Severity',on:state.showSeverity},
      {key:'direction',label:'Direction',on:state.showDirection},
      {key:'contact-id',label:'Contact ID',on:state.showContactId},
      {key:'sia',label:'SIA',on:state.showSia}
    ];
  }
  function renderVisibilityToggle(){
    if(!state.showColumns) return '';
    var columns=reportingVisibilityColumns(),shown=columns.filter(function(column){return column.on;}).length,allOn=shown===columns.length;
    var checks=reportingFilterCheckbox('All columns',allOn,'data-reporting-column-all','reporting-filter-check-field-all');
    checks+=columns.map(function(column){return reportingFilterCheckbox(column.label,column.on,'data-reporting-visibility="'+column.key+'"','reporting-filter-option');}).join('');
    return '<div class="reporting-result-filter-panel reporting-columns-panel-v451" data-reporting-columns-panel><button type="button" class="reporting-columns-toolbar" data-reporting-columns-toggle aria-expanded="'+(state.columnsOpen?'true':'false')+'"><span class="reporting-columns-label">Columns</span><span class="reporting-columns-toolbar-right"><span class="reporting-columns-count">'+String(shown)+' shown</span><span class="reporting-columns-chevron" aria-hidden="true">▾</span></span></button><div class="reporting-columns-body" '+(state.columnsOpen?'':'hidden')+'><div class="reporting-filter-option-grid reporting-columns-grid" role="group" aria-label="Choose visible Reporting Codes columns">'+checks+'</div></div></div>';
  }
  function renderContactIdZeroDisplayToggle(){
    return '<div class="reporting-table-zero-control"><span class="reporting-table-control-label">CID zero</span><div class="reporting-table-toggle-strip reporting-cid-zero-toggle" aria-label="Contact ID reporting-code zero display">'+
      '<button type="button" class="'+(!state.contactIdZeroDisplay?'active':'')+'" data-reporting-cid-zero-display="a" aria-pressed="'+(!state.contactIdZeroDisplay?'true':'false')+'">A</button>'+
      '<button type="button" class="'+(state.contactIdZeroDisplay?'active':'')+'" data-reporting-cid-zero-display="0" aria-pressed="'+(state.contactIdZeroDisplay?'true':'false')+'">0</button>'+
    '</div></div>';
  }

  function renderContactIdQualifierDisplayToggle(){
    return '<div class="reporting-table-qualifier-control"><span class="reporting-table-control-label">CID E/R</span><div class="reporting-table-toggle-strip reporting-cid-qualifier-toggle" aria-label="Contact ID qualifier display">'+
      '<button type="button" class="'+(state.contactIdQualifierDisplay==='er'?'active':'')+'" data-reporting-cid-qualifier-display="er" aria-pressed="'+(state.contactIdQualifierDisplay==='er'?'true':'false')+'">E/R</button>'+
      '<button type="button" class="'+(state.contactIdQualifierDisplay==='13'?'active':'')+'" data-reporting-cid-qualifier-display="13" aria-pressed="'+(state.contactIdQualifierDisplay==='13'?'true':'false')+'">1/3</button>'+
    '</div></div>';
  }
  function renderSignalMatchSettings(){
    var fields=[
      {key:'account',label:'Account'},
      {key:'status',label:'E/R · SIA structure'},
      {key:'eventId',label:'Event ID (CID)'},
      {key:'reportingCode',label:'Reporting code'},
      {key:'partition',label:'Partition'},
      {key:'identifier',label:'Identifier'}
    ];
    var options=fields.map(function(field){return reportingFilterCheckbox(field.label,compareFieldEnabled(field.key),'data-reporting-breakdown-field="'+field.key+'"','reporting-settings-check');}).join('');
    return '<div class="reporting-settings-choice-group"><span class="reporting-table-control-label">Signal breakdown fields</span><div class="reporting-settings-check-grid" role="group" aria-label="Fields included in Signal Breakdown">'+options+'</div></div>';
  }
  function renderTextSearchSettings(){
    var fields=[
      {key:'section',label:'Section #'},
      {key:'definition',label:'Definition'},
      {key:'description',label:'Description (CID + SIA)'},
      {key:'category',label:'Category (CID + SIA)'},
      {key:'severity',label:'Severity (CID + SIA)'},
      {key:'direction',label:'Direction'},
      {key:'contactId',label:'Contact ID'},
      {key:'sia',label:'SIA'}
    ];
    var options=fields.map(function(field){return reportingFilterCheckbox(field.label,textSearchColumnEnabled(field.key),'data-reporting-text-search-field="'+field.key+'"','reporting-settings-check');}).join('');
    return '<div class="reporting-settings-choice-group reporting-text-search-settings"><span class="reporting-table-control-label">Text search columns</span><div class="reporting-settings-check-grid" role="group" aria-label="Columns included in text search">'+options+'</div></div>';
  }
  function renderSettingsPanel(){
    if(!state.settingsOpen) return '';
    var displayOptions=reportingFilterCheckbox('Show filters section',state.showFilters,'data-reporting-show-filters','reporting-settings-check')+
      reportingFilterCheckbox('Show columns section',state.showColumns,'data-reporting-show-columns','reporting-settings-check')+
      reportingFilterCheckbox('Reporting code type colors',state.reportingTypeColors,'data-reporting-type-colors','reporting-settings-check');
    var columnButtons=[1,2,3,4].map(function(value){return '<button type="button" class="'+(state.reportingTypeColumns===value?'active':'')+'" data-reporting-type-columns="'+value+'" aria-pressed="'+(state.reportingTypeColumns===value?'true':'false')+'">'+value+'</button>';}).join('');
    return '<div class="reporting-table-settings-panel reporting-settings-panel-v451 reporting-unified-settings-panel" data-reporting-settings-panel>'+
      renderSearchBehaviorSettings()+renderTextSearchSettings()+
      '<div class="reporting-settings-row"><span class="reporting-table-control-label">Display</span><div class="reporting-settings-check-grid reporting-settings-display-options" role="group" aria-label="Reporting Codes display options">'+displayOptions+'</div></div>'+
      '<div class="reporting-settings-row"><span class="reporting-table-control-label">View format</span><div class="reporting-table-toggle-strip reporting-view-mode-toggle" role="group" aria-label="Reporting Codes view format"><button type="button" class="'+(state.viewMode==='list'?'active':'')+'" data-reporting-view-mode="list" aria-pressed="'+(state.viewMode==='list'?'true':'false')+'">List</button><button type="button" class="'+(state.viewMode==='table'?'active':'')+'" data-reporting-view-mode="table" aria-pressed="'+(state.viewMode==='table'?'true':'false')+'">Table</button></div></div>'+
      '<div class="reporting-settings-row" '+(state.viewMode==='list'?'':'hidden')+'><span class="reporting-table-control-label">List layout</span><div class="reporting-list-layout-controls"><span>Reporting code type columns</span><div class="reporting-table-toggle-strip reporting-type-column-count-toggle" role="group" aria-label="Reporting code type columns">'+columnButtons+'</div></div></div>'+
      '<div class="reporting-settings-row reporting-cid-display-row"><span class="reporting-table-control-label">CID display</span><div class="reporting-cid-display-controls">'+renderContactIdZeroDisplayToggle()+renderContactIdQualifierDisplayToggle()+'</div></div>'+
    '</div>';
  }
  function renderSearchBehaviorSettings(){
    return '<div class="reporting-settings-choice-group reporting-search-behavior-settings"><span class="reporting-table-control-label">Search behavior</span><div class="reporting-table-toggle-strip reporting-search-behavior-toggle" role="group" aria-label="Reporting-code search behavior">'+
      '<button type="button" class="'+(state.resultsOnly?'active':'')+'" data-reporting-results-only aria-pressed="'+(state.resultsOnly?'true':'false')+'" title="Hide non-matching rows and categories">Results only</button>'+
      '<button type="button" class="'+(state.liveSearch?'active':'')+'" data-reporting-live-search aria-pressed="'+(state.liveSearch?'true':'false')+'" title="Search and update the signal breakdown while typing">Live</button>'+
    '</div></div>';
  }
  function renderSearchSettingsPanel(){
    if(!state.searchSettingsOpen) return '';
    return '<div class="reporting-search-settings-panel" data-reporting-search-settings-panel>'+renderSearchBehaviorSettings()+renderTextSearchSettings()+'</div>';
  }
  function renderMetadataSourceToggle(){
    return '<div class="reporting-table-metadata-control"><span class="reporting-table-control-label">Metadata</span><div class="reporting-table-toggle-strip reporting-metadata-source-toggle" aria-label="Metadata source for description, category, and severity">'+
      '<button type="button" class="'+(state.metadataSource==='cid'?'active':'')+'" data-reporting-metadata-source="cid" aria-pressed="'+(state.metadataSource==='cid'?'true':'false')+'">CID</button>'+
      '<button type="button" class="'+(state.metadataSource==='sia'?'active':'')+'" data-reporting-metadata-source="sia" aria-pressed="'+(state.metadataSource==='sia'?'true':'false')+'">SIA</button>'+
    '</div></div>';
  }
  function renderReportingMainSectionBulkControls(){
    return '<div class="reporting-search-bulk-controls reporting-main-section-bulk-controls" aria-label="Expand and collapse all Reporting Codes Tool main sections">'+
      '<button type="button" class="secondary compact-action-button compact-icon-action" data-reporting-main-sections="expand" aria-label="Expand all main sections" title="Expand all main sections"><span aria-hidden="true">＋</span></button>'+
      '<button type="button" class="secondary compact-action-button compact-icon-action" data-reporting-main-sections="collapse" aria-label="Collapse all main sections" title="Collapse all main sections"><span aria-hidden="true">−</span></button>'+
    '</div>';
  }
  function renderReportingTypeBulkControls(){
    var disabled=state.viewMode!=='list';
    return '<div class="reporting-table-type-bulk-controls" aria-label="Reporting code type expand and collapse all controls">'+
      '<button type="button" class="secondary compact-action-button compact-icon-action" data-reporting-table-sections="expand" aria-label="Expand all Reporting Code Types" title="'+(disabled?'Switch to List view to expand Reporting Code Types':'Expand all Reporting Code Types')+'" '+(disabled?'disabled':'')+'><span aria-hidden="true">＋</span></button>'+
      '<button type="button" class="secondary compact-action-button compact-icon-action" data-reporting-table-sections="collapse" aria-label="Collapse all Reporting Code Types" title="'+(disabled?'Switch to List view to collapse Reporting Code Types':'Collapse all Reporting Code Types')+'" '+(disabled?'disabled':'')+'><span aria-hidden="true">−</span></button>'+
    '</div>';
  }
  function renderSearchControls(detection,filtersHtml){
    var draft=String(state.draftQuery!=null?state.draftQuery:state.query||'');
    var placeholder=state.liveSearch?'Enter Contact ID, SIA, code, or text — live':'Enter Contact ID, SIA, code, or text — press Enter';
    var hasDraft=!!String(draft||state.query||'').length;
    return '<section class="card reporting-decoder-card reporting-decoder-search-card reporting-decoder-search-card-v349 reporting-decoder-search-card-v361 reporting-decoder-search-card-v362 reporting-decoder-search-card-v363 reporting-decoder-search-card-v369 reporting-decoder-search-card-v370 reporting-decoder-search-card-v373">'+
      '<div class="reporting-decoder-search-row">'+
        '<div class="search reporting-decoder-search-field reporting-global-search-field" role="search">'+
          '<input id="reportingCodeDecoderSearch" type="search" value="'+esc(draft)+'" aria-label="Contact ID, SIA, reporting code, or text" placeholder="'+esc(placeholder)+'" autocomplete="off" spellcheck="false">'+
          '<span class="workspace-search-input-actions reporting-search-input-actions">'+
            '<button type="button" class="workspace-search-clear reporting-search-clear '+(hasDraft?'is-visible':'')+'" data-reporting-clear aria-label="Clear reporting-code search" title="Clear search" '+(hasDraft?'':'disabled')+'><span aria-hidden="true">×</span></button>'+
            '<button type="button" class="workspace-search-submit reporting-search-submit" data-reporting-submit aria-label="Run reporting-code search" title="Search" '+(hasDraft?'':'disabled')+'><span aria-hidden="true">↵</span></button>'+
          '</span>'+
        '</div>'+
        '<div class="reporting-navigation-cluster">'+renderReportingToolsNavigation()+renderReportingMainSectionBulkControls()+'</div>'+
      '</div>'+(filtersHtml||'')+
    '</section>';
  }

  function reportingToolIsOpen(tool){
    if(tool==='structure') return !!state.structureVisible;
    if(tool==='breakdown') return !!state.breakdownOpen;
    if(tool==='table') return !!state.completeTableOpen;
    return false;
  }
  function setReportingToolOpen(tool,value){
    value=!!value;
    if(tool==='structure') state.structureVisible=value;
    if(tool==='breakdown') state.breakdownOpen=value;
    if(tool==='table') state.completeTableOpen=value;
  }
  function reportingSectionIsExpanded(tool){
    if(!state.sectionExpanded||typeof state.sectionExpanded!=='object') state.sectionExpanded={structure:true,breakdown:true,table:true};
    return state.sectionExpanded[tool]!==false;
  }
  function setReportingSectionExpanded(tool,value){
    if(!state.sectionExpanded||typeof state.sectionExpanded!=='object') state.sectionExpanded={structure:true,breakdown:true,table:true};
    if(['structure','breakdown','table'].indexOf(tool)>=0) state.sectionExpanded[tool]=!!value;
  }
  function syncReportingSectionExpandedDom(tool,expanded){
    if(!host) return false;
    var panel=host.querySelector('[data-reporting-tool-panel="'+tool+'"]');
    if(!panel) return false;
    expanded=!!expanded;
    panel.classList.toggle('is-open',expanded);
    panel.classList.toggle('is-collapsed',!expanded);
    var toggle=panel.querySelector('[data-reporting-section-toggle="'+tool+'"]');
    if(toggle){
      var labels={structure:'Signal Structure Reference',breakdown:'Signal Breakdown',table:'Reporting Codes'};
      var title=labels[tool]||'section';
      toggle.setAttribute('aria-expanded',expanded?'true':'false');
      toggle.setAttribute('aria-label',(expanded?'Collapse ':'Expand ')+title);
      toggle.setAttribute('title',(expanded?'Collapse ':'Expand ')+title);
    }
    var body=panel.querySelector('.reporting-top-level-section-body');
    if(body) body.hidden=!expanded;
    return !!toggle&&!!body;
  }
  function syncReportingNavigationCurrent(tool){
    if(!host) return;
    host.querySelectorAll('.reporting-tools-navigation-item').forEach(function(item){item.classList.toggle('current',!!item.querySelector('[data-reporting-tool="'+tool+'"]'));});
  }
  function reportingNavigationMatchStatus(){
    var query=String(state.query||'').trim();
    if(!query) return null;
    var detection=detectQueryType(query);
    if(!detection||detection.kind!=='code'||!detection.format) return null;
    return reportingMatchStatus(referenceCodeMatchSet(query,detection.format),detection.format,query);
  }
  function renderReportingToolsNavigation(){
    var tools=[
      {id:'structure',title:'Signal Structure Reference'},
      {id:'breakdown',title:'Signal Breakdown'},
      {id:'table',title:'Reporting Codes'}
    ],navigationMatch=reportingNavigationMatchStatus();
    return '<nav class="reporting-tools-navigation card" aria-label="Reporting Codes Tool sections">'+tools.map(function(tool){
      var active=reportingToolIsOpen(tool.id),current=state.activePanel===tool.id;
      var matchIndicator=tool.id==='breakdown'&&navigationMatch?'<span class="reporting-tool-match-indicator is-'+esc(navigationMatch.kind)+'" aria-label="'+esc(navigationMatch.detail)+'" title="'+esc(navigationMatch.detail)+'">!</span>':'';
      return '<div class="reporting-tools-navigation-item '+(active?'active ':'')+(current?'current':'')+'">'+
        '<button type="button" class="reporting-tools-navigation-button '+(active?'active':'')+'" data-reporting-tool="'+tool.id+'" aria-expanded="'+(active?'true':'false')+'" title="Open and go to '+esc(tool.title)+'"><span class="reporting-tool-button-label"><strong>'+esc(tool.title)+'</strong>'+matchIndicator+'</span></button>'+ 
        '<button type="button" class="reporting-tools-toggle-indicator '+(active?'active':'')+'" data-reporting-tool-toggle="'+tool.id+'" aria-pressed="'+(active?'true':'false')+'" aria-label="'+(active?'Hide ':'Show ')+esc(tool.title)+'" title="'+(active?'Hide':'Show')+' '+esc(tool.title)+'">'+(active?'−':'+')+'</button>'+ 
      '</div>';
    }).join('')+'</nav>';
  }

  function renderBreakdownCell(label,value,help,tone,matched,disabledPlaceholder){
    var fieldKey={account:'account',status:'status',eventid:'eventId',report:'reportingCode',partition:'partition',target:'identifier'}[tone]||'';
    var disabled=!!(fieldKey&&!breakdownFieldEnabled(fieldKey));
    var placeholder=disabledPlaceholder||({account:'XXXX',status:'X',eventid:'X',report:'XX',partition:'XX',target:'XXX'}[tone]||'X');
    var displayValue=disabled?placeholder:value;
    var displayHelp=disabled?'Not used in breakdown.':help;
    return '<article class="reporting-breakdown-cell '+(tone?'tone-'+esc(tone):'')+(matched&&!disabled?' is-field-match':'')+(disabled?' is-comparison-disabled':' is-comparison-enabled')+'"><span class="reporting-breakdown-label">'+esc(label)+'</span><strong>'+esc(displayValue)+'</strong><small>'+esc(displayHelp)+'</small></article>';
  }
  function displayRangeValue(range,width){
    if(!range||!range.start) return '';
    var start=decodeTransmittedZero(range.start||''),end=decodeTransmittedZero(range.end||'');
    if(range.partial){
      var targetWidth=Math.max(1,Number(width)||3);
      return start+Array(Math.max(0,targetWidth-start.length)+1).join('X');
    }
    if(width&&/^\d+$/.test(start)) start=start.padStart(width,'0');
    if(width&&/^\d+$/.test(end)) end=end.padStart(width,'0');
    return end ? ('('+start+' to '+end+')') : start;
  }
  function contactIdRowPart(row,status){
    if(!row) return null;
    var pair=pairSemantic(row.contactId||'','contact-id');
    if(String(status||'').toUpperCase()==='R' && pair.restore) return pair.restore;
    return pair.event||pair.restore||null;
  }
  function siaRowPart(row,preferRestore){
    if(!row) return null;
    var pair=pairSemantic(row.sia||'','sia');
    return preferRestore && pair.restore ? pair.restore : (pair.event||pair.restore||null);
  }
  function resolvedContactIdReconstructionFields(input,matchSet,options){
    input=input||{}; options=options||{};
    var unique=matchSet&&matchSet.unique?matchSet.unique:null;
    var rowPart=contactIdRowPart(unique,input.status);
    var queryRange=input.range||null;
    var rowRange=rowPart&&rowPart.range?rowPart.range:null;
    var targetRange=queryRange&&queryRange.start?queryRange:(unique&&rowRange?rowRange:null);
    var target='';
    if(targetRange&&targetRange.start) target=displayRangeValue(targetRange,3);
    else if(input.target) target=String(input.target);
    var reportingCode=decodeTransmittedZero(input.reportingCode||(rowPart&&rowPart.reportingCode)||'');
    if(input.reportingCodePartial&&input.reportingCode&&reportingCode.length<2) reportingCode+='X';
    var partition=decodeTransmittedZero(input.partition||'');
    if(input.partitionPartial&&partition&&partition.length<2) partition+='X';
    if(target&&!targetRange) target=decodeTransmittedZero(target);
    return {
      account:decodeTransmittedZero(input.account||''),
      status:String(input.status||''),
      eventId:decodeTransmittedZero(input.eventId||(rowPart&&rowPart.eventId)||''),
      reportingCode:reportingCode,
      partition:partition,
      target:target,
      targetRange:targetRange&&targetRange.end?targetRange:null,
      disabled:{account:!compareFieldEnabled('account'),status:!compareFieldEnabled('status'),eventId:!compareFieldEnabled('eventId'),reportingCode:!compareFieldEnabled('reportingCode'),partition:!compareFieldEnabled('partition'),target:!compareFieldEnabled('identifier')}
    };
  }
  function resolvedSiaReconstructionFields(input,matchSet){
    input=input||{};
    var unique=matchSet&&matchSet.unique?matchSet.unique:null;
    var rowPart=siaRowPart(unique,false);
    var rowRange=rowPart&&rowPart.range?rowPart.range:null;
    var target=input.target?decodeTransmittedZero(input.target):'';
    if(!target&&rowRange&&rowRange.start) target=displayRangeValue(rowRange,4);
    if(input.targetPartial&&target&&target.length<4) target+=Array(5-target.length).join('X');
    var reportingCode=String(input.reportingCode||(rowPart&&rowPart.reportingCode)||'');
    if(input.reportingCodePartial&&reportingCode&&reportingCode.length<2) reportingCode+='X';
    return {
      account:decodeTransmittedZero(input.account||''),
      structure:String((input.structure&&input.structure!=='—')?input.structure:''),
      partition:decodeTransmittedZero(input.partition||''),
      reportingCode:reportingCode,
      target:String(target||''),
      targetRange:rowRange&&rowRange.end&&!input.target?rowRange:null,
      disabled:{account:!compareFieldEnabled('account'),structure:!compareFieldEnabled('status'),partition:!compareFieldEnabled('partition'),reportingCode:!compareFieldEnabled('reportingCode'),target:!compareFieldEnabled('identifier')}
    };
  }
  function enteredContactIdFields(input){
    input=input||{};
    var reportingCode=String(input.reportingCode||'');
    if(input.reportingCodePartial&&reportingCode&&reportingCode.length<2) reportingCode+='X';
    var partition=String(input.partition||'');
    if(input.partitionPartial&&partition&&partition.length<2) partition+='X';
    var target=String(input.target||'');
    if(input.targetPartial&&target&&target.length<3) target+=Array(4-target.length).join('X');
    return {
      account:String(input.account||''),
      status:String(input.status||''),
      eventId:String(input.eventId||''),
      reportingCode:reportingCode,
      partition:partition,
      target:target,
      targetRange:null,
      disabled:{account:!compareFieldEnabled('account'),status:!compareFieldEnabled('status'),eventId:!compareFieldEnabled('eventId'),reportingCode:!compareFieldEnabled('reportingCode'),partition:!compareFieldEnabled('partition'),target:!compareFieldEnabled('identifier')}
    };
  }
  function enteredSiaFields(input){
    input=input||{};
    var reportingCode=String(input.reportingCode||'');
    if(input.reportingCodePartial&&reportingCode&&reportingCode.length<2) reportingCode+='X';
    var target=String(input.target||'');
    if(input.targetPartial&&target&&target.length<4) target+=Array(5-target.length).join('X');
    return {
      account:String(input.account||''),
      structure:String((input.structure&&input.structure!=='—')?input.structure:''),
      partition:String(input.partition||''),
      reportingCode:reportingCode,
      target:target,
      targetRange:null,
      disabled:{account:!compareFieldEnabled('account'),structure:!compareFieldEnabled('status'),partition:!compareFieldEnabled('partition'),reportingCode:!compareFieldEnabled('reportingCode'),target:!compareFieldEnabled('identifier')}
    };
  }
  function renderContactIdReconstruction(fields,signalClass){
    fields=fields||{};var disabled=fields.disabled||{};
    signalClass=signalClass||'reporting-reconstructed-signal';
    var account=fields.account||'XXXX',status=fields.status?contactIdQualifierDisplayValue(fields.status):'X',eventId=fields.eventId||'X',reportingCode=fields.reportingCode||'XX',partition=fields.partition||'XX',target=fields.target||'XXX';
    var targetRange=fields.targetRange&&fields.targetRange.end;
    function span(clsName,text,hasValue,isDisabled,extra,disabledText){
      var shown=isDisabled?disabledText:text;
      var valuePresent=isDisabled?false:hasValue;
      return '<span class="'+clsName+(!valuePresent?' is-placeholder':'')+(isDisabled?' is-breakdown-disabled':' is-compared-field')+(extra||'')+'">'+esc(shown)+'</span>';
    }
    return '<code class="reporting-colored-signal contact-id '+esc(signalClass)+'">'+
      span('signal-account',account,!!fields.account,!!disabled.account,'','XXXX')+
      span('signal-status',status,!!fields.status,!!disabled.status,'','X')+
      span('signal-eventid','('+eventId+')',!!fields.eventId,!!disabled.eventId,'','(X)')+
      span('signal-report',reportingCode,!!fields.reportingCode,!!disabled.reportingCode,'','XX')+
      span('signal-partition',partition,!!fields.partition,!!disabled.partition,'','XX')+
      span('signal-target',target,!!fields.target,!!disabled.target,targetRange?' is-range-value':'','XXX')+
    '</code>';
  }
  function renderSiaReconstruction(fields,signalClass){
    fields=fields||{};var disabled=fields.disabled||{};
    signalClass=signalClass||'reporting-reconstructed-signal';
    var account=fields.account||'XXXX',structure=fields.structure&&fields.structure!=='—'?fields.structure:'XXX',partition=fields.partition||'X',reportingCode=fields.reportingCode||'XX',target=fields.target||'XXXX';
    var targetRange=fields.targetRange&&fields.targetRange.end;
    function span(clsName,text,hasValue,isDisabled,extra,disabledText){
      var shown=isDisabled?disabledText:text;
      var valuePresent=isDisabled?false:hasValue;
      return '<span class="'+clsName+(!valuePresent?' is-placeholder':'')+(isDisabled?' is-breakdown-disabled':' is-compared-field')+(extra||'')+'">'+esc(shown)+'</span>';
    }
    return '<code class="reporting-colored-signal sia '+esc(signalClass)+'">'+
      span('signal-account',account,!!fields.account,!!disabled.account,'','XXXX')+
      span('signal-status',structure,!!fields.structure,!!disabled.structure,'','XXX')+
      span('signal-partition',partition,!!fields.partition,!!disabled.partition,'','X')+
      span('signal-report',reportingCode,!!fields.reportingCode,!!disabled.reportingCode,'','XX')+
      span('signal-target',target,!!fields.target,!!disabled.target,targetRange?' is-range-value':'','XXXX')+
    '</code>';
  }
  function renderEnteredSignal(query,format,descriptor){
    if(format==='contact-id'){
      if(descriptor&&(descriptor.kind==='code-list'||descriptor.kind==='compact-signal'||descriptor.kind==='numeric-code-list')){
        var range=descriptor.range||null;
        /* The Entered Signal must preserve what the user typed. A transmitted
           zero may be normalized internally as A for matching, but it must not
           be rewritten as A in this display. */
        return renderContactIdReconstruction(enteredContactIdFields({status:descriptor.status||'',eventId:descriptor.eventId||'',reportingCode:descriptor.reportingCode||descriptor.programmedReportingCode||'',partition:descriptor.partition||'',partitionPartial:!!descriptor.partitionPartial,target:range&&range.start?range.start:'',targetPartial:!!(range&&range.partial)}),'reporting-entered-signal');
      }
      return renderContactIdReconstruction(enteredContactIdFields(parseContactIdInput(query)),'reporting-entered-signal');
    }
    if(format==='sia') return renderSiaReconstruction(enteredSiaFields(parseSiaInput(query)),'reporting-entered-signal');
    return '<code class="reporting-entered-signal">'+esc(String(query==null?'':query).trim())+'</code>';
  }
  function renderSignalComparison(query,format,reconstruction,matchSummary,descriptor){
    return '<div class="reporting-breakdown-signal">'+
      '<span class="reporting-reconstruction-label">Entered signal</span>'+renderEnteredSignal(query,format,descriptor)+
      '<span class="reporting-reconstruction-label">Reconstructed signal</span>'+reconstruction+(matchSummary||'')+
    '</div>';
  }
  function rowInstanceForIdentifier(row,identifier){
    var normalizedIdentifier=numericSignalDigits(identifier||'');
    if(!row||!/^\d{3}$/.test(normalizedIdentifier)) return null;
    var cid=pairSemantic(row.contactId||'','contact-id');
    var range=(cid.event&&cid.event.range)||(cid.restore&&cid.restore.range)||null;
    var bounds=numericRangeBounds(range),value=Number(normalizedIdentifier);
    if(!bounds||value<bounds.start||value>bounds.end) return null;
    var index=value-bounds.start;
    return {identifier:formatIdentifier(value,bounds.width),index:index,position:index+1,label:expandedInstanceLabel(row,formatIdentifier(value,bounds.width),index)};
  }
  function matchedDefinitionForQuery(row,format,query){
    if(!row) return '';
    var definition=String(row.definition||'');
    if(format!=='contact-id') return definition;
    var descriptor=bestContactIdDescriptorForRows(query,[row])||contactIdLookupDescriptor(query),identifier='';
    if(descriptor&&descriptor.range&&!descriptor.range.end) identifier=descriptor.range.start||'';
    var instance=rowInstanceForIdentifier(row,identifier);
    if(!instance) return definition;
    var dash=definition.lastIndexOf(' - ');
    return dash>=0?definition.slice(0,dash+3)+instance.label:definition+' - '+instance.label;
  }
  function reportingMatchStatus(matchSet,format,query){
    if(!matchSet||!matchSet.topRows||!matchSet.topRows.length) return null;
    var exact=!!(matchSet.unique&&rowCodeScore(matchSet.unique,query,format)>0);
    if(exact) return {kind:'match',icon:'✓',label:'Match',detail:'1 reporting code match'};
    var count=matchSet.topRows.length;
    return {kind:'possible',icon:'!',label:'Possible match',detail:String(count)+' possible '+(count===1?'match':'matches')};
  }
  function renderMatchedCodeSummary(){
    /* v452: match state belongs on the Signal Breakdown navigation button,
       not inside the entered/reconstructed signal comparison. */
    return '';
  }
  function matchedCodesForQuery(row,format,query){
    if(!row) return {contactId:'',sia:''};
    if(format==='contact-id'){
      var descriptor=bestContactIdDescriptorForRows(query,[row])||contactIdLookupDescriptor(query),identifier=descriptor&&descriptor.range&&!descriptor.range.end?descriptor.range.start:'';
      var instance=identifier?rowInstanceForIdentifier(row,identifier):null;
      if(instance){
        var expanded=expandedRowsForReferenceRow(row);
        for(var i=0;i<expanded.length;i++) if(String(expanded[i].__identifier||'')===String(instance.identifier)) return {contactId:expanded[i].contactId||row.contactId,sia:expanded[i].sia||row.sia};
      }
    }
    return {contactId:row.contactId||'',sia:row.sia||''};
  }
  function matchedDisplayRowForQuery(row,format,query){
    if(!row) return null;
    if(format!=='contact-id') return row;
    var descriptor=bestContactIdDescriptorForRows(query,[row])||contactIdLookupDescriptor(query),identifier=descriptor&&descriptor.range&&!descriptor.range.end&&!descriptor.range.partial?descriptor.range.start:'';
    identifier=numericSignalDigits(identifier||'');
    if(!/^\d{3}$/.test(identifier)) return row;
    var expanded=expandedRowsForReferenceRow(row);
    for(var i=0;i<expanded.length;i++) if(String(expanded[i].__identifier||'')===identifier) return expanded[i];
    return row;
  }
  /* Ambiguous lookups only state the count. A specific reporting entry appears
     only after the decoded row-specific signal fields narrow the lookup to one row. */
  function renderReportingMatchCell(matchSet,format,query){
    if(!matchSet||!matchSet.topRows||!matchSet.topRows.length) return '';
    var status=reportingMatchStatus(matchSet,format,query)||{kind:'possible'};
    if(!matchSet.unique){
      return '<article class="reporting-best-match reporting-possible-summary"><a href="#reporting-tool-table" class="reporting-possible-matches-link" data-reporting-possible-matches title="Open these matches in Reporting Codes"><span>Possible reporting codes</span><strong>'+String(matchSet.topRows.length)+' matches</strong><small>Open the filtered Reporting Codes section to compare them.</small><span class="reporting-possible-matches-action">View matches in Reporting Codes <span aria-hidden="true">→</span></span></a></article>';
    }
    var row=matchSet.unique,displayRow=matchedDisplayRowForQuery(row,format,query)||row,definition=matchedDefinitionForQuery(row,format,query);
    var codeBits='';
    if(state.showContactId&&displayRow.contactId) codeBits+='<div><span>Contact ID</span><code>'+renderReferenceCodeLinesForTable(displayRow,'contact-id',format==='contact-id'?query:'')+'</code></div>';
    if(state.showSia&&displayRow.sia) codeBits+='<div><span>SIA</span><code>'+renderReferenceCodeLinesForTable(displayRow,'sia',format==='sia'?query:'')+'</code></div>';
    return '<article class="reporting-best-match is-'+status.kind+'"><div class="reporting-best-match-copy"><span>'+(status.kind==='match'?'Matched reporting code':'Best possible match')+'</span><strong>'+esc(definition)+'</strong><small>'+reportingTypeSwatch(row.sectionId,row.sectionTitle)+esc(row.sectionTitle||'')+(row.dialerDirection?' · '+esc(row.dialerDirection):'')+'</small></div>'+(codeBits?'<div class="reporting-best-match-codes">'+codeBits+'</div>':'')+'</article>';
  }
  function conciseIdentifierHelp(row,range){
    if(!range||!range.start) return 'Not supplied.';
    var start=decodeTransmittedZero(range.start),end=decodeTransmittedZero(range.end||'');
    if(range.partial) return 'Identifier prefix '+start+'.';
    if(row&&!range.end){
      var instance=rowInstanceForIdentifier(row,range.start);
      if(instance) return instance.label+'.';
    }
    if(range.end) return 'Range '+start+' to '+end+'.';
    return 'Identifier '+start+'.';
  }
  function contactIdBreakdownFieldMatches(query,matchSet){
    var descriptor=(matchSet&&matchSet.contactIdDescriptor)||contactIdLookupDescriptor(query)||{},source=descriptor.fullSignal||descriptor,rows=(matchSet&&matchSet.topRows)||[],parts=[];
    rows.forEach(function(row){
      var semantic=pairSemantic((row||{}).contactId||'','contact-id');
      if(semantic.event) parts.push(semantic.event);
      if(semantic.restore) parts.push(semantic.restore);
    });
    function any(fn){for(var i=0;i<parts.length;i++) if(fn(parts[i])) return true;return false;}
    var status=String(descriptor.status||''),eventId=normalizeContactIdCode(descriptor.eventId||''),report=normalizeContactIdCode(descriptor.reportingCode||''),range=descriptor.range||null;
    return {
      account:!!source.account,
      status:!!status&&any(function(part){return !part.status||part.status===status;}),
      eventid:!!eventId&&any(function(part){return normalizeContactIdCode(part.eventId||'')===eventId;}),
      report:!!report&&any(function(part){var value=normalizeContactIdCode(part.reportingCode||'');return descriptor.reportingCodePartial?value.indexOf(report)===0:value===report;}),
      partition:!!source.partition,
      target:!!(range&&range.start)&&any(function(part){return identifierQueryMatchesRange(part.range,range);})
    };
  }
  function siaBreakdownFieldMatches(query,matchSet){
    var input=parseSiaInput(query),rows=(matchSet&&matchSet.topRows)||[],parts=[];
    rows.forEach(function(row){var semantic=pairSemantic((row||{}).sia||'','sia');if(semantic.event) parts.push(semantic.event);if(semantic.restore) parts.push(semantic.restore);});
    function any(fn){for(var i=0;i<parts.length;i++) if(fn(parts[i])) return true;return false;}
    var code=normalizeCode(input.reportingCode||''),target=String(input.target||'');
    return {
      account:!!input.account,
      status:!!(input.structure&&input.structure!=='—'),
      partition:!!input.partition,
      report:!!code&&any(function(part){var value=normalizeCode(part.reportingCode||'');return input.reportingCodePartial?value.indexOf(code)===0:value===code;}),
      target:!!target&&any(function(part){return input.targetPartial?identifierQueryMatchesRange(part.range,{start:target,end:'',partial:true,prefixLength:target.length}):numericRangeContains(part.range,target);})
    };
  }
  function renderBreakdownMatchControls(formatLabel){
    var format=String(formatLabel||'').toLowerCase();
    var fields=[
      {key:'account',label:'Account'},
      {key:'status',label:format==='sia'?'SIA structure':(format==='contact id'?'E / R':'E/R · SIA')},
      {key:'eventId',label:'Event ID',cidOnly:true},
      {key:'reportingCode',label:'Reporting code'},
      {key:'partition',label:'Partition'},
      {key:'identifier',label:'Identifier'}
    ];
    if(format==='sia') fields=fields.filter(function(field){return !field.cidOnly;});
    var options=fields.map(function(field){
      return reportingFilterCheckbox(field.label,breakdownFieldEnabled(field.key),'data-reporting-breakdown-field="'+field.key+'"','reporting-breakdown-match-check');
    }).join('');
    return '<div class="reporting-breakdown-match-controls" data-reporting-breakdown-match-controls><span class="reporting-table-control-label">Breakdown fields</span><div class="reporting-breakdown-match-grid" role="group" aria-label="Fields included in Signal Breakdown">'+options+'</div></div>';
  }
  function renderBreakdownStart(formatLabel){
    if(!state.breakdownOpen) return '';
    var helper=formatLabel
      ? '<small><span class="reporting-inline-detected">Detected '+esc(formatLabel)+'</span> · enabled signal fields are decoded below.</small>'
      : '';
    var isOpen=reportingSectionIsExpanded('breakdown');
    return '<section id="reporting-tool-breakdown" data-reporting-tool-panel="breakdown" class="card reporting-decoder-card reporting-breakdown-card reporting-unified-breakdown reporting-breakdown-details '+(isOpen?'is-open':'is-collapsed')+'">'+
      '<div class="reporting-breakdown-summary reporting-top-level-section-head"><button type="button" class="reporting-section-toggle-left" data-reporting-section-toggle="breakdown" aria-expanded="'+(isOpen?'true':'false')+'" aria-label="'+(isOpen?'Collapse':'Expand')+' Signal Breakdown" title="'+(isOpen?'Collapse':'Expand')+' Signal Breakdown"><span aria-hidden="true">›</span></button><div class="reporting-breakdown-header-content"><div class="reporting-breakdown-header-line"><strong>Signal breakdown</strong>'+renderBreakdownMatchControls(formatLabel)+'</div>'+helper+'</div></div>'+ 
      '<div class="reporting-breakdown-body reporting-top-level-section-body" '+(isOpen?'':'hidden')+'>';
  }
  function renderBreakdownEnd(note){
    if(!state.breakdownOpen) return '';
    return (note?'<p class="reporting-breakdown-note">'+note+'</p>':'')+'</div></section>';
  }
  function renderBreakdown(query,detection,results){
    if(!state.breakdownOpen) return '';
    var applied=String(query||'').trim();
    if(!applied){
      return renderBreakdownStart('')+
        '<div class="reporting-breakdown-status">No signal detected.</div>'+
        renderBreakdownEnd('');
    }
    if(!detection||detection.kind!=='code'||!detection.format){
      return renderBreakdownStart('')+
        '<div class="reporting-breakdown-status">No signal detected.</div>'+
        renderBreakdownEnd('');
    }
    var protocolMatchSet=referenceCodeMatchSet(query,detection.format);
    if(!protocolMatchSet.topRows.length){
      return renderBreakdownStart('')+
        '<div class="reporting-breakdown-status">No signal detected.</div>'+
        renderBreakdownEnd('');
    }
    if(detection.format==='contact-id'){
      var listCid=parseContactIdCodeListInput(query);
      if(!listCid&&protocolMatchSet.contactIdDescriptor&&protocolMatchSet.contactIdDescriptor.kind==='numeric-code-list') listCid=protocolMatchSet.contactIdDescriptor;
      if(listCid){
        var listRange=listCid.range;
        var matchSet=protocolMatchSet;
        var fieldMatches=contactIdBreakdownFieldMatches(query,matchSet);
        var unique=matchSet.unique;
        var target=listRange?listRange.display:'';
        var programmed=(listCid.programmedReportingCode||'').replace(/0/g,'A');
        var rangeHelp=listRange?conciseIdentifierHelp(unique,listRange):'Not supplied.';
        var reconstructionFields=resolvedContactIdReconstructionFields({status:listCid.status,eventId:listCid.eventId,reportingCode:programmed,partition:listCid.partition||'',range:listRange},matchSet);
        var reconstruction=renderContactIdReconstruction(reconstructionFields);
        return renderBreakdownStart('Contact ID')+
          renderSignalComparison(query,'contact-id',reconstruction,renderMatchedCodeSummary(matchSet,'contact-id',query),listCid)+
          '<div class="reporting-breakdown-grid">'+
            renderBreakdownCell('Account Number','XXXX','Not supplied.','account',fieldMatches.account)+
            renderBreakdownCell('E / R',listCid.status?contactIdQualifierDisplayValue(listCid.status):'X',listCid.status?cidStateMeaning(listCid.status)+'.':'Not supplied.','status',fieldMatches.status)+
            renderBreakdownCell('Event ID',reconstructionFields.eventId||'X',reconstructionFields.eventId?eventMeaning(reconstructionFields.eventId):'Not supplied.','eventid',fieldMatches.eventid)+
            renderBreakdownCell('Reporting Code',reconstructionFields.reportingCode||'XX','A is decoded as 0.','report',fieldMatches.report)+
            renderBreakdownCell('Partition',reconstructionFields.partition||'XX',listCid.partition?(listCid.partitionPartial?'Partition prefix '+reconstructionFields.partition+'.':('Partition '+reconstructionFields.partition+'.')):(listCid.kind==='code-list'?'Not in code-list entry.':'Not supplied.'),'partition',fieldMatches.partition)+
            renderBreakdownCell((reconstructionFields.targetRange&&reconstructionFields.targetRange.end)||(listRange&&listRange.end)?'Identifier Range':'Identifier',reconstructionFields.target||'XXX',reconstructionFields.targetRange?'Matched range.':rangeHelp,'target',fieldMatches.target)+renderReportingMatchCell(matchSet,'contact-id',query)+
          '</div>'+renderBreakdownEnd('');
      }
      var cid=parseContactIdInput(query);
      var fullMatchSet=protocolMatchSet;
      var fullFieldMatches=contactIdBreakdownFieldMatches(query,fullMatchSet);
      var fullTargetRange=cid.target?{start:cid.target,end:'',display:cid.target,count:cid.targetPartial?null:1,isRange:false,partial:cid.targetPartial,prefixLength:cid.targetPartial?cid.target.length:0}:null;
      var fullReconstructionFields=resolvedContactIdReconstructionFields({
        account:cid.account,status:cid.status,eventId:cid.eventId,
        reportingCode:cid.reportingCode?String(cid.reportingCode).replace(/0/g,'A'):'',reportingCodePartial:cid.reportingCodePartial,
        partition:cid.partition,partitionPartial:cid.partitionPartial,target:cid.target,
        range:fullTargetRange
      },fullMatchSet);
      var reconstructedCid=renderContactIdReconstruction(fullReconstructionFields);
      return renderBreakdownStart('Contact ID')+
        renderSignalComparison(query,'contact-id',reconstructedCid,renderMatchedCodeSummary(fullMatchSet,'contact-id',query))+
        '<div class="reporting-breakdown-grid">'+
          renderBreakdownCell('Account Number',fullReconstructionFields.account||'XXXX',cid.account?'Account supplied.':'Not supplied.','account',fullFieldMatches.account)+
          renderBreakdownCell('E / R',fullReconstructionFields.status?contactIdQualifierDisplayValue(fullReconstructionFields.status):'X',cid.status?cidStateMeaning(cid.status)+'.':'Not supplied.','status',fullFieldMatches.status)+
          renderBreakdownCell('Event ID',fullReconstructionFields.eventId||'X',fullReconstructionFields.eventId?eventMeaning(fullReconstructionFields.eventId):'Not supplied.','eventid',fullFieldMatches.eventid)+
          renderBreakdownCell('Reporting Code',fullReconstructionFields.reportingCode||'XX','A is decoded as 0.','report',fullFieldMatches.report)+
          renderBreakdownCell('Partition',fullReconstructionFields.partition||'XX',cid.partition?(fullReconstructionFields.partition==='00'?'System event.':'Partition '+fullReconstructionFields.partition+'.'):'Not supplied.','partition',fullFieldMatches.partition)+
          renderBreakdownCell(fullReconstructionFields.targetRange?'Identifier Range':'Identifier',fullReconstructionFields.target||'XXX',fullReconstructionFields.target?(fullReconstructionFields.targetRange?'Matched range.':cidTargetMeaning(String(fullReconstructionFields.target).replace(/\s*→\s*.*/,''))+'.'):'Not supplied.','target',fullFieldMatches.target)+renderReportingMatchCell(fullMatchSet,'contact-id',query)+
        '</div>'+renderBreakdownEnd('');
    }
    if(detection.format==='sia'){
      var sia=parseSiaInput(query);
      var siaMatchSet=protocolMatchSet;
      var siaFieldMatches=siaBreakdownFieldMatches(query,siaMatchSet);
      var siaReconstructionFields=resolvedSiaReconstructionFields(sia,siaMatchSet);
      var reconstructedSia=renderSiaReconstruction(siaReconstructionFields);
      return renderBreakdownStart('SIA')+
        renderSignalComparison(query,'sia',reconstructedSia,renderMatchedCodeSummary(siaMatchSet,'sia',query))+
        '<div class="reporting-breakdown-grid reporting-breakdown-grid-sia">'+
          renderBreakdownCell('Account Number',siaReconstructionFields.account||'XXXX',sia.account?'Account supplied.':'Not supplied.','account',siaFieldMatches.account,'XXXX')+
          renderBreakdownCell('SIA Structure',siaReconstructionFields.structure||'XXX','SIA structure.','status',siaFieldMatches.status,'XXX')+
          renderBreakdownCell('Partition',siaReconstructionFields.partition||'X',sia.partition?(siaReconstructionFields.partition==='0'?'System event.':'Partition '+siaReconstructionFields.partition+'.'):'Not supplied.','partition',siaFieldMatches.partition,'X')+
          renderBreakdownCell('Reporting Code',siaReconstructionFields.reportingCode||'XX','SIA event code.','report',siaFieldMatches.report,'XX')+
          renderBreakdownCell(siaReconstructionFields.targetRange?'Identifier Range':'Identifier',siaReconstructionFields.target||'XXXX',siaReconstructionFields.target?(siaReconstructionFields.targetRange?'Matched range.':siaTargetMeaning(String(siaReconstructionFields.target).replace(/\s*→\s*.*/,''))+'.'):'Not supplied.','target',siaFieldMatches.target,'XXXX')+renderReportingMatchCell(siaMatchSet,'sia',query)+
        '</div>'+renderBreakdownEnd('For SIA, <code>A</code> is decoded as <code>0</code> only in numeric signal fields such as account, partition, and identifier. The two-letter SIA reporting code is never changed.');
    }
    return '';
  }
  function referenceCodeMatchSet(query,format){
    var key=String(format||'')+'\u0000'+String(query||'');
    if(cachedReferenceMatchSet&&cachedReferenceMatchKey===key) return cachedReferenceMatchSet;
    var rows=searchRows(query,format,'regular');
    if(!rows.length){cachedReferenceMatchKey=key;cachedReferenceMatchSet={rows:[],topRows:[],unique:null,topScore:0,contactIdDescriptor:format==='contact-id'?bestContactIdDescriptorForRows(query,[]):null};return cachedReferenceMatchSet;}
    /* Preserve the decoder's established full-query ranking semantics (including
       paired event/restore entries), but parse the query only once for this pass. */
    var prepared=prepareCodeQuery(query,format);
    var scored=rows.map(function(row){return {row:row,score:rowCodeScore(row,query,format,prepared)||rowApproxCodeScore(row,query,format,prepared)};}).filter(function(item){return item.score>0;});
    if(!scored.length){cachedReferenceMatchKey=key;cachedReferenceMatchSet={rows:[],topRows:[],unique:null,topScore:0,contactIdDescriptor:format==='contact-id'?bestContactIdDescriptorForRows(query,[]):null};return cachedReferenceMatchSet;}
    var topScore=Math.max.apply(null,scored.map(function(item){return item.score;}));
    var topRows=scored.filter(function(item){return item.score===topScore;}).map(function(item){return item.row;});
    cachedReferenceMatchKey=key;
    cachedReferenceMatchSet={rows:scored.map(function(item){return item.row;}),topRows:topRows,unique:topRows.length===1?topRows[0]:null,topScore:topScore,contactIdDescriptor:format==='contact-id'?bestContactIdDescriptorForRows(query,topRows):null};
    return cachedReferenceMatchSet;
  }
  function renderStructureReference(){
    if(!state.structureVisible) return '';
    var isOpen=reportingSectionIsExpanded('structure');
    return '<section id="reporting-tool-structure" data-reporting-tool-panel="structure" class="card reporting-decoder-card reporting-structure-card reporting-structure-card-inline '+(isOpen?'is-open':'is-collapsed')+'" data-reporting-structure-reference aria-label="Signal structure reference">'+
      '<div class="reporting-structure-inline-head reporting-top-level-section-head"><button type="button" class="reporting-section-toggle-left" data-reporting-section-toggle="structure" aria-expanded="'+(isOpen?'true':'false')+'" aria-label="'+(isOpen?'Collapse':'Expand')+' Signal Structure Reference" title="'+(isOpen?'Collapse':'Expand')+' Signal Structure Reference"><span aria-hidden="true">›</span></button><div><strong>Signal structure reference</strong><small>Contact ID and SIA field-by-field breakdown.</small></div></div>'+ 
      '<div class="reporting-structure-body reporting-top-level-section-body" '+(isOpen?'':'hidden')+'><div class="reporting-structure-grid">'+renderContactIdStructure()+renderSiaStructure()+'</div></div></section>';
  }

  function renderContactIdStructure(){
    return '<article class="reporting-structure-format"><h3>DTMF Contact ID</h3><div class="reporting-structure-strip contact-id"><span class="account">XXXX</span><span class="status">X</span><span class="eventid">X</span><span class="report">XX</span><span class="partition">XX</span><span class="target">XXX</span></div><div class="reporting-structure-legend">'+
      '<div class="tone-account"><strong>Account Number</strong><span>Account identifier.</span></div><div class="tone-status"><strong>E / R</strong><span>E = 1 = new event · R = 3 = restore</span></div><div class="tone-eventid"><strong>Event ID</strong><span>1 alarm · 3 trouble · 4 arm/disarm · 5 bypass · 6 test</span></div><div class="tone-report"><strong>Reporting Code</strong><span>Two-character event detail code.</span></div><div class="tone-partition"><strong>Partition</strong><span>01–08 = partitions · 00 = system event</span></div><div class="tone-target"><strong>Zone / User</strong><span>001–128 = zone · 000 = system event; other identifiers can represent users/devices.</span></div></div><div class="reporting-structure-example"><span>Full transmitted signal example</span><code class="reporting-example-signal contact-id"><span class="signal-account">1234</span><span class="signal-status">'+esc(contactIdQualifierDisplayValue('E'))+'</span><span class="signal-eventid">1</span><span class="signal-report">39</span><span class="signal-partition">01</span><span class="signal-target">000</span></code><p>Account 1234 · new alarm · code 39 · partition 1 · system ID 000.</p></div></article>';
  }
  function renderSiaStructure(){
    return '<article class="reporting-structure-format"><h3>SIA FSK</h3><div class="reporting-structure-strip sia"><span class="account">XXXX(XX)</span><span class="status">Nri</span><span class="partition">X</span><span class="report">XX</span><span class="target">XXXX</span></div><div class="reporting-structure-legend">'+
      '<div class="tone-account"><strong>Account Number</strong><span>Typically 4 digits; some accounts use 6.</span></div><div class="tone-status"><strong>Nri</strong><span>SIA message structure marker.</span></div><div class="tone-partition"><strong>Partition</strong><span>1–8 = partitions · 0 = system event</span></div><div class="tone-report"><strong>Reporting Code</strong><span>Two-letter SIA event code.</span></div><div class="tone-target"><strong>Zone / User</strong><span>0001–0128 = zones · 0000 = system event; other identifiers can represent users/devices.</span></div></div><div class="reporting-structure-example"><span>Full transmitted signal example</span><code class="reporting-example-signal sia"><span class="signal-account">1234</span><span class="signal-status">Nri</span><span class="signal-partition">1</span><span class="signal-report">BV</span><span class="signal-target">0000</span></code><p>Account 1234 · partition 1 · code BV · system ID 0000.</p></div></article>';
  }
  function tableColumnPlan(){
    /* v452: removing a column must remove its slot. Re-normalize the preferred
       widths across only the active columns so the remaining columns stay
       adjacent instead of leaving an oversized Definition band. */
    var base={section:8,definition:25,description:16,category:10,severity:8,direction:7,cid:13,sia:13};
    var visible=['section','definition'];
    if(state.showDescription) visible.push('description');
    if(state.showCategory) visible.push('category');
    if(state.showSeverity) visible.push('severity');
    if(state.showDirection) visible.push('direction');
    if(state.showContactId) visible.push('cid');
    if(state.showSia) visible.push('sia');
    var used=visible.reduce(function(sum,key){return sum+base[key];},0)||1;
    return visible.map(function(key){return {key:key,width:(base[key]/used)*100};});
  }
  function reportingTableMinWidth(){
    var preferred={section:76,definition:250,description:180,category:118,severity:92,direction:88,cid:148,sia:148};
    var width=tableColumnPlan().reduce(function(sum,column){return sum+(preferred[column.key]||120);},0);
    return Math.max(460,width);
  }
  function reportingTableStyle(){return ' style="--reporting-table-min-width:'+String(reportingTableMinWidth())+'px"';}
  function renderTableColgroup(){return '<colgroup>'+tableColumnPlan().map(function(col){return '<col class="reporting-col-'+col.key+'" style="width:'+col.width+'%">';}).join('')+'</colgroup>';}
  function renderTableHead(){
    var out='<tr><th class="reporting-section-head">Section #</th><th class="reporting-definition-head">Definition</th>';
    var metadataPrefix=metadataHeaderPrefix();
    if(state.showDescription) out+='<th class="reporting-description-head">'+metadataPrefix+' Description</th>';
    if(state.showCategory) out+='<th class="reporting-category-head">'+metadataPrefix+' Category</th>';
    if(state.showSeverity) out+='<th class="reporting-severity-head">'+metadataPrefix+' Severity</th>';
    if(state.showDirection) out+='<th class="reporting-direction-head">Direction</th>';
    if(state.showContactId) out+='<th class="reporting-contact-id-head">Contact ID</th>';
    if(state.showSia) out+='<th class="reporting-sia-head">SIA</th>';
    return out+'</tr>';
  }
  function renderReportingTypeTableRow(group,query,detection){
    var themeKey=reportingTypeThemeKey(group.id||group.title),count=(group.rows||[]).length;
    return '<tr class="reporting-table-type-row" data-reporting-type-theme="'+esc(themeKey)+'"><th colspan="'+String(tableColumnPlan().length)+'"><span class="reporting-table-type-row-title">'+reportingTypeSwatch(group.id,group.title)+'<strong>'+highlightTableValue(group.title,query,'text',detection)+'</strong></span><small>'+String(count)+' '+(count===1?'row':'rows')+'</small></th></tr>';
  }
  function rowExpansionRows(row){
    var expanded=expandedRowsForReferenceRow(row);
    return expanded.length>1?expanded:[];
  }
  function signalContextForTable(format,query){
    if(format==='contact-id'){
      var list=parseContactIdCodeListInput(query);
      if(list) return {account:'',partition:''};
      var full=parseContactIdInput(query);
      return {account:full.account||'',partition:full.partition||''};
    }
    var sia=parseSiaInput(query);
    return {account:sia.account||'',partition:sia.partition||''};
  }
  function tableIdentifierText(range,width){
    if(!range||!range.start) return width===4?'XXXX':'XXX';
    if(range.placeholder) return String(range.start||'').toUpperCase();
    var start=String(range.start||''),end=String(range.end||'');
    if(width&&/^\d+$/.test(start)) start=start.padStart(width,'0');
    if(width&&/^\d+$/.test(end)) end=end.padStart(width,'0');
    return end?'('+start+' to '+end+')':start;
  }
  function contactIdQualifierDisplayValue(value){
    var status=String(value||'').toUpperCase();
    if(state.contactIdQualifierDisplay==='13') return status==='E'?'1':(status==='R'?'3':status);
    return status;
  }
  function contactIdTableReportingCode(value){
    var raw=String(value==null?'':value).toUpperCase();
    return state.contactIdZeroDisplay?raw.replace(/A/g,'0'):raw.replace(/0/g,'A');
  }
  function renderContactIdTablePart(part,query){
    if(!part) return '';
    var descriptor=contactIdLookupDescriptor(query),core='';
    function maybeMark(value,on){return on?'<mark class="dsc-search-hit reporting-search-hit">'+esc(value)+'</mark>':esc(value);}
    var statusCompatible=!(descriptor&&descriptor.status)||descriptor.status===part.status;
    var fullCoreHit=!!(descriptor&&descriptor.status&&descriptor.eventId&&descriptor.reportingCode&&descriptor.status===part.status&&normalizeContactIdCode(descriptor.eventId)===normalizeContactIdCode(part.eventId)&&normalizeContactIdCode(descriptor.reportingCode)===normalizeContactIdCode(part.reportingCode));
    var exactIdentifierHit=false,identifierPrefixLength=0,identifierText=part.range?tableIdentifierText(part.range,3):'';
    var partialIdentifierHit=false,partialIdentifierPrefix='';
    if(descriptor&&descriptor.range&&descriptor.range.start&&part.range){
      var queryIdentifier=numericSignalDigits(descriptor.range.start),partIdentifier=numericSignalDigits(part.range.start);
      if(!descriptor.range.partial&&!descriptor.range.end&&!part.range.end){
        exactIdentifierHit=!!(queryIdentifier&&partIdentifier&&Number(queryIdentifier)===Number(partIdentifier));
        if(queryIdentifier&&partIdentifier) identifierPrefixLength=commonPrefixLength(queryIdentifier,partIdentifier);
      }else if(descriptor.range.partial&&queryIdentifier&&identifierQueryMatchesRange(part.range,descriptor.range)){
        partialIdentifierHit=true;partialIdentifierPrefix=queryIdentifier;
      }
    }
    function renderIdentifier(){
      if(!part.range) return '';
      if(exactIdentifierHit) return '<mark class="dsc-search-hit reporting-search-hit">'+esc(identifierText)+'</mark>';
      if(partialIdentifierHit&&partialIdentifierPrefix){
        /* Range parents remain compact, but still show the identifier fragment
           that caused the match. For e30020 against 201-216, highlight 20 in
           the displayed start of the range instead of highlighting only E(3)00. */
        var raw=String(identifierText||''),idx=raw.indexOf(partialIdentifierPrefix);
        if(idx>=0) return esc(raw.slice(0,idx))+'<mark class="dsc-search-hit reporting-search-hit">'+esc(raw.slice(idx,idx+partialIdentifierPrefix.length))+'</mark>'+esc(raw.slice(idx+partialIdentifierPrefix.length));
      }
      return esc(identifierText);
    }
    if(fullCoreHit&&exactIdentifierHit){
      core='<mark class="dsc-search-hit reporting-search-hit reporting-full-code-hit">'+esc(contactIdQualifierDisplayValue(part.status)+'('+part.eventId+')'+contactIdTableReportingCode(part.reportingCode||'')+'-'+identifierText)+'</mark>';
      return core;
    }
    /* When an identifier is a near miss, highlight the common identifier
       prefix as part of the same Contact ID hit. Example: a ...-550 lookup
       against ...-551 and ...-553 highlights E(3)30-55, not only E(3)30. */
    if(fullCoreHit&&identifierPrefixLength>0&&part.range&&!part.range.end){
      var displayCore=contactIdQualifierDisplayValue(part.status)+'('+part.eventId+')'+contactIdTableReportingCode(part.reportingCode||'');
      return '<mark class="dsc-search-hit reporting-search-hit">'+esc(displayCore+'-'+identifierText.slice(0,identifierPrefixLength))+'</mark>'+esc(identifierText.slice(identifierPrefixLength));
    }
    if(fullCoreHit) core='<mark class="dsc-search-hit reporting-search-hit">'+esc(contactIdQualifierDisplayValue(part.status)+'('+part.eventId+')'+contactIdTableReportingCode(part.reportingCode||''))+'</mark>';
    else{
      core+=maybeMark(contactIdQualifierDisplayValue(part.status),!!(descriptor&&descriptor.status&&descriptor.status===part.status));
      core+='('+maybeMark(part.eventId,!!(statusCompatible&&descriptor&&descriptor.eventId&&normalizeContactIdCode(descriptor.eventId)===normalizeContactIdCode(part.eventId)))+')';
      core+=maybeMark(contactIdTableReportingCode(part.reportingCode||''),!!(statusCompatible&&descriptor&&descriptor.reportingCode&&normalizeContactIdCode(descriptor.reportingCode)===normalizeContactIdCode(part.reportingCode)));
    }
    if(part.range) core+='-<wbr>'+renderIdentifier();
    return core||'—';
  }
  function renderSiaTablePart(part,query){
    if(!part) return '';
    var identifier=part.range?tableIdentifierText(part.range,4):'',raw=(part.reportingCode||'')+(identifier?'-'+identifier:'');
    /* For a single SIA identifier, highlight the complete normalized code so a
       near miss can still show its common prefix (OR0001 -> OR-0000). Range
       rows retain the range-aware renderer used by exact Results-only matches. */
    if(!part.range||!part.range.end){
      var hit=highlightCodeEquivalent(raw,query,'sia');
      if(hit.found) return hit.html;
    }
    var segments=[];
    if(part.reportingCode) segments.push(highlightTableValue(part.reportingCode,query,'sia',detectQueryType(query)));
    if(part.range) segments.push(identifier);
    return segments.join('-<wbr>')||'—';
  }
  function renderReferenceCodeForTable(row,format,query){
    var semantic=pairSemantic(format==='contact-id'?(row.contactId||''):(row.sia||''),format),parts=[];
    if(semantic.event) parts.push(format==='contact-id'?renderContactIdTablePart(semantic.event,query):renderSiaTablePart(semantic.event,query));
    if(semantic.restore) parts.push(format==='contact-id'?renderContactIdTablePart(semantic.restore,query):renderSiaTablePart(semantic.restore,query));
    return parts.filter(Boolean).join(' / ')||'—';
  }
  function renderReferenceCodeLinesForTable(row,format,query){
    var semantic=pairSemantic(format==='contact-id'?(row.contactId||''):(row.sia||''),format),parts=[];
    if(semantic.event) parts.push(format==='contact-id'?renderContactIdTablePart(semantic.event,query):renderSiaTablePart(semantic.event,query));
    if(semantic.restore) parts.push(format==='contact-id'?renderContactIdTablePart(semantic.restore,query):renderSiaTablePart(semantic.restore,query));
    parts=parts.filter(Boolean);
    if(!parts.length) return '—';
    return '<span class="reporting-code-lines">'+parts.map(function(part){return '<span class="reporting-code-line">'+part+'</span>';}).join('')+'</span>';
  }
  function renderTableRow(row,query,detection,isResult,showTypeBadge){
    var expanded=rowExpansionRows(row),expandable=expanded.length>1;
    isResult=!!isResult;
    var exactDisplayRow=isResult&&detection&&detection.kind==='code'&&detection.format?matchedDisplayRowForQuery(row,detection.format,query):null;
    var autoOpenExactInstance=!!(exactDisplayRow&&exactDisplayRow.__expandedRange);
    var isOpen=!!state.expandedRows[row.id]||autoOpenExactInstance;
    var toggle=expandable?'<button type="button" class="reporting-row-expand" data-reporting-row-expand="'+esc(row.id)+'" aria-expanded="'+(isOpen?'true':'false')+'" title="'+(isOpen?'Collapse individual codes':'Expand individual codes')+'"><span aria-hidden="true">›</span></button>':'';
    var jumpTarget=reportingReferenceJumpTarget(row);
    var definitionContent=jumpTarget
      ? '<button type="button" class="reporting-reference-jump-link" data-reporting-jump-section="'+esc(jumpTarget)+'" title="Open Contact ID &amp; SIA Zone Alarm/Restore Event Codes">'+highlightTableValue(row.definition,query,'text',detection)+'</button>'
      : '<strong>'+highlightTableValue(row.definition,query,'text',detection)+'</strong>';
    var typeBadge=showTypeBadge?'<span class="reporting-row-type-badge">'+reportingTypeSwatch(row.sectionId,row.sectionTitle)+'<span>'+highlightTableValue(row.sectionTitle||'—',query,'text',detection)+'</span></span>':'';
    var definitionHtml=typeBadge+'<div class="reporting-definition-with-expand">'+toggle+definitionContent+'</div>';
    var themeKey=reportingTypeThemeKey(row.sectionId||row.sectionTitle);
    var out='<tr class="reporting-parent-row '+(isResult?'reporting-result-row ':'')+(expandable?'has-code-range ':'')+(isOpen?'is-range-open':'')+'" data-reporting-type-theme="'+esc(themeKey)+'" data-reporting-parent-row="'+esc(row.id)+'"><td class="reporting-section-cell">'+highlightTableValue(row.programmingSection||'—',query,'text',detection)+'</td><td class="reporting-definition-cell">'+definitionHtml+'</td>';
    if(state.showDescription) out+='<td class="reporting-description-cell">'+renderDescriptionLinesForRow(row,query,detection)+'</td>';
    if(state.showCategory) out+='<td class="reporting-category-cell">'+renderCategoryLinesForRow(row,query,detection)+'</td>';
    if(state.showSeverity) out+='<td class="reporting-severity-cell">'+renderSeverityLinesForRow(row,query,detection)+'</td>';
    if(state.showDirection) out+='<td class="reporting-direction-cell">'+renderDirectionLinesForRow(row,query,detection)+'</td>';
    if(state.showContactId) out+='<td class="reporting-code-cell reporting-contact-id-cell"><code>'+renderReferenceCodeLinesForTable(row,'contact-id',query)+'</code></td>';
    if(state.showSia) out+='<td class="reporting-code-cell reporting-sia-cell"><code>'+renderReferenceCodeLinesForTable(row,'sia',query)+'</code></td>';
    out+='</tr>';
    if(expandable&&isOpen) out+=renderExpandedRangeRow(row,expanded,query,detection,exactDisplayRow);
    return out;
  }
  function renderExpandedRangeRow(row,expanded,query,detection,exactDisplayRow){
    var out='',hasQuery=!!String(query||'').trim();
    var visibleExpanded=expanded.slice();
    /* Results only applies to expanded range instances too. When a full signal
       resolves to one exact identifier (for example E(3)00-001), keep the
       range parent for context but render only that matching instance row. */
    if(state.resultsOnly&&hasQuery){
      if(exactDisplayRow&&exactDisplayRow.__expandedRange&&exactDisplayRow.__identifier){
        visibleExpanded=visibleExpanded.filter(function(item){
          return String(item.__identifier||'')===String(exactDisplayRow.__identifier||'');
        });
      }else{
        visibleExpanded=visibleExpanded.filter(function(item){
          if(detection&&detection.kind==='code'&&detection.format) return rowCodeScore(item,query,detection.format)>0;
          return rowTextScore(item,query)>0;
        });
      }
    }
    visibleExpanded.forEach(function(item){
      var itemMatches=false;
      if(hasQuery){
        if(detection&&detection.kind==='code'&&detection.format) itemMatches=rowCodeScore(item,query,detection.format)>0;
        else itemMatches=rowTextScore(item,query)>0;
      }
      var definition='<div class="reporting-expanded-definition"><strong>'+highlightTableValue(item.definition,query,'text',detection)+'</strong></div>';
      out+='<tr class="reporting-range-child-row '+(itemMatches?'reporting-result-row reporting-instance-result-row':'')+'" data-reporting-range-parent="'+esc(row.id)+'" data-reporting-instance-id="'+esc(item.__identifier||'')+'"><td class="reporting-section-cell">'+highlightTableValue(item.programmingSection||row.programmingSection||'—',query,'text',detection)+'</td><td class="reporting-definition-cell">'+definition+'</td>';
      if(state.showDescription) out+='<td class="reporting-description-cell">'+renderDescriptionLinesForRow(item||row,query,detection)+'</td>';
      if(state.showCategory) out+='<td class="reporting-category-cell">'+renderCategoryLinesForRow(item||row,query,detection)+'</td>';
      if(state.showSeverity) out+='<td class="reporting-severity-cell">'+renderSeverityLinesForRow(item||row,query,detection)+'</td>';
      if(state.showDirection) out+='<td class="reporting-direction-cell">'+renderDirectionLinesForRow(item||row,query,detection)+'</td>';
      if(state.showContactId) out+='<td class="reporting-code-cell reporting-contact-id-cell"><code>'+renderReferenceCodeLinesForTable(item,'contact-id',query)+'</code></td>';
      if(state.showSia) out+='<td class="reporting-code-cell reporting-sia-cell"><code>'+renderReferenceCodeLinesForTable(item,'sia',query)+'</code></td>';
      out+='</tr>';
    });
    return out;
  }
  function renderTablesCard(groups,query,totalRows,detection,options){
    options=options||{};
    var hasQuery=!!String(query||'').trim();
    if(hasQuery&&state.resultsOnly) groups=groups.filter(function(group){return group.matchCount>0;});
    var totalAvailable=Number(options.totalAvailable||0);
    var matchedGroups=groups.filter(function(group){return group.matchCount>0;}).length;
    var status=hasQuery
      ? (String(totalRows)+' results in '+String(matchedGroups)+' '+(matchedGroups===1?'reporting code type':'reporting code types')+'.'+(state.resultsOnly?' Results only.':''))
      : (String(totalAvailable||totalRows)+' reporting codes available. Reporting code types are collapsed for browsing.');
    var actions='<div class="reporting-decoder-head-actions reporting-table-head-actions">'+renderMetadataSourceToggle()+renderReportingTypeBulkControls()+'</div>';
    var colorClass=state.reportingTypeColors?'reporting-type-colors-enabled':'reporting-type-colors-disabled';
    if(!state.completeTableOpen) return '';
    var isOpen=reportingSectionIsExpanded('table');
    var html='<section id="reporting-tool-table" data-reporting-tool-panel="table" class="card reporting-decoder-card reporting-table-card reporting-complete-table-details '+colorClass+' reporting-view-'+esc(state.viewMode)+' '+(isOpen?'is-open':'is-collapsed')+'"><div class="reporting-complete-table-summary reporting-top-level-section-head"><button type="button" class="reporting-section-toggle-left" data-reporting-section-toggle="table" aria-expanded="'+(isOpen?'true':'false')+'" aria-label="'+(isOpen?'Collapse':'Expand')+' Reporting Codes" title="'+(isOpen?'Collapse':'Expand')+' Reporting Codes"><span aria-hidden="true">›</span></button><span class="reporting-complete-table-title"><strong>Reporting Codes</strong><small>'+esc(status)+'</small></span>'+actions+'</div><div class="reporting-complete-table-body reporting-top-level-section-body" '+(isOpen?'':'hidden')+'>'+renderVisibilityToggle();
    if(!groups.length) return html+'<div class="workspace-empty-state"><strong>No matching results</strong><span>'+(hasQuery?'No reporting-code rows match the current entry and filters.':'Clear the Reporting code type filter to restore the reporting-code list.')+'</span></div></div></section>';
    var matchIds={};
    groups.forEach(function(group){group.matchRows.forEach(function(row){matchIds[row.id]=true;});});
    if(state.viewMode==='table'){
      var flatBody=groups.map(function(group){
        if(!group.rows.length) return '';
        return renderReportingTypeTableRow(group,query,detection)+group.rows.map(function(row){return renderTableRow(row,query,detection,!!matchIds[row.id],false);}).join('');
      }).join('');
      html+='<div class="reporting-flat-table-view"><div class="reporting-table-scroll"><table class="reporting-decoder-table reporting-flat-table"'+reportingTableStyle()+'>'+renderTableColgroup()+'<thead>'+renderTableHead()+'</thead><tbody>'+flatBody+'</tbody></table></div></div>';
      return html+'</div></section>';
    }
    html+='<div class="reporting-table-sections reporting-type-grid reporting-type-columns-'+String(state.reportingTypeColumns)+'" style="--reporting-type-columns:'+String(state.reportingTypeColumns)+'">';
    groups.forEach(function(group){
      var sectionOpen=tableSectionIsOpen(group,query),themeKey=reportingTypeThemeKey(group.id||group.title);
      var resultDot=hasQuery&&group.matchCount>0?'<span class="reporting-category-result-dot" aria-label="'+String(group.matchCount)+' matching results" title="'+String(group.matchCount)+' matching results"></span>':'';
      var countLabel=hasQuery?(group.matchCount?String(group.matchCount)+' '+(group.matchCount===1?'match':'matches'):'No matches'):String(group.allRows.length)+' rows';
      var body='';
      if(group.rows.length){
        body='<div class="reporting-table-scroll"><table class="reporting-decoder-table"'+reportingTableStyle()+'>'+renderTableColgroup()+'<thead>'+renderTableHead()+'</thead><tbody>'+group.rows.map(function(row){return renderTableRow(row,query,detection,!!matchIds[row.id]);}).join('')+'</tbody></table></div>';
      }else{
        body='<div class="workspace-empty-state reporting-category-empty"><strong>No matches in this reporting code type</strong><span>Change the entry above or clear it to browse all '+String(group.allRows.length)+' rows in this type.</span></div>';
      }
      html+='<details id="reporting-section-'+esc(group.id)+'" class="reporting-table-section reporting-type-section program-style-category" data-reporting-type-theme="'+esc(themeKey)+'" data-reporting-section-id="'+esc(group.id)+'" '+(hasQuery&&group.matchCount>0?'data-reporting-has-results="true" ':'')+(sectionOpen?'open':'')+'><summary><strong><span class="reporting-type-title">'+reportingTypeSwatch(group.id,group.title)+'<span>'+highlightTableValue(group.title,query,'text',detection)+'</span></span>'+resultDot+'</strong><small>'+esc(countLabel)+'</small></summary>'+body+'</details>';
    });
    return html+'</div></div></section>';
  }

  function queryHasValidSignalMatch(query){
    var text=String(query||'').trim();
    if(!text) return false;
    var detection=detectQueryType(text);
    if(!detection||detection.kind!=='code'||!detection.format) return false;
    return referenceCodeMatchSet(text,detection.format).topRows.length>0;
  }
  function beginReportingLoading(label){
    return root&&typeof root.dscBeginWorkspaceLoading==='function'?root.dscBeginWorkspaceLoading(label||'Searching reporting codes…'):0;
  }
  function finishReportingLoading(runId){
    var done=function(){if(root&&typeof root.dscFinishWorkspaceLoading==='function') root.dscFinishWorkspaceLoading(runId);};
    if(root&&root.requestAnimationFrame) root.requestAnimationFrame(function(){root.requestAnimationFrame(done);});
    else if(root&&root.setTimeout) root.setTimeout(done,40);
    else done();
  }
  function appliedRowsForQuery(query){
    var text=String(query||'').trim();
    if(!text) return [];
    var detection=detectQueryType(text),rows;
    /* Keep the Reporting Codes table synchronized with the match summary.
       For protocol input, show only the strongest exact/possible matches;
       otherwise an approximate lookup such as ...550 could say "2 matches"
       while the table displayed every weaker E(3)30 family row. */
    if(detection&&detection.kind==='code'&&detection.format){
      var matchSet=referenceCodeMatchSet(text,detection.format);
      rows=matchSet.topRows.slice();
      if(!rows.length&&allowsImplicitTextFallback(text,detection)) rows=searchRows(text,null,'regular');
    }else rows=searchRows(text,null,'regular');
    return rows.filter(rowPassesReportingFilters);
  }
  function applyQueryState(value,options){
    options=options||{};
    state.draftQuery=String(value==null?'':value);
    state.query=state.draftQuery.trim();
    state.tableSectionsOpen=false;
    state.sectionOpen={};
    if(state.query) appliedRowsForQuery(state.query).forEach(function(row){state.sectionOpen[row.sectionId]=true;});
    /* A detected signal match should reveal its breakdown immediately. This is
       intentionally limited to CID/SIA code matching, not ordinary text search. */
    if(state.query){
      var detection=detectQueryType(state.query);
      if(detection&&detection.kind==='code'&&detection.format){
        var matchSet=referenceCodeMatchSet(state.query,detection.format);
        if(matchSet&&matchSet.topRows&&matchSet.topRows.length){
          state.breakdownOpen=true;
          setReportingSectionExpanded('breakdown',true);
          state.activePanel='breakdown';
        }
      }
    }else{
      /* An empty search has no signal to break down. Return this section to
         its first-load state: hidden and collapsed. */
      state.breakdownOpen=false;
      setReportingSectionExpanded('breakdown',false);
      if(state.activePanel==='breakdown') state.activePanel=state.completeTableOpen?'table':(state.structureVisible?'structure':'table');
    }
    /* Top-level visibility for the other tools remains controlled by the
       navigator +/- state. */
  }

  function render(){
    if(!host) return;
    var detection=detectQueryType(state.query);
    var results=String(state.query||'').trim()?appliedRowsForQuery(state.query):[];
    var allTableRows=buildIndex().rows.slice().filter(rowPassesReportingFilters);
    var matchedTableRows=String(state.query||'').trim()?results.slice():[];
    var tableCount=String(state.query||'').trim()?matchedTableRows.length:allTableRows.length;
    var primary=renderBreakdown(state.query,detection,results);
    var tableFilters=renderResultCategoryFilters(tableCount);
    var groups=groupedTableRows(allTableRows,matchedTableRows,state.query);
    var referenceTable=renderTablesCard(groups,state.query,tableCount,detection,{totalAvailable:allTableRows.length});
    host.innerHTML='<div class="reporting-decoder-layout">'+renderSettingsPanel()+'<div class="reporting-decoder-sticky-stack">'+renderSearchControls(detection,tableFilters)+'</div>'+renderStructureReference()+primary+referenceTable+'</div>';
    syncReportingHeaderControls();
    if(state.settingsOpen&&root.dscPositionFloatingSettings){
      var settingsTrigger=root.document&&root.document.querySelector('#reportingCodeDecoderHeaderControls [data-reporting-settings-toggle]');
      var settingsPanel=host.querySelector('[data-reporting-settings-panel]');
      if(settingsTrigger&&settingsPanel){
        var positionReportingSettings=function(){root.dscPositionFloatingSettings(settingsTrigger,settingsPanel,{width:600,maxHeight:600});};
        if(root.requestAnimationFrame) root.requestAnimationFrame(positionReportingSettings); else positionReportingSettings();
      }
    }
    syncReportingTableStickyOffset();
    // The tool is initially rendered while hidden. Observe the new toolbar
    // after every render so activation, wrapping and font changes remeasure it.
    if(root.ResizeObserver){
      if(!stickyResizeObserver) stickyResizeObserver=new root.ResizeObserver(syncReportingTableStickyOffset);
      stickyResizeObserver.disconnect();
      stickyResizeObserver.observe(host.querySelector('.reporting-decoder-sticky-stack'));
      var title=host.parentElement.querySelector(':scope > .section-title');
      if(title) stickyResizeObserver.observe(title);
    }
  }
  function syncReportingHeaderControls(){
    if(!root.document) return;
    var header=root.document.getElementById('reportingCodeDecoderHeaderControls');
    if(!header) return;
    header.innerHTML='<button type="button" class="secondary compact-action-button tool-header-reset-button" data-reporting-reset aria-label="Reset Reporting Codes Tool" title="Reset Reporting Codes Tool">Reset</button><button type="button" class="secondary compact-action-button compact-icon-action reporting-settings-button reporting-tool-header-settings '+(state.settingsOpen?'active':'')+'" data-reporting-settings-toggle aria-pressed="'+(state.settingsOpen?'true':'false')+'" aria-label="Settings" title="Settings"><span aria-hidden="true">⚙</span></button>';
  }

  function syncReportingTableStickyOffset(){
    if(!host||!host.querySelector) return;
    var stack=host.querySelector('.reporting-decoder-sticky-stack');
    if(!stack) return;
    if(!stack.getClientRects().length) return;
    var view=host.parentElement;
    var title=view.querySelector(':scope > .section-title');
    var paneScrolls=root.getComputedStyle&&/(auto|scroll)/.test(root.getComputedStyle(host).overflowY);
    var stackTop=paneScrolls ? 0 : (title ? Math.ceil(title.getBoundingClientRect().height)+6 : 0);
    host.style.setProperty('--reporting-search-sticky-top',stackTop+'px');
    var stickyTop=68;
    if(root.getComputedStyle){var parsed=parseFloat(root.getComputedStyle(stack).top||'');if(Number.isFinite(parsed))stickyTop=parsed;}
    var stackHeight=Math.max(0,Math.ceil(stack.getBoundingClientRect?stack.getBoundingClientRect().height:(stack.offsetHeight||0)));
    if(host.style&&host.style.setProperty){var typeTop=String(Math.ceil(stickyTop+stackHeight+6))+'px';host.style.setProperty('--reporting-type-sticky-top',typeTop);host.style.setProperty('--reporting-table-sticky-top',typeTop);}
  }
  function scrollToReportingTool(toolId,behavior){
    if(!host) return;
    var panel=host.querySelector('[data-reporting-tool-panel="'+String(toolId||'')+'"]');
    if(!panel) return;
    var stack=host.querySelector('.reporting-decoder-sticky-stack');
    var stackHeight=stack?stack.getBoundingClientRect().height:104;
    var stickyTop=68;
    if(stack&&root.getComputedStyle){var parsedTop=parseFloat(root.getComputedStyle(stack).top||'');if(Number.isFinite(parsedTop)) stickyTop=parsedTop;}
    var view=host,viewScrollable=false;
    if(!root.getComputedStyle||!/(auto|scroll)/.test(root.getComputedStyle(view).overflowY)) view=panel.closest&&panel.closest('.view.active');
    if(view&&root.getComputedStyle){var overflowY=root.getComputedStyle(view).overflowY||'';viewScrollable=/(auto|scroll)/.test(overflowY)&&view.scrollHeight>view.clientHeight+1;}
    if(viewScrollable){
      var viewRect=view.getBoundingClientRect(),panelRect=panel.getBoundingClientRect();
      var targetTop=Math.max(0,view.scrollTop+(panelRect.top-viewRect.top)-stickyTop-stackHeight-8);
      if(view.scrollTo){try{view.scrollTo({top:targetTop,behavior:behavior||'smooth'});}catch(error){view.scrollTop=targetTop;}}else view.scrollTop=targetTop;
      return;
    }
    var rect=panel.getBoundingClientRect(),currentY=root.pageYOffset!=null?root.pageYOffset:((root.document&&root.document.documentElement&&root.document.documentElement.scrollTop)||0);
    var targetY=Math.max(0,currentY+rect.top-stickyTop-stackHeight-8);
    if(root.scrollTo){try{root.scrollTo({top:targetY,behavior:behavior||'smooth'});}catch(error){root.scrollTo(0,targetY);}}else if(panel.scrollIntoView) panel.scrollIntoView({block:'start',behavior:behavior||'smooth'});
  }
  function scheduleReportingToolNavigation(toolId){
    var fn=function(){scrollToReportingTool(toolId,'smooth');};
    if(root.requestAnimationFrame) root.requestAnimationFrame(function(){root.requestAnimationFrame(fn);});
    else if(root.setTimeout) root.setTimeout(fn,0); else fn();
  }
  function rerenderAndRefocus(inputStart,inputEnd){
    render();
    var input=root.document?root.document.getElementById('reportingCodeDecoderSearch'):null;
    if(input&&inputStart!=null){input.focus();try{input.setSelectionRange(inputStart,inputEnd==null?inputStart:inputEnd);}catch(err){}}
  }
  function reportingRowById(rowId){
    var index=buildIndex(),rows=(index&&index.rows)||[];
    for(var i=0;i<rows.length;i++) if(rows[i].id===rowId) return rows[i];
    return null;
  }
  function toggleReportingRowExpansionInPlace(button,rowId){
    if(!button||!rowId) return false;
    var row=reportingRowById(rowId),parent=button.closest('tr.reporting-parent-row');
    if(!row||!parent||!parent.parentNode) return false;
    var tbody=parent.parentNode,isOpen=button.getAttribute('aria-expanded')==='true';
    var existing=tbody.querySelectorAll('tr.reporting-range-child-row[data-reporting-range-parent]');
    for(var i=0;i<existing.length;i++){
      if(existing[i].getAttribute('data-reporting-range-parent')===rowId) existing[i].remove();
    }
    if(isOpen){
      state.expandedRows[rowId]=false;
      button.setAttribute('aria-expanded','false');
      button.setAttribute('title','Expand individual codes');
      parent.classList.remove('is-range-open');
      return true;
    }
    var expanded=expandedRowsForReferenceRow(row);
    if(expanded.length<2) return false;
    state.expandedRows[rowId]=true;
    button.setAttribute('aria-expanded','true');
    button.setAttribute('title','Collapse individual codes');
    parent.classList.add('is-range-open');
    parent.insertAdjacentHTML('afterend',renderExpandedRangeRow(row,expanded,state.query,detectQueryType(state.query)));
    return true;
  }
  var liveSearchTimer=0;
  var liveSearchFrame=0;
  var liveSearchSequence=0;
  var deferredStateSaveTimer=0;
  function scheduleDeferredStateSave(){
    if(deferredStateSaveTimer&&root&&root.clearTimeout) root.clearTimeout(deferredStateSaveTimer);
    if(root&&root.setTimeout) deferredStateSaveTimer=root.setTimeout(function(){deferredStateSaveTimer=0;saveState();},180);
    else saveState();
  }
  function cancelPendingLiveSearch(){
    liveSearchSequence++;
    if(liveSearchTimer&&root&&root.clearTimeout){root.clearTimeout(liveSearchTimer);liveSearchTimer=0;}
    if(liveSearchFrame&&root&&root.cancelAnimationFrame){root.cancelAnimationFrame(liveSearchFrame);liveSearchFrame=0;}
  }
  function runLiveSearch(value,start,end){
    cancelPendingLiveSearch();
    var sequence=liveSearchSequence;
    var run=function(){
      if(sequence!==liveSearchSequence) return;
      liveSearchTimer=0;liveSearchFrame=0;
      var runId=beginReportingLoading('Searching reporting codes…');
      applyQueryState(value,{live:true});
      render();
      scheduleDeferredStateSave();
      var input=root.document?root.document.getElementById('reportingCodeDecoderSearch'):null;
      if(input){input.focus();try{input.setSelectionRange(start==null?input.value.length:start,end==null?(start==null?input.value.length:start):end);}catch(err){}}
      finishReportingLoading(runId);
    };
    /* Coalesce rapid keystrokes to the next paint instead of imposing a fixed
       debounce delay. Only the newest query renders, so live matching feels
       immediate without doing duplicate work while the user is typing. */
    if(root&&root.requestAnimationFrame) liveSearchFrame=root.requestAnimationFrame(run);
    else if(root&&root.setTimeout) liveSearchTimer=root.setTimeout(run,0);
    else run();
  }

  function onHostClick(event){
    var resetTool=event.target.closest('[data-reporting-reset]');
    if(resetTool){
      event.preventDefault();event.stopPropagation();cancelPendingLiveSearch();
      try{if(root.localStorage)[STORAGE_KEY,LEGACY_STORAGE_KEY,OLDER_STORAGE_KEY,ANCIENT_STORAGE_KEY,OLDEST_STORAGE_KEY].forEach(function(key){root.localStorage.removeItem(key);});}catch(err){}
      state=defaultReportingState();saveState();render();
      var resetInput=root.document&&root.document.getElementById('reportingCodeDecoderSearch');if(resetInput)resetInput.focus();
      return;
    }
    var possibleMatches=event.target.closest('[data-reporting-possible-matches]');
    if(possibleMatches){
      event.preventDefault();event.stopPropagation();
      var tableWasOpen=reportingToolIsOpen('table'),tableWasExpanded=reportingSectionIsExpanded('table');
      setReportingToolOpen('table',true);setReportingSectionExpanded('table',true);state.activePanel='table';state.tableSectionsOpen=false;state.sectionOpen=state.sectionOpen||{};
      appliedRowsForQuery(state.query).forEach(function(row){state.sectionOpen[row.sectionId]=true;});
      saveState();
      if(!tableWasOpen||!tableWasExpanded) render();
      else host.querySelectorAll('.reporting-tools-navigation-item').forEach(function(item){item.classList.toggle('current',!!item.querySelector('[data-reporting-tool="table"]'));});
      scheduleReportingToolNavigation('table');return;
    }
    var sectionToggle=event.target.closest('[data-reporting-section-toggle]');
    if(sectionToggle){
      event.preventDefault();event.stopPropagation();
      var sectionTool=sectionToggle.getAttribute('data-reporting-section-toggle')||'table',sectionWillOpen=!reportingSectionIsExpanded(sectionTool);
      setReportingSectionExpanded(sectionTool,sectionWillOpen);state.activePanel=sectionTool;saveState();
      if(!syncReportingSectionExpandedDom(sectionTool,sectionWillOpen)) render(); else syncReportingNavigationCurrent(sectionTool);
      if(sectionWillOpen) scheduleReportingToolNavigation(sectionTool);return;
    }
    var toolButton=event.target.closest('[data-reporting-tool]');
    if(toolButton){
      event.preventDefault();event.stopPropagation();
      var tool=toolButton.getAttribute('data-reporting-tool')||'table',wasOpen=reportingToolIsOpen(tool),wasExpanded=reportingSectionIsExpanded(tool);
      setReportingToolOpen(tool,true);setReportingSectionExpanded(tool,true);state.activePanel=tool;saveState();
      if(!wasOpen||!wasExpanded) render();
      else host.querySelectorAll('.reporting-tools-navigation-item').forEach(function(item){item.classList.toggle('current',!!item.querySelector('[data-reporting-tool="'+tool+'"]'));});
      scheduleReportingToolNavigation(tool);return;
    }
    var toolToggle=event.target.closest('[data-reporting-tool-toggle]');
    if(toolToggle){
      event.preventDefault();event.stopPropagation();
      var toggleTool=toolToggle.getAttribute('data-reporting-tool-toggle')||'table',willOpen=!reportingToolIsOpen(toggleTool);
      setReportingToolOpen(toggleTool,willOpen);if(willOpen)setReportingSectionExpanded(toggleTool,true);state.activePanel=toggleTool;saveState();render();
      if(willOpen) scheduleReportingToolNavigation(toggleTool);return;
    }
    var resultsOnly=event.target.closest('[data-reporting-results-only]');
    if(resultsOnly){
      event.preventDefault();event.stopPropagation();
      var resultsRunId=beginReportingLoading('Updating reporting results…');
      state.resultsOnly=!state.resultsOnly;saveState();render();finishReportingLoading(resultsRunId);return;
    }
    var liveSearch=event.target.closest('[data-reporting-live-search]');
    if(liveSearch){
      event.preventDefault();event.stopPropagation();
      state.liveSearch=!state.liveSearch;
      cancelPendingLiveSearch();
      if(state.liveSearch){
        state.resultsOnly=true;
        var current=root.document?root.document.getElementById('reportingCodeDecoderSearch'):null;
        var value=current?current.value:state.draftQuery;
        var start=current&&typeof current.selectionStart==='number'?current.selectionStart:null;
        var end=current&&typeof current.selectionEnd==='number'?current.selectionEnd:start;
        var runId=beginReportingLoading('Searching reporting codes…');
        applyQueryState(value,{live:true});saveState();render();
        var next=root.document?root.document.getElementById('reportingCodeDecoderSearch'):null;
        if(next){next.focus();try{next.setSelectionRange(start==null?next.value.length:start,end==null?(start==null?next.value.length:start):end);}catch(err){}}
        finishReportingLoading(runId);
      }else{
        var liveOffRunId=beginReportingLoading('Updating reporting results…');
        saveState();render();finishReportingLoading(liveOffRunId);
      }
      return;
    }
    var submitSearch=event.target.closest('[data-reporting-submit]');
    if(submitSearch&&!submitSearch.hasAttribute('disabled')){
      event.preventDefault();event.stopPropagation();
      var submitInput=root.document?root.document.getElementById('reportingCodeDecoderSearch'):null;
      applySignalBreakdown(submitInput);
      return;
    }
    var filterField=event.target.closest('[data-reporting-filter-field]');
    if(filterField){
      event.preventDefault();event.stopPropagation();state.settingsOpen=false;state.searchSettingsOpen=false;state.columnsOpen=false;
      var nextField=filterField.getAttribute('data-reporting-filter-field')||'all';
      var filterRunId=beginReportingLoading('Updating reporting filters…');
      if(nextField==='all'){
        state.filters={reportingType:[],description:[],category:[],severity:[],direction:[]};state.filterField='all';
      }else state.filterField=state.filterField===nextField?'all':nextField;
      /* Filters change row visibility only; preserve the exact open/closed state of every table section. */
      saveState();render();finishReportingLoading(filterRunId);return;
    }
    var filterClear=event.target.closest('[data-reporting-filter-clear]');
    if(filterClear){
      event.preventDefault();event.stopPropagation();
      var clearField=filterClear.getAttribute('data-reporting-filter-clear')||'';
      if(['reportingType','description','category','severity','direction'].indexOf(clearField)>=0){
        var clearRunId=beginReportingLoading('Updating reporting filters…');
        reportingFilters()[clearField]=[];saveState();render();finishReportingLoading(clearRunId);
      }
      return;
    }
    var filterValue=event.target.closest('[data-reporting-filter-value]');
    if(filterValue){
      event.preventDefault();event.stopPropagation();
      var filterKind=filterValue.getAttribute('data-reporting-filter-kind')||'',filterText=filterValue.getAttribute('data-reporting-filter-value')||'';
      if(['reportingType','description','category','severity','direction'].indexOf(filterKind)>=0&&filterText){
        var values=reportingFilters()[filterKind],position=values.indexOf(filterText),valueRunId=beginReportingLoading('Updating reporting filters…');
        if(position>=0) values.splice(position,1); else values.push(filterText);
        state.filterField=filterKind;saveState();render();finishReportingLoading(valueRunId);
      }
      return;
    }
    var columnsToggle=event.target.closest('[data-reporting-columns-toggle]');
    if(columnsToggle){event.preventDefault();event.stopPropagation();state.columnsOpen=!state.columnsOpen;if(state.columnsOpen){state.settingsOpen=false;state.searchSettingsOpen=false;state.filterField='all';}render();return;}
    var columnAll=event.target.closest('[data-reporting-column-all]');
    if(columnAll){
      event.preventDefault();event.stopPropagation();
      var columns=reportingVisibilityColumns(),turnOn=columns.some(function(column){return !column.on;});
      state.showDescription=turnOn;state.showCategory=turnOn;state.showSeverity=turnOn;state.showDirection=turnOn;state.showContactId=turnOn;state.showSia=turnOn;
      invalidateRegularSearchCache();saveState();render();return;
    }
    var showFiltersControl=event.target.closest('[data-reporting-show-filters]');
    if(showFiltersControl){event.preventDefault();event.stopPropagation();state.showFilters=!state.showFilters;if(!state.showFilters)state.filterField='all';saveState();render();return;}
    var showColumnsControl=event.target.closest('[data-reporting-show-columns]');
    if(showColumnsControl){event.preventDefault();event.stopPropagation();state.showColumns=!state.showColumns;if(!state.showColumns)state.columnsOpen=false;saveState();render();return;}
    var typeColorsControl=event.target.closest('[data-reporting-type-colors]');
    if(typeColorsControl){event.preventDefault();event.stopPropagation();state.reportingTypeColors=!state.reportingTypeColors;saveState();render();return;}
    var viewModeControl=event.target.closest('[data-reporting-view-mode]');
    if(viewModeControl){event.preventDefault();event.stopPropagation();state.viewMode=viewModeControl.getAttribute('data-reporting-view-mode')==='table'?'table':'list';saveState();render();return;}
    var typeColumnsControl=event.target.closest('[data-reporting-type-columns]');
    if(typeColumnsControl){event.preventDefault();event.stopPropagation();var nextColumns=Number(typeColumnsControl.getAttribute('data-reporting-type-columns'))||3;state.reportingTypeColumns=Math.max(1,Math.min(4,nextColumns));saveState();render();return;}
    var searchSettingsToggle=event.target.closest('[data-reporting-search-settings-toggle]');
    if(searchSettingsToggle){event.preventDefault();event.stopPropagation();state.searchSettingsOpen=!state.searchSettingsOpen;if(state.searchSettingsOpen){state.settingsOpen=false;state.filterField='all';state.columnsOpen=false;}saveState();render();return;}
    var settingsToggle=event.target.closest('[data-reporting-settings-toggle]');
    if(settingsToggle){event.preventDefault();event.stopPropagation();state.settingsOpen=!state.settingsOpen;if(state.settingsOpen){state.searchSettingsOpen=false;state.filterField='all';state.columnsOpen=false;}saveState();render();return;}
    var breakdownField=event.target.closest('[data-reporting-breakdown-field]');
    if(breakdownField){
      event.preventDefault();event.stopPropagation();
      var signalKey=breakdownField.getAttribute('data-reporting-breakdown-field')||'';
      if(Object.prototype.hasOwnProperty.call(DEFAULT_SIGNAL_MATCH_FIELDS,signalKey)){state.signalMatchFields[signalKey]=!breakdownFieldEnabled(signalKey);invalidateRegularSearchCache();cachedReferenceMatchKey=null;cachedReferenceMatchSet=null;saveState();render();}
      return;
    }
    var textSearchField=event.target.closest('[data-reporting-text-search-field]');
    if(textSearchField){
      event.preventDefault();event.stopPropagation();
      var textKey=textSearchField.getAttribute('data-reporting-text-search-field')||'';
      if(Object.prototype.hasOwnProperty.call(DEFAULT_TEXT_SEARCH_COLUMNS,textKey)){state.textSearchColumns[textKey]=!textSearchColumnEnabled(textKey);invalidateRegularSearchCache();saveState();render();}
      return;
    }
    var qualifierDisplay=event.target.closest('[data-reporting-cid-qualifier-display]');
    if(qualifierDisplay){event.preventDefault();event.stopPropagation();state.contactIdQualifierDisplay=qualifierDisplay.getAttribute('data-reporting-cid-qualifier-display')==='13'?'13':'er';saveState();render();return;}
    var visibility=event.target.closest('[data-reporting-visibility]');
    if(visibility){
      event.preventDefault();event.stopPropagation();
      var format=visibility.getAttribute('data-reporting-visibility');
      if(format==='description') state.showDescription=!state.showDescription;
      if(format==='category') state.showCategory=!state.showCategory;
      if(format==='severity') state.showSeverity=!state.showSeverity;
      if(format==='direction') state.showDirection=!state.showDirection;
      if(format==='contact-id') state.showContactId=!state.showContactId;
      if(format==='sia') state.showSia=!state.showSia;
      invalidateRegularSearchCache();saveState();render();return;
    }
    var metadataSource=event.target.closest('[data-reporting-metadata-source]');
    if(metadataSource){event.preventDefault();event.stopPropagation();var nextMetadata=metadataSource.getAttribute('data-reporting-metadata-source')==='sia'?'sia':'cid';if(nextMetadata!==state.metadataSource){state.metadataSource=nextMetadata;invalidateRegularSearchCache();var metadataFilters=reportingFilters();metadataFilters.description=[];metadataFilters.category=[];metadataFilters.severity=[];/* Preserve complete-table, section, and expanded-range open state; only protocol metadata changes. */}saveState();render();return;}
    var zeroDisplay=event.target.closest('[data-reporting-cid-zero-display]');
    if(zeroDisplay){event.preventDefault();event.stopPropagation();state.contactIdZeroDisplay=zeroDisplay.getAttribute('data-reporting-cid-zero-display')==='0';saveState();render();return;}
    var resultCategory=event.target.closest('[data-reporting-result-category]');
    if(resultCategory){state.resultCategory=resultCategory.getAttribute('data-reporting-result-category')||'all';saveState();render();return;}
    var rowExpand=event.target.closest('[data-reporting-row-expand]');
    if(rowExpand){
      var rowId=rowExpand.getAttribute('data-reporting-row-expand')||'';
      if(rowId && !toggleReportingRowExpansionInPlace(rowExpand,rowId)){
        state.expandedRows[rowId]=!state.expandedRows[rowId];
        render();
      }
      return;
    }
    var jumpSection=event.target.closest('[data-reporting-jump-section]');
    if(jumpSection){
      event.preventDefault();event.stopPropagation();
      var targetSection=jumpSection.getAttribute('data-reporting-jump-section')||'';
      if(targetSection){
        var sourceDetails=jumpSection.closest?jumpSection.closest('details[data-reporting-section-id]'):null;
        var sourceSection=sourceDetails&&sourceDetails.getAttribute?sourceDetails.getAttribute('data-reporting-section-id')||'':'';
        state.query='';state.draftQuery='';state.resultCategory='all';state.filterField='all';state.filters={reportingType:[],description:[],category:[],severity:[],direction:[]};
        state.completeTableOpen=true;state.activePanel='table';state.tableSectionsOpen=false;state.sectionOpen=state.sectionOpen||{};
        if(sourceSection) state.sectionOpen[sourceSection]=true;
        state.sectionOpen[targetSection]=true;
        saveState();render();
        var scrollTarget=root.document&&root.document.getElementById?root.document.getElementById('reporting-section-'+targetSection):null;
        if(scrollTarget&&scrollTarget.scrollIntoView) scrollTarget.scrollIntoView({behavior:'smooth',block:'start'});
      }
      return;
    }
    var mainSections=event.target.closest('[data-reporting-main-sections]');
    if(mainSections){
      event.preventDefault();event.stopPropagation();
      var expandMain=mainSections.getAttribute('data-reporting-main-sections')==='expand',mainSyncOk=true;
      ['structure','breakdown','table'].forEach(function(tool){setReportingSectionExpanded(tool,expandMain);if(reportingToolIsOpen(tool)&&!syncReportingSectionExpandedDom(tool,expandMain))mainSyncOk=false;});
      saveState();if(!mainSyncOk)render();return;
    }
    var tableSections=event.target.closest('[data-reporting-table-sections]');
    if(tableSections&&!tableSections.hasAttribute('disabled')){
      event.preventDefault();event.stopPropagation();
      var expandAll=tableSections.getAttribute('data-reporting-table-sections')==='expand';
      state.tableSectionsOpen=expandAll;state.completeTableOpen=true;setReportingSectionExpanded('table',true);state.activePanel='table';state.sectionOpen={};
      var sectionIds={};buildIndex().rows.forEach(function(row){sectionIds[row.sectionId]=true;});
      Object.keys(sectionIds).forEach(function(id){state.sectionOpen[id]=expandAll;});
      saveState();
      syncReportingSectionExpandedDom('table',true);syncReportingNavigationCurrent('table');
      if(host) host.querySelectorAll('details[data-reporting-section-id]').forEach(function(detail){detail.open=expandAll;});
      scheduleReportingToolNavigation('table');return;
    }
    var clearButton=event.target.closest('[data-reporting-clear]');
    if(clearButton&&!clearButton.hasAttribute('disabled')){
      cancelPendingLiveSearch();
      state.query='';state.draftQuery='';state.tableSectionsOpen=false;state.sectionOpen={};state.expandedRows={};state.breakdownOpen=false;setReportingSectionExpanded('breakdown',false);if(state.activePanel==='breakdown')state.activePanel=state.completeTableOpen?'table':(state.structureVisible?'structure':'table');
      saveState();render();var input=root.document.getElementById('reportingCodeDecoderSearch');if(input) input.focus();
    }
  }
  function onDocumentClick(event){
    if(!host||!event||!event.target||!event.target.closest) return;
    var target=event.target,changed=false;
    if(state.searchSettingsOpen&&!target.closest('[data-reporting-search-settings-panel]')&&!target.closest('[data-reporting-search-settings-toggle]')){state.searchSettingsOpen=false;changed=true;}
    if(state.settingsOpen&&!target.closest('[data-reporting-settings-panel]')&&!target.closest('[data-reporting-settings-toggle]')){state.settingsOpen=false;changed=true;}
    if(state.filterField!=='all'&&!target.closest('[data-reporting-filters-panel]')){state.filterField='all';changed=true;}
    if(state.columnsOpen&&!target.closest('[data-reporting-columns-panel]')){state.columnsOpen=false;changed=true;}
    if(changed){
      var categorySummary=target.closest('.reporting-type-section > summary');
      if(categorySummary && event.defaultPrevented){
        // The shared category handler already toggled this details element.
        // Commit it before replacing the DOM; its native toggle event is queued.
        var category=categorySummary.parentElement;
        var categoryId=category.getAttribute('data-reporting-section-id');
        if(categoryId){state.sectionOpen=state.sectionOpen||{};state.sectionOpen[categoryId]=!!category.open;}
        saveState();render();
      }else{
        saveState();if(root&&root.setTimeout) root.setTimeout(function(){if(host) render();},0);else render();
      }
    }
  }
  function applySignalBreakdown(input){
    cancelPendingLiveSearch();
    var value=String(input&&input.value!=null?input.value:state.draftQuery||'');
    var start=input&&typeof input.selectionStart==='number'?input.selectionStart:value.length;
    var end=input&&typeof input.selectionEnd==='number'?input.selectionEnd:start;
    var runId=beginReportingLoading('Searching reporting codes…');
    applyQueryState(value,{live:false});
    saveState();render();
    var nextInput=root.document?root.document.getElementById('reportingCodeDecoderSearch'):null;
    if(nextInput){nextInput.focus();try{nextInput.setSelectionRange(start,end);}catch(err){}}
    finishReportingLoading(runId);
  }
  function onHostInput(event){
    var input=event.target.closest?event.target.closest('#reportingCodeDecoderSearch'):null;
    if(!input) return;
    state.draftQuery=String(input.value||'');
    var hasDraft=!!(state.draftQuery.length||state.query);
    var clear=host&&host.querySelector?host.querySelector('[data-reporting-clear]'):null;
    if(clear){clear.disabled=!hasDraft;if(clear.classList&&clear.classList.toggle) clear.classList.toggle('is-visible',hasDraft);}
    var submit=host&&host.querySelector?host.querySelector('[data-reporting-submit]'):null;
    if(submit) submit.disabled=!hasDraft;
    if(state.liveSearch){
      var start=typeof input.selectionStart==='number'?input.selectionStart:state.draftQuery.length;
      var end=typeof input.selectionEnd==='number'?input.selectionEnd:start;
      runLiveSearch(state.draftQuery,start,end);
    }
  }
  function onHostKeyDown(event){
    var input=event.target.closest?event.target.closest('#reportingCodeDecoderSearch'):null;
    if(!input||event.key!=='Enter') return;
    event.preventDefault();applySignalBreakdown(input);
  }
  function onHostToggle(event){
    var details=event.target;
    if(!details||!details.matches) return;
    if(details.matches('[data-reporting-section-id]')){
      var sectionId=details.getAttribute('data-reporting-section-id')||'';
      if(sectionId){state.sectionOpen[sectionId]=!!details.open;saveState();}
    }
  }
  function initUi(){
    host=root.document?root.document.getElementById('neoReportingCodeDecoder'):null;
    if(!host) return;
    readState();render();if(root&&root.addEventListener&&!root._dscReportingTableStickyResizeBound){root._dscReportingTableStickyResizeBound=true;root.addEventListener('resize',function(){syncReportingTableStickyOffset();},{passive:true});}host.addEventListener('click',onHostClick);host.addEventListener('input',onHostInput);host.addEventListener('keydown',onHostKeyDown);host.addEventListener('toggle',onHostToggle,true);var header=root.document&&root.document.getElementById('reportingCodeDecoderHeaderControls');if(header)header.addEventListener('click',onHostClick);if(root.document&&root.document.addEventListener) root.document.addEventListener('click',onDocumentClick,true);
  }
  if(root&&root.document){if(root.document.readyState==='loading') root.document.addEventListener('DOMContentLoaded',initUi);else initUi();}

  return {
    normalizeContactIdCode:normalizeContactIdCode,
    normalizeSiaCode:normalizeCode,
    detectQueryType:detectQueryType,
    parseContactIdInput:parseContactIdInput,
    parseContactIdCodeListInput:parseContactIdCodeListInput,
    parseSiaInput:parseSiaInput,
    searchRows:function(query,format){return searchRows(query,format,'signal').map(function(row){return {id:row.id,definition:row.definition,sectionTitle:row.sectionTitle,contactId:row.contactId,sia:row.sia,score:row.__score||0};});},
    searchRowsRegular:function(query){return searchRows(query,null,'regular').map(function(row){return {id:row.id,definition:row.definition,sectionTitle:row.sectionTitle,contactId:row.contactId,sia:row.sia,score:row.__score||0};});},
    resultCategoryForReference:function(row){return resultCategoryKeyForReference(row||{});},
    rebuildIndex:function(){cachedIndex=null;cachedRegularQuery=null;cachedRegularRows=null;cachedKnownSiaPrefixes=null;cachedReferenceMatchKey=null;cachedReferenceMatchSet=null;cachedTextPrefixIndex=null;semanticSegmentCache=Object.create(null);STANDARD_EVENT_METADATA_CACHE=null;return buildIndex();},
    tableColumnPlan:tableColumnPlan,
    contactIdEventMetadata:contactIdEventMetadata,
    siaEventMetadata:siaEventMetadata,
    standardMetadataForPart:standardMetadataForPart,
    descriptionLinesForRow:function(row,source){var previous=state.metadataSource;if(source==='cid'||source==='sia') state.metadataSource=source;var values=reportingDescriptionLines(row||{});state.metadataSource=previous;return values;},
    categoryLinesForRow:function(row,source){var previous=state.metadataSource;if(source==='cid'||source==='sia') state.metadataSource=source;var values=reportingCategoryLines(row||{});state.metadataSource=previous;return values;},
    severityLinesForRow:function(row,source){var previous=state.metadataSource;if(source==='cid'||source==='sia') state.metadataSource=source;var values=reportingSeverityLines(row||{});state.metadataSource=previous;return values;},
    directionLinesForRow:function(row,source){var previous=state.metadataSource;if(source==='cid'||source==='sia') state.metadataSource=source;var values=directionLineSpecsForRow(row||{}).map(function(item){return item.value;});state.metadataSource=previous;return values;},
    analyzeRegularRow:function(row){var cid=pairSemantic((row||{}).contactId||'','contact-id'),sia=pairSemantic((row||{}).sia||'','sia'),range=(cid.event&&cid.event.range)||(cid.restore&&cid.restore.range)||(sia.event&&sia.event.range)||(sia.restore&&sia.restore.range)||null;return {scope:rowScope(row),identifier:identifierMeaning(row,range),contactId:cid,sia:sia};},
    regularCodeMatchSet:function(query,format){var set=referenceCodeMatchSet(query,format);return {topScore:set.topScore,topRows:set.topRows.map(function(row){return {id:row.id,definition:row.definition,contactId:row.contactId,sia:row.sia};}),unique:set.unique?{id:set.unique.id,definition:set.unique.definition,contactId:set.unique.contactId,sia:set.unique.sia}:null};},
    highlightCodeEquivalent:highlightCodeEquivalent,
    highlightPlainText:highlightPlainText,
    matchedDefinitionForQuery:matchedDefinitionForQuery,
    renderContactIdReconstruction:renderContactIdReconstruction,
    resolvedContactIdReconstructionFields:resolvedContactIdReconstructionFields,
    renderReferenceCodeForTable:renderReferenceCodeForTable,
    renderReferenceCodeLinesForTable:renderReferenceCodeLinesForTable,
    renderMatchCellForQuery:function(query,format){return renderReportingMatchCell(referenceCodeMatchSet(query,format),format,query);},
    expandedRowsForReferenceRow:expandedRowsForReferenceRow,
    expandRowsForDisplay:function(rows,query,mode){return expandRowsForDisplay(rows||[],query||'',mode||'regular');},
    getContactIdZeroDisplay:function(){return !!state.contactIdZeroDisplay;},
    getContactIdQualifierDisplay:function(){return state.contactIdQualifierDisplay;},
    getMetadataSource:function(){return state.metadataSource;},
    getTableColumnVisibility:function(){return {description:!!state.showDescription,category:!!state.showCategory,severity:!!state.showSeverity,direction:!!state.showDirection,contactId:!!state.showContactId,sia:!!state.showSia};},
    getSearchOptions:function(){return {resultsOnly:!!state.resultsOnly,liveSearch:!!state.liveSearch};},
    getFilterState:function(){return {field:state.filterField,filters:JSON.parse(JSON.stringify(reportingFilters()))};},
    rowPassesFilters:function(row){return rowPassesReportingFilters(row||{});},
    getCompareFields:function(){return JSON.parse(JSON.stringify(state.signalMatchFields||DEFAULT_SIGNAL_MATCH_FIELDS));},
    setCompareField:function(key,value){if(Object.prototype.hasOwnProperty.call(DEFAULT_SIGNAL_MATCH_FIELDS,key)){state.signalMatchFields[key]=!!value;invalidateRegularSearchCache();cachedReferenceMatchKey=null;cachedReferenceMatchSet=null;saveState();}return JSON.parse(JSON.stringify(state.signalMatchFields||DEFAULT_SIGNAL_MATCH_FIELDS));},
    getBreakdownFields:function(){return JSON.parse(JSON.stringify(state.signalMatchFields||DEFAULT_SIGNAL_MATCH_FIELDS));},
    setBreakdownField:function(key,value){if(Object.prototype.hasOwnProperty.call(DEFAULT_SIGNAL_MATCH_FIELDS,key)){state.signalMatchFields[key]=!!value;invalidateRegularSearchCache();cachedReferenceMatchKey=null;cachedReferenceMatchSet=null;saveState();}return JSON.parse(JSON.stringify(state.signalMatchFields||DEFAULT_SIGNAL_MATCH_FIELDS));},
    getTextSearchColumns:function(){return JSON.parse(JSON.stringify(state.textSearchColumns));},
    setTextSearchColumn:function(key,value){if(Object.prototype.hasOwnProperty.call(DEFAULT_TEXT_SEARCH_COLUMNS,key)){state.textSearchColumns[key]=!!value;invalidateRegularSearchCache();saveState();}return JSON.parse(JSON.stringify(state.textSearchColumns));}
  };
});
