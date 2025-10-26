import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPlaylistPreview } from "@/lib/youtube";
import { autoSection } from "@/lib/sectioning";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playlistUrl } = await req.json();
  if (!playlistUrl) {
    return Response.json({ error: "Missing playlist URL" }, { status: 400 });
  }

  try {
    const ingest = await buildPlaylistPreview(playlistUrl);
    const sections = autoSection(ingest.videos);

    // Create course first
    const course = await prisma.course.create({
      data: {
        title: ingest.title,
        description: ingest.description,
        playlistId: ingest.playlistId || "",
        totalVideos: ingest.videos.length,
        totalDurationS: ingest.totalDurationS || 0,
        user: { connect: { email: session.user.email } },
      },
    });

    // Create sections and videos
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const createdSection = await prisma.section.create({
        data: {
          courseId: course.id,
          title: section.title,
          orderIndex: section.orderIndex,
        },
      });

      // Create videos for this section
      for (let j = 0; j < section.videos.length; j++) {
        const video = section.videos[j];
        await prisma.video.create({
          data: {
            sectionId: createdSection.id,
            courseId: course.id,
            youtubeId: video.youtubeId,
            title: video.title,
            durationS: video.durationS,
            thumbnailUrl: video.thumbnailUrl,
            orderIndex: j,
          },
        });
      }
    }

    return Response.json({ courseId: course.id });
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
