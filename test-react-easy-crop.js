const { getInitialCropFromCroppedAreaPercentages } = require('react-easy-crop/helpers');
console.log(getInitialCropFromCroppedAreaPercentages({x: 50, y: 50, width: 50, height: 50}, {width: 1000, height: 1000}, 0, {width: 500, height: 500}, 1, 3));
