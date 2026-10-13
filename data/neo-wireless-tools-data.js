(function(){
'use strict';
var devices=[
  {
    "sourceRow": 2,
    "regularId": "101",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9945",
    "deviceDescription": "Magnetic Contact with Auxiliary Input (2 terminals)",
    "type1": "Zone",
    "type2": "Door Contact",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n2 Reed Switch = Y\n3 External Input = N\n4 Supervision = Y\n9 More Options",
      "002 Zone EOL:\n00 Disabled\n01 Single EOL (selected)\n02 Normally Open\n03 Normally Closed"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9945",
        "description": "PowerG Door/Window Contact w/Aux input",
        "sourceSlide": 7,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.2 V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic, Duracell",
        "lifeExpectancy": "8 years",
        "notes": []
      }
    ],
    "availableColors": [
      "White",
      "Brown"
    ],
    "defaultColor": "White"
  },
  {
    "sourceRow": 3,
    "regularId": "102",
    "fallbackId": "101",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9945E",
    "deviceDescription": "Magnetic Contact with Auxiliary Input (2 terminals)",
    "type1": "Zone",
    "type2": "Door Contact",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n2 Reed Switch = Y\n3 External Input = N\n4 Supervision = Y\n9 More Options",
      "002 Zone EOL:\n00 Disabled\n01 Single EOL (selected)\n02 Normally Open\n03 Normally Closed"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9945E",
        "description": "PowerG Plus Door/ Window Magnetic Contact with Auxiliary Input",
        "sourceSlide": 43,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Duracell / Panasonic",
        "lifeExpectancy": "8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 4,
    "regularId": "103",
    "fallbackId": "109",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9303",
    "deviceDescription": "Vanashing Magnetic Contact",
    "type1": "Zone",
    "type2": "Door Contact",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9303",
        "description": "PowerG Plus Vanishing Door/ Window Magnetic Contact",
        "sourceSlide": 40,
        "chemistry": "Lithium",
        "batteryModel": "CR2450",
        "rating": "3V",
        "lowBatteryThreshold": "2V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Duracell, Panasonic",
        "lifeExpectancy": "6 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 5,
    "regularId": "104",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9975",
    "deviceDescription": "Vanishing Contact - Old",
    "type1": "Zone",
    "type2": "Door Contact",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9975",
        "description": "PowerG Door/Window Contact",
        "sourceSlide": 6,
        "chemistry": "Lithium",
        "batteryModel": "CR2032",
        "rating": "3V @ 230mAh",
        "lowBatteryThreshold": "2.1V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Varta / Panasonic",
        "lifeExpectancy": "3 / 5 years",
        "notes": []
      }
    ],
    "availableColors": [
      "White",
      "Brown"
    ],
    "defaultColor": "White"
  },
  {
    "sourceRow": 6,
    "regularId": "107",
    "fallbackId": "101",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9312",
    "deviceDescription": "Outdoor Magnetic Contact with Auxiliary Input (2 terminals)",
    "type1": "Zone",
    "type2": "Door Contact",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n2 Reed Switch = Y\n3 External Input = N\n4 Supervision = Y\n9 More Options",
      "002 Zone EOL:\n00 Disabled (selected)\n01 Single EOL \n02 Normally Open\n03 Normally Closed"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9312",
        "description": "PowerG Outdoor Magnetic Contact with Auxiliary Input",
        "sourceSlide": 34,
        "chemistry": "Lithium",
        "batteryModel": "AA",
        "rating": "3V (2x1.5V)",
        "lowBatteryThreshold": "3V",
        "quantity": "2 x Battery",
        "recommendedBrands": "Energizer",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 7,
    "regularId": "108",
    "fallbackId": "100",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9307",
    "deviceDescription": "Recessed Magnetic Contact",
    "type1": "Zone",
    "type2": "Door Contact",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9307",
        "description": "PowerG Recessed Contact",
        "sourceSlide": 28,
        "chemistry": "Lithium",
        "batteryModel": "CR2",
        "rating": "3V",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic / Duracell",
        "lifeExpectancy": "10 years",
        "notes": []
      }
    ],
    "availableColors": [
      "White",
      "Clear"
    ],
    "defaultColor": "White"
  },
  {
    "sourceRow": 8,
    "regularId": "109",
    "fallbackId": "100",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9303",
    "deviceDescription": "Vanashing Magnetic Contact",
    "type1": "Zone",
    "type2": "Door Contact",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9303",
        "description": "PowerG Door/Window Vanishing Magnetic Contact",
        "sourceSlide": 33,
        "chemistry": "Lithium",
        "batteryModel": "CR2450",
        "rating": "3V",
        "lowBatteryThreshold": "2V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic, Duracell",
        "lifeExpectancy": "6 years",
        "notes": []
      }
    ],
    "availableColors": [
      "White",
      "Brown"
    ],
    "defaultColor": "White"
  },
  {
    "sourceRow": 9,
    "regularId": "110",
    "fallbackId": "101",
    "panelVersionRegularId": "-",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9309",
    "deviceDescription": "Comercial Magnetic Contact with Auxiliary Input (3 terminals)",
    "type1": "Zone",
    "type2": "Door Contact",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n2 Reed Switch = Y\n3 External Input = N\n4 Supervision = Y\n9 More Options",
      "002 Zone EOL:\n00 Disabled\n01 Single EOL (selected)\n02 Normally Open\n03 Normally Closed"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9309",
        "description": "PowerG Commercial Magnetic Contact with Auxiliary Input",
        "sourceSlide": 32,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP / Panasonic, Duracell",
        "lifeExpectancy": "typical use 8 years, typical commercial use 5 years / 5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 10,
    "regularId": "120",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9904P",
    "deviceDescription": "PIR Motion  Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "016 Event Counter:\n(Range = 001 - 002 activations)\n(001 more Sensitive, 002 Less Sensitive)\n002 activations (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9904P",
        "description": "PowerG PIR Motion Detector",
        "sourceSlide": 8,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V @ 1450mAh",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP / Panasonic, Duracell",
        "lifeExpectancy": "6 to 8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 11,
    "regularId": "122",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9924",
    "deviceDescription": "Curtaim PIR Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "006 Detection Range:\n01 Low Sensitivity\n02 Mid Sensitivity\n03 High Sensitivity (selected)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9924",
        "description": "PowerG Curtain PIR Motion Detector",
        "sourceSlide": 10,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V @1450mAh",
        "lowBatteryThreshold": "2.45V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP / Panasonic, Duracell",
        "lifeExpectancy": "7 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 12,
    "regularId": "123",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9974P",
    "deviceDescription": "Mirror Optic PIR Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "016 Event Counter:\n(Range = 001 - 002 activations)\n(001 more Sensitive, 002 Less Sensitive)\n002 activations (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9974P",
        "description": "PowerG Mirror Optic PIR Motion Detector",
        "sourceSlide": 12,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V @ 1450mAh",
        "lowBatteryThreshold": "2.45V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic / Duracell",
        "lifeExpectancy": "7 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 13,
    "regularId": "125",
    "fallbackId": "126",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9914",
    "deviceDescription": "Indoor Motion PIR Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "016 Event Counter:\n(Range = 001 - 002 activations)\n(001 more Sensitive, 002 Less Sensitive)\n002 activations (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9914",
        "description": "PowerG Plus Indoor Motion PIR",
        "sourceSlide": 41,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.4V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Duracell, Panasonic",
        "lifeExpectancy": "6 to 8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 14,
    "regularId": "126",
    "fallbackId": "120",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9914",
    "deviceDescription": "Digital Pet-Immune PIR Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "016 Event Counter:\n(Range = 001 - 002 activations)\n(001 more Sensitive, 002 Less Sensitive)\n002 activations (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9914",
        "description": "PowerG Digital Pet-Immune PIR Motion Detector",
        "sourceSlide": 27,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V @ 1450mAh",
        "lowBatteryThreshold": "2.4V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic / Duracell",
        "lifeExpectancy": "6 to 8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 15,
    "regularId": "127",
    "fallbackId": "120",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.31+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9862",
    "deviceDescription": "360 Ceiling-mount PIR Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9862",
        "description": "PowerG 360 Ceiling-mount PIR Detector",
        "sourceSlide": 29,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic, Duracell",
        "lifeExpectancy": "min 1year, typical use 3 years, presence mode 2 years / min 1year",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 16,
    "regularId": "128",
    "fallbackId": "120",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.31+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9872",
    "deviceDescription": "Long Range 360 Ceiling-mount PIR Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9872",
        "description": "PowerG Long Rage 360 Ceiling-mount PIR Detector",
        "sourceSlide": 36,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic / Duracell",
        "lifeExpectancy": "min 1year, typical use 3 years, presence mode 2 years / min 1year",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 17,
    "regularId": "129",
    "fallbackId": "130",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9902",
    "deviceDescription": "Outdoor Curtain PIR Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options >\n    3 24h / Night = Y",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "006 Detection Range:\n01 Low Sensitivity\n02 Mid Sensitivity\n03 High Sensitivity (selected)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9902",
        "description": "PowerG Outdoor Curtain PIR Detector",
        "sourceSlide": 35,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "6V (2x 3V @ 1450mAh)",
        "lowBatteryThreshold": "4V",
        "quantity": "2 x Battery",
        "recommendedBrands": "GP, Panasonic / Duracell",
        "lifeExpectancy": "min 1year, typical 3years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 18,
    "regularId": "130",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9994",
    "deviceDescription": "Outdoor PIR Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options >\n    3 24h / Night = Y",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "007 Detection Sensitivity:\n01 Low Sensitivity\n02 Mid Sensitivity (selected)\n03 High Sensitivity \n04 UL Standard"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9994",
        "description": "PowerG Outdoor PIR Motion Detector",
        "sourceSlide": 13,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "6V (2x 3V)",
        "lowBatteryThreshold": "4V",
        "quantity": "2 x Battery",
        "recommendedBrands": "GP / Panasonic / Duracell",
        "lifeExpectancy": "Min 1 year, typical 3 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 19,
    "regularId": "140",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9934P",
    "deviceDescription": "PIR Security Motion Detector with Camera",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "004 Image Brightness:\n01 Image Bright -3\n02 Image Bright -2\n03 Image Bright -1\n04 Image Bright 0 (selected)\n05 Image Bright +1\n06 Image Bright +2\n07 Image Bright +3",
      "005 Image Contrast:\n01 Image Contrast -3\n02 Image Contrast -2\n03 Image Contrast -1\n04 Image Contrast 0 (selected)\n05 Image Contrast +1\n06 Image Contrast +2\n07 Image Contrast +3",
      "011 Camera Toggles:\n1 Color = Y\n2 High Resolution = Y\n3 Normal Quality = N\n4 Microphone = N\n9 More Options >\n    1 AC Power = N",
      "016 Event Counter:\n(range 001 - 002 activations)\n(001 more Sensitive, 002 Less Sensitive)\n002 activations (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9934P",
        "description": "PowerG PIR Motion Detector w/camera",
        "sourceSlide": 9,
        "chemistry": "Lithium",
        "batteryModel": "1 pack: 2 x CR123A or\n1 pack: 2 x CR17450",
        "rating": "6V @ 1450mAh (2x CR123A)\n6V @ 2200mAh (2x CR17450)",
        "lowBatteryThreshold": "4.5V",
        "quantity": "2 x Battery",
        "recommendedBrands": "GP / DSC",
        "lifeExpectancy": "4-5 years (2 x CR123A)\n8 years (2xCR17450) / 4 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 20,
    "regularId": "142",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9944",
    "deviceDescription": "Outdoor PIR Security Motion Detector with Camera",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options >\n    3 24h / Night = Y",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "004 Image Brightness:\n01 Image Bright -3\n02 Image Bright -2\n03 Image Bright -1\n04 Image Bright 0 (selected)\n05 Image Bright +1\n06 Image Bright +2\n07 Image Bright +3",
      "005 Image Contrast:\n01 Image Contrast -3\n02 Image Contrast -2\n03 Image Contrast -1\n04 Image Contrast 0 (selected)\n05 Image Contrast +1\n06 Image Contrast +2\n07 Image Contrast +3",
      "007 Detection Sensitivity:\n01 Low Sensitivity\n02 Mid Sensitivity (selected)\n03 High Sensitivity \n04 UL Standard",
      "011 Camera Toggles:\n1 Color = Y\n2 High Resolution = Y\n3 Normal Quality = N\n4 Microphone = N\n9 More Options >\n    1 AC Power = N"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9944",
        "description": "PowerG Outdoor PIR Security Motion Detector w/Camera",
        "sourceSlide": 25,
        "chemistry": "Lithium",
        "batteryModel": "CR17450",
        "rating": "6V (2 x 3V)",
        "lowBatteryThreshold": "4V",
        "quantity": "2 x Battery",
        "recommendedBrands": "Eve Energy Co. / DSC",
        "lifeExpectancy": "min 1 year, typical 3 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 21,
    "regularId": "145",
    "fallbackId": "140",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9934P",
    "deviceDescription": "Indoor PIR Cam Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "004 Image Brightness:\n01 Image Bright -3\n02 Image Bright -2\n03 Image Bright -1\n04 Image Bright 0 (selected)\n05 Image Bright +1\n06 Image Bright +2\n07 Image Bright +3",
      "005 Image Contrast:\n01 Image Contrast -3\n02 Image Contrast -2\n03 Image Contrast -1\n04 Image Contrast 0 (selected)\n05 Image Contrast +1\n06 Image Contrast +2\n07 Image Contrast +3",
      "011 Camera Toggles:\n1 Color = Y\n2 High Resolution = Y\n3 Normal Quality = N\n4 Microphone = N\n9 More Options >\n    1 AC Power = N",
      "016 Event Counter:\n(range 001 - 002 activations)\n(001 more Sensitive, 002 Less Sensitive)\n002 activations (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9934P",
        "description": "PowerG Plus Indoor PIR Cam",
        "sourceSlide": 38,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "6V (2x 3V)",
        "lowBatteryThreshold": "4.5V",
        "quantity": "2 x Battery",
        "recommendedBrands": "GP, Duracell / Panasonic",
        "lifeExpectancy": "5 years / 3 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 22,
    "regularId": "150",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9984P",
    "deviceDescription": "Dual Technology (Mirror Optic & Microwave) PIR Motion Detector",
    "type1": "Zone",
    "type2": "Motion",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n4 Supervision = Y\n9 More Options",
      "003 High Traffic Shutdown:\n01 Not Active (selected)\n02 Yes - No Delay\n03 Yes + 5seconds Delay\n04 Yes + 15seconds Delay\n05 Yes + 30seconds Delay\n06 Yes + 1minute Delay\n07 Yes + 5minute Delay\n08 Yes + 10minute Delay\n09 Yes + 20minute Delay\n10 Yes + 60minute Delay",
      "016 Event Counter:\n(Range = 001 - 002 activations)\n(001 more Sensitive, 002 Less Sensitive)\n002 activations (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9984P",
        "description": "PowerG Dual Technology PIR Motion Detector",
        "sourceSlide": 11,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V @ 1450mAh",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic / Duracell",
        "lifeExpectancy": "min 1 year, typical 5-8 years / 7 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 23,
    "regularId": "160",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9912",
    "deviceDescription": "Glass Break Detector",
    "type1": "Zone",
    "type2": "Glassbreak",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9912",
        "description": "PowerG Glass Break Detector",
        "sourceSlide": 14,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V @ 1450mAh",
        "lowBatteryThreshold": "2.7V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP / Panasonic, Duracell",
        "lifeExpectancy": "4 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 24,
    "regularId": "161",
    "fallbackId": "160",
    "panelVersionRegularId": "1.2+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9922",
    "deviceDescription": "Glass Break Detector (new)",
    "type1": "Zone",
    "type2": "Glassbreak",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9922",
        "description": "PowerG Glass Break Detector",
        "sourceSlide": 26,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V @ 1450mAh",
        "lowBatteryThreshold": "",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Duracell, Panasonic",
        "lifeExpectancy": "min 1year, typical 5years / 4years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 25,
    "regularId": "162",
    "fallbackId": "161",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9922",
    "deviceDescription": "Glass Break Detector",
    "type1": "Zone",
    "type2": "Glassbreak",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9922",
        "description": "PowerG Plus Glass Break Detector",
        "sourceSlide": 39,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.6V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Duracell, Panasonic",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 26,
    "regularId": "170",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9935",
    "deviceDescription": "Shock Detector",
    "type1": "Zone",
    "type2": "Shock",
    "wirelessOptions": [
      "001 Device Toggles:\n1 Alarm LED = Y\n2 Reed Switch = Y\n3 External Input = N\n4 Supervision = Y\n9 More Options\n    1 Shock Accumulation = N",
      "002 Zone EOL:\n00 Disabled\n01 Single EOL (selected)\n02 Normally Open\n03 Normally Closed",
      "018 Shock Sensitivity:\n(Range = 001 - 019 levels)\n(Lower value (01 is lowest) more sensitivity, higher value less sensitivity (19 is highest))\n008 level (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9935",
        "description": "PowerG Shock Detector",
        "sourceSlide": 15,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.6V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic / Duracell",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 27,
    "regularId": "200",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9926",
    "deviceDescription": "Smoke Detector",
    "type1": "Zone",
    "type2": "Smoke",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options\n    6 Fire Alarm = Y"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9926",
        "description": "PowerG Smoke Detector",
        "sourceSlide": 16,
        "chemistry": "Lithium",
        "batteryModel": "CR123A, CR17450",
        "rating": "3V",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic, Duracell",
        "lifeExpectancy": "5 / 8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 28,
    "regularId": "201",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9916",
    "deviceDescription": "Smoke and Heat Detector",
    "type1": "Zone",
    "type2": "Smoke and Heat",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options\n    6 Fire Alarm = Y"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9916",
        "description": "PowerG Smoke and Heat Detector",
        "sourceSlide": 17,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.5V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic, Duracell",
        "lifeExpectancy": "5 / 8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 29,
    "regularId": "202",
    "fallbackId": "201",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9936",
    "deviceDescription": "Smoke and Heat Detector (Apollo)",
    "type1": "Zone",
    "type2": "Smoke and Heat",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options\n    6 Fire Alarm = Y"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9936",
        "description": "PowerG Smoke and Heat Detector",
        "sourceSlide": 30,
        "chemistry": "Alkaline",
        "batteryModel": "AAA",
        "rating": "4.5V (3x1.5V)",
        "lowBatteryThreshold": "",
        "quantity": "3 x Battery",
        "recommendedBrands": "Energizer E92, Duracell Procell PC2400",
        "lifeExpectancy": "3 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 30,
    "regularId": "205",
    "fallbackId": "202",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9976",
    "deviceDescription": "Smoke and Heat Detector",
    "type1": "Zone",
    "type2": "Smoke and Heat",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options\n    6 Fire Alarm = Y"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9976",
        "description": "PowerG Plus Smoke/ Heat Detector",
        "sourceSlide": 45,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "6V (2 x 3V)",
        "lowBatteryThreshold": "",
        "quantity": "2 x Battery",
        "recommendedBrands": "Panasonic / GP, Duracell",
        "lifeExpectancy": "1 year/ 6 years/ 5-10 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 31,
    "regularId": "206",
    "fallbackId": "202",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9979",
    "deviceDescription": "Heat Detector",
    "type1": "Zone",
    "type2": "Heat",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options\n    6 Fire Alarm = Y"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9979",
        "description": "PowerG Plus Heat Detector",
        "sourceSlide": 46,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "6V (2 x 3V)",
        "lowBatteryThreshold": "",
        "quantity": "2 x Battery",
        "recommendedBrands": "Panasonic / GP, Duracell",
        "lifeExpectancy": "1 year/ 6 years/ 5-10 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 32,
    "regularId": "220",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9913",
    "deviceDescription": "CO Detector",
    "type1": "Zone",
    "type2": "CO",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9913",
        "description": "PowerG CO Detector",
        "sourceSlide": 18,
        "chemistry": "Alkaline",
        "batteryModel": "Energizer 522",
        "rating": "9V",
        "lowBatteryThreshold": "7.8V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Energizer / Duracell MN1604",
        "lifeExpectancy": "1 year",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 33,
    "regularId": "221",
    "fallbackId": "220",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9933",
    "deviceDescription": "CO Detector (Apollo)",
    "type1": "Zone",
    "type2": "CO",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9933",
        "description": "PowerG Carbon Monoxide (CO) Detector",
        "sourceSlide": 31,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.85V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Panasonic / Duracell, GP",
        "lifeExpectancy": "Min 1 year / 5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 34,
    "regularId": "241",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9985",
    "deviceDescription": "Flood Detector",
    "type1": "Zone",
    "type2": "Flood",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9985",
        "description": "PowerG Flood Detector",
        "sourceSlide": 24,
        "chemistry": "Lithium",
        "batteryModel": "CR123",
        "rating": "3V",
        "lowBatteryThreshold": "2.2V",
        "quantity": "1 x Battery",
        "recommendedBrands": "GP, Panasonic / Duracell",
        "lifeExpectancy": "8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 47,
    "regularId": "242",
    "fallbackId": "240",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9986",
    "deviceDescription": "Water Tile with Freeze Detection",
    "type1": "Zone",
    "type2": "Flood",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9986",
        "description": "PowerG Plus Water Tile with Freeze Detection",
        "sourceSlide": 44,
        "chemistry": "Lithium",
        "batteryModel": "CR2450",
        "rating": "6V (2 x 3V)",
        "lowBatteryThreshold": "4.3V",
        "quantity": "2 x Battery",
        "recommendedBrands": "GP, Duracell, Panasonic",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 35,
    "regularId": "250",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9905",
    "deviceDescription": "Temperature Detector",
    "type1": "Zone",
    "type2": "Temperature",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options",
      "019 High Temperature Warning:\n(Range= -040+85 Celsius)\n(Range= -040+185 Farenheit)\n(press * to toggle between +/-)\n+999 (default)",
      "020 High Temperature Alarm:\n(Range= -040+85 Celsius)\n(Range= -040+185 Farenheit)\n(press * to toggle between +/-)\n+999 (default)",
      "021 Low Temperature Warning:\n(Range= -040+85 Celsius)\n(Range= -040+185 Farenheit)\n(press * to toggle between +/-)\n+999 (default)",
      "022 Low Temperature Alarm:\n(Range= -040+85 Celsius)\n(Range= -040+185 Farenheit)\n(press * to toggle between +/-)\n+999 (default)"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9905",
        "description": "PowerG Temperature Detector",
        "sourceSlide": 21,
        "chemistry": "Lithium",
        "batteryModel": "CR123A",
        "rating": "3V",
        "lowBatteryThreshold": "2.2V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Panasonic, Sanyo, GP / Duracell",
        "lifeExpectancy": "7 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 36,
    "regularId": "300",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9939",
    "deviceDescription": "4-Button Key (Oval)",
    "type1": "Key",
    "type2": "",
    "wirelessOptions": [
      "000 Partition Assginment:\n01 Partition 01 (selected)\n02 Partition 02\n03 Partition 03\n04 Partition 04\n05 Partition 05\n06 Partition 06\n07 Partition 07\n08 Partition 08",
      "001 Button 1:\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm\n04 away Arm (selected)\n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "002 Button 2:\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm (selected)\n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "003 Button 3:\n00 Null Key\n01 Disarm (selected)\n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "004 Button 4:\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm (selected)",
      "005 Button 5:\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1 (selected)\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "011 Device Toggles:",
      "020 User Number\nXXXX Digits"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9939",
        "description": "PowerG 4-Button Key",
        "sourceSlide": 4,
        "chemistry": "Lithium",
        "batteryModel": "CR2032",
        "rating": "3V",
        "lowBatteryThreshold": "2.2V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Varta, Energizer / Panasonic",
        "lifeExpectancy": "5 / 8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 37,
    "regularId": "301",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9929",
    "deviceDescription": "4-Button Key (Rectangular)",
    "type1": "Key",
    "type2": "",
    "wirelessOptions": [
      "000 Partition Assginment:\n01 Partition 01 (selected)\n02 Partition 02\n03 Partition 03\n04 Partition 04\n05 Partition 05\n06 Partition 06\n07 Partition 07\n08 Partition 08",
      "001 Button 1:\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm\n04 away Arm (selected)\n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "002 Button 2:\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm (selected)\n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "003 Button 3:\n00 Null Key\n01 Disarm (selected)\n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "004 Button 4:\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm (selected)",
      "005 Button 5:\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1 (selected)\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "011 Device Toggles:",
      "020 User Number\nXXXX Digits"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9929",
        "description": "PowerG 4-Button Key",
        "sourceSlide": 5,
        "chemistry": "Lithium",
        "batteryModel": "CR2032",
        "rating": "3V",
        "lowBatteryThreshold": "2.1V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Varta, Energizer / Panasonic",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 38,
    "regularId": "305",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9929",
    "deviceDescription": "4-Button Key (Rectangular)",
    "type1": "Key",
    "type2": "",
    "wirelessOptions": [
      "000 Partition Assginment:\n01 Partition 01 (selected)\n02 Partition 02\n03 Partition 03\n04 Partition 04\n05 Partition 05\n06 Partition 06\n07 Partition 07\n08 Partition 08",
      "001 Button 1:\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm\n04 away Arm (selected)\n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "002 Button 2:\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm (selected)\n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "003 Button 3:\n00 Null Key\n01 Disarm (selected)\n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "004 Button 4:\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm (selected)",
      "005 Button 5:\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1 (selected)\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "011 Device Toggles:",
      "020 User Number\nXXXX Digits"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9929",
        "description": "PowerG 4-Button Key",
        "sourceSlide": 5,
        "chemistry": "Lithium",
        "batteryModel": "CR2032",
        "rating": "3V",
        "lowBatteryThreshold": "2.1V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Varta, Energizer / Panasonic",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 39,
    "regularId": "306",
    "fallbackId": "",
    "panelVersionRegularId": "1.13+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9929",
    "deviceDescription": "4-Button Key (Rectangular)",
    "type1": "Key",
    "type2": "",
    "wirelessOptions": [
      "000 Partition Assginment:\n01 Partition 01 (selected)\n02 Partition 02\n03 Partition 03\n04 Partition 04\n05 Partition 05\n06 Partition 06\n07 Partition 07\n08 Partition 08",
      "001 Button 1:\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm\n04 away Arm (selected)\n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "002 Button 2:\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm (selected)\n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "003 Button 3:\n00 Null Key\n01 Disarm (selected)\n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "004 Button 4:\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm (selected)",
      "005 Button 5:\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1 (selected)\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "011 Device Toggles:",
      "020 User Number\nXXXX Digits"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9929",
        "description": "PowerG 4-Button Key",
        "sourceSlide": 5,
        "chemistry": "Lithium",
        "batteryModel": "CR2032",
        "rating": "3V",
        "lowBatteryThreshold": "2.1V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Varta, Energizer / Panasonic",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 40,
    "regularId": "320",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9938",
    "deviceDescription": "Panic Key (Single Button)",
    "type1": "Zone",
    "type2": "",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9938",
        "description": "PowerG Panic Key",
        "sourceSlide": 2,
        "chemistry": "Lithium",
        "batteryModel": "CR2032",
        "rating": "3V",
        "lowBatteryThreshold": "2.05V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Varta, Energizer / Panasonic",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 41,
    "regularId": "322",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9949",
    "deviceDescription": "2-Button Panic Key",
    "type1": "Key",
    "type2": "",
    "wirelessOptions": [
      "000 Partition Assginment:\n01 Partition 01 (selected)\n02 Partition 02\n03 Partition 03\n04 Partition 04\n05 Partition 05\n06 Partition 06\n07 Partition 07\n08 Partition 08",
      "001 Button 1 (Arm icon):\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm\n04 away Arm (selected)\n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "002 Button 2 (Not Used):\n00 Null Key\n01 Disarm\n02 Instant Stay Arm\n03 Stay Arm (selected)\n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "003 Button 3 (Disarm icon):\n00 Null Key\n01 Disarm (selected)\n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "004 Button 4 (Both Buttons):\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm (selected)",
      "005 Button 5 (Not Used):\n00 Null Key\n01 Disarm \n02 Instant Stay Arm\n03 Stay Arm \n04 away Arm \n05 No Entry Arm\n06 Chime ON/OFF\n07 System Test\n09 Night Arm\n12 Global Stay Arm\n13 Global Away Arm\n14 Global Disarming\n16 Quick Exit\n17 Arm Interior\n21 Command Output 1 (selected)\n22 Command Output 2\n23 Command Output 3\n24 Command Output 4\n29 Bypass Group Recall\n33 Bypass Recall\n51 [M] Key Alarm\n52 [P] Key Alarm",
      "011 Device Toggles:\n1 Supervision = N",
      "020 User Number\nXXXX Digits"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9949",
        "description": "PowerG 2-Button Key",
        "sourceSlide": 3,
        "chemistry": "Lithium",
        "batteryModel": "CR2032",
        "rating": "3V",
        "lowBatteryThreshold": "2.05V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Varta, Energizer / Panasonic",
        "lifeExpectancy": "5 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 42,
    "regularId": "378",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "HS2LCDWF",
    "deviceDescription": "2-Way Wire-Free Keypad",
    "type1": "Keypad",
    "type2": "",
    "wirelessOptions": [
      "Follows corresponding keypad section"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming"
  },
  {
    "sourceRow": 43,
    "regularId": "400",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9901",
    "deviceDescription": "Indoor Siren",
    "type1": "Siren",
    "type2": "",
    "wirelessOptions": [
      "000 Partition Assginment:\n1 Partition 1 = Y\n2 Partition 2 = Y\n3 Partition 3 = Y\n4 Partition 4 = Y\n5 Partition 5 = Y\n6 Partition 6 = Y\n7 Partition 7 = Y\n8 Partition 8 = Y",
      "001 Device Toggles:\n1 Fire Alarm = Y\n2 CO Alarm = Y\n3 Burglary Alarm = Y\n4 Flood Alarm = Y\n6 Auto Tamper Alarm = N\n9 More Options:\n    1 AC Power = N \n    2 Buzzer = N\n    3 Door Chime = N\n    4 Trouble Beep = N",
      "002 Strobe Alarm:\n01 Disabled\n02 Timer Limited (selected)\n03 Until Disarmed",
      "003 Exit Entry Beeps:\n01 Disabled (selected)\n02 Enabled\n03 Disabled Stay",
      "004 Squawk:\n01 Disabled\n02 Sounder Only (selected)\n03 Strobe Only\n04 Sounder + Strobe",
      "005 Sounder Volume:\n01 Low\n02 Medium (selected)\n03 High"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9901",
        "description": "PowerG Indoor Siren",
        "sourceSlide": 19,
        "chemistry": "Lithium",
        "batteryModel": "BATT 13.0-3.6v- 1 x customized D type battery",
        "rating": "3.6V @3.5Ah",
        "lowBatteryThreshold": "2V +300 mV negative slope (1.7) OR 1.2V",
        "quantity": "1 x Battery",
        "recommendedBrands": "DSC",
        "lifeExpectancy": "8 years",
        "notes": []
      },
      {
        "modelLabel": "PG9901 BATT",
        "description": "PowerG Indoor Siren",
        "sourceSlide": 20,
        "chemistry": "Lithium",
        "batteryModel": "1 Pack = 2 x (EVE ER18505M)",
        "rating": "3.6V @3.5Ah",
        "lowBatteryThreshold": "2V +300 mV negative slope (1.7) OR 1.2V",
        "quantity": "2 packs (4 Batteries)",
        "recommendedBrands": "DSC",
        "lifeExpectancy": "8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 44,
    "regularId": "410",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9911",
    "deviceDescription": "Outdoor Siren",
    "type1": "Siren",
    "type2": "",
    "wirelessOptions": [
      "000 Partition Assginment:\n1 Partition 1 = Y\n2 Partition 2 = Y\n3 Partition 3 = Y\n4 Partition 4 = Y\n5 Partition 5 = Y\n6 Partition 6 = Y\n7 Partition 7 = Y\n8 Partition 8 = Y",
      "001 Device Toggles:\n1 Fire Alarm = Y\n2 CO Alarm = Y\n3 Burglary Alarm = Y\n4 Flood Alarm = Y\n6 Auto Tamper Alarm = N\n7 Activity LED = N\n9 More Options:\n    1 AC Power = N \n    2 Buzzer = N\n    3 Door Chime = N\n    4 Trouble Beep = N",
      "002 Strobe Alarm:\n01 Disabled\n02 Timer Limited (selected)\n03 Until Disarmed",
      "003 Exit Entry Beeps:\n01 Disabled (selected)\n02 Enabled\n03 Disabled Stay",
      "004 Squawk:\n01 Disabled\n02 Sounder Only (selected)\n03 Strobe Only\n04 Sounder + Strobe",
      "005 Sounder Volume:\n01 Low\n02 Medium (selected)\n03 High"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9911 BATT",
        "description": "PowerG Outdoor Siren",
        "sourceSlide": 23,
        "chemistry": "Lithium",
        "batteryModel": "1 Pack = 2 x (EVE or FANSO ER18505M)",
        "rating": "3.6V @3.5Ah",
        "lowBatteryThreshold": "2V +300 mV negative slope (1.7) OR 1.2V",
        "quantity": "2 packs",
        "recommendedBrands": "DSC",
        "lifeExpectancy": "8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 45,
    "regularId": "430",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9920",
    "deviceDescription": "Wireless Repeater",
    "type1": "Repeater",
    "type2": "",
    "wirelessOptions": [],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9920",
        "description": "PowerG Repeater",
        "sourceSlide": 1,
        "chemistry": "NiMH",
        "batteryModel": "Batt 1.3 - 4.8v rechargeable",
        "rating": "4.8V @ 1300mAh",
        "lowBatteryThreshold": "4.8V",
        "quantity": "1 x Battery",
        "recommendedBrands": "DSC",
        "lifeExpectancy": "48 hours",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": 46,
    "regularId": "431",
    "fallbackId": "430",
    "panelVersionRegularId": "",
    "panelVersionFallbackId": "1.34+",
    "hostVersion": "1.31+",
    "pgpHostVersion": "2.1+",
    "rfKeypad": "1.51+",
    "wirelessTechnology": "PowerG Plus",
    "deviceModel": "PGP9920",
    "deviceDescription": "Wireless Repeater",
    "type1": "Repeater",
    "type2": "",
    "wirelessOptions": [],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PGP9920",
        "description": "PowerG Plus Repeater",
        "sourceSlide": 42,
        "chemistry": "Li-ion",
        "batteryModel": "ICR18650",
        "rating": "3.6V",
        "lowBatteryThreshold": "3.6V",
        "quantity": "1 x Battery",
        "recommendedBrands": "Q-LITE",
        "lifeExpectancy": "48 hours",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": null,
    "regularId": "410",
    "fallbackId": "",
    "panelVersionRegularId": "1.1+",
    "panelVersionFallbackId": "",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9911B",
    "deviceDescription": "Outdoor Siren",
    "type1": "Siren",
    "type2": "",
    "wirelessOptions": [
      "000 Partition Assginment:\n1 Partition 1 = Y\n2 Partition 2 = Y\n3 Partition 3 = Y\n4 Partition 4 = Y\n5 Partition 5 = Y\n6 Partition 6 = Y\n7 Partition 7 = Y\n8 Partition 8 = Y",
      "001 Device Toggles:\n1 Fire Alarm = Y\n2 CO Alarm = Y\n3 Burglary Alarm = Y\n4 Flood Alarm = Y\n6 Auto Tamper Alarm = N\n7 Activity LED = N\n9 More Options:\n    1 AC Power = N \n    2 Buzzer = N\n    3 Door Chime = N\n    4 Trouble Beep = N",
      "002 Strobe Alarm:\n01 Disabled\n02 Timer Limited (selected)\n03 Until Disarmed",
      "003 Exit Entry Beeps:\n01 Disabled (selected)\n02 Enabled\n03 Disabled Stay",
      "004 Squawk:\n01 Disabled\n02 Sounder Only (selected)\n03 Strobe Only\n04 Sounder + Strobe",
      "005 Sounder Volume:\n01 Low\n02 Medium (selected)\n03 High"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9911B",
        "description": "PowerG Outdoor Siren",
        "sourceSlide": 22,
        "chemistry": "Lithium",
        "batteryModel": "BATT 13.0-3.6v- 1 x customized D type battery",
        "rating": "3.6V @3.5Ah",
        "lowBatteryThreshold": "2V +300 mV negative slope (1.7) OR 1.2V",
        "quantity": "1 x Battery",
        "recommendedBrands": "DSC",
        "lifeExpectancy": "8 years",
        "notes": []
      }
    ]
  },
  {
    "sourceRow": null,
    "regularId": "202",
    "fallbackId": "201",
    "panelVersionRegularId": "1.35+",
    "panelVersionFallbackId": "1.14+",
    "hostVersion": "",
    "pgpHostVersion": "",
    "rfKeypad": "",
    "wirelessTechnology": "PowerG",
    "deviceModel": "PG9936H",
    "deviceDescription": "Heat Detector",
    "type1": "Zone",
    "type2": "Heat",
    "wirelessOptions": [
      "001 Device Toggles:\n4 Supervision = Y\n9 More Options\n    6 Fire Alarm = Y"
    ],
    "installerProgrammingSection": "[804]",
    "programmingSectionId": "neo-installer-804-wireless-programming",
    "batterySpecifications": [
      {
        "modelLabel": "PG9936H",
        "description": "PowerG Heat Detector",
        "sourceSlide": 37,
        "chemistry": "Alkaline",
        "batteryModel": "AAA",
        "rating": "4.5V (3x1.5V)",
        "lowBatteryThreshold": "",
        "quantity": "3 x Battery",
        "recommendedBrands": "Energizer E92, Duracell Procell PC2400",
        "lifeExpectancy": "3 years",
        "notes": []
      }
    ]
  }
];

function clone(value){return JSON.parse(JSON.stringify(value));}
function pushIndex(index,key,device){
  key=String(key||'').trim();
  if(!key) return;
  if(!index[key]) index[key]=[];
  index[key].push(device);
}
var byModel={},byRegularId={},byFallbackId={},byTechnology={},byType={},bySubtype={};
devices.forEach(function(device){
  pushIndex(byModel,String(device.deviceModel||'').trim().toUpperCase(),device);
  pushIndex(byRegularId,device.regularId,device);
  pushIndex(byFallbackId,device.fallbackId,device);
  pushIndex(byTechnology,device.wirelessTechnology,device);
  pushIndex(byType,device.type1,device);
  pushIndex(bySubtype,device.type2,device);
});

var relationships={
  schemaVersion:'1.0.0',
  installerProgrammingSection:'[804]',
  programmingSectionId:'neo-installer-804-wireless-programming',
  byModel:byModel,
  byRegularId:byRegularId,
  byFallbackId:byFallbackId,
  byTechnology:byTechnology,
  byType:byType,
  bySubtype:bySubtype
};

var reference={
  id:'neo-wireless-tools',
  eyebrow:'PowerSeries NEO · Tools',
  title:'Wireless Tools',
  subtitle:'Search, filter, group, and inspect PowerSeries NEO wireless devices, enrollment IDs, compatibility, battery specifications, and device programming options.',
  kind:'neo-wireless-tools',
  source:'User-provided Wireless Sensors Options workbook and PowerG Devices presentation (46 slides)',
  deviceCount:devices.filter(function(device){return !device.batteryReferenceOnly;}).length,
  referenceCount:devices.length,
  batteryReferenceOnlyCount:devices.filter(function(device){return !!device.batteryReferenceOnly;}).length,
  installerProgrammingSection:'[804]',
  programmingSectionId:'neo-installer-804-wireless-programming',
  relationships:relationships
};

window.DSC_NEO_WIRELESS_TOOLS={
  schemaVersion:'1.0.0',
  sourceWorkbook:'Wiereless Sensors Options (3)(2).xlsx',
  batterySourcePresentation:'PowerG Devices(1).pptx',
  reference:reference,
  devices:devices,
  relationships:relationships,
  getByModel:function(model){return clone(byModel[String(model||'').trim().toUpperCase()]||[]);},
  getByRegularId:function(id){return clone(byRegularId[String(id||'').trim().padStart(3,'0')]||[]);},
  getByFallbackId:function(id){return clone(byFallbackId[String(id||'').trim().padStart(3,'0')]||[]);},
  getByEnrollmentId:function(id){
    id=String(id||'').trim().padStart(3,'0');
    var result=(byRegularId[id]||[]).concat(byFallbackId[id]||[]);
    var seen={};
    return clone(result.filter(function(device){var key=String(device.regularId||'')+'|'+String(device.deviceModel||'');if(seen[key])return false;seen[key]=true;return true;}));
  }
};

if(window.DSC_NEO_INTERNAL_RELATIONSHIPS){
  window.DSC_NEO_INTERNAL_RELATIONSHIPS.wirelessDevices=relationships;
}
})();
