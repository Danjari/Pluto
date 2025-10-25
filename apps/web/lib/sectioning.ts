// apps/web/lib/sectioning.ts
export type RawVideo = {
  youtubeId: string;
  title: string;
  description?: string;
  durationS: number;
  thumbnailUrl?: string;
  position: number; // playlist order (0-based)
};

export type Section = {
  title: string;
  orderIndex: number;
  videos: RawVideo[];
};

const STOP = new Set([
  "the","a","an","for","and","of","part","lesson","chapter","introduction","intro"
]);

function tokens(t: string): string[] {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\s#]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((x) => !STOP.has(x));
}

function commonPrefixScore(a: string, b: string) {
  const ta = tokens(a);
  const tb = tokens(b);
  const n = Math.min(ta.length, tb.length);
  let i = 0;
  while (i < n && ta[i] === tb[i]) i++;
  return i; // number of identical starting tokens
}

function numericSeries(a: string, b: string) {
  // Detect "Part N" style or trailing #N increments
  const pa = a.match(/(?:part|lesson|#)\s*(\d+)$/i);
  const pb = b.match(/(?:part|lesson|#)\s*(\d+)$/i);
  if (!pa || !pb) return false;
  const na = parseInt(pa[1], 10);
  const nb = parseInt(pb[1], 10);
  return nb === na + 1;
}

export function autoSection(videos: RawVideo[]): Section[] {
  const WINDOW_MIN = 2;
  const WINDOW_MAX = 4;
  const LONG_BREAK_S = 30 * 60;
  const TITLE_PREFIX_MIN = 3;

  const n = videos.length;
  if (!n) return [];

  // Hard boundary flags near long videos
  const boundaries = new Set<number>(); // indices where a new section starts
  boundaries.add(0);
  for (let i = 1; i < n; i++) {
    const prevLong = videos[i - 1].durationS >= LONG_BREAK_S;
    const currLong = videos[i].durationS >= LONG_BREAK_S;
    if (prevLong || currLong) boundaries.add(i);
  }

  const sections: Section[] = [];
  let i = 0;
  let k = 0;
  while (i < n) {
    // If a hard boundary exists here, we start new section anyway.
    let j = i;
    const bestEnd = Math.min(i + WINDOW_MAX - 1, n - 1);
    while (j <= bestEnd) {
      if (j > i) {
        const sPrefix = commonPrefixScore(videos[j - 1].title, videos[j].title);
        const sNumeric = numericSeries(videos[j - 1].title, videos[j].title) ? 2 : 0;
        if (sPrefix === 0 && sNumeric === 0 && !boundaries.has(j)) break;
      }
      j++;
    }
    // ensure at least MIN
    if (j - i < WINDOW_MIN && i + WINDOW_MIN - 1 < n) {
      j = i + WINDOW_MIN;
    }

    const group = videos.slice(i, j);
    const inferred = inferTitle(group, TITLE_PREFIX_MIN);
    sections.push({ title: inferred ?? `Section ${++k}`, orderIndex: k - 1, videos: group });
    i = j;
  }
  return sections;
}

function inferTitle(group: RawVideo[], minPrefix: number): string | null {
  // Longest common token prefix
  const split = group.map((v) => tokens(v.title));
  if (split.length === 0) return null;
  const m = Math.min(...split.map((a) => a.length));
  let pref: string[] = [];
  for (let i = 0; i < m; i++) {
    const t = split[0][i];
    if (split.every((a) => a[i] === t)) pref.push(t);
    else break;
  }
  if (pref.length >= minPrefix) return titleCase(pref.join(" "));

  // Otherwise pick top keyword by naive TF-IDF-ish score
  const all = new Map<string, { tf: number; df: number }>();
  for (const toks of split) {
    const seen = new Set<string>();
    for (const t of toks) {
      const rec = all.get(t) ?? { tf: 0, df: 0 };
      rec.tf++;
      if (!seen.has(t)) {
        rec.df++;
        seen.add(t);
      }
      all.set(t, rec);
    }
  }
  const N = split.length;
  let best = "";
  let bestScore = 0;
  for (const [t, rec] of all.entries()) {
    const score = rec.tf * Math.log((N + 1) / (rec.df + 1));
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best ? titleCase(best) : null;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
