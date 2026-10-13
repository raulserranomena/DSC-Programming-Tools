(function(){
'use strict';

var STORE_KEY='dsc-panel-current-calculator-v3';
var DEVICE_LIBRARY_KEY='dsc-panel-current-device-library-v1';
var DEVICE_LIBRARY_SCHEMA_VERSION=1;
var SCHEMA_VERSION='3.0.0';
var PANEL_LIMIT_MA=700;
var PANEL_TRANSMIT_LIMIT_MA=1000;
var PANEL_BOARD_MA=85;
var LOCAL_SUPPLY_LIMIT_MA=1000;
var host=null;
var importInput=null;
var state=null;
var picker=null;
var pickerPortal=null;
var lastAddedDeviceId='';
var lastAddedUntil=0;
var lastAddedTimer=null;
var navSettingsOpen=false;
var pickerSearchQuery='';
var deviceLibrary=null;
var libraryImportInput=null;
var fastSearchFrame=0;
var fastSearchRequest=null;

var PANEL_MODELS=['HS2016','HS2016-4','HS2032','HS2064','HS2064 E','HS2128','HS2128 E'];
var PANEL_PGMS={
  'HS2016':['PGM1','PGM2'],
  'HS2016-4':['PGM1','PGM2','PGM3','PGM4'],
  'HS2032':['PGM1','PGM2'],
  'HS2064':['PGM1','PGM2','PGM3','PGM4'],
  'HS2064 E':['PGM1','PGM2','PGM3','PGM4'],
  'HS2128':['PGM1','PGM2','PGM3','PGM4'],
  'HS2128 E':['PGM1','PGM2','PGM3','PGM4']
};
var PGM_LIMITS={PGM1:50,PGM2:300,PGM3:50,PGM4:50};
var TWO_WIRE_STANDBY_PER_DETECTOR_MA=0.020;
var TWO_WIRE_STANDBY_LIMIT_MA=2;
var TWO_WIRE_HARDWARE_LIMIT_MA=90;
var MODULE_LIMITS={
  hsm2108:{'HS2016':1,'HS2016-4':1,'HS2032':3,'HS2064':7,'HS2064 E':7,'HS2128':15,'HS2128 E':15},
  hsm2208:{'HS2016':2,'HS2016-4':2,'HS2032':4,'HS2064':8,'HS2064 E':8,'HS2128':16,'HS2128 E':16},
  hsm2300:{'HS2016':3,'HS2016-4':3,'HS2032':3,'HS2064':3,'HS2064 E':3,'HS2128':4,'HS2128 E':4},
  hsm2204:{'HS2016':1,'HS2016-4':1,'HS2032':1,'HS2064':3,'HS2064 E':3,'HS2128':4,'HS2128 E':4},
  hsm2955:{'HS2016':1,'HS2016-4':1,'HS2032':1,'HS2064':1,'HS2064 E':1,'HS2128':1,'HS2128 E':1}
};

var CORBUS_MODEL_ORDER=[
  'hs2lcd','hs2icn','hs2led','hs2lcdp','hs2icnp',
  'hs2lcdrf9','hs2lcdrfp9','hs2icnrf9','hs2icnrfp9','hs2tchp',
  'hsm2108','hsm2208','hsm2300','hsm2204','hsm2host','pgphost','hsm2955','custom-corbus'
];
var CORBUS_ORDER_INDEX={};
CORBUS_MODEL_ORDER.forEach(function(modelId,index){CORBUS_ORDER_INDEX[modelId]=index;});

var CORBUS_CATALOG=[
  {id:'hs2led',category:'Keypads · LED',model:'HS2LED',description:'LED hardwired keypad.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true},
  {id:'hs2icn',category:'Keypads · ICON',model:'HS2ICN',description:'ICON hardwired keypad.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true},
  {id:'hs2icnp',category:'Keypads · ICON',model:'HS2ICNP',description:'ICON hardwired keypad with prox support.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true},
  {id:'hs2icnrf9',category:'Keypads · ICON / RF',model:'HS2ICNRF9',description:'ICON keypad with built-in PowerG transceiver.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true,powergHost:true},
  {id:'hs2icnrfp9',category:'Keypads · ICON / RF',model:'HS2ICNRFP9',description:'ICON keypad with built-in PowerG transceiver and prox.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true,powergHost:true},
  {id:'hs2lcd',category:'Keypads · LCD',model:'HS2LCD',description:'Full-message LCD hardwired keypad.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true},
  {id:'hs2lcdp',category:'Keypads · LCD',model:'HS2LCDP',description:'Full-message LCD keypad with prox support.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true},
  {id:'hs2lcdrf9',category:'Keypads · LCD / RF',model:'HS2LCDRF9',description:'LCD keypad with built-in PowerG transceiver.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true,powergHost:true},
  {id:'hs2lcdrfp9',category:'Keypads · LCD / RF',model:'HS2LCDRFP9',description:'LCD keypad with built-in PowerG transceiver and prox.',standbyMa:55,alarmMa:105,family:'keypad',hasKeypadPgm:true,powergHost:true},
  {id:'hs2tchp',category:'Keypads · Touchscreen',model:'HS2TCHP',description:'7-inch hardwired touchscreen keypad.',standbyMa:100,alarmMa:160,extraPowerAlarmMa:230,family:'keypad',hasKeypadPgm:true,extraPower:true},
  {id:'hsm2108',category:'Zone Expander Modules',model:'HSM2108',description:'8-zone expander with AUX output.',standbyMa:30,alarmMa:30,hasAux:true,auxLimitMa:100},
  {id:'hsm2208',category:'Output Expander Modules',model:'HSM2208',description:'8-output expander with AUX output.',standbyMa:60,alarmMa:60,hasAux:true,auxLimitMa:250,hasOutputs:true,outputCount:8,outputLimitMa:50,inputLimitMa:700},
  {id:'hsm2300',category:'Power and Output Modules',model:'HSM2300',description:'Auxiliary power-supply module.',standbyMa:40,alarmMa:40,powerModule:true},
  {id:'hsm2204',category:'Power and Output Modules',model:'HSM2204',description:'Power supply with four local outputs.',standbyMa:40,alarmMa:40,powerModule:true,localOutputs:true,localPgmSupportsTwoWireSmoke:false},
  {id:'hsm2host',category:'PowerG Host Transceiver Modules',model:'HSM2HOST',description:'PowerG host transceiver.',standbyMa:60,alarmMa:60,powergHost:true},
  {id:'pgphost',category:'PowerG+ Host Transceiver Modules',model:'PGPHOST',description:'PowerG+ host transceiver.',standbyMa:30,alarmMa:60,powergHost:true},
  {id:'hsm2955',category:'Two-Way Audio Modules',model:'HSM2955',description:'Two-way audio module.',standbyMa:100,alarmMa:100,hasAudioStations:true},
  {id:'custom-corbus',category:'Custom CORBUS Device',model:'Custom CORBUS device',description:'User-defined device or module.',standbyMa:0,alarmMa:0,custom:true}
];

var AUX_CATALOG=[
  {id:'ac-100',category:'Glass Break Detectors',model:'AC-100',description:'Acuity Glass Break',standbyMa:35,alarmMa:35},
  {id:'ac-500',category:'Glass Break Detectors',model:'AC-500',description:'Acuity Glass Break',standbyMa:32,alarmMa:32},
  {id:'bv-300dp',category:'PIR Motion Detectors',model:'BV-300DP',description:'Bravo 300 Passive Infrared Detector',standbyMa:18,alarmMa:18},
  {id:'bv-500',category:'PIR Motion Detectors',model:'BV-500',description:'Bravo 500 Passive Infrared Detector',standbyMa:18,alarmMa:18},
  {id:'bv-500gb',category:'Combination Motion / Glass Break',model:'BV-500GB',description:'Bravo 500 Passive Infrared Detector with Glass Break Detector',standbyMa:38,alarmMa:38},
  {id:'bv-600',category:'PIR Motion Detectors',model:'BV-600',description:'Bravo 600 Passive Infrared Detector',standbyMa:17.5,alarmMa:17.5},
  {id:'ec-300dp',category:'PIR Motion Detectors',model:'EC-300DP',description:'Encore Passive Infrared Detector',standbyMa:18,alarmMa:18},
  {id:'st-300d',category:'PIR Motion Detectors',model:'ST-300D',description:'Strata Passive Infrared Detector',standbyMa:18,alarmMa:18},
  {id:'f2-200',category:'Dual-Technology Motion Detectors',model:'F2-200',description:'Force 2 Dual Tech Infrared Detector',standbyMa:30,alarmMa:30},
  {id:'lc-100-pi',category:'PIR Motion Detectors',model:'LC-100-PI',description:'PIR Motion Detector with Pet Immunity',standbyMa:10,alarmMa:10},
  {id:'lc-103-pimsk',category:'Dual-Technology Motion Detectors',model:'LC-103-PIMSK',description:'Dual Technology Motion Detector with Pet Immunity',standbyMa:25,alarmMa:25},
  {id:'lc-104-pimw',category:'Dual-Technology Motion Detectors',model:'LC-104-PIMW',description:'Dual Technology Motion Detector with Pet Immunity',standbyMa:25,alarmMa:25},
  {id:'lc-120-pi',category:'PIR Motion Detectors',model:'LC-120-PI',description:'PIR Detector with Pet Immunity',standbyMa:10,alarmMa:10},
  {id:'lc-124-pimw',category:'Dual-Technology Motion Detectors',model:'LC-124-PIMW',description:'Dual Technology Motion Detector with Pet Immunity',standbyMa:25,alarmMa:25},
  {id:'lc-151',category:'Dual-Technology Motion Detectors',model:'LC-151',description:'Dual-Technology Motion Sensor (Single PIR & Microwave)',standbyMa:24,alarmMa:24},
  {id:'lc-171',category:'Outdoor Motion Detectors',model:'LC-171',description:'Outdoor Motion Sensor (Double PIR & Microwave)',standbyMa:24,alarmMa:24},
  {id:'4wtr-b',category:'4-Wire Smoke Detectors',model:'System Sensor 4WTR-B',description:'4-wire photoelectric smoke detector with Form C relay.',standbyMa:0.05,alarmMa:35},
  {id:'4wta-b',category:'4-Wire Smoke Detectors',model:'System Sensor 4WTA-B',description:'4-wire photoelectric smoke detector with sounder.',standbyMa:0.05,alarmMa:50},
  {id:'fsa-410-series',category:'4-Wire Smoke Detectors',model:'FSA-410B series',description:'Compatible DSC 4-wire smoke series. Conservative 90 mA series maximum; verify the exact model installation sheet.',standbyMa:90,alarmMa:90,verificationRequired:true},
  {id:'audio-small',category:'Audio Stations',model:'PC5961E',description:'Small audio station',standbyMa:30,alarmMa:100,hidden:true},
  {id:'audio-large',category:'Audio Stations',model:'PC5964E',description:'Large audio station',standbyMa:30,alarmMa:190,hidden:true},
  {id:'custom-load',category:'Custom Device',model:'Custom device',description:'User-defined powered device.',standbyMa:0,alarmMa:0,custom:true}
];

var COMMUNICATORS=[
  {id:'',model:'Not installed',description:'No PC-LINK 2 communicator selected.',standbyMa:0,alarmMa:0},
  {id:'3g2080re',model:'3G2080(R)E',description:'HSPA cellular alarm communicator.',standbyMa:90,alarmMa:400},
  {id:'tl2803gre',model:'TL2803G(R)E',description:'Ethernet and HSPA dual-path alarm communicator.',standbyMa:120,alarmMa:400},
  {id:'tl280re',model:'TL280(R)E',description:'Ethernet / Internet alarm communicator.',standbyMa:100,alarmMa:400},
  {id:'le2080-family',model:'LE2080 Family',description:'LTE / HSPA cellular alarm communicator family.',standbyMa:90,alarmMa:400},
  {id:'tl280le-family',model:'TL280LE Family',description:'Ethernet and LTE / HSPA dual-path communicator family.',standbyMa:120,alarmMa:400},
  {id:'custom-communicator',model:'Custom communicator',description:'User-defined PC-LINK 2 communicator.',standbyMa:0,alarmMa:0,custom:true}
];

function legacySmokeAlarmMa(model){
  model=String(model||'').toUpperCase();
  if(/(?:LRST|RST|RS)$/.test(model)) return 75;
  if(/(?:LST|ST|S)$/.test(model)) return 60;
  if(/(?:RT|R)$/.test(model)) return 50;
  return 35;
}

var BUILTIN_CORBUS_CATALOG=JSON.parse(JSON.stringify(CORBUS_CATALOG));
var BUILTIN_AUX_CATALOG=JSON.parse(JSON.stringify(AUX_CATALOG));
var corbusIndex={};
var auxIndex={};
var commIndex=indexById(COMMUNICATORS);

function libraryId(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);}
function defaultDeviceLibrary(){return {schemaVersion:DEVICE_LIBRARY_SCHEMA_VERSION,overrides:{corbus:{},powered:{}},customCorbus:[],customPowered:[]};}
function copyEditableCatalogFields(item){return {model:String(item.model||''),category:String(item.category||''),description:String(item.description||''),standbyMa:clamp(item.standbyMa,0,10000,0),alarmMa:clamp(item.alarmMa,0,10000,0)};}
function normalizeLibraryEntry(raw,kind){
  raw=raw&&typeof raw==='object'?raw:{};
  var prefix=kind==='corbus'?'user-corbus':'user-load';
  var fallbackModel=kind==='corbus'?'Custom CORBUS device':'Custom powered device';
  var fallbackCategory=kind==='corbus'?'Custom CORBUS Devices':'Custom Devices';
  return {id:String(raw.id||libraryId(prefix)),model:String(raw.model||fallbackModel),category:String(raw.category||fallbackCategory),description:String(raw.description||'User-defined device.'),standbyMa:clamp(raw.standbyMa,0,10000,0),alarmMa:clamp(raw.alarmMa,0,10000,0),custom:true,userLibrary:true};
}
function normalizeDeviceLibrary(raw){
  var out=defaultDeviceLibrary();raw=raw&&typeof raw==='object'?raw:{};
  ['corbus','powered'].forEach(function(kind){
    var source=raw.overrides&&raw.overrides[kind];if(!source||typeof source!=='object'||Array.isArray(source)) return;
    Object.keys(source).forEach(function(idValue){var item=source[idValue];if(!item||typeof item!=='object') return;out.overrides[kind][String(idValue)]=copyEditableCatalogFields(item);});
  });
  var corbusRaw=Array.isArray(raw.customCorbus)?raw.customCorbus:[];
  var poweredRaw=Array.isArray(raw.customPowered)?raw.customPowered:[];
  var used={};BUILTIN_CORBUS_CATALOG.concat(BUILTIN_AUX_CATALOG).forEach(function(item){used[item.id]=true;});
  corbusRaw.forEach(function(item){var entry=normalizeLibraryEntry(item,'corbus');if(used[entry.id]) entry.id=libraryId('user-corbus');used[entry.id]=true;out.customCorbus.push(entry);});
  poweredRaw.forEach(function(item){var entry=normalizeLibraryEntry(item,'powered');if(used[entry.id]) entry.id=libraryId('user-load');used[entry.id]=true;out.customPowered.push(entry);});
  return out;
}
function readDeviceLibrary(){try{var raw=localStorage.getItem(DEVICE_LIBRARY_KEY);if(raw) return normalizeDeviceLibrary(JSON.parse(raw));}catch(err){}return defaultDeviceLibrary();}
function persistDeviceLibrary(lib){deviceLibrary=normalizeDeviceLibrary(lib);try{localStorage.setItem(DEVICE_LIBRARY_KEY,JSON.stringify(deviceLibrary));}catch(err){}rebuildCatalogs();}
function editableOverride(base,override){var out={};Object.keys(base).forEach(function(key){out[key]=base[key];});if(override){var fields=copyEditableCatalogFields(override);Object.keys(fields).forEach(function(key){out[key]=fields[key];});}return out;}
function rebuildCatalogIndexes(){corbusIndex=indexById(CORBUS_CATALOG);auxIndex=indexById(AUX_CATALOG);}
function rebuildCatalogs(){
  var lib=normalizeDeviceLibrary(deviceLibrary||defaultDeviceLibrary());deviceLibrary=lib;
  CORBUS_CATALOG.length=0;BUILTIN_CORBUS_CATALOG.forEach(function(item){CORBUS_CATALOG.push(editableOverride(item,lib.overrides.corbus[item.id]));});
  lib.customCorbus.forEach(function(item){CORBUS_CATALOG.push(normalizeLibraryEntry(item,'corbus'));});
  AUX_CATALOG.length=0;BUILTIN_AUX_CATALOG.forEach(function(item){AUX_CATALOG.push(editableOverride(item,lib.overrides.powered[item.id]));});
  lib.customPowered.forEach(function(item){AUX_CATALOG.push(normalizeLibraryEntry(item,'powered'));});
  rebuildCatalogIndexes();
}
rebuildCatalogIndexes();

function indexById(list){var out={};list.forEach(function(item){out[item.id]=item;});return out;}
function indexByModel(list){var out={};list.forEach(function(item){out[item.model]=item;});return out;}
function esc(value){return String(value===null||value===undefined?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
function clone(value){return JSON.parse(JSON.stringify(value));}
function id(prefix){return (prefix||'pcc')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);}
function number(value,fallback){var n=Number(value);return isFinite(n)?n:(fallback||0);}
function clamp(value,min,max,fallback){return Math.max(min,Math.min(max,number(value,fallback)));}
function round(value){return Math.round((number(value,0)+Number.EPSILON)*100)/100;}
function formatCurrent(value){var n=round(value);return Math.round(n)===n?String(n):n.toFixed(n<10?2:1).replace(/0+$/,'').replace(/\.$/,'');}
function formatMa(value){return formatCurrent(value)+' mA';}
function formatSignedCurrent(value){var n=round(value);return (n>0?'+':'')+formatCurrent(n);}
function formatSignedMa(value){var n=round(value);return (n>0?'+':'')+formatMa(n);}
function currentKey(){return 'alarmMa';}
function panelPgms(){return (PANEL_PGMS[state.panelModel]||PANEL_PGMS.HS2016).slice();}
function isPowerModule(item){return !!(item&&item.powerModule);}
function findDevice(deviceId){for(var i=0;i<state.corbus.length;i++) if(state.corbus[i].id===deviceId) return state.corbus[i];return null;}
function deviceCatalog(device){return corbusIndex[device.modelId]||corbusIndex['custom-corbus'];}
function loadCatalog(load){return auxIndex[load.catalogId]||auxIndex['custom-load'];}
function deviceOrderValue(deviceOrCatalog){var modelId=deviceOrCatalog&&deviceOrCatalog.modelId?deviceOrCatalog.modelId:deviceOrCatalog&&deviceOrCatalog.id;return Object.prototype.hasOwnProperty.call(CORBUS_ORDER_INDEX,modelId)?CORBUS_ORDER_INDEX[modelId]:999;}
function deviceFamilyKey(c){
  if(!c) return 'other';
  if(c.family==='keypad') return 'keypad';
  if(c.id==='hsm2108') return 'zone-expander';
  if(c.id==='hsm2208') return 'output-expander';
  if(c.powerModule) return 'power-module';
  if(c.powergHost) return 'host';
  if(c.hasAudioStations) return 'audio';
  if(c.custom) return 'custom';
  return 'module';
}
function familyMeta(family){
  var map={
    keypad:{title:'Keypads',deviceLabel:'Total keypads',additionalLabel:'Additional devices'},
    'zone-expander':{title:'Zone Expanders',deviceLabel:'Total zone expanders',additionalLabel:'Additional devices'},
    'output-expander':{title:'Output Expanders',deviceLabel:'Total output expanders',additionalLabel:'Additional devices'},
    'power-module':{title:'Power / Output Modules',deviceLabel:'Total power modules',additionalLabel:'Additional devices'},
    host:{title:'Host Transceivers',deviceLabel:'Total host transceivers',additionalLabel:'Additional devices'},
    audio:{title:'Two-Way Audio Modules',deviceLabel:'Total audio modules',additionalLabel:'Additional devices'},
    custom:{title:'Custom CORBUS Devices',deviceLabel:'Total custom devices',additionalLabel:'Additional devices'},
    module:{title:'CORBUS Modules',deviceLabel:'Total modules',additionalLabel:'Additional devices'}
  };
  return map[family]||map.module;
}
function catalogGroupLabel(c){
  var family=deviceFamilyKey(c);
  if(family==='keypad') return 'Keypads';
  if(family==='zone-expander') return 'Zone Expander Modules';
  if(family==='output-expander') return 'Output Expander Modules';
  if(family==='power-module') return 'Power and Output Modules';
  if(family==='host') return 'Host Transceiver Modules';
  if(family==='audio') return 'Two-Way Audio Modules';
  if(family==='custom') return 'Custom CORBUS Devices';
  return c.category||'CORBUS Devices';
}
function orderedCatalog(list){return list.slice().sort(function(a,b){var diff=deviceOrderValue(a)-deviceOrderValue(b);return diff||String(a.model).localeCompare(String(b.model));});}
function orderedDevices(sourceId){return state.corbus.filter(function(device){return device.sourceId===sourceId;}).slice().sort(function(a,b){var diff=deviceOrderValue(a)-deviceOrderValue(b);return diff||String(a.id).localeCompare(String(b.id));});}
function powerModules(){return orderedDevices('panel').filter(function(device){return isPowerModule(deviceCatalog(device));});}
function powerSectionKey(device){return device?'local-shell-'+device.id:'panel-shell';}
function calculatorToolVisible(key){
  if(!state||!key) return false;
  if(!state.visibleToolSections||typeof state.visibleToolSections!=='object') state.visibleToolSections={};
  return Object.prototype.hasOwnProperty.call(state.visibleToolSections,key)?state.visibleToolSections[key]!==false:true;
}
function setCalculatorToolVisible(key,value){
  if(!state||!key) return;
  if(!state.visibleToolSections||typeof state.visibleToolSections!=='object') state.visibleToolSections={};
  state.visibleToolSections[key]=value!==false;
}
function sourceName(sourceId){if(sourceId==='panel') return state.panelModel+' panel';var d=findDevice(sourceId);return d?deviceCatalog(d).model:'Missing power module';}
function markLastAdded(device){
  if(!device) return;
  lastAddedDeviceId=device.id;
  lastAddedUntil=Date.now()+2600;
}
function lastAddedClass(device){return device&&device.id===lastAddedDeviceId&&Date.now()<lastAddedUntil?' pcc2-just-added':'';}
function refreshLastAddedEffect(){
  window.clearTimeout(lastAddedTimer);
  var remaining=lastAddedUntil-Date.now();
  if(!lastAddedDeviceId||remaining<=0){lastAddedDeviceId='';return;}
  lastAddedTimer=window.setTimeout(function(){
    var row=host&&host.querySelector('[data-device-row="'+lastAddedDeviceId+'"]');
    if(row) row.classList.remove('pcc2-just-added');
    lastAddedDeviceId='';
  },remaining+40);
}

function defaultSmokeRow(){return {id:id('smoke'),brand:'DSC',model:'FSA-210B',standbyMa:TWO_WIRE_STANDBY_PER_DETECTOR_MA,alarmMa:35,quantity:1};}
function defaultPgmState(name){return {name:name,mode:'output',loads:[],smoke:{detectors:[]}};}
function defaultState(){
  var defaults=['hs2lcd','hs2tchp','hsm2108','hsm2host'].map(function(modelId){return createDevice('panel',modelId);});
  return {
    schemaVersion:SCHEMA_VERSION,
    panelModel:'HS2016',
    corbus:defaults,
    aux:[],
    pgms:{PGM1:defaultPgmState('PGM1'),PGM2:defaultPgmState('PGM2'),PGM3:defaultPgmState('PGM3'),PGM4:defaultPgmState('PGM4')},
    pclink2:{modelId:'',standbyMa:0,alarmMa:0,description:''},
    localAux:{},
    localPgms:{},
    collapsedSections:{},
    activeToolSection:'panel-overview',
    navWrap:true,
    navKeepParentsOpen:false,
    navOpenParents:{panel:true},
    visibleToolSections:{'panel-shell':true,'panel-overview':true,'corbus-panel':true,'aux-panel':true,'pgms':true,'pclink':true},
    showAccountingTotals:true,
    showCorbusCategoryRows:false,
    showTerminals:true,
    corbusSectionDisplay:{}
  };
}
function normalizeLoad(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  var catalogId=auxIndex[raw.catalogId]?raw.catalogId:'custom-load';
  var c=auxIndex[catalogId];
  return {id:String(raw.id||id('load')),catalogId:catalogId,category:String(raw.category||c.category),model:String(raw.model||c.model),description:String(raw.description||c.description),standbyMa:c.custom?Math.round(clamp(raw.standbyMa,0,10000,c.standbyMa)):clamp(raw.standbyMa,0,10000,c.standbyMa),alarmMa:c.custom?Math.round(clamp(raw.alarmMa,0,10000,c.alarmMa)):clamp(raw.alarmMa,0,10000,c.alarmMa),quantity:Math.max(1,Math.floor(clamp(raw.quantity,1,999,1))),kind:String(raw.kind||'load'),outputId:String(raw.outputId||''),parentInstance:Math.max(1,Math.floor(clamp(raw.parentInstance!==undefined?raw.parentInstance:raw.instanceIndex,1,999,1)))};
}
function normalizeDevice(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  var modelId=corbusIndex[raw.modelId]?raw.modelId:'hs2lcd';
  var c=corbusIndex[modelId];
  var quantity=isPowerModule(c)?1:Math.max(1,Math.floor(clamp(raw.quantity,1,999,1)));
  var children=Array.isArray(raw.children)?raw.children.map(normalizeLoad):[];
  children.forEach(function(load){load.parentInstance=Math.min(quantity,Math.max(1,load.parentInstance));});
  return {id:String(raw.id||id('device')),sourceId:String(raw.sourceId||'panel'),modelId:modelId,category:String(raw.category||c.category),model:String(raw.model||c.model),description:String(raw.description||c.description),standbyMa:c.custom?Math.round(clamp(raw.standbyMa,0,10000,c.standbyMa)):clamp(raw.standbyMa,0,10000,c.standbyMa),alarmMa:c.custom?Math.round(clamp(raw.alarmMa,0,10000,c.alarmMa)):clamp(raw.alarmMa,0,10000,c.alarmMa),quantity:quantity,extraPower:raw.extraPower===true,children:children};
}
function normalizeSmoke(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  var sourceRows=Array.isArray(raw.detectors)?raw.detectors:[];
  if(!sourceRows.length&&(raw.model||raw.quantity!==undefined)) sourceRows=[{model:raw.model,quantity:raw.quantity,standbyMa:raw.standbyMa,alarmMa:raw.alarmMa}];
  var remaining=18;var rows=[];
  sourceRows.forEach(function(item){
    item=item&&typeof item==='object'?item:{};
    var quantity=Math.floor(clamp(item.quantity,0,remaining,0));
    if(quantity<1) return;
    var model=String(item.model||'FSA-210B');
    rows.push({
      id:String(item.id||id('smoke')),
      brand:String(item.brand||(/^FSA-/i.test(model)?'DSC':'')),
      model:model,
      standbyMa:clamp(item.standbyMa,0,1000,TWO_WIRE_STANDBY_PER_DETECTOR_MA),
      alarmMa:clamp(item.alarmMa,0,1000,legacySmokeAlarmMa(model)),
      quantity:quantity
    });
    remaining-=quantity;
  });
  return {detectors:rows};
}
function normalizeState(raw){
  var out=defaultState();
  if(!raw||typeof raw!=='object') return out;
  out.panelModel=PANEL_MODELS.indexOf(raw.panelModel)>=0?raw.panelModel:'HS2016';
  if(Array.isArray(raw.corbus)) out.corbus=raw.corbus.map(normalizeDevice);
  out.aux=Array.isArray(raw.aux)?raw.aux.map(normalizeLoad):[];
  ['PGM1','PGM2','PGM3','PGM4'].forEach(function(name){
    var p=raw.pgms&&raw.pgms[name]||{};
    out.pgms[name]={name:name,mode:name==='PGM2'&&p.mode==='smoke'?'smoke':'output',loads:Array.isArray(p.loads)?p.loads.map(normalizeLoad):[],smoke:normalizeSmoke(p.smoke)};
  });
  var comm=raw.pclink2||{};
  var commId=commIndex[comm.modelId]?comm.modelId:'';
  var cc=commIndex[commId];
  out.pclink2={modelId:commId,standbyMa:cc.custom?Math.round(clamp(comm.standbyMa,0,10000,cc.standbyMa)):clamp(comm.standbyMa,0,10000,cc.standbyMa),alarmMa:cc.custom?Math.round(clamp(comm.alarmMa,0,10000,cc.alarmMa)):clamp(comm.alarmMa,0,10000,cc.alarmMa),description:String(comm.description||cc.description)};
  out.localAux={};
  if(raw.localAux&&typeof raw.localAux==='object') Object.keys(raw.localAux).forEach(function(key){out.localAux[key]=Array.isArray(raw.localAux[key])?raw.localAux[key].map(normalizeLoad):[];});
  out.localPgms={};
  if(raw.localPgms&&typeof raw.localPgms==='object') Object.keys(raw.localPgms).forEach(function(key){out.localPgms[key]={};['O1','O2','O3','O4'].forEach(function(output){out.localPgms[key][output]=Array.isArray(raw.localPgms[key]&&raw.localPgms[key][output])?raw.localPgms[key][output].map(normalizeLoad):[];});});
  out.collapsedSections={};
  if(raw.collapsedSections&&typeof raw.collapsedSections==='object'&&!Array.isArray(raw.collapsedSections)) Object.keys(raw.collapsedSections).forEach(function(key){out.collapsedSections[String(key)]=raw.collapsedSections[key]===true;});
  out.activeToolSection=String(raw.activeToolSection||'panel-overview');
  out.navWrap=raw.navWrap!==false;
  out.navKeepParentsOpen=raw.navKeepParentsOpen===true;
  out.navOpenParents={panel:true};
  if(raw.navOpenParents&&typeof raw.navOpenParents==='object'&&!Array.isArray(raw.navOpenParents)){
    out.navOpenParents={};
    Object.keys(raw.navOpenParents).forEach(function(key){out.navOpenParents[String(key)]=raw.navOpenParents[key]===true;});
    if(!Object.keys(out.navOpenParents).length) out.navOpenParents.panel=true;
  }
  out.visibleToolSections={};
  if(raw.visibleToolSections&&typeof raw.visibleToolSections==='object'&&!Array.isArray(raw.visibleToolSections)) Object.keys(raw.visibleToolSections).forEach(function(key){out.visibleToolSections[String(key)]=raw.visibleToolSections[key]!==false;});
  out.showAccountingTotals=raw.showAccountingTotals!==false;
  out.showCorbusCategoryRows=raw.showCorbusCategoryRows===true;
  out.showTerminals=raw.showTerminals!==false;
  out.corbusSectionDisplay={};
  if(raw.corbusSectionDisplay&&typeof raw.corbusSectionDisplay==='object'&&!Array.isArray(raw.corbusSectionDisplay)){
    Object.keys(raw.corbusSectionDisplay).forEach(function(sourceId){
      var entry=raw.corbusSectionDisplay[sourceId];if(!entry||typeof entry!=='object') return;
      out.corbusSectionDisplay[String(sourceId)]={};
      if(typeof entry.showTotals==='boolean') out.corbusSectionDisplay[String(sourceId)].showTotals=entry.showTotals;
      if(typeof entry.showCategories==='boolean') out.corbusSectionDisplay[String(sourceId)].showCategories=entry.showCategories;
    });
  }
  /* Hierarchy migration applies only to pre-v2.5 saved data. v2.5+ already
     contains model-group and physical-instance collapse state, so upgrades
     preserve whatever the user currently has open. */
  var savedSchema=String(raw.schemaVersion||'');
  var needsHierarchyMigration=!savedSchema||/^1\./.test(savedSchema)||/^2\.[0-4](?:\.|$)/.test(savedSchema);
  if(needsHierarchyMigration){
    out.corbus.forEach(function(device){
      out.collapsedSections[deviceGroupKey(device)]=true;
      for(var instance=1;instance<=device.quantity;instance++) out.collapsedSections[attachmentInstanceKey(device,instance)]=true;
    });
  }
  out.schemaVersion=SCHEMA_VERSION;
  cleanupState(out);
  var validToolSections={'panel-shell':true,'panel-overview':true,'corbus-panel':true,'aux-panel':true,'pgms':true,'pclink':true};
  var validActiveToolSections={'panel-overview':true,'corbus-panel':true,'aux-panel':true,'pgms':true,'pclink':true};
  out.corbus.forEach(function(device){var catalog=corbusIndex[device.modelId];if(catalog&&catalog.powerModule){validToolSections['local-shell-'+device.id]=true;validToolSections['corbus-'+device.id]=true;validToolSections['aux-'+device.id]=true;validActiveToolSections['local-shell-'+device.id]=true;validActiveToolSections['corbus-'+device.id]=true;validActiveToolSections['aux-'+device.id]=true;if(catalog.id==='hsm2204'){validToolSections['local-pgms-'+device.id]=true;validActiveToolSections['local-pgms-'+device.id]=true;}}});
  Object.keys(validToolSections).forEach(function(key){if(!Object.prototype.hasOwnProperty.call(out.visibleToolSections,key)) out.visibleToolSections[key]=true;});
  Object.keys(out.visibleToolSections).forEach(function(key){if(!validToolSections[key]) delete out.visibleToolSections[key];});
  if(!validActiveToolSections[out.activeToolSection]) out.activeToolSection='panel-overview';
  return out;
}
function mergeGroupedDevices(target){
  var grouped=[];var byKey={};
  target.corbus.forEach(function(device){
    var c=corbusIndex[device.modelId]||corbusIndex.hs2lcd;
    if(c.powerModule||c.custom){grouped.push(device);return;}
    var variant=c.id==='hs2tchp'&&device.extraPower?'extra':'normal';
    var key=device.sourceId+'|'+device.modelId+'|'+variant;
    var existing=byKey[key];
    if(!existing){byKey[key]=device;grouped.push(device);return;}
    var offset=existing.quantity;
    device.children.forEach(function(load){load.parentInstance=Math.max(1,load.parentInstance)+offset;existing.children.push(load);});
    existing.quantity+=device.quantity;
    existing.extraPower=existing.extraPower||device.extraPower;
  });
  target.corbus=grouped;
}
function cleanupState(target){
  mergeGroupedDevices(target);
  var powerIds={};target.corbus.forEach(function(d){if(isPowerModule(corbusIndex[d.modelId])) powerIds[d.id]=true;});
  target.corbus=target.corbus.filter(function(d){return d.sourceId==='panel'||powerIds[d.sourceId];});
  Object.keys(target.localAux).forEach(function(key){if(!powerIds[key]) delete target.localAux[key];});
  Object.keys(target.localPgms).forEach(function(key){var device=findDeviceIn(target,key);if(!powerIds[key]||!device||deviceCatalog(device).id!=='hsm2204') delete target.localPgms[key];});
  if(!target.corbusSectionDisplay||typeof target.corbusSectionDisplay!=='object'||Array.isArray(target.corbusSectionDisplay)) target.corbusSectionDisplay={};
  Object.keys(target.corbusSectionDisplay).forEach(function(sourceId){if(sourceId!=='panel'&&!powerIds[sourceId]) delete target.corbusSectionDisplay[sourceId];});
  if(!target.visibleToolSections||typeof target.visibleToolSections!=='object') target.visibleToolSections={};
  var validToolSections={'panel-shell':true,'panel-overview':true,'corbus-panel':true,'aux-panel':true,'pgms':true,'pclink':true};
  var validActiveToolSections={'panel-overview':true,'corbus-panel':true,'aux-panel':true,'pgms':true,'pclink':true};
  Object.keys(powerIds).forEach(function(deviceId){var device=findDeviceIn(target,deviceId),catalog=device&&corbusIndex[device.modelId];validToolSections['local-shell-'+deviceId]=true;validToolSections['corbus-'+deviceId]=true;validToolSections['aux-'+deviceId]=true;validActiveToolSections['local-shell-'+deviceId]=true;validActiveToolSections['corbus-'+deviceId]=true;validActiveToolSections['aux-'+deviceId]=true;if(catalog&&catalog.id==='hsm2204'){validToolSections['local-pgms-'+deviceId]=true;validActiveToolSections['local-pgms-'+deviceId]=true;}});
  if(!target.collapsedSections||typeof target.collapsedSections!=='object') target.collapsedSections={};
  if(!Object.prototype.hasOwnProperty.call(target.collapsedSections,'panel-shell')) target.collapsedSections['panel-shell']=false;
  Object.keys(powerIds).forEach(function(deviceId){var shellKey='local-shell-collapse-'+deviceId;if(!Object.prototype.hasOwnProperty.call(target.collapsedSections,shellKey)) target.collapsedSections[shellKey]=false;});
  Object.keys(validToolSections).forEach(function(key){if(!Object.prototype.hasOwnProperty.call(target.visibleToolSections,key)) target.visibleToolSections[key]=true;});
  Object.keys(target.visibleToolSections).forEach(function(key){if(!validToolSections[key]) delete target.visibleToolSections[key];});
  if(!validActiveToolSections[target.activeToolSection]) target.activeToolSection='panel-overview';
}
function findDeviceIn(target,deviceId){for(var i=0;i<target.corbus.length;i++) if(target.corbus[i].id===deviceId) return target.corbus[i];return null;}
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(err){}}
function read(){try{var raw=localStorage.getItem(STORE_KEY);if(raw) return normalizeState(JSON.parse(raw));}catch(err){}return defaultState();}
function notify(message,type){
  var el=host&&host.querySelector('[data-pcc-toast]');if(!el) return;
  el.textContent=message;el.className='pcc2-toast is-visible '+(type||'info');
  window.clearTimeout(notify.timer);notify.timer=window.setTimeout(function(){el.classList.remove('is-visible');},3200);
}

function modelCount(modelId,excludeId){var total=0;state.corbus.forEach(function(d){if(d.id!==excludeId&&d.modelId===modelId) total+=d.quantity;});return total;}
function keypadCount(excludeId){var total=0;state.corbus.forEach(function(d){var c=deviceCatalog(d);if(d.id!==excludeId&&c.family==='keypad') total+=d.quantity;});return total;}
function hostCount(excludeId){var total=0;state.corbus.forEach(function(d){var c=deviceCatalog(d);if(d.id!==excludeId&&c.powergHost) total+=d.quantity;});return total;}
function maxForModel(modelId,excludeId){
  var c=corbusIndex[modelId];if(!c) return 0;
  if(c.family==='keypad') return Math.max(0,16-keypadCount(excludeId));
  if(c.powergHost) return Math.max(0,1-hostCount(excludeId));
  if(MODULE_LIMITS[modelId]) return Math.max(0,(MODULE_LIMITS[modelId][state.panelModel]||0)-modelCount(modelId,excludeId));
  if(c.powerModule) return Math.max(0,(MODULE_LIMITS[modelId][state.panelModel]||0)-modelCount(modelId,excludeId));
  return 99;
}
function canUseModel(modelId,excludeId){return maxForModel(modelId,excludeId)>0;}
function panelModelConflicts(model){
  var conflicts=[];
  Object.keys(MODULE_LIMITS).forEach(function(modelId){
    var used=modelCount(modelId,'');
    var allowed=MODULE_LIMITS[modelId][model]||0;
    if(used>allowed) conflicts.push((corbusIndex[modelId]?corbusIndex[modelId].model:modelId)+': '+used+' installed / '+allowed+' allowed');
  });
  return conflicts;
}
function optionGroups(list,selectedId,excludeDeviceId,allowPowerModules){
  var groups={};var order=[];orderedCatalog(list).forEach(function(item){
    if(item.powerModule&&!allowPowerModules&&item.id!==selectedId) return;
    if(item.id!==selectedId&&!canUseModel(item.id,excludeDeviceId)) return;
    var label=catalogGroupLabel(item);if(!groups[label]){groups[label]=[];order.push(label);}groups[label].push(item);
  });
  return order.map(function(category){return '<optgroup label="'+esc(category)+'">'+groups[category].map(function(item){return '<option value="'+esc(item.id)+'" '+(item.id===selectedId?'selected':'')+'>'+esc(item.model)+'</option>';}).join('')+'</optgroup>';}).join('');
}
function auxOptions(selectedId){
  var groups={};orderedAuxCatalog().forEach(function(item){if(item.hidden&&item.id!==selectedId) return;(groups[item.category]||(groups[item.category]=[])).push(item);});
  return Object.keys(groups).map(function(category){return '<optgroup label="'+esc(category)+'">'+groups[category].map(function(item){return '<option value="'+esc(item.id)+'" '+(item.id===selectedId?'selected':'')+'>'+esc(item.model)+'</option>';}).join('')+'</optgroup>';}).join('');
}

function loadCurrent(load,mode){return number(mode==='standby'?load.standbyMa:load.alarmMa,0);}
function loadTotal(load,mode){return loadCurrent(load,mode)*Math.max(1,number(load.quantity,1));}
function deviceUnitBaseCurrent(device,mode){
  var c=deviceCatalog(device);var per=number(mode==='standby'?device.standbyMa:device.alarmMa,0);
  if(mode!=='standby'&&c.id==='hs2tchp'&&device.extraPower) per=c.extraPowerAlarmMa;
  return per;
}
function deviceBaseCurrent(device,mode){return deviceUnitBaseCurrent(device,mode)*device.quantity;}
function childTotals(device,mode,kind,outputId,parentInstance){
  return device.children.reduce(function(sum,load){if(kind&&load.kind!==kind) return sum;if(outputId&&load.outputId!==outputId) return sum;if(parentInstance&&load.parentInstance!==parentInstance) return sum;return sum+loadTotal(load,mode);},0);
}
function childQuantity(device,kind,parentInstance,catalogId){return device.children.reduce(function(sum,load){if(kind&&load.kind!==kind) return sum;if(parentInstance&&load.parentInstance!==parentInstance) return sum;if(catalogId&&load.catalogId!==catalogId) return sum;return sum+Math.max(1,number(load.quantity,1));},0);}
function childRowsForInstance(device,parentInstance){return device.children.filter(function(load){return load.parentInstance===parentInstance;});}
function deviceInstanceTotal(device,mode,parentInstance){return deviceUnitBaseCurrent(device,mode)+childTotals(device,mode,'','',parentInstance);}
function deviceTotal(device,mode){return deviceBaseCurrent(device,mode)+childTotals(device,mode);}
function sourceCorbusTotal(sourceId,mode){return state.corbus.reduce(function(sum,device){return sum+(device.sourceId===sourceId?deviceTotal(device,mode):0);},0);}
function smokeRows(pgm){return pgm&&pgm.smoke&&Array.isArray(pgm.smoke.detectors)?pgm.smoke.detectors:[];}
function pgmSmokeQuantity(pgm){return smokeRows(pgm).reduce(function(sum,row){return sum+number(row.quantity,0);},0);}
function pgmSmokeStandbyTotal(pgm){return smokeRows(pgm).reduce(function(sum,row){return sum+number(row.quantity,0)*number(row.standbyMa,0);},0);}
function pgmSmokeConnectedAlarmDemand(pgm){return smokeRows(pgm).reduce(function(sum,row){return sum+number(row.quantity,0)*number(row.alarmMa,0);},0);}
function pgmSmokeTotal(pgm){return pgmSmokeQuantity(pgm)?Math.min(pgmSmokeConnectedAlarmDemand(pgm),TWO_WIRE_HARDWARE_LIMIT_MA):0;}
function smokeRowById(pgm,rowId){var rows=smokeRows(pgm);for(var i=0;i<rows.length;i++) if(rows[i].id===rowId) return rows[i];return null;}

function panelPgmTotal(name,mode){var p=state.pgms[name];if(name==='PGM2'&&p.mode==='smoke') return mode==='standby'?pgmSmokeStandbyTotal(p):pgmSmokeTotal(p);return p.loads.reduce(function(sum,load){return sum+loadTotal(load,mode);},0);}
function allPanelPgmsTotal(mode){return panelPgms().reduce(function(sum,name){return sum+panelPgmTotal(name,mode);},0);}
function panelAuxTotal(mode){return state.aux.reduce(function(sum,load){return sum+loadTotal(load,mode);},0);}
function communicatorTotal(mode){
  var c=commIndex[state.pclink2.modelId]||commIndex[''];
  var key=mode==='alarm'?'alarmMa':'standbyMa';
  return c.custom?number(state.pclink2[key],0):number(c[key],0);
}
function panelExternalTotal(mode){mode=mode==='standby'?'standby':'alarm';return sourceCorbusTotal('panel',mode)+panelAuxTotal(mode)+allPanelPgmsTotal(mode);}
function panelTotal(mode){mode=mode==='standby'?'standby':'alarm';return PANEL_BOARD_MA+panelExternalTotal(mode)+communicatorTotal(mode);}
function panelMaximumTotal(){return PANEL_BOARD_MA+panelExternalTotal('alarm')+communicatorTotal('standby');}
function panelTransmitTotal(){return PANEL_BOARD_MA+panelExternalTotal('alarm')+communicatorTotal('alarm');}
function communicatorExtraTotal(){return Math.max(0,communicatorTotal('alarm')-communicatorTotal('standby'));}
function allCollapsibleSectionKeys(target){
  target=target||state;
  var keys=['panel-shell','corbus-panel','aux-panel','pgms','pclink'];
  var panelOutputs=PANEL_PGMS[target.panelModel]||[];
  panelOutputs.forEach(function(name){keys.push('pgm-'+name);});
  var familyKeys={};
  (target.corbus||[]).forEach(function(module){
    var c=corbusIndex[module.modelId];
    var familyKey='corbus-family-'+String(module.sourceId||'panel')+'-'+deviceFamilyKey(c);
    if(!familyKeys[familyKey]){familyKeys[familyKey]=true;keys.push(familyKey);}
    keys.push('device-group-'+module.id);
    for(var instance=1;instance<=Math.max(1,number(module.quantity,1));instance++) keys.push('attached-instance-'+module.id+'-'+instance);
    if(!c||!c.powerModule) return;
    keys.push('local-shell-collapse-'+module.id);
    keys.push('corbus-'+module.id);
    keys.push('aux-'+module.id);
    if(c.id==='hsm2204'){
      keys.push('local-pgms-'+module.id);
      ['O1','O2','O3','O4'].forEach(function(output){keys.push('local-pgm-'+module.id+'-'+output);});
    }
  });
  return keys;
}
function setAllSectionsCollapsed(collapsed){
  if(!state.collapsedSections) state.collapsedSections={};
  allCollapsibleSectionKeys(state).forEach(function(key){state.collapsedSections[key]=collapsed===true;});
}
function sectionCollapsed(key){
  if(!key) return false;
  if(state.collapsedSections&&Object.prototype.hasOwnProperty.call(state.collapsedSections,key)) return !!state.collapsedSections[key];
  return true;
}
function attachmentKey(device){return 'attached-'+device.id;}
function attachmentsCollapsed(device){var key=attachmentKey(device);return state.collapsedSections&&Object.prototype.hasOwnProperty.call(state.collapsedSections,key)?!!state.collapsedSections[key]:true;}
function attachmentInstanceKey(device,instance){return 'attached-instance-'+device.id+'-'+instance;}
function attachmentInstanceCollapsed(device,instance){var key=attachmentInstanceKey(device,instance);return state.collapsedSections&&Object.prototype.hasOwnProperty.call(state.collapsedSections,key)?!!state.collapsedSections[key]:true;}
function familySummaryKey(sourceId,family){return 'load-summary-'+sourceId+'-'+family;}
function familySummaryCollapsed(sourceId,family){var key=familySummaryKey(sourceId,family);return state.collapsedSections&&Object.prototype.hasOwnProperty.call(state.collapsedSections,key)?!!state.collapsedSections[key]:true;}
function familyGroupKey(sourceId,family){return 'corbus-family-'+String(sourceId||'panel')+'-'+String(family||'module');}
function familyGroupCollapsed(sourceId,family){var key=familyGroupKey(sourceId,family);return !!(state.collapsedSections&&Object.prototype.hasOwnProperty.call(state.collapsedSections,key)&&state.collapsedSections[key]===true);}
function setAttachmentExpanded(device,instance){
  if(!state.collapsedSections) state.collapsedSections={};
  state.collapsedSections[familyGroupKey(device.sourceId,deviceFamilyKey(deviceCatalog(device)))]=false;
  state.collapsedSections[deviceGroupKey(device)]=false;
  if(instance) state.collapsedSections[attachmentInstanceKey(device,instance)]=false;
}
function expandSectionState(key){if(!key) return;if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[key]=false;}
function expandSourceCircuit(sourceId){
  if(sourceId==='panel'){expandSectionState('panel-shell');expandSectionState('corbus-panel');}
  else{expandSectionState('local-shell-collapse-'+sourceId);expandSectionState('corbus-'+sourceId);}
}
function expandLoadContext(context){
  var parts=String(context||'').split(':');
  if(parts[0]==='panelaux'){expandSectionState('panel-shell');expandSectionState('aux-panel');return;}
  if(parts[0]==='panelpgm'){expandSectionState('panel-shell');expandSectionState('pgms');expandSectionState('pgm-'+parts[1]);return;}
  if(parts[0]==='localaux'){expandSectionState('local-shell-collapse-'+parts[1]);expandSectionState('aux-'+parts[1]);return;}
  if(parts[0]==='localpgm'){expandSectionState('local-shell-collapse-'+parts[1]);expandSectionState('local-pgms-'+parts[1]);expandSectionState('local-pgm-'+parts[1]+'-'+parts[2]);}
}
function issueStateKey(key){return 'inline-issue-open-'+key;}
function inlineIssueOpen(key){return !!(state.collapsedSections&&state.collapsedSections[issueStateKey(key)]);}
function inlineIssueButton(key,messages,variant,target){
  if(!messages||!messages.length) return '';
  var open=inlineIssueOpen(key);var summary=messages.map(function(item){return item.text;}).join(' ');var hasIssues=hasOverMessages(messages);
  var rowVariant=variant==='row';var symbol=rowVariant?'!':'i';
  return '<button type="button" class="pcc2-inline-alert pcc2-inline-info '+(rowVariant?'pcc2-row-issue-alert ':'')+(hasIssues?'has-issues':'')+'" data-action="toggle-inline-issue" data-issue-key="'+esc(key)+'" aria-expanded="'+(open?'true':'false')+'" title="'+esc(summary)+'" aria-label="'+(hasIssues?'Show issue list':'Show calculation information')+'">'+symbol+'</button>';
}
function firstCorbusIssueTarget(sourceId){
  var devices=orderedDevices(sourceId);
  for(var i=0;i<devices.length;i++){
    var device=devices[i];
    for(var instance=1;instance<=device.quantity;instance++){
      if(deviceInstanceValidationMessages(device,instance).length) return {deviceId:device.id,instance:instance,sectionKey:sourceId==='panel'?'corbus-panel':'corbus-'+sourceId};
    }
    var rowMessages=deviceRowValidationMessages(device);
    if(rowMessages.length) return {deviceId:device.id,sectionKey:sourceId==='panel'?'corbus-panel':'corbus-'+sourceId};
  }
  return null;
}
function corbusSectionValidationMessages(sourceId,total,title){
  var messages=sourceBudgetMessages(sourceId,total,title);
  orderedDevices(sourceId).forEach(function(device){appendDeviceCircuitValidation(device,messages);});
  return overMessages(messages);
}
function firstPanelIssueTarget(){
  var corbusTarget=firstCorbusIssueTarget('panel');if(corbusTarget) return corbusTarget;
  for(var i=0;i<panelPgms().length;i++){var name=panelPgms()[i];if(pgmValidationMessages(name).length) return {sectionKey:'pgm-'+name};}
  return {sectionKey:'panel-overview'};
}
function firstLocalIssueTarget(module){
  if(!module) return null;var corbusTarget=firstCorbusIssueTarget(module.id);if(corbusTarget) return corbusTarget;
  var c=deviceCatalog(module);if(c.id==='hsm2204'){for(var i=1;i<=4;i++){if(localOutputValidationMessages(module,'O'+i).length) return {sectionKey:'local-pgm-'+module.id+'-O'+i};}}
  return {sectionKey:'local-shell-'+module.id};
}
function inlineIssueRow(key,messages){
  if(!messages||!messages.length||!inlineIssueOpen(key)) return '';
  return '<tr class="pcc2-inline-issue-row"><td colspan="6">'+validationListHtml(messages)+'</td></tr>';
}
function overMessages(messages){return (messages||[]).filter(function(message){return message&&message.level==='over';});}
function hasOverMessages(messages){return overMessages(messages).length>0;}
function issueClass(messages){return hasOverMessages(messages)?' has-limit-error':'';}
function sectionIssuePanel(key,messages){
  var issues=overMessages(messages);
  if(!issues.length||!inlineIssueOpen(key)) return '';
  return '<div class="pcc2-section-issue-panel">'+validationListHtml(issues)+'</div>';
}
function sectionInfoPanel(key,messages){
  if(!messages||!messages.length||!inlineIssueOpen(key)) return '';
  return '<div class="pcc2-section-issue-panel pcc2-section-info-panel">'+validationListHtml(messages)+'</div>';
}
function limitIssue(label,used,limit){
  if(used<=limit+0.0001) return [];
  return [{level:'over',text:label+' is '+formatMa(used)+', exceeding its '+formatMa(limit)+' limit by '+formatMa(used-limit)+'.'}];
}
function sectionBody(key,html,extraClass){return '<div class="pcc2-collapsible-body'+(extraClass?' '+extraClass:'')+'" data-pcc-section-body="'+esc(key)+'" '+(sectionCollapsed(key)?'hidden':'')+'>'+html+'</div>';}
function collapseButton(key,title){var collapsed=sectionCollapsed(key);return '<button type="button" class="card-collapse-toggle pcc2-collapse-toggle" data-action="toggle-section" data-section-key="'+esc(key)+'" aria-expanded="'+(collapsed?'false':'true')+'" aria-label="'+esc((collapsed?'Expand ':'Collapse ')+title)+'" title="'+esc((collapsed?'Expand ':'Collapse ')+title)+'"><span aria-hidden="true" class="card-collapse-chevron"></span></button>';}

function localAuxTotal(moduleId,mode){return (state.localAux[moduleId]||[]).reduce(function(sum,load){return sum+loadTotal(load,mode);},0);}
function localPgmTotal(moduleId,output,mode){return (((state.localPgms[moduleId]||{})[output])||[]).reduce(function(sum,load){return sum+loadTotal(load,mode);},0);}
function localAllPgmTotal(moduleId,mode){return ['O1','O2','O3','O4'].reduce(function(sum,out){return sum+localPgmTotal(moduleId,out,mode);},0);}
function localSupplyTotal(moduleId,mode){return sourceCorbusTotal(moduleId,mode)+localAuxTotal(moduleId,mode)+localAllPgmTotal(moduleId,mode);}
function level(used,limit){if(used>limit+0.0001) return 'over';if(used>=limit*.8) return 'warn';return 'ok';}
function statusText(used,limit){if(used>limit) return formatMa(used-limit)+' over';return formatMa(limit-used)+' remaining';}

function deviceInstanceValidationMessages(device,instance){
  var messages=[];var c=deviceCatalog(device);var instanceLabel=c.model+' #'+instance;
  if(c.hasKeypadPgm){
    var kpUsed=childTotals(device,'alarm','keypad-pgm','',instance);
    if(kpUsed>50) messages.push({level:'over',text:instanceLabel+' keypad PGM load exceeds 50 mA by '+formatMa(kpUsed-50)+'.'});
  }
  if(c.hasAux){
    var auxUsed=childTotals(device,'alarm','device-aux','',instance);
    if(auxUsed>c.auxLimitMa) messages.push({level:'over',text:instanceLabel+' '+'AUX load exceeds '+formatMa(c.auxLimitMa)+' by '+formatMa(auxUsed-c.auxLimitMa)+'.'});
  }
  if(c.id==='hsm2208'){
    for(var outputIndex=1;outputIndex<=8;outputIndex++){
      var output='O'+outputIndex;var outputUsed=childTotals(device,'alarm','device-output',output,instance);
      if(outputUsed>50) messages.push({level:'over',text:instanceLabel+' '+output+' exceeds 50 mA by '+formatMa(outputUsed-50)+'.'});
    }
    var input=deviceInstanceTotal(device,'alarm',instance);
    if(input>700) messages.push({level:'over',text:instanceLabel+' total input load exceeds 700 mA by '+formatMa(input-700)+'.'});
  }
  if(c.hasAudioStations){
    var stationQty=childQuantity(device,'audio-station',instance);var largeQty=childQuantity(device,'audio-station',instance,'audio-large');
    if(stationQty>4) messages.push({level:'over',text:instanceLabel+' supports a maximum of 4 audio stations.'});
    if(largeQty>2) messages.push({level:'over',text:instanceLabel+' supports a maximum of 2 large PC5964E audio stations.'});
    var stationLoad=childTotals(device,'alarm','audio-station','',instance);
    if(stationLoad>400) messages.push({level:'over',text:instanceLabel+' audio-station load exceeds its 400 mA AUX limit by '+formatMa(stationLoad-400)+'.'});
    var active=deviceInstanceTotal(device,'alarm',instance);
    if(active>500) messages.push({level:'over',text:instanceLabel+' active total exceeds 500 mA by '+formatMa(active-500)+'.'});
  }
  var target={deviceId:device.id,instance:instance,sectionKey:device.sourceId==='panel'?'corbus-panel':'corbus-'+device.sourceId};
  messages.forEach(function(message){if(!message.target) message.target=target;});
  return messages;
}
function appendDeviceCircuitValidation(device,messages){
  for(var instance=1;instance<=device.quantity;instance++) deviceInstanceValidationMessages(device,instance).forEach(function(message){messages.push(message);});
}
function deviceRowValidationMessages(device){
  var messages=[];var c=deviceCatalog(device);
  if(c.family==='keypad'&&keypadCount('')>16) messages.push({level:'over',text:'System keypad quantity exceeds the maximum of 16.'});
  if(c.powergHost&&hostCount('')>1) messages.push({level:'over',text:'More than one PowerG host source is installed. Only one HSM2HOST, PGPHOST, or RF keypad host source may be enrolled.'});
  if(MODULE_LIMITS[c.id]){
    var used=modelCount(c.id,'');var allowed=MODULE_LIMITS[c.id][state.panelModel]||0;
    if(used>allowed) messages.push({level:'over',text:c.model+' quantity '+used+' exceeds the '+state.panelModel+' maximum of '+allowed+'.'});
  }
  appendDeviceCircuitValidation(device,messages);
  var target={deviceId:device.id,sectionKey:device.sourceId==='panel'?'corbus-panel':'corbus-'+device.sourceId};
  messages.forEach(function(message){if(!message.target) message.target=target;});
  return overMessages(messages);
}
function familyValidationMessages(devices){
  var messages=[];devices.forEach(function(device){for(var instance=1;instance<=device.quantity;instance++) deviceInstanceValidationMessages(device,instance).forEach(function(message){messages.push(message);});});return messages;
}
function panelValidationMessages(){
  var messages=[];
  if(keypadCount('')>16) messages.push({level:'over',text:'Hardwired keypad quantity exceeds the system maximum of 16.'});
  if(hostCount('')>1) messages.push({level:'over',text:'Only one PowerG host source may be enrolled: HSM2HOST, PGPHOST, or one RF keypad.'});
  Object.keys(MODULE_LIMITS).forEach(function(modelId){
    var used=modelCount(modelId,'');
    var allowed=MODULE_LIMITS[modelId][state.panelModel]||0;
    if(used>allowed) messages.push({level:'over',text:(corbusIndex[modelId]?corbusIndex[modelId].model:modelId)+' quantity '+used+' exceeds the '+state.panelModel+' maximum of '+allowed+'.'});
  });
  var maximum=panelMaximumTotal();
  var transmitting=panelTransmitTotal();
  if(maximum>PANEL_LIMIT_MA) messages.push({level:'over',text:'Maximum panel load is '+formatMa(maximum)+', exceeding the 700 mA panel limit by '+formatMa(maximum-PANEL_LIMIT_MA)+'.'});
  if(transmitting>PANEL_TRANSMIT_LIMIT_MA) messages.push({level:'over',text:'Total load while the communicator is transmitting is '+formatMa(transmitting)+', exceeding the 1,000 mA transmit limit by '+formatMa(transmitting-PANEL_TRANSMIT_LIMIT_MA)+'.'});
  panelPgms().forEach(function(name){
    var p=state.pgms[name];
    var limitMa=name==='PGM2'&&p.mode==='smoke'?TWO_WIRE_HARDWARE_LIMIT_MA:PGM_LIMITS[name];
    var used=panelPgmTotal(name,'alarm');
    if(used>limitMa) messages.push({level:'over',text:name+' maximum connected load exceeds its '+formatMa(limitMa)+' limit.',target:{sectionKey:'pgm-'+name}});
    if(name==='PGM2'&&p.mode==='smoke'){
      if(pgmSmokeQuantity(p)>18) messages.push({level:'over',text:'PGM2 2-wire smoke mode supports a maximum of 18 detectors.',target:{sectionKey:'pgm-PGM2'}});
      var standby=pgmSmokeStandbyTotal(p);
      if(standby>TWO_WIRE_STANDBY_LIMIT_MA) messages.push({level:'over',text:'PGM2 2-wire smoke aggregate detector standby load exceeds '+formatMa(TWO_WIRE_STANDBY_LIMIT_MA)+'.',target:{sectionKey:'pgm-PGM2'}});
      var alarmDemand=pgmSmokeConnectedAlarmDemand(p);
      if(alarmDemand>TWO_WIRE_HARDWARE_LIMIT_MA) messages.push({level:'over',text:'PGM2 connected 2-wire smoke alarm demand is '+formatMa(alarmDemand)+', exceeding the 90 mA smoke-circuit maximum by '+formatMa(alarmDemand-TWO_WIRE_HARDWARE_LIMIT_MA)+'.',target:{sectionKey:'pgm-PGM2'}});
    }
  });
  state.corbus.filter(function(device){return device.sourceId==='panel';}).forEach(function(device){appendDeviceCircuitValidation(device,messages);});
  messages.forEach(function(message){if(message.level==='over'&&!message.target) message.target={sectionKey:'panel-overview'};});
  if(!messages.length) messages.push({level:'ok',text:'The panel load is within 700 mA, and the communicator transmit total is within 1,000 mA.'});
  return messages;
}
function localValidationMessages(module){
  var messages=[];
  var used=localSupplyTotal(module.id,'alarm');
  var c=deviceCatalog(module);
  var label=c.model+' #'+powerModuleOrdinal(module);
  if(used>LOCAL_SUPPLY_LIMIT_MA) messages.push({level:'over',text:label+' maximum connected load exceeds 1,000 mA by '+formatMa(used-LOCAL_SUPPLY_LIMIT_MA)+'.',target:{sectionKey:'local-shell-'+module.id}});
  if(c.id==='hsm2204'){
    ['O1','O2','O3','O4'].forEach(function(output,index){
      var outUsed=localPgmTotal(module.id,output,'alarm');
      if(outUsed>500) messages.push({level:'over',text:label+' Output'+(index+1)+' exceeds its 500 mA limit by '+formatMa(outUsed-500)+'.',target:{sectionKey:'local-pgm-'+module.id+'-'+output}});
    });
  }
  state.corbus.filter(function(device){return device.sourceId===module.id;}).forEach(function(device){appendDeviceCircuitValidation(device,messages);});
  if(!messages.length) messages.push({level:'ok',text:label+' connected load is within its independent 1,000 mA supply budget.'});
  return messages;
}
function pgmValidationMessages(name){
  var p=state.pgms[name];var messages=[];
  if(name==='PGM2'&&p.mode==='smoke'){
    var quantity=pgmSmokeQuantity(p);var standby=pgmSmokeStandbyTotal(p);var demand=pgmSmokeConnectedAlarmDemand(p);
    if(quantity>18) messages.push({level:'over',text:'PGM2 2-wire smoke mode supports a maximum of 18 detectors.',target:{sectionKey:'pgm-PGM2'}});
    if(standby>TWO_WIRE_STANDBY_LIMIT_MA) messages.push({level:'over',text:'PGM2 2-wire smoke standby load is '+formatMa(standby)+', exceeding the '+formatMa(TWO_WIRE_STANDBY_LIMIT_MA)+' maximum by '+formatMa(standby-TWO_WIRE_STANDBY_LIMIT_MA)+'.'});
    if(demand>TWO_WIRE_HARDWARE_LIMIT_MA) messages.push({level:'over',text:'PGM2 connected smoke alarm demand is '+formatMa(demand)+', exceeding the 90 mA circuit maximum by '+formatMa(demand-TWO_WIRE_HARDWARE_LIMIT_MA)+'.'});
  }else{
    var used=panelPgmTotal(name,'alarm');var limitMa=PGM_LIMITS[name];
    if(used>limitMa) messages.push({level:'over',text:name+' connected load is '+formatMa(used)+', exceeding its '+formatMa(limitMa)+' limit by '+formatMa(used-limitMa)+'.'});
  }
  messages.forEach(function(message){if(message.level==='over'&&!message.target) message.target={sectionKey:'pgm-'+name};});
  return messages;
}
function localOutputValidationMessages(module,output){
  var used=localPgmTotal(module.id,output,'alarm');var numberValue=Math.max(1,Number(String(output).replace(/\D/g,''))||1);
  var messages=limitIssue(deviceCatalog(module).model+' #'+powerModuleOrdinal(module)+' Output'+numberValue+' connected load',used,500);
  messages.forEach(function(message){message.target={sectionKey:'local-pgm-'+module.id+'-'+output};});
  return messages;
}
function sourceBudgetMessages(sourceId,total,label){
  var limitMa=sourceId==='panel'?PANEL_LIMIT_MA:LOCAL_SUPPLY_LIMIT_MA;
  return total>limitMa?[{level:'over',text:label+' alone is '+formatMa(total)+', exceeding the '+formatMa(limitMa)+' source budget by '+formatMa(total-limitMa)+'.',target:{sectionKey:sourceId==='panel'?'corbus-panel':'corbus-'+sourceId}}]:[];
}
function pclinkValidationMessages(){
  var messages=[];var transmit=panelTransmitTotal();
  if(transmit>PANEL_TRANSMIT_LIMIT_MA) messages.push({level:'over',text:'The panel total while this communicator is transmitting is '+formatMa(transmit)+', exceeding the 1,000 mA transmit limit by '+formatMa(transmit-PANEL_TRANSMIT_LIMIT_MA)+'.',target:{sectionKey:'pclink'}});
  return messages;
}
function powerModuleOrdinal(device){var same=state.corbus.filter(function(d){return d.modelId===device.modelId;});return same.indexOf(device)+1;}

/* v406 report output uses one current column for the actual panel/source
   budget. Device rows use their alarm/maximum current; the communicator row
   uses its normal current. The summary then shows the communicator transmit
   current separately and calculates the total while transmitting. This keeps
   the worksheet compact and matches the way the 700 mA / 1,000 mA budgets are
   actually evaluated. */
function reportStatus(value,limitMa){return value>limitMa?'OVER':'OK';}
function reportSourceName(sourceId){
  if(sourceId==='panel') return 'Main Panel';
  var module=findDevice(sourceId);return module?deviceCatalog(module).model+' #'+powerModuleOrdinal(module):'Local Supply';
}
function reportLoadIdentity(load){var c=loadCatalog(load);return {model:c.custom?load.model:c.model,description:c.custom?load.description:c.description};}
function reportDeviceIdentity(device){var c=deviceCatalog(device);return {model:c.custom?device.model:deviceVariantLabel(device,c),description:c.custom?device.description:c.description};}
function reportCurrentLine(section,item,currentEach,quantity){
  quantity=Math.max(1,number(quantity,1));currentEach=number(currentEach,0);
  return {section:section,item:item,currentEach:currentEach,quantity:quantity,total:currentEach*quantity};
}
function reportItemLabel(identity){var model=String(identity.model||'').trim(),description=String(identity.description||'').trim();return model||description;}
function reportChildItem(device,load){
  var c=deviceCatalog(device),instance=Math.max(1,number(load.parentInstance,1)),parent=deviceVariantLabel(device,c)+' #'+instance,identity=reportLoadIdentity(load),prefix='Attached load';
  if(load.kind==='keypad-pgm') prefix='Keypad PGM';
  else if(load.kind==='device-aux') prefix='AUX load';
  else if(load.kind==='device-output') prefix=(load.outputId||'Output')+' load';
  else if(load.kind==='audio-station') prefix='Audio station';
  return parent+' · '+prefix+' · '+reportItemLabel(identity);
}
function appendCurrentDeviceLines(lines,sourceId,section){
  orderedDevices(sourceId).forEach(function(device){
    var identity=reportDeviceIdentity(device);
    lines.push(reportCurrentLine(section,reportItemLabel(identity),deviceUnitBaseCurrent(device,'alarm'),device.quantity));
    (device.children||[]).forEach(function(load){lines.push(reportCurrentLine(section,reportChildItem(device,load),loadCurrent(load,'alarm'),load.quantity));});
  });
}
function appendCurrentLoadLines(lines,list,section,prefix){
  (list||[]).forEach(function(load){var identity=reportLoadIdentity(load);lines.push(reportCurrentLine(section,(prefix?prefix+' · ':'')+reportItemLabel(identity),loadCurrent(load,'alarm'),load.quantity));});
}
function reportSummaryRow(id,label,value,kind,options){
  options=options||{};return {id:id,label:label,value:number(value,0),kind:kind||'value',section:options.section||'',limit:options.limit==null?null:number(options.limit,0),displayValue:options.displayValue||''};
}
function reportSummaryLabel(row){return row.limit==null?row.label:row.label+' — '+reportStatus(row.value,row.limit)+' (limit '+row.limit+' mA)';}
function reportSummaryDisplay(row){return row.displayValue||String(round(row.value));}
function reportSectionLayout(table){
  var groups={},order=[],sectionSummaries={},trailingSummaries=[];
  (table.summaryRows||[]).forEach(function(row){
    if(row.kind==='section'){sectionSummaries[row.section]=row;if(order.indexOf(row.section)<0) order.push(row.section);}
    else trailingSummaries.push(row);
  });
  (table.lines||[]).forEach(function(line){
    if(!groups[line.section]) groups[line.section]=[];
    groups[line.section].push(line);
    if(order.indexOf(line.section)<0) order.push(line.section);
  });
  return {groups:groups,order:order,sectionSummaries:sectionSummaries,trailingSummaries:trailingSummaries};
}
function mainPanelReportTable(){
  var lines=[];
  lines.push(reportCurrentLine('CORBUS',state.panelModel+' panel board',PANEL_BOARD_MA,1));
  appendCurrentDeviceLines(lines,'panel','CORBUS');
  appendCurrentLoadLines(lines,state.aux,'AUX','');
  panelPgms().forEach(function(name){
    var p=state.pgms[name];
    if(name==='PGM2'&&p.mode==='smoke'){
      if(pgmSmokeQuantity(p)) lines.push(reportCurrentLine('PGMs','PGM2 · 2-wire smoke circuit',pgmSmokeTotal(p),1));
    }else appendCurrentLoadLines(lines,p.loads,'PGMs',name);
  });
  var comm=commIndex[state.pclink2.modelId]||commIndex[''];
  if(state.pclink2.modelId||communicatorTotal('standby')||communicatorTotal('alarm')){
    var commIdentity={model:comm.custom?'Custom communicator':comm.model,description:comm.custom?state.pclink2.description:comm.description};
    lines.push(reportCurrentLine('PC-LINK 2 (Communicator)',reportItemLabel(commIdentity),communicatorTotal('standby'),1));
  }
  var corbusTotal=PANEL_BOARD_MA+sourceCorbusTotal('panel','alarm'),auxTotal=panelAuxTotal('alarm'),pgmTotal=allPanelPgmsTotal('alarm'),commNormal=communicatorTotal('standby'),panelLoad=panelMaximumTotal(),commIncrease=communicatorExtraTotal(),whileTransmit=panelTransmitTotal();
  return {sheetName:'Main Panel',title:'PowerSeries NEO Main Panel Current Report',subtitle:'Panel model: '+state.panelModel,lines:lines,currentTotal:panelLoad,summaryRows:[
    reportSummaryRow('corbus','Total CORBUS',corbusTotal,'section',{section:'CORBUS'}),
    reportSummaryRow('aux','Total AUX',auxTotal,'section',{section:'AUX'}),
    reportSummaryRow('pgms','Total PGMs',pgmTotal,'section',{section:'PGMs'}),
    reportSummaryRow('communicator','Total PC-LINK 2 (Communicator)',commNormal,'section',{section:'PC-LINK 2 (Communicator)'}),
    reportSummaryRow('panel-load','Total panel load',panelLoad,'data-total',{limit:PANEL_LIMIT_MA}),
    reportSummaryRow('communicator-increase','Communicator transmit increase',commIncrease,'increase',{displayValue:formatSignedMa(commIncrease)}),
    reportSummaryRow('while-transmitting','Total while transmitting',whileTransmit,'transmit-total',{limit:PANEL_TRANSMIT_LIMIT_MA})
  ]};
}
function localSupplyReportTable(module){
  var lines=[],c=deviceCatalog(module),label=c.model+' #'+powerModuleOrdinal(module);
  appendCurrentDeviceLines(lines,module.id,'CORBUS');
  appendCurrentLoadLines(lines,state.localAux[module.id]||[],'AUX','');
  if(c.id==='hsm2204') ['O1','O2','O3','O4'].forEach(function(output,index){appendCurrentLoadLines(lines,((state.localPgms[module.id]||{})[output])||[],'Outputs','Output'+(index+1));});
  var corbusTotal=sourceCorbusTotal(module.id,'alarm'),auxTotal=localAuxTotal(module.id,'alarm'),pgmTotal=localAllPgmTotal(module.id,'alarm'),total=localSupplyTotal(module.id,'alarm'),summary=[
    reportSummaryRow('corbus','Total CORBUS',corbusTotal,'section',{section:'CORBUS'}),
    reportSummaryRow('aux','Total AUX',auxTotal,'section',{section:'AUX'})
  ];
  if(c.id==='hsm2204') summary.push(reportSummaryRow('outputs','Total Outputs',pgmTotal,'section',{section:'Outputs'}));
  summary.push(reportSummaryRow('current-load','Total current load',total,'data-total',{limit:LOCAL_SUPPLY_LIMIT_MA}));
  return {sheetName:label,title:label+' Current Report',subtitle:'Independent 1,000 mA local power supply',lines:lines,currentTotal:total,summaryRows:summary};
}
function currentReportTables(){return [mainPanelReportTable()].concat(powerModules().map(localSupplyReportTable));}
function reportTsvCell(value){var text=String(value==null?'':value);return /[\t\n\r\"]/g.test(text)?'\"'+text.replace(/\"/g,'\"\"')+'\"':text;}
function reportRowsForText(table){
  var rows=[[table.title],[table.subtitle],[],['Section','Item','Current (mA)','×','Quantity','=','Total Current (mA)']],layout=reportSectionLayout(table);
  layout.order.forEach(function(section){
    (layout.groups[section]||[]).forEach(function(line){rows.push([line.section,line.item,line.currentEach,'×',line.quantity,'=',line.total]);});
    var subtotal=layout.sectionSummaries[section];
    if(subtotal) rows.push([reportSummaryLabel(subtotal),'','','','','=',reportSummaryDisplay(subtotal)]);
  });
  layout.trailingSummaries.forEach(function(row){rows.push([reportSummaryLabel(row),'','','','','=',reportSummaryDisplay(row)]);});
  return rows;
}
function currentReportTsv(){var out=[];currentReportTables().forEach(function(table,index){if(index) out.push([]);reportRowsForText(table).forEach(function(row){out.push(row);});});return out.map(function(row){return row.map(reportTsvCell).join('\t');}).join('\n');}
function reportHtmlCell(value,tag,attrs){return '<'+(tag||'td')+(attrs||'')+'>'+esc(value==null?'':value)+'</'+(tag||'td')+'>';}
function reportTableHtml(table){
  var layout=reportSectionLayout(table);
  var border='border:1px solid #4b5563;',baseText='font-family:Calibri,Arial,sans-serif;font-size:9pt;line-height:1.2;word-break:normal;overflow-wrap:normal;hyphens:none;',cell='padding:4px 6px;'+border+'vertical-align:middle;'+baseText,numeric=cell+'text-align:right;padding-right:9px;white-space:nowrap;',operatorCell=cell+'text-align:center;white-space:nowrap;',header=cell+'font-size:8.5pt;font-weight:700;text-align:center;background:#eef2f7;white-space:normal;',html='<table style="border-collapse:collapse;table-layout:fixed;width:640px;max-width:640px;margin:0 0 16px 0;'+baseText+'">';
  html+='<colgroup><col style="width:105px"><col style="width:245px"><col style="width:85px"><col style="width:22px"><col style="width:60px"><col style="width:22px"><col style="width:101px"></colgroup>';
  html+='<tr><th colspan="7" style="'+cell+'font-size:12pt;text-align:left;background:#dbeafe;">'+esc(table.title)+'</th></tr><tr><td colspan="7" style="'+cell+'font-size:9pt;font-weight:700;">'+esc(table.subtitle)+'</td></tr>';
  html+='<tr>'+['Section','Item','Current<br>(mA)','×','Quantity','=','Total Current<br>(mA)'].map(function(value){return '<th style="'+header+'">'+value+'</th>';}).join('')+'</tr>';
  layout.order.forEach(function(section){
    var lines=layout.groups[section]||[];
    lines.forEach(function(line,groupIndex){html+='<tr>';if(groupIndex===0) html+='<td rowspan="'+lines.length+'" style="'+cell+'font-weight:700;vertical-align:top;background:#f8fafc;">'+esc(section)+'</td>';html+=reportHtmlCell(line.item,'td',' style="'+cell+'"')+reportHtmlCell(line.currentEach,'td',' style="'+numeric+'"')+reportHtmlCell('×','td',' style="'+operatorCell+'"')+reportHtmlCell(line.quantity,'td',' style="'+numeric+'"')+reportHtmlCell('=','td',' style="'+operatorCell+'"')+reportHtmlCell(round(line.total),'td',' style="'+numeric+'"')+'</tr>';});
    var subtotal=layout.sectionSummaries[section];
    if(subtotal) html+='<tr><td colspan="6" style="'+cell+'font-weight:700;text-align:right;padding-right:12px;background:#f8fafc;">'+esc(reportSummaryLabel(subtotal))+'</td><td style="'+numeric+'font-weight:700;background:#f8fafc;">'+esc(reportSummaryDisplay(subtotal))+'</td></tr>';
  });
  layout.trailingSummaries.forEach(function(row){var emphasis=row.id==='panel-load'||row.id==='while-transmitting'||row.id==='current-load',top=emphasis?'border-top:2px solid #111827;':'',bg=emphasis?'background:#f8fafc;':'';html+='<tr><td colspan="6" style="'+cell+'font-weight:700;text-align:right;padding-right:12px;'+top+bg+'">'+esc(reportSummaryLabel(row))+'</td><td style="'+numeric+'font-weight:700;'+top+bg+'">'+esc(reportSummaryDisplay(row))+'</td></tr>';});
  return html+'</table>';
}
function currentReportClipboardHtml(){return '<div style="font-family:Calibri,Arial,sans-serif;font-size:9pt;">'+currentReportTables().map(reportTableHtml).join('<br>')+'</div>';}
function copyTextToClipboard(text){
  if(window.navigator&&window.navigator.clipboard&&window.navigator.clipboard.writeText) return window.navigator.clipboard.writeText(text).then(function(){return true;}).catch(function(){return false;});
  try{var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=!!document.execCommand&&document.execCommand('copy');ta.remove();return Promise.resolve(ok);}catch(error){return Promise.resolve(false);}
}
function copyRichHtmlFallback(html,text){
  try{
    if(!document.createRange||!window.getSelection) return copyTextToClipboard(text);
    var div=document.createElement('div');div.contentEditable='true';div.style.position='fixed';div.style.left='-10000px';div.style.top='0';div.innerHTML=html;document.body.appendChild(div);
    var range=document.createRange();range.selectNodeContents(div);var selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);var ok=!!document.execCommand&&document.execCommand('copy');selection.removeAllRanges();div.remove();return Promise.resolve(ok);
  }catch(error){return copyTextToClipboard(text);}
}
function copyCurrentReport(){
  var html=currentReportClipboardHtml(),text=currentReportTsv(),clipboard=window.navigator&&window.navigator.clipboard,ClipboardItemCtor=window.ClipboardItem||(typeof ClipboardItem!=='undefined'?ClipboardItem:null);
  if(clipboard&&clipboard.write&&ClipboardItemCtor){
    try{var item=new ClipboardItemCtor({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})});return clipboard.write([item]).then(function(){return true;}).catch(function(){return copyRichHtmlFallback(html,text);});}catch(error){}
  }
  if(clipboard&&clipboard.writeText) return clipboard.writeText(text).then(function(){return true;}).catch(function(){return copyRichHtmlFallback(html,text);});
  return copyRichHtmlFallback(html,text);
}
function xmlEscape(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&apos;');}
function excelColumn(index){var out='';for(var n=index+1;n>0;n=Math.floor((n-1)/26)) out=String.fromCharCode(65+((n-1)%26))+out;return out;}
function xlsxCell(rowIndex,colIndex,value,style){
  if(value===null||value===undefined||value==='') return '';
  var ref=excelColumn(colIndex)+(rowIndex+1),s=style?' s="'+style+'"':'';
  if(typeof value==='number'&&isFinite(value)) return '<c r="'+ref+'"'+s+'><v>'+String(Math.round(value*1000)/1000)+'</v></c>';
  return '<c r="'+ref+'"'+s+' t="inlineStr"><is><t xml:space="preserve">'+xmlEscape(value)+'</t></is></c>';
}
function xlsxFormulaCell(rowIndex,colIndex,formula,cachedValue,style){var ref=excelColumn(colIndex)+(rowIndex+1),s=style?' s="'+style+'"':'';return '<c r="'+ref+'"'+s+'><f>'+xmlEscape(formula)+'</f><v>'+String(Math.round(number(cachedValue,0)*1000)/1000)+'</v></c>';}
function safeSheetName(name,index,used){
  var base=String(name||('Report '+(index+1))).replace(/[\\\/\?\*\[\]:]/g,' ').replace(/\s+/g,' ').trim().slice(0,31)||('Report '+(index+1)),candidate=base,n=2;
  while(used[candidate.toLowerCase()]){var suffix=' '+n++;candidate=base.slice(0,Math.max(1,31-suffix.length))+suffix;}used[candidate.toLowerCase()]=true;return candidate;
}
function currentReportSheetXml(table,tabSelected){
  var rows=[],merges=[],r=0,summaryRefs={},sectionRefRows=[],layout=reportSectionLayout(table);
  function push(values,styles,height){var cells=values.map(function(value,col){return xlsxCell(r,col,value,styles&&styles[col]||0);}).join('');rows.push('<row r="'+(r+1)+'"'+(height?' ht="'+height+'" customHeight="1"':'')+'>'+cells+'</row>');r++;}
  function pushSummary(summary,sectionStart,sectionEnd){
    var rowNumber=r+1,style=summary.limit!=null?(summary.value>summary.limit?9:10):8,label=reportSummaryLabel(summary),valueCell='';
    if(summary.kind==='section'){
      valueCell=xlsxFormulaCell(r,6,sectionStart&&sectionEnd?'SUM(G'+sectionStart+':G'+sectionEnd+')':'0',summary.value,style);
      sectionRefRows.push(rowNumber);
    }else if(summary.kind==='data-total'){
      var sectionFormula=sectionRefRows.length?'SUM('+sectionRefRows.map(function(ref){return 'G'+ref;}).join(',')+')':'0';
      valueCell=xlsxFormulaCell(r,6,sectionFormula,summary.value,style);
    }else if(summary.kind==='transmit-total'){
      var panelRef=summaryRefs['panel-load'],increaseRef=summaryRefs['communicator-increase'];
      valueCell=xlsxFormulaCell(r,6,(panelRef&&increaseRef)?'G'+panelRef+'+G'+increaseRef:String(summary.value),summary.value,style);
    }else if(summary.kind==='increase') valueCell=xlsxCell(r,6,summary.value,11);
    else valueCell=xlsxCell(r,6,summary.value,style);
    rows.push('<row r="'+rowNumber+'">'+xlsxCell(r,0,label,style)+valueCell+'</row>');merges.push('A'+rowNumber+':F'+rowNumber);summaryRefs[summary.id]=rowNumber;r++;
  }
  push([table.title],[1],24);merges.push('A1:G1');
  push([table.subtitle],[7],18);merges.push('A2:G2');
  push(['Generated',new Date().toISOString()],[7,7],16);
  push([]);
  push(['Section','Item','Current\n(mA)','×','Quantity','=','Total Current\n(mA)'],[2,2,2,2,2,2,2],28);
  layout.order.forEach(function(section){
    var lines=layout.groups[section]||[],groupStart=0,groupEnd=0;
    lines.forEach(function(line,index){
      var rowNumber=r+1,cells=[];if(index===0) groupStart=rowNumber;groupEnd=rowNumber;
      cells.push(index===0?xlsxCell(r,0,line.section,3):'');cells.push(xlsxCell(r,1,line.item,5));cells.push(xlsxCell(r,2,line.currentEach,4));cells.push(xlsxCell(r,3,'×',6));cells.push(xlsxCell(r,4,line.quantity,4));cells.push(xlsxCell(r,5,'=',6));cells.push(xlsxFormulaCell(r,6,'C'+rowNumber+'*E'+rowNumber,line.total,4));rows.push('<row r="'+rowNumber+'">'+cells.join('')+'</row>');r++;
    });
    if(groupStart&&groupEnd>groupStart) merges.push('A'+groupStart+':A'+groupEnd);
    var subtotal=layout.sectionSummaries[section];if(subtotal) pushSummary(subtotal,groupStart,groupEnd);
  });
  layout.trailingSummaries.forEach(function(summary){pushSummary(summary,0,0);});
  var lastRow=Math.max(1,r),view='<sheetView workbookViewId="0"'+(tabSelected?' tabSelected="1"':'')+'><pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/></sheetView>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:G'+lastRow+'"/><sheetViews>'+view+'</sheetViews><sheetFormatPr defaultRowHeight="15"/>'+
    '<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="36" customWidth="1"/><col min="3" max="3" width="14" customWidth="1"/><col min="4" max="4" width="3" customWidth="1"/><col min="5" max="5" width="10" customWidth="1"/><col min="6" max="6" width="3" customWidth="1"/><col min="7" max="7" width="17" customWidth="1"/></cols><sheetData>'+rows.join('')+'</sheetData>'+
    (merges.length?'<mergeCells count="'+merges.length+'">'+merges.map(function(ref){return '<mergeCell ref="'+ref+'"/>';}).join('')+'</mergeCells>':'')+
    '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="portrait" fitToWidth="1" fitToHeight="0" paperSize="9"/></worksheet>';
}
function xlsxStylesXml(){return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="+0 &quot;mA&quot;;-0 &quot;mA&quot;;0 &quot;mA&quot;"/></numFmts><fonts count="4"><font><sz val="9"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="14"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="9"/><name val="Calibri"/><family val="2"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="9"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F6FAE"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE0F2FE"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="4"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF4B5563"/></left><right style="thin"><color rgb="FF4B5563"/></right><top style="thin"><color rgb="FF4B5563"/></top><bottom style="thin"><color rgb="FF4B5563"/></bottom><diagonal/></border><border><left style="thin"><color rgb="FF111827"/></left><right style="thin"><color rgb="FF111827"/></right><top style="medium"><color rgb="FF111827"/></top><bottom style="thin"><color rgb="FF111827"/></bottom><diagonal/></border><border><left style="thin"><color rgb="FFEF4444"/></left><right style="thin"><color rgb="FFEF4444"/></right><top style="thin"><color rgb="FFEF4444"/></top><bottom style="thin"><color rgb="FFEF4444"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="12"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';}
function utf8Bytes(text){var encoded=encodeURIComponent(String(text)),out=[];for(var i=0;i<encoded.length;i++){if(encoded.charAt(i)==='%'){out.push(parseInt(encoded.slice(i+1,i+3),16));i+=2;}else out.push(encoded.charCodeAt(i));}return new Uint8Array(out);}
var reportCrcTable=null;
function crc32(bytes){if(!reportCrcTable){reportCrcTable=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);reportCrcTable[n]=c>>>0;}}var crc=0xFFFFFFFF;for(var i=0;i<bytes.length;i++) crc=reportCrcTable[(crc^bytes[i])&255]^(crc>>>8);return (crc^0xFFFFFFFF)>>>0;}
function le16(value){return new Uint8Array([value&255,(value>>>8)&255]);}
function le32(value){return new Uint8Array([value&255,(value>>>8)&255,(value>>>16)&255,(value>>>24)&255]);}
function concatByteParts(parts){var length=parts.reduce(function(sum,part){return sum+part.length;},0),out=new Uint8Array(length),offset=0;parts.forEach(function(part){out.set(part,offset);offset+=part.length;});return out;}
function zipDosDateTime(date){var year=Math.max(1980,date.getFullYear());return {time:(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1),date:((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate()};}
function makeStoredZip(files){
  var locals=[],centrals=[],offset=0,stamp=zipDosDateTime(new Date());
  files.forEach(function(file){var name=utf8Bytes(file.name),data=file.bytes||utf8Bytes(file.text),crc=crc32(data);var local=concatByteParts([le32(0x04034b50),le16(20),le16(0x0800),le16(0),le16(stamp.time),le16(stamp.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),name,data]);locals.push(local);var central=concatByteParts([le32(0x02014b50),le16(20),le16(20),le16(0x0800),le16(0),le16(stamp.time),le16(stamp.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(offset),name]);centrals.push(central);offset+=local.length;});
  var centralBlock=concatByteParts(centrals),end=concatByteParts([le32(0x06054b50),le16(0),le16(0),le16(files.length),le16(files.length),le32(centralBlock.length),le32(offset),le16(0)]);return concatByteParts(locals.concat([centralBlock,end]));
}
function currentReportXlsxBlob(){
  var tables=currentReportTables(),usedNames={},sheetNames=tables.map(function(table,index){return safeSheetName(table.sheetName,index,usedNames);}),files=[],sheetOverrides='',sheetRels='',sheetEntries='';
  tables.forEach(function(table,index){var numberValue=index+1;sheetOverrides+='<Override PartName="/xl/worksheets/sheet'+numberValue+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';sheetRels+='<Relationship Id="rId'+numberValue+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+numberValue+'.xml"/>';sheetEntries+='<sheet name="'+xmlEscape(sheetNames[index])+'" sheetId="'+numberValue+'" r:id="rId'+numberValue+'"/>';files.push({name:'xl/worksheets/sheet'+numberValue+'.xml',text:currentReportSheetXml(table,index===0)});});
  var stylesRid=tables.length+1;
  files.unshift(
    {name:'[Content_Types].xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'+sheetOverrides+'</Types>'},
    {name:'_rels/.rels',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'},
    {name:'docProps/core.xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>DSC PowerSeries NEO Panel Current Calculator Report</dc:title><dc:creator>DSC Panel Workspace</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">'+xmlEscape(new Date().toISOString())+'</dcterms:created></cp:coreProperties>'},
    {name:'docProps/app.xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>DSC Panel Workspace</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>'+tables.length+'</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="'+tables.length+'" baseType="lpstr">'+sheetNames.map(function(name){return '<vt:lpstr>'+xmlEscape(name)+'</vt:lpstr>';}).join('')+'</vt:vector></TitlesOfParts><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0300</AppVersion></Properties>'},
    {name:'xl/workbook.xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><fileVersion appName="xl" lastEdited="7" lowestEdited="7" rupBuild="23426"/><workbookPr defaultThemeVersion="166925"/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews><sheets>'+sheetEntries+'</sheets><calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>'},
    {name:'xl/_rels/workbook.xml.rels',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheetRels+'<Relationship Id="rId'+stylesRid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {name:'xl/styles.xml',text:xlsxStylesXml()}
  );
  return new Blob([makeStoredZip(files)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function downloadCurrentReport(){
  var blob=currentReportXlsxBlob(),url=URL.createObjectURL(blob),a=document.createElement('a');var date=new Date().toISOString().slice(0,10);a.href=url;a.download='dsc-neo-panel-current-report-'+String(state.panelModel).replace(/[^A-Za-z0-9]+/g,'-')+'-'+date+'.xlsx';document.body.appendChild(a);a.click();a.remove();window.setTimeout(function(){URL.revokeObjectURL(url);},500);notify('Current report exported to Excel.','success');
}

function toolbarHtml(){return '<div class="pcc2-toolbar"><button type="button" class="secondary compact-action-button compact-icon-action" data-action="expand-all" aria-label="Expand all calculator sections" title="Expand all"><span aria-hidden="true">＋</span></button><button type="button" class="secondary compact-action-button compact-icon-action" data-action="collapse-all" aria-label="Collapse all calculator sections" title="Collapse all"><span aria-hidden="true">−</span></button><button type="button" class="secondary" data-action="copy-report">Copy Report</button><button type="button" class="secondary" data-action="export-report">Export Report</button><button type="button" class="secondary danger-quiet" data-action="reset">Reset</button></div>';}
function panelModelHeaderHtml(){
  return '<label class="pcc2-header-panel-model"><span>Panel model</span><select data-panel-model>'+PANEL_MODELS.map(function(model){return '<option '+(model===state.panelModel?'selected':'')+'>'+esc(model)+'</option>';}).join('')+'</select></label>';
}
function calculatorNavGroupForSection(sectionKey){
  sectionKey=String(sectionKey||'');
  if(['panel-overview','corbus-panel','aux-panel','pgms','pclink'].indexOf(sectionKey)>=0) return 'panel';
  var modules=powerModules();
  for(var i=0;i<modules.length;i++){
    var module=modules[i],idValue=module.id;
    if(sectionKey===powerSectionKey(module)||sectionKey==='corbus-'+idValue||sectionKey==='aux-'+idValue||sectionKey==='local-pgms-'+idValue||sectionKey.indexOf('local-pgm-'+idValue+'-')===0) return idValue;
  }
  return 'panel';
}
function calculatorNavGroups(){
  var groups=[{key:'panel',title:'Panel',target:'panel-overview',children:[
    {key:'corbus-panel',title:'CORBUS'},
    {key:'aux-panel',title:'AUX'},
    {key:'pgms',title:'PGMs'},
    {key:'pclink',title:'PC-LINK 2 (Communicator)'}
  ]}];
  powerModules().forEach(function(module){
    var c=deviceCatalog(module),ordinal=powerModuleOrdinal(module),children=[
      {key:'corbus-'+module.id,title:'CORBUS'},
      {key:'aux-'+module.id,title:'AUX'}
    ];
    if(c.id==='hsm2204') children.push({key:'local-pgms-'+module.id,title:'Outputs'});
    groups.push({key:module.id,title:c.model+' #'+ordinal,target:powerSectionKey(module),children:children});
  });
  return groups;
}
function calculatorDrawerVisibilityKey(group){
  return group&&group.key==='panel'?'panel-shell':('local-shell-'+String(group&&group.key||''));
}
function calculatorNavParentOpen(groupKey){
  groupKey=String(groupKey||'panel');
  if(!state.navOpenParents||typeof state.navOpenParents!=='object') state.navOpenParents={panel:true};
  if(Object.prototype.hasOwnProperty.call(state.navOpenParents,groupKey)) return state.navOpenParents[groupKey]===true;
  return groupKey==='panel';
}
function setCalculatorNavParentOpen(groupKey,value){
  groupKey=String(groupKey||'panel');
  if(!state.navOpenParents||typeof state.navOpenParents!=='object') state.navOpenParents={};
  state.navOpenParents[groupKey]=value===true;
}
function toggleCalculatorNavParent(groupKey){
  groupKey=String(groupKey||'panel');
  var willOpen=!calculatorNavParentOpen(groupKey);
  if(willOpen&&state.navKeepParentsOpen!==true){
    calculatorNavGroups().forEach(function(group){setCalculatorNavParentOpen(group.key,false);});
  }
  setCalculatorNavParentOpen(groupKey,willOpen);
  return willOpen;
}
function collapseNavigationParentsTo(groupKey){
  groupKey=String(groupKey||'panel');
  calculatorNavGroups().forEach(function(group){setCalculatorNavParentOpen(group.key,group.key===groupKey);});
}
function calculatorDrawerItemHtml(tool){
  var visible=calculatorToolVisible(tool.key),current=state.activeToolSection===tool.key;
  return '<div class="pcc2-tools-navigation-item pcc2-tools-drawer-child '+(visible?'active ':'')+(current?'current':'')+'">'+
    '<button type="button" class="pcc2-tools-navigation-button '+(current?'active':'')+'" data-pcc-tool="'+esc(tool.key)+'" title="Go to '+esc(tool.title)+'"><strong>'+esc(tool.title)+'</strong></button>'+
    '<button type="button" class="pcc2-tools-toggle-indicator '+(visible?'active':'')+'" data-pcc-tool-toggle="'+esc(tool.key)+'" aria-label="'+(visible?'Hide ':'Show ')+esc(tool.title)+'" title="'+(visible?'Hide ':'Show ')+esc(tool.title)+'">'+(visible?'−':'＋')+'</button>'+
  '</div>';
}
function calculatorSettingsButtonHtml(){
  return '<div class="pcc2-nav-settings-wrap pcc2-header-settings-wrap" data-pcc-nav-settings><button type="button" class="secondary compact-action-button compact-icon-action pcc2-nav-settings-button panel-current-tool-header-settings '+(navSettingsOpen?'active':'')+'" data-action="toggle-nav-settings" aria-expanded="'+(navSettingsOpen?'true':'false')+'" aria-label="Settings" title="Settings"><span aria-hidden="true">⚙</span></button></div>';
}
function calculatorSettingsPanelHtml(){
  if(!navSettingsOpen) return '';
  var wrap=state.navWrap!==false,keepOpen=state.navKeepParentsOpen===true,showTotals=state.showAccountingTotals!==false,showCategories=state.showCorbusCategoryRows!==false,showTerminals=state.showTerminals!==false;
  return '<section class="pcc2-settings-surface card" data-pcc-nav-settings data-pcc-settings-panel-host aria-label="Settings"><div class="pcc2-nav-settings-popover pcc2-nav-settings-panel" role="group" aria-label="Settings"><button type="button" class="pcc2-nav-setting-row" data-action="toggle-accounting-totals" role="switch" aria-checked="'+(showTotals?'true':'false')+'"><span><strong>Total rows</strong><small>Show accounting-style subtotal and combined-total rows.</small></span><b class="pcc2-nav-setting-state '+(showTotals?'on':'')+'">'+(showTotals?'On':'Off')+'</b></button><button type="button" class="pcc2-nav-setting-row" data-action="toggle-corbus-category-rows" role="switch" aria-checked="'+(showCategories?'true':'false')+'"><span><strong>CORBUS category rows</strong><small>Show Keypads, Expanders, Hosts and other category headers.</small></span><b class="pcc2-nav-setting-state '+(showCategories?'on':'')+'">'+(showCategories?'On':'Off')+'</b></button><button type="button" class="pcc2-nav-setting-row" data-action="toggle-terminals" role="switch" aria-checked="'+(showTerminals?'true':'false')+'"><span><strong>Terminals</strong><small>Show connection-terminal labels on panel circuits and expandable CORBUS devices.</small></span><b class="pcc2-nav-setting-state '+(showTerminals?'on':'')+'">'+(showTerminals?'On':'Off')+'</b></button><button type="button" class="pcc2-nav-setting-row pcc2-nav-setting-link" data-action="open-device-library"><span><strong>Device library</strong><small>Add, edit, save, import or export selectable devices.</small></span><b class="pcc2-nav-setting-state">Open ›</b></button><button type="button" class="pcc2-nav-setting-row" data-action="toggle-nav-wrap" role="switch" aria-checked="'+(wrap?'true':'false')+'"><span><strong>Multiple rows</strong><small>Wrap complete Panel/HSM groups when needed.</small></span><b class="pcc2-nav-setting-state '+(wrap?'on':'')+'">'+(wrap?'On':'Off')+'</b></button><button type="button" class="pcc2-nav-setting-row" data-action="toggle-nav-keep-parents" role="switch" aria-checked="'+(keepOpen?'true':'false')+'"><span><strong>Keep parent menus open</strong><small>Allow more than one parent navigation drawer to stay expanded.</small></span><b class="pcc2-nav-setting-state '+(keepOpen?'on':'')+'">'+(keepOpen?'On':'Off')+'</b></button></div></section>';
}
function positionCalculatorSettingsSurface(){
  if(!navSettingsOpen||!host||!window.dscPositionFloatingSettings) return;
  var panel=host.querySelector('[data-pcc-settings-panel-host]');
  var trigger=document.querySelector('#panelCurrentCalculatorHeaderControls [data-action="toggle-nav-settings"]');
  if(panel&&trigger) window.dscPositionFloatingSettings(trigger,panel,{width:460,maxHeight:560});
}
function syncCalculatorSettingsSurface(){
  renderHeader();
  if(!host) return;
  var existing=host.querySelector('[data-pcc-settings-panel-host]');
  if(existing) existing.remove();
  if(navSettingsOpen){
    host.insertAdjacentHTML('afterbegin',calculatorSettingsPanelHtml());
    if(window.requestAnimationFrame) window.requestAnimationFrame(positionCalculatorSettingsSurface); else positionCalculatorSettingsSurface();
  }
}
function topHtml(){
  var groups=calculatorNavGroups();
  var drawers=groups.map(function(group){
    var visibilityKey=calculatorDrawerVisibilityKey(group),sectionVisible=calculatorToolVisible(visibilityKey),open=calculatorNavParentOpen(group.key),current=calculatorNavGroupForSection(state.activeToolSection)===group.key;
    var parent='<div class="pcc2-tools-navigation-item pcc2-tools-drawer-parent '+(sectionVisible?'active ':'')+(open?'nav-open ':'')+(current?'current':'')+'">'+
      '<button type="button" class="pcc2-tools-navigation-button '+(current?'active':'')+'" data-pcc-drawer-target="'+esc(group.target)+'" data-pcc-drawer-key="'+esc(visibilityKey)+'" data-pcc-drawer-nav="'+esc(group.key)+'" aria-expanded="'+(open?'true':'false')+'" title="'+(open?'Hide ':'Show ')+esc(group.title)+' navigation options"><strong>'+esc(group.title)+'</strong></button>'+
      '<button type="button" class="pcc2-tools-toggle-indicator '+(sectionVisible?'active':'')+'" data-pcc-drawer-toggle="'+esc(visibilityKey)+'" data-pcc-drawer-target="'+esc(group.target)+'" aria-label="'+(sectionVisible?'Hide ':'Show ')+esc(group.title)+' calculator section" title="'+(sectionVisible?'Hide ':'Show ')+esc(group.title)+' calculator section">'+(sectionVisible?'−':'＋')+'</button>'+
    '</div>';
    var children=open?group.children.map(calculatorDrawerItemHtml).join(''):'';
    return '<div class="pcc2-tools-drawer '+(open?'is-open':'is-closed')+' '+(sectionVisible?'section-visible':'section-hidden')+'" data-pcc-drawer="'+esc(group.key)+'">'+parent+children+'</div>';
  }).join('');
  var wrap=state.navWrap!==false,keepOpen=state.navKeepParentsOpen===true,showTotals=state.showAccountingTotals!==false,showCategories=state.showCorbusCategoryRows!==false,showTerminals=state.showTerminals!==false;
  return '<section class="pcc2-sticky-tools card" aria-label="Panel Current Calculator navigation"><div class="pcc2-tools-navigation-shell"><nav class="pcc2-tools-navigation pcc2-tools-drawers '+(wrap?'is-wrapped':'is-single-row')+'" aria-label="Panel Current Calculator sections">'+drawers+'</nav></div></section>';
}

function systemMonitor(label,value,detail,cls){
  return '<div class="pcc2-system-monitor '+cls+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(detail)+'</small></div>';
}
function issueTargetAttrs(target){
  if(!target) return '';
  var attrs='';
  if(target.deviceId) attrs+=' data-issue-device="'+esc(target.deviceId)+'"';
  if(target.instance) attrs+=' data-issue-instance="'+esc(target.instance)+'"';
  if(target.sectionKey) attrs+=' data-issue-section="'+esc(target.sectionKey)+'"';
  return attrs;
}
function validationListHtml(messages){
  return '<div class="pcc2-validation-list">'+messages.map(function(m){
    var symbol=m.level==='ok'?'✓':'!';
    if(m.level==='over'&&m.target) return '<button type="button" class="pcc2-validation-item pcc2-validation-jump '+m.level+'" data-action="reveal-issue-target"'+issueTargetAttrs(m.target)+' title="Go to this issue"><span>'+symbol+'</span><p>'+esc(m.text)+'</p><b aria-hidden="true">›</b></button>';
    return '<div class="pcc2-validation-item '+m.level+'"><span>'+symbol+'</span><p>'+esc(m.text)+'</p></div>';
  }).join('')+'</div>';
}
function panelCalculator(){
  var current=panelMaximumTotal();
  var transmit=panelTransmitTotal();
  var issueKey='system-panel-shell',shellKey='panel-shell';
  var title=state.panelModel+' panel';var messages=panelValidationMessages();var issues=overMessages(messages);
  var monitors='<div class="pcc2-system-monitors">'+systemMonitor('Current Load',formatMa(current),statusText(current,PANEL_LIMIT_MA),level(current,PANEL_LIMIT_MA))+systemMonitor('While transmitting',formatMa(transmit),statusText(transmit,PANEL_TRANSMIT_LIMIT_MA),level(transmit,PANEL_TRANSMIT_LIMIT_MA))+'</div>';
  var bannerAlert='<div class="pcc2-system-alert-slot">'+inlineIssueButton(issueKey,messages,'jump',issues.length?firstPanelIssueTarget():null)+'</div>';
  var head='<div class="pcc2-system-banner pcc2-panel-system-banner"><div class="pcc2-section-heading-main">'+collapseButton(shellKey,'Main panel')+'<div><p class="eyebrow">Main panel power section</p><h2>'+esc(title)+'</h2></div></div><div class="pcc2-system-banner-side">'+bannerAlert+monitors+'</div></div>';
  var overview='<section class="pcc2-panel-overview" id="pcc-panel-overview" data-pcc-section="panel-overview">'+head+'</section>';
  var body=sectionInfoPanel(issueKey,messages);
  if(calculatorToolVisible('corbus-panel')) body+=corbusSection('panel',false);
  if(calculatorToolVisible('aux-panel')) body+=auxSection('panel',false);
  if(calculatorToolVisible('pgms')) body+=pgmsSection();
  if(calculatorToolVisible('pclink')) body+=pclinkSection();
  if(!overview&&!body) return '';
  return '<section class="pcc2-system-shell pcc2-panel-system-shell '+(sectionCollapsed(shellKey)?'is-collapsed ':'')+issueClass(issues)+'" id="pcc-panel-shell">'+overview+'<div class="pcc2-system-shell-body">'+body+'</div></section>';
}


function tableHeader(extra,omitActions){return '<thead><tr><th>Model</th><th>Description</th><th><span>Current</span><small>(mA)</small></th><th>Quantity</th><th><span>Total</span><small>(mA)</small></th>'+(omitActions?'':(extra||'<th class="pcc2-actions-col">Actions</th>'))+'</tr></thead>';}
function customInput(value,attr,type){return '<input '+(type==='number'?'type="number" min="0" max="10000" step="1" inputmode="numeric"':'type="text"')+' value="'+esc(value)+'" '+attr+'>';}
function deviceCanHaveChildren(c){return !!(c.hasKeypadPgm||c.hasAux||c.hasOutputs||c.hasAudioStations);}
function attachedQuantity(device){return device.children.reduce(function(sum,load){return sum+Math.max(1,number(load.quantity,1));},0);}
function attachedCounterButton(){return '';}
function deviceActionButtons(device,c){
  var html='';
  if(c.hasKeypadPgm) html+='<button type="button" class="mini" data-action="add-child" data-kind="keypad-pgm" data-device="'+esc(device.id)+'">+ Keypad PGM load</button>';
  if(c.extraPower) html+='<button type="button" class="mini '+(device.extraPower?'active':'')+'" data-action="toggle-extra" data-device="'+esc(device.id)+'">Extra Power '+(device.extraPower?'ON':'OFF')+'</button>';
  if(c.hasAux) html+='<button type="button" class="mini" data-action="add-child" data-kind="device-aux" data-device="'+esc(device.id)+'">+ '+'AUX load</button>';
  if(c.hasOutputs) html+='<button type="button" class="mini" data-action="add-child" data-kind="device-output" data-device="'+esc(device.id)+'">+ Output load</button>';
  if(c.hasAudioStations){html+='<button type="button" class="mini" data-action="add-audio" data-size="small" data-device="'+esc(device.id)+'">+ Small station</button><button type="button" class="mini" data-action="add-audio" data-size="large" data-device="'+esc(device.id)+'">+ Large station</button>';}
  if(c.powerModule) html+='<button type="button" class="mini" data-action="scroll-local" data-device="'+esc(device.id)+'">Open local calculator</button>';
  html+=attachedCounterButton(device,c);
  return html?'<div class="pcc2-row-tools">'+html+'</div>':'';
}
function deviceCurrentCell(device,c){
  var key=currentKey();var value=c.id==='hs2tchp'&&device.extraPower?c.extraPowerAlarmMa:device[key];
  if(c.custom) return customInput(value,'data-device-field="'+esc(device.id)+'" data-field="'+key+'"','number');
  return '<strong>'+esc(round(value))+'</strong>';
}
function panelBoardRowHtml(){
  return '<tr class="pcc2-device-row pcc2-fixed-row"><td><strong>'+esc(state.panelModel)+' main board</strong></td><td><div class="pcc2-description">Control-panel board current.</div></td><td class="pcc2-current"><strong>'+esc(round(PANEL_BOARD_MA))+'</strong></td><td><strong>1</strong></td><td class="pcc2-total"><strong>'+esc(formatCurrent(PANEL_BOARD_MA))+'</strong></td><td><span class="pcc2-fixed-badge">Fixed</span></td></tr>';
}
function deviceGroupKey(device){return 'device-group-'+device.id;}
function deviceGroupCollapsed(device){var key=deviceGroupKey(device);return state.collapsedSections&&Object.prototype.hasOwnProperty.call(state.collapsedSections,key)?!!state.collapsedSections[key]:true;}
function deviceVariantLabel(device,c){return c.id==='hs2tchp'&&device.extraPower?'HS2TCHP — Extra Power':(c.custom?device.model:c.model);}
function deviceVariantDescription(device,c){return c.id==='hs2tchp'&&device.extraPower?c.description+' Extra Power enabled for every physical instance in this row.':(c.custom?device.description:c.description);}
function childLabel(load){if(load.kind==='keypad-pgm') return 'Keypad PGM load';if(load.kind==='device-aux') return 'Module AUX load';if(load.kind==='device-output') return 'Module '+(load.outputId||'output')+' load';if(load.kind==='audio-station') return 'Audio station';return 'Attached load';}
function instanceOptions(device,selected){var c=deviceCatalog(device);return Array.from({length:device.quantity},function(_,index){var numberValue=index+1;return '<option value="'+numberValue+'" '+(numberValue===selected?'selected':'')+'>'+esc(deviceVariantLabel(device,c))+' #'+numberValue+'</option>';}).join('');}
function keypadTargetValue(device,instance){return device.id+'|'+instance;}
function parseKeypadTarget(value){var parts=String(value||'').split('|');return {deviceId:parts[0]||'',instance:Math.max(1,Math.floor(number(parts[1],1)))};}
function keypadTargetOptions(selectedDevice,selectedInstance,compact){
  var groups={};
  state.corbus.forEach(function(device){
    var c=deviceCatalog(device);if(c.family!=='keypad'||!c.hasKeypadPgm) return;
    var source=device.sourceId==='panel'?'Panel keypads':'Locally powered keypads';
    var list=groups[source]||(groups[source]=[]);
    for(var instance=1;instance<=device.quantity;instance++){
      var used=childTotals(device,'alarm','keypad-pgm','',instance);
      list.push({value:keypadTargetValue(device,instance),selected:device.id===selectedDevice.id&&instance===selectedInstance,label:deviceVariantLabel(device,c)+' #'+instance+(compact?'':' — '+formatMa(used)+' / 50 mA')});
    }
  });
  return Object.keys(groups).map(function(label){return '<optgroup label="'+esc(label)+'">'+groups[label].map(function(item){return '<option value="'+esc(item.value)+'" '+(item.selected?'selected':'')+'>'+esc(item.label)+'</option>';}).join('')+'</optgroup>';}).join('');
}
function childTargetSelectHtml(device,load){
  if(load.kind==='keypad-pgm') return '<select data-child-keypad-target="'+esc(device.id)+'" data-load="'+esc(load.id)+'" aria-label="Move this PGM load to any keypad">'+keypadTargetOptions(device,load.parentInstance,true)+'</select>';
  return '<select data-child-instance="'+esc(device.id)+'" data-load="'+esc(load.id)+'" aria-label="Move connected load to another '+esc(deviceCatalog(device).model)+' instance">'+instanceOptions(device,load.parentInstance)+'</select>';
}
function childRowHtml(device,load,isLast,isLastInstance){
  var c=loadCatalog(load);var total=loadTotal(load,'alarm');var isAudio=load.kind==='audio-station';
  var modelHtml=isAudio?'<strong>'+esc(load.model)+'</strong>':'<select data-child-model="'+esc(device.id)+'" data-load="'+esc(load.id)+'">'+auxOptions(load.catalogId)+'</select>';
  if(load.kind==='device-output') modelHtml='<div class="pcc2-model-stack"><select data-child-output="'+esc(device.id)+'" data-load="'+esc(load.id)+'">'+Array.from({length:8},function(_,i){var o='O'+(i+1);return '<option '+(o===load.outputId?'selected':'')+'>'+o+'</option>';}).join('')+'</select>'+modelHtml+'</div>';
  var custom=c.custom&&!isAudio;
  var target='<div class="pcc2-child-target pcc2-tree-child '+(isLast?'is-last':'')+'"><span class="pcc2-tree-branch" aria-hidden="true"></span><div><span>'+esc(childLabel(load))+'</span>'+childTargetSelectHtml(device,load)+'</div></div>';
  var modelCell='<div class="pcc2-child-model-cell">'+target+'<div class="pcc2-child-device-model">'+modelHtml+(custom?customInput(load.model,'data-child-field="'+esc(device.id)+'" data-load="'+esc(load.id)+'" data-field="model"','text'):'')+'</div></div>';
  return '<tr class="pcc2-child-row pcc2-tree-child-row '+(isLast?'is-last is-last-child ':'')+(isLastInstance?'is-last-instance ':'has-next-instance ')+(isLast&&isLastInstance?'is-tree-last':'')+'" data-parent-device="'+esc(device.id)+'" data-parent-instance="'+esc(load.parentInstance)+'"><td>'+modelCell+'</td><td>'+(custom?customInput(load.description,'data-child-field="'+esc(device.id)+'" data-load="'+esc(load.id)+'" data-field="description"','text'):esc(load.description))+'</td><td class="pcc2-current">'+(custom?customInput(load[currentKey()],'data-child-field="'+esc(device.id)+'" data-load="'+esc(load.id)+'" data-field="'+currentKey()+'"','number'):'<strong>'+esc(round(loadCurrent(load,'alarm')))+'</strong>')+'</td><td><input type="number" min="1" max="999" step="1" value="'+esc(load.quantity)+'" data-child-qty="'+esc(device.id)+'" data-load="'+esc(load.id)+'"></td><td class="pcc2-total"><strong>'+esc(formatCurrent(total))+'</strong></td><td><button type="button" class="mini danger pcc2-delete-load-button" title="Delete attached load" data-action="delete-child" data-device="'+esc(device.id)+'" data-load="'+esc(load.id)+'">Delete</button></td></tr>';
}
function instanceCircuitSummary(device,instance){
  var c=deviceCatalog(device);var parts=[];
  if(c.hasKeypadPgm){var pgm=childTotals(device,'alarm','keypad-pgm','',instance);parts.push({text:'PGM '+formatMa(pgm)+' / 50 mA',over:pgm>50});}
  if(c.hasAux){var aux=childTotals(device,'alarm','device-aux','',instance);parts.push({text:'AUX '+formatMa(aux)+' / '+formatMa(c.auxLimitMa),over:aux>c.auxLimitMa});}
  if(c.hasOutputs){for(var outputIndex=1;outputIndex<=c.outputCount;outputIndex++){var output='O'+outputIndex;var used=childTotals(device,'alarm','device-output',output,instance);if(used) parts.push({text:output+' '+formatMa(used)+' / '+formatMa(c.outputLimitMa),over:used>c.outputLimitMa});}}
  if(c.hasAudioStations){var stationQty=childQuantity(device,'audio-station',instance);var stationLoad=childTotals(device,'alarm','audio-station','',instance);var active=deviceInstanceTotal(device,'alarm',instance);parts.push({text:'Stations '+stationQty+' / 4',over:stationQty>4});parts.push({text:'AUX '+formatMa(stationLoad)+' / 400 mA',over:stationLoad>400});parts.push({text:'Active '+formatMa(active)+' / 500 mA',over:active>500});}
  return parts;
}
function instanceCircuitName(c){if(c.hasKeypadPgm) return 'Keypad PGM';if(c.id==='hsm2108') return 'AUX load';if(c.hasOutputs) return 'AUX / Outputs';if(c.hasAux) return 'AUX';if(c.hasAudioStations) return 'Audio stations';return 'Connected loads';}
function instanceModelGroups(rows){
  var quantities={},order=[];
  rows.forEach(function(load){
    var qty=Math.max(1,number(load.quantity,1));var catalog=loadCatalog(load);var model=String(catalog.custom?load.model:(catalog.model||load.model)||'Connected device');
    if(!Object.prototype.hasOwnProperty.call(quantities,model)){quantities[model]=0;order.push(model);}
    quantities[model]+=qty;
  });
  return order.map(function(model){return {model:model,quantity:quantities[model]};});
}
function instanceModelsSummary(rows){return instanceModelGroups(rows).map(function(item){return item.model+(item.quantity>1?' ×'+item.quantity:'');}).join(', ');}
function instanceModelChips(rows){return instanceModelGroups(rows).map(function(item){return '<span class="pcc2-instance-device-chip"><strong>'+esc(item.model)+'</strong>'+(item.quantity>1?'<small>×'+esc(item.quantity)+'</small>':'')+'</span>';}).join('');}
function instanceCurrentChips(parts){return parts.map(function(part){return '<span class="pcc2-instance-current-chip '+(part.over?'over':'')+'">'+esc(part.text)+'</span>';}).join('');}
function instanceActionButtons(device,instance){
  var c=deviceCatalog(device),html='';
  if(c.hasKeypadPgm) html+='<button type="button" class="mini" data-action="add-child" data-kind="keypad-pgm" data-device="'+esc(device.id)+'" data-instance="'+instance+'">+ PGM load</button>';
  if(c.extraPower) html+='<button type="button" class="mini pcc2-extra-power-toggle '+(device.extraPower?'active':'')+'" data-action="toggle-instance-extra" data-device="'+esc(device.id)+'" data-instance="'+instance+'">Extra Power '+(device.extraPower?'ON':'OFF')+'</button>';
  if(c.hasAux) html+='<button type="button" class="mini" data-action="add-child" data-kind="device-aux" data-device="'+esc(device.id)+'" data-instance="'+instance+'">+ AUX load</button>';
  if(c.hasOutputs) html+='<button type="button" class="mini" data-action="add-child" data-kind="device-output" data-device="'+esc(device.id)+'" data-instance="'+instance+'">+ Output load</button>';
  if(c.hasAudioStations) html+='<button type="button" class="mini" data-action="add-audio" data-size="small" data-device="'+esc(device.id)+'" data-instance="'+instance+'">+ Small station</button><button type="button" class="mini" data-action="add-audio" data-size="large" data-device="'+esc(device.id)+'" data-instance="'+instance+'">+ Large station</button>';
  if(c.powerModule) html+='<button type="button" class="mini" data-action="scroll-local" data-device="'+esc(device.id)+'">Open local calculator</button>';
  return html?'<div class="pcc2-instance-actions">'+html+'</div>':'';
}
function physicalInstanceRowHtml(device,instance,isLast){
  var c=deviceCatalog(device),rows=childRowsForInstance(device,instance),hasChildren=rows.length>0,collapsed=hasChildren?attachmentInstanceCollapsed(device,instance):true,additional=childTotals(device,'alarm','','',instance),base=deviceUnitBaseCurrent(device,'alarm'),total=base+additional;
  var qty=rows.reduce(function(sum,load){return sum+Math.max(1,number(load.quantity,1));},0);var issues=deviceInstanceValidationMessages(device,instance);var issueKey='instance-'+device.id+'-'+instance;
  var connected=qty?'<div class="pcc2-instance-connected-inline"><strong>'+esc(qty)+' '+(qty===1?'device':'devices')+'</strong><div class="pcc2-instance-device-chips">'+instanceModelChips(rows)+'</div></div>':'';
  var currentHint=additional?'<small>Base '+esc(formatCurrent(base))+' + '+esc(formatCurrent(additional))+'</small>':'<small>Device current</small>';
  var deleteButton='<button type="button" class="mini danger pcc2-delete-instance" title="Delete '+esc(deviceVariantLabel(device,c))+' #'+instance+'" data-action="delete-family-instance" data-device="'+esc(device.id)+'" data-instance="'+instance+'">Delete</button>';
  var instanceTerminals=terminalStripHtml(attachedCircuitTerminals(c),deviceVariantLabel(device,c)+' #'+instance+' terminals');
  var instanceName=hasChildren?'<button type="button" class="pcc2-tree-instance-toggle" data-action="toggle-attachment-instance" data-device="'+esc(device.id)+'" data-instance="'+instance+'" aria-expanded="'+(collapsed?'false':'true')+'"><span class="card-collapse-chevron" aria-hidden="true"></span><strong>'+esc(deviceVariantLabel(device,c))+' #'+instance+'</strong></button>':'<div class="pcc2-tree-instance-label"><strong>'+esc(deviceVariantLabel(device,c))+' #'+instance+'</strong></div>';
  var modelCell='<div class="pcc2-instance-model-cell"><span class="pcc2-instance-indent" aria-hidden="true"></span><div class="pcc2-instance-model-stack"><div class="pcc2-instance-title-row">'+instanceName+instanceActionButtons(device,instance)+'</div>'+instanceTerminals+'</div></div>';
  var row='<tr class="pcc2-instance-row pcc2-physical-instance-row '+(collapsed?'is-collapsed ':'')+(isLast?'is-last ':'')+(issues.length?'has-limit-error':'')+'" data-device-instance-row="'+esc(device.id)+'" data-instance="'+instance+'"><td>'+modelCell+'</td><td>'+connected+'</td><td class="pcc2-current"><strong>'+esc(round(base))+'</strong></td><td><strong>1</strong></td><td class="pcc2-total"><strong>'+esc(formatCurrent(total))+'</strong>'+currentHint+'</td><td><div class="pcc2-row-action-group">'+inlineIssueButton(issueKey,issues,'row')+deleteButton+'</div></td></tr>';
  row+=inlineIssueRow(issueKey,issues);
  if(hasChildren&&!collapsed) rows.forEach(function(load,index){row+=childRowHtml(device,load,index===rows.length-1,isLast);});
  return row;
}
function attachmentLocationIndicatorHtml(device){
  var locations=[];
  for(var instance=1;instance<=device.quantity;instance++){
    var rows=childRowsForInstance(device,instance);
    var qty=rows.reduce(function(sum,load){return sum+Math.max(1,number(load.quantity,1));},0);
    if(!qty) continue;
    var models=instanceModelsSummary(rows);
    locations.push('<button type="button" class="pcc2-attachment-location-chip" data-action="reveal-attachment-instance" data-device="'+esc(device.id)+'" data-instance="'+instance+'" title="'+esc((models?models+' · ':'')+'Open '+deviceVariantLabel(device,deviceCatalog(device))+' #'+instance)+'"><span>#'+instance+'</span><strong>'+qty+' '+(qty===1?'device':'devices')+'</strong></button>');
  }
  if(!locations.length) return '';
  return '<div class="pcc2-attachment-location" aria-label="Additional device locations"><span class="pcc2-attachment-location-label">Additional</span>'+locations.join('')+'</div>';
}
function deviceRowHtml(device,showIndividualTree){
  var c=deviceCatalog(device);var baseTotal=deviceBaseCurrent(device,'alarm');var maxQty=Math.max(1,maxForModel(device.modelId,device.id));var family=deviceFamilyKey(c);var collapsed=deviceGroupCollapsed(device);
  var issues=deviceRowValidationMessages(device);var issueKey='device-'+device.id;
  var description=c.custom?customInput(device.description,'data-device-field="'+esc(device.id)+'" data-field="description"','text'):esc(deviceVariantDescription(device,c));
  var locationIndicator=attachmentLocationIndicatorHtml(device);
  var modelCell=c.custom?'<div class="pcc2-model-stack"><select data-device-model="'+esc(device.id)+'">'+optionGroups(CORBUS_CATALOG,device.modelId,device.id,device.sourceId==='panel')+'</select>'+customInput(device.model,'data-device-field="'+esc(device.id)+'" data-field="model"','text')+locationIndicator+'</div>':'<div class="pcc2-device-group-name"><button type="button" class="pcc2-device-group-toggle" data-action="toggle-device-group" data-device="'+esc(device.id)+'" aria-expanded="'+(collapsed?'false':'true')+'"><span class="card-collapse-chevron" aria-hidden="true"></span><strong>'+esc(deviceVariantLabel(device,c))+'</strong></button>'+(c.id==='hs2tchp'&&device.extraPower?'<span class="pcc2-power-mode-badge">Extra Power</span>':'')+locationIndicator+'</div>';
  var deleteButton='<button type="button" class="mini danger pcc2-delete-group" title="Delete all '+esc(device.quantity)+' '+esc(deviceVariantLabel(device,c))+'" aria-label="Delete '+esc(deviceVariantLabel(device,c))+' group" data-action="delete-device" data-device="'+esc(device.id)+'">Delete</button>';
  var actions='<div class="pcc2-row-action-group">'+inlineIssueButton(issueKey,issues,'row')+deleteButton+'</div>';
  var qtyInput='<input type="number" min="1" max="'+esc(maxQty)+'" step="1" value="'+esc(device.quantity)+'" data-device-qty="'+esc(device.id)+'" '+(c.powerModule?'disabled title="Power modules are added as individual instances"':'')+'>';
  var html='<tr class="pcc2-device-row pcc2-device-group-row pcc2-family-'+esc(family)+lastAddedClass(device)+(issues.length?' has-limit-error':'')+'" data-device-row="'+esc(device.id)+'"><td>'+modelCell+'</td><td><div class="pcc2-description">'+description+'</div></td><td class="pcc2-current">'+deviceCurrentCell(device,c)+'</td><td>'+qtyInput+'</td><td class="pcc2-total"><strong>'+esc(formatCurrent(baseTotal))+'</strong></td><td>'+actions+'</td></tr>';
  html+=inlineIssueRow(issueKey,issues);
  if(!collapsed) for(var instance=1;instance<=device.quantity;instance++) html+=physicalInstanceRowHtml(device,instance,instance===device.quantity);
  return html;
}
function accountingRowHtml(label,value,kind){return '<tr class="pcc2-accounting-total-row '+esc(kind||'')+'"><td colspan="4"><strong>'+esc(label)+'</strong></td><td class="pcc2-total"><strong>'+esc(formatCurrent(value))+'</strong></td><td></td></tr>';}
function corbusSectionDisplayValue(sourceId,key){
  sourceId=String(sourceId||'panel');
  var entry=state.corbusSectionDisplay&&state.corbusSectionDisplay[sourceId];
  if(entry&&typeof entry[key]==='boolean') return entry[key];
  return key==='showTotals'?state.showAccountingTotals!==false:state.showCorbusCategoryRows!==false;
}
function setCorbusSectionDisplayValue(sourceId,key,value){
  sourceId=String(sourceId||'panel');
  if(!state.corbusSectionDisplay||typeof state.corbusSectionDisplay!=='object') state.corbusSectionDisplay={};
  if(!state.corbusSectionDisplay[sourceId]||typeof state.corbusSectionDisplay[sourceId]!=='object') state.corbusSectionDisplay[sourceId]={};
  state.corbusSectionDisplay[sourceId][key]=value===true;
}
function setAllCorbusSectionDisplayValues(key,value){
  if(!state.corbusSectionDisplay||typeof state.corbusSectionDisplay!=='object') state.corbusSectionDisplay={};
  var sources={panel:true};state.corbus.forEach(function(device){if(deviceCatalog(device).powerModule) sources[device.id]=true;});
  Object.keys(sources).forEach(function(sourceId){setCorbusSectionDisplayValue(sourceId,key,value);});
}
function corbusSectionDisplayButtons(sourceId){
  var totals=corbusSectionDisplayValue(sourceId,'showTotals'),categories=corbusSectionDisplayValue(sourceId,'showCategories');
  return '<div class="pcc2-section-display-controls" role="group" aria-label="CORBUS section display"><button type="button" class="mini pcc2-section-display-toggle '+(totals?'active':'')+'" data-action="toggle-section-totals" data-source="'+esc(sourceId)+'" role="switch" aria-checked="'+(totals?'true':'false')+'" title="'+(totals?'Hide':'Show')+' accounting total rows in this CORBUS section">Totals '+(totals?'On':'Off')+'</button><button type="button" class="mini pcc2-section-display-toggle '+(categories?'active':'')+'" data-action="toggle-section-categories" data-source="'+esc(sourceId)+'" role="switch" aria-checked="'+(categories?'true':'false')+'" title="'+(categories?'Hide':'Show')+' CORBUS category rows in this section">Categories '+(categories?'On':'Off')+'</button></div>';
}
function familySummaryRowsHtml(sourceId,family,devices){
  var meta=familyMeta(family);if(!meta||!devices.length) return '';
  var instances=devices.reduce(function(sum,device){return sum+device.quantity;},0);var baseTotal=devices.reduce(function(sum,device){return sum+deviceBaseCurrent(device,'alarm');},0);var attachedTotal=devices.reduce(function(sum,device){return sum+childTotals(device,'alarm');},0);var combined=baseTotal+attachedTotal;
  if(!corbusSectionDisplayValue(sourceId,'showTotals')) return '';
  var row=accountingRowHtml(meta.deviceLabel+' ('+instances+')',baseTotal,'pcc2-accounting-base');
  if(attachedTotal>0){row+=accountingRowHtml(meta.additionalLabel,attachedTotal,'pcc2-accounting-additional');row+=accountingRowHtml('Total '+meta.title+' + additional devices',combined,'pcc2-accounting-grand');}
  return row;
}
function familyHeadingRowHtml(sourceId,family,devices){
  var meta=familyMeta(family);var instances=devices.reduce(function(sum,device){return sum+device.quantity;},0);var attached=devices.reduce(function(sum,device){return sum+attachedQuantity(device);},0);var issues=familyValidationMessages(devices);var issueKey='family-'+sourceId+'-'+family;var collapsed=familyGroupCollapsed(sourceId,family);
  var toggle='<button type="button" class="pcc2-family-toggle" data-action="toggle-corbus-family" data-source="'+esc(sourceId)+'" data-family="'+esc(family)+'" aria-expanded="'+(collapsed?'false':'true')+'" title="'+esc((collapsed?'Expand ':'Collapse ')+meta.title)+'"><span class="card-collapse-chevron" aria-hidden="true"></span><strong>'+esc(meta.title)+'</strong></button>';
  var deleteButton='<button type="button" class="mini danger pcc2-delete-family" data-action="delete-corbus-family" data-source="'+esc(sourceId)+'" data-family="'+esc(family)+'" title="Delete all '+esc(meta.title)+'">Delete</button>';
  return '<tr class="pcc2-family-heading-row pcc2-family-'+esc(family)+' '+(collapsed?'is-collapsed':'')+'"><td colspan="5"><div class="pcc2-family-heading">'+toggle+'<span>'+esc(instances)+' '+(instances===1?'device':'devices')+(attached?' · '+attached+' additional '+(attached===1?'device':'devices'):'')+'</span></div></td><td><div class="pcc2-row-action-group">'+inlineIssueButton(issueKey,issues,'row')+deleteButton+'</div></td></tr>'+inlineIssueRow(issueKey,issues);
}
function sectionTotalMetric(label,total,limitMa,forcedClass,displayValue){
  var cls=forcedClass|| (limitMa?level(total,limitMa):'ok');
  return '<div class="pcc2-section-total '+cls+'"><span>'+esc(label)+'</span><strong>'+esc(displayValue||formatMa(total))+'</strong>'+(limitMa?'<small>'+esc(statusText(total,limitMa))+'</small>':'')+'</div>';
}
function terminalStripHtml(terminals,label){
  if((state&&state.showTerminals===false)||!terminals||!terminals.length) return '';
  return '<div class="pcc2-terminal-strip" role="group" aria-label="'+esc(label||'Connection terminals')+'">'+terminals.map(function(terminal){
    var prefix=terminal.breakBefore?'<span class="pcc2-terminal-row-break" aria-hidden="true"></span>'+(terminal.indentBefore?'<span class="pcc2-terminal-row-indent" aria-hidden="true"></span>':''):'';
    return prefix+'<span class="pcc2-terminal pcc2-terminal-'+esc(terminal.tone||'black')+'"><span class="pcc2-terminal-color" aria-hidden="true"></span><strong>'+esc(terminal.label)+'</strong></span>';
  }).join('')+'</div>';
}
function redTerminal(label){return {label:label,tone:'red'};}
function blackTerminal(label){return {label:label,tone:'black'};}
function yellowTerminal(label){return {label:label,tone:'yellow'};}
function greenTerminal(label){return {label:label,tone:'green'};}
function panelCorbusTerminals(){return [redTerminal('RED'),blackTerminal('BLK'),yellowTerminal('YEL'),greenTerminal('GRN')];}
function panelAuxTerminals(){return [redTerminal('AUX+'),blackTerminal('AUX-')];}
function localCorbusTerminals(){return [redTerminal('AUX+'),blackTerminal('BLK'),yellowTerminal('YEL'),greenTerminal('GRN')];}
function localAuxTerminals(){return [redTerminal('AUX+'),blackTerminal('BLK')];}
function panelPgmTerminals(){return [redTerminal('AUX+')].concat(panelPgms().map(function(name){return blackTerminal(name);}));}
function outputTerminals(output){return [redTerminal('AUX+'),blackTerminal(output)];}
function localOutputTerminals(){return [redTerminal('AUX+'),blackTerminal('O1'),blackTerminal('O2'),blackTerminal('O3'),blackTerminal('O4')];}
function attachedCircuitTerminals(c){
  if(!c) return [];
  if(c.family==='keypad'&&c.hasKeypadPgm) return [redTerminal('P/Z'),blackTerminal('BLK')];
  if(c.id==='hsm2108') return [redTerminal('AUX+'),blackTerminal('BLK')];
  if(c.id==='hsm2208'){var o5=blackTerminal('O5');o5.breakBefore=true;o5.indentBefore=true;return [redTerminal('AUX+'),blackTerminal('O1'),blackTerminal('O2'),blackTerminal('O3'),blackTerminal('O4'),o5,blackTerminal('O6'),blackTerminal('O7'),blackTerminal('O8')];}
  if(c.id==='hsm2955') return [redTerminal('AUX+'),blackTerminal('COM')];
  return [];
}
function sectionHead(eyebrow,title,copy,total,limitMa,actions,totalLabel,collapseKey,issueKey,issueMessages,terminals,issueTarget){
  var issues=overMessages(issueMessages);
  var terminalHtml=terminalStripHtml(terminals,title+' connection terminals');
  var heading='<div class="pcc2-section-heading-main">'+(collapseKey?collapseButton(collapseKey,title):'')+'<div><p class="eyebrow">'+esc(eyebrow)+'</p><div class="pcc2-section-title-line"><h2>'+esc(title)+'</h2>'+terminalHtml+'</div></div></div>';
  var controls=actions?'<div class="pcc2-section-actions">'+actions+'</div>':'';
  var alert=issueKey?inlineIssueButton(issueKey,issues,issueTarget?'jump':'',issueTarget):'';
  var totalHtml;
  if(total&&typeof total==='object'){
    var standby=number(total.standby,0),alarm=number(total.alarm,0);
    var standbyLimit=total.standbyLimit==null?limitMa:total.standbyLimit;
    var alarmLimit=total.alarmLimit==null?limitMa:total.alarmLimit;
    totalHtml='<div class="pcc2-section-totals">'+sectionTotalMetric(total.standbyLabel||'Standby current',standby,standbyLimit,null,total.standbyDisplay)+sectionTotalMetric(total.alarmLabel||'Alarm current',alarm,alarmLimit,issues.length?'over':'',total.alarmDisplay)+'</div>';
  }else{
    var cls=issues.length?'over':(limitMa?level(total,limitMa):'ok');
    totalHtml=sectionTotalMetric(totalLabel||'Current Load',total,limitMa,cls);
  }
  return '<div class="pcc2-section-head">'+heading+'<div class="pcc2-section-side">'+controls+alert+totalHtml+'</div></div>';
}

function corbusRowsHtml(sourceId,isLocal){
  var devices=orderedDevices(sourceId);var rows=isLocal?'':panelBoardRowHtml();var familyOrder=[];var grouped={};
  devices.forEach(function(device){var family=deviceFamilyKey(deviceCatalog(device));if(!grouped[family]){grouped[family]=[];familyOrder.push(family);}grouped[family].push(device);});
  familyOrder.forEach(function(family){
    var list=grouped[family];var showHeading=corbusSectionDisplayValue(sourceId,'showCategories');var collapsed=showHeading&&familyGroupCollapsed(sourceId,family);
    if(showHeading) rows+=familyHeadingRowHtml(sourceId,family,list);
    if(!collapsed){list.forEach(function(device){rows+=deviceRowHtml(device,true);});rows+=familySummaryRowsHtml(sourceId,family,list);}
  });
  return rows;
}
function corbusSection(sourceId,isLocal){
  var devices=orderedDevices(sourceId);
  var standby=sourceCorbusTotal(sourceId,'standby')+(isLocal?0:PANEL_BOARD_MA);
  var alarm=sourceCorbusTotal(sourceId,'alarm')+(isLocal?0:PANEL_BOARD_MA);
  var total=alarm;
  var module=isLocal?findDevice(sourceId):null;
  var moduleLabel=isLocal?sourceName(sourceId)+' #'+powerModuleOrdinal(module):'';
  var title=isLocal?moduleLabel+' — CORBUS':'CORBUS';
  var copy='';
  var terminals=isLocal?localCorbusTerminals():panelCorbusTerminals();
  var rows=corbusRowsHtml(sourceId,isLocal);
  if(!rows) rows='<tr><td colspan="6"><div class="pcc2-empty">No CORBUS devices added to this source.</div></td></tr>';
  var key=isLocal?'corbus-'+sourceId:'corbus-panel';var issueKey='section-'+key;
  var issues=corbusSectionValidationMessages(sourceId,total,title+' current');var issueTarget=firstCorbusIssueTarget(sourceId);
  var table='<div class="pcc2-table-wrap"><table class="pcc2-table">'+tableHeader()+'<tbody>'+rows+'</tbody></table></div>';
  var controls=corbusSectionDisplayButtons(sourceId)+'<button type="button" class="primary" data-action="add-corbus" data-source="'+esc(sourceId)+'">+ Add CORBUS device</button>';
  return '<section class="pcc2-section '+(isLocal?'pcc2-local-circuit-card ':'')+'pcc2-collapsible-section '+(sectionCollapsed(key)?'is-collapsed':'')+issueClass(issues)+'" id="'+(isLocal?'pcc-local-'+esc(sourceId):'pcc-corbus')+'" data-pcc-section="'+esc(key)+'">'+sectionHead(isLocal?'Local CORBUS circuit':'Panel circuit',title,copy,total,null,controls,'Current Load',key,issueKey,issues,terminals,issueTarget)+sectionIssuePanel(issueKey,issues)+sectionBody(key,table)+'</section>';
}

function loadRowHtml(load,context){
  var c=loadCatalog(load);var custom=c.custom;var total=loadTotal(load,'alarm');
  return '<tr><td><select data-load-model="'+esc(context)+'" data-load="'+esc(load.id)+'">'+auxOptions(load.catalogId)+'</select>'+(custom?customInput(load.model,'data-load-field="'+esc(context)+'" data-load="'+esc(load.id)+'" data-field="model"','text'):'')+'</td><td>'+(custom?customInput(load.description,'data-load-field="'+esc(context)+'" data-load="'+esc(load.id)+'" data-field="description"','text'):esc(c.description))+(c.verificationRequired?'<small class="pcc2-verify">Verify exact model current.</small>':'')+'</td><td class="pcc2-current">'+(custom?customInput(load[currentKey()],'data-load-field="'+esc(context)+'" data-load="'+esc(load.id)+'" data-field="'+currentKey()+'"','number'):'<strong>'+esc(round(loadCurrent(load,'alarm')))+'</strong>')+'</td><td><input type="number" min="1" max="999" step="1" value="'+esc(load.quantity)+'" data-load-qty="'+esc(context)+'" data-load="'+esc(load.id)+'"></td><td class="pcc2-total"><strong>'+esc(formatCurrent(total))+'</strong></td><td><button type="button" class="mini danger pcc2-delete-load-button" data-action="delete-load" data-context="'+esc(context)+'" data-load="'+esc(load.id)+'" title="Delete load">Delete</button></td></tr>';
}
function loadsTable(loads,context,emptyText,totalLabel){var rows=loads.length?loads.map(function(load){return loadRowHtml(load,context);}).join(''):'<tr><td colspan="6"><div class="pcc2-empty">'+esc(emptyText)+'</div></td></tr>';if(loads.length&&totalLabel&&state.showAccountingTotals!==false) rows+=accountingRowHtml(totalLabel,loads.reduce(function(sum,load){return sum+loadTotal(load,'alarm');},0),'pcc2-accounting-grand');return '<div class="pcc2-table-wrap"><table class="pcc2-table">'+tableHeader()+'<tbody>'+rows+'</tbody></table></div>'; }
function auxSection(sourceId,isLocal){
  var loads=isLocal?(state.localAux[sourceId]||[]):state.aux;
  var standby=isLocal?localAuxTotal(sourceId,'standby'):panelAuxTotal('standby');
  var alarm=isLocal?localAuxTotal(sourceId,'alarm'):panelAuxTotal('alarm');
  var total=alarm;
  var context=isLocal?'localaux:'+sourceId:'panelaux';
  var module=isLocal?findDevice(sourceId):null;
  var moduleLabel=isLocal?sourceName(sourceId)+' #'+powerModuleOrdinal(module):'';
  var title=isLocal?moduleLabel+' — AUX':'AUX';
  var copy='';
  var terminals=isLocal?localAuxTerminals():panelAuxTerminals();
  var key=isLocal?'aux-'+sourceId:'aux-panel';var issueKey='section-'+key;
  var issues=sourceBudgetMessages(sourceId,total,title+' current');
  var body=loadsTable(loads,context,'No AUX devices added.','Total AUX devices');
  return '<section class="pcc2-section '+(isLocal?'pcc2-local-circuit-card ':'')+'pcc2-collapsible-section '+(sectionCollapsed(key)?'is-collapsed':'')+issueClass(issues)+'" id="'+(isLocal?'pcc-local-aux-'+esc(sourceId):'pcc-aux')+'" data-pcc-section="'+esc(key)+'">'+sectionHead(isLocal?'Local auxiliary circuit':'Panel circuit',title,copy,total,null,'<button type="button" class="secondary" data-action="add-load" data-context="'+esc(context)+'">+ Add AUX device</button>','Current Load',key,issueKey,issues,terminals)+sectionIssuePanel(issueKey,issues)+sectionBody(key,body)+'</section>';
}

function pgmOutputCard(name){
  var p=state.pgms[name];var standby=panelPgmTotal(name,'standby');var total=panelPgmTotal(name,'alarm');var limitMa=PGM_LIMITS[name];var context='panelpgm:'+name;var key='pgm-'+name;var issueKey='section-'+key;
  var issues=pgmValidationMessages(name);var body=loadsTable(p.loads,context,'No loads connected to '+name+'.');
  return '<article class="pcc2-pgm-card pcc2-collapsible-section '+(sectionCollapsed(key)?'is-collapsed':'')+issueClass(issues)+'" data-pcc-section="'+key+'">'+sectionHead('Onboard output',name,'Negative-trigger programmable output.',total,limitMa,'<button type="button" class="secondary" data-action="add-load" data-context="'+esc(context)+'">+ Add load</button>','Current Load',key,issueKey,issues,outputTerminals(name))+sectionIssuePanel(issueKey,issues)+sectionBody(key,body)+'</article>';
}

function smokeTableHeader(){return '<thead><tr><th>Brand / model</th><th>Standby each</th><th>Alarm each</th><th>Quantity</th><th>Standby total</th><th>Alarm total</th><th class="pcc2-actions-col">Actions</th></tr></thead>';}
function smokeDetectorRowHtml(pgm,row){
  var quantity=number(row.quantity,1);var otherQuantity=pgmSmokeQuantity(pgm)-quantity;var maxQuantity=Math.max(1,18-otherQuantity);
  var standbyEach=number(row.standbyMa,0),alarmEach=number(row.alarmMa,0);
  return '<tr class="pcc2-smoke-detector-row" data-smoke-detector-row="'+esc(row.id)+'">'+
    '<td data-label="Brand / model"><div class="pcc2-smoke-identity"><input type="text" value="'+esc(row.brand)+'" placeholder="Brand" data-smoke-row-field="'+esc(row.id)+'" data-field="brand"><input type="text" value="'+esc(row.model)+'" placeholder="Model" data-smoke-row-field="'+esc(row.id)+'" data-field="model"></div></td>'+
    '<td data-label="Standby each"><input type="number" min="0" max="1000" step="0.001" value="'+esc(standbyEach)+'" data-smoke-row-field="'+esc(row.id)+'" data-field="standbyMa"><small>mA</small></td>'+
    '<td data-label="Alarm each"><input type="number" min="0" max="1000" step="0.1" value="'+esc(alarmEach)+'" data-smoke-row-field="'+esc(row.id)+'" data-field="alarmMa"><small>mA</small></td>'+
    '<td data-label="Quantity"><input type="number" min="1" max="'+esc(maxQuantity)+'" step="1" value="'+esc(quantity)+'" data-smoke-row-qty="'+esc(row.id)+'"></td>'+
    '<td data-label="Standby total" class="pcc2-total"><strong>'+esc(formatMa(quantity*standbyEach))+'</strong></td>'+
    '<td data-label="Alarm total" class="pcc2-total"><strong>'+esc(formatMa(quantity*alarmEach))+'</strong></td>'+
    '<td data-label="Actions"><button type="button" class="icon danger pcc2-smoke-row-delete" data-action="delete-smoke-row" data-smoke-row="'+esc(row.id)+'" aria-label="Delete 2-wire smoke" title="Delete 2-wire smoke">×</button></td>'+
  '</tr>';
}
function pgm2Card(){
  var p=state.pgms.PGM2;var standbyTotal=panelPgmTotal('PGM2','standby');var total=panelPgmTotal('PGM2','alarm');var smoke=p.mode==='smoke';var limitMa=smoke?TWO_WIRE_HARDWARE_LIMIT_MA:300;var key='pgm-PGM2';var issueKey='section-'+key;
  var issues=pgmValidationMessages('PGM2');
  var toggle='<div class="pcc2-segment"><button type="button" data-action="pgm2-mode" data-mode="output" class="'+(!smoke?'active':'')+'">PGM output</button><button type="button" data-action="pgm2-mode" data-mode="smoke" class="'+(smoke?'active':'')+'">2-wire smoke</button></div>';
  var body;
  if(!smoke) body=loadsTable(p.loads,'panelpgm:PGM2','No loads connected to PGM2.');
  else{
    var rows=smokeRows(p);var qty=pgmSmokeQuantity(p);var standby=pgmSmokeStandbyTotal(p);var alarmDemand=pgmSmokeConnectedAlarmDemand(p);var alarmUsed=pgmSmokeTotal(p);var canAdd=qty<18;
    body='<div class="pcc2-smoke-toolbar"><span><b>'+esc(qty)+'</b> / 18 smokes</span><button type="button" class="secondary" data-action="add-smoke-row" '+(!canAdd?'disabled':'')+'>+ Add 2-wire smoke</button></div>'+ 
      '<div class="pcc2-table-wrap pcc2-smoke-table-wrap"><table class="pcc2-table pcc2-smoke-table">'+smokeTableHeader()+'<tbody>'+(rows.length?rows.map(function(row){return smokeDetectorRowHtml(p,row);}).join(''):'<tr class="pcc2-smoke-empty-row"><td colspan="7"><div class="pcc2-empty">No 2-wire smoke detectors added.</div></td></tr>')+'</tbody></table></div>'+ 
      '<div class="pcc2-smoke-summary"><div class="pcc2-smoke-stat '+level(standby,TWO_WIRE_STANDBY_LIMIT_MA)+'"><span>Standby current</span><strong>'+esc(formatMa(standby))+'</strong><small>'+esc(formatMa(TWO_WIRE_STANDBY_LIMIT_MA))+' maximum standby load</small></div><div class="pcc2-smoke-stat '+level(alarmDemand,TWO_WIRE_HARDWARE_LIMIT_MA)+'"><span>Alarm current</span><strong>'+esc(formatMa(alarmUsed))+'</strong><small>'+esc(formatMa(TWO_WIRE_HARDWARE_LIMIT_MA))+' maximum · entered detector total '+esc(formatMa(alarmDemand))+'</small></div></div>';
  }
  return '<article class="pcc2-pgm-card pcc2-pgm2 pcc2-collapsible-section '+(sectionCollapsed(key)?'is-collapsed':'')+issueClass(issues)+'" data-pcc-section="'+key+'">'+sectionHead(smoke?'Onboard supervised input':'Onboard output','PGM2',smoke?'Add compatible 2-wire smoke detectors from any brand.':'300 mA current-limited negative-trigger programmable output.',total,limitMa,toggle+(!smoke?'<button type="button" class="secondary" data-action="add-load" data-context="panelpgm:PGM2">+ Add load</button>':''),'Current Load',key,issueKey,issues,outputTerminals('PGM2'))+sectionIssuePanel(issueKey,issues)+sectionBody(key,body)+'</article>';
}

function pgmsSection(){
  var cards=panelPgms().map(function(name){return name==='PGM2'?pgm2Card():pgmOutputCard(name);}).join('');var key='pgms';var issueKey='section-'+key;
  var standby=allPanelPgmsTotal('standby');var total=allPanelPgmsTotal('alarm');var issues=sourceBudgetMessages('panel',total,'Combined onboard PGM load');
  return '<section class="pcc2-section pcc2-collapsible-section '+(sectionCollapsed(key)?'is-collapsed':'')+issueClass(issues)+'" id="pcc-pgms" data-pcc-section="'+key+'">'+sectionHead('Panel circuits','PGMs','Only the onboard PGMs physically available on the selected panel are shown. All PGM loads count against the panel current budget.',total,null,'','Current Load',key,issueKey,issues,panelPgmTerminals())+sectionIssuePanel(issueKey,issues)+sectionBody(key,'<div class="pcc2-pgm-grid">'+cards+'</div>')+'</section>';
}

function pclinkSection(){
  var c=commIndex[state.pclink2.modelId]||commIndex[''];
  var normal=c.custom?number(state.pclink2.standbyMa,0):number(c.standbyMa,0);
  var transmit=c.custom?number(state.pclink2.alarmMa,0):number(c.alarmMa,0);
  var extra=Math.max(0,transmit-normal);
  var desc=c.custom?customInput(state.pclink2.description,'data-comm-field="description"','text'):esc(c.description);
  var normalCell=c.custom?customInput(normal,'data-comm-field="standbyMa"','number'):'<strong>'+esc(formatCurrent(normal))+'</strong>';
  var transmitCell=c.custom?customInput(transmit,'data-comm-field="alarmMa"','number'):'<strong>'+esc(formatCurrent(transmit))+'</strong>';
  var key='pclink';var issueKey='section-'+key;var issues=pclinkValidationMessages();
  var table='<div class="pcc2-table-wrap"><table class="pcc2-table pcc2-comm-table"><thead><tr><th>Model</th><th>Description</th><th><span>Normal current</span><small>(mA)</small></th><th><span>Transmit increase</span><small>(mA)</small></th><th><span>Total transmit</span><small>(mA)</small></th></tr></thead><tbody><tr class="'+(issues.length?'has-limit-error':'')+'"><td><select data-comm-model>'+COMMUNICATORS.map(function(item){return '<option value="'+esc(item.id)+'" '+(item.id===state.pclink2.modelId?'selected':'')+'>'+esc(item.model)+'</option>';}).join('')+'</select></td><td>'+desc+'</td><td class="pcc2-current">'+normalCell+'</td><td class="pcc2-total pcc2-transmit-increase"><strong>'+esc(formatSignedCurrent(extra))+'</strong></td><td class="pcc2-current">'+transmitCell+'</td></tr></tbody></table></div>';
  return '<section class="pcc2-section pcc2-collapsible-section '+(sectionCollapsed(key)?'is-collapsed':'')+issueClass(issues)+'" id="pcc-pclink" data-pcc-section="'+key+'">'+sectionHead('Panel connection','PC-LINK 2 (Communicator)','The normal communicator current is included in the 700 mA panel load. During transmission, only the increase above that normal current is added to calculate the 1,000 mA transmit total.',{standby:normal,alarm:transmit,standbyLabel:'Normal current',alarmLabel:'Total transmit'},null,'','',key,issueKey,issues)+sectionIssuePanel(issueKey,issues)+sectionBody(key,table)+'</section>';
}

function localOutputCard(module,output){
  var loads=((state.localPgms[module.id]||{})[output])||[];
  var context='localpgm:'+module.id+':'+output;
  var standby=localPgmTotal(module.id,output,'standby');
  var total=localPgmTotal(module.id,output,'alarm');
  var key='local-pgm-'+module.id+'-'+output;var issueKey='section-'+key;
  var outputNumber=Math.max(1,Number(String(output).replace(/\D/g,''))||1);
  var displayName='Output'+outputNumber;var terminalName='O'+outputNumber;var issues=localOutputValidationMessages(module,output);
  return '<article class="pcc2-pgm-card pcc2-local-pgm-card pcc2-collapsible-section '+(sectionCollapsed(key)?'is-collapsed':'')+issueClass(issues)+'" data-pcc-section="'+esc(key)+'">'+sectionHead('HSM2204 output',displayName,'500 mA maximum at 12 VDC.',total,500,'<button type="button" class="secondary" data-action="add-load" data-context="'+esc(context)+'">+ Add load</button>','Current Load',key,issueKey,issues,outputTerminals(terminalName))+sectionIssuePanel(issueKey,issues)+sectionBody(key,loadsTable(loads,context,'No loads connected to '+displayName+'.'))+'</article>';
}

function localCalculator(module){
  var c=deviceCatalog(module),ordinal=powerModuleOrdinal(module),standby=localSupplyTotal(module.id,'standby'),active=localSupplyTotal(module.id,'alarm');
  var key='local-shell-'+module.id;var issueKey='system-'+key;
  var label=c.model+' #'+ordinal;var messages=localValidationMessages(module);var issues=overMessages(messages);
  var pgms='';
  if(c.id==='hsm2204'){
    var pgmKey='local-pgms-'+module.id;var pgmIssueKey='section-'+pgmKey;var pgmStandby=localAllPgmTotal(module.id,'standby');var pgmTotal=localAllPgmTotal(module.id,'alarm');
    var pgmIssues=sourceBudgetMessages(module.id,pgmTotal,label+' combined output load');
    var pgmBody='<div class="pcc2-pgm-grid">'+['O1','O2','O3','O4'].map(function(out){return localOutputCard(module,out);}).join('')+'</div>';
    pgms='<section class="pcc2-section pcc2-local-circuit-card pcc2-collapsible-section '+(sectionCollapsed(pgmKey)?'is-collapsed':'')+issueClass(pgmIssues)+'" data-pcc-section="'+esc(pgmKey)+'">'+sectionHead('Local outputs',label+' — Outputs','Four independent 500 mA outputs. These outputs do not support the panel PGM2 2-wire smoke mode.',pgmTotal,null,'','Current Load',pgmKey,pgmIssueKey,pgmIssues,localOutputTerminals())+sectionIssuePanel(pgmIssueKey,pgmIssues)+sectionBody(pgmKey,pgmBody)+'</section>';
  }
  var monitors='<div class="pcc2-system-monitors pcc2-local-system-monitors">'+systemMonitor('Current Load',formatMa(active),statusText(active,LOCAL_SUPPLY_LIMIT_MA),level(active,LOCAL_SUPPLY_LIMIT_MA))+'</div>';
  var bannerAlert='<div class="pcc2-system-alert-slot">'+inlineIssueButton(issueKey,messages,'jump',issues.length?firstLocalIssueTarget(module):null)+'</div>';
  var shellCollapseKey='local-shell-collapse-'+module.id;
  var head='<div class="pcc2-system-banner pcc2-local-banner"><div class="pcc2-section-heading-main">'+collapseButton(shellCollapseKey,label)+'<div><p class="eyebrow">Independent expansion supply</p><h2>'+esc(label)+'</h2></div></div><div class="pcc2-system-banner-side">'+bannerAlert+monitors+'</div></div>';
  var body=(calculatorToolVisible('corbus-'+module.id)?corbusSection(module.id,true):'')+(calculatorToolVisible('aux-'+module.id)?auxSection(module.id,true):'')+(c.id==='hsm2204'&&calculatorToolVisible('local-pgms-'+module.id)?pgms:'');
  return '<section class="pcc2-system-shell pcc2-local-shell '+(sectionCollapsed(shellCollapseKey)?'is-collapsed ':'')+issueClass(issues)+'" id="pcc-local-shell-'+esc(module.id)+'" data-pcc-section="'+esc(key)+'">'+head+'<div class="pcc2-system-shell-body pcc2-local-shell-body">'+sectionInfoPanel(issueKey,messages)+body+'</div></section>';
}


function corbusPickerOptions(sourceId){
  var groups={};var order=[];
  orderedCorbusPickerCatalog().forEach(function(item){
    if(sourceId!=='panel'&&item.powerModule) return;
    if(!canUseModel(item.id,'')) return;
    var label=catalogGroupLabel(item);if(!groups[label]){groups[label]=[];order.push(label);}groups[label].push(item);
  });
  return order.map(function(category){return '<optgroup label="'+esc(category)+'">'+groups[category].map(function(item){return '<option value="'+esc(item.id)+'">'+esc(item.model)+' — '+esc(formatMa(item.id==='hs2tchp'?item.extraPowerAlarmMa||item.alarmMa:item.alarmMa))+' max</option>';}).join('')+'</optgroup>';}).join('');
}
function orderedCorbusPickerCatalog(){
  var items=orderedCatalog(CORBUS_CATALOG);
  return items.sort(function(a,b){if(a.id==='custom-corbus'&&b.id!=='custom-corbus') return -1;if(b.id==='custom-corbus'&&a.id!=='custom-corbus') return 1;return 0;});
}
function orderedAuxCatalog(){
  return AUX_CATALOG.slice().sort(function(a,b){
    if(a.id==='custom-load'&&b.id!=='custom-load') return -1;
    if(b.id==='custom-load'&&a.id!=='custom-load') return 1;
    return AUX_CATALOG.indexOf(a)-AUX_CATALOG.indexOf(b);
  });
}
function loadPickerOptions(){
  var groups={};var order=[];orderedAuxCatalog().forEach(function(item){if(item.hidden) return;if(!groups[item.category]){groups[item.category]=[];order.push(item.category);}groups[item.category].push(item);});
  return order.map(function(category){return '<optgroup label="'+esc(category)+'">'+groups[category].map(function(item){return '<option value="'+esc(item.id)+'">'+esc(item.model)+' — '+esc(formatMa(item.alarmMa))+' max</option>';}).join('')+'</optgroup>';}).join('');
}
function pickerAnchor(el){
  var gutter=12,gap=7;
  var viewportWidth=Math.max(320,window.innerWidth||1024),viewportHeight=Math.max(320,window.innerHeight||768);
  var rect=el&&el.getBoundingClientRect?el.getBoundingClientRect():{top:gutter,bottom:gutter+32,left:gutter,right:gutter+180,width:180,height:32};
  var width=Math.min(520,Math.max(320,viewportWidth-gutter*2));
  var desiredHeight=Math.min(620,Math.max(320,viewportHeight-gutter*2));
  var minUsefulHeight=Math.min(390,desiredHeight);
  var below=Math.max(0,viewportHeight-rect.bottom-gutter-gap),above=Math.max(0,rect.top-gutter-gap);
  var maxHeight,top;
  if(below>=minUsefulHeight){maxHeight=Math.min(desiredHeight,below);top=rect.bottom+gap;}
  else if(above>=minUsefulHeight){maxHeight=Math.min(desiredHeight,above);top=rect.top-gap-maxHeight;}
  else{
    maxHeight=desiredHeight;
    top=Math.max(gutter,Math.min(rect.top,viewportHeight-maxHeight-gutter));
  }
  var preferredLeft=rect.left;
  if(preferredLeft+width>viewportWidth-gutter) preferredLeft=rect.right-width;
  var left=Math.max(gutter,Math.min(preferredLeft,viewportWidth-width-gutter));
  return {top:Math.round(top),left:Math.round(left),width:Math.round(width),maxHeight:Math.round(maxHeight)};
}
function pickerCatalogItems(){
  if(!picker) return [];
  if(picker.kind==='corbus'){
    var items=orderedCorbusPickerCatalog().filter(function(item){
      if(picker.sourceId!=='panel'&&item.powerModule) return false;
      return canUseModel(item.id,'');
    });
    var touchIndex=items.findIndex(function(item){return item.id==='hs2tchp';});
    if(touchIndex>=0){
      var touch=items[touchIndex];
      items.splice(touchIndex+1,0,{id:'hs2tchp',category:touch.category,model:'HS2TCHP — Extra Power',description:'7-inch hardwired touchscreen keypad with Extra Power enabled.',standbyMa:touch.standbyMa,alarmMa:touch.extraPowerAlarmMa||230,family:touch.family,hasKeypadPgm:touch.hasKeypadPgm,extraPower:true,pickerExtraPower:true});
    }
    return items;
  }
  if(picker.kind==='load'||picker.kind==='child') return orderedAuxCatalog().filter(function(item){return !item.hidden;});
  if(picker.kind==='audio') return [auxIndex[picker.audioSize==='large'?'audio-large':'audio-small']];
  return [];
}
function pickerTargetHtml(){
  if(!picker||['child','audio'].indexOf(picker.kind)<0) return '';
  var device=findDevice(picker.deviceId);if(!device) return '';
  var c=deviceCatalog(device);var selected=Math.min(device.quantity,Math.max(1,number(picker.parentInstance,1)));
  var output='';
  if(picker.kind==='child'&&picker.childKind==='device-output') output='<label><span>Output</span><select data-picker-output>'+Array.from({length:c.outputCount||8},function(_,index){var name='O'+(index+1);return '<option '+(name===picker.outputId?'selected':'')+'>'+name+'</option>';}).join('')+'</select></label>';
  var targets=picker.kind==='child'&&picker.childKind==='keypad-pgm'?keypadTargetOptions(device,selected):instanceOptions(device,selected);
  var targetAttr=picker.kind==='child'&&picker.childKind==='keypad-pgm'?'data-picker-keypad-target':'data-picker-instance';
  return '<div class="pcc2-add-menu-target"><label><span>Connect to</span><select '+targetAttr+'>'+targets+'</select></label>'+output+'</div>';
}
function pickerMenuHtml(){
  if(!picker||picker.kind==='smoke'||picker.kind==='remove-instances') return '';
  var items=pickerCatalogItems();var groups={};var groupOrder=[];items.forEach(function(item){var label=picker.kind==='corbus'?catalogGroupLabel(item):item.category;if(!groups[label]){groups[label]=[];groupOrder.push(label);}groups[label].push(item);});
  var parent=picker.deviceId?findDevice(picker.deviceId):null;var parentModel=parent?deviceCatalog(parent).model:'';
  var title=picker.kind==='corbus'?'Add CORBUS device':picker.kind==='load'?'Add powered device':picker.kind==='audio'?'Add '+(picker.audioSize==='large'?'large':'small')+' audio station':'Add '+(picker.childKind==='keypad-pgm'?'keypad PGM':picker.childKind==='device-aux'?'module AUX':'module output')+' load';
  var list=groupOrder.map(function(category){
    return '<div class="pcc2-add-menu-group" data-picker-group><div class="pcc2-add-menu-label">'+esc(category)+'</div>'+groups[category].map(function(item){
      var max=item.alarmMa;
      return '<button type="button" class="pcc2-add-menu-option pcc2-family-'+esc(deviceFamilyKey(item))+'" data-action="picker-select" data-model="'+esc(item.id)+'" '+(item.pickerExtraPower?'data-extra-power="true" ':'')+'data-picker-search-text="'+esc((item.model+' '+item.category+' '+item.description+' '+(item.pickerExtraPower?'extra power':'')).toLowerCase())+'"><span><strong>'+esc(item.model)+'</strong><small>'+esc(item.description)+'</small></span><b>'+esc(formatMa(max))+'</b></button>';
    }).join('')+'</div>';
  }).join('');
  if(!list) list='<div class="pcc2-empty">No compatible device is currently available.</div>';
  var a=picker.anchor||{top:80,left:12,width:360,maxHeight:500};
  var subtitle=parentModel?'<small class="pcc2-add-menu-subtitle">'+(picker.kind==='child'&&picker.childKind==='keypad-pgm'?'Choose any installed keypad, then select the connected device.':'Choose the '+esc(parentModel)+' instance, then select the connected device.')+'</small>':'';
  return '<div class="pcc2-add-menu" data-picker-menu role="menu" aria-label="'+esc(title)+'" style="--pcc-picker-max-height:'+a.maxHeight+'px;top:'+a.top+'px;left:'+a.left+'px;width:'+a.width+'px;max-height:'+a.maxHeight+'px"><div class="pcc2-add-menu-head"><div><strong>'+esc(title)+'</strong>'+subtitle+'</div><button type="button" class="icon danger" data-action="picker-cancel" aria-label="Cancel">×</button></div>'+pickerTargetHtml()+'<label class="pcc2-picker-search"><span>Search</span><input type="search" data-picker-search placeholder="Search model, category, or description…" autocomplete="off"></label><div class="pcc2-add-menu-list">'+list+'<div class="pcc2-picker-no-results" data-picker-no-results hidden>No matching devices.</div></div><button type="button" class="secondary pcc2-add-menu-cancel" data-action="picker-cancel">Cancel</button></div>';
}

function cloneDeviceLibrary(lib){return normalizeDeviceLibrary(JSON.parse(JSON.stringify(lib||defaultDeviceLibrary())));}
function libraryBaseList(kind){return kind==='corbus'?BUILTIN_CORBUS_CATALOG:BUILTIN_AUX_CATALOG;}
function libraryCustomList(lib,kind){return kind==='corbus'?lib.customCorbus:lib.customPowered;}
function libraryOverrides(lib,kind){return lib.overrides[kind==='corbus'?'corbus':'powered'];}
function libraryCombinedItems(lib,kind){
  var overrides=libraryOverrides(lib,kind),base=libraryBaseList(kind);
  var built=base.map(function(item){var effective=editableOverride(item,overrides[item.id]);effective.builtinId=item.id;effective.libraryScope='builtin';return effective;});
  var custom=libraryCustomList(lib,kind).map(function(item){var copy=normalizeLibraryEntry(item,kind);copy.libraryScope='custom';return copy;});
  var customId=kind==='corbus'?'custom-corbus':'custom-load';
  built.sort(function(a,b){if(a.id===customId&&b.id!==customId) return -1;if(b.id===customId&&a.id!==customId) return 1;return String(a.model).localeCompare(String(b.model));});
  custom.sort(function(a,b){return String(a.model).localeCompare(String(b.model));});
  return built.concat(custom);
}
function libraryEditorState(){
  if(!picker||picker.kind!=='library') return null;
  if(!picker.editor) picker.editor={draft:cloneDeviceLibrary(deviceLibrary),section:'powered',editing:null,dirty:false};
  return picker.editor;
}
function libraryEditingRecord(editor){
  if(!editor||!editor.editing) return null;var e=editor.editing,kind=e.kind;
  if(e.scope==='builtin'){
    var base=libraryBaseList(kind).filter(function(item){return item.id===e.id;})[0];if(!base) return null;
    return {record:editableOverride(base,libraryOverrides(editor.draft,kind)[e.id]),base:base,scope:'builtin',kind:kind,id:e.id};
  }
  var list=libraryCustomList(editor.draft,kind),record=list.filter(function(item){return item.id===e.id;})[0];
  return record?{record:record,base:null,scope:'custom',kind:kind,id:e.id}:null;
}
function libraryEditorModalHtml(){
  var editor=libraryEditorState();if(!editor) return '';
  var kind=editor.section==='corbus'?'corbus':'powered';var items=libraryCombinedItems(editor.draft,kind);var editing=libraryEditingRecord(editor);
  var rows=items.map(function(item){
    var scope=item.libraryScope||'builtin',key=item.builtinId||item.id;var modified=scope==='builtin'&&!!libraryOverrides(editor.draft,kind)[key];
    var search=(item.model+' '+item.category+' '+item.description).toLowerCase();
    return '<div class="pcc2-library-row '+(editing&&editing.id===key&&editing.scope===scope?'selected':'')+'" data-library-row data-library-search-text="'+esc(search)+'"><div class="pcc2-library-row-main"><strong>'+esc(item.model)+'</strong><small>'+esc(item.category)+' · '+esc(item.description)+'</small></div><b>'+esc(formatMa(item.alarmMa))+'</b><span class="pcc2-library-origin '+scope+'">'+(scope==='builtin'?(modified?'Modified':'Built-in'):'Custom')+'</span><button type="button" class="mini" data-action="library-edit" data-library-kind="'+kind+'" data-library-scope="'+scope+'" data-library-id="'+esc(key)+'">Edit</button>'+(scope==='custom'?'<button type="button" class="mini danger" data-action="library-delete" data-library-kind="'+kind+'" data-library-id="'+esc(key)+'">Delete</button>':(modified?'<button type="button" class="mini" data-action="library-reset-entry" data-library-kind="'+kind+'" data-library-id="'+esc(key)+'">Reset</button>':''))+'</div>';
  }).join('');
  if(!rows) rows='<div class="pcc2-empty">No devices in this library.</div>';
  var form='';
  if(editing){var r=editing.record;form='<div class="pcc2-library-form"><div class="pcc2-library-form-head"><div><strong>'+(editing.scope==='builtin'?'Edit built-in entry':'Edit custom entry')+'</strong><small>Current and descriptive fields affect newly added devices. Built-in capabilities remain protected.</small></div></div><div class="pcc2-library-form-grid"><label><span>Model</span><input type="text" data-library-field="model" value="'+esc(r.model)+'"></label><label><span>Category</span><input type="text" data-library-field="category" value="'+esc(r.category)+'"></label><label class="wide"><span>Description</span><input type="text" data-library-field="description" value="'+esc(r.description)+'"></label><label><span>Normal / standby current (mA)</span><input type="number" min="0" max="10000" step="0.01" data-library-field="standbyMa" value="'+esc(r.standbyMa)+'"></label><label><span>Current / max (mA)</span><input type="number" min="0" max="10000" step="0.01" data-library-field="alarmMa" value="'+esc(r.alarmMa)+'"></label></div></div>';}
  else form='<div class="pcc2-library-form pcc2-library-form-empty"><strong>Select a device to edit</strong><span>Use Add device to create another selectable '+(kind==='corbus'?'CORBUS':'powered')+' device.</span></div>';
  return '<div class="pcc2-picker-backdrop" data-picker-backdrop><div class="pcc2-library-dialog" role="dialog" aria-modal="true" aria-labelledby="pcc2-library-title"><div class="pcc2-library-head"><div><p class="eyebrow">Panel current calculator</p><h2 id="pcc2-library-title">Device Library</h2><p>Manage the devices shown in add-device lists. Changes are saved separately from the current calculation.</p></div><button type="button" class="icon danger" data-action="picker-cancel" aria-label="Close">×</button></div><div class="pcc2-library-toolbar"><div class="pcc2-library-tabs"><button type="button" class="'+(kind==='corbus'?'active':'')+'" data-action="library-tab" data-library-kind="corbus">CORBUS devices</button><button type="button" class="'+(kind==='powered'?'active':'')+'" data-action="library-tab" data-library-kind="powered">Powered devices</button></div><div class="pcc2-library-toolbar-actions"><button type="button" class="secondary" data-action="library-add">+ Add device</button><button type="button" class="secondary" data-action="library-import">Import</button><button type="button" class="secondary" data-action="library-export">Export</button></div></div><label class="pcc2-library-search"><span>Search library</span><input type="search" data-library-search placeholder="Search model, category, or description…" autocomplete="off"></label><div class="pcc2-library-body"><div class="pcc2-library-list" data-library-list>'+rows+'<div class="pcc2-picker-no-results" data-library-no-results hidden>No matching devices.</div></div>'+form+'</div><div class="pcc2-library-footer"><button type="button" class="secondary danger" data-action="library-reset-all">Reset library</button><span>'+(editor.dirty?'Unsaved library changes':'Library is saved')+'</span><div><button type="button" class="secondary" data-action="picker-cancel">Cancel</button><button type="button" class="primary" data-action="library-save" '+(editor.dirty?'':'disabled')+'>Save library</button></div></div></div></div>';
}
function libraryEntryForEditing(editor){
  var info=libraryEditingRecord(editor);if(!info) return null;
  if(info.scope==='custom') return info.record;
  var map=libraryOverrides(editor.draft,info.kind);if(!map[info.id]) map[info.id]=copyEditableCatalogFields(info.base);
  return map[info.id];
}
function deviceLibraryExportPayload(lib){
  var normalized=normalizeDeviceLibrary(lib);function exported(kind){return libraryCombinedItems(normalized,kind).map(function(item){return {builtinId:item.builtinId||null,id:item.builtinId?undefined:item.id,model:item.model,category:item.category,description:item.description,standbyMa:item.standbyMa,alarmMa:item.alarmMa};});}
  return {schemaVersion:DEVICE_LIBRARY_SCHEMA_VERSION,exportedAt:new Date().toISOString(),corbus:exported('corbus'),powered:exported('powered')};
}
function libraryFromExportPayload(raw){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.corbus)||!Array.isArray(raw.powered)) throw new Error('Invalid device library');
  var out=defaultDeviceLibrary();
  [['corbus',raw.corbus],['powered',raw.powered]].forEach(function(pair){var kind=pair[0],list=pair[1],baseIds={};libraryBaseList(kind).forEach(function(item){baseIds[item.id]=item;});list.forEach(function(item){if(!item||typeof item!=='object') return;var builtinId=String(item.builtinId||'');if(builtinId&&baseIds[builtinId]){var proposed=copyEditableCatalogFields(item),base=copyEditableCatalogFields(baseIds[builtinId]);if(JSON.stringify(proposed)!==JSON.stringify(base)) libraryOverrides(out,kind)[builtinId]=proposed;}else{libraryCustomList(out,kind).push(normalizeLibraryEntry(item,kind));}});});
  return normalizeDeviceLibrary(out);
}
function downloadDeviceLibrary(lib){var payload=JSON.stringify(deviceLibraryExportPayload(lib),null,2);var blob=new Blob([payload],{type:'application/json'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='dsc-panel-current-device-library.json';document.body.appendChild(a);a.click();a.remove();window.setTimeout(function(){URL.revokeObjectURL(url);},0);}
function ensureLibraryImportInput(){if(libraryImportInput&&libraryImportInput.isConnected) return libraryImportInput;libraryImportInput=document.createElement('input');libraryImportInput.type='file';libraryImportInput.accept='application/json,.json';libraryImportInput.hidden=true;document.body.appendChild(libraryImportInput);libraryImportInput.addEventListener('change',function(){var file=libraryImportInput.files&&libraryImportInput.files[0];libraryImportInput.value='';if(!file) return;var reader=new FileReader();reader.onload=function(){try{var imported=libraryFromExportPayload(JSON.parse(String(reader.result||'')));if(!picker||picker.kind!=='library') picker={kind:'library',editor:{draft:imported,section:'powered',editing:null,dirty:true}};else{picker.editor.draft=imported;picker.editor.editing=null;picker.editor.dirty=true;}renderPicker();}catch(err){notify('The selected file is not a valid Device Library export.','error');}};reader.readAsText(file);});return libraryImportInput;}

function pickerModalHtml(){
  if(!picker) return '';
  if(picker.kind==='remove-instances') return removeInstancesModalHtml();
  if(picker.kind==='library') return libraryEditorModalHtml();
  if(picker.kind!=='smoke') return pickerMenuHtml();
  var title='Add 2-wire smoke detector';
  var description='Enter the detector values from its installation sheet. You can add other brands as separate rows.';
  var fields='<div class="pcc2-picker-grid"><label><span>Brand</span><input type="text" value="DSC" data-picker-smoke="brand"></label><label><span>Model</span><input type="text" value="FSA-210B" data-picker-smoke="model"></label><label><span>Standby each (mA)</span><input type="number" min="0" max="1000" step="0.001" value="0.02" data-picker-smoke="standbyMa"></label><label><span>Alarm each (mA)</span><input type="number" min="0" max="1000" step="0.1" value="35" data-picker-smoke="alarmMa"></label><label><span>Quantity</span><input type="number" min="1" max="'+esc(Math.max(1,18-pgmSmokeQuantity(state.pgms.PGM2)))+'" step="1" value="1" data-picker-smoke="quantity"></label></div>';
  return '<div class="pcc2-picker-backdrop" data-picker-backdrop><div class="pcc2-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="pcc2-picker-title"><div class="pcc2-picker-head"><div><p class="eyebrow">Panel current calculator</p><h2 id="pcc2-picker-title">'+esc(title)+'</h2><p>'+esc(description)+'</p></div><button type="button" class="icon danger" data-action="picker-cancel" aria-label="Cancel">×</button></div><div class="pcc2-picker-fields">'+fields+'</div><div class="pcc2-picker-actions"><button type="button" class="secondary" data-action="picker-cancel">Cancel</button><button type="button" class="primary" data-action="picker-confirm">Add</button></div></div></div>';
}

function cancelFastSearchFilter(){
  if(fastSearchFrame){
    if(window.cancelAnimationFrame) window.cancelAnimationFrame(fastSearchFrame); else window.clearTimeout(fastSearchFrame);
  }
  fastSearchFrame=0;fastSearchRequest=null;
}
function ensurePickerPortal(){
  if(pickerPortal&&pickerPortal.isConnected) return pickerPortal;
  pickerPortal=document.getElementById('panelCurrentCalculatorPickerPortal');
  if(!pickerPortal){
    pickerPortal=document.createElement('div');
    pickerPortal.id='panelCurrentCalculatorPickerPortal';
    pickerPortal.setAttribute('data-pcc-picker-portal','');
    document.body.appendChild(pickerPortal);
  }
  return pickerPortal;
}
function renderPicker(){
  cancelFastSearchFilter();
  var portal=ensurePickerPortal();
  portal.innerHTML=pickerModalHtml();
}
function refreshCorbusTable(sourceId){
  if(!host) return false;
  sourceId=String(sourceId||'panel');
  var section=sourceId==='panel'?host.querySelector('#pcc-corbus'):host.querySelector('#pcc-local-'+sourceId);
  if(!section) return false;
  var tbody=section.querySelector('.pcc2-table tbody');if(!tbody) return false;
  var rows=corbusRowsHtml(sourceId,sourceId!=='panel');
  tbody.innerHTML=rows||'<tr><td colspan="6"><div class="pcc2-empty">No CORBUS devices added to this source.</div></td></tr>';
  return true;
}
function syncSectionCollapseDom(button,sectionKey){
  if(!button) return false;
  var collapsed=sectionCollapsed(sectionKey);
  var section=button.closest&&button.closest('.pcc2-collapsible-section,.pcc2-system-shell');if(!section) return false;
  section.classList.toggle('is-collapsed',collapsed);
  button.setAttribute('aria-expanded',collapsed?'false':'true');
  var title=String(button.getAttribute('title')||button.getAttribute('aria-label')||'section').replace(/^(Expand|Collapse)\s+/,'');
  button.setAttribute('title',(collapsed?'Expand ':'Collapse ')+title);button.setAttribute('aria-label',(collapsed?'Expand ':'Collapse ')+title);
  var body=null;
  if(section.classList.contains('pcc2-system-shell')){for(var i=0;i<section.children.length;i++){if(section.children[i].classList&&section.children[i].classList.contains('pcc2-system-shell-body')){body=section.children[i];break;}}}
  else{var bodies=section.querySelectorAll('[data-pcc-section-body]');for(var j=0;j<bodies.length;j++){if(bodies[j].getAttribute('data-pcc-section-body')===sectionKey){body=bodies[j];break;}}}
  if(body) body.hidden=collapsed;
  return true;
}

function renderHeader(){
  var header=document.getElementById('panelCurrentCalculatorHeaderControls');if(header) header.innerHTML=panelModelHeaderHtml()+toolbarHtml()+calculatorSettingsButtonHtml();
}
function renderTopNavigation(){
  if(!host) return false;
  var current=host.querySelector('.pcc2-sticky-tools');if(!current) return false;
  current.outerHTML=topHtml();
  return true;
}
function render(){
  if(!host) return;
  renderHeader();
  var panelHtml=calculatorToolVisible('panel-shell')?panelCalculator():'';
  var localHtml=powerModules().map(function(module){return calculatorToolVisible(powerSectionKey(module))?localCalculator(module):'';}).join('');
  host.innerHTML=calculatorSettingsPanelHtml()+'<div class="pcc2-toast" data-pcc-toast></div>'+topHtml()+panelHtml+localHtml+'<div class="pcc2-reference"><strong>Calculation basis</strong><span>The main panel is checked against its 700 mA maximum and 1,000 mA communicator-transmit total. Each HSM2300 and HSM2204 is checked separately against its own 1,000 mA downstream supply budget. Only the main panel PGM2 supports 2-wire smoke mode.</span></div>';
  if(navSettingsOpen){if(window.requestAnimationFrame) window.requestAnimationFrame(positionCalculatorSettingsSurface);else positionCalculatorSettingsSurface();}
  renderPicker();refreshLastAddedEffect();
}
function scrollToCalculatorTool(sectionKey,behavior){
  if(!host) return;
  var panel=host.querySelector('[data-pcc-section="'+String(sectionKey||'')+'"]');
  if(!panel) return;
  var nav=host.querySelector('.pcc2-sticky-tools');
  var navHeight=nav?nav.getBoundingClientRect().height:50;
  var stickyTop=68;
  if(nav&&window.getComputedStyle){var parsedTop=parseFloat(window.getComputedStyle(nav).top||'');if(Number.isFinite(parsedTop)) stickyTop=parsedTop;}
  var view=panel.closest&&panel.closest('.view.active'),viewScrollable=false;
  if(view&&window.getComputedStyle){var overflowY=window.getComputedStyle(view).overflowY||'';viewScrollable=/(auto|scroll)/.test(overflowY)&&view.scrollHeight>view.clientHeight+1;}
  if(viewScrollable){
    var viewRect=view.getBoundingClientRect(),panelRect=panel.getBoundingClientRect();
    var targetTop=Math.max(0,view.scrollTop+(panelRect.top-viewRect.top)-stickyTop-navHeight-8);
    if(view.scrollTo){try{view.scrollTo({top:targetTop,behavior:behavior||'smooth'});}catch(error){view.scrollTop=targetTop;}}else view.scrollTop=targetTop;
    return;
  }
  var rect=panel.getBoundingClientRect(),currentY=window.pageYOffset!=null?window.pageYOffset:((document.documentElement&&document.documentElement.scrollTop)||0);
  var targetY=Math.max(0,currentY+rect.top-stickyTop-navHeight-8);
  if(window.scrollTo){try{window.scrollTo({top:targetY,behavior:behavior||'smooth'});}catch(error){window.scrollTo(0,targetY);}}else if(panel.scrollIntoView) panel.scrollIntoView({block:'start',behavior:behavior||'smooth'});
}
function scheduleCalculatorToolNavigation(sectionKey){
  var fn=function(){scrollToCalculatorTool(sectionKey,'smooth');};
  if(window.requestAnimationFrame) window.requestAnimationFrame(function(){window.requestAnimationFrame(fn);});
  else window.setTimeout(fn,0);
}
function scrollElementWithCalculatorOffset(element,behavior){
  if(!host||!element) return;
  var nav=host.querySelector('.pcc2-sticky-tools');var navHeight=nav?nav.getBoundingClientRect().height:50;var stickyTop=68;
  if(nav&&window.getComputedStyle){var parsedTop=parseFloat(window.getComputedStyle(nav).top||'');if(Number.isFinite(parsedTop)) stickyTop=parsedTop;}
  var view=element.closest&&element.closest('.view.active'),viewScrollable=false;
  if(view&&window.getComputedStyle){var overflowY=window.getComputedStyle(view).overflowY||'';viewScrollable=/(auto|scroll)/.test(overflowY)&&view.scrollHeight>view.clientHeight+1;}
  if(viewScrollable){var viewRect=view.getBoundingClientRect(),elementRect=element.getBoundingClientRect();var targetTop=Math.max(0,view.scrollTop+(elementRect.top-viewRect.top)-stickyTop-navHeight-12);if(view.scrollTo){try{view.scrollTo({top:targetTop,behavior:behavior||'smooth'});}catch(error){view.scrollTop=targetTop;}}else view.scrollTop=targetTop;return;}
  var rect=element.getBoundingClientRect(),currentY=window.pageYOffset!=null?window.pageYOffset:((document.documentElement&&document.documentElement.scrollTop)||0);var targetY=Math.max(0,currentY+rect.top-stickyTop-navHeight-12);if(window.scrollTo){try{window.scrollTo({top:targetY,behavior:behavior||'smooth'});}catch(error){window.scrollTo(0,targetY);}}else if(element.scrollIntoView) element.scrollIntoView({block:'start',behavior:behavior||'smooth'});
}
function findInstanceRow(deviceId,instance){
  if(!host) return null;var rows=host.querySelectorAll('[data-device-instance-row]');for(var i=0;i<rows.length;i++) if(rows[i].getAttribute('data-device-instance-row')===String(deviceId)&&number(rows[i].getAttribute('data-instance'),0)===number(instance,0)) return rows[i];return null;
}
function findAttachedLoadRow(deviceId,instance){
  if(!host) return null;var rows=host.querySelectorAll('.pcc2-child-row[data-parent-device]');for(var i=0;i<rows.length;i++) if(rows[i].getAttribute('data-parent-device')===String(deviceId)&&number(rows[i].getAttribute('data-parent-instance'),0)===number(instance,0)) return rows[i];return null;
}
function scheduleAttachmentNavigation(deviceId,instance){
  var fn=function(){scrollElementWithCalculatorOffset(findAttachedLoadRow(deviceId,instance)||findInstanceRow(deviceId,instance),'smooth');};if(window.requestAnimationFrame) window.requestAnimationFrame(function(){window.requestAnimationFrame(fn);});else window.setTimeout(fn,0);
}
function scheduleIssueTargetNavigation(deviceId,instance,sectionKey){
  var fn=function(){var target=null;if(deviceId&&instance) target=findInstanceRow(deviceId,instance);if(!target&&deviceId&&host) target=host.querySelector('[data-device-row="'+String(deviceId).replace(/"/g,'\\"')+'"]');if(target) scrollElementWithCalculatorOffset(target,'smooth');else if(sectionKey) scrollToCalculatorTool(sectionKey,'smooth');};if(window.requestAnimationFrame) window.requestAnimationFrame(function(){window.requestAnimationFrame(fn);});else window.setTimeout(fn,0);
}
function markCurrentCalculatorTool(sectionKey){
  if(!host) return;
  var wanted=String(sectionKey||''),groupKey=calculatorNavGroupForSection(wanted);
  host.querySelectorAll('.pcc2-tools-drawer').forEach(function(drawer){
    var isGroup=drawer.getAttribute('data-pcc-drawer')===groupKey;
    var parent=drawer.querySelector('.pcc2-tools-drawer-parent');if(parent) parent.classList.toggle('current',isGroup);
  });
  host.querySelectorAll('[data-pcc-nav-target],[data-pcc-tool],[data-pcc-drawer-target]:not([data-pcc-drawer-toggle])').forEach(function(button){
    var target=button.getAttribute('data-pcc-nav-target')||button.getAttribute('data-pcc-tool')||button.getAttribute('data-pcc-drawer-target');
    var current=target===wanted;button.classList.toggle('current',current);
    var item=button.closest&&button.closest('.pcc2-tools-navigation-item');if(item&&!item.classList.contains('pcc2-tools-drawer-parent')) item.classList.toggle('current',current);
  });
}
function createLoad(catalogId,kind,outputId,parentInstance){var c=auxIndex[catalogId]||auxIndex['custom-load'];return normalizeLoad({id:id('load'),catalogId:c.id,category:c.category,model:c.model,description:c.description,standbyMa:c.standbyMa,alarmMa:c.alarmMa,quantity:1,kind:kind||'load',outputId:outputId||'',parentInstance:parentInstance||1});}
function createDevice(sourceId,modelId){var c=corbusIndex[modelId]||corbusIndex.hs2lcd;return normalizeDevice({id:id('device'),sourceId:sourceId,modelId:c.id,category:c.category,model:c.model,description:c.description,standbyMa:c.standbyMa,alarmMa:c.alarmMa,quantity:1,children:[]});}
function firstAvailableModel(sourceId){var ordered=orderedCatalog(CORBUS_CATALOG);for(var i=0;i<ordered.length;i++){var c=ordered[i];if(sourceId!=='panel'&&c.powerModule) continue;if(canUseModel(c.id,'')) return c.id;}return '';}
function leastLoadedInstance(device,kind){var selected=1;var lowest=Infinity;for(var instance=1;instance<=device.quantity;instance++){var used=childTotals(device,'alarm',kind,'',instance);if(used<lowest){lowest=used;selected=instance;}}return selected;}
function firstFreeDeviceOutput(device,parentInstance){
  var c=deviceCatalog(device);if(!c.hasOutputs) return '';
  var used={};device.children.filter(function(load){return load.kind==='device-output'&&load.parentInstance===parentInstance;}).forEach(function(load){used[load.outputId]=true;});
  for(var i=1;i<=c.outputCount;i++) if(!used['O'+i]) return 'O'+i;
  return 'O1';
}
function groupedDevice(sourceId,modelId,extraPower){var c=corbusIndex[modelId];if(!c||c.powerModule||c.custom) return null;var wantedExtra=c.id==='hs2tchp'&&extraPower===true;for(var i=0;i<state.corbus.length;i++){var device=state.corbus[i];if(device.sourceId===sourceId&&device.modelId===modelId&&(!(c.id==='hs2tchp')||device.extraPower===wantedExtra)) return device;}return null;}
function ensureLocalStructures(device){var c=deviceCatalog(device);if(!c.powerModule) return;if(!state.localAux[device.id]) state.localAux[device.id]=[];if(c.id==='hsm2204'&&!state.localPgms[device.id]) state.localPgms[device.id]={O1:[],O2:[],O3:[],O4:[]};}
function removeDeviceBranch(deviceId){
  var remove={};function mark(idValue){remove[idValue]=true;state.corbus.forEach(function(d){if(d.sourceId===idValue&&!remove[d.id]) mark(d.id);});}mark(deviceId);
  state.corbus=state.corbus.filter(function(d){return !remove[d.id];});Object.keys(remove).forEach(function(key){delete state.localAux[key];delete state.localPgms[key];});
}
function instanceLoadSummary(device,instance){
  var rows=childRowsForInstance(device,instance);var qty=rows.reduce(function(sum,load){return sum+Math.max(1,number(load.quantity,1));},0);var total=childTotals(device,'alarm','','',instance);
  return {rows:rows,quantity:qty,total:total,models:instanceModelsSummary(rows)};
}
function clearInstanceCollapseState(device){
  if(!state.collapsedSections) return;
  Object.keys(state.collapsedSections).forEach(function(key){if(key.indexOf('attachment-instance-'+device.id+'-')===0) delete state.collapsedSections[key];});
}
function removeDeviceInstances(device,instances){
  var selected={};instances.forEach(function(value){selected[Math.max(1,Math.floor(number(value,1)))]=true;});
  var removed=Object.keys(selected).map(Number).filter(function(value){return value>=1&&value<=device.quantity;}).sort(function(a,b){return a-b;});
  if(!removed.length) return;
  if(removed.length>=device.quantity){removeDeviceBranch(device.id);return;}
  device.children=device.children.filter(function(load){return !selected[load.parentInstance];});
  device.children.forEach(function(load){var shift=removed.filter(function(value){return value<load.parentInstance;}).length;load.parentInstance=Math.max(1,load.parentInstance-shift);});
  device.quantity=Math.max(1,device.quantity-removed.length);
  clearInstanceCollapseState(device);
  if(!device.children.length&&state.collapsedSections) state.collapsedSections[attachmentKey(device)]=true;
}
function moveDeviceInstanceVariant(device,instance,extraPower){
  var c=deviceCatalog(device);if(!device||c.id!=='hs2tchp') return null;
  instance=Math.min(device.quantity,Math.max(1,Math.floor(number(instance,1))));extraPower=extraPower===true;
  if(device.extraPower===extraPower) return device;
  var movingLoads=device.children.filter(function(load){return load.parentInstance===instance;});
  var target=groupedDevice(device.sourceId,device.modelId,extraPower);
  if(!target){target=createDevice(device.sourceId,device.modelId);target.extraPower=extraPower;state.corbus.push(target);}else target.quantity++;
  var targetInstance=target.quantity;
  movingLoads.forEach(function(load){device.children=device.children.filter(function(item){return item.id!==load.id;});load.parentInstance=targetInstance;target.children.push(load);});
  if(device.quantity===1){state.corbus=state.corbus.filter(function(item){return item.id!==device.id;});}
  else{
    device.children.forEach(function(load){if(load.parentInstance>instance) load.parentInstance--;});
    device.quantity--;
  }
  clearInstanceCollapseState(device);clearInstanceCollapseState(target);
  if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[deviceGroupKey(target)]=false;state.collapsedSections[attachmentInstanceKey(target,targetInstance)]=false;
  return target;
}
function openInstanceRemovalPicker(device,targetQuantity){
  var removeCount=device.quantity-targetQuantity;if(removeCount<=0) return false;
  picker={kind:'remove-instances',deviceId:device.id,targetQuantity:targetQuantity,removeCount:removeCount,selectedInstances:[]};
  renderPicker();return true;
}
function removeInstancesModalHtml(){
  var device=picker&&findDevice(picker.deviceId);if(!device) return '';
  var c=deviceCatalog(device);var selected=picker.selectedInstances||[];var selectedMap={};selected.forEach(function(value){selectedMap[value]=true;});
  var cards='';
  for(var instance=1;instance<=device.quantity;instance++){
    var summary=instanceLoadSummary(device,instance);var loadText=summary.quantity?summary.quantity+' connected '+(summary.quantity===1?'device':'devices')+' · '+formatMa(summary.total):'No connected loads';
    var details=summary.quantity?'<small>'+esc(summary.models)+'</small>':'<small>This instance can be removed without deleting an attached load.</small>';
    cards+='<label class="pcc2-remove-instance-card '+(selectedMap[instance]?'is-selected':'')+'"><input type="checkbox" value="'+instance+'" data-remove-instance-select '+(selectedMap[instance]?'checked':'')+'><span class="pcc2-remove-instance-check" aria-hidden="true"></span><span class="pcc2-remove-instance-copy"><strong>'+esc(c.model)+' #'+instance+'</strong><b>'+esc(loadText)+'</b>'+details+'</span></label>';
  }
  var exact=selected.length===picker.removeCount;
  var description='Select '+picker.removeCount+' physical '+(picker.removeCount===1?'instance':'instances')+' to remove. Any loads attached to a selected instance will also be deleted; the remaining instances will be renumbered.';
  return '<div class="pcc2-picker-backdrop" data-picker-backdrop><div class="pcc2-picker-dialog pcc2-remove-instance-dialog" role="dialog" aria-modal="true" aria-labelledby="pcc2-picker-title"><div class="pcc2-picker-head"><div><p class="eyebrow">Panel current calculator</p><h2 id="pcc2-picker-title">Remove '+esc(c.model)+' instance</h2><p>'+esc(description)+'</p></div><button type="button" class="icon danger" data-action="picker-cancel" aria-label="Cancel">×</button></div><div class="pcc2-remove-instance-status '+(exact?'is-ready':'')+'"><strong>'+selected.length+' selected</strong><span>'+picker.removeCount+' required · quantity '+device.quantity+' → '+picker.targetQuantity+'</span></div><div class="pcc2-remove-instance-list">'+cards+'</div><div class="pcc2-picker-actions"><button type="button" class="secondary" data-action="picker-cancel">Cancel</button><button type="button" class="primary danger" data-action="picker-remove-confirm" '+(exact?'':'disabled')+'>Remove selected</button></div></div></div>';
}
function contextLoads(context){
  var parts=String(context||'').split(':');
  if(parts[0]==='panelaux') return state.aux;
  if(parts[0]==='panelpgm') return state.pgms[parts[1]].loads;
  if(parts[0]==='localaux') return state.localAux[parts[1]]||(state.localAux[parts[1]]=[]);
  if(parts[0]==='localpgm'){if(!state.localPgms[parts[1]]) state.localPgms[parts[1]]={O1:[],O2:[],O3:[],O4:[]};return state.localPgms[parts[1]][parts[2]]||(state.localPgms[parts[1]][parts[2]]=[]);}
  return null;
}
function findLoad(list,loadId){for(var i=0;i<list.length;i++) if(list[i].id===loadId) return list[i];return null;}
function childLoad(device,loadId){return findLoad(device.children,loadId);}
function applyCatalogToLoad(load,catalogId){var c=auxIndex[catalogId]||auxIndex['custom-load'];load.catalogId=c.id;load.category=c.category;load.model=c.model;load.description=c.description;load.standbyMa=c.standbyMa;load.alarmMa=c.alarmMa;}
function addAudioStation(device,size,parentInstance){
  var small=size!=='large';var catalogId=small?'audio-small':'audio-large';parentInstance=Math.min(device.quantity,Math.max(1,parentInstance||1));
  var totalQty=childQuantity(device,'audio-station',parentInstance);var largeQty=childQuantity(device,'audio-station',parentInstance,'audio-large');
  if(totalQty>=4){notify(deviceCatalog(device).model+' #'+parentInstance+' already has the maximum of 4 audio stations.','error');return false;}
  if(!small&&largeQty>=2){notify(deviceCatalog(device).model+' #'+parentInstance+' already has the maximum of 2 large audio stations.','error');return false;}
  var existing=device.children.filter(function(l){return l.kind==='audio-station'&&l.catalogId===catalogId&&l.parentInstance===parentInstance;})[0];
  if(existing) existing.quantity++; else device.children.push(normalizeLoad({id:id('load'),catalogId:catalogId,category:'Audio Stations',model:small?'PC5961E':'PC5964E',description:small?'Small audio station':'Large audio station',standbyMa:30,alarmMa:small?100:190,quantity:1,kind:'audio-station',parentInstance:parentInstance}));
  return true;
}

function calculatorToolUsesSectionCollapse(key){
  key=String(key||'');
  return ['corbus-panel','aux-panel','pgms','pclink'].indexOf(key)>=0||key.indexOf('corbus-')===0||key.indexOf('aux-')===0||key.indexOf('local-pgms-')===0;
}
function calculatorToolParentCollapseKey(key){
  key=String(key||'');
  if(['panel-overview','corbus-panel','aux-panel','pgms','pclink'].indexOf(key)>=0) return 'panel-shell';
  if(key.indexOf('local-shell-')===0) return 'local-shell-collapse-'+key.slice('local-shell-'.length);
  if(key.indexOf('corbus-')===0&&key!=='corbus-panel') return 'local-shell-collapse-'+key.slice('corbus-'.length);
  if(key.indexOf('aux-')===0&&key!=='aux-panel') return 'local-shell-collapse-'+key.slice('aux-'.length);
  if(key.indexOf('local-pgms-')===0) return 'local-shell-collapse-'+key.slice('local-pgms-'.length);
  return '';
}
function calculatorNavShellKey(key){
  var groupKey=calculatorNavGroupForSection(key);
  return groupKey==='panel'?'':('local-shell-'+groupKey);
}
function prepareCalculatorNavTarget(key){
  key=String(key||'panel-overview');
  var shellKey=calculatorNavShellKey(key);
  if(shellKey) setCalculatorToolVisible(shellKey,true); else if(['panel-overview','corbus-panel','aux-panel','pgms','pclink'].indexOf(key)>=0){setCalculatorToolVisible('panel-shell',true);if(key!=='panel-overview') setCalculatorToolVisible(key,true);}
  var parentKey=calculatorToolParentCollapseKey(key);if(parentKey) expandSectionState(parentKey);
  if(calculatorToolUsesSectionCollapse(key)) expandSectionState(key);
}

function onClick(event){
  var backdrop=event.target.closest&&event.target.closest('[data-picker-backdrop]');
  if(backdrop&&event.target===backdrop){picker=null;renderPicker();return;}
  var drawerToggle=event.target.closest&&event.target.closest('[data-pcc-drawer-toggle]');
  if(drawerToggle){
    event.preventDefault();event.stopPropagation();
    var drawerKey=String(drawerToggle.getAttribute('data-pcc-drawer-toggle')||'panel-shell');
    var drawerTarget=String(drawerToggle.getAttribute('data-pcc-drawer-target')||'panel-overview');
    var willOpen=!calculatorToolVisible(drawerKey);
    setCalculatorToolVisible(drawerKey,willOpen);
    if(willOpen){var drawerParentCollapse=calculatorToolParentCollapseKey(drawerTarget);if(drawerParentCollapse) expandSectionState(drawerParentCollapse);state.activeToolSection=drawerTarget;}
    save();render();if(willOpen) scheduleCalculatorToolNavigation(drawerTarget);return;
  }
  var drawerTargetButton=event.target.closest&&event.target.closest('[data-pcc-drawer-target]:not([data-pcc-drawer-toggle])');
  if(drawerTargetButton){
    event.preventDefault();event.stopPropagation();
    var drawerGroupKey=String(drawerTargetButton.getAttribute('data-pcc-drawer-nav')||calculatorNavGroupForSection(drawerTargetButton.getAttribute('data-pcc-drawer-target')||'panel-overview'));
    var drawerParentTarget=String(drawerTargetButton.getAttribute('data-pcc-drawer-target')||(drawerGroupKey==='panel'?'panel-overview':'local-shell-'+drawerGroupKey));
    var drawerParentWillOpen=toggleCalculatorNavParent(drawerGroupKey);var drawerParentTargetPresent=!!(host&&host.querySelector('[data-pcc-section="'+drawerParentTarget+'"]'));
    if(drawerParentWillOpen){if(!drawerParentTargetPresent) prepareCalculatorNavTarget(drawerParentTarget);state.activeToolSection=drawerParentTarget;}
    save();if(drawerParentTargetPresent){if(!renderTopNavigation()) render();}else render();if(drawerParentWillOpen) scheduleCalculatorToolNavigation(drawerParentTarget);return;
  }
  var navGroupButton=event.target.closest&&event.target.closest('[data-pcc-nav-group]');
  if(navGroupButton){
    event.preventDefault();event.stopPropagation();
    var groupKey=String(navGroupButton.getAttribute('data-pcc-nav-group')||'panel');
    var groupTarget=String(navGroupButton.getAttribute('data-pcc-nav-target')||(groupKey==='panel'?'panel-overview':'local-shell-'+groupKey));
    prepareCalculatorNavTarget(groupTarget);state.activeToolSection=groupTarget;save();render();scheduleCalculatorToolNavigation(groupTarget);return;
  }
  var navTargetButton=event.target.closest&&event.target.closest('[data-pcc-nav-target]:not([data-pcc-nav-group])');
  if(navTargetButton){
    event.preventDefault();event.stopPropagation();
    var navTarget=String(navTargetButton.getAttribute('data-pcc-nav-target')||'panel-overview');
    prepareCalculatorNavTarget(navTarget);state.activeToolSection=navTarget;save();render();scheduleCalculatorToolNavigation(navTarget);return;
  }
  var toolButton=event.target.closest&&event.target.closest('[data-pcc-tool]');
  if(toolButton){
    event.preventDefault();event.stopPropagation();
    var toolKey=String(toolButton.getAttribute('data-pcc-tool')||'panel-overview');
    var parentCollapseKey=calculatorToolParentCollapseKey(toolKey),wasParentCollapsed=parentCollapseKey&&sectionCollapsed(parentCollapseKey);
    var wasVisible=calculatorToolVisible(toolKey),wasCollapsed=calculatorToolUsesSectionCollapse(toolKey)&&sectionCollapsed(toolKey);
    setCalculatorToolVisible(toolKey,true);if(wasCollapsed) expandSectionState(toolKey);if(parentCollapseKey) expandSectionState(parentCollapseKey);state.activeToolSection=toolKey;save();
    if(!wasVisible||wasCollapsed||wasParentCollapsed) render();else markCurrentCalculatorTool(toolKey);
    scheduleCalculatorToolNavigation(toolKey);return;
  }
  var toolToggle=event.target.closest&&event.target.closest('[data-pcc-tool-toggle]');
  if(toolToggle){
    event.preventDefault();event.stopPropagation();
    var toggleKey=String(toolToggle.getAttribute('data-pcc-tool-toggle')||'panel-overview');
    var willShow=!calculatorToolVisible(toggleKey),toggleParentKey=calculatorToolParentCollapseKey(toggleKey);
    setCalculatorToolVisible(toggleKey,willShow);if(willShow&&calculatorToolUsesSectionCollapse(toggleKey)) expandSectionState(toggleKey);if(willShow&&toggleParentKey) expandSectionState(toggleParentKey);
    if(willShow) state.activeToolSection=toggleKey;else if(state.activeToolSection===toggleKey){var hiddenGroup=calculatorNavGroupForSection(toggleKey);state.activeToolSection=hiddenGroup==='panel'?'panel-overview':'local-shell-'+hiddenGroup;}
    save();render();if(willShow) scheduleCalculatorToolNavigation(toggleKey);return;
  }
  var insideMenu=event.target.closest&&event.target.closest('[data-picker-menu]');
  var el=event.target.closest('[data-action]');
  var pendingAction=el&&el.getAttribute('data-action');
  if(picker&&picker.kind!=='smoke'&&picker.kind!=='remove-instances'&&picker.kind!=='library'&&!insideMenu&&['add-corbus','add-load','add-child','add-audio'].indexOf(pendingAction)<0){
    picker=null;
    renderPicker();
  }
  if(!el) return;var action=pendingAction;
  if(action==='expand-all'){setAllSectionsCollapsed(false);save();render();return;}
  if(action==='collapse-all'){setAllSectionsCollapsed(true);save();render();return;}
  if(action==='toggle-accounting-totals'){state.showAccountingTotals=state.showAccountingTotals===false;setAllCorbusSectionDisplayValues('showTotals',state.showAccountingTotals);save();render();return;}
  if(action==='toggle-corbus-category-rows'){state.showCorbusCategoryRows=state.showCorbusCategoryRows===false;setAllCorbusSectionDisplayValues('showCategories',state.showCorbusCategoryRows);save();render();return;}
  if(action==='toggle-terminals'){state.showTerminals=state.showTerminals===false;save();render();return;}
  if(action==='toggle-section-totals'){var totalsSource=String(el.getAttribute('data-source')||'panel');setCorbusSectionDisplayValue(totalsSource,'showTotals',!corbusSectionDisplayValue(totalsSource,'showTotals'));save();render();return;}
  if(action==='toggle-section-categories'){var categoriesSource=String(el.getAttribute('data-source')||'panel');setCorbusSectionDisplayValue(categoriesSource,'showCategories',!corbusSectionDisplayValue(categoriesSource,'showCategories'));save();render();return;}
  if(action==='toggle-nav-settings'){navSettingsOpen=!navSettingsOpen;syncCalculatorSettingsSurface();return;}
  if(action==='open-device-library'){navSettingsOpen=false;picker={kind:'library',editor:{draft:cloneDeviceLibrary(deviceLibrary),section:'powered',editing:null,dirty:false}};syncCalculatorSettingsSurface();renderPicker();return;}
  if(action==='library-tab'){var tabEditor=libraryEditorState();if(!tabEditor) return;tabEditor.section=el.getAttribute('data-library-kind')==='corbus'?'corbus':'powered';tabEditor.editing=null;renderPicker();return;}
  if(action==='library-add'){var addEditor=libraryEditorState();if(!addEditor) return;var addKind=addEditor.section==='corbus'?'corbus':'powered';var newEntry=normalizeLibraryEntry({id:libraryId(addKind==='corbus'?'user-corbus':'user-load'),model:addKind==='corbus'?'New CORBUS device':'New powered device',category:addKind==='corbus'?'Custom CORBUS Devices':'Custom Devices',description:'User-defined device.',standbyMa:0,alarmMa:0},addKind);libraryCustomList(addEditor.draft,addKind).unshift(newEntry);addEditor.editing={kind:addKind,scope:'custom',id:newEntry.id};addEditor.dirty=true;renderPicker();return;}
  if(action==='library-edit'){var editEditor=libraryEditorState();if(!editEditor) return;editEditor.editing={kind:el.getAttribute('data-library-kind')==='corbus'?'corbus':'powered',scope:el.getAttribute('data-library-scope')==='custom'?'custom':'builtin',id:String(el.getAttribute('data-library-id')||'')};renderPicker();return;}
  if(action==='library-delete'){var delEditor=libraryEditorState();if(!delEditor) return;var delKind=el.getAttribute('data-library-kind')==='corbus'?'corbus':'powered',delId=String(el.getAttribute('data-library-id')||'');var delList=libraryCustomList(delEditor.draft,delKind),delItem=delList.filter(function(item){return item.id===delId;})[0];if(!delItem) return;if(!window.confirm('Delete '+delItem.model+' from the Device Library? Existing calculator rows will not be deleted.')) return;if(delKind==='corbus') delEditor.draft.customCorbus=delList.filter(function(item){return item.id!==delId;});else delEditor.draft.customPowered=delList.filter(function(item){return item.id!==delId;});if(delEditor.editing&&delEditor.editing.id===delId) delEditor.editing=null;delEditor.dirty=true;renderPicker();return;}
  if(action==='library-reset-entry'){var resetEditor=libraryEditorState();if(!resetEditor) return;var resetKind=el.getAttribute('data-library-kind')==='corbus'?'corbus':'powered',resetId=String(el.getAttribute('data-library-id')||'');delete libraryOverrides(resetEditor.draft,resetKind)[resetId];resetEditor.editing={kind:resetKind,scope:'builtin',id:resetId};resetEditor.dirty=true;renderPicker();return;}
  if(action==='library-reset-all'){var resetAllEditor=libraryEditorState();if(!resetAllEditor) return;if(!window.confirm('Reset the Device Library to its built-in defaults and remove all custom library devices? Existing calculator rows will not be deleted.')) return;resetAllEditor.draft=defaultDeviceLibrary();resetAllEditor.editing=null;resetAllEditor.dirty=true;renderPicker();return;}
  if(action==='library-import'){ensureLibraryImportInput().click();return;}
  if(action==='library-export'){var exportEditor=libraryEditorState();if(!exportEditor) return;downloadDeviceLibrary(exportEditor.draft);return;}
  if(action==='library-save'){var saveEditor=libraryEditorState();if(!saveEditor) return;persistDeviceLibrary(saveEditor.draft);picker=null;cleanupState(state);save();render();notify('Device Library saved.','success');return;}
  if(action==='toggle-nav-wrap'){state.navWrap=state.navWrap===false;save();render();return;}
  if(action==='toggle-nav-keep-parents'){
    state.navKeepParentsOpen=state.navKeepParentsOpen!==true;
    if(!state.navKeepParentsOpen) collapseNavigationParentsTo(calculatorNavGroupForSection(state.activeToolSection));
    save();render();return;
  }
  if(action==='toggle-section'){
    var sectionKey=String(el.getAttribute('data-section-key')||'');if(!sectionKey) return;
    if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[sectionKey]=!sectionCollapsed(sectionKey);save();if(!syncSectionCollapseDom(el,sectionKey)) render();return;
  }
  if(action==='toggle-inline-issue'){
    var inlineKey=String(el.getAttribute('data-issue-key')||'');if(!inlineKey) return;
    if(!state.collapsedSections) state.collapsedSections={};var stateKey=issueStateKey(inlineKey);state.collapsedSections[stateKey]=!inlineIssueOpen(inlineKey);save();render();return;
  }
  if(action==='reveal-issue-target'){
    var issueDeviceId=String(el.getAttribute('data-issue-device')||''),issueInstance=Math.max(0,Math.floor(number(el.getAttribute('data-issue-instance'),0))),issueSectionKey=String(el.getAttribute('data-issue-section')||'');
    if(issueDeviceId){var issueDevice=findDevice(issueDeviceId);if(issueDevice){if(issueInstance) setAttachmentExpanded(issueDevice,issueInstance);else{expandSourceCircuit(issueDevice.sourceId);if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[familyGroupKey(issueDevice.sourceId,deviceFamilyKey(deviceCatalog(issueDevice)))]=false;state.collapsedSections[deviceGroupKey(issueDevice)]=false;}issueSectionKey=issueSectionKey||(issueDevice.sourceId==='panel'?'corbus-panel':'corbus-'+issueDevice.sourceId);}}
    if(issueSectionKey){prepareCalculatorNavTarget(issueSectionKey);state.activeToolSection=issueSectionKey;}
    save();render();scheduleIssueTargetNavigation(issueDeviceId,issueInstance,issueSectionKey);return;
  }
  if(action==='toggle-corbus-family'){
    var familySource=String(el.getAttribute('data-source')||'panel');var familyName=String(el.getAttribute('data-family')||'');if(!familyMeta(familyName)) return;
    if(!state.collapsedSections) state.collapsedSections={};var familyKey=familyGroupKey(familySource,familyName);state.collapsedSections[familyKey]=!familyGroupCollapsed(familySource,familyName);save();if(!refreshCorbusTable(familySource)) render();return;
  }
  if(action==='toggle-device-group'){
    var groupDevice=findDevice(el.getAttribute('data-device'));if(!groupDevice) return;
    if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[deviceGroupKey(groupDevice)]=!deviceGroupCollapsed(groupDevice);save();if(!refreshCorbusTable(groupDevice.sourceId)) render();return;
  }
  if(action==='reveal-attachment-instance'){
    var revealDevice=findDevice(el.getAttribute('data-device'));if(!revealDevice) return;var revealInstance=Math.max(1,Math.floor(number(el.getAttribute('data-instance'),1)));
    setAttachmentExpanded(revealDevice,revealInstance);expandSourceCircuit(revealDevice.sourceId);state.activeToolSection=revealDevice.sourceId==='panel'?'corbus-panel':'corbus-'+revealDevice.sourceId;save();render();scheduleAttachmentNavigation(revealDevice.id,revealInstance);return;
  }
  if(action==='toggle-family-summary'){
    var summarySource=String(el.getAttribute('data-source')||'panel');var summaryFamily=String(el.getAttribute('data-family')||'');if(!familyMeta(summaryFamily)) return;
    if(!state.collapsedSections) state.collapsedSections={};var summaryKey=familySummaryKey(summarySource,summaryFamily);state.collapsedSections[summaryKey]=!familySummaryCollapsed(summarySource,summaryFamily);save();render();return;
  }
  if(action==='toggle-attachments'){
    var attachmentDevice=findDevice(el.getAttribute('data-device'));if(!attachmentDevice) return;
    if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[attachmentKey(attachmentDevice)]=!attachmentsCollapsed(attachmentDevice);save();render();return;
  }
  if(action==='toggle-attachment-instance'){
    var instanceDevice=findDevice(el.getAttribute('data-device'));if(!instanceDevice) return;var instanceNumber=Math.max(1,Math.floor(number(el.getAttribute('data-instance'),1)));
    if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[attachmentInstanceKey(instanceDevice,instanceNumber)]=!attachmentInstanceCollapsed(instanceDevice,instanceNumber);save();if(!refreshCorbusTable(instanceDevice.sourceId)) render();return;
  }
  if(action==='picker-cancel'){picker=null;renderPicker();return;}
  if(action==='picker-select'){
    if(!picker) return;
    var selectedId=el.getAttribute('data-model');
    if(picker.kind==='corbus'){
      if(!selectedId||!corbusIndex[selectedId]) return;
      if(!canUseModel(selectedId,'')){notify('The selected panel has reached the maximum quantity for this device.','error');picker=null;render();return;}
      var selectedExtraPower=selectedId==='hs2tchp'&&el.getAttribute('data-extra-power')==='true';
      var existingDevice=groupedDevice(picker.sourceId,selectedId,selectedExtraPower);var addedDevice;
      if(existingDevice){existingDevice.quantity++;addedDevice=existingDevice;}
      else{var selectedDevice=createDevice(picker.sourceId,selectedId);selectedDevice.extraPower=selectedExtraPower;state.corbus.push(selectedDevice);ensureLocalStructures(selectedDevice);addedDevice=selectedDevice;}
      if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[familyGroupKey(picker.sourceId,deviceFamilyKey(deviceCatalog(addedDevice)))]=false;
      markLastAdded(addedDevice);expandSourceCircuit(picker.sourceId);if(isPowerModule(deviceCatalog(addedDevice))){setCalculatorToolVisible(powerSectionKey(addedDevice),true);state.activeToolSection=powerSectionKey(addedDevice);}
    }else if(picker.kind==='load'){
      var selectedList=contextLoads(picker.context);if(!selectedList||!selectedId) return;selectedList.push(createLoad(selectedId));expandLoadContext(picker.context);
    }else if(picker.kind==='child'||picker.kind==='audio'){
      var selectedParent=findDevice(picker.deviceId);if(!selectedParent||!selectedId) return;
      var parentInstance;
      if(picker.kind==='child'&&picker.childKind==='keypad-pgm'){
        var keypadTargetSelect=pickerPortal&&pickerPortal.querySelector('[data-picker-keypad-target]');var keypadTarget=parseKeypadTarget(keypadTargetSelect?keypadTargetSelect.value:keypadTargetValue(selectedParent,picker.parentInstance));
        var keypadParent=findDevice(keypadTarget.deviceId);if(!keypadParent||deviceCatalog(keypadParent).family!=='keypad') return;selectedParent=keypadParent;parentInstance=Math.min(selectedParent.quantity,keypadTarget.instance);
      }else{
        var instanceSelect=pickerPortal&&pickerPortal.querySelector('[data-picker-instance]');parentInstance=Math.min(selectedParent.quantity,Math.max(1,Math.floor(number(instanceSelect?instanceSelect.value:picker.parentInstance,1))));
      }
      if(picker.kind==='audio'){if(!addAudioStation(selectedParent,picker.audioSize,parentInstance)) return;}
      else{
        var outputSelect=pickerPortal&&pickerPortal.querySelector('[data-picker-output]');var selectedOutput=picker.childKind==='device-output'?(outputSelect?outputSelect.value:(picker.outputId||firstFreeDeviceOutput(selectedParent,parentInstance))):'';
        selectedParent.children.push(createLoad(selectedId,picker.childKind,selectedOutput,parentInstance));
      }
      setAttachmentExpanded(selectedParent,parentInstance);expandSourceCircuit(selectedParent.sourceId);
    }
    picker=null;cleanupState(state);save();render();return;
  }
  if(action==='picker-confirm'){
    if(!picker||picker.kind!=='smoke') return;
    var remaining=Math.max(0,18-pgmSmokeQuantity(state.pgms.PGM2));if(!remaining){notify('The 2-wire smoke loop already has the maximum of 18 detectors.','error');picker=null;render();return;}
    function smokeValue(field){var root=pickerPortal||document;var input=root.querySelector('[data-picker-smoke="'+field+'"]');return input?input.value:'';}
    state.pgms.PGM2.smoke.detectors.push({id:id('smoke'),brand:String(smokeValue('brand')||''),model:String(smokeValue('model')||'Custom 2-wire smoke'),standbyMa:clamp(smokeValue('standbyMa'),0,1000,0),alarmMa:clamp(smokeValue('alarmMa'),0,1000,0),quantity:Math.floor(clamp(smokeValue('quantity'),1,remaining,1))});
    expandSectionState('panel-shell');expandSectionState('pgms');expandSectionState('pgm-PGM2');
    picker=null;save();render();return;
  }
  if(action==='picker-remove-confirm'){
    if(!picker||picker.kind!=='remove-instances') return;
    var removalDevice=findDevice(picker.deviceId);if(!removalDevice){picker=null;renderPicker();return;}
    var selectedInstances=(picker.selectedInstances||[]).map(function(value){return Math.max(1,Math.floor(number(value,1)));});
    if(selectedInstances.length!==picker.removeCount){notify('Select exactly '+picker.removeCount+' '+(picker.removeCount===1?'instance':'instances')+' to remove.','error');return;}
    removeDeviceInstances(removalDevice,selectedInstances);picker=null;cleanupState(state);save();render();return;
  }
  if(action==='add-corbus'){
    var source=el.getAttribute('data-source')||'panel';if(!corbusPickerOptions(source)){notify('No additional compatible CORBUS device is available for this source.','error');return;}pickerSearchQuery='';picker={kind:'corbus',sourceId:source,anchor:pickerAnchor(el)};renderPicker();return;
  }
  if(action==='delete-family-instance'){
    var familyInstanceDevice=findDevice(el.getAttribute('data-device'));if(!familyInstanceDevice) return;
    var familyInstance=Math.max(1,Math.floor(number(el.getAttribute('data-instance'),1)));if(familyInstance>familyInstanceDevice.quantity) return;
    var familyInstanceCatalog=deviceCatalog(familyInstanceDevice);var familyInstanceSummary=instanceLoadSummary(familyInstanceDevice,familyInstance);
    var familyInstanceMessage='Delete '+familyInstanceCatalog.model+' #'+familyInstance;
    if(familyInstanceSummary.quantity) familyInstanceMessage+=' and its '+familyInstanceSummary.quantity+' connected '+(familyInstanceSummary.quantity===1?'device':'devices');
    familyInstanceMessage+='?';
    if(!window.confirm(familyInstanceMessage)) return;
    if(familyInstanceDevice.quantity<=1) removeDeviceBranch(familyInstanceDevice.id);else removeDeviceInstances(familyInstanceDevice,[familyInstance]);
    cleanupState(state);save();render();return;
  }
  if(action==='delete-family-loads'){
    var clearSource=String(el.getAttribute('data-source')||'panel');var clearFamily=String(el.getAttribute('data-family')||'');var clearMeta=familyMeta(clearFamily);if(!clearMeta) return;
    var clearDevices=state.corbus.filter(function(device){return device.sourceId===clearSource&&deviceFamilyKey(deviceCatalog(device))===clearFamily;});
    var clearCount=clearDevices.reduce(function(sum,device){return sum+attachedQuantity(device);},0);if(!clearCount) return;
    if(!window.confirm('Delete all '+clearCount+' connected '+(clearCount===1?'device':'devices')+' from '+clearMeta.title+'?')) return;
    clearDevices.forEach(function(device){device.children=[];clearInstanceCollapseState(device);});
    if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[familySummaryKey(clearSource,clearFamily)]=true;
    cleanupState(state);save();render();return;
  }
  if(action==='delete-corbus-family'){
    var deleteSource=String(el.getAttribute('data-source')||'panel');var deleteFamily=String(el.getAttribute('data-family')||'');var deleteMeta=familyMeta(deleteFamily);if(!deleteMeta) return;
    var deleteDevices=state.corbus.filter(function(device){return device.sourceId===deleteSource&&deviceFamilyKey(deviceCatalog(device))===deleteFamily;});
    if(!deleteDevices.length) return;
    var deleteInstances=deleteDevices.reduce(function(sum,device){return sum+device.quantity;},0);var deleteAttached=deleteDevices.reduce(function(sum,device){return sum+attachedQuantity(device);},0);
    var deleteMessage='Delete the entire '+deleteMeta.title+' group ('+deleteInstances+' '+(deleteInstances===1?'device':'devices')+')';
    if(deleteAttached) deleteMessage+=' and '+deleteAttached+' directly connected '+(deleteAttached===1?'device':'devices');
    deleteMessage+='? Any downstream local circuits attached to devices in this group will also be removed.';
    if(!window.confirm(deleteMessage)) return;
    deleteDevices.slice().forEach(function(device){removeDeviceBranch(device.id);if(state.visibleToolSections) delete state.visibleToolSections['local-shell-'+device.id];});
    if(state.activeToolSection&&deleteDevices.some(function(device){return state.activeToolSection==='local-shell-'+device.id||state.activeToolSection.indexOf(device.id)>=0;})) state.activeToolSection='panel-overview';
    cleanupState(state);save();render();return;
  }
  if(action==='delete-device'){
    var deviceId=el.getAttribute('data-device');var deletingDevice=findDevice(deviceId);var hasDownstream=(deletingDevice&&deletingDevice.children.length)||state.corbus.some(function(d){return d.sourceId===deviceId;})||(state.localAux[deviceId]||[]).length||state.localPgms[deviceId];if(hasDownstream&&!window.confirm('Delete this device and every load connected to it?')) return;removeDeviceBranch(deviceId);cleanupState(state);if(state.visibleToolSections) delete state.visibleToolSections['local-shell-'+deviceId];if(state.activeToolSection==='local-shell-'+deviceId) state.activeToolSection='panel-overview';save();render();return;
  }
  if(action==='add-child'){
    var parent=findDevice(el.getAttribute('data-device'));if(!parent) return;var kind=el.getAttribute('data-kind');var requestedInstance=Math.max(0,Math.floor(number(el.getAttribute('data-instance'),0)));var parentInstance=requestedInstance?Math.min(parent.quantity,requestedInstance):leastLoadedInstance(parent,kind);pickerSearchQuery='';picker={kind:'child',deviceId:parent.id,childKind:kind,parentInstance:parentInstance,outputId:kind==='device-output'?firstFreeDeviceOutput(parent,parentInstance):'',anchor:pickerAnchor(el)};renderPicker();return;
  }
  if(action==='add-audio'){var audio=findDevice(el.getAttribute('data-device'));if(!audio) return;var requestedAudioInstance=Math.max(0,Math.floor(number(el.getAttribute('data-instance'),0)));var audioInstance=requestedAudioInstance?Math.min(audio.quantity,requestedAudioInstance):leastLoadedInstance(audio,'audio-station');pickerSearchQuery='';picker={kind:'audio',deviceId:audio.id,audioSize:el.getAttribute('data-size')==='large'?'large':'small',parentInstance:audioInstance,anchor:pickerAnchor(el)};renderPicker();return;}
  if(action==='delete-child'){var pd=findDevice(el.getAttribute('data-device'));if(!pd) return;pd.children=pd.children.filter(function(l){return l.id!==el.getAttribute('data-load');});if(!pd.children.length){if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[attachmentKey(pd)]=true;}save();render();return;}
  if(action==='toggle-instance-extra'){var touch=findDevice(el.getAttribute('data-device'));if(!touch) return;var touchInstance=Math.max(1,Math.floor(number(el.getAttribute('data-instance'),1)));moveDeviceInstanceVariant(touch,touchInstance,!touch.extraPower);cleanupState(state);save();render();return;}
  if(action==='toggle-extra'){var legacyTouch=findDevice(el.getAttribute('data-device'));if(!legacyTouch) return;legacyTouch.extraPower=!legacyTouch.extraPower;cleanupState(state);save();render();return;}
  if(action==='scroll-local'){var localKey='local-shell-'+el.getAttribute('data-device'),localParentKey=calculatorToolParentCollapseKey(localKey);setCalculatorToolVisible(localKey,true);if(localParentKey) expandSectionState(localParentKey);state.activeToolSection=localKey;save();render();scheduleCalculatorToolNavigation(localKey);return;}
  if(action==='add-load'){var context=el.getAttribute('data-context');if(!contextLoads(context)) return;pickerSearchQuery='';picker={kind:'load',context:context,anchor:pickerAnchor(el)};renderPicker();return;}
  if(action==='delete-load'){var loads=contextLoads(el.getAttribute('data-context'));if(!loads) return;var loadId=el.getAttribute('data-load');var index=loads.findIndex(function(l){return l.id===loadId;});if(index>=0) loads.splice(index,1);save();render();return;}
  if(action==='pgm2-mode'){state.pgms.PGM2.mode=el.getAttribute('data-mode')==='smoke'?'smoke':'output';save();render();return;}
  if(action==='add-smoke-row'){
    if(pgmSmokeQuantity(state.pgms.PGM2)>=18){notify('The 2-wire smoke loop already has the maximum of 18 detectors.','error');return;}
    picker={kind:'smoke'};renderPicker();return;
  }
  if(action==='delete-smoke-row'){
    var deletePgm=state.pgms.PGM2;var rowId=el.getAttribute('data-smoke-row');deletePgm.smoke.detectors=smokeRows(deletePgm).filter(function(row){return row.id!==rowId;});save();render();return;
  }
  if(action==='copy-report'){copyCurrentReport().then(function(ok){notify(ok?'Current report copied as a formatted table.':'The report could not be copied to the clipboard.',ok?'success':'error');});return;}
  if(action==='export-report'){downloadCurrentReport();return;}
  if(action==='reset'){if(!window.confirm('Delete the current calculation and start fresh?')) return;state=defaultState();picker=null;save();render();notify('Calculator reset.','success');}
}
function runFastSearchFilter(request){
  if(!request) return;
  var root=pickerPortal||document,query=String(request.query||'').toLowerCase().trim(),visible=0;
  if(request.kind==='library'){
    root.querySelectorAll('[data-library-row]').forEach(function(row){var match=!query||String(row.getAttribute('data-library-search-text')||'').indexOf(query)>=0;row.hidden=!match;if(match)visible++;});
    var libraryEmpty=root.querySelector('[data-library-no-results]');if(libraryEmpty)libraryEmpty.hidden=visible!==0;return;
  }
  root.querySelectorAll('.pcc2-add-menu-option[data-picker-search-text]').forEach(function(option){var match=!query||String(option.getAttribute('data-picker-search-text')||'').indexOf(query)>=0;option.hidden=!match;if(match)visible++;});
  root.querySelectorAll('[data-picker-group]').forEach(function(group){var has=Array.prototype.some.call(group.querySelectorAll('.pcc2-add-menu-option'),function(option){return !option.hidden;});group.hidden=!has;});
  var empty=root.querySelector('[data-picker-no-results]');if(empty)empty.hidden=visible!==0;
}
function scheduleFastSearchFilter(kind,query){
  fastSearchRequest={kind:kind,query:query};
  if(fastSearchFrame) return;
  var run=function(){fastSearchFrame=0;var request=fastSearchRequest;fastSearchRequest=null;runFastSearchFilter(request);};
  fastSearchFrame=window.requestAnimationFrame?window.requestAnimationFrame(run):window.setTimeout(run,0);
}
function onInput(event){
  var el=event.target;
  if(el.matches('[data-library-field]')){var fieldEditor=libraryEditorState();if(!fieldEditor) return;var fieldRecord=libraryEntryForEditing(fieldEditor);if(!fieldRecord) return;var field=String(el.getAttribute('data-library-field')||'');fieldRecord[field]=(field==='standbyMa'||field==='alarmMa')?clamp(el.value,0,10000,0):String(el.value||'');fieldEditor.dirty=true;var footer=pickerPortal&&pickerPortal.querySelector('.pcc2-library-footer>span');if(footer) footer.textContent='Unsaved library changes';var saveButton=pickerPortal&&pickerPortal.querySelector('[data-action="library-save"]');if(saveButton) saveButton.disabled=false;return;}
  if(el.matches('[data-library-search]')){scheduleFastSearchFilter('library',el.value);return;}
  if(el.matches('[data-picker-search]')){scheduleFastSearchFilter('picker',el.value);return;}
}
function onChange(event){
  var el=event.target;
  if(el.matches('[data-remove-instance-select]')){
    if(!picker||picker.kind!=='remove-instances') return;
    var value=Math.max(1,Math.floor(number(el.value,1)));var selected=picker.selectedInstances||[];
    if(el.checked){if(selected.indexOf(value)<0) selected.push(value);}else selected=selected.filter(function(item){return item!==value;});
    if(selected.length>picker.removeCount){selected=selected.filter(function(item){return item!==value;});notify('Select only '+picker.removeCount+' '+(picker.removeCount===1?'instance':'instances')+'.','error');}
    picker.selectedInstances=selected.sort(function(a,b){return a-b;});renderPicker();return;
  }
  if(el.matches('[data-panel-model]')){
    var next=el.value;
    var conflicts=panelModelConflicts(next);
    if(conflicts.length){notify('Cannot select '+next+'. Remove devices first: '+conflicts.join('; ')+'.','error');render();return;}
    var nextPgms=PANEL_PGMS[next]||[];
    var hiddenLoads=['PGM3','PGM4'].filter(function(name){return nextPgms.indexOf(name)<0&&state.pgms[name].loads.length;});
    if(hiddenLoads.length&&!window.confirm('Changing to '+next+' removes the loads saved under '+hiddenLoads.join(' and ')+'. Continue?')){render();return;}
    hiddenLoads.forEach(function(name){state.pgms[name].loads=[];});
    state.panelModel=next;save();render();return;
  }
  if(el.matches('[data-device-model]')){
    var device=findDevice(el.getAttribute('data-device-model'));if(!device) return;var old=deviceCatalog(device),next=corbusIndex[el.value];if(!next) return;if(!canUseModel(next.id,device.id)){notify('The selected panel has reached the maximum quantity for '+next.model+'.','error');render();return;}
    if(device.children.length&&old.id!==next.id&&!window.confirm('Changing this device removes every load connected to its individual instances. Continue?')){render();return;}
    if(old.powerModule&&!next.powerModule){var downstream=state.corbus.some(function(d){return d.sourceId===device.id;})||(state.localAux[device.id]||[]).length||state.localPgms[device.id];if(downstream&&!window.confirm('Changing this power module removes its local calculator and all downstream loads. Continue?')){render();return;}removeDeviceBranch(device.id);device=createDevice('panel',next.id);state.corbus.push(device);}else{device.modelId=next.id;device.category=next.category;device.model=next.model;device.description=next.description;device.standbyMa=next.standbyMa;device.alarmMa=next.alarmMa;device.quantity=next.powerModule?1:Math.min(device.quantity,Math.max(1,maxForModel(next.id,device.id)));device.extraPower=false;device.children=[];if(old.powerModule&&next.powerModule&&old.id!==next.id){delete state.localPgms[device.id];}ensureLocalStructures(device);}
    cleanupState(state);save();render();return;
  }
  if(el.matches('[data-device-qty]')){
    var dq=findDevice(el.getAttribute('data-device-qty'));if(!dq) return;var maxQty=Math.max(1,maxForModel(dq.modelId,dq.id));var nextQuantity=Math.floor(clamp(el.value,1,maxQty,1));
    if(nextQuantity<dq.quantity){
      if(dq.children.length){openInstanceRemovalPicker(dq,nextQuantity);render();return;}
      dq.quantity=nextQuantity;save();render();return;
    }
    dq.quantity=nextQuantity;save();render();return;
  }
  if(el.matches('[data-device-field]')){var df=findDevice(el.getAttribute('data-device-field'));if(!df) return;var field=el.getAttribute('data-field');df[field]=(field==='standbyMa'||field==='alarmMa')?Math.round(clamp(el.value,0,10000,0)):String(el.value||'');save();render();return;}
  if(el.matches('[data-child-keypad-target]')){
    var sourceKeypad=findDevice(el.getAttribute('data-child-keypad-target'));if(!sourceKeypad) return;var movingLoad=childLoad(sourceKeypad,el.getAttribute('data-load'));if(!movingLoad) return;
    var targetInfo=parseKeypadTarget(el.value);var targetKeypad=findDevice(targetInfo.deviceId);if(!targetKeypad||deviceCatalog(targetKeypad).family!=='keypad') return;
    var targetInstance=Math.min(targetKeypad.quantity,Math.max(1,targetInfo.instance));
    if(sourceKeypad.id!==targetKeypad.id){sourceKeypad.children=sourceKeypad.children.filter(function(load){return load.id!==movingLoad.id;});targetKeypad.children.push(movingLoad);}movingLoad.parentInstance=targetInstance;
    if(!sourceKeypad.children.length){if(!state.collapsedSections) state.collapsedSections={};state.collapsedSections[attachmentKey(sourceKeypad)]=true;}
    setAttachmentExpanded(targetKeypad,targetInstance);save();render();return;
  }
  if(el.matches('[data-child-instance]')){var instanceDevice=findDevice(el.getAttribute('data-child-instance'));if(!instanceDevice) return;var instanceLoad=childLoad(instanceDevice,el.getAttribute('data-load'));if(!instanceLoad) return;instanceLoad.parentInstance=Math.min(instanceDevice.quantity,Math.max(1,Math.floor(number(el.value,1))));setAttachmentExpanded(instanceDevice,instanceLoad.parentInstance);save();render();return;}
  if(el.matches('[data-child-model]')){var cd=findDevice(el.getAttribute('data-child-model'));if(!cd) return;var cl=childLoad(cd,el.getAttribute('data-load'));if(!cl) return;applyCatalogToLoad(cl,el.value);save();render();return;}
  if(el.matches('[data-child-output]')){var od=findDevice(el.getAttribute('data-child-output'));if(!od) return;var ol=childLoad(od,el.getAttribute('data-load'));if(!ol) return;ol.outputId=el.value;save();render();return;}
  if(el.matches('[data-child-qty]')){var qd=findDevice(el.getAttribute('data-child-qty'));if(!qd) return;var ql=childLoad(qd,el.getAttribute('data-load'));if(!ql) return;ql.quantity=Math.floor(clamp(el.value,1,999,1));save();render();return;}
  if(el.matches('[data-child-field]')){var fd=findDevice(el.getAttribute('data-child-field'));if(!fd) return;var fl=childLoad(fd,el.getAttribute('data-load'));if(!fl) return;var ff=el.getAttribute('data-field');fl[ff]=(ff==='standbyMa'||ff==='alarmMa')?Math.round(clamp(el.value,0,10000,0)):String(el.value||'');save();render();return;}
  if(el.matches('[data-load-model]')){var lm=contextLoads(el.getAttribute('data-load-model'));if(!lm) return;var load=findLoad(lm,el.getAttribute('data-load'));if(!load) return;applyCatalogToLoad(load,el.value);save();render();return;}
  if(el.matches('[data-load-qty]')){var lq=contextLoads(el.getAttribute('data-load-qty'));if(!lq) return;var qload=findLoad(lq,el.getAttribute('data-load'));if(!qload) return;qload.quantity=Math.floor(clamp(el.value,1,999,1));save();render();return;}
  if(el.matches('[data-load-field]')){var lf=contextLoads(el.getAttribute('data-load-field'));if(!lf) return;var fload=findLoad(lf,el.getAttribute('data-load'));if(!fload) return;var lfield=el.getAttribute('data-field');fload[lfield]=(lfield==='standbyMa'||lfield==='alarmMa')?Math.round(clamp(el.value,0,10000,0)):String(el.value||'');save();render();return;}
  if(el.matches('[data-smoke-row-field]')){
    var smokePgm=state.pgms.PGM2;var smokeRow=smokeRowById(smokePgm,el.getAttribute('data-smoke-row-field'));if(!smokeRow) return;
    var smokeField=el.getAttribute('data-field');
    smokeRow[smokeField]=(smokeField==='standbyMa'||smokeField==='alarmMa')?clamp(el.value,0,1000,0):String(el.value||'');
    save();render();return;
  }
  if(el.matches('[data-smoke-row-qty]')){
    var qtyPgm=state.pgms.PGM2;var qtyRow=smokeRowById(qtyPgm,el.getAttribute('data-smoke-row-qty'));if(!qtyRow) return;
    var otherQty=pgmSmokeQuantity(qtyPgm)-number(qtyRow.quantity,0);qtyRow.quantity=Math.floor(clamp(el.value,1,Math.max(1,18-otherQty),1));save();render();return;
  }
  if(el.matches('[data-comm-model]')){var c=commIndex[el.value]||commIndex[''];state.pclink2.modelId=c.id;state.pclink2.standbyMa=c.standbyMa;state.pclink2.alarmMa=c.alarmMa;state.pclink2.description=c.description;save();render();return;}
  if(el.matches('[data-comm-field]')){var cf=el.getAttribute('data-comm-field');state.pclink2[cf]=(cf==='standbyMa'||cf==='alarmMa')?Math.round(clamp(el.value,0,10000,0)):String(el.value||'');save();render();}
}
function importJson(file){if(!file) return;var reader=new FileReader();reader.onload=function(){try{state=normalizeState(JSON.parse(String(reader.result||'')));save();render();notify('Current calculation imported.','success');}catch(err){notify('The selected JSON file is not a valid calculator export.','error');}};reader.readAsText(file);}
function closePickerFromOutside(event){
  if(!picker||picker.kind==='smoke'||picker.kind==='remove-instances'||picker.kind==='library') return;
  var target=event.target;
  if(pickerPortal&&pickerPortal.contains(target)) return;
  var action=target&&target.closest&&target.closest('[data-action]');
  if(action&&['add-corbus','add-load','add-child','add-audio'].indexOf(action.getAttribute('data-action'))>=0) return;
  picker=null;renderPicker();
}
function closeNavSettingsFromOutside(event){
  if(!navSettingsOpen) return;
  var target=event.target;
  if(target&&target.closest&&target.closest('[data-pcc-nav-settings]')) return;
  navSettingsOpen=false;syncCalculatorSettingsSurface();
}
function closePickerOnResize(){if(!picker||picker.kind==='smoke'||picker.kind==='remove-instances'||picker.kind==='library') return;picker=null;renderPicker();}
function closePickerOnEscape(event){if(event.key!=='Escape'||!picker) return;picker=null;renderPicker();}
function bind(){
  host.addEventListener('click',onClick);host.addEventListener('change',onChange);
  var header=document.getElementById('panelCurrentCalculatorHeaderControls');if(header){header.addEventListener('click',onClick);header.addEventListener('change',onChange);}
  var portal=ensurePickerPortal();portal.addEventListener('click',onClick);portal.addEventListener('change',onChange);portal.addEventListener('input',onInput);
  document.addEventListener('pointerdown',closePickerFromOutside,true);
  document.addEventListener('click',closeNavSettingsFromOutside);
  window.addEventListener('resize',closePickerOnResize);
  document.addEventListener('keydown',closePickerOnEscape);
  if(importInput) importInput.addEventListener('change',function(){importJson(importInput.files&&importInput.files[0]);importInput.value='';});
}
function init(){
  host=document.getElementById('panelCurrentCalculator');importInput=document.getElementById('panelCurrentCalculatorImportFile');if(!host) return;
  deviceLibrary=readDeviceLibrary();rebuildCatalogs();state=read();ensureLibraryImportInput();bind();
  var hasRendered=false;
  var previous=window.dscHandleViewActivation;
  window.dscHandleViewActivation=function(view){
    var previousState=typeof previous==='function'?previous(view):null;
    if(view!=='current-calculator') return previousState;
    if(hasRendered) return previousState;
    var runId=window.dscBeginWorkspaceLoading?window.dscBeginWorkspaceLoading('Opening Panel Current Calculator…'):0;
    var open=function(){try{render();hasRendered=true;}finally{if(window.dscFinishWorkspaceLoading)window.dscFinishWorkspaceLoading(runId);}};
    if(window.dscAfterWorkspacePaint) window.dscAfterWorkspacePaint(open); else window.setTimeout(open,24);
    return 'deferred';
  };
  var activeView=document.getElementById('view-current-calculator');
  if(activeView&&activeView.classList.contains('active')) window.dscHandleViewActivation('current-calculator');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);else init();
})();
