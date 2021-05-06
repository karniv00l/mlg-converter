# Binary MLG (MLVLG) log files converter

![npm](https://img.shields.io/npm/v/mlg-converter)
[![Maintainability](https://api.codeclimate.com/v1/badges/b778eac2cf95b273680b/maintainability)](https://codeclimate.com/github/karniv00l/mlg-converter/maintainability)
[![Minimum Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)](https://nodejs.org/)
![License](https://img.shields.io/github/license/karniv00l/mlg-converter)

Simple tool for parsing and converting `EFI Analytics (TunerStudio, MegaLogViewer)` binary log files (`.mlg`) to a human readable formats like:

- `.csv` - semicolon (`;`) separated (`Virtual Dyno`, spreadsheets, etc.)
- `.json` - JSON raw data
- `.msl` - ASCII format (`TunerStudio`, `MegaLogViewer`)

Or just can be used as a Node library producing JS `plain object`.

## Caveats

- `MLVLG` also carries data type called `Marker`s (graphical marks used for indicating specific events). They **will be stripped** in `.csv` files.
- Provided binaries are pretty heavy (~70MB), so you are better off using Node.js if it's available (**minimum** Node version: `11.x`).

## Using provided binaries (Linux, MacOS, Windows)

Binaries can be found on the [releases page](https://github.com/karniv00l/mlg-converter/releases).

```bash
# single file, multiple formats
mlgconv --format=csv,msl,json log1.mlg

# single format, multiple files
mlgconv --format=msl log1.mlg log2.mlg log3.mlg

# using Node.js
node mlgconv.js --format=csv,msl,json log1.mlg
```

## Using Docker 🐳

```bash
docker run --rm -v $(pwd):/app -w /app node:lts-alpine mlgconv.js --format=csv log1.mlg
```

## Using parser as a `npm` package

```bash
npm install --save mlg-converter
```

```js
const fs = require('fs');
const { Parser } = require('mlg-converter');

const b = fs.readFileSync('./test/data/short.mlg');
const arrayBuffer = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const result = new Parser(arrayBuffer)
  .parse((percent) => console.log(percent));

console.dir(result, { maxArrayLength: 1 }); // =>

{
  fileFormat: 'MLVLG',
  formatVersion: 1,
  timestamp: 2020-12-28T12:30:43.000Z,
  info: 'speeduino 202009-dev: Speeduino 2020.09-dev\n' +
    'Capture Date: Mon Dec 28 13:30:43 CET 2020',
  bitFieldNames: "",
  fields: [
    {
      name: 'Time',
      units: 's',
      displayStyle: 'Float',
      scale: 1,
      transform: 0,
      digits: 3
    },
    ... 68 more items
  ],
  records: [
    {
      type: 'field',
      timestamp: 15081,
      Time: 0,
      SecL: 8,
      RPM: 0,
      MAP: 10,
      MAPxRPM: 0,
      TPS: 0,
      AFR: 110,
      Lambda: 0.7482993006706238,
      IAT: 54,
      CLT: 68,
      Engine: 0,
      DFCO: 0,
      Gego: 100,
      Gair: 0,
      Gbattery: 100,
      Gwarm: 0,
      Gbaro: 0,
      Gammae: 0,
      'Accel Enrich': 0,
      'Current VE': 70,
      VE1: 70,
      VE2: 0,
      PW: 0,
      'AFR Target': 0,
      'Lambda Target': 0,
      PW2: 0,
      DutyCycle1: 0,
      DutyCycle2: 0,
      'TPS DOT': 0,
      Advance: 24,
      Dwell: 0,
      'Battery V': 71,
      'rpm/s': 0,
      'Boost PSI': -13.198457717895508,
      'Boost Target': 0,
      'Boost Duty': 0,
      'Boost cut': 0,
      'Hard Launch': 0,
      'Hard Limiter': 0,
      'Idle Control': 1,
      'IAC value': 34,
      'Idle Target RPM': 85,
      'Idle RPM Delta': 850,
      'Baro Pressure': 101,
      'Sync Loss #': 0,
      VSS_RAW: 0,
      Clutch_RAW: 1,
      Aux2: 0,
      Aux3: 0,
      Aux4: 0,
      Aux5: 0,
      Aux6: 0,
      Aux7: 0,
      Aux8: 0,
      Aux9: 0,
      Aux10: 0,
      Aux11: 0,
      Aux12: 0,
      Aux13: 0,
      Aux14: 0,
      Aux15: 0,
      'Advance 1': 24,
      'Advance 2': 0,
      'Trip Meter Miles': 0,
      'Odometer Miles': 11.340239524841309,
      'Vehicle Speed': 0,
      Power: 0,
      Torque: 0,
      Odometer_Miles: 11.340239524841309
    },
    ... 51 more items
  ]
}
```

## Developing

```bash
npm install
npm run build
npm test
```

Building binaries

```bash
pkg mlgconv.js --out-path ./build
```
