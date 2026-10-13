(function(){
'use strict';

var table1Rows=[
  ['[320]-[323]','Zone Alarms','Zone goes into alarm','A/R','See Tables 2 & 3','See Table 3'],
  ['[324]-[327]','Zone Restorals','Alarm condition has been restored','A/R','See Tables 2 & 3','See Table 3'],
  ['[328]','Duress Alarm','Duress code entered at keypad','A/R','E(1)21-000','HA-00'],
  ['[328]','Opening After Alarm','System disarmed with alarm in memory','A/R','E(4)58-000','OR-00'],
  ['[328]','Recent Closing','Alarm occurs within two minutes of system arming','A/R','E(4)59-UUU','CR-00'],
  ['[328]','Zone Expander Supervisory Alarm/Rest.','Panel loses/restores supervisory transmission over the Keybus from zone expansion modules, or keypads with zone inputs','A/R','E(1)43-000 / R(1)43-000','UA-00/UH-00'],
  ['[328]','Cross Zone (Police Code) Alarm','Two zones on the same partition go into alarm during any given armed-to-armed period (incl. 24Hr zones)','A/R','E(1)39-000','BM-00/BV-00'],
  ['[328]','Burglary Not Verified','This event is transmitted when a second cross-zone alarm does not occur within the cross-zoning time','A/R','E(3)78-000','BG-00'],
  ['[328]','Alarm Cancelled','Sent when the system is disarmed after an alarm, but before the expiry of the alarm cancellation timer','A/R','E(4)A6-UUU','BC-00'],
  ['[329]','[F] Key Alarm/Restoral','Keypad fire alarm/restore (alarm and restore rep. codes sent together)','A/R','E(1)1A-000 / R(1)1A-000','FA-00/FH-00'],
  ['[329]','[A] Key Alarm/Restoral','Keypad auxiliary alarm/restore (alarm and restore rep. codes sent together)','A/R','E(1)AA-000 / R(1)AA-000','MA-00/MH-00'],
  ['[329]','[P] Key Alarm/Restoral','Keypad panic alarm/restore (alarm and restore rep. codes sent together)','A/R','E(1)2A-000 / R(1)2A-000','PA-00/PH-00'],
  ['[329]','Aux Input Alarm/Rest — Option #23/24','A panic button wired to PGM 2 is pressed/access code is entered','A/R','E(1)4A-000 / R(1)4A-000','UA-99/UH-99'],
  ['[329]','Aux Input Alarm/Rest — Option #04','A 2-wire smoke detector wired to PGM 2 goes into alarm/alarm is cleared','A/R','E(1)11-000 / R(1)11-000','FA-99/FH-99'],
  ['[330]-[337]','Zone Tamper/Restoral','Zone is tampered / tamper condition restored','T/R','E(3)83-ZZZ / R(3)83-ZZZ','TA-ZZ/TR-ZZ'],
  ['[338]','General System Tamper/Rest.','Enrolled module with tamper inputs has a tamper alarm/all module tampers restored','T/R','E(1)45-000 / R(1)45-000','ES-00/EJ-00'],
  ['[338]','Keypad Lockout','Max. number of incorrect access codes has been entered at a keypad','T/R','E(4)61-000','JA-00'],
  ['[339]-[341]','Closings','System armed (user 01-32 indicated)','O/C','R(4)A1-UUU','CL-UU'],
  ['[341]','Partial Closing','One or more zones bypassed when system armed','O/C','E(4)56-000','CG-00'],
  ['[341]','Special Closing','Closing (arming) using one of the following methods: quick arm, auto arm, keyswitch, function key, maintenance code, DLS software, wireless key','O/C','R(4)AA-000','CL-00'],
  ['[341]','Late to Close','Whenever the Auto-arm prealert sounds (if the Late to Close option is enabled)','O/C','R(4)54-000','CI-00'],
  ['[341]','Exit Fault','The Exit Fault pre-alert occurs and Entry Delay expires','O/C','E(3)74-ZZZ','EE-00'],
  ['[341]','Zone Bypass','Zone is bypassed','O/C','E(5)7A-ZZZ','UB-ZZ'],
  ['[342]-[344]','Openings','System disarmed (user 01-32 indicated)','O/C','E(4)A1-UUU','OP-UU'],
  ['[344]','Auto-arm Cancellation','Auto-arm cancelled','O/C','E(4)55-000','CI-00'],
  ['[344]','Special Opening','Opening (disarming) using one of the following methods: keyswitch, maintenance code, DLS software, wireless key','O/C','E(4)AA-000','OP-00'],
  ['[345]-[346]','Battery Trouble/Rest.','PC1616/PC1832/PC1864 battery is low/battery restored','MA/R','E(3)A2-000 / R(3)A2-000','YT-00/YR-00'],
  ['[345]-[346]','AC Line Trouble/Rest.','AC power to control panel is disconnected or interrupted/AC power restored (Both codes follow AC Failure Comm. Delay.)','MA/R','E(3)A1-000 / R(3)A1-000','AT-00/AR-00'],
  ['[345]-[346]','Bell Circuit Trouble/Rest.','Open or short circuit detected across bell terminals/bell circuit restored','MA/R','E(3)21-000 / R(3)21-000','YA-99/YH-99'],
  ['[345]-[346]','Fire Trouble/Rest.','Trouble occurs/restores on a fire zone','MA/R','E(3)73-000 / R(3)73-000','FT-99/FJ-99'],
  ['[345]-[346]','Auxiliary Power Trouble/Rest.','Aux voltage supply trouble/restoral','MA/R','E(3)12-000 / R(3)12-000','YP-00/YQ-00'],
  ['[345]-[346]','TLM Failure/Restore','Telephone line monitoring trouble/Telephone line restored','MA/R','E(3)51-000 / R(3)51-000','LT-01/LR-01'],
  ['[345]-[346]','Gen System Trouble/Rest.','“Service Required” trouble (view troubles using [*][2])/trouble restored','MA/R','E(3)AA-000 / R(3)AA-000','YX-00/YZ-00'],
  ['[345]-[346]','Gen System Supervisory Trouble/Rest.','Control panel loses/restores communications with module(s) connected to the Keybus','MA/R','E(3)3A-000 / R(3)3A-000','ET-00/ER-00'],
  ['[346]','Cold Start (System Reset)','The system has been restarted after a total power loss. The reporting code is sent after a 2 minute start-up delay','MA/R','R(3)A5-000','RR-00'],
  ['[347]','Phone# 1 or 2 FTC Restoral','Control panel has restored communications to central station on Phone# 1 or 2 (after FTC)','MA/R','R(3)54-000','YK-00'],
  ['[347]','Event Buffer is 75% Full','Event buffer is almost full since last upload','MA/R','E(6)22-000','JL-00'],
  ['[347]','DLS Lead In','Downloading session start','MA/R','E(4)11-000','RB-00'],
  ['[347]','DLS Lead Out','Downloading session complete','MA/R','E(4)12-000','RS-00'],
  ['[347]','Zone Fault/Rest.','One or more zones have faults/restored','MA/R','E(3)8A-ZZZ / R(3)8A-ZZZ','UT-ZZ/UJ-ZZ'],
  ['[347]','Delinquency','Programmed amount of time (days or hours) for delinquency has expired without zone activity, or without system being armed','MA/R','E(6)54-000***','CD-00'],
  ['[347]','Wireless Device Low Battery Trouble/Rest.','Wireless zones, panic pendants, handheld keypads, wireless keys have low battery/all low batteries restored','MA/R','E(3)84-000 / R(3)84-000','XT-00/XR-00 / XT-ZZ/XR-ZZ****'],
  ['[347]','Installer Lead In/Lead Out','Installer’s mode has been entered/exited','MA/R','E(6)27-000 / E(6)28-000','LB-00/LS-00'],
  ['[348]','Walk Test End/Begin','End of test/Beginning of test','T','R(6)A7-UUU / E(6)A7-UUU','TE-00/TS-00'],
  ['[348]','Periodic Test with Trouble','Periodic system test transmission with trouble','T','E(6)A8-000','RY-00'],
  ['[348]','Periodic Test','Periodic system test transmission','T','E(6)A2-000','RP-00'],
  ['[348]','System Test','[*][6] bell/communications test','T','E(6)A1-000','RX-00'],
  ['[349]','PC5700 Ground Fault Trouble/Rest','Ground/Fault/Trouble occurs on the PC5700','MA/R','E(3)1A-000','US-00/UR-00'],
  ['[349]','PC5700 TLM Line 1 Trouble/Rest.','TLM Trouble /Restore occurs on the PC5700','MA/R','E(3)51-000 / R(3)51-000','LT-01/LR-01'],
  ['[349]','PC5700 TLM Line 2 Trouble/Rest.','TLM Trouble /Restore occurs on the PC5700','MA/R','E(3)52-000 / R(3)52-000','LT-02/LR-02'],
  ['[601]-[604]','Closings','System armed (user 33-95 indicated)','O/C','R(4)A1-UUU','CL-UU'],
  ['[605]-[608]','Openings','System disarmed (user 33-95 indicated)','O/C','E(4)A1-UUU','OP-UU']
];

var table2Rows=[
  ['Medical Alarms','(1)AA','Medical'],
  ['Medical Alarms','(1)A1','Pendant Transmitter'],
  ['Medical Alarms','(1)A2','Fail to Report In'],
  ['Fire Alarms','(1)1A','Fire Alarm'],
  ['Fire Alarms','(1)11','Smoke'],
  ['Fire Alarms','(1)12','Combustion'],
  ['Fire Alarms','(1)13','Water Flow'],
  ['Fire Alarms','(1)14','Heat'],
  ['Fire Alarms','(1)15','Pull Station'],
  ['Fire Alarms','(1)16','Duct'],
  ['Fire Alarms','(1)17','Flame'],
  ['Fire Alarms','(1)18','Near Alarm'],
  ['Panic Alarms','(1)2A','Panic'],
  ['Panic Alarms','(1)21','Duress'],
  ['Panic Alarms','(1)22','Silent'],
  ['Panic Alarms','(1)23','Audible'],
  ['Burglar Alarms','(1)3A','Burglary'],
  ['Burglar Alarms','(1)31','Perimeter'],
  ['Burglar Alarms','(1)32','Interior'],
  ['Burglar Alarms','(1)33','24 Hour'],
  ['Burglar Alarms','(1)34','Entry / Exit'],
  ['Burglar Alarms','(1)35','Day / Night'],
  ['Burglar Alarms','(1)36','Outdoor'],
  ['Burglar Alarms','(1)37','Tamper'],
  ['Burglar Alarms','(1)38','Near Alarm'],
  ['General Alarms','(1)4A','General Alarm'],
  ['General Alarms','(1)43','Exp. module failure'],
  ['General Alarms','(1)44','Sensor tamper'],
  ['General Alarms','(1)45','Module Tamper'],
  ['General Alarms','(1)4A','Cross Zone Police Code'],
  ['24 Hour Non-Burglary','(1)5A','24 Hour non-Burg'],
  ['24 Hour Non-Burglary','(1)51','Gas detected'],
  ['24 Hour Non-Burglary','(1)52','Refrigeration'],
  ['24 Hour Non-Burglary','(1)53','Loss of Heat'],
  ['24 Hour Non-Burglary','(1)54','Water Leakage'],
  ['24 Hour Non-Burglary','(1)55','Foil Break'],
  ['24 Hour Non-Burglary','(1)56','Day Trouble'],
  ['24 Hour Non-Burglary','(1)57','Low bottled Gas level'],
  ['24 Hour Non-Burglary','(1)58','High Temp'],
  ['24 Hour Non-Burglary','(1)59','Low Temp'],
  ['24 Hour Non-Burglary','(1)61','Loss of Air Flow']
];

var table3Rows=[
  ['Delay 1','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Delay 2','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Instant','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Interior','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Interior Stay/Away','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Delay Stay/Away','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Delayed 24-Hr Fire','FA-ZZ / FH-ZZ','E(1)1A-ZZZ / R(1)1A-ZZZ'],
  ['Standard 24-Hr Fire','FA-ZZ / FH-ZZ','E(1)1A-ZZZ / R(1)1A-ZZZ'],
  ['24-Hr Supervisory','US-ZZ / UR-ZZ','E(1)5A-ZZZ / R(1)5A-ZZZ'],
  ['24-Hr Supervisory Buzzer','UA-ZZ / UH-ZZ','E(1)5A-ZZZ / R(1)5A-ZZZ'],
  ['24-Hr Burglary','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['24-Hr Holdup','HA-ZZ / HH-ZZ','E(1)22-ZZZ / R(1)22-ZZZ'],
  ['24-Hr Gas','GA-ZZ / GH-ZZ','E(1)51-ZZZ / R(1)51-ZZZ'],
  ['24-Hr Heat','KA-ZZ / KH-ZZ','E(1)58-ZZZ / R(1)58-ZZZ'],
  ['24-Hr Auxiliary (Medical)','MA-ZZ / MH-ZZ','E(1)AA-ZZZ / R(1)AA-ZZZ'],
  ['24-Hr PANIC','PA-ZZ / PH-ZZ','E(1)2A-ZZZ / R(1)2A-ZZZ'],
  ['24-Hr Emerg. (non-medical)','QA-ZZ / QH-ZZ','E(1)A1-ZZZ / R(1)A1-ZZZ'],
  ['24-Hr Sprinkler','SA-ZZ / SH-ZZ','E(1)13-ZZZ / R(1)13-ZZZ'],
  ['24-Hr Water','WA-ZZ / WH-ZZ','E(1)54-ZZZ / R(1)54-ZZZ'],
  ['24-Hr Freeze','ZA-ZZ / ZH-ZZ','E(1)59-ZZZ / R(1)59-ZZZ'],
  ['24-Hr Latching','UA-ZZ / UH-ZZ','E(1)4A-ZZZ / R(1)4A-ZZZ'],
  ['Interior Delay','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Auto Verified Fire','FA-ZZ / FH-ZZ','E(1)1A-ZZZ / R(1)1A-ZZZ'],
  ['24-Hr Fire Supervisory','FS-ZZ / FV-ZZ','E(2)AA-ZZZ / R(2)AA-ZZZ'],
  ['Day Zone','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Instant Stay/Away','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['24-Hr Bell/Buzzer','UA-ZZ / UH-ZZ','E(1)5A-ZZZ / R(1)5A-ZZZ'],
  ['24-Hr Non-latching Tamper','UA-ZZ / UH-ZZ','E(1)4A-ZZZ / R(1)4A-ZZZ'],
  ['Night Zone','BA-ZZ / BH-ZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
  ['Delayed 24-Hr Fire (Wireless)','FA-ZZ / FH-ZZ','E(1)1A-ZZZ / R(1)1A-ZZZ'],
  ['Standard 24-Hr Fire(Wireless)','FA-ZZ / FH-ZZ','E(1)1A-ZZZ / R(1)1A-ZZZ'],
  ['24-Hr CO Alarm','GA-ZZ / GH-ZZ','E(1)62-ZZZ / R(1)62-ZZZ']
];


function psReportingV2EventRow(row){
  return [row[0]||'',row[1]||'',row[2]||'',row[3]||'',row[4]||'',row[5]||''];
}
function psReportingV2Rows(indexes){
  return indexes.map(function(index){return psReportingV2EventRow(table1Rows[index]);});
}
function psReportingV2AutomaticZoneRows(){
  return table3Rows.map(function(row){
    return ['[320]-[327]',row[0],'Zone alarm/restoral for this zone definition','A/R',row[2],row[1]];
  });
}

// The SIA and Contact ID lookup tables are protocol standards shared with the NEO reporting reference.
// Both New PowerSeries reporting views point at the same row/column arrays instead of duplicating them.
function psSharedProtocolSection(key){
  var registry=window.DSC_STANDARD_REPORTING_CODE_TABLES||{},source=registry[key];
  if(!source){
    return {id:key==='sia'?'sia-event-code-table':'contact-id-event-code-table',title:key==='sia'?'SIA Event Code Table':'Contact ID Event Code Table',kind:key==='sia'?'standard-sia':'standard-cid',columns:[],rows:[],notes:['Shared protocol table data is unavailable because the standard reporting-code registry did not load.'],sharedProtocolTableKey:key};
  }
  return {id:source.id,title:source.title,kind:source.kind,columns:source.columns,rows:source.rows,notes:source.notes||[],sharedProtocolTableKey:key,canonicalProtocolTableRegistryId:registry.id||'dsc-standard-reporting-code-tables'};
}
var powerSeriesSiaEventCodeSection=psSharedProtocolSection('sia');
var powerSeriesContactIdEventCodeSection=psSharedProtocolSection('contactId');

var reportingRecord={
    id:'new-powerseries-reporting-codes',
    eyebrow:'New PowerSeries · Reporting',
    title:'Reporting Codes No Categories',
    subtitle:'Contact ID and Automatic SIA reporting-code reference without category grouping.',
    overview:{
      intro:'The following tables contain Contact ID and Automatic SIA format reporting codes. For more information on reporting code formats and notes about individual reporting codes, see programming sections [320]-[349] and [601]-[608].',
      contactId:[
        'The first digit (in parentheses) will automatically be sent by the control. The second two digits are programmed to indicate specific information about the signal.',
        'Example: if zone 1 is an entry/exit point, program event code [34]. The central station receives *BURG - ENTRY/EXIT - 1, where “1” identifies the zone that went into alarm.'
      ],
      sia:{
        title:'SIA Format - Level 2 (hard coded)',
        text:'The SIA communication format used in this product follows the level 2 specifications of the SIA Digital Communication Standard - October 1997. This format will send the Account Code along with its data transmission.',
        example:'N Ri01 = BA 01',
        parts:[['N','New Event'],['Ri01','Partition / Area Identifier'],['BA','Burglary Alarm'],['01','Zone 1']],
        note:'A system event will use the Area Identifier Ri00.'
      }
    },
    columns:['Section #','Reporting Code','Code Sent When...','Dialer Direction*','Automatic Contact ID Codes','SIA Auto Rep Codes**'],
    sections:[
      {id:'overview',title:'Contact ID & SIA Formats',kind:'overview'},
      {id:'table-1-reporting-codes',title:'Table 1: Reporting Codes',kind:'ps-reporting-main',relationships:[
        {definition:'Zone Alarms',targetSectionId:'table-3-automatic-zone-codes',targetTitle:'Table 3: Automatic Zone Alarm/Restoral Codes',columnTargets:{4:[{label:'Table 2',targetSectionId:'table-2-programmed-zone-codes',targetTitle:'Table 2: Contact ID Programmed Zone Alarm/Restoral Event Codes'},{label:'Table 3',targetSectionId:'table-3-automatic-zone-codes',targetTitle:'Table 3: Automatic Zone Alarm/Restoral Codes'}],5:[{label:'Table 3',targetSectionId:'table-3-automatic-zone-codes',targetTitle:'Table 3: Automatic Zone Alarm/Restoral Codes'}]}},
        {definition:'Zone Restorals',targetSectionId:'table-3-automatic-zone-codes',targetTitle:'Table 3: Automatic Zone Alarm/Restoral Codes',columnTargets:{4:[{label:'Table 2',targetSectionId:'table-2-programmed-zone-codes',targetTitle:'Table 2: Contact ID Programmed Zone Alarm/Restoral Event Codes'},{label:'Table 3',targetSectionId:'table-3-automatic-zone-codes',targetTitle:'Table 3: Automatic Zone Alarm/Restoral Codes'}],5:[{label:'Table 3',targetSectionId:'table-3-automatic-zone-codes',targetTitle:'Table 3: Automatic Zone Alarm/Restoral Codes'}]}}
      ],rows:table1Rows},
      {id:'table-2-programmed-zone-codes',title:'Table 2: Contact ID Programmed Zone Alarm/Restoral Event Codes',kind:'ps-programmed-cid',columns:['Category','Contact ID Code','Event'],rows:table2Rows,notes:['Program any of these codes for zone alarms/restorals when using the standard (non-automatic) Contact ID reporting format.']},
      {id:'table-3-automatic-zone-codes',title:'Table 3: Automatic Zone Alarm/Restoral Codes',kind:'ps-zone-alarm',columns:['Zone Definition','SIA Auto Rep Codes','Contact ID Auto Rep Codes'],rows:table3Rows,notes:['ZZ or ZZZ = zones 01-64.']},
      powerSeriesSiaEventCodeSection,
      powerSeriesContactIdEventCodeSection
    ],
    footnotes:[
      'A/R = alarms/restorals; T/R = tampers/restorals; O/C = openings/closings; MA/R = miscellaneous alarms/restorals; T = test transmissions.',
      'UU = user number (User 01-95); ZZ = zone number (01-64).',
      'Use the “Fail to close” event code [(4)54] to report closing or activity delinquency. Ensure the central station is aware that this code is used.',
      'Zones are identified; panic pendants, wireless keys, and handheld keypads are not.'
    ]
};


var reportingV2Record={
    id:'new-powerseries-reporting-code-v2',
    eyebrow:'New PowerSeries · Reporting',
    title:'Reporting Codes with Categories',
    subtitle:'The same New PowerSeries reporting-code data organized by reporting category.',
    overview:reportingRecord.overview,
    columns:['Section #','Reporting Code','Code Sent When...','Dialer Direction*','Automatic Contact ID Codes','SIA Auto Rep Codes**'],
    sections:[
      {id:'overview',title:'Contact ID & SIA Formats',kind:'overview'},
      {id:'zone-events',title:'Zone Events',kind:'ps-reporting-main',relationships:[
        {definition:'Zone Alarms',programmingSection:'[320]-[323]',targetSectionId:'zone-alarm-restore-codes',targetTitle:'Contact ID & SIA Zone Alarm/Restore Event Codes',columnTargets:{4:[{label:'Zone Alarm/Restore Event Codes',targetSectionId:'zone-alarm-restore-codes',targetTitle:'Contact ID & SIA Zone Alarm/Restore Event Codes'}],5:[{label:'Zone Alarm/Restore Event Codes',targetSectionId:'zone-alarm-restore-codes',targetTitle:'Contact ID & SIA Zone Alarm/Restore Event Codes'}]}},
        {definition:'Zone Restorals',programmingSection:'[324]-[327]',targetSectionId:'zone-alarm-restore-codes',targetTitle:'Contact ID & SIA Zone Alarm/Restore Event Codes',columnTargets:{4:[{label:'Zone Alarm/Restore Event Codes',targetSectionId:'zone-alarm-restore-codes',targetTitle:'Contact ID & SIA Zone Alarm/Restore Event Codes'}],5:[{label:'Zone Alarm/Restore Event Codes',targetSectionId:'zone-alarm-restore-codes',targetTitle:'Contact ID & SIA Zone Alarm/Restore Event Codes'}]}}
      ],rows:[
        ['[320]-[323]','Zone Alarms','Zone goes into alarm','A/R','See Zone Alarm/Restore Event Codes below','See Zone Alarm/Restore Event Codes below'],
        ['[324]-[327]','Zone Restorals','Alarm condition has been restored','A/R','See Zone Alarm/Restore Event Codes below','See Zone Alarm/Restore Event Codes below']
      ].concat(psReportingV2Rows([14,39]))},
      {id:'tamper-events',title:'Tamper Events',kind:'ps-reporting-main',rows:psReportingV2Rows([15,16])},
      {id:'opening-events',title:'Opening Events',kind:'ps-reporting-main',rows:psReportingV2Rows([23,24,25,51])},
      {id:'closing-events',title:'Closing Events',kind:'ps-reporting-main',rows:psReportingV2Rows([17,18,19,20,21,50])},
      {id:'system-trouble-events',title:'System Trouble Events',kind:'ps-reporting-main',rows:psReportingV2Rows([26,27,28,30,31])},
      {id:'module-troubles',title:'Module Troubles',kind:'ps-reporting-main',rows:psReportingV2Rows([33,47,48,49])},
      {id:'alternate-communicator',title:'Alternate Communicator',kind:'ps-reporting-main',rows:[],emptyText:'No corresponding New PowerSeries reporting codes are listed in this reference.'},
      {id:'wireless-events',title:'Wireless Events',kind:'ps-reporting-main',rows:psReportingV2Rows([41])},
      {id:'miscellaneous-alarms',title:'Miscellaneous Alarms',kind:'ps-reporting-main',rows:psReportingV2Rows([2,3,4,5,6,7,8,12,13])},
      {id:'priority-alarm-restoral',title:'Priority Alarm and Restoral Events',kind:'ps-reporting-main',rows:psReportingV2Rows([9,10,11])},
      {id:'miscellaneous-closing',title:'Miscellaneous Closing',kind:'ps-reporting-main',rows:psReportingV2Rows([22])},
      {id:'testing',title:'Testing',kind:'ps-reporting-main',rows:psReportingV2Rows([43,44,45,46])},
      {id:'maintenance',title:'Maintenance',kind:'ps-reporting-main',rows:psReportingV2Rows([29,32,34,35,36,37,38,40,42])},
      {id:'zone-alarm-restore-codes',title:'Contact ID & SIA Zone Alarm/Restore Event Codes',kind:'ps-zone-alarm',columns:['Zone Definition','SIA Auto Rep Codes','Contact ID Auto Rep Codes'],rows:table3Rows,notes:['ZZ or ZZZ = zones 01-64.']},
      {id:'contact-id-programmed-zone-alarm-restoral-event-codes',title:'Contact ID Programmed Zone Alarm/Restoral Event Codes',kind:'ps-programmed-cid',columns:['Category','Contact ID Code','Event'],rows:table2Rows,notes:['Program any of these codes for zone alarms/restorals when using the standard (non-automatic) Contact ID reporting format.']},
      powerSeriesSiaEventCodeSection,
      powerSeriesContactIdEventCodeSection
    ],
    footnotes:reportingRecord.footnotes
};

function splitPair(value){
  var text=String(value==null?'':value).trim(),parts=text.split(/\s*\/\s*/);
  return {event:parts[0]||'',restore:parts.length>1?parts.slice(1).join(' / '):null,raw:text};
}
function cloneRelationshipValue(value){
  return value==null?value:JSON.parse(JSON.stringify(value));
}
function normalizedReportingRowKey(row){
  return (row||[]).slice(0,4).map(function(value){return String(value==null?'':value).trim().toLowerCase();}).join('||');
}
function categorizedSectionIndex(){
  var index={};
  (reportingV2Record.sections||[]).forEach(function(section){
    (section.rows||[]).forEach(function(row){index[normalizedReportingRowKey(row)]=section.id;});
  });
  return index;
}
function parseProgrammingSectionNumbers(sectionText){
  var text=String(sectionText==null?'':sectionText),numbers=(text.match(/\d{3}/g)||[]).map(Number);
  if(!numbers.length) return [];
  if(numbers.length===1) return [numbers[0]];
  var start=numbers[0],end=numbers[numbers.length-1],result=[];
  if(end>=start && end-start<=128){for(var value=start;value<=end;value++) result.push(value);return result;}
  return numbers;
}
function buildProgramming462Index(){
  var ps=window.DSC_DATA&&window.DSC_DATA.programming&&window.DSC_DATA.programming.ps462;
  var entry=ps&&ps.entries&&ps.entries[0];
  var byCode={},byId={},parentById={};
  function walk(nodes,parentId){
    (nodes||[]).forEach(function(node){
      if(!node||!node.id) return;
      byId[node.id]=node;
      if(parentId) parentById[node.id]=parentId;
      if(/^\d{3}$/.test(String(node.code||''))) byCode[String(node.code)]=node;
      walk(node.children||[],node.id);
    });
  }
  walk(entry&&entry.sections||[],entry&&entry.id||null);
  return {programming:ps||null,byCode:byCode,byId:byId,parentById:parentById};
}
function programmingLinksForSection(sectionText,index){
  var numbers=parseProgrammingSectionNumbers(sectionText),links=[],missing=[];
  numbers.forEach(function(number){
    var code=String(number).padStart(3,'0'),node=index.byCode[code];
    if(node) links.push({code:code,sectionId:node.id,label:node.label||'',parentSectionId:index.parentById[node.id]||null});
    else missing.push(code);
  });
  return {links:links,missing:missing};
}
function findZoneProgrammingEntry(sectionNode,zoneNumber){
  if(!sectionNode) return null;
  var match=null;
  (sectionNode.children||[]).some(function(child){
    var childZone=Number(child&&child.zoneNumber),sequential=Number(child&&child.sequentialIndex),id=String(child&&child.id||'');
    if(childZone===zoneNumber || sequential===zoneNumber || new RegExp('(?:-|zone-)'+String(zoneNumber)+'$').test(id)){match=child;return true;}
    return false;
  });
  return match;
}
function zoneReportingProgrammingLink(zoneNumber,baseSection,index){
  var sectionCode=baseSection+Math.floor((zoneNumber-1)/16),node=index.byCode[String(sectionCode)];
  if(!node) return {sectionCode:String(sectionCode),sectionId:null,entryId:null};
  var entry=findZoneProgrammingEntry(node,zoneNumber);
  return {sectionCode:String(sectionCode),sectionId:node.id,entryId:entry&&entry.id||null};
}
function buildReportingRelationships(record){
  var zoneCodeToRow={
    '01':0,'02':1,'03':2,'04':3,'05':4,'06':5,'07':6,'08':7,'09':8,'10':9,'11':10,'12':11,'13':12,'14':13,'15':14,'16':15,'17':16,'18':17,'19':18,'20':19,'21':20,
    '25':21,'29':22,'30':23,'31':24,'32':25,'35':26,'36':27,'37':28,'87':29,'88':30,'41':31,'81':31
  };
  var categorizedByRow=categorizedSectionIndex(),programmingIndex=buildProgramming462Index();
  var rel={schemaVersion:'2.0.0',canonicalDatasetId:'new-powerseries-reporting-codes',referenceViews:{uncategorized:'new-powerseries-reporting-codes',categorized:'new-powerseries-reporting-code-v2',tool:'powerseries-reporting-code-decoder'},sourceReferenceId:record.id,formats:['Contact ID','SIA Level 2'],standardProtocolTables:{registryId:'dsc-standard-reporting-code-tables',sharedWithNeo:true,siaSectionId:'sia-event-code-table',contactIdSectionId:'contact-id-event-code-table'},eventRows:[],zoneDefinitions:{},programming462:{programmingId:'ps462',eventRowsByProgrammingSectionId:{},eventRowsByProgrammingCode:{},unresolvedProgrammingCodes:[],accessCodeProgramming:cloneRelationshipValue(programmingIndex.programming&&programmingIndex.programming.internalRelationships&&programmingIndex.programming.internalRelationships.reportingCodeProgramming&&programmingIndex.programming.internalRelationships.reportingCodeProgramming.accessCodeReportingMap||{closing:{},opening:{}})},placeholders:{UU:'two-digit SIA user identifier',UUU:'three-digit Contact ID user identifier',ZZ:'two-digit SIA zone identifier',ZZZ:'three-digit Contact ID zone identifier'}};
  table1Rows.forEach(function(row,index){
    var programming=programmingLinksForSection(row[0],programmingIndex),rowKey=normalizedReportingRowKey(row),categorySectionId=categorizedByRow[rowKey]||null;
    if(index===0) categorySectionId='zone-events';
    if(index===1) categorySectionId='zone-events';
    var eventRelationship={
      id:'table-1-'+String(index+1).padStart(3,'0'),rowIndex:index,programmingSection:row[0],reportingCode:row[1],condition:row[2],dialerDirection:row[3],contactId:{raw:row[4]},sia:{raw:row[5]},sourceReferenceId:record.id,
      referenceSections:{uncategorized:'table-1-reporting-codes',categorized:categorySectionId},programming462:{sectionLinks:programming.links,missingSectionCodes:programming.missing}
    };
    rel.eventRows.push(eventRelationship);
    programming.links.forEach(function(link){
      if(!rel.programming462.eventRowsByProgrammingSectionId[link.sectionId]) rel.programming462.eventRowsByProgrammingSectionId[link.sectionId]=[];
      rel.programming462.eventRowsByProgrammingSectionId[link.sectionId].push(eventRelationship.id);
      if(!rel.programming462.eventRowsByProgrammingCode[link.code]) rel.programming462.eventRowsByProgrammingCode[link.code]=[];
      rel.programming462.eventRowsByProgrammingCode[link.code].push(eventRelationship.id);
    });
    programming.missing.forEach(function(code){if(rel.programming462.unresolvedProgrammingCodes.indexOf(code)<0) rel.programming462.unresolvedProgrammingCodes.push(code);});
  });
  Object.keys(zoneCodeToRow).forEach(function(code){
    var index=zoneCodeToRow[code],row=table3Rows[index],zoneMap=(programmingIndex.programming&&programmingIndex.programming.internalRelationships&&programmingIndex.programming.internalRelationships.zones)||{};
    rel.zoneDefinitions[code]={status:'mapped',zoneDefinitionCode:code,reportingDefinition:row[0],reportingSectionIds:{uncategorized:'table-3-automatic-zone-codes',categorized:'zone-alarm-restore-codes'},reportingRowIndex:index,sia:splitPair(row[1]),contactId:(function(pair){return {event:pair.event,restore:pair.restore,raw:pair.raw};})(splitPair(row[2])),sourceReferenceId:record.id,programming462:{zoneDefinitionGroupId:'ps462-zone-definitions-001-004',zoneRelationshipAvailable:!!Object.keys(zoneMap).length}};
  });
  ['00','22','23','24','26','39'].forEach(function(code){rel.zoneDefinitions[code]={status:'not-applicable',zoneDefinitionCode:code,reason:'This zone definition is not listed in the automatic Zone Alarm/Restoral reporting-code reference.',sourceReferenceId:record.id,reportingSectionIds:{uncategorized:'table-3-automatic-zone-codes',categorized:'zone-alarm-restore-codes'}};});
  rel.programming462.unresolvedProgrammingCodes.sort();
  return rel;
}
reportingRecord.relationships=buildReportingRelationships(reportingRecord);
reportingV2Record.relationships=reportingRecord.relationships;
reportingRecord.relatedReferenceId=reportingV2Record.id;
reportingV2Record.relatedReferenceId=reportingRecord.id;
reportingRecord.canonicalDatasetId=reportingRecord.relationships.canonicalDatasetId;
reportingV2Record.canonicalDatasetId=reportingRecord.relationships.canonicalDatasetId;

function buildPowerSeriesZoneTypeReference(){
  var programming=((window.DSC_DATA||{}).programming||{}).ps462||{};
  var definitions=Array.isArray(programming.zoneDefinitionReferenceData)?programming.zoneDefinitionReferenceData:[];
  var entries=definitions.map(function(row){return cloneRelationshipValue(row);});
  var byCode={};
  entries.forEach(function(item){
    var code=String(item.code==null?'':item.code).replace(/\D/g,'').padStart(2,'0').slice(-2);
    byCode[code]={
      zoneDefinitionCode:code,
      programmingName:String(item.programmingName||item.label||''),
      keypadName:String(item.keypadName||item.programmingName||item.label||''),
      alarmType:item.alarmType==null?null:String(item.alarmType),
      troubleType:item.troubleType==null?null:String(item.troubleType),
      is24HourDefinition:!!item.is24HourDefinition,
      characteristicTags:Array.isArray(item.characteristicTags)?item.characteristicTags.slice():[],
      sensorCompatibility:item.sensorCompatibility||null,
      sensorRuleType:item.sensorRuleType||null,
      installerProgrammingSection:'[001]-[004]',
      installerProgrammingNodeId:'ps462-zone-definition-type-'+code,
      defaultAttributesProgrammingSection:item.defaultAttributesProgrammingSection||'[101]-[164] Zone Attributes',
      defaultStdAttributes:Array.isArray(item.defaultStdAttributes)?item.defaultStdAttributes.slice():item.defaultStdAttributes,
      defaultCp01Attributes:Array.isArray(item.defaultCp01Attributes)?item.defaultCp01Attributes.slice():item.defaultCp01Attributes,
      reportingRelationshipStatus:reportingRecord.relationships.zoneDefinitions[code]&&reportingRecord.relationships.zoneDefinitions[code].status||null,
      reportingDefinition:reportingRecord.relationships.zoneDefinitions[code]&&reportingRecord.relationships.zoneDefinitions[code].reportingDefinition||null,
      systemEvents:programming.systemEventRelationships&&programming.systemEventRelationships.byZoneDefinition&&programming.systemEventRelationships.byZoneDefinition[code]?programming.systemEventRelationships.byZoneDefinition[code].slice():[]
    };
  });
  var relationships={
    schemaVersion:'1.0.0',
    installerProgrammingSection:'[001]-[004]',
    defaultAttributesProgrammingSection:'[101]-[164]',
    byCode:byCode
  };
  return {
    record:{
      id:'new-powerseries-zone-types',
      eyebrow:'New PowerSeries · Tools',
      title:'Zone Type Tools',
      subtitle:'Search and filter the New PowerSeries v4.62 zone-definition list by code, supervision, sensor contact, 24-hour behavior, alarm type, trouble type, and characteristics.',
      familyKey:'ps462',
      entries:entries,
      relationships:relationships
    },
    relationships:relationships
  };
}
var powerSeriesZoneTypeReference=buildPowerSeriesZoneTypeReference();
window.DSC_POWERSERIES_REFERENCE_DATA={
  reportingCodes:reportingRecord,
  reportingCodesV2:reportingV2Record,
  zoneTypes:powerSeriesZoneTypeReference.record
};
window.DSC_POWERSERIES_ZONE_TYPE_ENGINE={
  schemaVersion:'1.0.0',
  relationships:powerSeriesZoneTypeReference.relationships,
  getDefinition:function(definitionCode){
    var code=String(definitionCode==null?'':definitionCode).replace(/\D/g,'').padStart(2,'0').slice(-2);
    var relation=powerSeriesZoneTypeReference.relationships.byCode[code];
    return relation?cloneRelationshipValue(relation):null;
  }
};

window.DSC_POWERSERIES_REPORTING_ENGINE={
  schemaVersion:'2.0.0',
  relationships:reportingRecord.relationships,
  getZoneDefinition:function(definitionCode){
    var code=String(definitionCode==null?'':definitionCode).replace(/\D/g,'').padStart(2,'0').slice(-2),relation=reportingRecord.relationships.zoneDefinitions[code];
    return relation?cloneRelationshipValue(relation):null;
  },
  getEventRelationship:function(rowIndex){
    var relation=reportingRecord.relationships.eventRows[Number(rowIndex)];
    return relation?cloneRelationshipValue(relation):null;
  },
  getEventsForProgrammingSection:function(sectionIdOrCode){
    var key=String(sectionIdOrCode==null?'':sectionIdOrCode),ids=reportingRecord.relationships.programming462.eventRowsByProgrammingSectionId[key]||reportingRecord.relationships.programming462.eventRowsByProgrammingCode[key]||[];
    return ids.map(function(id){for(var i=0;i<reportingRecord.relationships.eventRows.length;i++){if(reportingRecord.relationships.eventRows[i].id===id) return cloneRelationshipValue(reportingRecord.relationships.eventRows[i]);}return null;}).filter(Boolean);
  },
  getAccessCodeProgrammingRelationship:function(accessCodeNumber){
    var number=Math.max(1,Math.min(95,Number(accessCodeNumber)||1)),map=reportingRecord.relationships.programming462.accessCodeProgramming||{closing:{},opening:{}};
    return {accessCodeNumber:number,closing:cloneRelationshipValue(map.closing&&map.closing[String(number)]||null),opening:cloneRelationshipValue(map.opening&&map.opening[String(number)]||null)};
  },
  getZoneProgrammingRelationship:function(zoneNumber,definitionCode){
    var zone=Math.max(1,Math.min(64,Number(zoneNumber)||1)),definition=String(definitionCode==null?'':definitionCode).replace(/\D/g,'').padStart(2,'0').slice(-2),zoneMap=window.DSC_DATA&&window.DSC_DATA.programming&&window.DSC_DATA.programming.ps462&&window.DSC_DATA.programming.ps462.internalRelationships&&window.DSC_DATA.programming.ps462.internalRelationships.zones||{},programmingIndex=buildProgramming462Index();
    return {zoneNumber:zone,definitionCode:definition,zoneProgramming:cloneRelationshipValue(zoneMap[String(zone)]||null),reportingDefinition:cloneRelationshipValue(reportingRecord.relationships.zoneDefinitions[definition]||null),alarmReporting:zoneReportingProgrammingLink(zone,320,programmingIndex),alarmRestoralReporting:zoneReportingProgrammingLink(zone,324,programmingIndex),tamperReporting:zoneReportingProgrammingLink(zone,330,programmingIndex),tamperRestoralReporting:zoneReportingProgrammingLink(zone,334,programmingIndex)};
  }
};
window.DSC_POWERSERIES_INTERNAL_RELATIONSHIPS={schemaVersion:'2.0.0',reporting:reportingRecord.relationships,zoneTypes:powerSeriesZoneTypeReference.relationships,systemEvents:cloneRelationshipValue(window.DSC_DATA&&window.DSC_DATA.programming&&window.DSC_DATA.programming.ps462&&window.DSC_DATA.programming.ps462.systemEventRelationships||{}),reportingViews:{uncategorizedReferenceId:reportingRecord.id,categorizedReferenceId:reportingV2Record.id,toolViewId:'powerseries-reporting-code-decoder',toolSourceReferenceId:reportingV2Record.id,canonicalDatasetId:reportingRecord.relationships.canonicalDatasetId},programming462:{reportingCodeProgramming:cloneRelationshipValue(window.DSC_DATA&&window.DSC_DATA.programming&&window.DSC_DATA.programming.ps462&&window.DSC_DATA.programming.ps462.internalRelationships&&window.DSC_DATA.programming.ps462.internalRelationships.reportingCodeProgramming||{}),reportingRelationships:reportingRecord.relationships.programming462}};
})();
