(function(){
'use strict';

function neoReportingPad(value,width){
  var out=String(value);
  while(out.length<width) out='0'+out;
  return out;
}
function neoReportingPairCid(prefix,number){
  return 'E(3)'+prefix+'-'+neoReportingPad(number,3)+' / R(3)'+prefix+'-'+neoReportingPad(number,3);
}
function neoReportingPairSia(eventPrefix,restorePrefix,number){
  var n=neoReportingPad(number,4);
  return eventPrefix+'-'+n+' / '+restorePrefix+'-'+n;
}
function neoReportingIndexedRows(count,definition,numberBase,cidPrefix,siaEvent,siaRestore){
  var rows=[];
  for(var i=1;i<=count;i++){
    var number=numberBase+i;
    rows.push(['[308] > [101]',definition(i),'T/R',neoReportingPairCid(cidPrefix,number),neoReportingPairSia(siaEvent,siaRestore,number)]);
  }
  return rows;
}
function buildNeoReportingCodesReference(){
  var tamperRows=[];
  tamperRows=tamperRows.concat(neoReportingIndexedRows(16,function(i){return 'Keypad '+i+' tamper/restore alarm';},600,'83','TA','TR'));
  tamperRows=tamperRows.concat(neoReportingIndexedRows(16,function(i){return 'Siren '+i+' tamper/restore alarm';},800,'83','TA','TR'));
  tamperRows=tamperRows.concat(neoReportingIndexedRows(8,function(i){return 'Repeater '+i+' tamper/restore alarm';},900,'83','TA','TR'));
  tamperRows=tamperRows.concat(neoReportingIndexedRows(15,function(i){return 'HSM2108: 8-Zone Expander module #'+i+' tamper/restored';},100,'41','ES','EJ'));
  tamperRows=tamperRows.concat(neoReportingIndexedRows(16,function(i){return 'HSM2208: 8-Output Expander module #'+i+' tamper/restored';},200,'41','ES','EJ'));
  tamperRows=tamperRows.concat(neoReportingIndexedRows(4,function(i){return 'HSM2204: Power Supply-1A (4 high-current outputs) #'+i+' tamper/restored';},600,'41','ES','EJ'));
  tamperRows=tamperRows.concat(neoReportingIndexedRows(4,function(i){return 'HSM2300: Power Supply module #'+i+' tamper/restored';},620,'41','ES','EJ'));
  tamperRows.push(['[308] > [101]','HSM2164RF Tamper/restore','T/R','E(3)41-550 / R(3)41-550','ES-0550 / EJ-0550']);
  tamperRows.push(['[308] > [101]','HSM2HOST Tamper/restore','T/R','E(3)41-551 / R(3)41-551','ES-0551 / EJ-0551']);
  tamperRows.push(['[308] > [101]','HSM2955: Audio module tamper/restore','T/R','E(3)41-553 / R(3)41-553','ES-0553 / EJ-0553']);
  tamperRows.push(['[308] > [101]','Alternate Communicator Tamper (only on supported models)','T/R','E(3)41-950 / R(3)41-950','ES-0950 / EJ-0950']);
  tamperRows.push(['[308] > [101]','Keypad Lockout - Incorrect access code entry','T/R','E(4)61-000','JA-0000']);

  var wirelessRows=[
    ['[308] > [361]','Wireless Zone Low Battery trouble/restore. ZZZ= Wireless zones 001-128.','MA/R','E(3)84-ZZZ / R(3)84-ZZZ','XT-ZZZZ / XR-ZZZZ'],
    ['[308] > [361]','Wireless Device Low Battery trouble/restore. ZZZ= 601-616: wireless keypads, 701-732: wireless keys, 801-816: wireless Sirens, 901-908: wireless repeaters.','MA/R','E(3)84-ZZZ / R(3)84-ZZZ','XT-ZZZZ / XR-ZZZZ'],
    ['[308] > [361]','Wireless Zone AC trouble/restore','MA/R','E(3)A1-ZZZ / R(3)A1-ZZZ','AT-ZZZZ / AR-ZZZZ'],
    ['[308] > [361]','Wireless Device Fault/restore','MA/R','E(3)8A-ZZZ / R(3)8A-ZZZ','UT-ZZZZ / UJ-ZZZZ'],
    ['[308] > [361]','Wireless Temperature and Flood Probe trouble/restore','MA/R','E(3)8A-ZZZ / R(3)8A-ZZZ','KT-ZZZZ / KJ-ZZZZ']
  ];
  for(var wr=1;wr<=8;wr++) wirelessRows.push(['[308] > [361]','Repeater '+wr+' AC fail/restore','MA/R','E(3)A1-'+neoReportingPad(900+wr,3)+' / R(3)A1-'+neoReportingPad(900+wr,3),'AT-'+neoReportingPad(900+wr,4)+' / AR-'+neoReportingPad(900+wr,4)]);
  wirelessRows.push(['[308] > [361]','Self Test Trouble/Restore*','MA/R','E(3)89-ZZZ / R(3)89-ZZZ','YX/YZ-ZZZZ']);

  var zoneAlarmRows=[
    ['Delay 1','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Delay 2','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Instant','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Interior','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Interior Stay/Away','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Delay Stay/Away','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Instant Stay/Away','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Interior Delay','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Day Zone','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Night Zone','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['24-Hr. Burglary','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Delayed 24-Hr. Fire (Wireless)','FA-ZZZZ / FH-ZZZZ','E(1)1A-ZZZ / R(1)1A-ZZZ'],
    ['Standard 24-Hr. Fire (Wireless)','FA-ZZZZ / FH-ZZZZ','E(1)1A-ZZZ / R(1)1A-ZZZ'],
    ['24-Hr. Sprinkler','SA-ZZZZ / SH-ZZZZ','E(1)13-ZZZ / R(1)13-ZZZ'],
    ['24-Hr.Low Temperature','ZA-ZZZZ / ZH-ZZZZ','E(1)59-ZZZ / R(1)59-ZZZ'],
    ['24-Hr High Temperature','KA-ZZZZ / KH-ZZZZ','E(1)58-ZZZ / R(1)58-ZZZ'],
    ['24-Hr. Latching Tamper','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['24-Hr. Non Alarm (Walk Test Only)','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['24-Hr. Non-latching Tamper','TA-ZZZZ / TR-ZZZZ','E(3)83-ZZZ / R(3)83-ZZZ'],
    ['Momentary Keyswitch Arm (Walk Test Only)','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Maintained Keyswitch Arm (Walk Test Only)','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Momentary Keyswitch Disarm (Walk Test Only)','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Maintained Keyswitch Disarm (Walk Test Only)','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['24-Hr. Supervisory','US-ZZZZ / UR-ZZZZ','E(1)5A-ZZZ / R(1)5A-ZZZ'],
    ['24-Hr. Supervisory Buzzer','UA-ZZZZ / UH-ZZZZ','E(1)5A-ZZZ / R(1)5A-ZZZ'],
    ['24-Hr. Auto Verified Fire (Wireless)','FA-ZZZZ / FH-ZZZZ','E(1)1A-ZZZ / R(1)1A-ZZZ'],
    ['Fire Supervisory','FS-ZZZZ / FV-ZZZZ','E(2)AA-ZZZ / R(2)AA-ZZZ'],
    ['24-Hr. Gas','GA-ZZZZ / GH-ZZZZ','E(1)51-ZZZ / R(1)51-ZZZ'],
    ['24-Hr. CO Alarm','GA-ZZZZ / GH-ZZZZ','E(1)62-ZZZ / R(1)62-ZZZ'],
    ['24-Hr. Holdup','HA-ZZZZ / HH-ZZZZ','E(1)22-ZZZ / R(1)22-ZZZ'],
    ['24-Hr. Panic','PA-ZZZZ / PH-ZZZZ','E(1)2A-ZZZ / R(1)2A-ZZZ'],
    ['24-Hr. Flood','WA-ZZZZ / WH-ZZZZ','E(1)54-ZZZ / R(1)54-ZZZ'],
    ['24-Hr Heat','KA-ZZZZ / KH-ZZZZ','E(1)58-ZZZ / R(1)58-ZZZ'],
    ['24-Hr Medical','MA-ZZZZ / MH-ZZZZ','E(1)AA-ZZZ / R(1)AA-ZZZ'],
    ['24-Hr. Emergency','QA-ZZZZ / QH-ZZZZ','E(1)A1-ZZZ / R(1)A1-ZZZ'],
    ['Doorbell Zone/Restore (Walk Test Only)','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Push to Set (Walk Test Only)','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ'],
    ['Final Door Set','BA-ZZZZ / BH-ZZZZ','E(1)3A-ZZZ / R(1)3A-ZZZ']
  ];

  // Native protocol lookup tables used by the NEO reporting-code reference.
  // Contact ID event qualifier 1 is presented as E and qualifier 3 as R.
  var standardSiaEventRows=[["AB","Abort","Unclassified","INFO","INFO","-","-"],["AN","Analog Restoral","Fire","INFO","INFO","AS","-"],["AR","AC Restoral","Technical","MEDIUM","RESTORE","AT","-"],["AS","Analog Service","Fire","INFO","INFO","-","-"],["AT","AC Trouble","Technical","MEDIUM","ALARM_NEW","-","AR"],["AU","Unknown Card","Unclassified","INFO","INFO","-","-"],["BA","Burglary Alarm","Intrusion","HIGH","ALARM_NEW","-","BC, BH, BR"],["BB","Burglary Bypass","Intrusion","MEDIUM","INFO","-","BU"],["BC","Burglary Cancel","Intrusion","-","RESTORE","BA","-"],["BD","Swinger Trouble","Intrusion","MEDIUM","ALARM_NEW","-","BE"],["BE","Swinger Trouble Restore","Intrusion","INFO","RESTORE","BD","-"],["BG","Unverified Event Burglary -","Intrusion","MEDIUM","INFO","-","-"],["BH","Burglary Alarm Restore","Intrusion","-","RESTORE","BA, BM, BV","-"],["BJ","Burglary Trouble Restore","Intrusion","-","RESTORE","BT","-"],["BM","Burglary Alarm - Cross Point","Intrusion","HIGH","ALARM_NEW","-","BH, BR"],["BR","Burglary Restoral","Intrusion","-","RESTORE","BA, BM, BV","-"],["BS","Burglary Supervisory","Intrusion","MEDIUM","INFO","-","-"],["BT","Burglary Trouble","Intrusion","MEDIUM","ALARM_NEW","-","BJ"],["BU","Burglary Unbypass","Intrusion","INFO","RESTORE","BB","-"],["BV","Burglary Verified","Intrusion","HIGH","INFO","-","BH, BR"],["BX","Burglary Test","Intrusion","INFO","INFO","-","-"],["BZ","Missing Supervision","Technical","MEDIUM","INFO","-","-"],["CA","Automatic Closing","ArmDisarm","SILENT","INFO","-","-"],["CD","Closing Delinquent","ArmDisarm","SILENT","INFO","-","-"],["CE","Closing Extend","ArmDisarm","SILENT","INFO","-","-"],["CF","Forced Closing","ArmDisarm","INFO","INFO","-","-"],["CG","Close Area","ArmDisarm","SILENT","INFO","-","-"],["CI","Fail to Close","ArmDisarm","INFO","INFO","-","-"],["CJ","Late Close","ArmDisarm","SILENT","INFO","-","-"],["CK","Early Close","ArmDisarm","SILENT","INFO","-","-"],["CL","Closing Report","ArmDisarm","-","RESTORE","OP","-"],["CM","Missing Alarm - Recent Closing","ArmDisarm","SILENT","INFO","-","-"],["CO","Command Sent","Technical","INFO","INFO","-","-"],["CP","Automatic Closing","ArmDisarm","SILENT","INFO","-","-"],["CQ","Remote Closing","ArmDisarm","SILENT","RESTORE","OQ","-"],["CR","Recent Closing","ArmDisarm","SILENT","INFO","-","-"],["CS","Closing Keyswitch","ArmDisarm","-","RESTORE","OS","-"],["CT","Late to Open","ArmDisarm","SILENT","INFO","-","-"],["CU","Camera online","Technical","MEDIUM","INFO","-","-"],["CV","Camera offline","Technical","MEDIUM","INFO","-","-"],["CW","Was Force Armed","ArmDisarm","INFO","INFO","-","-"],["CX","Custom Function Executed","Technical","INFO","INFO","-","-"],["CZ","Point Closing","ArmDisarm","INFO","INFO","-","-"],["DA","Card Assigned An access","DoorAccess","INFO","INFO","-","-"],["DB","Card Deleted An access","DoorAccess","INFO","INFO","-","-"],["DC","Access Closed","DoorAccess","INFO","INFO","-","-"],["DD","Access Denied","DoorAccess","LOW","INFO","-","-"],["DE","Request to Enter","DoorAccess","INFO","INFO","-","-"],["DF","Door Forced","DoorAccess","MEDIUM","ALARM_NEW","-","DH, DR"],["DG","Access Granted","DoorAccess","INFO","INFO","-","-"],["DH","Door Left Open Restoral -","DoorAccess","-","RESTORE","DF, DL, DN","-"],["DI","Access Denied — Passback","DoorAccess","MEDIUM","INFO","-","-"],["DJ","Door Forced - Trouble","DoorAccess","MEDIUM","INFO","-","-"],["DK","Access Lockout","DoorAccess","MEDIUM","INFO","-","-"],["DL","Door Left Open Alarm -","DoorAccess","LOW","ALARM_NEW","-","DH, DR"],["DM","Door Left Open Trouble -","DoorAccess","MEDIUM","INFO","-","-"],["DN","Door Left Open","DoorAccess","LOW","ALARM_NEW","-","DH, DR"],["DO","Access Open","DoorAccess","INFO","INFO","-","-"],["DP","Access Denied - Unauthorized Time","DoorAccess","LOW","INFO","-","-"],["DQ","Access Denied Unauthorized","DoorAccess","LOW","INFO","-","-"],["DR","Door Restoral","DoorAccess","-","RESTORE","DF, DL, DN","-"],["DS","Door Station","DoorAccess","INFO","INFO","-","-"],["DT","Access Trouble","DoorAccess","MEDIUM","INFO","-","-"],["DU","Dealer ID","Unclassified","INFO","INFO","-","-"],["DV","Access Denied Unauthorized","DoorAccess","MEDIUM","INFO","-","-"],["DW","Access Denied - Interlock","DoorAccess","MEDIUM","INFO","-","-"],["DX","Request to Exit","DoorAccess","INFO","INFO","-","-"],["DY","Door Locked","DoorAccess","INFO","INFO","-","-"],["DZ","Access Denied - Door Secured","DoorAccess","MEDIUM","INFO","-","-"],["EA","Exit Alarm","DoorAccess","MEDIUM","INFO","-","-"],["EE","Exit Error","DoorAccess","MEDIUM","INFO","-","-"],["EJ","Expansion Tamper Restore","Technical","MEDIUM","RESTORE","ES","-"],["EM","Expansion Device Missing","Technical","MEDIUM","ALARM_NEW","-","EN"],["EN","Expansion Missing Restore","Technical","MEDIUM","RESTORE","EM","-"],["ER","Expansion Restoral","Technical","MEDIUM","RESTORE","ET","-"],["ES","Expansion Device Tamper","Technical","MEDIUM","ALARM_NEW","-","EJ"],["ET","Expansion Trouble","Technical","MEDIUM","ALARM_NEW","-","ER"],["EX","External Device Condition","Technical","INFO","INFO","-","-"],["EZ","Missing Alarm - Exit Error","Unclassified","MEDIUM","INFO","-","-"],["FA","Fire Alarm","Fire","HIGH","ALARM_NEW","-","FH, FR"],["FB","Fire Bypass","Fire","LOW","ALARM_NEW","-","FU"],["FC","Fire Cancel","Fire","MEDIUM","INFO","-","-"],["FG","Unverified Event Fire —","Fire","MEDIUM","INFO","-","-"],["FH","Fire Alarm Restore","Fire","-","RESTORE","FA","-"],["FI","Fire Test Begin","Fire","INFO","INFO","-","-"],["FJ","Fire Trouble Restore","Fire","-","RESTORE","FT","-"],["FK","Fire Test End","Fire","INFO","INFO","FI","-"],["FL","Fire Alarm Silenced","Fire","LOW","INFO","-","-"],["FM","Fire Alarm - Cross Point","Fire","HIGH","ALARM_NEW","-","-"],["FQ","Fire Supervisory Trouble Restore","Fire","-","RESTORE","FW","-"],["FR","Fire Restoral","Fire","-","RESTORE","FA","-"],["FS","Fire Supervisory","Fire","MEDIUM","ALARM_NEW","-","FV"],["FT","Fire Trouble","Fire","MEDIUM","ALARM_NEW","-","FJ"],["FU","Fire Unbypass","Fire","-","RESTORE","FB","-"],["FV","Fire Supervision Restore","Fire","-","RESTORE","FS","-"],["FW","Fire Supervisory Trouble","Fire","MEDIUM","ALARM_NEW","-","FQ"],["FX","Fire Test","Fire","LOW","ALARM_NEW","-","-"],["FY","Missing Fire Trouble","Fire","MEDIUM","INFO","-","-"],["FZ","Missing Fire Supervision","Fire","MEDIUM","INFO","-","-"],["GA","Gas Alarm","Environmental","HIGH","ALARM_NEW","-","GH, GR"],["GB","Gas Bypass","Environmental","MEDIUM","ALARM_NEW","-","-"],["GH","Gas Alarm Restore","Environmental","-","RESTORE","GA","-"],["GJ","Gas Trouble Restore","Environmental","-","RESTORE","GT","-"],["GR","Gas Restoral","Environmental","-","RESTORE","GA","-"],["GS","Gas Supervisory","Environmental","MEDIUM","INFO","-","-"],["GT","Gas Trouble","Environmental","MEDIUM","ALARM_NEW","-","GJ"],["GU","Gas Unbypass","Environmental","-","RESTORE","-","-"],["GX","Gas Test","Environmental","INFO","INFO","-","-"],["HA","Holdup Alarm","PanicEmergency","HIGH","ALARM_NEW","-","HH, HR"],["HB","Holdup Bypass","PanicEmergency","MEDIUM","ALARM_NEW","-","HU"],["HF","Hardware Fault","PanicEmergency","MEDIUM","INFO","-","-"],["HH","Holdup Alarm Restore","PanicEmergency","-","RESTORE","HA","-"],["HJ","Holdup Trouble Restore","PanicEmergency","-","RESTORE","HT","-"],["HR","Holdup Restoral","PanicEmergency","-","RESTORE","HA","-"],["HS","Holdup Supervisory","PanicEmergency","MEDIUM","INFO","-","-"],["HT","Holdup Trouble","PanicEmergency","MEDIUM","ALARM_NEW","-","HJ"],["HU","Holdup Unbypass","PanicEmergency","-","RESTORE","HB","-"],["IA","Equipment Failure Condition","Technical","MEDIUM","ALARM_NEW","-","IR"],["IR","Equipment Fail - Restoral","Technical","-","RESTORE","IA","-"],["JA","User Code Tamper","Technical","MEDIUM","INFO","-","-"],["JD","Date Changed","Technical","INFO","INFO","-","-"],["JH","Holiday Changed","Technical","INFO","INFO","-","-"],["JK","Latchkey Alert","Unclassified","INFO","INFO","-","-"],["JL","Log Threshold","Technical","INFO","INFO","-","-"],["JO","Log Overflow","Technical","INFO","INFO","-","-"],["JP","User On Premises","Unclassified","INFO","INFO","-","-"],["JR","Schedule Executed","Technical","INFO","INFO","-","-"],["JS","Schedule Changed","Technical","INFO","INFO","-","-"],["JT","Time Changed","Technical","INFO","INFO","-","-"],["JV","User Code Changed","Technical","INFO","INFO","-","-"],["JX","User Code Deleted","Technical","INFO","INFO","-","-"],["JY","User Code Added","Technical","INFO","INFO","-","-"],["JZ","User Level Set","Technical","INFO","INFO","-","-"],["KA","Heat Alarm","Environmental","MEDIUM","ALARM_NEW","-","KH, KR"],["KB","Heat Bypass","Environmental","MEDIUM","INFO","-","-"],["KH","Heat Alarm Restore","Environmental","-","RESTORE","KA","-"],["KJ","Heat Trouble Restore","Environmental","-","RESTORE","KT","-"],["KR","Heat Restoral","Environmental","-","RESTORE","KA","-"],["KS","Heat Supervisory","Environmental","MEDIUM","INFO","-","-"],["KT","Heat Trouble","Environmental","LOW","ALARM_NEW","-","KJ"],["KU","Heat Unbypass","Environmental","INFO","INFO","-","-"],["LA","Lift Alarm","Elevator","HIGH","ALARM_NEW","-","-"],["LB","Local Program","Technical","INFO","INFO","-","-"],["LD","Local Program Denied","Technical","INFO","INFO","-","-"],["LE","Listen-in Ended","Unclassified","INFO","INFO","LF","-"],["LF","Listen-in Begin","Unclassified","INFO","INFO","-","-"],["LR","Phone Line Restoral","Technical","-","RESTORE","LT","-"],["LS","Local Program Success","Technical","INFO","INFO","-","-"],["LT","Phone Line Trouble","Technical","MEDIUM","ALARM_NEW","-","LR"],["LU","Local Program Fail","Technical","MEDIUM","INFO","-","-"],["LX","Local Programming Ended","Technical","INFO","INFO","-","-"],["MA","Medical Alarm","Medical","HIGH","ALARM_NEW","-","MH, MR"],["MB","Medical Bypass","Medical","MEDIUM","ALARM_NEW","-","MU"],["MH","Medical Alarm Restore","Medical","-","RESTORE","MA","-"],["MI","Message","Unclassified","INFO","INFO","-","-"],["MJ","Medical Trouble Restore","Medical","-","RESTORE","MT","-"],["MR","Medical Restoral","Medical","-","RESTORE","MA","-"],["MS","Medical Supervisory","Medical","MEDIUM","INFO","-","-"],["MT","Medical Trouble","Medical","MEDIUM","ALARM_NEW","-","MJ"],["MU","Medical Unbypass","Medical","-","RESTORE","MB","-"],["NA","No Activity","Unclassified","INFO","INFO","-","-"],["NB","Alert Clode Node","Unclassified","INFO","INFO","-","-"],["NC","Network Condition","Technical","MEDIUM","INFO","-","-"],["NF","Forced Perimeter Arm","ArmDisarm","SILENT","INFO","-","-"],["NL","Perimeter Armed","ArmDisarm","SILENT","INFO","-","-"],["NM","Perimeter Armed, User Defined","ArmDisarm","SILENT","INFO","-","-"],["NO","Alert Reopen Node","Unclassified","INFO","INFO","-","-"],["NR","Network Restoral","Technical","-","RESTORE","NT","-"],["NS","Activity Resumed","Intrusion","INFO","INFO","-","-"],["NT","Network Failure","Technical","MEDIUM","ALARM_NEW","-","NR"],["OA","Automatic Opening","ArmDisarm","SILENT","INFO","-","-"],["OC","Cancel Report","ArmDisarm","SILENT","INFO","-","-"],["OG","Open Area","ArmDisarm","SILENT","INFO","-","-"],["OH","Early to Open from Alarm","ArmDisarm","SILENT","INFO","-","-"],["OI","Fail to Open","ArmDisarm","INFO","INFO","-","-"],["OJ","Late Open","ArmDisarm","SILENT","INFO","-","-"],["OK","Early Open","ArmDisarm","SILENT","INFO","-","-"],["OL","Late to Open from Alarm","ArmDisarm","SILENT","INFO","-","-"],["OP","Opening Report","ArmDisarm","SILENT","INFO","-","CL"],["OQ","Remote Opening","ArmDisarm","SILENT","INFO","-","CQ"],["OR","Disarm From Alarm","ArmDisarm","SILENT","INFO","-","-"],["OS","Opening Keyswitch","ArmDisarm","SILENT","INFO","-","CS"],["OT","Late To Close","ArmDisarm","SILENT","INFO","-","-"],["OU","Output State — Trouble","Technical","MEDIUM","ALARM_NEW","-","OV"],["OV","Output State — Restore","Technical","-","RESTORE","OU","-"],["OZ","Point Opening","ArmDisarm","SILENT","INFO","-","-"],["PA","Panic Alarm","PanicEmergency","HIGH","ALARM_NEW","-","PH, PR"],["PB","Panic Bypass","PanicEmergency","MEDIUM","ALARM_NEW","-","PU"],["PH","Panic Alarm Restore","PanicEmergency","-","RESTORE","PA","-"],["PJ","Panic Trouble Restore","PanicEmergency","-","RESTORE","PT","-"],["PR","Panic Restoral","PanicEmergency","-","RESTORE","PA","-"],["PS","Panic Supervisory","PanicEmergency","MEDIUM","INFO","-","-"],["PT","Panic Trouble","PanicEmergency","MEDIUM","ALARM_NEW","-","PJ"],["PU","Panic Unbypass","PanicEmergency","-","RESTORE","PB","-"],["QA","Emergency Alarm","PanicEmergency","HIGH","ALARM_NEW","-","QH, QR"],["QB","Emergency Bypass","PanicEmergency","MEDIUM","ALARM_NEW","-","QU"],["QC","Operational Alarm A (ARX)","Technical","MEDIUM","ALARM_NEW","-","QV"],["QD","Operational Alarm B (ARX)","Technical","MEDIUM","ALARM_NEW","-","QX"],["QE","Operational Alarm C (ARX)","Technical","MEDIUM","ALARM_NEW","-","QY"],["QH","Emergency Alarm Restore","PanicEmergency","-","RESTORE","QA","-"],["QJ","Emergency Trouble Restore","PanicEmergency","-","RESTORE","QT","-"],["QK","Motor Lock Failure (ARX)","DoorAccess","MEDIUM","ALARM_NEW","-","QP"],["QO","Motor Lock Unlocked (ARX)","DoorAccess","MEDIUM","INFO","-","-"],["QP","Motor Lock Failure Restored (ARX)","DoorAccess","-","RESTORE","QK","-"],["QR","Emergency Restoral","PanicEmergency","-","RESTORE","QA","-"],["QS","Emergency Supervisory","PanicEmergency","MEDIUM","INFO","-","-"],["QT","Emergency Trouble","PanicEmergency","MEDIUM","ALARM_NEW","-","QJ"],["QU","Emergency Unbypass","PanicEmergency","-","RESTORE","QB","-"],["QV","Operational Alarm A restored (ARX)","Technical","-","RESTORE","QC","-"],["QX","Operational Alarm B restored (ARX)","Technical","-","RESTORE","QD","-"],["QY","Operational Alarm C restored (ARX)","Technical","-","RESTORE","QE","-"],["RA","Remote Programmer Call Failed","Technical","INFO","INFO","-","-"],["RB","Remote Program Begin","Technical","INFO","INFO","-","-"],["RC","Relay Close","Unclassified","INFO","INFO","-","-"],["RD","Remote Program Denied","Technical","INFO","INFO","-","-"],["RN","Remote Reset","Technical","INFO","INFO","-","-"],["RO","Relay Open","Unclassified","INFO","INFO","-","-"],["RP","Automatic Test","Technical","SILENT","INFO","-","-"],["RR","Power Up","Technical","INFO","INFO","-","-"],["RS","Remote Program Success","Technical","INFO","INFO","-","-"],["RT","Data Lost","Technical","INFO","INFO","-","-"],["RU","Remote Program Fail","Technical","INFO","INFO","-","-"],["RX","Manual Test","Technical","INFO","INFO","-","-"],["RY","Test Off Normal","Technical","INFO","INFO","-","-"],["SA","Sprinkler Alarm","Fire","HIGH","ALARM_NEW","-","SH, SR"],["SB","Sprinkler Bypass","Fire","MEDIUM","ALARM_NEW","-","SU"],["SC","Change of State","Unclassified","INFO","INFO","-","-"],["SD","Alert Close","Unclassified","INFO","INFO","-","-"],["SH","Sprinkler Alarm Restore","Fire","-","RESTORE","SA","-"],["SJ","Sprinkler Trouble Restore","Fire","-","RESTORE","ST","-"],["SO","Aller Reopen","Unclassified","INFO","INFO","-","-"],["SR","Sprinkler Restoral","Fire","-","RESTORE","SA","-"],["SS","Sprinkler Supervisory","Fire","MEDIUM","ALARM_NEW","-","-"],["ST","Sprinkler Trouble","Fire","MEDIUM","ALARM_NEW","-","SJ"],["SU","Sprinkler Unbypass","Fire","-","RESTORE","SB","-"],["TA","Tamper Alarm","Technical","MEDIUM","ALARM_NEW","-","TH, TR"],["TB","Tamper Bypass","Technical","LOW","ALARM_NEW","-","TU"],["TC","All Points Tested","Technical","INFO","INFO","-","-"],["TE","Test End","Technical","INFO","INFO","-","-"],["TH","Tamper Alarm Restore","Technical","-","RESTORE","TA","-"],["TJ","Tamper Trouble Restore","Technical","-","RESTORE","TT","-"],["TP","Walk Test Point","Technical","INFO","INFO","-","-"],["TR","Tamper Restoral","Technical","-","RESTORE","TA","-"],["TS","Test Start","Technical","INFO","INFO","-","-"],["TT","Tamper Trouble","Technical","MEDIUM","ALARM_NEW","-","TJ"],["TU","Tamper Unbypass","Technical","-","RESTORE","TB","-"],["TW","Area Watch Start","Technical","INFO","INFO","-","-"],["TX","Test Report","Technical","INFO","INFO","-","-"],["TZ","Area Watch End","Technical","INFO","INFO","TW","-"],["UA","Untyped Zone Alarm","Intrusion","MEDIUM","ALARM_NEW","-","UH, UR"],["UB","Untyped Zone Bypass","Intrusion","MEDIUM","ALARM_NEW","-","UU"],["UG","Unverified Event Untyped —","Intrusion","MEDIUM","INFO","-","-"],["UH","Untyped Alarm Restore","Intrusion","MEDIUM","RESTORE","UA","-"],["UJ","Untyped Trouble Restore","Intrusion","MEDIUM","RESTORE","UT","-"],["UR","Untyped Zone Restoral","Intrusion","MEDIUM","RESTORE","UA","-"],["US","Untyped Zone Supervisory","Intrusion","MEDIUM","INFO","-","-"],["UT","Untyped Zone Trouble","Intrusion","MEDIUM","ALARM_NEW","-","UJ"],["UU","Untyped Zone Unbypass","Intrusion","MEDIUM","RESTORE","UB","-"],["UX","Undefined","Unclassified","INFO","INFO","-","-"],["UY","Untyped Missing Trouble","Intrusion","INFO","INFO","-","-"],["UZ","Untyped Missing Alarm","Intrusion","INFO","INFO","-","-"],["VI","Printer Paper In","Technical","INFO","INFO","-","-"],["VO","Printer Paper Out","Technical","INFO","INFO","-","-"],["VR","Printer Restore","Technical","INFO","INFO","VT","-"],["VT","Printer Trouble","Technical","INFO","INFO","-","-"],["VX","Printer Test","Technical","INFO","INFO","-","-"],["VY","Printer Online","Technical","INFO","INFO","VZ","-"],["VZ","Printer Offline","Technical","INFO","INFO","VY","-"],["WA","Water Alarm","Environmental","MEDIUM","ALARM_NEW","-","WH, WR"],["WB","Water Bypass","Environmental","MEDIUM","ALARM_NEW","-","WU"],["WH","Water Alarm Restore","Environmental","-","RESTORE","WA","-"],["WJ","Water Trouble Restore","Environmental","-","RESTORE","WT","-"],["WR","Water Restoral","Environmental","-","RESTORE","WA","-"],["WS","Water Supervisory","Environmental","MEDIUM","INFO","-","-"],["WT","Water Trouble","Environmental","MEDIUM","ALARM_NEW","-","WJ"],["WU","Water Unbypass","Environmental","-","RESTORE","WB","-"],["WW","Web Locked","Unclassified","INFO","INFO","-","-"],["WX","Web Unlocked","Unclassified","INFO","INFO","-","-"],["XA","Extra Account Report CS","Unclassified","INFO","INFO","-","-"],["XB","PSU Output LV Open","Technical","INFO","INFO","-","-"],["XC","PSU Output LV Close","Technical","INFO","INFO","-","-"],["XD","PSU Battery Low","Technical","MEDIUM","ALARM_NEW","-","-"],["XE","Extra Point","Technical","INFO","INFO","-","-"],["XF","Extra RF Point","Technical","INFO","INFO","-","-"],["XG","PSU Battery Low Restoral","Technical","-","RESTORE","-","-"],["XH","RF Interference Restoral","Technical","-","RESTORE","-","-"],["XI","Sensor Reset","Technical","INFO","INFO","-","-"],["XJ","RF Receiver Tamper Restoral","Technical","-","RESTORE","-","-"],["XK","PSU Battery Discharged","Technical","MEDIUM","INFO","-","-"],["XL","Low Received Signal Strength","Technical","MEDIUM","INFO","-","-"],["XM","Missing Alarm - Cross Point","Unclassified","INFO","INFO","-","-"],["XQ","RF Interference","Technical","MEDIUM","ALARM_NEW","-","-"],["XR","Transmitter Battery Restoral","Technical","-","RESTORE","XT","-"],["XS","RF Receiver Tamper","Technical","MEDIUM","ALARM_NEW","-","-"],["XT","Transmitter Battery Trouble","Technical","MEDIUM","ALARM_NEW","-","XR"],["XW","Forced Point","Unclassified","INFO","INFO","-","-"],["XX","Fail to Test","Technical","MEDIUM","INFO","-","-"],["XY","Network Fault","Technical","MEDIUM","ALARM_NEW","-","XZ"],["XZ","Network Restoral","Technical","-","RESTORE","XY","-"],["YA","Bell Fault","Technical","LOW","ALARM_NEW","-","YH"],["YB","Busy Seconds Percent of time receiver","Technical","INFO","INFO","-","-"],["YC","Communications Fail","Technical","MEDIUM","ALARM_NEW","-","YK"],["YD","Receiver Line Card Trouble","Technical","MEDIUM","INFO","-","-"],["YE","Receiver Line Card Restored","Technical","MEDIUM","INFO","YD","-"],["YF","Parameter Checksum Fail","Technical","INFO","INFO","-","-"],["YG","Parameter Changed","Technical","INFO","INFO","-","-"],["YH","Bell Restored","Technical","-","RESTORE","YA","-"],["YI","Overcurrent Trouble","Technical","LOW","ALARM_NEW","-","YJ"],["YJ","Overcurrent Restore","Technical","-","RESTORE","YI","-"],["YK","Communications Restoral","Technical","-","RESTORE","YC","-"],["YM","System Battery Missing","Technical","LOW","INFO","-","-"],["YN","Invalid Report","Unclassified","MEDIUM","INFO","-","-"],["YO","Unknown Message","Unclassified","MEDIUM","INFO","-","-"],["YP","Power Supply Trouble","Technical","MEDIUM","ALARM_NEW","-","YQ"],["YQ","Power Supply Restored","Technical","-","RESTORE","YP","-"],["YR","System Battery Restoral","Technical","-","RESTORE","YT","-"],["YS","Communications Trouble","Technical","MEDIUM","INFO","-","-"],["YT","System Battery Trouble","Technical","MEDIUM","ALARM_NEW","-","YR"],["YU","Diagnostic Error","Technical","MEDIUM","INFO","-","-"],["YW","Watchdog Reset","Technical","INFO","INFO","-","-"],["YX","Service Required","Technical","INFO","INFO","-","-"],["YY","Status Report","Unclassified","INFO","INFO","-","-"],["YZ","Service Completed","Technical","INFO","INFO","YX","-"],["ZA","Freeze Alarm","Environmental","HIGH","ALARM_NEW","-","ZH, ZR"],["ZB","Freeze Bypass","Environmental","MEDIUM","ALARM_NEW","-","ZU"],["ZC","Zone Close","Unclassified","INFO","INFO","ZO","-"],["ZD","Zone Disconnect","Unclassified","INFO","INFO","-","-"],["ZE","Keypad Locked","Unclassified","INFO","INFO","-","-"],["ZF","Zone Fault","Unclassified","INFO","INFO","-","-"],["ZG","User accessing end","Unclassified","INFO","INFO","-","-"],["ZH","Freeze Alarm Restore","Environmental","-","RESTORE","ZA","-"],["ZI","Zone Out Of Bounds","Unclassified","INFO","INFO","-","-"],["ZJ","Freeze Trouble Restore","Environmental","-","RESTORE","ZT","-"],["ZK","Walktest Start","Unclassified","INFO","INFO","-","-"],["ZL","Keypad Unlocked","Unclassified","INFO","INFO","ZE","-"],["ZM","Zone Masked","Intrusion","MEDIUM","INFO","-","-"],["ZN","Zone Unstable","Unclassified","MEDIUM","INFO","-","-"],["ZO","Zone Open","Unclassified","INFO","INFO","-","-"],["ZR","Freeze Restoral","Environmental","-","RESTORE","ZA","-"],["ZS","Freeze Supervisory","Environmental","MEDIUM","INFO","-","-"],["ZT","Freeze Trouble","Environmental","MEDIUM","ALARM_NEW","-","ZJ"],["ZU","Freeze Unbypass","Environmental","-","RESTORE","ZB","-"],["ZX","Zone Short","Unclassified","INFO","INFO","-","-"],["AA","Alarm Panel — Substitution","Technical","MEDIUM","ALARM_NEW","-","-"]];
  var standardContactIdEventRows=[["Medical Alarm","Medical","HIGH","ALARM_NEW","E","100"],["Medical Alarm Restored","Medical","-","ALARM_RESTORED","R","100"],["Emergency Alarm","PanicEmergency","HIGH","ALARM_NEW","E","101"],["Emergency Alarm Restored","PanicEmergency","-","ALARM_RESTORED","R","101"],["Fail to Report","Medical","LOW","ALARM_NEW","E","102"],["Fail to Report Restored","Medical","-","ALARM_RESTORED","R","102"],["Fire Alarm","Fire","HIGH","ALARM_NEW","E","110"],["Fire Alarm Restored","Fire","-","ALARM_RESTORED","R","110"],["Smoke","Fire","HIGH","ALARM_NEW","E","111"],["Smoke Restored","Fire","-","ALARM_RESTORED","R","111"],["Combustion","Fire","HIGH","ALARM_NEW","E","112"],["Combustion Restored","Fire","-","ALARM_RESTORED","R","112"],["Water Alarm","Environmental","MEDIUM","ALARM_NEW","E","113"],["Water Alarm Restored","Environmental","-","ALARM_RESTORED","R","113"],["Heat Alarm","Environmental","MEDIUM","ALARM_NEW","E","114"],["Heat Alarm Restored","Environmental","-","ALARM_RESTORED","R","114"],["Pull Station","Fire","HIGH","ALARM_NEW","E","115"],["Pull Station Restored","Fire","-","ALARM_RESTORED","R","115"],["Duct","Fire","HIGH","ALARM_NEW","E","116"],["Duct Restored","Fire","-","ALARM_RESTORED","R","116"],["Flame","Fire","HIGH","ALARM_NEW","E","117"],["Flame Restored","Fire","-","ALARM_RESTORED","R","117"],["Near Alarm","Fire","HIGH","ALARM_NEW","E","118"],["Near Alarm Restored","Fire","-","ALARM_RESTORED","R","118"],["Panic Alarm","PanicEmergency","HIGH","ALARM_NEW","E","120"],["Panic Alarm Restored","PanicEmergency","-","ALARM_RESTORED","R","120"],["Duress","PanicEmergency","HIGH","ALARM_NEW","E","121"],["Duress Restored","PanicEmergency","-","ALARM_RESTORED","R","121"],["Holdup Alarm","PanicEmergency","HIGH","ALARM_NEW","E","122"],["Holdup Alarm Restored","PanicEmergency","-","ALARM_RESTORED","R","122"],["Panic Audible","PanicEmergency","HIGH","ALARM_NEW","E","123"],["Panic Audible Restored","PanicEmergency","-","ALARM_RESTORED","R","123"],["Duress Access Granted","PanicEmergency","INFO","INFO","E","124"],["Duress Egress Granted","PanicEmergency","INFO","INFO","E","125"],["Burglary Alarm","Intrusion","HIGH","ALARM_NEW","E","130"],["Burglary Alarm Restored","Intrusion","-","ALARM_RESTORED","R","130"],["Burglary Perimeter","Intrusion","HIGH","ALARM_NEW","E","131"],["Burglary Perimeter Restored","Intrusion","-","ALARM_RESTORED","R","131"],["Burglary Interior","Intrusion","HIGH","ALARM_NEW","E","132"],["Burglary Interior Restored","Intrusion","-","ALARM_RESTORED","R","132"],["Burglary 24 Hour","Intrusion","HIGH","ALARM_NEW","E","133"],["Burglary 24 Hour Restored","Intrusion","-","ALARM_RESTORED","R","133"],["Entry/Exit","ArmDisarm","SILENT","INFO","E","134"],["Day/Night","ArmDisarm","SILENT","INFO","E","135"],["Burglary Outdoor","Intrusion","HIGH","ALARM_NEW","E","136"],["Burglary Outdoor Restored","Intrusion","-","ALARM_RESTORED","R","136"],["Tamper Alarm","Technical","MEDIUM","ALARM_NEW","E","137"],["Tamper Alarm Restored","Technical","-","ALARM_RESTORED","R","137"],["Near Alarm","Intrusion","HIGH","ALARM_NEW","E","138"],["Near Alarm Restored","Intrusion","-","ALARM_RESTORED","R","138"],["Burglary Verified","Intrusion","HIGH","INFO","E","139"],["Untyped Zone Alarm","Intrusion","MEDIUM","ALARM_NEW","E","140"],["Untyped Alarm Restored","Intrusion","MEDIUM","ALARM_RESTORED","R","140"],["Polling Loop Open","Technical","LOW","ALARM_NEW","E","141"],["Polling Loop Open Restored","Technical","-","ALARM_RESTORED","R","141"],["Polling Loop Short","Technical","LOW","ALARM_NEW","E","142"],["Polling Loop Short Restored","Technical","-","ALARM_RESTORED","R","142"],["Expansion Restored","Technical","MEDIUM","ALARM_RESTORED","R","143"],["Expansion Trouble","Technical","MEDIUM","ALARM_NEW","E","143"],["Sensor Tamper","Intrusion","LOW","ALARM_NEW","E","144"],["Sensor Tamper Restored","Intrusion","-","ALARM_RESTORED","R","144"],["Expansion Tamper Restored","Technical","MEDIUM","ALARM_RESTORED","R","145"],["Expansion Device Tamper","Technical","MEDIUM","ALARM_NEW","E","145"],["Burglary Silent","Intrusion","HIGH","ALARM_NEW","E","146"],["Burglary Silent Restored","Intrusion","-","ALARM_RESTORED","R","146"],["Sensor Supervision Failure","Intrusion","LOW","ALARM_NEW","E","147"],["Sensor Supervision Failure Restored","Intrusion","-","ALARM_RESTORED","R","147"],["Non-Burglary 24- Hour","Intrusion","MEDIUM","ALARM_NEW","E","150"],["Non-Burglary 24- Hour Restored","Intrusion","-","ALARM_RESTORED","R","150"],["Gas Alarm","Environmental","HIGH","ALARM_NEW","E","151"],["Gas Alarm Restored","Environmental","-","ALARM_RESTORED","R","151"],["Refrigeration","Environmental","MEDIUM","ALARM_NEW","E","152"],["Refrigeration Restored","Environmental","-","ALARM_RESTORED","R","152"],["Loss of Heat","Environmental","MEDIUM","ALARM_NEW","E","153"],["Loss of Heat Restored","Environmental","-","ALARM_RESTORED","R","153"],["Water Leakage","Environmental","MEDIUM","ALARM_NEW","E","154"],["Water Leakage Restored","Environmental","-","ALARM_RESTORED","R","154"],["Foil Break","Technical","LOW","ALARM_NEW","E","155"],["Foil Break Restored","Technical","-","ALARM_RESTORED","R","155"],["Day Trouble","Technical","LOW","ALARM_NEW","E","156"],["Day Trouble Restored","Technical","-","ALARM_RESTORED","R","156"],["Low Bottled Gas Level","Environmental","LOW","ALARM_NEW","E","157"],["Low Bottled Gas Level Restored","Environmental","-","ALARM_RESTORED","R","157"],["High Temp","Environmental","LOW","ALARM_NEW","E","158"],["High Temp Restored","Environmental","-","ALARM_RESTORED","R","158"],["Freeze Alarm","Environmental","HIGH","ALARM_NEW","E","159"],["Freeze Alarm Restored","Environmental","-","ALARM_RESTORED","R","159"],["Low Temp","Environmental","LOW","ALARM_NEW","E","161"],["Low Temp Restored","Environmental","-","ALARM_RESTORED","R","161"],["Loss of Airflow","Environmental","LOW","ALARM_NEW","E","162"],["Loss of Airflow Restored","Environmental","-","ALARM_RESTORED","R","162"],["Tank Level","Technical","LOW","ALARM_NEW","E","163"],["Tank Level Restored","Technical","-","ALARM_RESTORED","R","163"],["Fire Supervisory","Fire","MEDIUM","ALARM_NEW","E","200"],["Fire Supervision Restored","Fire","-","ALARM_RESTORED","R","200"],["Low Water Pressure","Environmental","LOW","ALARM_NEW","E","201"],["Low Water Pressure Restored","Environmental","-","ALARM_RESTORED","R","201"],["Low CO2","Environmental","LOW","ALARM_NEW","E","202"],["Low CO2 Restored","Environmental","-","ALARM_RESTORED","R","202"],["Gate Valve Sensor","Technical","LOW","ALARM_NEW","E","203"],["Gate Valve Sensor Restored","Technical","-","ALARM_RESTORED","R","203"],["Low Water Level","Technical","LOW","ALARM_NEW","E","204"],["Low Water Level Restored","Technical","-","ALARM_RESTORED","R","204"],["Pump Activated","Technical","INFO","INFO","E","205"],["Pump Failure","Technical","LOW","ALARM_NEW","E","206"],["Pump Failure Restored","Technical","-","ALARM_RESTORED","R","206"],["System Trouble","Technical","LOW","ALARM_NEW","E","300"],["System Trouble Restored","Technical","-","ALARM_RESTORED","R","300"],["Mains Power Restored","Technical","MEDIUM","ALARM_RESTORED","R","301"],["Mains power trouble","Technical","MEDIUM","ALARM_NEW","E","301"],["System Battery Restored","Technical","-","ALARM_RESTORED","R","302"],["System Battery Trouble","Technical","MEDIUM","ALARM_NEW","E","302"],["RAM Checksum Bad","Technical","INFO","INFO","E","303"],["ROM Checksum Bad","Technical","INFO","INFO","E","304"],["System Reset","Technical","INFO","INFO","R","305"],["Remote Program Success","Technical","INFO","INFO","E","306"],["Self-test Failure","Technical","LOW","ALARM_NEW","E","307"],["-","Technical","-","ALARM_RESTORED","R","307"],["System Shutdown","Technical","INFO","INFO","E","308"],["Battery Test Failure","Technical","LOW","ALARM_NEW","E","309"],["Battery Test Failure Restored","Technical","-","ALARM_RESTORED","R","309"],["Ground Fault","Technical","LOW","ALARM_NEW","E","310"],["Ground Fault Restored","Technical","-","ALARM_RESTORED","R","310"],["System Battery Missing","Technical","LOW","INFO","E","311"],["Overcurrent Trouble","Technical","LOW","ALARM_NEW","E","312"],["Overcurrent Restored","Technical","-","ALARM_RESTORED","R","312"],["Engineer Reset","Technical","INFO","INFO","E","313"],["Sounder Relay","Technical","LOW","ALARM_NEW","E","320"],["Sounder Relay Restored","Technical","-","ALARM_RESTORED","R","320"],["Bell 1","Technical","LOW","ALARM_NEW","E","321"],["Bell 1 Restored","Technical","-","ALARM_RESTORED","R","321"],["Bell 2","Technical","LOW","ALARM_NEW","E","322"],["Bell 2 Restored","Technical","-","ALARM_RESTORED","R","322"],["Alarm Relay","Technical","MEDIUM","ALARM_NEW","E","323"],["Alarm Relay Restored","Technical","-","ALARM_RESTORED","R","323"],["Trouble Relay","Technical","LOW","ALARM_NEW","E","324"],["Trouble Relay Restored","Technical","-","ALARM_RESTORED","R","324"],["Reversing Relay","Technical","LOW","ALARM_NEW","E","325"],["Reversing Relay Restored","Technical","-","ALARM_RESTORED","R","325"],["Notification Appliance Circuit 3","Technical","LOW","ALARM_NEW","E","326"],["Notification Appliance Circuit 3 Restored","Technical","-","ALARM_RESTORED","R","326"],["Notification Appliance Circuit 4","Technical","LOW","ALARM_NEW","E","327"],["Notification Appliance Circuit 4 Restored","Technical","-","ALARM_RESTORED","R","327"],["System Peripheral Trouble","Technical","LOW","ALARM_NEW","E","330"],["System Peripheral Trouble Restored","Technical","-","ALARM_RESTORED","R","330"],["Peripheral Polling Loop Open","Technical","LOW","ALARM_NEW","E","331"],["Peripheral Polling Loop Open Restored","Technical","-","ALARM_RESTORED","R","331"],["Peripheral Polling Loop Short","Technical","LOW","ALARM_NEW","E","332"],["Peripheral Polling Loop Short Restored","Technical","-","ALARM_RESTORED","R","332"],["Expansion Module Failure","Technical","LOW","ALARM_NEW","E","333"],["Expansion Module Failure Restored","Technical","-","ALARM_RESTORED","R","333"],["Repeater Failure","Technical","LOW","ALARM_NEW","E","334"],["-","Technical","-","ALARM_RESTORED","R","334"],["Local Printer Out of Paper","Technical","LOW","ALARM_NEW","E","335"],["Local Printer Out of Paper Restored","Technical","-","ALARM_RESTORED","R","335"],["Local Printer Failure","Technical","LOW","ALARM_NEW","E","336"],["Local Printer Failure Restored","Technical","-","ALARM_RESTORED","R","336"],["Expansion Module DC Loss","Technical","LOW","ALARM_NEW","E","337"],["Expansion Module DC Loss Restored","Technical","-","ALARM_RESTORED","R","337"],["Expansion Module Low Battery","Technical","LOW","ALARM_NEW","E","338"],["Expansion Module Low Battery Restored","Technical","-","ALARM_RESTORED","R","338"],["Expansion Module Reset","Technical","INFO","INFO","E","339"],["Expansion Module Tamper","Technical","LOW","ALARM_NEW","E","341"],["Expansion Module Tamper Restored","Technical","-","ALARM_RESTORED","R","341"],["Expansion Module AC Loss","Technical","LOW","ALARM_NEW","E","342"],["Expansion Module AC Loss Restored","Technical","-","ALARM_RESTORED","R","342"],["Expansion Module Self-test","Technical","INFO","INFO","E","343"],["RF Receiver Jam Detect","Technical","LOW","ALARM_NEW","E","344"],["RF Receiver Jam Detect Restored","Technical","-","ALARM_RESTORED","R","344"],["Communication Trouble","Technical","LOW","ALARM_NEW","E","350"],["Communication Trouble Restored","Technical","-","ALARM_RESTORED","R","350"],["Telco 1 Fault","Technical","MEDIUM","ALARM_NEW","E","351"],["Telco 1 Fault Restored","Technical","-","ALARM_RESTORED","R","351"],["Telco 2 Fault","Technical","MEDIUM","ALARM_NEW","E","352"],["Telco 2 Fault Restored","Technical","-","ALARM_RESTORED","R","352"],["Long Range Radio Xmitter Fault","Technical","LOW","ALARM_NEW","E","353"],["Long Range Radio Xmitter Fault Restored","Technical","-","ALARM_RESTORED","R","353"],["Failure to Communicate Event","Technical","LOW","ALARM_NEW","E","354"],["Failure to Communicate Event Restored","Technical","-","ALARM_RESTORED","R","354"],["Loss of Radio Supervision","Technical","LOW","ALARM_NEW","E","355"],["Loss of Radio Supervision Restored","Technical","-","ALARM_RESTORED","R","355"],["Loss of Central Polling","Technical","LOW","ALARM_NEW","E","356"],["Loss of Central Polling Restored","Technical","-","ALARM_RESTORED","R","356"],["Long Range Radio VSWR Problem","Technical","LOW","ALARM_NEW","E","357"],["Long Range Radio VSWR Problem Restored","Technical","-","ALARM_RESTORED","R","357"],["Protection Loop","Technical","LOW","ALARM_NEW","E","370"],["Protection Loop Restored","Technical","-","ALARM_RESTORED","R","370"],["Protection Loop Open","Technical","LOW","ALARM_NEW","E","371"],["Protection Loop Open Restored","Technical","-","ALARM_RESTORED","R","371"],["Protection Loop Short","Technical","LOW","ALARM_NEW","E","372"],["Protection Loop Short Restored","Technical","-","ALARM_RESTORED","R","372"],["Fire Trouble Restored","Fire","-","ALARM_RESTORED","R","373"],["Fire Trouble","Fire","MEDIUM","ALARM_NEW","E","373"],["Exit Error Alarm Zone","Technical","LOW","ALARM_NEW","E","374"],["Exit Error Alarm Zone Restored","Technical","-","ALARM_RESTORED","R","374"],["Panic Zone Trouble","Technical","LOW","ALARM_NEW","E","375"],["Panic Zone Trouble Restored","Technical","-","ALARM_RESTORED","R","375"],["Hold-up Zone Trouble","Technical","LOW","ALARM_NEW","E","376"],["Hold-up Zone Trouble Restored","Technical","-","ALARM_RESTORED","R","376"],["Swinger Trouble","Intrusion","MEDIUM","ALARM_NEW","E","377"],["Swinger Trouble Restored","Intrusion","INFO","ALARM_RESTORED","R","377"],["Cross Zone Trouble","Technical","LOW","ALARM_NEW","E","378"],["Cross Zone Trouble Restored","Technical","-","ALARM_RESTORED","R","378"],["Sensor Trouble","Technical","LOW","ALARM_NEW","E","380"],["Sensor Trouble Restored","Technical","-","ALARM_RESTORED","R","380"],["Loss of Supervision RF","Technical","LOW","ALARM_NEW","E","381"],["Loss of Supervision RF Restored","Technical","-","ALARM_RESTORED","R","381"],["Loss of Supervision RPM","Technical","LOW","ALARM_NEW","E","382"],["Loss of Supervision RPM Restored","Technical","-","ALARM_RESTORED","R","382"],["Sensor Tamper","Technical","MEDIUM","ALARM_NEW","E","383"],["Sensor Tamper Restored","Technical","-","ALARM_RESTORED","R","383"],["RF Low Battery","Technical","LOW","ALARM_NEW","E","384"],["RF Low Battery Restored","Technical","-","ALARM_RESTORED","R","384"],["Smoke Detector High Sensitivity","Technical","INFO","INFO","E","385"],["Smoke Detector Low Sensitivity","Technical","INFO","INFO","E","386"],["Intrusion Detector High Sensitivity","Technical","INFO","INFO","E","387"],["Intrusion Detector Low Sensitivity","Technical","INFO","INFO","E","388"],["Sensor Self-test Failure","Technical","LOW","ALARM_NEW","E","389"],["Sensor Self-test Failure Restored","Technical","-","ALARM_RESTORED","R","389"],["Sensor Watch Trouble","Technical","LOW","ALARM_NEW","E","391"],["Sensor Watch Trouble Restored","Technical","-","ALARM_RESTORED","R","391"],["Drift Compensation Error","Technical","LOW","ALARM_NEW","E","392"],["Drift Compensation Error Restored","Technical","-","ALARM_RESTORED","R","392"],["Maintenance Alert","Technical","LOW","ALARM_NEW","E","393"],["Maintenance Alert Restored","Technical","-","ALARM_RESTORED","R","393"],["Closing Report","ArmDisarm","-","ALARM_RESTORED","R","400"],["Opening Report","ArmDisarm","SILENT","INFO","E","400"],["Open/Close by User","ArmDisarm","SILENT","INFO","E","401"],["Open/Close by User","ArmDisarm","-","ALARM_RESTORED","R","401"],["Group Open/Close","ArmDisarm","SILENT","INFO","E","402"],["Group Open/Close","ArmDisarm","-","ALARM_RESTORED","R","402"],["Automatic Closing Section","ArmDisarm","SILENT","INFO","E","403"],["Cancel","ArmDisarm","SILENT","INFO","E","406"],["Remote Closing","ArmDisarm","SILENT","ALARM_RESTORED","R","407"],["Remote Opening","ArmDisarm","SILENT","INFO","E","407"],["Quick Arm","ArmDisarm","SILENT","INFO","E","408"],["Closing Keyswitch","ArmDisarm","-","ALARM_RESTORED","R","409"],["Opening Keyswitch","ArmDisarm","SILENT","INFO","E","409"],["Callback Request Made","Technical","INFO","INFO","E","411"],["Successful Download/Access","DoorAccess","INFO","INFO","E","412"],["Unsuccessful Access","DoorAccess","INFO","INFO","E","413"],["System Shutdown Command Received","Technical","INFO","INFO","E","414"],["Dialer Shutdown Command Received","Technical","INFO","INFO","E","415"],["Successful Upload Zone","Technical","INFO","INFO","E","416"],["Access Denied","DoorAccess","LOW","INFO","E","421"],["Access Report by User","DoorAccess","INFO","INFO","E","422"],["Forced Access","DoorAccess","INFO","INFO","E","423"],["Egress Denied","DoorAccess","INFO","INFO","E","424"],["Egress Granted","DoorAccess","INFO","INFO","E","425"],["Access Door Propped Open","DoorAccess","LOW","ALARM_NEW","E","426"],["Access Door Propped Open Restored","DoorAccess","-","ALARM_RESTORED","R","426"],["Access Point Door Status Monitor Trouble","Technical","LOW","ALARM_NEW","E","427"],["Access Point Door Status Monitor Trouble Restored","Technical","-","ALARM_RESTORED","R","427"],["Access Point Request to Exit Trouble","Technical","LOW","ALARM_NEW","E","428"],["Access Point Request to Exit Trouble Restored","Technical","-","ALARM_RESTORED","R","428"],["Access Program Mode Entry","Technical","INFO","INFO","E","429"],["Access Program Mode Exit","Technical","INFO","INFO","E","430"],["Access Threat Level Change","Technical","INFO","INFO","E","431"],["Access Relay/Trigger Fail","Technical","LOW","ALARM_NEW","E","432"],["Access Relay/Trigger Fail Restored","Technical","-","ALARM_RESTORED","R","432"],["Access RTE Shunt","Technical","INFO","INFO","E","433"],["Access DSM Shunt","Technical","INFO","INFO","E","434"],["Armed Stay","ArmDisarm","SILENT","INFO","E","441"],["Open/Close Stay User","ArmDisarm","SILENT","INFO","E","442"],["Exception Open/Close","ArmDisarm","SILENT","INFO","E","450"],["Early Open/Close","ArmDisarm","SILENT","INFO","E","451"],["Late Open/Close","ArmDisarm","SILENT","INFO","E","452"],["Failed to Open","ArmDisarm","SILENT","INFO","E","453"],["Failed to Close","ArmDisarm","SILENT","INFO","E","454"],["Auto Arm Failed","ArmDisarm","SILENT","INFO","E","455"],["Partial Arm","ArmDisarm","SILENT","INFO","E","456"],["Exit Error User","ArmDisarm","INFO","INFO","E","457"],["User On Premises","Unclassified","INFO","INFO","E","458"],["Recent Closing","ArmDisarm","SILENT","INFO","E","459"],["Wrong Code Entry","ArmDisarm","SILENT","INFO","E","461"],["Legal Code Entry","ArmDisarm","SILENT","INFO","E","462"],["Re-arm After Alarm","ArmDisarm","SILENT","INFO","E","463"],["Auto Arm Time Extended","ArmDisarm","SILENT","INFO","E","464"],["Panic Alarm Reset Zone","Technical","INFO","INFO","E","465"],["Service On/Off Premises","Technical","INFO","INFO","E","466"],["Access Reader Disable","DoorAccess","INFO","INFO","E","501"],["Sounder/Relay Disable","Technical","INFO","INFO","E","520"],["Bell 1 Disable","Technical","INFO","INFO","E","521"],["Bell 2 Disable","Technical","INFO","INFO","E","522"],["Alarm Relay Disable","Technical","INFO","INFO","E","523"],["Trouble Relay Disable","Technical","INFO","INFO","E","524"],["Reversing Relay Disable","Technical","INFO","INFO","E","525"],["Notification Appliance Circuit 3 Disable","Technical","INFO","INFO","E","526"],["Notification Appliance Circuit 4 Disable","Technical","INFO","INFO","E","527"],["Module Added","Technical","INFO","INFO","E","531"],["Module Removed","Technical","INFO","INFO","E","532"],["Dialer Disabled","Technical","INFO","INFO","E","551"],["Radio Transmitter Disabled","Technical","INFO","INFO","E","552"],["Remote UDL Disabled","Technical","INFO","INFO","E","553"],["Untyped Zone Bypass","Intrusion","MEDIUM","ALARM_NEW","E","570"],["Untyped Zone Unbypass","Intrusion","MEDIUM","ALARM_RESTORED","R","570"],["Fire Bypass","Fire","LOW","ALARM_NEW","E","571"],["Fire Unbypass","Fire","-","ALARM_RESTORED","R","571"],["Bypass 24-Hour Zone","Technical","INFO","INFO","E","572"],["Burglary Bypass","Intrusion","MEDIUM","INFO","E","573"],["Burglary Unbypass","Intrusion","INFO","ALARM_RESTORED","R","573"],["Group Bypass","Technical","INFO","INFO","E","574"],["Swinger Bypass","Technical","INFO","INFO","E","575"],["Access Zone Shunt","Technical","INFO","INFO","E","576"],["Access Point Bypass","Technical","INFO","INFO","E","577"],["Manual Trigger Test Report","Technical","INFO","INFO","E","601"],["Periodic Test Report","Technical","INFO","INFO","E","602"],["Periodic RF Transmission","Technical","INFO","INFO","E","603"],["Fire Test","Fire","LOW","ALARM_NEW","E","604"],["Status Report to Follow","Technical","INFO","INFO","E","605"],["Listen-in to Follow","Technical","INFO","INFO","E","606"],["Walk-test Mode","Technical","INFO","INFO","E","607"],["Periodic Test System Trouble Present","Technical","INFO","INFO","E","608"],["Video Xmitter Active","Technical","INFO","INFO","E","609"],["Point Tested OK","Technical","INFO","INFO","E","611"],["Point Not Tested","Technical","INFO","INFO","E","612"],["Intrusion Zone Walk Test","Technical","INFO","INFO","E","613"],["Fire Zone Walk Test","Technical","INFO","INFO","E","614"],["Panic Zone Walk Test","Technical","INFO","INFO","E","615"],["Service Request","Technical","INFO","INFO","E","616"],["Event Log Reset","Technical","INFO","INFO","E","621"],["Event Log 50% Full","Technical","INFO","INFO","E","622"],["Event Log 90% Full","Technical","INFO","INFO","E","623"],["Event Log Overflow","Technical","INFO","INFO","E","624"],["Time/Date Reset","Technical","INFO","INFO","E","625"],["Time/Date Inaccurate","Technical","INFO","INFO","E","626"],["Program Mode Entry","Technical","INFO","INFO","E","627"],["Program Mode Exit","Technical","INFO","INFO","E","628"],["Event Log Marker 32-Hour","Technical","INFO","INFO","E","629"],["Schedule Changed","Technical","INFO","INFO","E","630"],["Exception Schedule Change","Technical","INFO","INFO","E","631"],["Access Schedule Change","Technical","INFO","INFO","E","632"],["Senior Watch Trouble","Medical","MEDIUM","ALARM_NEW","E","641"],["Senior Watch Trouble Restored","Medical","-","ALARM_RESTORED","R","641"],["Latch-Key Supervision","Technical","INFO","INFO","E","642"],["Reserved","Unclassified","INFO","INFO","E","651"],["Reserved","Unclassified","INFO","INFO","E","652"],["Reserved","Unclassified","INFO","INFO","E","653"],["System Inactivity","Technical","INFO","INFO","E","654"],["Download Start","—","—","—","E","901"],["Download End","—","—","—","R","901"],["Download Interrupted","—","—","—","E","902"]];

  return {
    id:'neo-reporting-codes',
    eyebrow:'PowerSeries NEO · Reporting',
    title:'Reporting Codes',
    subtitle:'Contact ID and Automatic SIA reporting-code reference from the PowerSeries NEO Alarm Controller Reference Manual, pages 240-251.',
    overview:{
      intro:'The following tables contain Contact ID and Automatic SIA format reporting codes. Refer to [308] Event Reporting for event reporting codes.',
      contactId:[
        'Each Contact ID digit conveys specific information about the signal.',
        'Manual example: if zone 1 is an entry/exit point, the event code contains [34]; the central station receives *BURG - ENTRY/EXIT - 1, where 1 identifies the zone that went into alarm.'
      ],
      sia:{title:'SIA Format - Level 2 (Hard Coded)',text:'The SIA communication format used in this product follows the level 2 specifications of the SIA Digital Communication Standard - October 1997. This format sends the account code along with its data transmission.',example:'N ri1 BA 01',parts:[['N','New Event'],['ri1','Partition / Area Identifier'],['BA','Burglary Alarm'],['01','Zone 1']],note:'A system event uses the Area Identifier ri00.'}
    },
    columns:['Section #','Definition','Dialer Direction*','Automatic Contact ID Codes','SIA Auto Rep Codes**'],
    sections:[
      {id:'overview',title:'Contact ID & SIA Formats',kind:'overview'},
      {id:'sia-event-code-table',title:'SIA Event Code Table',kind:'standard-sia',columns:['SIA Event Code','Description','Category','Severity','Type','Related Alarm','Restored by'],rows:standardSiaEventRows},
      {id:'contact-id-event-code-table',title:'Contact ID Event Code Table',kind:'standard-cid',columns:['Description','Category','Severity','Type','E/R','Code'],rows:standardContactIdEventRows},
      {id:'zone-events',title:'Zone Events',relationships:[
        {definition:'Zone Alarms',programmingSection:'[307]',targetSectionId:'zone-alarm-restore-codes',targetTitle:'Contact ID & SIA Zone Alarm/Restore Event Codes'},
        {definition:'Zone Restores',programmingSection:'[307]',targetSectionId:'zone-alarm-restore-codes',targetTitle:'Contact ID & SIA Zone Alarm/Restore Event Codes'}
      ],rows:[
        ['[307]','Zone Alarms','A/R','See Zone Alarm/Restore Event Codes below','See Zone Alarm/Restore Event Codes below'],
        ['[307]','Zone Restores','A/R','See Zone Alarm/Restore Event Codes below','See Zone Alarm/Restore Event Codes below'],
        ['[307]','Zone tamper/restore','MA/R','E(3)83-ZZZ / R(3)83-ZZZ','TA-ZZZZ / TR-ZZZZ'],
        ['[307]','Zone fault/restore','MA/R','E(3)8A-ZZZ / R(3)8A-ZZZ','UT-ZZZZ / UJ-ZZZZ']
      ]},
      {id:'tamper-events',title:'Tamper Events',rows:tamperRows},
      {id:'opening-events',title:'Opening Events',rows:[
        ['[308] > [201]','User Openings - Disarmed by user','O/C','E(4)A1-UUU','OP-UUUU'],
        ['[308] > [202]','Automatic Arming Canceled','O/C','E(4)64-UUU','CI-0000'],
        ['[308] > [201]','Special Opening - System disarmed using: keyswitch, maintenance code, DLS software, wireless key','O/C','E(4)AA-000','OP-0000'],
        ['[308] > [211]','Late to Open - System not disarmed before late to open time expired','O/C','E(4)53-000','CT-0000'],
        ['[308] > [202]','Automatic (Schedule) Opening','O/C','E(4)A3-000','OA-0000'],
        ['[308] > [201]','Keyswitch Open','O/C','E(4)A9-ZZZ','OS-ZZZZ']
      ]},
      {id:'closing-events',title:'Closing Events',rows:[
        ['[308] > [201]','User Closings - System armed by user, wireless key','O/C','R(4)A1-UUU','CL-UUUU'],
        ['[308] > [221]','Partial Closing - 1 or more zones bypassed when armed','O/C','E(4)56-000','CG-0000'],
        ['[308] > [201]','Special Closing - System armed via: quick arm, keyswitch, function key, maintenance code, DLS software','O/C','R(4)AA-000','CL-0000'],
        ['[308] > [211]','Late to Close - Auto-arm prealert sounded','O/C','E(4)54-000','CI-0000'],
        ['[308] > [211]','Exit Fault','O/C','E(3)74-ZZZ','EA-ZZZZ'],
        ['[308] > [202]','Automatic (Schedule) Closing','O/C','R(4)A3-000','CA-0000'],
        ['[308] > [201]','Keyswitch Close','O/C','R(4)A9-ZZZ','CS-ZZZZ']
      ]},
      {id:'system-trouble-events',title:'System Trouble Events',rows:[
        ['[308] > [301]','Battery trouble/restore - Main panel','MA/R','E(3)A2-000 / R(3)A2-000','YT-0000 / YR-0000'],
        ['[308] > [301]','Battery absent trouble/restore - Main panel','MA/R','E(3)11-000 / R(3)11-000','YM-0000 / YR-0000'],
        ['[308] > [301]','Panel AC trouble/restore - Main panel','MA/R','E(3)A1-000 / R(3)A1-000','AT-0000 / AR-0000'],
        ['[308] > [302]','Bell Circuit trouble/restore','MA/R','E(3)21-000 / R(3)21-000','YA-9999 / YH-9999'],
        ['[308] > [302]','TLM (telephone line) fail/restore','MA/R','E(3)51-000 / R(3)51-000','LT-0001 / LR-0001'],
        ['[308] > [302]','Auxiliary Power trouble/restore','MA/R','E(3)12-000 / R(3)12-000','YP-0000 / YQ-0000'],
        ['[308] > [305]','PGM 2, 2-Wire Smoke trouble/restore','MA/R','E(3)73-992 / R(3)73-992','FT-0992 / FJ-0992']
      ]},
      {id:'module-troubles',title:'Module Troubles',rows:[
        ['[308] > [332]','Hardwired Module Low Voltage trouble/restore - Keypads','MA/R','E(3)AA-001-016 / R(3)AA-001-016','EM-0001-0016 / EN-0001-0016'],
        ['[308] > [332]','Hardwired Module Low Voltage trouble/restore - HSM2108','MA/R','E(3)AA-101-116 / R(3)AA-101-116','EM-0101-0116 / EN-0101-0116'],
        ['[308] > [332]','Hardwired Module Low Voltage trouble/restore - HSM2208','MA/R','E(3)AA-201-216 / R(3)AA-201-216','EM-0201-0216 / EN-0201-0216'],
        ['[308] > [332]','Hardwired Module Low Voltage trouble/restore - HSM2164RF','MA/R','E(3)00-550 / R(3)00-550','EM-0550 / EN-0550'],
        ['[308] > [332]','Hardwired Module Low Voltage trouble/restore - HSM2HOST','MA/R','E(3)00-551 / R(3)00-551','EM-0551 / EN-0551'],
        ['[308] > [332]','Hardwired Module Low Voltage trouble/restore - HSM2204','MA/R','E(3)AA-601-604 / R(3)AA-601-604','EM-0601-0604 / EN-0601-0604'],
        ['[308] > [332]','Hardwired Module Low Voltage trouble/restore - HSM2300','MA/R','E(3)AA-621-624 / R(3)AA-621-624','EM-0621-0624 / EN-0621-0624'],
        ['[308] > [332]','Hardwired Module Low Voltage trouble/restore - HSM2955','MA/R','E(3)AA-553 / R(3)AA-553','EM-0553 / EN-0553'],
        ['[308] > [332]','Hardwired Module Supervisory trouble/restore - Keypads','MA/R','E(3)3A-001-016 / R(3)3A-001-016','ET-0001-0032 / ER-0001-0032'],
        ['[308] > [332]','Hardwired Module Supervisory trouble/restore - HSM2108','MA/R','E(3)3A-101-116 / R(3)3A-101-116','ET-0101-0162 / ER-0101-0162'],
        ['[308] > [332]','Hardwired Module Supervisory trouble/restore - HSM2208','MA/R','E(3)3A-201-216 / R(3)3A-201-216','ET-0201-0216 / ER-0201-0216'],
        ['[308] > [332]','Hardwired Module Supervisory trouble/restore - HSM2164RF','MA/R','E(3)30-550 / R(3)30-550','ET-0550 / ER-0550'],
        ['[308] > [332]','Hardwired Module Supervisory trouble/restore - HSM2HOST','MA/R','E(3)30-551 / R(3)30-551','ET-0551 / ER-0551'],
        ['[308] > [332]','Hardwired Module Supervisory trouble/restore - HSM2204','MA/R','E(3)3A-601-604 / R(3)3A-601-604','ET-0601-0601 / ER-0601-0604'],
        ['[308] > [332]','Hardwired Module Supervisory trouble/restore - HSM2300','MA/R','E(3)3A-621-624 / R(3)3A-621-624','ET-0621-0624 / ER-0621-0624'],
        ['[308] > [332]','Hardwired Module Supervisory trouble/restore - HSM2955','MA/R','E(3)3A-553 / R(3)3A-553','ET-0553 / ER-0553'],
        ['[308] > [332]','HSM2204 Aux Supply 1 trouble/restore','MA/R','E(3)12-601 / R(3)12-601','YI-0601 / YJ-0601'],
        ['[308] > [332]','HSM2204 Aux Supply 2 trouble/restore','MA/R','E(3)12-602 / R(3)12-602','YI-0602 / YJ-0602'],
        ['[308] > [332]','HSM2204 Aux Supply 3 trouble/restore','MA/R','E(3)12-603 / R(3)12-603','YI-0603 / YJ-0603'],
        ['[308] > [332]','HSM2204 Aux Supply 4 trouble/restore','MA/R','E(3)12-604 / R(3)12-604','YI-0604 / YJ-0604'],
        ['[308] > [332]','HSM2300 Aux Supply 1 trouble/restore','MA/R','E(3)12-621 / R(3)12-621','YI-0621 / YJ-0621'],
        ['[308] > [332]','HSM2300 Aux Supply 2 trouble/restore','MA/R','E(3)12-622 / R(3)12-622','YI-0622 / YJ-0622'],
        ['[308] > [332]','HSM2300 Aux Supply 3 trouble/restore','MA/R','E(3)12-623 / R(3)12-623','YI-0623 / YJ-0623'],
        ['[308] > [332]','HSM2300 Aux Supply 4 trouble/restore','MA/R','E(3)12-624 / R(3)12-624','YI-0624 / YJ-0624'],
        ['[308] > [332]','HSM2204 1 Low Battery trouble/restore','MA/R','E(3)A2-601 / R(3)A2-601','YT-0601 / YR-0601'],
        ['[308] > [332]','HSM2204 2 Low Battery trouble/restore','MA/R','E(3)A2-602 / R(3)A2-602','YT-0602 / YR-0602'],
        ['[308] > [332]','HSM2204 3 Low Battery trouble/restore','MA/R','E(3)A2-603 / R(3)A2-603','YT-0603 / YR-0603'],
        ['[308] > [332]','HSM2204 4 Low Battery trouble/restore','MA/R','E(3)A2-604 / R(3)A2-604','YT-0604 / YR-0604'],
        ['[308] > [332]','HSM2300 1 Low Battery trouble/restore','MA/R','E(3)A2-621 / R(3)A2-621','YT-0621 / YR-0621'],
        ['[308] > [332]','HSM2300 2 Low Battery trouble/restore','MA/R','E(3)A2-622 / R(3)A2-622','YT-0622 / YR-0622'],
        ['[308] > [332]','HSM2300 3 Low Battery trouble/restore','MA/R','E(3)A2-623 / R(3)A2-623','YT-0623 / YR-0623'],
        ['[308] > [332]','HSM2300 4 Low Battery trouble/restore','MA/R','E(3)A2-624 / R(3)A2-624','YT-0624 / YR-0624'],
        ['[308] > [332]','HSM2204 1 Battery absent trouble/restore','MA/R','E(3)11-601 / R(3)11-601','YM-0601 / YR-0601'],
        ['[308] > [332]','HSM2204 2 Battery absent trouble/restore','MA/R','E(3)11-602 / R(3)11-602','YM-0602 / YR-0602'],
        ['[308] > [332]','HSM2204 3 Battery absent trouble/restore','MA/R','E(3)11-603 / R(3)11-603','YM-0603 / YR-0603'],
        ['[308] > [332]','HSM2204 4 Battery absent trouble/restore','MA/R','E(3)11-604 / R(3)11-604','YM-0604 / YR-0604'],
        ['[308] > [332]','HSM2300 1 Battery absent trouble/restore','MA/R','E(3)11-621 / R(3)11-621','YM-0621 / YJ-0621'],
        ['[308] > [332]','HSM2300 2 Battery absent trouble/restore','MA/R','E(3)11-622 / R(3)11-622','YM-0622 / YJ-0622'],
        ['[308] > [332]','HSM2300 3 Battery absent trouble/restore','MA/R','E(3)11-623 / R(3)11-623','YM-0623 / YJ-0623'],
        ['[308] > [332]','HSM2300 4 Battery absent trouble/restore','MA/R','E(3)11-624 / R(3)11-624','YM-0624 / YJ-0624']
      ]},
      {id:'alternate-communicator',title:'Alternate Communicator',rows:[
        ['[308] > [351]','Alternate Communicator fault/restore','MA/R','E(3)3A-000 / R(3)3A-000','ET-0000 / ER-0000'],
        ['[308] > [351]','Alternate Communicator Radio/SIM failure/restore','MA/R','E(3)AA-991 / R(3)AA-991','YX-0991 / YZ-0991'],
        ['[308] > [351]','Alternate Communicator cellular trouble/restore','MA/R','E(3)AA-992 / R(3)AA-992','YX-0992 / YZ-0992'],
        ['[308] > [352]','Alternate Communicator Ethernet trouble/restore','MA/R','E(3)AA-993 / R(3)AA-993','YX-0993 / YZ-0993'],
        ['[308] > [354]','Alternate Communicator Receiver 1 absent/restore','MA/R','E(3)5A-001 / R(3)5A-001','YS-0001 / YK-0001'],
        ['[308] > [354]','Alternate Communicator Receiver 2 absent/restore','MA/R','E(3)5A-002 / R(3)5A-002','YS-0002 / YK-0002'],
        ['[308] > [354]','Alternate Communicator Receiver 3 absent/restore','MA/R','E(3)5A-003 / R(3)5A-003','YS-0003 / YK-0003'],
        ['[308] > [354]','Alternate Communicator Receiver 4 absent/restore','MA/R','E(3)5A-004 / R(3)5A-004','YS-0004 / YK-0004'],
        ['[308] > [355]','Alternate Communicator Receiver 1 Supervisory trouble/restore','MA/R','E(3)5A-001/R(3)5A-001','YS-0001 / YK-0001'],
        ['[308] > [355]','Alternate Communicator Receiver 2 Supervisory trouble/restore','MA/R','E(3)5A-002/R(3)5A-002','YS-0002 / YK-0002'],
        ['[308] > [355]','Alternate Communicator Receiver 3 Supervisory trouble/restore','MA/R','E(3)5A-003/R(3)5A-003','YS-0003 / YK-0003'],
        ['[308] > [355]','Alternate Communicator Receiver 4 Supervisory trouble/restore','MA/R','E(3)5A-004/R(3)5A-004','YS-0004 / YK-0004'],
        ['[308] > [353]','Alternate Communicator SMS Config trouble/restore','MA/R','E(3)AA-995 / R(3)AA-995','YX-0995 / YZ-0995'],
        ['[308] > [351]','Remote Programming Begin/End','MA/R','E(6)27-000 / E(6)28-000','LB-0000 / LS-0000']
      ]},
      {id:'wireless-events',title:'Wireless Events',rows:wirelessRows,notes:['To prevent a reporting code conflict, do not program PG9984 as zone 1.']},
      {id:'miscellaneous-alarms',title:'Miscellaneous Alarms',rows:[
        ['[308] > [001]','Duress Alarm - Code entered at keypad','A/R','E(1)21-000','HA-0000'],
        ['[308] > [001]','Opening After Alarm - Disarmed with alarm in memory','A/R','E(4)58-000','OR-0000'],
        ['[308] > [001]','Recent Closing - Alarm occurs within two minutes of system arming','A/R','E(4)59-UUU','CR-UUUU'],
        ['[308] > [001]','Burglary Verified','A/R','E(1)39-000','BV-0000'],
        ['[308] > [001]','Burglary Not Verified','A/R','E(3)78-000','BG-0000'],
        ['[308] > [001]','HSM2108 Zone Expander Supervisory Alarm/restore','A/R','E(1)43-000 / R(1)43-000','UA-0000 / UH-0000'],
        ['[308] > [002]','Holdup Verified','A/R','E(1)29-000','HV-0000'],
        ['[308] > [001]','Alarm Canceled before expiry of alarm cancellation timer','A/R','E(4)A6-UUU','OC-UUUU'],
        ['[308] > [011]','PGM2 (Silent 24 Hour Input) - Aux Input Alarm/restore','A/R','E(1)46-992 / R(1)46-992','UA-0992 / UH-0992'],
        ['[308] > [011]','PGM2 (Audible 24 Hour Input) - Aux Input Alarm/restore','A/R','E(1)4A-992 / R(1)4A-992','UA-0992 / UH-0992'],
        ['[308] > [305]','PGM2 2-Wire Smoke Alarm/Restore','A/R','E(1)11-992 / R(1)11-992','FA-0992 / FH-0992']
      ]},
      {id:'priority-alarm-restoral',title:'Priority Alarm and Restoral Events',rows:[
        ['[308] > [011]','[F] Key alarm/restore','A/R','E(1)1A-000 / R(1)1A-000','FA-0000 / FH-0000'],
        ['[308] > [011]','[M] Key alarm/restore','A/R','E(1)AA-000 / R(1)AA-000','MA-0000 / MH-0000'],
        ['[308] > [011]','[P] Key alarm/restore','A/R','E(1)2A-000 / R(1)2A-000','PA-0000 / PH-0000']
      ]},
      {id:'miscellaneous-closing',title:'Miscellaneous Closing',rows:[
        ['[308] > [221]','Zone Bypass at time of arming','O/C','E(5)7A-ZZZ','UB-ZZZZ'],
        ['[308] > [221]','Zone Unbypass','O/C','R(5)7A-ZZZ','UU-ZZZZ']
      ]},
      {id:'testing',title:'Testing',rows:[
        ['[308] > [401]','Walk Test Begin/End','T','E(6)A7-UUU / R(6)A7-UUU','TS-UUUU/TE-UUUU'],
        ['[308] > [401]','Periodic Test','T','E(6)A2-000','RP-0000'],
        ['[308] > [401]','Periodic Test with Trouble','T','E(6)A8-000','RY-0000'],
        ['[308] > [401]','System Test - [*][6] bell/communications test','T','E(6)A1-000','RX-0000']
      ]},
      {id:'maintenance',title:'Maintenance',rows:[
        ['[308] > [311]','General System trouble/restore - An RF jam trouble occurred/was restored','MA/R','E(3)AA-000 / R(3)AA-000','YX-0000 / YZ-0000'],
        ['[308] > [311]','Fire trouble/restore','MA/R','E(3)73-000 / R(3)73-000','FT-0000 / FJ-0000'],
        ['[308] > [314]','Gas trouble/restore','MA/R','E(3)8A-ZZZ / R(3)8A-ZZZ','GT-ZZZZ / GJ-ZZZZ'],
        ['[308] > [314]','Delinquency trouble/restore','MA/R','E(6)54-000 / R(6)54-000','CD-0000'],
        ['[308] > [314]','Heat trouble/restore','MA/R','E(3)8A-ZZZ / R(3)8A-ZZZ','KT-ZZZZ / KJ-ZZZZ'],
        ['[308] > [314]','Freeze Trouble / Restore','MA/R','E(3)8A-ZZZ / R(3)8A-ZZZ','ZT-ZZZZ / ZJ-ZZZZ'],
        ['','Carbon Monoxide Trouble','MA/R','E(3)8A-ZZZ / R(3)8A-ZZZ','UT-ZZZZ / UJ-ZZZZ'],
        ['[308] > [311]','Cold Start - System has restarted after total power loss','MA/R','R(3)A5-000','RR-0000'],
        ['[308] > [312]','Event Buffer 75% Full','MA/R','E(6)22-000','JL-0000'],
        ['[308] > [312]','DLS Lead In - Download session start','MA/R','E(4)11-000','RB-0000'],
        ['[308] > [312]','DLS Lead Out - Download session stop','MA/R','E(4)12-000','RS-0000'],
        ['[308] > [312]','SA Lead In - Download session start','MA/R','E(4)11-000','RB-0000'],
        ['[308] > [312]','SA Lead Out - Download session stop','MA/R','E(4)12-000','RS-0000'],
        ['[308] > [312]','Installer Lead In - Installer Programming has been entered','MA/R','E(6)27-000','LB-0000'],
        ['[308] > [312]','Installer Lead out - Installer Programming has been exited','MA/R','E(6)28-000','LS-0000'],
        ['[308] > [313]','Panel firmware update begin/successful','MA/R','E(9)01-900 / R(9)01-900','LB-0900 / LS-0900'],
        ['[308] > [313]','Panel firmware update fail','MA/R','E(9)02-900','LU-0900'],
        ['[308] > [321]','Receiver 1 FTC Trouble Restore','MA/R','R(3)54-001','YK-0001'],
        ['[308] > [321]','Receiver 2 FTC Trouble Restore','MA/R','R(3)54-002','YK-0002'],
        ['[308] > [321]','Receiver 3 FTC Trouble Restore','MA/R','R(3)54-003','YK-0003'],
        ['[308] > [321]','Receiver 4 FTC Trouble Restore','MA/R','R(3)54-004','YK-0004']
      ]},
      {id:'zone-alarm-restore-codes',title:'Contact ID & SIA Zone Alarm/Restore Event Codes',kind:'zone-alarm',rows:zoneAlarmRows,notes:['ZZZ/ZZZZ = zones 001-128.']}
    ],
    footnotes:[
      'A/R = alarms/restores; T/R = tampers/restores; O/C = openings/closings; MA/R = maintenance alarms/restores; T = test transmissions.',
      'UUU = user number (user 001-1000). For CID, enter 999 for user 1000. ZZZ/ZZZZ = zone number (001-128).',
      'Zones and panic pendants are identified; wireless keys can be identified for openings and closings.'
    ]
  };
}

function neoReportingRelationshipSlug(value){
  return String(value==null?'':value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,72) || 'event';
}
function neoReportingSplitExplicitPair(value){
  var text=String(value==null?'':value).trim();
  var parts=text.split(/\s+\/\s+/);
  return parts.length===2 ? {event:parts[0].trim(),restore:parts[1].trim(),raw:text} : {event:text,restore:null,raw:text};
}
function neoReportingIdentifierRelationship(definition,contactIdValue){
  var pair=neoReportingSplitExplicitPair(contactIdValue),event=String(pair.event||'');
  var match=event.match(/-([0-9]{3})(?:-([0-9]{3}))?$/);
  if(!match) return null;
  var text=String(definition||''),kind='',baseLabel='Identifier';
  if(/ - Keypads$/i.test(text)){kind='keypads';baseLabel='Keypad';}
  else if(/ - HSM2108$/i.test(text)){kind='HSM2108';baseLabel='HSM2108';}
  else if(/ - HSM2208$/i.test(text)){kind='HSM2208';baseLabel='HSM2208';}
  else if(/ - HSM2164RF$/i.test(text)||/\bHSM2164RF\b/i.test(text)){kind='HSM2164RF';baseLabel='HSM2164RF';}
  else if(/ - HSM2HOST$/i.test(text)||/\bHSM2HOST\b/i.test(text)){kind='HSM2HOST';baseLabel='HSM2HOST';}
  else if(/ - HSM2204$/i.test(text)){kind='HSM2204';baseLabel='HSM2204';}
  else if(/ - HSM2300$/i.test(text)){kind='HSM2300';baseLabel='HSM2300';}
  else if(/\bHSM2955\b/i.test(text)){kind='HSM2955';baseLabel='HSM2955';}
  if(!match[2]){
    if(!kind) return null;
    return {kind:kind,identifier:match[1],start:match[1],end:match[1],count:1,instances:[{identifier:match[1],instanceIndex:1,label:baseLabel}]};
  }
  var start=Number(match[1]),end=Number(match[2]);
  if(!isFinite(start)||!isFinite(end)||end<start) return null;
  if(!kind) return {kind:'indexed',start:match[1],end:match[2],count:end-start+1,instances:[]};
  var instances=[];
  for(var value=start;value<=end;value++){
    var position=value-start+1,identifier=String(value).padStart(3,'0');
    instances.push({identifier:identifier,instanceIndex:position,label:kind==='keypads'?'Keypad '+position:baseLabel+' #'+position});
  }
  return {kind:kind,start:match[1],end:match[2],count:end-start+1,instances:instances};
}
function neoReportingBuildRelationships(record){
  var relationships={schemaVersion:'1.0.0',sourceReferenceId:record.id,formats:['Contact ID','SIA Level 2'],eventRows:[],zoneDefinitions:{},placeholders:{ZZZ:'three-digit zone/device identifier',ZZZZ:'four-digit SIA zone/device identifier',UUU:'three-digit Contact ID user identifier; user 1000 uses 999',UUUU:'four-digit SIA user identifier'}};
  (record.sections||[]).forEach(function(section){
    if(section.kind==='overview'||section.kind==='zone-alarm') return;
    (section.rows||[]).forEach(function(row,index){
      relationships.eventRows.push({
        id:section.id+'-'+String(index+1).padStart(3,'0')+'-'+neoReportingRelationshipSlug(row[1]),
        sectionId:section.id,sectionTitle:section.title,rowIndex:index,programmingSection:row[0]||'',definition:row[1]||'',dialerDirection:row[2]||'',
        contactId:neoReportingSplitExplicitPair(row[3]),sia:neoReportingSplitExplicitPair(row[4]),identifierRelationship:neoReportingIdentifierRelationship(row[1],row[3]),sourceReferenceId:record.id
      });
    });
  });
  var zoneSection=(record.sections||[]).filter(function(section){return section.id==='zone-alarm-restore-codes';})[0]||{};
  var rows=zoneSection.rows||[], byName={};
  rows.forEach(function(row,index){byName[String(row[0])]={rowIndex:index,definition:row[0],sia:neoReportingSplitExplicitPair(row[1]),contactId:neoReportingSplitExplicitPair(row[2])};});
  var map={
    '001':'Delay 1','002':'Delay 2','003':'Instant','004':'Interior','005':'Interior Stay/Away','006':'Delay Stay/Away','007':'Delayed 24-Hr. Fire (Wireless)','008':'Standard 24-Hr. Fire (Wireless)','009':'Instant Stay/Away','010':'Interior Delay','011':'Day Zone','012':'Night Zone','016':'Final Door Set','017':'24-Hr. Burglary','023':'24-Hr. Supervisory','024':'24-Hr. Supervisory Buzzer','025':'24-Hr. Auto Verified Fire (Wireless)','027':'Fire Supervisory','040':'24-Hr. Gas','041':'24-Hr. CO Alarm','042':'24-Hr. Holdup','043':'24-Hr. Panic','045':'24-Hr Heat','046':'24-Hr Medical','047':'24-Hr. Emergency','048':'24-Hr. Sprinkler','049':'24-Hr. Flood','051':'24-Hr. Latching Tamper','052':'24-Hr. Non Alarm (Walk Test Only)','056':'24-Hr High Temperature','057':'24-Hr.Low Temperature','060':'24-Hr. Non-latching Tamper','066':'Momentary Keyswitch Arm (Walk Test Only)','067':'Maintained Keyswitch Arm (Walk Test Only)','068':'Momentary Keyswitch Disarm (Walk Test Only)','069':'Maintained Keyswitch Disarm (Walk Test Only)','071':'Doorbell Zone/Restore (Walk Test Only)','072':'Push to Set (Walk Test Only)'
  };
  Object.keys(map).forEach(function(code){
    var row=byName[map[code]];
    relationships.zoneDefinitions[code]=row?{status:'mapped',zoneDefinitionCode:code,reportingDefinition:row.definition,reportingSectionId:'zone-alarm-restore-codes',reportingRowIndex:row.rowIndex,contactId:row.contactId,sia:row.sia,sourceReferenceId:record.id}:{status:'unresolved',zoneDefinitionCode:code,reportingDefinition:map[code],reason:'No exact reporting-table row is defined.'};
  });
  relationships.zoneDefinitions['000']={status:'not-applicable',zoneDefinitionCode:'000',reason:'Null Zone is not listed in the Zone Alarm/Restore reporting table.'};
  relationships.zoneDefinitions['018']={status:'unresolved',zoneDefinitionCode:'018',reason:'24Hr Bell/Buzzer is not listed as a distinct row in the Zone Alarm/Restore reporting table; no reporting code is inferred.'};
  return relationships;
}
function neoReportingReplacePlaceholders(value,params){
  params=params||{}; var text=String(value==null?'':value);
  var zone=Math.max(0,Math.min(9999,Math.round(Number(params.zoneNumber)||0)));
  var user=Math.max(0,Math.min(1000,Math.round(Number(params.userNumber)||0)));
  var cidUser=user===1000?999:user;
  if(params.zoneNumber!=null) text=text.replace(/ZZZZ/g,String(zone).padStart(4,'0')).replace(/ZZZ/g,String(zone).padStart(3,'0'));
  if(params.userNumber!=null) text=text.replace(/UUUU/g,String(user).padStart(4,'0')).replace(/UUU/g,String(cidUser).padStart(3,'0'));
  return text;
}
function neoReportingResolvePair(pair,phase,params){
  phase=String(phase||'event').toLowerCase();
  var template=phase==='restore'?pair.restore:pair.event;
  if(!template) return null;
  return neoReportingReplacePlaceholders(template,params||{});
}

var NEO_REPORTING_CODES_REFERENCE=buildNeoReportingCodesReference();
// Keep the protocol lookup tables directly after the zone alarm/restore mapping.
// These tables are also the canonical shared source used by the New PowerSeries reporting views.
(function reorderNeoReportingProtocolTables(){
  var sections=NEO_REPORTING_CODES_REFERENCE.sections||[],standards=[],remaining=[];
  sections.forEach(function(section){
    if(section.id==='sia-event-code-table'||section.id==='contact-id-event-code-table') standards.push(section);
    else remaining.push(section);
  });
  NEO_REPORTING_CODES_REFERENCE.sections=remaining.concat(standards);
})();
(function exposeSharedReportingProtocolTables(){
  var byId={};
  (NEO_REPORTING_CODES_REFERENCE.sections||[]).forEach(function(section){byId[section.id]=section;});
  window.DSC_STANDARD_REPORTING_CODE_TABLES={
    schemaVersion:'1.0.0',
    id:'dsc-standard-reporting-code-tables',
    sourceReferenceId:NEO_REPORTING_CODES_REFERENCE.id,
    sia:byId['sia-event-code-table']||null,
    contactId:byId['contact-id-event-code-table']||null
  };
})();
NEO_REPORTING_CODES_REFERENCE.relationships=neoReportingBuildRelationships(NEO_REPORTING_CODES_REFERENCE);
window.DSC_NEO_REPORTING_ENGINE={
  schemaVersion:'1.0.0',
  relationships:NEO_REPORTING_CODES_REFERENCE.relationships,
  resolveZoneDefinition:function(definitionCode,zoneNumber,phase){
    var code=String(definitionCode==null?'':definitionCode).replace(/\D/g,'').padStart(3,'0').slice(-3);
    var relation=NEO_REPORTING_CODES_REFERENCE.relationships.zoneDefinitions[code];
    if(!relation||relation.status!=='mapped') return {resolved:false,definitionCode:code,zoneNumber:Number(zoneNumber)||0,phase:phase||'event',relationship:relation||null,reason:relation&&relation.reason?relation.reason:'No reporting relationship is defined for this zone definition.'};
    var params={zoneNumber:zoneNumber};
    return {resolved:true,definitionCode:code,zoneNumber:Number(zoneNumber)||0,phase:String(phase||'event').toLowerCase(),reportingDefinition:relation.reportingDefinition,contactId:neoReportingResolvePair(relation.contactId,phase,params),sia:neoReportingResolvePair(relation.sia,phase,params),relationship:relation};
  },
  getEventRelationship:function(sectionId,rowIndex){
    var found=NEO_REPORTING_CODES_REFERENCE.relationships.eventRows.filter(function(row){return row.sectionId===sectionId && row.rowIndex===Number(rowIndex);})[0];
    return found?JSON.parse(JSON.stringify(found)):null;
  },
  resolveEventRelationship:function(sectionId,rowIndex,phase,params){
    var relation=this.getEventRelationship(sectionId,rowIndex);
    if(!relation) return {resolved:false,reason:'Reporting event relationship not found.'};
    var contactId=neoReportingResolvePair(relation.contactId,phase,params||{}), sia=neoReportingResolvePair(relation.sia,phase,params||{});
    return {resolved:!!(contactId||sia),phase:String(phase||'event').toLowerCase(),contactId:contactId,sia:sia,relationship:relation};
  }
};
function neoZoneTypeCharacteristicTags(definitionCode){
  var code=String(definitionCode==null?'':definitionCode).replace(/\D/g,'').padStart(3,'0').slice(-3);
  var map={
    '001':['Entry / Exit','Delay'],'002':['Entry / Exit','Delay'],'003':['Instant'],'004':['Interior'],'005':['Interior','Stay / Away'],'006':['Delay','Stay / Away'],'007':['Delay','Fire'],'008':['Fire'],'009':['Instant','Stay / Away'],'010':['Interior','Delay'],'011':['Day'],'012':['Night'],'016':['Entry / Exit','Infinite Exit Delay'],'017':['Burglary'],'018':['Bell / Buzzer'],'023':['Supervisory'],'024':['Supervisory','Bell / Buzzer'],'025':['Fire','Auto Verified'],'027':['Fire','Supervisory'],'040':['Gas'],'041':['CO'],'042':['Holdup'],'043':['Panic'],'045':['Heat','Temperature'],'046':['Medical'],'047':['Emergency'],'048':['Sprinkler'],'049':['Flood','Supervisory'],'051':['Tamper','Latching'],'052':['Non-Alarm','Walk Test Only'],'056':['Temperature','High Temperature','Supervisory'],'057':['Temperature','Low Temperature','Supervisory'],'060':['Tamper','Non-Latching'],'066':['Keyswitch','Arm','Momentary','Walk Test Only'],'067':['Keyswitch','Arm','Maintained','Walk Test Only'],'068':['Keyswitch','Disarm','Momentary','Walk Test Only'],'069':['Keyswitch','Disarm','Maintained','Walk Test Only'],'071':['Doorbell','Walk Test Only'],'072':['Entry / Exit','Infinite Exit Delay','Push to Set','Walk Test Only']
  };
  return (map[code]||[]).slice();
}
function neoZoneTypeBuildRelationships(){
  var programming=((window.DSC_DATA||{}).programming||{}).neo||{}, optionSets=programming.optionSets||{};
  var options=Array.isArray(optionSets['neo-zone-definition-types'])?optionSets['neo-zone-definition-types']:[];
  var installerNodes={};
  function visit(value){
    if(!value||typeof value!=='object') return;
    if(value.id&&value.sensorCompatibility&&value.code!=null){
      var code=String(value.code).padStart(3,'0');
      if(!installerNodes[code]||String(value.id).indexOf('neo-installer-')===0) installerNodes[code]=value;
    }
    if(Array.isArray(value)){value.forEach(visit);return;}
    Object.keys(value).forEach(function(key){visit(value[key]);});
  }
  visit(programming.entries||[]);
  var byCode={};
  options.forEach(function(item){
    var code=String(item&&item.code||'').padStart(3,'0'), node=installerNodes[code]||null;
    var reportingRelation=(NEO_REPORTING_CODES_REFERENCE.relationships.zoneDefinitions||{})[code]||null;
    var systemEventNames=programming.systemEventRelationships&&programming.systemEventRelationships.byZoneDefinition&&programming.systemEventRelationships.byZoneDefinition[code]||[];
    byCode[code]={
      zoneDefinitionCode:code,
      programmingName:String(item.programmingName||item.label||''),
      keypadName:String(item.keypadName||item.label||''),
      alarmType:item.alarmType==null?null:String(item.alarmType),
      troubleType:item.troubleType==null?null:String(item.troubleType),
      is24HourDefinition:!!item.is24HourDefinition,
      characteristicTags:neoZoneTypeCharacteristicTags(code),
      sensorCompatibility:item.sensorCompatibility||null,
      sensorRuleType:item.sensorRuleType||null,
      installerProgrammingSection:'[001]',
      optionSet:'neo-zone-definition-types',
      installerProgrammingNodeId:node&&node.id?node.id:null,
      reportingRelationshipStatus:reportingRelation&&reportingRelation.status||null,
      reportingDefinition:reportingRelation&&reportingRelation.reportingDefinition||null,
      systemEvents:systemEventNames.slice()
    };
  });
  return {schemaVersion:'1.1.0',installerProgrammingSection:'[001]',optionSet:'neo-zone-definition-types',byCode:byCode};
}
var NEO_ZONE_TYPE_RELATIONSHIPS=neoZoneTypeBuildRelationships();
window.DSC_NEO_ZONE_TYPE_ENGINE={
  schemaVersion:'1.1.0',
  relationships:NEO_ZONE_TYPE_RELATIONSHIPS,
  getDefinition:function(definitionCode){
    var code=String(definitionCode==null?'':definitionCode).replace(/\D/g,'').padStart(3,'0').slice(-3);
    var relation=NEO_ZONE_TYPE_RELATIONSHIPS.byCode[code];
    return relation?JSON.parse(JSON.stringify(relation)):null;
  }
};
window.DSC_NEO_INTERNAL_RELATIONSHIPS={
  schemaVersion:'1.0.0',
  panelModels:window.NEO_PANEL_MODEL_PROFILES||{},
  reporting:NEO_REPORTING_CODES_REFERENCE.relationships,
  zoneTypes:NEO_ZONE_TYPE_RELATIONSHIPS,
  systemEvents:JSON.parse(JSON.stringify((((window.DSC_DATA||{}).programming||{}).neo||{}).systemEventRelationships||{}))
};

window.DSC_NEO_REFERENCE_DATA = {
  "reportingCodes": NEO_REPORTING_CODES_REFERENCE,
  "zoneTypes": {
    "id": "neo-zone-types",
    "eyebrow": "PowerSeries NEO · Tools",
    "title": "Zone Type Tools",
    "subtitle": "Search and filter the complete PowerSeries NEO zone-definition list by code, programming/keypad name, supervision, sensor contact, 24-hour behavior, alarm type, trouble type, and characteristics.",
    "relationships": NEO_ZONE_TYPE_RELATIONSHIPS
  },
  "keypadTextEntry": {
    "id": "neo-keypad-text-entry",
    "eyebrow": "Useful Information · Keypads",
    "title": "Keypad Text Entry",
    "subtitle": "Press a keypad key repeatedly to cycle through the characters assigned to that key while programming text fields such as labels.",
    "example": "Example: to enter F, press [2] three times.",
    "rows": [
      {
        "key": "[1]",
        "presses": [
          "A",
          "B",
          "C",
          "1"
        ]
      },
      {
        "key": "[2]",
        "presses": [
          "D",
          "E",
          "F",
          "2"
        ]
      },
      {
        "key": "[3]",
        "presses": [
          "G",
          "H",
          "I",
          "3"
        ]
      },
      {
        "key": "[4]",
        "presses": [
          "J",
          "K",
          "L",
          "4"
        ]
      },
      {
        "key": "[5]",
        "presses": [
          "M",
          "N",
          "O",
          "5"
        ]
      },
      {
        "key": "[6]",
        "presses": [
          "P",
          "Q",
          "R",
          "6"
        ]
      },
      {
        "key": "[7]",
        "presses": [
          "S",
          "T",
          "U",
          "7"
        ]
      },
      {
        "key": "[8]",
        "presses": [
          "V",
          "W",
          "X",
          "8"
        ]
      },
      {
        "key": "[9]",
        "presses": [
          "Y",
          "Z",
          "9",
          "0"
        ]
      },
      {
        "key": "[0]",
        "presses": [
          "Space",
          "-",
          "-",
          "-"
        ]
      },
      {
        "key": "[*]",
        "presses": [
          "Select",
          "-",
          "-",
          "-"
        ]
      },
      {
        "key": "[#]",
        "presses": [
          "Escape / Back",
          "-",
          "-",
          "-"
        ]
      }
    ]
  },
  "keypadWordLibrary": {
    "id": "neo-keypad-word-library",
    "eyebrow": "Useful Information · Keypads",
    "title": "Keypad Word Library",
    "subtitle": "Numbered words and characters available for keypad label programming.",
    "entries": [
      [
        "001",
        "Aborted"
      ],
      [
        "002",
        "AC"
      ],
      [
        "003",
        "Access"
      ],
      [
        "004",
        "Active"
      ],
      [
        "005",
        "Activity"
      ],
      [
        "006",
        "Alarm"
      ],
      [
        "007",
        "All"
      ],
      [
        "008",
        "AM"
      ],
      [
        "009",
        "Area"
      ],
      [
        "010",
        "Arm"
      ],
      [
        "011",
        "Armed"
      ],
      [
        "012",
        "Arming"
      ],
      [
        "013",
        "Attic"
      ],
      [
        "014",
        "Auxiliary"
      ],
      [
        "015",
        "Away"
      ],
      [
        "016",
        "Baby"
      ],
      [
        "017",
        "Back"
      ],
      [
        "018",
        "Bar"
      ],
      [
        "019",
        "Basement"
      ],
      [
        "020",
        "Bathroom"
      ],
      [
        "021",
        "Battery"
      ],
      [
        "022",
        "Bedroom"
      ],
      [
        "023",
        "Bonus"
      ],
      [
        "024",
        "Bottom"
      ],
      [
        "025",
        "Breezeway"
      ],
      [
        "026",
        "Building"
      ],
      [
        "027",
        "Bus"
      ],
      [
        "028",
        "Bypass"
      ],
      [
        "029",
        "Bypassed"
      ],
      [
        "030",
        "Cabinet"
      ],
      [
        "031",
        "Camera"
      ],
      [
        "032",
        "Canceled"
      ],
      [
        "033",
        "Car"
      ],
      [
        "034",
        "Carbon"
      ],
      [
        "035",
        "Central"
      ],
      [
        "036",
        "Chime"
      ],
      [
        "037",
        "Closed"
      ],
      [
        "038",
        "Closet"
      ],
      [
        "039",
        "Closing"
      ],
      [
        "040",
        "Code"
      ],
      [
        "041",
        "Communicator"
      ],
      [
        "042",
        "Computer"
      ],
      [
        "043",
        "Control"
      ],
      [
        "044",
        "Date"
      ],
      [
        "045",
        "Daughter’s"
      ],
      [
        "046",
        "Degrees"
      ],
      [
        "047",
        "Delay"
      ],
      [
        "048",
        "Den"
      ],
      [
        "049",
        "Desk"
      ],
      [
        "050",
        "Detector"
      ],
      [
        "051",
        "Dining"
      ],
      [
        "052",
        "Disarmed"
      ],
      [
        "053",
        "Door"
      ],
      [
        "054",
        "Down"
      ],
      [
        "055",
        "Download"
      ],
      [
        "056",
        "Downstairs"
      ],
      [
        "057",
        "Drawer"
      ],
      [
        "058",
        "Driveway"
      ],
      [
        "059",
        "Duct"
      ],
      [
        "060",
        "Duress"
      ],
      [
        "061",
        "East"
      ],
      [
        "062",
        "Energy"
      ],
      [
        "063",
        "Enter"
      ],
      [
        "064",
        "Entry"
      ],
      [
        "065",
        "Error"
      ],
      [
        "066",
        "Exercise"
      ],
      [
        "067",
        "Exit"
      ],
      [
        "068",
        "Exterior"
      ],
      [
        "069",
        "Factory"
      ],
      [
        "070",
        "Failure"
      ],
      [
        "071",
        "Family"
      ],
      [
        "072",
        "Father’s"
      ],
      [
        "073",
        "Feature"
      ],
      [
        "074",
        "Fence"
      ],
      [
        "075",
        "Fire"
      ],
      [
        "076",
        "First"
      ],
      [
        "077",
        "Floor"
      ],
      [
        "078",
        "Force"
      ],
      [
        "079",
        "Foyer"
      ],
      [
        "080",
        "Freeze"
      ],
      [
        "081",
        "Front"
      ],
      [
        "082",
        "Furnace"
      ],
      [
        "083",
        "Gallery"
      ],
      [
        "084",
        "Garage"
      ],
      [
        "085",
        "Gas"
      ],
      [
        "086",
        "Glass"
      ],
      [
        "087",
        "Goodbye"
      ],
      [
        "088",
        "Gym"
      ],
      [
        "089",
        "Hallway"
      ],
      [
        "090",
        "Heat"
      ],
      [
        "091",
        "Hello"
      ],
      [
        "092",
        "Help"
      ],
      [
        "093",
        "High"
      ],
      [
        "094",
        "Home"
      ],
      [
        "095",
        "House"
      ],
      [
        "096",
        "In"
      ],
      [
        "097",
        "Install"
      ],
      [
        "098",
        "Interior"
      ],
      [
        "099",
        "Intrusion"
      ],
      [
        "100",
        "Invalid"
      ],
      [
        "101",
        "Is"
      ],
      [
        "102",
        "Key"
      ],
      [
        "103",
        "Kids"
      ],
      [
        "104",
        "Kitchen"
      ],
      [
        "105",
        "Latchkey"
      ],
      [
        "106",
        "Laundry"
      ],
      [
        "107",
        "Left"
      ],
      [
        "108",
        "Level"
      ],
      [
        "109",
        "Library"
      ],
      [
        "110",
        "Light"
      ],
      [
        "111",
        "Lights"
      ],
      [
        "112",
        "Living"
      ],
      [
        "113",
        "Load"
      ],
      [
        "114",
        "Loading"
      ],
      [
        "115",
        "Low"
      ],
      [
        "116",
        "Lower"
      ],
      [
        "117",
        "Main"
      ],
      [
        "118",
        "Master"
      ],
      [
        "119",
        "Mat"
      ],
      [
        "120",
        "Medical"
      ],
      [
        "121",
        "Memory"
      ],
      [
        "122",
        "Menu"
      ],
      [
        "123",
        "Monoxide"
      ],
      [
        "124",
        "Mother’s"
      ],
      [
        "125",
        "Motion"
      ],
      [
        "126",
        "No"
      ],
      [
        "127",
        "North"
      ],
      [
        "128",
        "Not"
      ],
      [
        "129",
        "Now"
      ],
      [
        "130",
        "Number"
      ],
      [
        "131",
        "Off"
      ],
      [
        "132",
        "Office"
      ],
      [
        "133",
        "OK"
      ],
      [
        "134",
        "On"
      ],
      [
        "135",
        "Open"
      ],
      [
        "136",
        "Opening"
      ],
      [
        "137",
        "Panic"
      ],
      [
        "138",
        "Partition"
      ],
      [
        "139",
        "Patio"
      ],
      [
        "140",
        "Pet"
      ],
      [
        "141",
        "Phone"
      ],
      [
        "142",
        "Please"
      ],
      [
        "143",
        "PM"
      ],
      [
        "144",
        "Police"
      ],
      [
        "145",
        "Pool"
      ],
      [
        "146",
        "Porch"
      ],
      [
        "147",
        "Power"
      ],
      [
        "148",
        "Press"
      ],
      [
        "149",
        "Program"
      ],
      [
        "150",
        "Progress"
      ],
      [
        "151",
        "Quiet"
      ],
      [
        "152",
        "Rear"
      ],
      [
        "153",
        "Receiver"
      ],
      [
        "154",
        "Report"
      ],
      [
        "155",
        "RF"
      ],
      [
        "156",
        "Right"
      ],
      [
        "157",
        "Room"
      ],
      [
        "158",
        "Safe"
      ],
      [
        "159",
        "Saver"
      ],
      [
        "160",
        "Schedule"
      ],
      [
        "161",
        "Screen"
      ],
      [
        "162",
        "Second"
      ],
      [
        "163",
        "Sensor"
      ],
      [
        "164",
        "Service"
      ],
      [
        "165",
        "Shed"
      ],
      [
        "166",
        "Shock"
      ],
      [
        "167",
        "Shop"
      ],
      [
        "168",
        "Side"
      ],
      [
        "169",
        "Siren"
      ],
      [
        "170",
        "Sliding"
      ],
      [
        "171",
        "Smoke"
      ],
      [
        "172",
        "Son’s"
      ],
      [
        "173",
        "Sound"
      ],
      [
        "174",
        "South"
      ],
      [
        "175",
        "Special"
      ],
      [
        "176",
        "Stairs"
      ],
      [
        "177",
        "Stay"
      ],
      [
        "178",
        "Sun"
      ],
      [
        "179",
        "Supervisory"
      ],
      [
        "180",
        "System"
      ],
      [
        "181",
        "Tamper"
      ],
      [
        "182",
        "Temperature"
      ],
      [
        "183",
        "Test"
      ],
      [
        "184",
        "Time"
      ],
      [
        "185",
        "To"
      ],
      [
        "186",
        "Touchpad"
      ],
      [
        "187",
        "Trouble"
      ],
      [
        "188",
        "Unbypass"
      ],
      [
        "189",
        "Unit"
      ],
      [
        "190",
        "Up"
      ],
      [
        "191",
        "West"
      ],
      [
        "192",
        "Window"
      ],
      [
        "193",
        "Zone"
      ],
      [
        "194",
        "0"
      ],
      [
        "195",
        "1"
      ],
      [
        "196",
        "2"
      ],
      [
        "197",
        "3"
      ],
      [
        "198",
        "4"
      ],
      [
        "199",
        "5"
      ],
      [
        "200",
        "6"
      ],
      [
        "201",
        "7"
      ],
      [
        "202",
        "8"
      ],
      [
        "203",
        "9"
      ],
      [
        "204",
        "A"
      ],
      [
        "205",
        "B"
      ],
      [
        "206",
        "C"
      ],
      [
        "207",
        "D"
      ],
      [
        "208",
        "E"
      ],
      [
        "209",
        "F"
      ],
      [
        "210",
        "G"
      ],
      [
        "211",
        "H"
      ],
      [
        "212",
        "I"
      ],
      [
        "213",
        "J"
      ],
      [
        "214",
        "K"
      ],
      [
        "215",
        "L"
      ],
      [
        "216",
        "M"
      ],
      [
        "217",
        "N"
      ],
      [
        "218",
        "O"
      ],
      [
        "219",
        "P"
      ],
      [
        "220",
        "Q"
      ],
      [
        "221",
        "R"
      ],
      [
        "222",
        "S"
      ],
      [
        "223",
        "T"
      ],
      [
        "224",
        "U"
      ],
      [
        "225",
        "V"
      ],
      [
        "226",
        "W"
      ],
      [
        "227",
        "X"
      ],
      [
        "228",
        "Y"
      ],
      [
        "229",
        "Z"
      ],
      [
        "230",
        "Space"
      ],
      [
        "231",
        ","
      ],
      [
        "232",
        "-"
      ],
      [
        "233",
        "_ (Underscore)"
      ],
      [
        "234",
        "*"
      ],
      [
        "235",
        "#"
      ],
      [
        "236",
        ":"
      ],
      [
        "237",
        "/"
      ],
      [
        "238",
        "?"
      ]
    ]
  },
  "panelSpecifications": {
    "id": "neo-panel-specifications",
    "eyebrow": "PowerSeries NEO",
    "title": "Specifications",
    "subtitle": "Shared alarm-controller specifications for the PowerSeries NEO family. Individual model pages contain only model-specific capacities and limits.",
    "sections": [
      {
        "id": "zone-configuration",
        "title": "Zone Configuration",
        "bullets": [
          "16, 32, 64, or 128 wireless zones supported and up to 8 hardwired zones available on the controller.",
          "40 zone types and 14 programmable zone attributes.",
          "Zone configurations available: normally closed, single EOL, and DEOL supervised.",
          "Hardwired zone expansion (fully supervised) is available using the HSM2108 eight-zone expander module.",
          "Wireless zone expansion (fully supervised) is available using the HSM2HOST two-way wireless integration module operating at 915 MHz (North America), 433 MHz (Europe), and 868 MHz (international)."
        ]
      },
      {
        "id": "access-codes",
        "title": "Access Codes",
        "bullets": [
          "Up to 1002 access codes: 1000 level 2-EN user codes, one level 3-EN installer code, and one maintenance code.",
          "Programmable attributes for each user code."
        ],
        "tableTitle": "Minimum variations when using 8-digit access codes",
        "rows": [
          [
            "HS2016-4",
            "2,083,333"
          ],
          [
            "HS2032",
            "1,388,888"
          ],
          [
            "HS2064 / HS2128",
            "1,052,631"
          ],
          [
            "HS2064 E",
            "200,000"
          ],
          [
            "HS2128 E",
            "100,000"
          ]
        ]
      },
      {
        "id": "warning-device-output",
        "title": "Warning Device Output",
        "bullets": [
          "Integral sounder capable of 85 dB at 3 m, self-powered type Z.",
          "Supports two remote wireless indoor/outdoor warning devices: PGx901 indoor and PGx911 outdoor, where x is 4, 8, or 9.",
          "Programmable as steady, pulsed, temporal three (ISO 8201), or temporal four (CO alarm) output.",
          "Warning-device alarm priority: fire, CO, burglary."
        ],
        "notes": [
          "For NFA2P-certified systems, the warning-device operating delay must be set to a maximum of 10 minutes."
        ]
      },
      {
        "id": "memory",
        "title": "Memory",
        "bullets": [
          "CMOS EEPROM memory.",
          "Retains programming and system status during AC or battery failure for a minimum of 20 years (not verified by UL)."
        ]
      },
      {
        "id": "transformer",
        "title": "Transformer",
        "rows": [
          [
            "Transformer models",
            "DSC PTD1640U, PTC1640U, PTC1640CG"
          ],
          [
            "Primary",
            "120 V, 60 Hz, Class II"
          ],
          [
            "Secondary",
            "16.5 VAC, 40 VA maximum"
          ]
        ]
      },
      {
        "id": "regulated-power-supply",
        "title": "Regulated Power Supply",
        "bullets": [
          "700 mA auxiliary supply, 12 VDC.",
          "Three resettable positive temperature coefficient (PTC) fuses protect the panel power circuits: X100F 1 A for the auxiliary circuit, X200F 2 A for the bell circuit, and X250F 2.5 A for the battery circuit.",
          "Reverse-battery detection and protection.",
          "Supervision for AC power and low battery.",
          "Normal and high-current battery-charge options.",
          "Supervised battery-charging circuit."
        ]
      },
      {
        "id": "ptc-circuit-protection",
        "title": "PTC Circuit Protection",
        "intro": "The PowerSeries NEO control panel has three resettable PTC fuses. The fuse designator, rating, and protected circuit are linked as follows.",
        "rows": [
          [
            "X100F — 1 A",
            "Auxiliary circuit · AUX+, AUX-"
          ],
          [
            "X200F — 2 A",
            "Bell circuit · BELL+, BELL-"
          ],
          [
            "X250F — 2.5 A",
            "Battery circuit · BAT+, BAT-"
          ]
        ],
        "notes": [
          "The PTC fuse rating is the circuit-protection rating; it does not replace the normal output-current limits specified for AUX or BELL."
        ]
      },
      {
        "id": "panel-current-draw",
        "title": "Current Draw (Panel)",
        "rows": [
          [
            "Panel current draw",
            "85 mA nominal; 2 A maximum"
          ]
        ]
      },
      {
        "id": "bell-output",
        "title": "Bell Output",
        "bullets": [
          "12 V, 700 mA supervised bell output with 1 kΩ supervision; the bell circuit is protected by X200F, a 2 A resettable PTC fuse.",
          "Steady, pulsed, temporal three fire, and temporal four CO alarm cadences.",
          "Bell short detection through software and hardware."
        ]
      },
      {
        "id": "aux-output",
        "title": "AUX+ and Onboard Programmable Outputs",
        "bullets": [
          "AUX+ voltage range: 9.6 VDC to 13.8 VDC.",
          "AUX+ current: 700 mA, shared with Corbus RED.",
          "The auxiliary circuit is protected by X100F, a 1 A resettable PTC fuse.",
          "Output ripple voltage: 270 mVp-p maximum.",
          {
            "text": "Onboard programmable outputs by panel model:",
            "children": [
              "HS2016 and HS2032: 2 onboard PGMs — PGM1 and PGM2.",
              "HS2016-4, HS2064, HS2064 E, HS2128, and HS2128 E: 4 onboard PGMs — PGM1, PGM2, PGM3, and PGM4.",
              "PGM1: 50 mA switched programmable output.",
              "PGM2: 300 mA current-limited switched programmable output. Two-wire smoke detectors are supported on this PGM with a 90 mA current limit.",
              "PGM3 and PGM4: 50 mA switched programmable outputs; these onboard terminals exist only on the four-PGM panel models listed above."
            ]
          },
          "Hardware PGM overcurrent protection."
        ]
      },
      {
        "id": "battery",
        "title": "Battery",
        "bullets": [
          "12 V sealed lead-acid, rechargeable battery.",
          {
            "text": "Battery capacity:",
            "children": [
              "4 hours for UL commercial burglary and residential burglary.",
              "12 hours for EN 50131.",
              "24 hours for INCERT (Belgium)."
            ]
          },
          "Maximum standby time: 24 hours with a 14 Ah battery and AUX current limited to 470 mA.",
          "Recharging time to 80%: 72 hours.",
          "Recharging rate: 240 mA for 12 hours maximum; 480 mA for 24-hour backup.",
          "Backup time: 24 hours (UL).",
          "Battery lifespan: 3–5 years.",
          "Low-battery trouble indication threshold: 11.5 VDC.",
          "Battery restore voltage: 12.5 V.",
          {
            "text": "Main-board current draw on battery only:",
            "children": [
              "HS2016 / HS2032 / HS2064 / HS2128 without an alternate communicator: 85 mA DC standby.",
              "HS2016 / HS2032 / HS2064 / HS2128 with an alternate communicator: 190 mA DC standby.",
              "Alternate communicator transmit: 195 mA DC."
            ]
          },
          "The battery circuit is protected by X250F, a 2.5 A resettable PTC fuse.",
          "Supervision for loss of primary AC power, battery loss, and low battery voltage, with trouble indication at the keypad.",
          "Internal clock locked to the AC power frequency."
        ],
        "notes": [
          "For T 014 compliance (INCERT certification), only 14 Ah capacity using two 7 Ah batteries was tested and accepted for INCERT-certified systems."
        ]
      },
      {
        "id": "environmental-conditions",
        "title": "Operating Environmental Conditions",
        "rows": [
          [
            "Temperature range",
            "UL: 0°C to +49°C (32°F to 120°F)"
          ],
          [
            "Relative humidity",
            "Less than 93%, non-condensing"
          ]
        ]
      },
      {
        "id": "ate-specification",
        "title": "Alarm Transmitter Equipment (ATE) Specification",
        "bullets": [
          "Digital dialer integral to the main control board.",
          "Supports SIA and Contact ID.",
          "Complies with TS 203 021-1, -2, and -3 telecom-equipment requirements and EN 50136-1-1, EN 50136-2-1, and EN 50136-2-3 ATS 2.",
          "Optional dual IP/cellular communicators 3G2080(R)E, TL2803G(R)E, and TL280(R)E can be installed in the same enclosure and configured as primary or backup communicators with AES 128-bit encryption.",
          "Compliant with EN 50136-1-1 and EN 50136-2-1 ATS 2 requirements."
        ]
      },
      {
        "id": "system-supervision",
        "title": "System Supervision Features",
        "intro": "The PowerSeries NEO continuously monitors possible trouble conditions and provides audible and visual indication at the keypad.",
        "bullets": [
          "AC power failure.",
          "Zone trouble.",
          "Fire trouble.",
          "Telephone-line trouble.",
          "Communicator trouble.",
          "Low-battery condition.",
          "RF jam.",
          "AUX power-supply fault.",
          "Failure to communicate.",
          "Module fault, including supervisory or tamper trouble."
        ],
        "notes": [
          "Overcurrent protection is provided by X100F on the auxiliary circuit, X200F on the bell circuit, and X250F on the battery circuit."
        ]
      },
      {
        "id": "additional-features",
        "title": "Additional Features",
        "bullets": [
          "Two-way wireless-device support.",
          "Visual verification using images and audio.*",
          "Proximity-tag support.",
          "PGM scheduling.",
          "Quick arming.",
          "User, partition, module, zone, and system labels.",
          "Soak test.*",
          "Programmable system loop response.",
          "Keypad and panel software versions viewable through the keypad.",
          "Doorbell zone type.",
          "Low-battery PGM type."
        ],
        "notes": [
          "* Feature not evaluated by UL/ULC."
        ]
      }
    ]
  },
  "panelInstallation": {
    "id": "neo-panel-installation",
    "eyebrow": "PowerSeries NEO",
    "title": "Installation",
    "subtitle": "PowerSeries NEO alarm-controller mounting, terminal, power, Corbus, zone, PGM, bell, telephone, and grounding information.",
    "sections": [
      {
        "id": "mounting-enclosure",
        "title": "Mounting the Enclosure",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Locate the panel in a dry area, preferably near an unswitched AC power source and the incoming telephone line."
          },
          {
            "type": "warning",
            "text": "Complete all wiring before applying AC power or connecting the battery."
          }
        ]
      },
      {
        "id": "terminal-descriptions",
        "title": "Terminal Descriptions",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The following terminals are available on the PowerSeries NEO alarm controller."
          },
          {
            "type": "table",
            "columns": [
              "Terminal",
              "Description"
            ],
            "rows": [
              [
                "BAT+, BAT-",
                "Battery terminals. Use to provide backup power and additional current when system demand exceeds the transformer output, such as when the system is in alarm. The battery circuit is protected by X250F, a 2.5 A resettable PTC fuse. Do not connect the battery until all other wiring is complete."
              ],
              [
                "AC",
                "Power terminals. Connect the battery before connecting AC. Do not connect the battery or transformer until all other wiring is complete."
              ],
              [
                "AUX+, AUX-",
                "Auxiliary terminals. Use to power modules, detectors, relays, LEDs, and similar devices (700 mA maximum). The auxiliary circuit is protected by X100F, a 1 A resettable PTC fuse. Connect the positive side to AUX+ and the negative side to AUX-."
              ],
              [
                "BELL+, BELL-",
                "Bell/siren power (700 mA maximum). The bell circuit is protected by X200F, a 2 A resettable PTC fuse. Connect the positive side of the alarm warning device to BELL+ and the negative side to BELL-."
              ],
              [
                "RED, BLK, YEL, GRN",
                "Corbus terminals. Provide communication between the alarm controller and connected modules. Each module has four Corbus terminals that must be connected to the Corbus."
              ],
              [
                "PGM1, PGM2",
                "Onboard programmable-output terminals present on every listed NEO controller. PGM1: 50 mA. PGM2: 300 mA, or it can be configured as an input."
              ],
              [
                "PGM3, PGM4",
                "Additional 50 mA onboard programmable-output terminals present only on HS2016-4, HS2064, HS2064 E, HS2128, and HS2128 E. These terminals are not present on HS2016 or HS2032."
              ],
              [
                "Z1 to Z8, COM",
                "Zone-input terminals. Ideally, each zone should have one detection device; however, multiple detection devices may be wired to the same zone."
              ],
              [
                "EGND",
                "Earth-ground connection."
              ],
              [
                "TIP, RING, T-1, R-1",
                "Telephone-line terminals."
              ],
              [
                "PCLINK_1",
                "DLS / SA."
              ],
              [
                "PCLINK_2",
                "DLS / SA and alternate communicator."
              ]
            ]
          }
        ]
      },
      {
        "id": "ptc-fuse-protection",
        "title": "PTC Fuse Protection",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The PowerSeries NEO panel uses three resettable PTC fuses to protect the auxiliary, bell, and battery circuits."
          },
          {
            "type": "table",
            "columns": [
              "Board designator",
              "Rating",
              "Protected circuit",
              "Related terminals"
            ],
            "rows": [
              [
                "X100F",
                "1 A",
                "Auxiliary circuit",
                "AUX+, AUX-"
              ],
              [
                "X200F",
                "2 A",
                "Bell circuit",
                "BELL+, BELL-"
              ],
              [
                "X250F",
                "2.5 A",
                "Battery circuit",
                "BAT+, BAT-"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Do not use the PTC rating as the connected-load allowance. Follow the normal AUX and BELL output-current limits when calculating system loading."
          }
        ]
      },
      {
        "id": "corbus-wiring",
        "title": "Corbus Wiring",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The RED and BLK Corbus terminals provide power, while YEL and GRN provide data communications. The four Corbus terminals on the alarm controller must be connected to the four Corbus terminals or wires of each module."
          },
          {
            "type": "bullets",
            "items": [
              "Use minimum 22 AWG quad cable; two twisted pairs are preferred.",
              "Modules may be home-run to the panel, connected in series, or T-tapped.",
              "Do not use shielded wire for Corbus wiring."
            ]
          },
          {
            "type": "note",
            "text": "Any module can be connected anywhere along the Corbus. Separate wire runs for keypads, zone expanders, and other modules are not necessary."
          },
          {
            "type": "note",
            "text": "No module may be more than 1,000 ft / 305 m from the panel when measured by total wire length."
          },
          {
            "type": "image",
            "src": "assets/neo-installation/corbus-wiring.png",
            "title": "Corbus wiring-distance example",
            "caption": "Modules A and B are within 1,000 ft / 305 m of the panel. Module C exceeds the maximum wire distance."
          }
        ]
      },
      {
        "id": "current-ratings",
        "title": "Current Ratings",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Use the following ratings to ensure that the combined current required by the alarm controller and connected power-supply modules does not exceed the available output."
          },
          {
            "type": "table",
            "title": "System output ratings",
            "columns": [
              "Device",
              "Output",
              "Rating (12 VDC)"
            ],
            "rows": [
              [
                "HS2016, HS2032, HS2064, HS2064 E, HS2128, HS2128 E",
                "AUX",
                "700 mA. Subtract the listed current for each keypad, expansion module, and accessory connected to AUX or Corbus. Reserve at least 100 mA for the Corbus."
              ],
              [
                "HS2016, HS2032, HS2064, HS2064 E, HS2128, HS2128 E",
                "BELL",
                "700 mA continuous; 2.0 A short-term. Available only with a standby battery connected. Not for UL/ULC or EN certified applications."
              ],
              [
                "HSM2208",
                "AUX",
                "250 mA continuous. Subtract the current of each connected device. Subtract this total load from the alarm-panel AUX/Corbus output."
              ],
              [
                "HSM2108",
                "AUX",
                "100 mA. Subtract the current of each connected device. Subtract this total load from the panel AUX/Corbus output."
              ]
            ]
          },
          {
            "type": "heading",
            "text": "Alarm Control Panel"
          },
          {
            "type": "paragraph",
            "text": "AUX provides 700 mA for devices connected to the AUX and PGM terminals and for modules connected to Corbus terminals. Reserve at least 100 mA for the Corbus."
          }
        ]
      },
      {
        "id": "capacitance-limits",
        "title": "Capacitance Limits",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Increasing Corbus capacitance slows data transmission. The capacitance rating of the wire determines the maximum total Corbus wire length."
          },
          {
            "type": "table",
            "title": "Wire capacitance",
            "columns": [
              "Wire capacitance per 1,000 ft / 300 m",
              "Maximum total Corbus wire length"
            ],
            "rows": [
              [
                "15 nF",
                "5,300 ft / 1,616 m"
              ],
              [
                "20 nF",
                "4,000 ft / 1,220 m"
              ],
              [
                "25 nF",
                "3,200 ft / 976 m"
              ],
              [
                "30 nF",
                "2,666 ft / 810 m"
              ],
              [
                "35 nF",
                "2,280 ft / 693 m"
              ],
              [
                "40 nF",
                "2,000 ft / 608 m"
              ]
            ]
          }
        ]
      },
      {
        "id": "ac-ul-listed",
        "title": "AC (UL Listed Installations)",
        "blocks": [
          {
            "type": "table",
            "columns": [
              "Specification",
              "Value"
            ],
            "rows": [
              [
                "Transformer",
                "DSC PTD1640U, PTD1640, PTC1640UG, or PTC1640CG"
              ],
              [
                "Primary",
                "120 VAC, 60 Hz, Class II"
              ],
              [
                "Secondary",
                "16.5 VAC, 40 VA"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Use DSC PTC1640CG for Canadian installations."
          },
          {
            "type": "warning",
            "text": "Do not connect the battery or transformer until all other wiring is complete."
          },
          {
            "type": "paragraph",
            "text": "For ULC S559 applications, use the Stantex FTC3716 transformer for direct wiring."
          },
          {
            "type": "note",
            "text": "For UL/ULC installations, use only 60 Hz."
          }
        ]
      },
      {
        "id": "batteries",
        "title": "Batteries",
        "blocks": [
          {
            "type": "warning",
            "text": "Do not connect the battery until all other wiring is complete."
          },
          {
            "type": "paragraph",
            "text": "A sealed, rechargeable lead-acid or gel battery is required to meet UL power-standby requirements."
          },
          {
            "type": "paragraph",
            "text": "Connect the RED battery lead to the positive battery terminal and the BLACK battery lead to the negative battery terminal."
          },
          {
            "type": "paragraph",
            "text": "The battery circuit is protected by X250F, a 2.5 A resettable PTC fuse."
          },
          {
            "type": "note",
            "text": "Refer to AUX loading and battery selection when calculating standby capacity."
          }
        ]
      },
      {
        "id": "zone-wiring",
        "title": "Zone Wiring",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Power down the alarm controller before completing zone wiring."
          },
          {
            "type": "paragraph",
            "text": "Zones may supervise normally open devices, such as smoke detectors, or normally closed devices, such as door contacts. The alarm panel can also be programmed for single end-of-line or double end-of-line resistors."
          },
          {
            "type": "bullets",
            "items": [
              "[001] selects the zone definition.",
              "[013] option [1] selects normally closed or EOL; option [2] selects SEOL or DEOL.",
              "[201] to [208] assign zones to partitions."
            ]
          },
          {
            "type": "bullets",
            "items": [
              "For UL listed installations, use SEOL or DEOL only.",
              "Use minimum 22 AWG wire, maximum 18 AWG.",
              "Do not use shielded wire.",
              "Do not exceed 100 Ω wire resistance."
            ]
          },
          {
            "type": "table",
            "title": "Burglary zone wiring chart",
            "columns": [
              "Wire gauge",
              "Maximum length to EOL resistor"
            ],
            "rows": [
              [
                "22 AWG",
                "3,000 ft / 914 m"
              ],
              [
                "20 AWG",
                "4,900 ft / 1,493 m"
              ],
              [
                "19 AWG",
                "6,200 ft / 1,889 m"
              ],
              [
                "18 AWG",
                "7,800 ft / 2,377 m"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Figures are based on a maximum wiring resistance of 100 Ω."
          }
        ]
      },
      {
        "id": "aux-power-wiring",
        "title": "AUX Power Wiring",
        "blocks": [
          {
            "type": "paragraph",
            "text": "AUX terminals provide 11.3 to 12.5 VDC / 700 mA, shared with PGM outputs. Connect the positive side of a device to AUX+ and the negative side to AUX- / GND."
          },
          {
            "type": "paragraph",
            "text": "The auxiliary circuit is protected by X100F, a 1 A resettable PTC fuse. If excessive current is drawn, such as from a wiring short, the output is temporarily shut off until the problem is corrected."
          },
          {
            "type": "note",
            "text": "With a 12 V, 14 Ah battery, maximum AUX capacity for 24-hour standby is 470 mA."
          }
        ]
      },
      {
        "id": "pgm-wiring",
        "title": "PGM Wiring",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The minimum and maximum operating voltage for devices, sensors, and modules is 9.5 to 14 VDC."
          },
          {
            "type": "paragraph",
            "text": "PGMs switch to ground when activated. Connect the positive side of the device to AUX+ and the negative side to a PGM terminal."
          },
          {
            "type": "bullets",
            "items": [
              "HS2016 and HS2032 have 2 onboard PGM terminals: PGM1 and PGM2.",
              "HS2016-4, HS2064, HS2064 E, HS2128, and HS2128 E have 4 onboard PGM terminals: PGM1, PGM2, PGM3, and PGM4.",
              "PGM1, PGM3, and PGM4 supply up to 50 mA; PGM3 and PGM4 apply only to the four-PGM models.",
              "PGM2 supplies up to 300 mA.",
              "Use a relay when the required current exceeds the applicable terminal rating.",
              "PGM2 may also be used for two-wire smoke detectors or a 24-hour burglary-input alarm."
            ]
          },
          {
            "type": "note",
            "text": "Use SEOL resistors on fire zones only."
          },
          {
            "type": "image",
            "src": "assets/neo-installation/pgm-wiring.png",
            "title": "PGM output wiring examples",
            "caption": "LED indicator with current-limiting resistor, optional relay driver, and normally open push-button input examples."
          }
        ]
      },
      {
        "id": "seol-wiring",
        "title": "Single End-of-Line (SEOL) Resistor",
        "blocks": [
          {
            "type": "paragraph",
            "text": "With an SEOL resistor installed at the end of a zone loop, the panel detects whether the circuit is secure, open, or shorted. Install the resistor at the end of the loop for proper supervision."
          },
          {
            "type": "paragraph",
            "text": "To enable SEOL supervision, program section [013], options [1] and [2] to OFF."
          },
          {
            "type": "note",
            "text": "Select this option for either normally closed or normally open detection devices or contacts."
          },
          {
            "type": "image",
            "src": "assets/neo-installation/seol-wiring.png",
            "title": "SEOL wiring",
            "caption": "Normally closed, normally open, and mixed contact examples using a 5.6 kΩ end-of-line resistor."
          }
        ]
      },
      {
        "id": "deol-wiring",
        "title": "Double End-of-Line (DEOL) Resistors",
        "blocks": [
          {
            "type": "paragraph",
            "text": "With DEOL resistors installed at the end of a zone loop, the second resistor allows the panel to determine whether the zone is open, closed, or tampered/faulted."
          },
          {
            "type": "note",
            "text": "Any zone programmed for Fire or 24-hour Supervisory must use SEOL regardless of the selected supervision type."
          },
          {
            "type": "paragraph",
            "text": "After changing zone supervision between DEOL, SEOL, or normally closed, completely power the system down and back up. To enable DEOL supervision, program section [013], option [1] OFF and option [2] ON."
          },
          {
            "type": "image",
            "src": "assets/neo-installation/deol-wiring.png",
            "title": "DEOL wiring",
            "caption": "Double-EOL normally closed contact using two 5.6 kΩ resistors."
          }
        ]
      },
      {
        "id": "bell-wiring",
        "title": "Bell Wiring",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The BELL terminals supply 700 mA at 10.4 to 12.5 VDC for commercial and residential installations. Steady and pulsed alarm outputs are supported. For NFPA 72 Temporal Three Pattern operation, section [013] option [8] must be ON."
          },
          {
            "type": "paragraph",
            "text": "The bell output is supervised, and the bell circuit is protected by X200F, a 2 A resettable PTC fuse. When used, connect a 1 kΩ resistor across BELL+ and BELL- to prevent a trouble indication."
          },
          {
            "type": "note",
            "text": "Observe polarity when connecting polarized sirens or bells."
          },
          {
            "type": "image",
            "src": "assets/neo-installation/bell-wiring.png",
            "title": "Bell wiring",
            "caption": "Polarized siren or bell connection to BELL+ and BELL-."
          }
        ]
      },
      {
        "id": "telephone-line-wiring",
        "title": "Telephone Line Wiring",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Wire TIP, RING, T-1, and R-1 to an RJ-31X connector as shown. When multiple devices share the telephone line, wire them in the indicated sequence."
          },
          {
            "type": "paragraph",
            "text": "Use minimum 26 AWG wire."
          },
          {
            "type": "paragraph",
            "text": "Telephone format is programmed in section [350]. Telephone call directions are programmed in options [311] through [318]."
          },
          {
            "type": "image",
            "src": "assets/neo-installation/telephone-line-wiring.png",
            "title": "Telephone-line wiring",
            "caption": "RJ-31X connection showing incoming telephone-company conductors and outgoing premises telephone conductors."
          }
        ]
      },
      {
        "id": "ground-wiring",
        "title": "Ground Wiring",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Using an insulated green wire of minimum 22 AWG, connect the EGND terminal and the grounding wire from the building electrical installation to an available grounding point on the back or side of the metal cabinet. Refer to the cabinet diagram for the suggested grounding-point location and hardware arrangement."
          },
          {
            "type": "note",
            "text": "Tighten the hardware sufficiently to break the cabinet paint and establish a reliable electrical connection."
          },
          {
            "type": "note",
            "text": "Wire and installation hardware are not included."
          },
          {
            "type": "image",
            "src": "assets/neo-installation/ground-wiring.png",
            "title": "Ground installation",
            "caption": "Recommended nut, lock-washer, star-washer, cabinet, and bolt arrangement for earth grounding."
          }
        ]
      }
    ]
  },
  "panelCircuitProtection": {
    "familyId": "powerseries-neo",
    "componentType": "resettable PTC fuse",
    "count": 3,
    "appliesToModels": [
      "HS2016",
      "HS2016-4",
      "HS2032",
      "HS2064",
      "HS2064 E",
      "HS2128",
      "HS2128 E"
    ],
    "fuses": [
      {
        "designator": "X100F",
        "ratingA": 1,
        "circuit": "Auxiliary circuit",
        "terminals": [
          "AUX+",
          "AUX-"
        ]
      },
      {
        "designator": "X200F",
        "ratingA": 2,
        "circuit": "Bell circuit",
        "terminals": [
          "BELL+",
          "BELL-"
        ]
      },
      {
        "designator": "X250F",
        "ratingA": 2.5,
        "circuit": "Battery circuit",
        "terminals": [
          "BAT+",
          "BAT-"
        ]
      }
    ]
  }
};
})();
