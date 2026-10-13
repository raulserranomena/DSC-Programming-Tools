/* PC5108 Zone Expanders Tools v827.
   Confirmed reference: DSC PC5108 instructions / Power 832 installation manual:
     J1 J2 J3 -> expander zone terminals Z1-Z4 (Group A, v1)
     J4 J5 J6 -> expander zone terminals Z5-Z8 (Group B, v1)
     v1 UI: fixed alternating reference rows: A is rows 1,3,5,7 and B is rows 2,4,6,8.
     This is a user-requested reference layout, not a hardware constraint.
     v2 on panel firmware 3.x+ -> J1 J2 J3 set all Z1-Z8; J4-J6 unused.
   Informational lookup only; no change is sent to physical equipment. */
(function(root){
 'use strict';
 var STORAGE='dsc-powerseries-zone-expanders-v827';
 var ROWS=[
  {bits:'111',v1:null,v2:null},
  {bits:'011',v1:null,v2:[9,16]},
  {bits:'101',v1:[9,12],v2:[17,24]},
  {bits:'001',v1:[13,16],v2:[25,32]},
  {bits:'110',v1:[17,20],v2:[33,40]},
  {bits:'010',v1:[21,24],v2:[41,48]},
  {bits:'100',v1:[25,28],v2:[49,56]},
  {bits:'000',v1:[29,32],v2:[57,64]}
 ];
 var MAP=Object.create(null);
 ROWS.forEach(function(row){MAP[row.bits]=row;});
 var state,host,header;
 var A_ROWS=new Set(['111','101','110','100']);
 var B_ROWS=new Set(['011','001','010','000']);
 function fixedGroup(bits){return A_ROWS.has(bits)?'a':B_ROWS.has(bits)?'b':null;}
 function fresh(){return {version:'v2',a:'111',b:'011',v2:'111'};}
 function normalizeState(candidate){
   var s=fresh();
   if(!candidate||typeof candidate!=='object')return s;
   s.version=candidate.version==='v1'?'v1':'v2';
   ['a','b'].forEach(function(group){
     if(typeof candidate[group]==='string'&&Object.prototype.hasOwnProperty.call(MAP,candidate[group]))s[group]=candidate[group];
   });
   if(typeof candidate.v2==='string'&&Object.prototype.hasOwnProperty.call(MAP,candidate.v2))s.v2=candidate.v2;
   // Each physical jumper bank has its own fixed rows in the v1 lookup view.
   if(!A_ROWS.has(s.a))s.a='111';
   if(!B_ROWS.has(s.b))s.b='011';
   return s;
 }
 function load(){
   try{
     var stored=root.localStorage.getItem(STORAGE);
     return normalizeState(stored?JSON.parse(stored):null);
   }catch(_){return fresh();}
 }
 function save(){try{root.localStorage.setItem(STORAGE,JSON.stringify(state));}catch(_){}}
 function rangeFor(bits,version){
   var entry=MAP[bits];
   return entry ? entry[version==='v2'?'v2':'v1'] : null;
 }
 function zoneText(bits,version){
   if(bits===null)return 'No configuration selected';
   var r=rangeFor(bits,version);return r?'Zones '+r[0]+'–'+r[1]:'Zones disabled';
 }
 function pinName(bit){return bit==='1'?'ON':'OFF';}
 function bank(group){return group==='b'?['J4','J5','J6']:['J1','J2','J3'];}
 function refTableV1(){
   // The eight rows alternate between fixed jumper banks; no A/B chooser.
   // First, third, fifth and seventh rows: J1/J2/J3 (A).
   // Second, fourth, sixth and eighth rows: J4/J5/J6 (B).
   return '<section class="ze-table-card ze-table-v1" aria-label="PC5108 v1.0 jumper reference">'
     +'<div class="ze-table-card-title"><h3>PC5108 v1.0 — Jumper configurations</h3>'
     +'<p>One table · alternating fixed rows for Group A and Group B</p></div>'
     +'<div class="ze-direct-note">A rows use J1–J3 (expander Z1–Z4). B rows use J4–J6 (expander Z5–Z8). Select one row for each group.</div>'
     +'<div class="ze-table-scroll"><table class="ze-mapping-table ze-v1-mapping"><thead><tr>'
     +'<th scope="col" class="ze-v1-jumper"><span>J1</span><span>J4</span></th>'
     +'<th scope="col" class="ze-v1-jumper"><span>J2</span><span>J5</span></th>'
     +'<th scope="col" class="ze-v1-jumper"><span>J3</span><span>J6</span></th>'
     +'<th scope="col">Zones assigned</th>'
     +'</tr></thead><tbody>'
     +ROWS.map(function(r,index){
       var group=index%2===0?'a':'b';
       var active=state[group]===r.bits;
       var names=bank(group);
       var cells=r.bits.split('').map(function(bit,i){
         return '<td class="ze-cell-state '+(bit==='1'?'ze-state-on':'ze-state-off')+'">'
           +'<span class="ze-named-setting"><small>'+names[i]+'</small><strong>'+pinName(bit)+'</strong></span></td>';
       }).join('');
       return '<tr data-ze-bits="'+r.bits+'" data-ze-bank="'+group+'" tabindex="0" role="button"'
         +' aria-label="Select Group '+group.toUpperCase()+' '+zoneText(r.bits,'v1')+', '
         +names.map(function(name,i){return name+' '+pinName(r.bits[i]);}).join(', ')+'"'
         +' aria-pressed="'+active+'" class="'+(active?(group==='a'?'ze-row-active':'ze-row-active ze-row-active-b'):'')+'">'
         +cells+'<td class="ze-cell-range">'+zoneText(r.bits,'v1')
         +(active?'<span class="ze-selected-pill ze-pill-'+group+'">'+group.toUpperCase()+'</span>':'')
         +'</td></tr>';
     }).join('')+'</tbody></table></div>'
     +'<div class="ze-table-hint"><strong>Odd rows = A (J1–J3)</strong> · <strong>Even rows = B (J4–J6)</strong>. '
     +'Select a row to change its group. Group A and Group B always remain selected.</div>'
     +'</section>';
 }
 function refTableV2(){
   var title='PC5108 v2.0 — all 8 expander zones',head=['J1','J2','J3'],selected=state.v2;
   return '<section class="ze-table-card ze-table-v2" aria-label="'+title+'">'
     +'<div class="ze-table-card-title"><h3>'+title+'</h3><p>J1–J3 configure all expander terminals Z1–Z8; J4–J6 do not affect assignment.</p></div>'
     +'<div class="ze-table-scroll"><table class="ze-mapping-table"><thead><tr>'
     +'<th scope="col">J1</th><th scope="col">J2</th><th scope="col">J3</th><th scope="col">Zones assigned</th>'
     +'</tr></thead><tbody>'
     +ROWS.map(function(r){
       var active=selected===r.bits;
       var cells=r.bits.split('').map(function(bit,i){return '<td class="ze-cell-state '+(bit==='1'?'ze-state-on':'ze-state-off')+'">'
         +'<span class="ze-named-setting"><small>'+head[i]+'</small><strong>'+pinName(bit)+'</strong></span></td>';}).join('');
       return '<tr data-ze-choose="v2" data-ze-bits="'+r.bits+'" tabindex="0" role="button" aria-label="Set '+title+' to '+zoneText(r.bits,'v2')+'; '+head.map(function(n,i){return n+' '+pinName(r.bits[i]);}).join(', ')+'" aria-pressed="'+active+'" class="'+(active?'ze-row-active':'')+'">'
         +cells+'<td class="ze-cell-range">'+zoneText(r.bits,'v2')+(active?'<span class="ze-selected-pill ze-pill-a">Selected</span>':'')+'</td></tr>';
     }).join('')+'</tbody></table></div></section>';
 }
 function settingGroup(group){
   var names=bank(group),bits=state[group],isA=group==='a',isV2=group==='v2';
   var title=isV2?'Expander Z1–Z8':isA?'Group A · expander Z1–Z4':'Group B · expander Z5–Z8';
   return '<div class="ze-live-group '+(isA||isV2?'ze-live-a':'ze-live-b')+'">'
      +'<div class="ze-live-top"><strong>'+title+'</strong><span>'+zoneText(bits,isV2?'v2':'v1')+'</span></div>'
      +'<div class="ze-live-pins">'+(bits===null?'<span class="ze-no-pins">Select a row to assign this group.</span>':names.map(function(n,i){
        var on=bits[i]==='1';
        return '<div class="ze-live-pin '+(on?'on':'off')+'"><span>'+n+'</span><strong>'+pinName(bits[i])+'</strong></div>';
      }).join(''))+'</div></div>';
 }
 function pinsOnBoard(){
   var isV1=state.version==='v1';
   return [1,2,3,4,5,6].map(function(j){
     if(j>=4&&!isV1)return '';
     var g=j<=3?'a':'b';
     var bits=state[isV1?g:'v2'];
     if(bits===null)return '';
     var on=bits[(j-1)%3]==='1';
     return '<span class="ze-pin-outline ze-board-'+(isV1?'v1':'v2')+'-j'+j+' ze-outline-'+g+' '+(on?'ze-pin-on':'ze-pin-off')+'" title="J'+j+' '+pinName(bits[(j-1)%3])+'" aria-hidden="true"></span>';
   }).join('');
 }
 function board(){
   var isV1=state.version==='v1';
   return '<div class="ze-board-area"><div class="ze-board-title"><strong>Jumper locations</strong><span>PC5108 '+(isV1?'v1.0':'v2.0')+'</span></div>'
     +'<div class="ze-board-image"><img src="./assets/powerseries/'+(isV1?'pc5108-v1-jumper-locations.png':'pc5108-v2-jumper-locations.png')+'" alt="PC5108 board showing the numbered jumper positions" draggable="false">'
     +pinsOnBoard()+'</div>'
     +'<p class="ze-board-instruction">Outlines mark each jumper location. Read its actual ON/OFF setting directly above.</p>'
     +'</div>';
 }
 function overlap(){
   var a=rangeFor(state.a,'v1'),b=rangeFor(state.b,'v1');
   if(!a||!b||a[1]<b[0]||b[1]<a[0])return '';
   return '<div class="ze-overlap" role="status"><strong>Duplicate assignment:</strong> Both expander groups are assigned to the same panel zone range. Choose different panel zones for A and B.</div>';
 }
 function side(){
   var v1=state.version==='v1';
   return '<aside class="ze-live-panel"><div class="ze-live-header"><h3>Current jumper configuration</h3><p>'+(v1?'Two separate four-zone assignments':'One combined eight-zone assignment')+'</p></div>'
     +'<div class="ze-live-list">'+(v1?settingGroup('a')+settingGroup('b')+overlap():settingGroup('v2')+'<p class="ze-unused"><strong>J4–J6:</strong> no effect on zone assignment for this v2.0 eight-zone configuration.</p>')+'</div>'
     +board()+'</aside>';
 }
 function render(){
   if(!host)return;
   var v1=state.version==='v1';
   if(header&&!header.querySelector('[data-ze-reset]'))header.insertAdjacentHTML('beforeend','<button type="button" class="secondary compact-action-button" data-ze-reset>Reset</button>');
   host.innerHTML='<div class="ze-top">'
     +'<div class="ze-version-switch" role="group" aria-label="PC5108 version">'
     +'<button type="button" data-ze-version="v1" aria-pressed="'+v1+'" class="'+(v1?'active':'')+'">PC5108 v1.0</button>'
     +'<button type="button" data-ze-version="v2" aria-pressed="'+!v1+'" class="'+(!v1?'active':'')+'">PC5108 v2.0</button></div></div>'
     +'<div class="ze-simple-layout"><div class="ze-main-list">'
     +(v1?refTableV1():refTableV2())
     +'<div class="ze-bottom-note">'+(v1?'V1.0 uses two separate four-zone jumper banks.':'V2.0 eight-zone mapping applies with compatible control panel software v3.x or newer.')
     +' Do not mix PC5108 v1.0 and v2.0 on the same panel.</div>'
     +'</div>'+side()+'</div>';
 }
 function copyText(){
   var lines=['New PowerSeries — PC5108 zone expanders'];
   lines.push('Selected version: PC5108 '+(state.version==='v1'?'v1.0':'v2.0'));
   var groups=state.version==='v1'?['a','b']:['v2'];
   groups.forEach(function(group){
     var bits=state[group];
     lines.push((group==='v2'?'Expander Z1–Z8':group==='a'?'Group A (Z1–Z4)':'Group B (Z5–Z8)')+' → '+zoneText(bits,group==='v2'?'v2':'v1'));
     lines.push(bits===null?'No jumper selection in tool':bank(group).map(function(pin,i){return pin+': '+pinName(bits[i]);}).join(' | '));
   });
   lines.push('');lines.push('Jumper reference:');
   ROWS.forEach(function(r){lines.push(r.bits.split('').map(pinName).join(' / ')+' → '+zoneText(r.bits,state.version));});
   return lines.join('\n');
 }
 function chooseRow(bits){
   if(!Object.prototype.hasOwnProperty.call(MAP,bits))return;
   var group=fixedGroup(bits);
   if(!group)return;
   // A row can ONLY change the matching jumper bank, never the opposite bank.
   // Clicking an already-selected row does nothing: each group must retain one assignment.
   if(state[group]===bits)return;
   state[group]=bits;
   save();render();
 }
 function chooseV2(bits){
   if(!Object.prototype.hasOwnProperty.call(MAP,bits))return;
   state.v2=bits;save();render();
 }
 function click(e){
   var row=e.target.closest('[data-ze-bits]');
   if(row&&host.contains(row)){if(state.version==='v1')chooseRow(row.getAttribute('data-ze-bits'));else chooseV2(row.getAttribute('data-ze-bits'));return;}
   var button=e.target.closest('button');if(!button)return;
   if(button.hasAttribute('data-ze-version')){
     state.version=button.getAttribute('data-ze-version')==='v2'?'v2':'v1';save();render();return;
   }
   if(button.hasAttribute('data-ze-reset')){state=fresh();save();render();return;}
 }
 function keydown(e){
   var row=e.target.closest('[data-ze-bits]');
   if(row&&(e.key==='Enter'||e.key===' ')){
     e.preventDefault();
     var bits=row.getAttribute('data-ze-bits');
     if(state.version==='v1')chooseRow(bits);else chooseV2(bits);
     var next=host.querySelector('[data-ze-bits="'+bits+'"]');
     if(next)next.focus({preventScroll:true});
   }
 }
 function init(){
   host=root.document.getElementById('newPowerSeriesZoneExpandersTools');
   header=root.document.getElementById('newPowerSeriesZoneExpandersHeaderControls');
   if(!host)return;
   state=load();render();host.addEventListener('click',click);host.addEventListener('keydown',keydown);if(header)header.addEventListener('click',click);
 }
 root.DSC_ZONE_EXPANDER_ENGINE={
   reference:ROWS.map(function(r){return {bits:r.bits,v1:r.v1&&r.v1.slice(),v2:r.v2&&r.v2.slice()};}),
   rangeFor:rangeFor,normalizeState:normalizeState,
   copyText:function(input){var before=state;state=normalizeState(input);var result=copyText();state=before;return result;}
 };
 if(root&&root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);else init();}
})(typeof window!=='undefined'?window:this);
