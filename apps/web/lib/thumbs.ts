// Build a thumbnail URL for YouTube IDs, with graceful fallback
export function youtubeThumbFromId(id: string, quality: "hq" | "mq" | "sd" = "hq") {
  // common qualities: hqdefault.jpg (480x360), mqdefault.jpg (320x180), sddefault.jpg (640x480)
  const q = quality === "hq" ? "hqdefault" : quality === "mq" ? "mqdefault" : "sddefault";
  return `https://i.ytimg.com/vi/${sanitizeId(id)}/${q}.jpg`;
}

function sanitizeId(id: string) {
  // if your demo IDs have suffixes like "abc_1", trim after the first underscore
  const idx = id.indexOf("_");
  return idx > 0 ? id.slice(0, idx) : id;
}

export function pickThumb(youtubeId: string, provided?: string | null) {
  return provided || youtubeThumbFromId(youtubeId, "hq");
}
