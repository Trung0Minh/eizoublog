type CoverViewport = "desktop" | "mobile"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatPercent(value: number) {
  return `${Number(value.toFixed(4))}%`
}

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

export function getCoverObjectPositionStyle(
  url: string | null | undefined,
): React.CSSProperties {
  if (!url) return { objectFit: "cover" }

  const [, query] = url.split("?")
  const params = new URLSearchParams(query || "")

  if (params.has("cw")) {
    const cx = parseFloat(params.get("cx") || "0")
    const cy = parseFloat(params.get("cy") || "0")
    const cw = parseFloat(params.get("cw") || "100")
    const ch = parseFloat(params.get("ch") || "100")

    if (
      [cx, cy, cw, ch].every(Number.isFinite) &&
      cw > 0 &&
      cw <= 100 &&
      ch > 0 &&
      ch <= 100
    ) {
      const x = cw === 100 ? 50 : clamp((cx / (100 - cw)) * 100, 0, 100)
      const y = ch === 100 ? 50 : clamp((cy / (100 - ch)) * 100, 0, 100)

      return {
        objectFit: "cover",
        objectPosition: `${formatPercent(x)} ${formatPercent(y)}`,
      }
    }
  }

  const zoom = parseFloat(params.get("zoom") || "1")
  if (params.has("tx") || zoom !== 1) return getCoverStyle(url)

  const posX = parseFloat(params.get("posX") || "50")
  const posY = parseFloat(params.get("posY") || "50")

  return {
    objectFit: "cover",
    objectPosition: `${posX}% ${posY}%`,
  }
}
