function getCoverStyle(url) {
  if (!url) return { objectFit: "cover" };

  const parts = url.split("?");
  const query = parts[1];
  const params = new URLSearchParams(query || "");

  if (params.has("cw")) {
    const cx = parseFloat(params.get("cx") || "0");
    const cy = parseFloat(params.get("cy") || "0");
    const cw = parseFloat(params.get("cw") || "100");
    const ch = parseFloat(params.get("ch") || "100");

    return {
      position: "absolute",
      left: `${-(cx / cw) * 100}%`,
      top: `${-(cy / ch) * 100}%`,
      width: `${(100 / cw) * 100}%`,
      height: `${(100 / ch) * 100}%`,
      objectFit: "fill",
      maxWidth: "none",
      maxHeight: "none",
    };
  }

  // Legacy fallback
  const zoom = parseFloat(params.get("zoom") || "1");
  const tx = parseFloat(params.get("tx") || "0");
  const ty = parseFloat(params.get("ty") || "0");
  const posX = parseFloat(params.get("posX") || "50");
  const posY = parseFloat(params.get("posY") || "50");

  if (params.has("tx")) {
    return {
      objectFit: "cover",
      transform: `scale(${zoom}) translate(${tx}%, ${ty}%)`,
    };
  }

  return {
    objectFit: "cover",
    objectPosition: `${posX}% ${posY}%`,
    transform: `scale(${zoom})`,
  };
}

console.log(getCoverStyle("http://example.com/image.jpg?cx=50&cy=50&cw=50&ch=50"));
