type CoverViewport = "desktop" | "mobile"

export function getCoverStyle(
  url: string | null | undefined,
  viewport: CoverViewport = "desktop",
): React.CSSProperties {
  if (!url) return { objectFit: "cover" };

  const [, query] = url.split("?");
  const params = new URLSearchParams(query || "");
  const prefix = viewport === "mobile" && params.has("mcw") ? "m" : ""

  if (params.has(`${prefix}cw`)) {
    const cx = parseFloat(params.get(`${prefix}cx`) || "0");
    const cy = parseFloat(params.get(`${prefix}cy`) || "0");
    const cw = parseFloat(params.get(`${prefix}cw`) || "100");
    const ch = parseFloat(params.get(`${prefix}ch`) || "100");

    return {
      position: "absolute",
      top: 0,
      left: 0,
      width: `${(100 / cw) * 100}%`,
      height: `${(100 / ch) * 100}%`,
      transform: `translate(-${cx}%, -${cy}%)`,
      transformOrigin: "top left",
      objectFit: "cover",
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
