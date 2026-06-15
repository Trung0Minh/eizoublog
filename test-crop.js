/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const dts = fs.readFileSync('node_modules/react-easy-crop/index.d.ts', 'utf8');
console.log(dts.split('onCropComplete')[1].substring(0, 200));
