import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRoastingEmail } from "@/lib/gemini";
import { sendReminderEmail, createEmailTemplate } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get course with progress
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      include: {
        sections: {
          include: {
            videos: {
              select: { id: true, title: true }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get user's progress for this course
    const videoIds = course.sections.flatMap(s => s.videos.map(v => v.id));
    const progress = await prisma.progress.findMany({
      where: { 
        userId: user.id, 
        videoId: { in: videoIds } 
      },
      select: { videoId: true, completed: true, completedAt: true }
    });

    const completedVideos = progress.filter(p => p.completed).length;
    const totalVideos = videoIds.length;
    const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    // Calculate days since last study
    const lastCompleted = progress
      .filter(p => p.completed && p.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    const daysSinceLastStudy = lastCompleted?.completedAt 
      ? Math.floor((Date.now() - new Date(lastCompleted.completedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999; // If never completed, use a high number

    // Generate roasting email content
    const emailContent = await generateRoastingEmail({
      userName: user.name || user.email.split('@')[0],
      courseTitle: course.title,
      progressPercent,
      daysSinceLastStudy,
      totalVideos,
      completedVideos
    });

    // Create email template
    const html = createEmailTemplate({
      userName: user.name || user.email.split('@')[0],
      courseTitle: course.title,
      courseId: course.id,
      progressPercent,
      completedVideos,
      totalVideos,
      body: emailContent.body
    });

    // Send test email
    const result = await sendReminderEmail({
      to: user.email,
      subject: emailContent.subject,
      html,
      courseId: course.id,
      courseTitle: course.title
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to send email: ${result.error}` },
        { status: 500 }
      );
    }

    // Log the test email
    await prisma.emailNotificationLog.create({
      data: {
        userId: user.id,
        courseId: course.id,
        emailType: "test"
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Test email sent successfully!",
      messageId: result.messageId
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
