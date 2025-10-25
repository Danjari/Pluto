// apps/web/lib/config.ts
const raw = process.env.YOUTUBE_API_KEYS || "";
const pool = raw.split(",").map((s) => s.trim()).filter(Boolean);

if (pool.length === 0) {
  console.warn(
    "[YouTube] No YOUTUBE_API_KEYS provided. Set at least one key in .env"
  );
}

let rr = 0;
export function nextYouTubeKey(): string | undefined {
  if (pool.length === 0) return undefined;
  const k = pool[rr % pool.length];
  rr++;
  return k;
}

export function requireYouTubeKey(): string {
  const k = nextYouTubeKey();
  if (!k) {
    throw new Error(
      "Missing YOUTUBE_API_KEYS in environment. Add to apps/web/.env"
    );
  }
  return k;
}
