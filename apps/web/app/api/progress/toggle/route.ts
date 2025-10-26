// apps/web/app/api/progress/toggle/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  videoId: z.string(),
  completed: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { videoId, completed } = body;

  await prisma.progress.upsert({
    where: { userId_videoId: { userId: user.id, videoId } },
    create: {
      userId: user.id,
      videoId,
      completed,
      completedAt: completed ? new Date() : null,
      watchTimeS: 0,
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  return Response.json({ ok: true });
}
