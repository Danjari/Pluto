// apps/web/app/api/courses/create/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPlaylistPreview, isValidYouTubePlaylistUrl } from "@/lib/youtube";
import { autoSection } from "@/lib/sectioning";
import { z } from "zod";

const BodySchema = z.object({ playlistUrl: z.string().url() });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let playlistUrl: string;
  try {
    ({ playlistUrl } = BodySchema.parse(await req.json()));
  } catch {
    return Response.json({ error: "Invalid body. Expect { playlistUrl: <url> }" }, { status: 400 });
  }

  // Validate that it's a YouTube playlist URL
  const validation = isValidYouTubePlaylistUrl(playlistUrl);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    // 0) Ingest playlist
    const ingest = await buildPlaylistPreview(playlistUrl);
    const videos = Array.isArray(ingest?.videos) ? ingest.videos : [];
    if (videos.length === 0) {
      return Response.json({ error: "No videos found. Ensure playlist is public and valid." }, { status: 422 });
    }

    // 1) Find the user (id needed for compound uniqueness)
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    // 2) Return existing course if same user + playlist already saved
    const existing = await prisma.course.findFirst({
      where: { userId: user.id, playlistId: ingest.playlistId ?? "" },
      select: { id: true },
    });
    if (existing) return Response.json({ courseId: existing.id });

    // 3) Build sections defensively
    const rawSections = autoSection(videos);
    const sections =
      Array.isArray(rawSections) && rawSections.length
        ? rawSections
        : [
            {
              title: "Section 1",
              videos: videos.map((v: unknown, j: number) => {
                const video = v as { youtubeId: string; title?: string; description?: string; durationS?: number; thumbnailUrl?: string };
                return {
                  youtubeId: video.youtubeId,
                  title: video.title || `Video ${j + 1}`,
                  description: video.description ?? null,
                  durationS: video.durationS ?? 0,
                  thumbnailUrl: video.thumbnailUrl ?? null,
                  orderIndex: j,
                };
              }),
            },
          ];

    // 4) Create course (flat)
    const course = await prisma.course.create({
      data: {
        userId: user.id,
        playlistId: ingest.playlistId ?? "",
        title: ingest.title ?? "Untitled Course",
        description: ingest.description ?? null,
        totalVideos: videos.length,
        totalDurationS: ingest.totalDurationS ?? 0,
      },
      select: { id: true },
    });

    // 5) Create sections + videos per section
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const sec = await prisma.section.create({
        data: { courseId: course.id, title: s.title || `Section ${i + 1}`, orderIndex: i },
        select: { id: true },
      });

      const sv = Array.isArray(s.videos) ? s.videos : [];
      for (let j = 0; j < sv.length; j++) {
        const v = sv[j];
        await prisma.video.create({
          data: {
            sectionId: sec.id,
            courseId: course.id,
            youtubeId: v.youtubeId,
            title: v.title || `Video ${j + 1}`,
            description: v.description ?? null,
            durationS: v.durationS ?? 0,
            thumbnailUrl: v.thumbnailUrl ?? null,
            orderIndex: j,
          },
        });
      }
    }

    return Response.json({ courseId: course.id });
  } catch (err: unknown) {
    const msg = (err instanceof Error ? err.message : "Failed to create course").toString();
    
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
    return Response.json({ error: msg }, { status: isQuota ? 429 : 500 });
  }
}
