// apps/web/app/api/courses/preview/route.ts
import { NextRequest } from "next/server";
import { buildPlaylistPreview, isValidYouTubePlaylistUrl } from "@/lib/youtube";
import { autoSection } from "@/lib/sectioning";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = (body?.playlistUrl ?? "").toString().trim();
    if (!url) {
      return Response.json({ error: "playlistUrl is required" }, { status: 400 });
    }

    // Validate that it's a YouTube playlist URL
    const validation = isValidYouTubePlaylistUrl(url);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const ingest = await buildPlaylistPreview(url);
    const sections = autoSection(ingest.videos);

    return Response.json({
      playlistId: ingest.playlistId,
      title: ingest.title,
      description: ingest.description,
      totalVideos: ingest.videos.length,
      totalDurationS: ingest.totalDurationS,
      sections,
    });
  } catch (err: unknown) {
    const msg = (err instanceof Error ? err.message : "Unexpected error").toString();
    
    // Check for specific error messages and provide user-friendly responses
    if (msg.includes("could not find `list` parameter") || msg.includes("Invalid playlist URL")) {
      return Response.json({ 
        error: "This doesn't look like a YouTube playlist link. Please make sure you're copying the playlist URL (not a single video)." 
      }, { status: 400 });
    }
    
    if (msg.includes("Playlist not found")) {
      return Response.json({ 
        error: "Playlist not found. Please make sure the playlist is public and the URL is correct." 
      }, { status: 404 });
    }
    
    const isQuota = /quota|403/i.test(msg) || /exceeded/i.test(msg);
    const status = isQuota ? 429 : 400;
    return Response.json({ error: msg }, { status });
  }
}
