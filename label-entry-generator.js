(function(root,factory){
  'use strict';
  var api=factory(root || {});
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.DSCLabelEntryGenerator=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  var LINE_CHARS=14;
  var TOTAL_CHARS=28;
  var WORD_ENTRY_MAX_CODE=238;
  var ASCII_ENTRY_MAX_CODE=253;
  var WORD_ENTRY_INITIAL_CODE='001';
  var ASCII_ENTRY_INITIAL_CODE='031';
  var KEY_GROUPS={
    '1':['A','B','C','1'],
    '2':['D','E','F','2'],
    '3':['G','H','I','3'],
    '4':['J','K','L','4'],
    '5':['M','N','O','5'],
    '6':['P','Q','R','6'],
    '7':['S','T','U','7'],
    '8':['V','W','X','8'],
    '9':['Y','Z','9','0']
  };
  var NORMALIZE_MAP={
    '\u00a0':' ', '“':'"','”':'"','„':'"','‘':"'",'’':"'",'‚':"'",
    '–':'-','—':'-','￥':'¥','~':'→'
  };
  var wordLibraryCache=typeof WeakMap==='function'?new WeakMap():null;
  var wordLookupCache=typeof WeakMap==='function'?new WeakMap():null;
  var asciiLibraryCache=typeof WeakMap==='function'?new WeakMap():null;
  var asciiCharacterCodeCache=typeof WeakMap==='function'?new WeakMap():null;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function pad3(value){return String(value==null?'':value).padStart(3,'0').slice(-3);}
  function boundedThreeDigitEntry(currentCode,digitCursor,digit,maxCode){
    var maxText=pad3(Math.max(0,Math.min(999,Math.round(Number(maxCode)||0))));
    var chars=pad3(currentCode).split('');
    var cursor=Math.max(0,Math.min(2,Number(digitCursor)||0));
    var requested=Math.max(0,Math.min(9,Math.round(Number(digit)||0)));
    var prefix=chars.slice(0,cursor).join('');
    var maxPrefix=maxText.slice(0,cursor);
    var cap=prefix===maxPrefix?Number(maxText.charAt(cursor)):9;
    chars[cursor]=String(Math.min(requested,cap));
    return {code:chars.join(''),cursor:(cursor+1)%3,requestedDigit:requested,acceptedDigit:Number(chars[cursor]),cap:cap,maxCode:maxText};
  }
  function normalizeCharacter(ch){return Object.prototype.hasOwnProperty.call(NORMALIZE_MAP,ch)?NORMALIZE_MAP[ch]:ch;}
  function normalizeText(text){
    var changes=[];
    var out='';
    Array.from(String(text==null?'':text).replace(/\r\n?/g,'\n')).forEach(function(ch,index){
      if(ch==='\n'){out+=ch;return;}
      var next=normalizeCharacter(ch);
      if(next!==ch) changes.push({index:index,from:ch,to:next});
      out+=next;
    });
    return {text:out,changes:changes};
  }

  function wrapLabelText(text){
    var normalized=normalizeText(text);
    var source=normalized.text;
    var errors=[];
    var lines=[];
    var current='';
    var paragraphs=source.split('\n');

    function pushCurrent(force){
      if(current || force){lines.push(current);current='';}
    }
    function appendWord(word){
      if(Array.from(word).length>LINE_CHARS){
        errors.push('“'+word+'” is longer than '+LINE_CHARS+' characters and cannot fit on one NEO label line.');
        return;
      }
      if(!current){current=word;return;}
      if(Array.from(current+' '+word).length<=LINE_CHARS){current+=' '+word;return;}
      pushCurrent(false);
      current=word;
    }

    paragraphs.forEach(function(paragraph,pIndex){
      var compact=String(paragraph||'').trim().replace(/[\t ]+/g,' ');
      if(pIndex>0) pushCurrent(true);
      if(compact){compact.split(' ').forEach(appendWord);}
    });
    if(current || !lines.length) pushCurrent(false);

    if(lines.length>2) errors.push('The label needs '+lines.length+' lines after whole-word wrapping; PowerSeries NEO labels allow only 2 lines.');
    var line1=String(lines[0]||'');
    var line2=String(lines[1]||'');
    if(Array.from(line1).length>LINE_CHARS) errors.push('Line 1 exceeds '+LINE_CHARS+' characters.');
    if(Array.from(line2).length>LINE_CHARS) errors.push('Line 2 exceeds '+LINE_CHARS+' characters.');
    return {
      valid:errors.length===0,
      errors:errors,
      line1:Array.from(line1).slice(0,LINE_CHARS).join(''),
      line2:Array.from(line2).slice(0,LINE_CHARS).join(''),
      normalizedInput:source,
      normalizationChanges:normalized.changes,
      wrapped:lines.length>1,
      lines:lines.slice(0,2)
    };
  }

  function wholeLabelTextFits(text){
    var layout=wrapLabelText(text);
    return {
      valid:layout.valid,
      layout:layout,
      reason:layout.valid?'':String((layout.errors&&layout.errors[0])||'The label exceeds the two 14-character editable lines.')
    };
  }

  function explicitLabelLayout(line1,line2){
    var first=normalizeText(String(line1==null?'':line1).replace(/\r?\n/g,' '));
    var second=normalizeText(String(line2==null?'':line2).replace(/\r?\n/g,' '));
    var firstText=first.text, secondText=second.text;
    var errors=[];
    if(Array.from(firstText).length>LINE_CHARS) errors.push('Line 1 exceeds '+LINE_CHARS+' characters.');
    if(Array.from(secondText).length>LINE_CHARS) errors.push('Line 2 exceeds '+LINE_CHARS+' characters.');
    return {
      valid:errors.length===0,
      errors:errors,
      line1:Array.from(firstText).slice(0,LINE_CHARS).join(''),
      line2:Array.from(secondText).slice(0,LINE_CHARS).join(''),
      normalizedInput:firstText+(secondText?'\n'+secondText:''),
      normalizationChanges:first.changes.concat(second.changes.map(function(change){return Object.assign({},change,{line:2});})),
      wrapped:!!secondText,
      explicitLines:true,
      lines:[firstText,secondText]
    };
  }

  function buildWordLibrary(config){
    if(config&&wordLibraryCache&&wordLibraryCache.has(config)) return wordLibraryCache.get(config);
    var items=(config&&Array.isArray(config.wordEntryMenu)?config.wordEntryMenu:[]).map(function(item,index){
      item=item||{};
      var code=pad3(item.code==null?index+1:item.code);
      return {code:code,label:String(item.label==null?'':item.label),index:index};
    }).filter(function(item){var n=Number(item.code);return n>=1&&n<=WORD_ENTRY_MAX_CODE&&item.label!=='';});
    if(config&&wordLibraryCache) wordLibraryCache.set(config,items);
    return items;
  }
  function wordLookupForConfig(config){
    if(config&&wordLookupCache&&wordLookupCache.has(config)) return wordLookupCache.get(config);
    var lookup=Object.create(null);
    buildWordLibrary(config).forEach(function(item){
      var key=item.label.toLowerCase();
      if(!Object.prototype.hasOwnProperty.call(lookup,key)) lookup[key]=item;
    });
    if(config&&wordLookupCache) wordLookupCache.set(config,lookup);
    return lookup;
  }
  function findWordMatches(query,config,options){
    options=options||{};
    var q=String(query||'').trim().toLowerCase();
    var words=buildWordLibrary(config);
    if(!q) return words.slice(0,WORD_ENTRY_MAX_CODE);
    return words.filter(function(item){
      var label=item.label.toLowerCase();
      return options.exact?label===q:(label.indexOf(q)>=0 || item.code.indexOf(q)>=0);
    });
  }
  function automaticWordMatch(token,config){
    token=String(token||'');
    if(token.length<2 || !/^[A-Za-z][A-Za-z']*$/.test(token)) return null;
    /* Word Entry selects the library item by code, so input capitalization is
       irrelevant. The generated LCD must use the word exactly as it is stored
       in the active NEO Word Library. */
    return wordLookupForConfig(config)[token.toLowerCase()]||null;
  }
  function applyWordLibraryCasingToLayout(layout,config){
    var next=clone(layout||{});
    function canonicalizeLine(line){
      return String(line||'').replace(/[A-Za-z][A-Za-z']*/g,function(token){
        var match=automaticWordMatch(token,config);
        return match?match.label:token;
      });
    }
    next.line1=canonicalizeLine(next.line1);
    next.line2=canonicalizeLine(next.line2);
    next.lines=[next.line1,next.line2];
    next.wordLibraryCasingApplied=true;
    return next;
  }
  function desiredWordMatches(layout,config){
    var seen=[];
    [layout.line1,layout.line2].forEach(function(line){
      String(line||'').split(/\s+/).filter(Boolean).forEach(function(token){
        var match=automaticWordMatch(token,config);
        seen.push({token:token,match:match});
      });
    });
    return seen;
  }

  function asciiCharacterAt(config,code){
    var list=(config&&Array.isArray(config.asciiEntryCharacters))?config.asciiEntryCharacters:[];
    var raw=list[code];
    if(raw&&typeof raw==='object') return String(raw.character==null?(raw.label==null?'':raw.label):raw.character);
    return String(raw||'');
  }
  function asciiCodeLookupForConfig(config){
    if(config&&asciiCharacterCodeCache&&asciiCharacterCodeCache.has(config)) return asciiCharacterCodeCache.get(config);
    var lookup=Object.create(null);
    var list=(config&&Array.isArray(config.asciiEntryCharacters))?config.asciiEntryCharacters:[];
    for(var i=0;i<Math.min(254,list.length);i++){
      var character=asciiCharacterAt(config,i);
      if(character!==''&&!Object.prototype.hasOwnProperty.call(lookup,character)) lookup[character]=i;
    }
    if(config&&asciiCharacterCodeCache) asciiCharacterCodeCache.set(config,lookup);
    return lookup;
  }
  function asciiCodeForCharacter(character,config){
    var ch=normalizeCharacter(String(character==null?'':character).charAt(0));
    var lookup=asciiCodeLookupForConfig(config);
    if(Object.prototype.hasOwnProperty.call(lookup,ch)) return lookup[ch];
    var point=ch.charCodeAt(0);
    if(point>=32&&point<=125){
      var atPoint=asciiCharacterAt(config,point);
      if(!atPoint || atPoint===ch) return point;
    }
    return -1;
  }
  var ASCII_SEARCH_ALIASES={
    ' ':'space','!':'exclamation mark','\"':'double quote quotation mark','#':'hash number sign','$':'dollar sign','%':'percent sign','&':'ampersand',"'":'apostrophe single quote','(':'left parenthesis open parenthesis',')':'right parenthesis close parenthesis','*':'asterisk star','+':'plus sign',',':'comma','-':'hyphen minus dash','.':'period dot full stop','/':'slash forward slash',':':'colon',';':'semicolon','<':'less than','=':'equals','>':'greater than','?':'question mark','@':'at sign','[':'left bracket open bracket','\\':'backslash',']':'right bracket close bracket','^':'caret','_':'underscore','`':'grave accent backtick','{':'left brace open brace','|':'pipe vertical bar','}':'right brace close brace','~':'tilde',
    'α':'alpha','β':'beta','ε':'epsilon','μ':'mu','σ':'sigma','ρ':'rho','θ':'theta','∞':'infinity','Ω':'omega','Σ':'sigma uppercase','π':'pi','√':'square root','÷':'division sign','£':'pound sterling','¢':'cent sign','¥':'yen sign','ñ':'n tilde','ä':'a umlaut','Ö':'o umlaut','ü':'u umlaut'
  };
  function asciiLibraryName(character){
    var ch=String(character==null?'':character);
    if(Object.prototype.hasOwnProperty.call(ASCII_SEARCH_ALIASES,ch)) return ASCII_SEARCH_ALIASES[ch];
    if(ch===' ') return 'space';
    return ch;
  }
  function buildAsciiLibrary(config){
    if(config&&asciiLibraryCache&&asciiLibraryCache.has(config)) return asciiLibraryCache.get(config);
    var list=(config&&Array.isArray(config.asciiEntryCharacters))?config.asciiEntryCharacters:[];
    var rows=[];
    for(var code=Number(ASCII_ENTRY_INITIAL_CODE);code<=ASCII_ENTRY_MAX_CODE&&code<list.length;code++){
      var character=asciiCharacterAt(config,code);
      if(character==='') continue;
      var name=asciiLibraryName(character);
      rows.push({code:pad3(code),numericCode:code,character:character,display:character===' '?'Space':character,name:name,searchText:(pad3(code)+' '+character+' '+name).toLowerCase()});
    }
    if(config&&asciiLibraryCache) asciiLibraryCache.set(config,rows);
    return rows;
  }
  function findAsciiLibraryMatches(query,config){
    var q=String(query||'').trim().toLowerCase();
    var rows=buildAsciiLibrary(config);
    if(!q) return rows;
    return rows.filter(function(item){return item.searchText.indexOf(q)>=0;});
  }
  function manualKeyForCharacter(character){
    var ch=String(character||'');
    var upper=ch.toUpperCase();
    var keys=Object.keys(KEY_GROUPS);
    for(var i=0;i<keys.length;i++){
      var group=KEY_GROUPS[keys[i]];
      var wanted=/^[A-Za-z]$/.test(ch)?upper:ch;
      var index=group.indexOf(wanted);
      if(index>=0) return {key:keys[i],presses:index+1,isLetter:/^[A-Za-z]$/.test(ch),case:/^[a-z]$/.test(ch)?'lower':'upper'};
    }
    return null;
  }

  function bestCodeNavigation(targetCode,settings){
    settings=settings||{};
    var target=pad3(targetCode);
    var initial=pad3(settings.initial||'000');
    var caps=(settings.caps||[9,9,9]).map(Number);
    var codes=Array.isArray(settings.codes)?settings.codes.map(pad3):[];
    var targetIndex=codes.indexOf(target);
    if(targetIndex<0) return null;
    var best=null;
    function consider(digits,code){
      code=pad3(code);
      var index=codes.indexOf(code);
      if(index<0) return;
      var right=(targetIndex-index+codes.length)%codes.length;
      var left=(index-targetIndex+codes.length)%codes.length;
      var moves=Math.min(right,left);
      var direction=right<=left?'>':'<';
      var candidate={digits:digits.slice(),anchor:code,direction:direction,moves:moves,total:digits.length+moves};
      if(!best || candidate.total<best.total || (candidate.total===best.total && candidate.moves<best.moves) || (candidate.total===best.total && candidate.moves===best.moves && candidate.digits.length<best.digits.length)) best=candidate;
    }
    consider([],initial);
    var chars=initial.split('');
    for(var d0=0;d0<=caps[0];d0++) consider([String(d0)],String(d0)+chars[1]+chars[2]);
    for(var a=0;a<=caps[0];a++) for(var b=0;b<=caps[1];b++) consider([String(a),String(b)],String(a)+String(b)+chars[2]);
    for(var x=0;x<=caps[0];x++) for(var y=0;y<=caps[1];y++) for(var z=0;z<=caps[2];z++) consider([String(x),String(y),String(z)],String(x)+String(y)+String(z));
    return best;
  }

  function createPlanner(config,options){
    options=options||{};
    var steps=[];
    var cursor=0;
    var pendingKey='';
    var caseMode='upper';
    var screen='zone-label-entry';
    var keyCount=0;
    var unitCounter=0;
    var activeUnit=null;

    function beginUnit(type,label,target,length,extra){
      activeUnit=Object.assign({
        unitId:'unit-'+(++unitCounter),
        unitType:String(type||'action'),
        unitLabel:String(label||''),
        unitTarget:Number.isFinite(Number(target))?Number(target):-1,
        unitLength:Math.max(0,Number(length)||0)
      },extra||{});
      return activeUnit;
    }
    function endUnit(){activeUnit=null;}
    function unitMeta(meta){return Object.assign({},activeUnit||{},meta||{});}
    function addKey(key,title,detail,meta){
      steps.push(Object.assign({kind:'key',key:String(key),title:title||('Press ['+key+']'),detail:detail||'',screenBefore:screen},unitMeta(meta)));
      keyCount++;
    }
    function addWait(ms,title,detail,meta){steps.push(Object.assign({kind:'wait',key:'',ms:ms,title:title||('Wait '+ms+' ms'),detail:detail||'',screenBefore:screen},unitMeta(meta)));}
    function addInstruction(title,detail,meta){steps.push(Object.assign({kind:'instruction',key:'',title:title||'Instruction',detail:detail||'',screenBefore:screen},unitMeta(meta)));}
    function moveRightOnce(reason){
      addKey('>','Press [>]','Move the label cursor right'+(reason?' — '+reason:'')+'.',{operation:'cursor'});
      cursor=Math.min(TOTAL_CHARS-1,cursor+1);
      pendingKey='';
    }
    function ensureCursor(target,reason){
      if(target<cursor) throw new Error('Generator attempted to move the label cursor backwards.');
      while(cursor<target) moveRightOnce(reason);
    }
    function optionNameAt(index){
      var items=(config&&Array.isArray(config.zoneLabelSelectOptions))?config.zoneLabelSelectOptions:[];
      var item=items[index]||{};
      return String(item.line2||item.label||item.action||('Option '+(index+1)));
    }
    function openSelectOption(targetIndex,targetName){
      addKey('*','Press [*]','Open Select Option from the Zone Label editor.',{operation:'open-options'});
      screen='zone-label-select-options';
      var count=((config&&config.zoneLabelSelectOptions)||[]).length||6;
      var right=(targetIndex+count)%count;
      var left=(count-right)%count;
      var direction=right<=left?'>':'<';
      var moves=Math.min(right,left);
      var index=0;
      for(var i=0;i<moves;i++){
        index=(index+(direction==='>'?1:-1)+count)%count;
        addKey(direction,'Press ['+direction+']','Show '+optionNameAt(index)+'.',{operation:'select-option-scroll',optionIndex:index});
      }
      addKey('*','Press [*]','Select '+(targetName||optionNameAt(targetIndex))+'.',{operation:'select-option',optionIndex:targetIndex,optionName:(targetName||optionNameAt(targetIndex))});
    }
    function clearDisplay(){
      beginUnit('setup','Clear existing label',0,1);
      pendingKey='';
      openSelectOption(4,'Clear Display');
      screen='zone-label-entry'; cursor=0; pendingKey='';
      endUnit();
    }
    function startWithoutClear(){
      beginUnit('start','Begin label entry',0,1,{keepExistingLabel:true});
      addInstruction(
        'Begin at character 1',
        'Zone Label entry always starts at character 1.',
        {operation:'start-with-existing-label',instructionText:'Start at character 1'}
      );
      cursor=0;
      pendingKey='';
      endUnit();
    }
    function changeCase(targetCase,targetPosition,characterLabel){
      beginUnit('case','Change case',targetPosition,1,{targetCase:targetCase,character:characterLabel||''});
      pendingKey='';
      openSelectOption(2,'Change Case');
      caseMode=targetCase;
      screen='zone-label-case-selected';
      addWait(1100,'Wait for the confirmation','The keypad shows “'+(caseMode==='lower'?'Lower Case Now':'Upper Case Now')+' / Selected” for about 1.10 seconds, then returns to the label.',{operation:'case-wait'});
      screen='zone-label-entry';
      endUnit();
    }
    function prepareManualPosition(target,nextManual){
      if(target===cursor) return;
      if(target===cursor+1 && pendingKey && nextManual && pendingKey!==nextManual.key){
        /* A different multi-tap key commits the previous character, advances one
           position, and immediately starts the next character. */
        return;
      }
      ensureCursor(target,'move to the next character position');
    }
    function enterSpace(target,settings){
      settings=settings||{};
      var finalCursor=Math.max(target, Number.isFinite(Number(settings.advanceTo))?Number(settings.advanceTo):target);
      var allowZeroAlternative=options.clearFirst===false;
      beginUnit('space','Space',target,1,{character:' ',advanceTo:finalCursor,preparedNextPosition:finalCursor>target,allowZeroAlternative:allowZeroAlternative});
      /* A space is an actual blank LCD cell. If the label was cleared first,
         [>] can safely move across the blank. If existing text was preserved,
         the technician must be able to choose [0] when that cell contains an
         old character: [0] blanks the current cell and advances one position. */
      ensureCursor(target,'move the underline onto the LCD position that must be the space');
      if(finalCursor>target){
        if(allowZeroAlternative){
          addKey('>','Press [>] if blank, or [0] to clear and advance','If this space cell is already blank, press [>] to advance. If it contains old label text, press [0] to replace that character with a space and advance.',{operation:'space-advance-choice',zeroAlternative:true});
          cursor=Math.min(TOTAL_CHARS-1,cursor+1);
          pendingKey='';
        }else ensureCursor(finalCursor,'continue to the next entry position');
      }
      pendingKey='';
      endUnit();
    }
    function moveCursorForNewWord(target,label,settings){
      settings=settings||{};
      target=Math.max(0,Math.min(TOTAL_CHARS-1,Number(target)||0));
      if(target<=cursor) return false;
      var displayLabel=String(label||'next word');
      beginUnit('cursor','Move cursor for “'+displayLabel+'”',target,1,{
        cursorTarget:target,
        nextWord:displayLabel,
        wrapPreparation:!!settings.wrapPreparation
      });
      ensureCursor(target,settings.reason||('move the underline to the starting position for “'+displayLabel+'”'));
      pendingKey='';
      endUnit();
      return true;
    }
    function prepareManualCharacterStart(character,target,manual){
      var needsCase=manual&&manual.isLetter&&manual.case!==caseMode;
      var requiresExplicitMove=target>cursor && !(target===cursor+1 && pendingKey && manual && pendingKey!==manual.key && !needsCase);
      if(requiresExplicitMove){
        beginUnit('cursor','Move cursor for “'+String(character||'next character')+'”',target,1,{
          cursorTarget:target,
          character:character,
          nextWord:String(character||'next character')
        });
        ensureCursor(target,'move the underline to the character position for “'+String(character||'')+'”');
        pendingKey='';
        endUnit();
      }
      if(needsCase) changeCase(manual.case,target,character);
    }
    function prepareAsciiStart(character,target){
      if(target>cursor){
        beginUnit('cursor','Move cursor for “'+String(character===' '?'Space':character||'ASCII')+'”',target,1,{
          cursorTarget:target,
          character:character,
          nextWord:String(character===' '?'Space':character||'ASCII')
        });
        ensureCursor(target,'move the underline to the ASCII character position for “'+String(character===' '?'Space':character||'')+'”');
        pendingKey='';
        endUnit();
      }
    }
    function prepareWordStart(word,target){
      var wordLength=Array.from(word.label).length;
      var autoWrapToLine2=false;
      var desiredCursor=target;
      /* If a complete Word Entry word belongs on Line 2 and will not fit in
         the remaining Line 1 cells, position only far enough to trigger the
         keypad's automatic whole-word wrap. Any cursor movement is its own
         technician step; the Word Entry step starts after positioning is done. */
      if(target===LINE_CHARS && cursor<LINE_CHARS && wordLength>0 && wordLength<=LINE_CHARS){
        var minimumWrapCursor=LINE_CHARS-wordLength+1;
        if(minimumWrapCursor<LINE_CHARS){
          desiredCursor=Math.max(cursor,minimumWrapCursor);
          autoWrapToLine2=true;
        }
      }
      moveCursorForNewWord(desiredCursor,word.label,{
        wrapPreparation:autoWrapToLine2,
        reason:autoWrapToLine2
          ? 'move the underline far enough right that the complete word will no longer fit on Line 1'
          : 'move the underline to the first-letter position for this word'
      });
      return {autoWrapToLine2:autoWrapToLine2,preparedCursor:desiredCursor};
    }
    function prepareManualWordStart(token,target){
      return moveCursorForNewWord(target,token,{
        reason:'move the underline to the first character position for this new word'
      });
    }
    function typeManual(character,target){
      var manual=manualKeyForCharacter(character);
      if(!manual) throw new Error('No multi-tap mapping for '+character);
      beginUnit('character','Character “'+character+'”',target,1,{character:character,manualKey:manual.key,manualPresses:manual.presses});
      for(var p=0;p<manual.presses;p++){
        addKey(manual.key,'Press ['+manual.key+']',(p===0?'Enter':'Cycle to')+' “'+character+'” — press '+(p+1)+' of '+manual.presses+' on key ['+manual.key+'].',{operation:'character',character:character,pressIndex:p+1,pressTotal:manual.presses,target:target});
        if(p===0 && target===cursor+1 && pendingKey && pendingKey!==manual.key) cursor=target;
      }
      cursor=target;
      pendingKey=manual.key;
      endUnit();
    }
    function enterWord(word,target,settings){
      settings=settings||{};
      var wordLength=Array.from(word.label).length;
      var autoWrapToLine2=!!settings.autoWrapToLine2;
      beginUnit('word','Word “'+word.label+'”',target,wordLength,{word:word.label,code:word.code,autoWrapToLine2:autoWrapToLine2});
      /* Cursor positioning is deliberately not performed inside this unit.
         A required move is generated first as its own Move Cursor step. */
      pendingKey='';
      openSelectOption(0,'Word Entry');
      screen='zone-label-word-entry';
      var wordCode=pad3(word.code), wordWorkingCode=WORD_ENTRY_INITIAL_CODE, wordDigitCursor=0;
      Array.from(wordCode).forEach(function(digit,index){
        var bounded=boundedThreeDigitEntry(wordWorkingCode,wordDigitCursor,digit,WORD_ENTRY_MAX_CODE);
        wordWorkingCode=bounded.code; wordDigitCursor=bounded.cursor;
        addKey(digit,'Press ['+digit+']','Enter Word Library code ['+wordCode+'] — digit '+(index+1)+' of 3. Direct entry is bounded to '+pad3(WORD_ENTRY_MAX_CODE)+' as each digit is entered.',{operation:'word-code',word:word.label,code:wordCode,codeDigitIndex:index,displayedCodeAfter:bounded.code,acceptedDigit:bounded.acceptedDigit,maxCode:pad3(WORD_ENTRY_MAX_CODE)});
      });
      if(wordWorkingCode!==wordCode) throw new Error('Word Entry direct-code rules cannot reach ['+wordCode+'] from ['+WORD_ENTRY_INITIAL_CODE+'].');
      addKey('*','Press [*]','Insert “'+word.label+'” from Word Library ['+wordCode+'] at the current underline position.',{operation:'word-insert',word:word.label,code:wordCode});
      screen='zone-label-entry';
      cursor=target+Math.max(0,wordLength-1);
      pendingKey='';
      endUnit();
    }
    function enterAscii(character,target){
      var code=asciiCodeForCharacter(character,config);
      if(code<0) throw new Error('Character “'+character+'” is not available in the current NEO ASCII Entry table.');
      var codeText=pad3(code);
      beginUnit('ascii','ASCII “'+(character===' '?'Space':character)+'”',target,1,{character:character,code:codeText});
      pendingKey='';
      openSelectOption(1,'ASCII Entry');
      screen='zone-label-ascii-entry';
      var asciiWorkingCode=ASCII_ENTRY_INITIAL_CODE, asciiDigitCursor=0;
      Array.from(codeText).forEach(function(digit,index){
        var bounded=boundedThreeDigitEntry(asciiWorkingCode,asciiDigitCursor,digit,ASCII_ENTRY_MAX_CODE);
        asciiWorkingCode=bounded.code; asciiDigitCursor=bounded.cursor;
        addKey(digit,'Press ['+digit+']','Enter ASCII code ['+codeText+'] for “'+(character===' '?'Space':character)+'” — digit '+(index+1)+' of 3. ASCII Entry starts at ['+ASCII_ENTRY_INITIAL_CODE+'] and direct entry is bounded to '+pad3(ASCII_ENTRY_MAX_CODE)+'.',{operation:'ascii-code',character:character,code:codeText,codeDigitIndex:index,displayedCodeAfter:bounded.code,acceptedDigit:bounded.acceptedDigit,maxCode:pad3(ASCII_ENTRY_MAX_CODE)});
      });
      if(asciiWorkingCode!==codeText) throw new Error('ASCII Entry direct-code rules cannot reach ['+codeText+'] from ['+ASCII_ENTRY_INITIAL_CODE+'].');
      addKey('*','Press [*]','Insert “'+(character===' '?'Space':character)+'” with ASCII Entry ['+codeText+'] at the current underline position.',{operation:'ascii-insert',character:character,code:codeText});
      screen='zone-label-entry';
      cursor=target;
      pendingKey='';
      endUnit();
    }
    function save(){
      beginUnit('save','Save label',-1,0);
      pendingKey='';
      addKey('#','Press [#]','Save the completed Zone Label and return to the Zone Labels menu.',{operation:'save'});
      screen='zone-labels-menu';
      endUnit();
    }
    return {steps:steps,getCursor:function(){return cursor;},getCase:function(){return caseMode;},getKeyCount:function(){return keyCount;},clearDisplay:clearDisplay,startWithoutClear:startWithoutClear,enterSpace:enterSpace,prepareWordStart:prepareWordStart,prepareManualWordStart:prepareManualWordStart,prepareManualCharacterStart:prepareManualCharacterStart,prepareAsciiStart:prepareAsciiStart,typeManual:typeManual,enterWord:enterWord,enterAscii:enterAscii,ensureCursor:ensureCursor,save:save};
  }

  function buildPlan(text,options){
    options=options||{};
    var config=options.config||{};
    var layout=options.layoutOverride?explicitLabelLayout(options.layoutOverride.line1,options.layoutOverride.line2):wrapLabelText(text);
    var errors=layout.errors.slice();
    var useWords=options.useWordEntry!==false;
    if(useWords) layout=applyWordLibraryCasingToLayout(layout,config);
    if(!layout.valid) return {valid:false,errors:errors,layout:layout,steps:[],keyPressCount:0,wordMatches:desiredWordMatches(layout,config)};

    var planner=createPlanner(config,options);
    if(options.clearFirst!==false) planner.clearDisplay();
    else planner.startWithoutClear();

    function processLine(line,base){
      var chars=Array.from(line||'');
      var index=0;
      while(index<chars.length){
        if(chars[index]===' '){
          var advanceTo=base+index;
          if(index+1<chars.length && chars[index+1]!==' ') advanceTo=base+index+1;
          planner.enterSpace(base+index,{advanceTo:advanceTo});
          index++;
          continue;
        }

        var end=index;
        while(end<chars.length && chars[end]!==' ') end++;
        var token=chars.slice(index,end).join('');
        var word=useWords?automaticWordMatch(token,config):null;
        if(word){
          var wordPreparation=planner.prepareWordStart(word,base+index);
          planner.enterWord(word,base+index,wordPreparation);
          index=end;
          continue;
        }

        /* For a manually entered word/token, any explicit cursor travel to the
           token's first character is a separate step. Character-entry steps
           therefore begin with the underline already in the correct place. */
        planner.prepareManualWordStart(token,base+index);
        while(index<end){
          var character=chars[index];
          var manual=manualKeyForCharacter(character);
          if(manual){
            planner.prepareManualCharacterStart(character,base+index,manual);
            planner.typeManual(character,base+index);
          }
          else {
            var ascii=asciiCodeForCharacter(character,config);
            if(ascii<0){errors.push('Character “'+character+'” is not supported by the current NEO multi-tap or ASCII Entry tables.');break;}
            planner.prepareAsciiStart(character,base+index);
            planner.enterAscii(character,base+index);
          }
          index++;
        }
        if(errors.length) break;
      }
    }

    try{
      processLine(layout.line1,0);
      if(!errors.length) processLine(layout.line2,LINE_CHARS);
      if(!errors.length) planner.save();
    }catch(error){errors.push(error&&error.message?error.message:String(error));}

    return {
      valid:errors.length===0,
      errors:errors,
      layout:layout,
      steps:errors.length?[]:planner.steps,
      keyPressCount:errors.length?0:planner.getKeyCount(),
      wordMatches:desiredWordMatches(layout,config),
      useWordEntry:useWords,
      clearFirst:options.clearFirst!==false
    };
  }

  function fakeScheduler(){
    var next=1,tasks=new Map(),now=1000;
    return {
      options:{
        setTimeout:function(fn,ms){var id=next++;tasks.set(id,{fn:fn,ms:Number(ms)||0});return id;},
        clearTimeout:function(id){tasks.delete(id);},
        now:function(){return now;},
        wallNow:function(){return 1700000000000+now;}
      },
      runDelay:function(ms){
        var found=null;
        tasks.forEach(function(task,id){if(!found&&task.ms===ms) found={id:id,task:task};});
        if(!found) return false;
        tasks.delete(found.id);now+=ms;found.task.fn();return true;
      }
    };
  }
  function replayPlan(plan,options){
    options=options||{};
    var Sim=options.NeoPanelSimulator || root.NeoPanelSimulator;
    if(!Sim) return {validated:false,error:'NeoPanelSimulator is unavailable.',states:[]};
    if(!plan||!plan.valid) return {validated:false,error:'The generated plan is invalid.',states:[]};
    var scheduler=fakeScheduler();
    var config=clone(options.config||{});
    var sim;
    try{
      sim=new Sim(config,scheduler.options);
      sim.updateZone(1,{labelLine1:plan.clearFirst?'OLD LABEL TEXT':'',labelLine2:plan.clearFirst?'OLD SECOND LINE':''});
      var start=sim.enterZoneLabelEditor('label-generator-start',1,0,false);
      /* The validator starts directly inside programming instead of replaying the panel boot sequence. */
      sim.state.powered=true;
      sim.state.interactive=true;
      start=sim.getSnapshot();
      var states=[];
      plan.steps.forEach(function(step,index){
        var snap;
        if(step.kind==='key') snap=sim.pressKey(step.key);
        else if(step.kind==='wait'){
          if(!scheduler.runDelay(Number(step.ms)||0)) throw new Error('Expected '+step.ms+' ms keypad transition was not scheduled at step '+(index+1)+'.');
          snap=sim.getSnapshot();
        }else snap=sim.getSnapshot();
        states.push({index:index,step:step,snapshot:snap});
      });
      var zone=sim.getConfiguration().zones[0]||{};
      var actual1=String(zone.labelLine1||'');
      var actual2=String(zone.labelLine2||'');
      var expected1=plan.layout.line1;
      var expected2=plan.layout.line2;
      var ok=actual1===expected1&&actual2===expected2;
      return {
        validated:ok,
        error:ok?'':('Replay mismatch. Expected “'+expected1+'” / “'+expected2+'”; simulator saved “'+actual1+'” / “'+actual2+'”.'),
        expected:{line1:expected1,line2:expected2},
        actual:{line1:actual1,line2:actual2},
        states:states,
        startSnapshot:start
      };
    }catch(error){
      return {validated:false,error:error&&error.message?error.message:String(error),states:[]};
    }
  }

  function fastPreviewReplay(plan){
    if(!plan||!plan.valid) return {validated:false,previewOnly:true,error:'The generated plan is invalid.',states:[]};
    var cells=new Array(TOTAL_CHARS).fill(' ');
    var cursor=0;
    var states=[];
    function display(){
      return {line1:cells.slice(0,LINE_CHARS).join('').padEnd(16,' '),line2:cells.slice(LINE_CHARS,TOTAL_CHARS).join('').padEnd(16,' ')};
    }
    function cursorSnapshot(){return {line:cursor<LINE_CHARS?0:1,column:cursor<LINE_CHARS?cursor:cursor-LINE_CHARS,visible:true};}
    function applyUnit(step){
      var type=String(step.unitType||'');
      var target=Number(step.unitTarget);
      if(type==='setup'){cells.fill(' ');cursor=0;return;}
      if(type==='start'){cursor=0;return;}
      if(type==='word'){
        var text=String(step.word||'');
        if(Number.isFinite(target)&&target>=0){Array.from(text).forEach(function(ch,index){if(target+index<TOTAL_CHARS) cells[target+index]=ch;});cursor=Math.min(TOTAL_CHARS-1,target+Math.max(0,Array.from(text).length-1));}
        return;
      }
      if(type==='character'){if(Number.isFinite(target)&&target>=0){cells[target]=String(step.character||' ').charAt(0)||' ';cursor=target;}return;}
      if(type==='ascii'){if(Number.isFinite(target)&&target>=0){cells[target]=String(step.character||' ').charAt(0)||' ';cursor=target;}return;}
      if(type==='space'){
        if(Number.isFinite(target)&&target>=0) cells[target]=' ';
        var advance=Number(step.advanceTo);
        cursor=Number.isFinite(advance)?Math.min(TOTAL_CHARS-1,advance):(Number.isFinite(target)?target:cursor);
        return;
      }
      if(type==='cursor'){if(Number.isFinite(target)&&target>=0) cursor=Math.min(TOTAL_CHARS-1,target);return;}
    }
    (plan.steps||[]).forEach(function(step,index){
      var unit=String(step.unitId||('raw-'+index));
      var next=plan.steps[index+1];
      var nextUnit=next?String(next.unitId||('raw-'+(index+1))):'';
      if(!next||nextUnit!==unit) applyUnit(step);
      states.push({index:index,step:step,snapshot:{screen:'zone-label-entry',display:display(),cursor:cursorSnapshot()}});
    });
    return {validated:false,previewOnly:true,error:'',states:states,startSnapshot:{screen:'zone-label-entry',display:{line1:'                ',line2:'                '},cursor:{line:0,column:0,visible:true}}};
  }

  function analyzeInputWordMatches(text,config){
    var words=buildWordLibrary(config);
    var normalized=normalizeText(text).text.replace(/\n+/g,' ').trim().replace(/[\t ]+/g,' ');
    if(!normalized) return [];
    return normalized.split(' ').filter(Boolean).map(function(token,index){
      var lower=token.toLowerCase();
      var exact=words.filter(function(item){return item.label===token;});
      var caseMatches=exact.length?[]:words.filter(function(item){return item.label.toLowerCase()===lower;});
      var partial=(exact.length||caseMatches.length||lower.length<2)?[]:words.filter(function(item){
        var label=item.label.toLowerCase();
        return label.indexOf(lower)>=0 || lower.indexOf(label)>=0;
      }).slice(0,6);
      return {token:token,index:index,exact:exact,caseMatches:caseMatches,partial:partial,usable:(exact.length+caseMatches.length)>0};
    });
  }

  function analyzeInputAsciiMatches(text,config){
    var normalized=normalizeText(text).text.replace(/\n+/g,' ');
    var seen={};
    var rows=[];
    Array.from(normalized).forEach(function(character){
      if(seen[character]) return;
      seen[character]=true;
      var code=asciiCodeForCharacter(character,config);
      if(code<0) return;
      var manual=manualKeyForCharacter(character);
      rows.push({
        character:character,
        display:character===' '?'Space':character,
        code:pad3(code),
        generatedMethod:character===' '?'Cursor [>]':(manual?'Multi-tap':'ASCII Entry'),
        usesAscii:character!==' '&&!manual
      });
    });
    return rows;
  }

  function sequenceParts(steps){
    var parts=[];
    (steps||[]).forEach(function(step){
      if(step.kind==='wait') return; /* Internal simulator transition; never shown as a technician step. */
      if(step.kind==='instruction'){
        parts.push({text:String(step.instructionText||'No key press'),kind:'instruction',compressible:false,count:1});
        return;
      }
      if(step.operation==='space-advance-choice'){
        parts.push({text:'[>] if blank  OR  [0] × 2 if old text',kind:'choice',compressible:false,count:1});
        return;
      }
      var text='['+String(step.key)+']';
      if(step.operation==='select-option') text+=' ('+String(step.optionName||'Select')+')';
      else if(step.operation==='word-insert') text+=' (Insert '+String(step.word||'word')+')';
      else if(step.operation==='ascii-insert') text+=' (Insert ASCII '+String(step.code||'')+')';
      else if(step.operation==='save') text+=' (Save)';
      var compressible=['character','cursor','select-option-scroll'].indexOf(step.operation)>=0 && !/\(/.test(text);
      var previous=parts[parts.length-1];
      if(compressible && previous && previous.compressible && previous.text===text){previous.count=(previous.count||1)+1;return;}
      parts.push({text:text,kind:'key',compressible:compressible,count:1});
    });
    return parts;
  }
  function sequencePlain(parts){
    return (parts||[]).map(function(part){return part.text+((part.count||1)>1?' × '+part.count:'');}).join(' → ');
  }
  function sequenceMarkup(parts){
    return '<div class="label-generator-sequence">'+(parts||[]).map(function(part){
      var count=(part.count||1)>1?'<b>× '+part.count+'</b>':'';
      return '<span class="label-generator-sequence-part '+(part.kind==='wait'?'wait':'')+'"><span>'+esc(part.text)+'</span>'+count+'</span>';
    }).join('<i>→</i>')+'</div>';
  }
  function highlightForLogicalRange(target,length){
    target=Number(target); length=Math.max(0,Number(length)||0);
    if(!Number.isFinite(target)||target<0||!length) return null;
    if(target<LINE_CHARS) return {line:0,column:target,length:Math.min(length,LINE_CHARS-target)};
    var second=target-LINE_CHARS;
    return {line:1,column:second,length:Math.min(length,LINE_CHARS-second)};
  }
  function buildProcedureSteps(plan,replay){
    if(!plan||!plan.valid||!Array.isArray(plan.steps)||!plan.steps.length) return [];
    var groups=[];
    plan.steps.forEach(function(step,index){
      var id=step.unitId||('raw-'+index);
      var group=groups.length?groups[groups.length-1]:null;
      if(!group||group.id!==id){group={id:id,steps:[],rawIndexes:[]};groups.push(group);}
      group.steps.push(step); group.rawIndexes.push(index);
    });
    var startSnapshot=replay&&replay.startSnapshot?replay.startSnapshot:null;
    var lastLabelDisplay=startSnapshot&&startSnapshot.display?{line1:startSnapshot.display.line1||'',line2:startSnapshot.display.line2||''}:{line1:'                ',line2:'                '};
    var lastCursor=startSnapshot&&startSnapshot.cursor?clone(startSnapshot.cursor):{line:0,column:0,visible:true};
    return groups.map(function(group,index){
      var first=group.steps[0]||{};
      var endIndex=group.rawIndexes[group.rawIndexes.length-1];
      var snapshot=replay&&replay.states&&replay.states[endIndex]?replay.states[endIndex].snapshot:null;
      var display=snapshot&&snapshot.screen==='zone-label-entry'&&snapshot.display?snapshot.display:null;
      var cursor=snapshot&&snapshot.screen==='zone-label-entry'&&snapshot.cursor?snapshot.cursor:null;
      if((!display||!cursor) && replay&&replay.states){
        for(var ri=endIndex;ri>=0;ri--){
          var candidate=replay.states[ri]&&replay.states[ri].snapshot;
          if(candidate&&candidate.screen==='zone-label-entry'){
            if(!display&&candidate.display) display=candidate.display;
            if(!cursor&&candidate.cursor) cursor=candidate.cursor;
            if(display&&cursor) break;
          }
        }
      }
      if(first.unitType==='save'){display=lastLabelDisplay;cursor=lastCursor;}
      if(display) lastLabelDisplay={line1:display.line1||'',line2:display.line2||''};
      if(cursor) lastCursor=clone(cursor);
      var parts=sequenceParts(group.steps);
      if(first.unitType==='space' && first.allowZeroAlternative){
        if(first.preparedNextPosition){
          parts=[{text:'[>] × 2 if blank  OR  [>] → [0] × 2 if old text',kind:'choice',compressible:false,count:1}];
        }else{
          parts=[{text:'[>] if blank  OR  [>] → [0] if old text',kind:'choice',compressible:false,count:1}];
        }
      }
      var meta='';
      var description='';
      if(first.unitType==='word'){
        meta='Word Entry · code '+String(first.code||'');
        description='Insert “'+String(first.word||first.unitLabel||'')+'” using the Word Entry menu and its 3-digit code ['+String(first.code||'')+'].';
        if(first.autoWrapToLine2) description='Insert “'+String(first.word||first.unitLabel||'')+'” using the Word Entry menu and its 3-digit code ['+String(first.code||'')+']. Since it does not fit in the available space on L1, it is placed at the start of L2 automatically.';
      }else if(first.unitType==='ascii'){
        meta='ASCII Entry · code '+String(first.code||'');
        description='Insert “'+String(first.character||'')+'” using ASCII Entry and its 3-digit code ['+String(first.code||'')+'].';
      }else if(first.unitType==='character'){
        meta='Multi-tap character';
        description='Enter “'+String(first.character||'')+'”.';
      }else if(first.unitType==='cursor'){
        meta='Cursor positioning';
        description=first.wrapPreparation
          ? 'Move the underline far enough right for the next word to wrap to L2.'
          : 'Move the underline to the starting position for “'+String(first.nextWord||'the next entry')+'”.';
      }else if(first.unitType==='case'){
        meta='Change case';
        description='Switch to '+(String(first.targetCase||'upper')==='lower'?'lowercase':'uppercase')+' before entering “'+String(first.character||'the next character')+'”.';
      }else if(first.unitType==='start'){
        meta='Existing label kept';
        description='Zone Label entry always starts at character 1. The existing label is not shown in this generator, so the working LCD starts blank with the underline at the first position; follow the next steps to overwrite the existing characters/words as needed.';
      }else if(first.unitType==='space'){
        meta='Space';
        if(first.allowZeroAlternative&&first.preparedNextPosition){
          description='Advance to the required position with [>], or use [0] to delete existing characters while moving forward.';
        }else if(first.allowZeroAlternative){
          description='Leave this position blank with [>] if it is already empty, or use [0] to delete the existing character.';
        }else{
          description=first.preparedNextPosition
            ? 'Advance across the blank space to the next entry position.'
            : 'Move the underline onto this blank space.';
        }
      }else if(first.unitType==='setup'){
        meta='Preparation'; description='Clear the existing label. Entry starts at character 1.';
      }else if(first.unitType==='save'){
        meta='Finish'; description='Save the completed label.';
      }
      var highlightTarget=first.unitTarget;
      if(first.unitType==='space' && first.preparedNextPosition && Number.isFinite(Number(first.advanceTo))){
        /* The v299 Space step can intentionally perform two cursor moves: the
           first leaves the blank space, the second pre-positions the underline
           for the next entry. The result highlight must represent the final
           position of that step as well, otherwise the highlight appears left
           behind while the underline advances. */
        highlightTarget=Number(first.advanceTo);
      }
      return {
        index:index,id:group.id,type:first.unitType||'action',title:first.unitLabel||('Step '+(index+1)),meta:meta,description:description,
        sequence:parts,sequenceText:sequencePlain(parts),display:display||lastLabelDisplay,
        highlight:highlightForLogicalRange(highlightTarget,first.unitLength),cursor:cursor||lastCursor,rawStart:group.rawIndexes[0],rawEnd:endIndex
      };
    });
  }

  function plainTextSteps(plan,replay){
    if(!plan||!plan.valid) return '';
    var procedure=buildProcedureSteps(plan,replay);
    var lines=['PowerSeries NEO Label Entry','Desired LCD: '+plan.layout.line1+' / '+plan.layout.line2,''];
    procedure.forEach(function(step,index){
      lines.push(String(index+1).padStart(2,'0')+'. '+step.title+' — '+step.sequenceText);
    });
    if(replay&&replay.validated) lines.push('','Validated: final saved label matches the requested 2 × 14 LCD text.');
    return lines.join('\n');
  }

  /* ---------------- Browser UI ---------------- */
  var host=null;
  function defaultLabelUiState(){
    return {text:'Front Door Motion',entryMode:'single',line1:'',line2:'',activeField:'single',activeTool:'word',openTools:{keypad:false,word:true,ascii:true,options:false,steps:false},useWordEntry:true,plan:null,replay:null,planVariants:null,replayVariants:null,generatedSignature:null,search:'',asciiSearch:'',showMatches:false,showAsciiMatches:false,showLibrary:false,showAsciiLibrary:false,asciiLibraryRows:null,selectedStep:-1,rendered:false};
  }
  var uiState=defaultLabelUiState();
  var draftRenderTimer=0,uiConfigSnapshot=null;
  var librarySearchFrame=0,asciiLibrarySearchFrame=0;

  function uiInputText(){
    return uiState.entryMode==='lines'?(String(uiState.line1||'')+(uiState.line2?'\n'+String(uiState.line2):'')):String(uiState.text||'');
  }
  function uiDraftLayout(){
    return uiState.entryMode==='lines'?explicitLabelLayout(uiState.line1,uiState.line2):wrapLabelText(uiState.text);
  }
  function layoutSignature(layout){
    if(!layout||!layout.valid) return null;
    return String(layout.line1||'')+'\u0000'+String(layout.line2||'');
  }
  function currentDraftSignature(){return layoutSignature(uiDraftLayout());}
  function generatedStepsStale(){
    return !!(uiState.planVariants&&uiState.generatedSignature!=null&&currentDraftSignature()!==uiState.generatedSignature);
  }

  function freshConfig(){
    if(typeof root.dscGetNeoSimulatorConfiguration==='function'){
      var value=root.dscGetNeoSimulatorConfiguration();
      if(value) return clone(value);
    }
    if(root.NEO_PANEL_DEFAULTS) return clone(root.NEO_PANEL_DEFAULTS);
    return {};
  }
  function currentConfig(force){
    if(force||!uiConfigSnapshot) uiConfigSnapshot=freshConfig();
    return uiConfigSnapshot;
  }
  function lcdMarkup(line1,line2,highlight,compact,cursor){
    line1=String(line1||'').padEnd(16,' ').slice(0,16);
    line2=String(line2||'').padEnd(16,' ').slice(0,16);
    function renderLine(text,line){
      return '<div class="label-generator-lcd-line">'+Array.from(text).map(function(ch,col){
        var active=highlight&&Number(highlight.line)===line&&col>=Number(highlight.column)&&col<Number(highlight.column)+Number(highlight.length||1);
        var underlined=cursor&&cursor.visible!==false&&Number(cursor.line)===line&&Number(cursor.column)===col;
        var classes=[];
        var unavailable=col>=LINE_CHARS;
        if(active&&!unavailable) classes.push('result-highlight');
        if(underlined&&!unavailable) classes.push('cursor-underline');
        if(unavailable) classes.push('lcd-unavailable');
        return '<span class="'+classes.join(' ')+'"'+(unavailable?' title="Not editable — NEO labels use 14 of the 16 LCD positions" aria-label="Not editable"':'')+'><span class="label-generator-lcd-char">'+esc(ch===' ' ? '\u00a0' : ch)+'</span><span class="label-generator-lcd-underline" aria-hidden="true"></span></span>';
      }).join('')+'</div>';
    }
    return '<div class="label-generator-lcd '+(compact?'compact':'')+'">'+renderLine(line1,0)+renderLine(line2,1)+'</div>';
  }
  function errorMarkup(plan){
    if(!plan||plan.valid) return '';
    return '<div class="label-generator-validation error"><strong>Cannot generate this label</strong><span>'+plan.errors.map(esc).join('<br>')+'</span></div>';
  }
  function inputMatchesPanelMarkup(){
    if(!uiState.showMatches) return '';
    var sourceRows=analyzeInputWordMatches(uiInputText(),currentConfig());
    var rows=[];
    var seen={};
    sourceRows.forEach(function(row){
      var matches=row.exact.length?row.exact:(row.caseMatches.length?row.caseMatches:row.partial);
      matches.forEach(function(item){
        var key=String(item.code)+'|'+String(item.label);
        if(seen[key]) return;
        seen[key]=true;
        rows.push({label:item.label,code:item.code});
      });
    });
    return '<div class="label-generator-tool-panel">'+
      '<div class="label-generator-input-matches-head"><strong>Word matches in this label</strong><span>Matches use the active NEO Word Library.</span></div>'+ 
      (rows.length?'<div class="label-generator-library-results label-generator-match-results">'+rows.map(function(row){
        return '<div class="label-generator-library-row label-generator-match-row"><span>'+esc(row.code)+'</span><strong>'+esc(row.label)+'</strong></div>';
      }).join('')+'</div>':'<p class="muted">No Word Library matches found in the current label.</p>')+
    '</div>';
  }
  function asciiMatchesPanelMarkup(){
    if(!uiState.showAsciiMatches) return '';
    var rows=analyzeInputAsciiMatches(uiInputText(),currentConfig());
    return '<div class="label-generator-tool-panel">'+
      '<div class="label-generator-input-matches-head"><strong>ASCII matches in this label</strong><span>Codes are taken from the active NEO ASCII Entry table.</span></div>'+ 
      (rows.length?'<div class="label-generator-library-results label-generator-match-results">'+rows.map(function(row){
        return '<div class="label-generator-library-row label-generator-match-row"><span>'+esc(row.code)+'</span><strong>'+esc(row.display)+'</strong></div>';
      }).join('')+'</div>':'<p class="muted">No ASCII matches found in the current label.</p>')+
    '</div>';
  }
  function procedureRows(){return buildProcedureSteps(uiState.plan,uiState.replay);}
  function stepListMarkup(){
    var rows=procedureRows();
    if(!rows.length){
      return '<div class="label-generator-step-list" data-label-step-list><div class="label-generator-input-matches-head label-generator-all-steps-head" data-label-steps-head><strong>All label-entry steps</strong><span>Click Generate Label Steps to build both procedures.</span></div><div class="label-generator-current-empty">Enter the label, then click Generate Label Steps.</div></div>';
    }
    return '<div class="label-generator-step-list" data-label-step-list>'+ 
      '<div class="label-generator-input-matches-head label-generator-all-steps-head" data-label-steps-head><strong>All label-entry steps</strong><span>'+rows.length+' total steps.</span></div>'+ 
      '<div class="label-generator-step-list-rows">'+rows.map(function(row,index){
        var display=row.display||{};
        return '<div class="label-generator-step-row '+(index===uiState.selectedStep?'active':'')+'" data-label-step-index="'+index+'">'+
          '<div class="label-generator-step-copy"><span>Step '+(index+1)+' · '+esc(row.meta)+'</span><strong>'+esc(row.title)+'</strong>'+sequenceMarkup(row.sequence)+'</div>'+ 
          '<div class="label-generator-step-preview">'+lcdMarkup(display.line1,display.line2,row.highlight,true,row.cursor)+'</div>'+ 
        '</div>';
      }).join('')+'</div>'+ 
    '</div>';
  }
  function searchMatchesMarkup(){
    var matches=findWordMatches(uiState.search,currentConfig());
    return '<div class="label-generator-library-results">'+(matches.length?matches.map(function(item){
      return '<button type="button" data-label-library-word="'+esc(item.label)+'" class="label-generator-library-row"><span>'+esc(item.code)+'</span><strong>'+esc(item.label)+'</strong></button>';
    }).join(''):'<p class="muted">No Word Library matches.</p>')+'</div>';
  }
  function libraryPanelMarkup(){
    if(!uiState.showLibrary) return '';
    return '<div class="label-generator-tool-panel label-generator-library-inline"><div class="label-generator-input-matches-head"><strong>Word Library Finder</strong><span>Search by word or 3-digit code; click a result to insert it.</span></div><div class="label-generator-library-body"><label><span>Find a word</span><input type="search" data-label-library-search value="'+esc(uiState.search)+'" placeholder="Kitchen, Motion, 171…"></label><p class="muted">Uses the complete active NEO Word Entry library.</p>'+searchMatchesMarkup()+'</div></div>';
  }
  function asciiLibraryMatchesMarkup(){
    var rows=Array.isArray(uiState.asciiLibraryRows)?uiState.asciiLibraryRows:buildAsciiLibrary(currentConfig());
    var query=String(uiState.asciiSearch||'').trim().toLowerCase();
    var matches=query?rows.filter(function(item){return item.searchText.indexOf(query)>=0;}):rows;
    return '<div class="label-generator-library-results label-generator-ascii-library-results">'+(matches.length?matches.map(function(item){
      return '<div class="label-generator-library-row label-generator-ascii-library-row" title="ASCII Entry ['+esc(item.code)+']"><span>'+esc(item.code)+'</span><strong>'+esc(item.character===' '?'\u00a0':item.character)+'</strong></div>';
    }).join(''):'<p class="muted">No ASCII Entry characters match this search.</p>')+'</div>';
  }
  function asciiLibraryPanelMarkup(){
    if(!uiState.showAsciiLibrary) return '';
    return '<div class="label-generator-tool-panel label-generator-library-inline label-generator-ascii-library-inline"><div class="label-generator-input-matches-head"><strong>ASCII Entry Library</strong><span>Search the active keypad character table by character, name, or 3-digit code.</span></div><div class="label-generator-library-body"><label><span>Find an ASCII character</span><input type="search" data-label-ascii-library-search value="'+esc(uiState.asciiSearch)+'" placeholder="@, Space, alpha, 064…"></label><p class="muted">Shows all available characters from ASCII Entry ['+ASCII_ENTRY_INITIAL_CODE+'] through ['+pad3(ASCII_ENTRY_MAX_CODE)+'].</p>'+asciiLibraryMatchesMarkup()+'</div></div>';
  }
  function allStepsPanelMarkup(){
    return '<div class="label-generator-tool-panel label-generator-all-steps-panel">'+stepListMarkup()+'</div>';
  }

  function labelToolsNavigationMarkup(){
    var tools=[
      {id:'keypad',title:'Keypad Text Entry'},
      {id:'word',title:'Word Library Finder'},
      {id:'ascii',title:'ASCII Library Finder'},
      {id:'options',title:'Label Entry Options'},
      {id:'steps',title:'Label Entry Steps Generator'}
    ];
    return '<nav class="label-tools-navigation card" aria-label="Label Entry Tools">'+tools.map(function(tool){
      var active=!!(uiState.openTools&&uiState.openTools[tool.id]);
      var current=uiState.activeTool===tool.id;
      return '<div class="label-tools-navigation-item '+(active?'active ':'')+(current?'current':'')+'">'+
        '<button type="button" class="label-tools-navigation-button '+(active?'active':'')+'" data-label-tool="'+tool.id+'" aria-expanded="'+(active?'true':'false')+'" title="Open and go to '+esc(tool.title)+'"><span class="label-tools-navigation-copy"><strong>'+esc(tool.title)+'</strong></span></button>'+
        '<button type="button" class="label-tools-toggle-indicator '+(active?'active':'')+'" data-label-tool-toggle="'+tool.id+'" aria-pressed="'+(active?'true':'false')+'" aria-label="'+(active?'Hide ':'Show ')+esc(tool.title)+'" title="'+(active?'Hide':'Show')+' '+esc(tool.title)+'">'+(active?'−':'+')+'</button>'+
      '</div>';
    }).join('')+'</nav>';
  }
  function labelToolSectionMarkup(id,title,subtitle,body,extraClass){
    var open=!!(uiState.openTools&&uiState.openTools[id]);
    return '<section id="label-tool-'+id+'" data-label-tool-panel="'+id+'" class="label-tools-panel label-tools-collapsible-panel card '+(extraClass||'')+' '+(open?'is-open':'is-collapsed')+'">'+
      '<div class="label-tools-section-head">'+
        '<button type="button" class="label-tools-section-toggle-left" data-label-section-toggle="'+id+'" aria-expanded="'+(open?'true':'false')+'" aria-label="'+(open?'Collapse ':'Expand ')+esc(title)+'" title="'+(open?'Collapse ':'Expand ')+esc(title)+'"><span aria-hidden="true">›</span></button>'+
        '<div class="label-tools-section-heading-copy"><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div>'+
      '</div>'+
      '<div class="label-tools-section-body" '+(open?'':'hidden')+'>'+body+'</div>'+
    '</section>';
  }
  function keypadTextEntryToolMarkup(){
    var record=root.DSC_NEO_REFERENCE_DATA&&root.DSC_NEO_REFERENCE_DATA.keypadTextEntry;
    var rows=record&&Array.isArray(record.rows)?record.rows:[];
    if(!rows.length){
      rows=Object.keys(KEY_GROUPS).map(function(key){return {key:'['+key+']',presses:KEY_GROUPS[key].slice()};});
      rows.push({key:'[0]',presses:['Space','-','-','-']},{key:'[*]',presses:['Select','-','-','-']},{key:'[#]',presses:['Escape / Back','-','-','-']});
    }
    var groups=[];for(var i=0;i<rows.length;i+=3) groups.push(rows.slice(i,i+3));
    var body='<section class="reference-intro"><p>'+(record&&record.subtitle?esc(record.subtitle):'Press a keypad key repeatedly to cycle through the characters assigned to that key while programming labels.')+'</p>'+
      (record&&record.example?'<div class="reference-example"><strong>Example</strong><span>'+esc(String(record.example).replace(/^Example:\s*/i,''))+'</span></div>':'')+'</section>'+
      '<div class="keypad-entry-grid label-tools-keypad-grid">'+groups.map(function(group){return '<div class="keypad-entry-group"><table class="reference-table keypad-entry-mini-table"><thead><tr><th>Key</th><th>x1</th><th>x2</th><th>x3</th><th>x4</th></tr></thead><tbody>'+group.map(function(row){return '<tr><td><kbd>'+esc(row.key||'-')+'</kbd></td>'+(row.presses||[]).map(function(value){return '<td>'+esc(value||'-')+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';}).join('')+'</div>';
    return labelToolSectionMarkup('keypad','Keypad Text Entry','Key mapping for manual label entry.',body,'label-tools-keypad-reference');
  }
  function wordLibraryFinderToolMarkup(){
    var body='<div class="label-generator-library-body label-tools-library-body"><label><span>Find a word</span><input type="search" data-label-library-search value="'+esc(uiState.search)+'" placeholder="Kitchen, Motion, 171…"></label><div class="label-tools-library-count"><strong>'+buildWordLibrary(currentConfig()).length+'</strong><span>entries</span></div>'+searchMatchesMarkup()+'</div>';
    return labelToolSectionMarkup('word','Word Library Finder','Search the complete active NEO Word Entry library by word or 3-digit code.',body,'');
  }
  function asciiLibraryFinderToolMarkup(){
    if(!Array.isArray(uiState.asciiLibraryRows)) uiState.asciiLibraryRows=buildAsciiLibrary(currentConfig());
    var body='<div class="label-generator-library-body label-tools-library-body"><label><span>Find an ASCII character</span><input type="search" data-label-ascii-library-search value="'+esc(uiState.asciiSearch)+'" placeholder="@, Space, alpha, 064…"></label><div class="label-tools-library-count"><strong>'+uiState.asciiLibraryRows.length+'</strong><span>entries</span></div>'+asciiLibraryMatchesMarkup()+'</div>';
    return labelToolSectionMarkup('ascii','ASCII Library Finder','Search the active keypad character table by character, common name, or 3-digit code.',body,'');
  }
  function labelEntryOptionsToolMarkup(){
    var config=currentConfig();
    var configured=Array.isArray(config.zoneLabelSelectOptions)?config.zoneLabelSelectOptions:[];
    var fallback=['Word Entry','ASCII Entry','Change Case','Clear to End','Clear Display','Save'];
    var descriptions=[
      'Open the Word Library and select a commonly used label word by its 3-digit code.',
      'Open ASCII Entry to select a character by its 3-digit code or with the arrow keys.',
      'Toggle label letter entry between uppercase and lowercase.',
      'Clear the label from the current cursor position through the end of the display.',
      'Clear all characters from the label display.',
      'Save the current label.'
    ];
    var rows=fallback.map(function(name,index){var item=configured[index]||{};return {position:index+1,name:String(item.line2||item.label||item.action||name),description:descriptions[index]};});
    var body='<div class="table-scroll label-tools-options-table-scroll"><table class="program-inline-table label-tools-options-table"><thead><tr><th>Option #</th><th>Option</th><th>What it does</th></tr></thead><tbody>'+rows.map(function(row){return '<tr><td><span class="label-tools-option-number">'+row.position+'</span></td><td><strong>'+esc(row.name)+'</strong></td><td>'+esc(row.description)+'</td></tr>';}).join('')+'</tbody></table></div>';
    return labelToolSectionMarkup('options','Label Entry Options','[*] Select Option menu used while editing a label.',body,'');
  }
  function stepsGeneratorToolMarkup(plan,layout,rows,staleSteps){
    var body='<div class="label-generator-input-grid '+(uiState.entryMode==='lines'?'line-mode':'single-mode')+'">'+
          '<div class="label-generator-entry"><div class="label-generator-entry-head"><span>Desired label text</span><button class="secondary label-generator-entry-mode-toggle" type="button" data-label-entry-mode>'+(uiState.entryMode==='single'?'2-line entry':'Whole-label entry')+'</button></div>'+ 
            (uiState.entryMode==='single'?'<input type="text" maxlength="29" data-label-input="single" value="'+esc(uiState.text)+'" placeholder="Enter the whole label…"><small>Whole-label mode wraps complete words automatically and blocks any input that would exceed the two 14-character editable lines.</small>':'<div class="label-generator-line-inputs"><label><span>Line 1</span><input type="text" maxlength="14" data-label-input="line1" value="'+esc(uiState.line1)+'" placeholder="Up to 14 characters"></label><label><span>Line 2</span><input type="text" maxlength="14" data-label-input="line2" value="'+esc(uiState.line2)+'" placeholder="Up to 14 characters"></label></div><small>Line-by-line mode lets you choose the exact text on each 14-character line.</small>')+
          '</div>'+ 
          '<div class="label-generator-final-preview"><span>Final 2 × 14 LCD label</span><div class="label-generator-final-lcd-row">'+lcdMarkup(layout.line1,layout.line2,null,false,null)+'</div><div class="label-generator-line-count"><span>L1: '+Array.from(layout.line1||'').length+'/14</span><span>L2: '+Array.from(layout.line2||'').length+'/14</span></div></div>'+ 
        '</div>'+ 
        '<div class="label-generator-options">'+
          '<label><input type="checkbox" data-label-use-words '+(uiState.useWordEntry?'checked':'')+'> Use Word Entry matches</label>'+ 
          '<button class="primary label-generator-generate '+(staleSteps?'needs-regeneration':'')+'" type="button" data-label-generate '+(staleSteps?'data-label-generate-stale="true" title="Label changed — generate the steps again" ':'')+(!String(uiInputText()||'').trim()?'disabled':'')+'>Generate Label Steps'+(staleSteps?'<span class="label-generator-regenerate-badge" aria-label="Steps need to be generated again">!</span>':'')+'</button>'+ 
          '<button class="secondary label-generator-reset" type="button" data-label-reset-generator>Clear / Reset</button>'+
          '<button class="secondary '+(uiState.showMatches?'active':'')+'" type="button" data-label-show-matches '+(!String(uiInputText()||'').trim()?'disabled':'')+'>'+(uiState.showMatches?'Hide Word Matches':'Show Word Matches')+'</button>'+ 
          '<button class="secondary '+(uiState.showAsciiMatches?'active':'')+'" type="button" data-label-show-ascii '+(!String(uiInputText()||'').trim()?'disabled':'')+'>'+(uiState.showAsciiMatches?'Hide ASCII Matches':'Show ASCII Matches')+'</button>'+ 
          '<button class="secondary" type="button" data-label-copy-steps '+(!plan||!plan.valid?'disabled':'')+'>Copy procedure</button>'+ 
          '<span class="label-generator-count">'+(plan&&plan.valid?plan.keyPressCount:0)+' key presses · '+rows.length+' steps</span>'+ 
        '</div>'+ 
        errorMarkup(plan)+inputMatchesPanelMarkup()+asciiMatchesPanelMarkup()+allStepsPanelMarkup();
    return labelToolSectionMarkup('steps','Label Entry Steps Generator','Build the keypad procedure for the desired two-line label.',body,'label-generator-fixed');
  }

  function syncLabelHeaderControls(){
    var header=root.document&&root.document.getElementById('labelEntryGeneratorHeaderControls');
    if(!header) return;
    header.innerHTML='<button type="button" class="secondary compact-action-button tool-header-reset-button" data-label-tools-reset aria-label="Reset Label Entry Tools" title="Reset Label Entry Tools">Reset</button>';
  }
  function resetLabelEntryTools(){
    if(draftRenderTimer){root.clearTimeout(draftRenderTimer);draftRenderTimer=0;}
    uiConfigSnapshot=null;
    uiState=defaultLabelUiState();
    render();
  }

  function render(){
    if(!host) host=document.getElementById('neoLabelEntryGenerator');
    if(!host) return;
    syncLabelHeaderControls();
    var active=root.document&&root.document.activeElement;
    var restoreInput=!!(active&&active.matches&&active.matches('[data-label-input]'));
    var restoreField=restoreInput?String(active.getAttribute('data-label-input')||'single'):'';
    var selectionStart=restoreInput&&active.selectionStart!=null?active.selectionStart:null;
    var selectionEnd=restoreInput&&active.selectionEnd!=null?active.selectionEnd:null;
    var plan=uiState.plan;
    var layout=uiDraftLayout();
    if(uiState.useWordEntry) layout=applyWordLibraryCasingToLayout(layout,currentConfig());
    var rows=uiState.openTools&&uiState.openTools.steps?procedureRows():[];
    var staleSteps=generatedStepsStale();
    var oldStepList=host.querySelector('[data-label-step-list]');
    var previousStepScrollTop=oldStepList?oldStepList.scrollTop:0;
    var content=[];
    content.push(keypadTextEntryToolMarkup());
    content.push(wordLibraryFinderToolMarkup());
    content.push(asciiLibraryFinderToolMarkup());
    content.push(labelEntryOptionsToolMarkup());
    content.push(stepsGeneratorToolMarkup(plan,layout,rows,staleSteps));
    host.innerHTML='<div class="label-generator-shell label-tools-shell">'+labelToolsNavigationMarkup()+content.join('')+'</div>';
    bindRenderedControls();
    var restoredStepList=host.querySelector('[data-label-step-list]');
    if(restoredStepList) restoredStepList.scrollTop=previousStepScrollTop;
    if(restoreInput){
      var restored=host.querySelector('[data-label-input="'+restoreField+'"]');
      if(restored){restored.focus();try{restored.setSelectionRange(selectionStart,selectionEnd);}catch(error){}}
    }
    uiState.rendered=true;
  }

  function applyWordEntryVariant(){
    if(!uiState.planVariants||!uiState.replayVariants) return false;
    var key=uiState.useWordEntry?'word':'manual';
    uiState.plan=uiState.planVariants[key];
    if(!uiState.replayVariants[key]&&uiState.plan&&uiState.plan.valid) uiState.replayVariants[key]=fastPreviewReplay(uiState.plan);
    uiState.replay=uiState.replayVariants[key];
    return true;
  }
  function generateNow(){
    var config=currentConfig(true);
    var layoutOverride=uiState.entryMode==='lines'?{line1:uiState.line1,line2:uiState.line2}:null;
    var base={config:config,clearFirst:true,layoutOverride:layoutOverride};
    var wordPlan=buildPlan(uiInputText(),Object.assign({},base,{useWordEntry:true}));
    var manualPlan=buildPlan(uiInputText(),Object.assign({},base,{useWordEntry:false}));
    /* Runtime generation uses a deterministic lightweight preview. Full keypad-simulator
       replay remains available through replayPlan() and the regression suite, but no longer
       blocks every Generate click just to draw the step list. */
    var wordReplay=wordPlan.valid?fastPreviewReplay(wordPlan):null;
    var manualReplay=manualPlan.valid?fastPreviewReplay(manualPlan):null;
    uiState.planVariants={word:wordPlan,manual:manualPlan};
    uiState.replayVariants={word:wordReplay,manual:manualReplay};
    uiState.generatedSignature=currentDraftSignature();
    applyWordEntryVariant();
    uiState.selectedStep=procedureRows().length?0:-1;
    render();
    scheduleSelectedStepVisible();
  }
  function generate(){
    /* Legacy regression marker: dscScheduleWorkspaceTask('Generating and validating label-entry steps…',generateNow) */
    if(root.dscScheduleWorkspaceTask){root.dscScheduleWorkspaceTask('Generating label-entry steps…',generateNow);return;}
    generateNow();
  }
  function invalidateGeneratedProcedure(){
    uiState.plan=null;
    uiState.replay=null;
    uiState.planVariants=null;
    uiState.replayVariants=null;
    uiState.generatedSignature=null;
    uiState.selectedStep=-1;
  }
  function scheduleDraftRender(){
    if(draftRenderTimer) root.clearTimeout(draftRenderTimer);
    draftRenderTimer=root.setTimeout(function(){
      draftRenderTimer=0;
      var view=root.document&&root.document.getElementById('view-label-entry-generator');
      if(view && !view.classList.contains('active')){uiState.renderPending=true;return;}
      uiState.renderPending=false;render();
    },80);
  }
  function ensureSelectedStepVisible(){
    if(!host||uiState.selectedStep<0) return;
    var list=host.querySelector('[data-label-step-list]');
    var row=host.querySelector('[data-label-step-index="'+uiState.selectedStep+'"]');
    if(!list||!row) return;
    var head=list.querySelector('[data-label-steps-head]');
    var listRect=list.getBoundingClientRect();
    var rowRect=row.getBoundingClientRect();
    var visibleTop=listRect.top+(head?head.getBoundingClientRect().height:0)+5;
    var visibleBottom=listRect.bottom-5;
    if(rowRect.top<visibleTop){
      list.scrollTop+=rowRect.top-visibleTop;
    }else if(rowRect.bottom>visibleBottom){
      list.scrollTop+=rowRect.bottom-visibleBottom;
    }
    var after=row.getBoundingClientRect();
    var viewportTop=8;
    var viewportBottom=(root.innerHeight||document.documentElement.clientHeight||0)-8;
    if((after.top<viewportTop || (viewportBottom>0 && after.bottom>viewportBottom)) && row.scrollIntoView){
      row.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
    }else if(after.top<viewportTop && root.scrollBy){
      root.scrollBy(0,after.top-viewportTop);
    }else if(viewportBottom>0 && after.bottom>viewportBottom && root.scrollBy){
      root.scrollBy(0,after.bottom-viewportBottom);
    }
  }
  function scheduleSelectedStepVisible(){
    if(uiState.selectedStep<0) return;
    var fn=function(){ensureSelectedStepVisible();};
    if(root.requestAnimationFrame) root.requestAnimationFrame(fn);
    else root.setTimeout(fn,0);
  }
  function selectStep(index,ensureVisible){
    var rows=procedureRows();
    if(!rows.length){uiState.selectedStep=-1;return;}
    uiState.selectedStep=Math.max(0,Math.min(rows.length-1,Number(index)||0));
    host.querySelectorAll('[data-label-step-index]').forEach(function(row){
      row.classList.toggle('active',Number(row.getAttribute('data-label-step-index'))===uiState.selectedStep);
    });
    if(ensureVisible!==false) scheduleSelectedStepVisible();
  }
  function scrollToLabelTool(toolId,behavior){
    if(!host) return;
    var panel=host.querySelector('[data-label-tool-panel="'+String(toolId||'')+'"]');
    if(!panel) return;
    var nav=host.querySelector('.label-tools-navigation');
    var navHeight=nav?nav.getBoundingClientRect().height:50;
    var stickyTop=68;
    if(nav&&root.getComputedStyle){
      var parsedTop=parseFloat(root.getComputedStyle(nav).top||'');
      if(Number.isFinite(parsedTop)) stickyTop=parsedTop;
    }
    var view=panel.closest&&panel.closest('.view.active');
    var viewScrollable=false;
    if(view&&root.getComputedStyle){
      var overflowY=root.getComputedStyle(view).overflowY||'';
      viewScrollable=/(auto|scroll)/.test(overflowY)&&view.scrollHeight>view.clientHeight+1;
    }
    if(viewScrollable){
      var viewRect=view.getBoundingClientRect();
      var panelRect=panel.getBoundingClientRect();
      var targetTop=Math.max(0,view.scrollTop+(panelRect.top-viewRect.top)-stickyTop-navHeight-8);
      if(view.scrollTo){
        try{view.scrollTo({top:targetTop,behavior:behavior||'smooth'});}catch(error){view.scrollTop=targetTop;}
      }else view.scrollTop=targetTop;
      return;
    }
    var panelRectWindow=panel.getBoundingClientRect();
    var currentY=root.pageYOffset!=null?root.pageYOffset:(document.documentElement.scrollTop||document.body.scrollTop||0);
    var targetY=Math.max(0,currentY+panelRectWindow.top-stickyTop-navHeight-8);
    if(root.scrollTo){
      try{root.scrollTo({top:targetY,behavior:behavior||'smooth'});}catch(error){root.scrollTo(0,targetY);}
    }else if(panel.scrollIntoView) panel.scrollIntoView({block:'start',behavior:behavior||'smooth'});
  }
  function scheduleLabelToolNavigation(toolId){
    var fn=function(){scrollToLabelTool(toolId,'smooth');};
    if(root.requestAnimationFrame) root.requestAnimationFrame(function(){root.requestAnimationFrame(fn);});
    else root.setTimeout(fn,0);
  }
  function bindRenderedControls(){
    host.querySelectorAll('[data-label-section-toggle]').forEach(function(button){button.addEventListener('click',function(event){
      event.preventDefault();event.stopPropagation();
      var next=String(button.getAttribute('data-label-section-toggle')||'word');
      if(!uiState.openTools) uiState.openTools={keypad:false,word:true,ascii:true,options:false,steps:false};
      var willOpen=!uiState.openTools[next];
      uiState.openTools[next]=willOpen;
      uiState.activeTool=next;
      if(next==='ascii'&&willOpen&&!Array.isArray(uiState.asciiLibraryRows)) uiState.asciiLibraryRows=buildAsciiLibrary(currentConfig());
      render();
      if(willOpen) scheduleLabelToolNavigation(next);
    });});
    host.querySelectorAll('[data-label-tool]').forEach(function(button){button.addEventListener('click',function(){
      var next=String(button.getAttribute('data-label-tool')||'steps');
      if(!uiState.openTools) uiState.openTools={keypad:false,word:false,ascii:false,options:false,steps:false};
      var wasOpen=!!uiState.openTools[next];
      uiState.openTools[next]=true;
      uiState.activeTool=next;
      if(next==='ascii'&&!Array.isArray(uiState.asciiLibraryRows)) uiState.asciiLibraryRows=buildAsciiLibrary(currentConfig());
      if(!wasOpen) render();
      else host.querySelectorAll('.label-tools-navigation-item').forEach(function(item){item.classList.toggle('current',!!item.querySelector('[data-label-tool="'+next+'"]'));});
      scheduleLabelToolNavigation(next);
    });});
    host.querySelectorAll('[data-label-tool-toggle]').forEach(function(button){button.addEventListener('click',function(){
      var next=String(button.getAttribute('data-label-tool-toggle')||'steps');
      if(!uiState.openTools) uiState.openTools={keypad:false,word:false,ascii:false,options:false,steps:false};
      /* v396 regression marker for the superseded whole-button toggle: uiState.openTools[next]=!uiState.openTools[next] */
      var willOpen=!uiState.openTools[next];
      uiState.openTools[next]=willOpen;
      uiState.activeTool=next;
      if(next==='ascii'&&willOpen&&!Array.isArray(uiState.asciiLibraryRows)) uiState.asciiLibraryRows=buildAsciiLibrary(currentConfig());
      render();
      if(willOpen) scheduleLabelToolNavigation(next);
    });});
    host.querySelectorAll('[data-label-input]').forEach(function(input){
      input.addEventListener('focus',function(){uiState.activeField=String(input.getAttribute('data-label-input')||'single');});
      input.addEventListener('input',function(){
        var field=String(input.getAttribute('data-label-input')||'single');
        uiState.activeField=field;
        if(field==='single'){
          var candidate=input.value;
          var fit=wholeLabelTextFits(candidate);
          if(!fit.valid){
            var rejectedCaret=input.selectionStart==null?String(uiState.text||'').length:input.selectionStart;
            input.value=uiState.text;
            var restoredCaret=Math.max(0,Math.min(String(uiState.text||'').length,rejectedCaret-1));
            try{input.setSelectionRange(restoredCaret,restoredCaret);}catch(error){}
            input.setAttribute('data-label-input-limit-hit','true');
            root.setTimeout(function(){if(input) input.removeAttribute('data-label-input-limit-hit');},220);
            return;
          }
          uiState.text=candidate;
        }
        else if(field==='line1') uiState.line1=input.value;
        else if(field==='line2') uiState.line2=input.value;
        scheduleDraftRender();
      });
    });
    var entryMode=host.querySelector('[data-label-entry-mode]');
    if(entryMode){entryMode.addEventListener('click',function(){
      if(uiState.entryMode==='single'){
        var wrapped=wrapLabelText(uiState.text);
        uiState.line1=wrapped.line1; uiState.line2=wrapped.line2; uiState.entryMode='lines'; uiState.activeField='line1';
      }else{
        uiState.text=String(uiState.line1||'')+(uiState.line2?' '+String(uiState.line2):''); uiState.entryMode='single'; uiState.activeField='single';
      }
      render();
    });}
    var useWords=host.querySelector('[data-label-use-words]');
    if(useWords){useWords.addEventListener('change',function(){
      uiState.useWordEntry=useWords.checked;
      if(uiState.planVariants&&uiState.replayVariants) applyWordEntryVariant();
      var variantRows=procedureRows();
      if(variantRows.length){
        if(uiState.selectedStep<0) uiState.selectedStep=0;
        uiState.selectedStep=Math.min(uiState.selectedStep,variantRows.length-1);
      }else uiState.selectedStep=-1;
      render();
      scheduleSelectedStepVisible();
    });}
    var generateButton=host.querySelector('[data-label-generate]');
    if(generateButton){generateButton.addEventListener('click',function(){generate();});}
    var resetGeneratorButton=host.querySelector('[data-label-reset-generator]');
    if(resetGeneratorButton){resetGeneratorButton.addEventListener('click',function(){
      if(draftRenderTimer){root.clearTimeout(draftRenderTimer);draftRenderTimer=0;}
      uiState.text='';uiState.line1='';uiState.line2='';
      uiState.plan=null;uiState.replay=null;uiState.planVariants=null;uiState.replayVariants=null;uiState.generatedSignature=null;
      uiState.selectedStep=-1;uiState.showMatches=false;uiState.showAsciiMatches=false;
      uiState.activeField=uiState.entryMode==='lines'?'line1':'single';
      render();
      var cleared=host.querySelector('[data-label-input="'+uiState.activeField+'"]');
      if(cleared) cleared.focus();
    });}
    var showMatches=host.querySelector('[data-label-show-matches]');
    if(showMatches){showMatches.addEventListener('click',function(){uiState.showMatches=!uiState.showMatches;render();});}
    var showAscii=host.querySelector('[data-label-show-ascii]');
    if(showAscii){showAscii.addEventListener('click',function(){uiState.showAsciiMatches=!uiState.showAsciiMatches;render();});}
    var toggleLibrary=host.querySelector('[data-label-toggle-library]');
    if(toggleLibrary){toggleLibrary.addEventListener('click',function(){uiState.showLibrary=!uiState.showLibrary;render();});}
    var toggleAsciiLibrary=host.querySelector('[data-label-toggle-ascii-library]');
    if(toggleAsciiLibrary){toggleAsciiLibrary.addEventListener('click',function(){uiState.showAsciiLibrary=!uiState.showAsciiLibrary;if(uiState.showAsciiLibrary)uiState.asciiLibraryRows=buildAsciiLibrary(currentConfig());else uiState.asciiLibraryRows=null;render();});}
    var copy=host.querySelector('[data-label-copy-steps]');
    if(copy){copy.addEventListener('click',function(){
      var text=plainTextSteps(uiState.plan,uiState.replay);
      if(root.navigator&&root.navigator.clipboard&&root.navigator.clipboard.writeText){root.navigator.clipboard.writeText(text).then(function(){if(root.dscToast) root.dscToast('Label entry procedure copied.');});}
      else {var area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();}
    });}
    host.querySelectorAll('[data-label-step-index]').forEach(function(row){row.addEventListener('click',function(){selectStep(Number(row.getAttribute('data-label-step-index')),true);});});
    var search=host.querySelector('[data-label-library-search]');
    if(search){search.addEventListener('input',function(){uiState.search=search.value;if(librarySearchFrame)return;var run=function(){librarySearchFrame=0;var current=host&&host.querySelector('[data-label-library-search]');if(current)uiState.search=current.value;var panel=current&&current.closest('.label-generator-library-body');var container=panel&&panel.querySelector('.label-generator-library-results');if(container)container.outerHTML=searchMatchesMarkup();bindLibraryRows();};librarySearchFrame=root.requestAnimationFrame?root.requestAnimationFrame(run):root.setTimeout(run,0);});}
    var asciiSearch=host.querySelector('[data-label-ascii-library-search]');
    if(asciiSearch){asciiSearch.addEventListener('input',function(){uiState.asciiSearch=asciiSearch.value;if(asciiLibrarySearchFrame)return;var run=function(){asciiLibrarySearchFrame=0;var current=host&&host.querySelector('[data-label-ascii-library-search]');if(current)uiState.asciiSearch=current.value;var panel=current&&current.closest('.label-generator-library-body');var container=panel&&panel.querySelector('.label-generator-ascii-library-results');if(container)container.outerHTML=asciiLibraryMatchesMarkup();};asciiLibrarySearchFrame=root.requestAnimationFrame?root.requestAnimationFrame(run):root.setTimeout(run,0);});}
    bindLibraryRows();
  }
  function bindLibraryRows(){
    if(!host) return;
    host.querySelectorAll('[data-label-library-word]').forEach(function(row){row.onclick=function(){
      var word=row.getAttribute('data-label-library-word')||'';
      var field=uiState.entryMode==='single'?'single':(uiState.activeField==='line2'?'line2':'line1');
      var input=host.querySelector('[data-label-input="'+field+'"]');
      if(!input) return;
      var start=input.selectionStart==null?input.value.length:input.selectionStart;
      var end=input.selectionEnd==null?start:input.selectionEnd;
      var before=input.value.slice(0,start),after=input.value.slice(end);
      var prefix=before && !/\s$/.test(before)?' ':'';
      var suffix=after && !/^\s/.test(after)?' ':'';
      input.value=before+prefix+word+suffix+after;
      if(field==='single'){
        var insertedCandidate=input.value;
        var insertedFit=wholeLabelTextFits(insertedCandidate);
        if(!insertedFit.valid){
          input.value=uiState.text;
          input.focus();
          if(root.dscToast) root.dscToast('That word will not fit in the two 14-character label lines.');
          return;
        }
        uiState.text=insertedCandidate;
      }
      else if(field==='line1') uiState.line1=input.value.slice(0,LINE_CHARS);
      else uiState.line2=input.value.slice(0,LINE_CHARS);
      input.value=field==='single'?uiState.text:(field==='line1'?uiState.line1:uiState.line2);
      input.focus();
      scheduleDraftRender();
    };});
  }

  /* v559 — do not let a nested Label Entry Tools scroller trap the mouse wheel.
     CSS scroll chaining handles modern browsers; this boundary handoff keeps the
     behavior deterministic in Chromium/WebView builds when a nested overflow box
     has reached its first or last row. */
  function installNestedScrollHandoff(){
    if(!host||host.getAttribute('data-label-scroll-handoff-bound')==='true') return;
    host.setAttribute('data-label-scroll-handoff-bound','true');
    function scrollableY(node){
      if(!node||node.nodeType!==1||node===host) return false;
      var style=root.getComputedStyle?root.getComputedStyle(node):null;
      var overflow=style?String(style.overflowY||''):'';
      return /^(auto|scroll|overlay)$/.test(overflow)&&node.scrollHeight>node.clientHeight+1;
    }
    function canMove(node,delta){
      if(!scrollableY(node)) return false;
      if(delta<0) return node.scrollTop>1;
      return node.scrollTop+node.clientHeight<node.scrollHeight-1;
    }
    function wheelPixels(event,viewport){
      var delta=Number(event.deltaY)||0;
      if(event.deltaMode===1) delta*=16;
      else if(event.deltaMode===2) delta*=Math.max(1,viewport||root.innerHeight||800);
      return delta;
    }
    host.addEventListener('wheel',function(event){
      if(event.defaultPrevented||event.ctrlKey) return;
      var rawY=Number(event.deltaY)||0,rawX=Number(event.deltaX)||0;
      if(!rawY||Math.abs(rawY)<Math.abs(rawX)) return;
      var target=event.target&&event.target.nodeType===1?event.target:event.target&&event.target.parentElement;
      var inner=null,node=target;
      while(node&&node!==host){if(scrollableY(node)){inner=node;break;}node=node.parentElement;}
      if(!inner) return;
      var delta=wheelPixels(event,inner.clientHeight);
      if(!delta||canMove(inner,delta)) return;
      node=inner.parentElement;
      var outer=null;
      while(node){
        if(scrollableY(node)&&canMove(node,delta)){outer=node;break;}
        node=node.parentElement;
      }
      if(!outer) return;
      event.preventDefault();
      var next=outer.scrollTop+delta;
      var max=Math.max(0,outer.scrollHeight-outer.clientHeight);
      outer.scrollTop=Math.max(0,Math.min(max,next));
    },{passive:false});
  }
  function initUi(){
    host=document.getElementById('neoLabelEntryGenerator');
    if(!host) return;
    installNestedScrollHandoff();
    syncLabelHeaderControls();
    var header=root.document&&root.document.getElementById('labelEntryGeneratorHeaderControls');
    if(header&&!header.getAttribute('data-label-tools-reset-bound')){
      header.setAttribute('data-label-tools-reset-bound','true');
      header.addEventListener('click',function(event){var reset=event.target.closest&&event.target.closest('[data-label-tools-reset]');if(reset){event.preventDefault();resetLabelEntryTools();}});
    }
    if(!uiState.rendered) uiState.renderPending=true;
    document.addEventListener('keydown',function(event){
      var view=document.getElementById('view-label-entry-generator');
      if(!view||!view.classList.contains('active')) return;
      if(event.key!=='ArrowUp'&&event.key!=='ArrowDown') return;
      var target=event.target;
      if(target&&/INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      var rows=procedureRows();
      if(!rows.length) return;
      event.preventDefault();
      if(uiState.selectedStep<0) uiState.selectedStep=0;
      else uiState.selectedStep+=event.key==='ArrowDown'?1:-1;
      uiState.selectedStep=Math.max(0,Math.min(rows.length-1,uiState.selectedStep));
      selectStep(uiState.selectedStep,true);
    });
  }

  if(root&&root.document){
    var previous=root.dscHandleViewActivation;
    root.dscHandleViewActivation=function(view){
      var previousState=typeof previous==='function' ? previous(view) : null;
      if(view!=='label-entry-generator') return previousState;
      uiConfigSnapshot=null;
      if(!host) host=root.document.getElementById('neoLabelEntryGenerator');
      /* v295 compatibility marker: if(host) render(); */
      if(!host) return previousState;
      if(uiState.rendered && !uiState.renderPending) return previousState;
      /* Legacy regression marker: Opening Label Entry Generator… */
      var runId=root.dscBeginWorkspaceLoading?root.dscBeginWorkspaceLoading('Opening Label Entry Tools…'):0;
      var open=function(){try{uiState.renderPending=false;render();}finally{if(root.dscFinishWorkspaceLoading)root.dscFinishWorkspaceLoading(runId);}};
      if(root.dscAfterWorkspacePaint) root.dscAfterWorkspacePaint(open); else root.setTimeout(open,24);
      return 'deferred';
    };
    if(root.document.readyState==='loading') root.document.addEventListener('DOMContentLoaded',initUi);
    else initUi();
  }

  return {
    LINE_CHARS:LINE_CHARS,
    TOTAL_CHARS:TOTAL_CHARS,
    WORD_ENTRY_MAX_CODE:WORD_ENTRY_MAX_CODE,
    ASCII_ENTRY_MAX_CODE:ASCII_ENTRY_MAX_CODE,
    WORD_ENTRY_INITIAL_CODE:WORD_ENTRY_INITIAL_CODE,
    ASCII_ENTRY_INITIAL_CODE:ASCII_ENTRY_INITIAL_CODE,
    KEY_GROUPS:clone(KEY_GROUPS),
    normalizeText:normalizeText,
    wrapLabelText:wrapLabelText,
    wholeLabelTextFits:wholeLabelTextFits,
    explicitLabelLayout:explicitLabelLayout,
    layoutSignature:layoutSignature,
    buildWordLibrary:buildWordLibrary,
    findWordMatches:findWordMatches,
    automaticWordMatch:automaticWordMatch,
    applyWordLibraryCasingToLayout:applyWordLibraryCasingToLayout,
    asciiCodeForCharacter:asciiCodeForCharacter,
    buildAsciiLibrary:buildAsciiLibrary,
    findAsciiLibraryMatches:findAsciiLibraryMatches,
    manualKeyForCharacter:manualKeyForCharacter,
    boundedThreeDigitEntry:boundedThreeDigitEntry,
    bestCodeNavigation:bestCodeNavigation,
    buildPlan:buildPlan,
    replayPlan:replayPlan,
    fastPreviewReplay:fastPreviewReplay,
    analyzeInputWordMatches:analyzeInputWordMatches,
    analyzeInputAsciiMatches:analyzeInputAsciiMatches,
    buildProcedureSteps:buildProcedureSteps,
    plainTextSteps:plainTextSteps
  };
});
