import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPlaylistPreview } from "@/lib/youtube";
import { autoSection } from "@/lib/sectioning";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

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

    const course = await prisma.course.create({
      data: {
        title: ingest.title,
        description: ingest.description,
        user: { connect: { email: session.user.email } },
        sections: {
          create: sections.map((s) => ({
            title: s.title,
            orderIndex: s.orderIndex,
            videos: {
              create: s.videos.map((v) => ({
                youtubeId: v.youtubeId,
                title: v.title,
                durationS: v.durationS,
                thumbnailUrl: v.thumbnailUrl,
              })),
            },
          })),
        },
      },
    });

    return Response.json({ courseId: course.id });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
