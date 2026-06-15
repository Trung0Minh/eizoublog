const cx = 25;
const cy = 25;
const cw = 50;
const ch = 50;

console.log({
      position: "absolute",
      left: `${-(cx / cw) * 100}%`,
      top: `${-(cy / ch) * 100}%`,
      width: `${(100 / cw) * 100}%`,
      height: `${(100 / ch) * 100}%`,
      objectFit: "fill",
      maxWidth: "none",
      maxHeight: "none",
});
