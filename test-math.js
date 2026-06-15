const IW = 1000;
const IH = 2000;
const CW = 160;
const CH = 90;

// crop box in pixels (16:9)
const cropW = 1000;
const cropH = 562.5;

// croppedAreaPercentages
const cw_percent = (cropW / IW) * 100;
const ch_percent = (cropH / IH) * 100;

// getCoverStyle
const cssW = (100 / cw_percent) * 100;
const cssH = (100 / ch_percent) * 100;

const imgW = (cssW / 100) * CW;
const imgH = (cssH / 100) * CH;

console.log("Image Rendered AR:", imgW / imgH);
console.log("Original Image AR:", IW / IH);
