// apps/web/lib/youtube.ts
import { parseISODurationToSeconds } from "@/lib/iso8601";
import { cache } from "@/lib/cache";
import { nextYouTubeKey, requireYouTubeKey } from "@/lib/config";
import type { RawVideo } from "@/lib/sectioning";

const API = "https://www.googleapis.com/youtube/v3";
const CACHE_1H = 60 * 60 * 1000;
const CACHE_24H = 24 * CACHE_1H;

export function extractPlaylistId(playlistUrl: string): string | null {
  try {
    const u = new URL(playlistUrl);
    return u.searchParams.get("list");
  } catch {
    return null;
  }
}

type PlaylistMeta = { title: string; description?: string };

export async function getPlaylistMeta(playlistId: string): Promise<PlaylistMeta> {
  const ckey = `yt:playlist:${playlistId}:meta`;
  const hit = cache.get(ckey);
  if (hit) return hit;

  const key = requireYouTubeKey();
  const url = `${API}/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube playlists.list failed: ${res.status} ${await safeText(res)}`);
  }
  const json = await res.json();
  const item = json.items?.[0];
  if (!item) throw new Error("Playlist not found");
  const meta = {
    title: item.snippet?.title ?? "Untitled playlist",
    description: item.snippet?.description ?? undefined,
  };
  cache.set(ckey, meta, CACHE_24H);
  return meta;
}

export type PlaylistItem = {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  position: number; // 0-based order
};

export async function listPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
  const ckey = `yt:playlist:${playlistId}:items:v1`;
  const hit = cache.get(ckey);
  if (hit) return hit;

  let pageToken: string | undefined;
  const items: PlaylistItem[] = [];
  do {
    const key = nextYouTubeKey() ?? requireYouTubeKey();
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      key,
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`${API}/playlistItems?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`YouTube playlistItems.list failed: ${res.status} ${await safeText(res)}`);
    }
    const json = await res.json();
    for (const [idx, it] of (json.items ?? []).entries()) {
      const vid = it.contentDetails?.videoId;
      if (!vid) continue;
      const s = it.snippet ?? {};
      items.push({
        videoId: vid,
        title: s.title ?? "Untitled video",
        description: s.description ?? undefined,
        thumbnailUrl: s.thumbnails?.medium?.url || s.thumbnails?.default?.url || undefined,
        position: (s.position ?? idx) as number,
      });
    }
    pageToken = json.nextPageToken;
  } while (pageToken);

  // Normalize playlist order (0-based)
  items.sort((a, b) => a.position - b.position);
  items.forEach((v, i) => (v.position = i));

  cache.set(ckey, items, CACHE_24H);
  return items;
}

export async function getVideoDurations(videoIds: string[]): Promise<Record<string, number>> {
  // Batch in chunks of 50
  const results: Record<string, number> = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const ckey = `yt:videos:${chunk.join(",")}`;
    const hit = cache.get(ckey);
    if (hit) {
      Object.assign(results, hit);
      continue;
    }
    const key = nextYouTubeKey() ?? requireYouTubeKey();
    const params = new URLSearchParams({
      part: "contentDetails",
      id: chunk.join(","),
      key,
    });
    const res = await fetch(`${API}/videos?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`YouTube videos.list failed: ${res.status} ${await safeText(res)}`);
    }
    const json = await res.json();
    const map: Record<string, number> = {};
    for (const it of json.items ?? []) {
      const id = it.id as string;
      const iso = it.contentDetails?.duration as string | undefined;
      map[id] = iso ? parseISODurationToSeconds(iso) : 0;
    }
    cache.set(ckey, map, CACHE_1H);
    Object.assign(results, map);
  }
  return results;
}

export async function buildPlaylistPreview(playlistUrl: string) {
  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error("Invalid playlist URL — could not find `list` parameter.");
  }
  const meta = await getPlaylistMeta(playlistId);
  const items = await listPlaylistItems(playlistId);
  const durations = await getVideoDurations(items.map((x) => x.videoId));
  const videos: RawVideo[] = items.map((it) => ({
    youtubeId: it.videoId,
    title: it.title,
    description: it.description,
    durationS: durations[it.videoId] ?? 0,
    thumbnailUrl: it.thumbnailUrl,
    position: it.position,
  }));
  const totalDurationS = videos.reduce((s, v) => s + (v.durationS || 0), 0);
  return {
    playlistId,
    title: meta.title,
    description: meta.description,
    videos,
    totalDurationS,
  };
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
