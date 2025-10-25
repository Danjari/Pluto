// apps/web/lib/iso8601.ts
// Parse ISO 8601 dur strings like "PT1H2M30S" to seconds
export function parseISODurationToSeconds(iso: string): number {
  // Supports days, hours, minutes, seconds (YouTube usually H/M/S)
  const m = iso.match(
    /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i
  );
  if (!m) return 0;
  const [, d, h, min, s] = m.map((x) => (x ? parseInt(x, 10) : 0));
  return (d || 0) * 86400 + (h || 0) * 3600 + (min || 0) * 60 + (s || 0);
}
