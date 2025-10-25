// apps/web/app/api/courses/preview/route.ts
import { NextRequest } from "next/server";
import { buildPlaylistPreview } from "@/lib/youtube";
import { autoSection } from "@/lib/sectioning";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = (body?.playlistUrl ?? "").toString().trim();
    if (!url) {
      return Response.json({ error: "playlistUrl is required" }, { status: 400 });
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
  } catch (err: any) {
    const msg = (err?.message || "Unexpected error").toString();
    const isQuota =
      /quota|403/i.test(msg) || /exceeded/i.test(msg);
    const status = isQuota ? 429 : 400;
    return Response.json({ error: msg }, { status });
  }
}
