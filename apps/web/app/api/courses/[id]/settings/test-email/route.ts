import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRoastingEmail } from "@/lib/gemini";
import { createEmailTemplate, sendReminderEmail } from "@/lib/email";

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

    // Fetch course with sections and videos to calculate progress
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      include: {
        sections: {
          include: {
            videos: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Step 1: Calculate Course Progress Metrics
    const totalVideos = course.sections.reduce(
      (sum, section) => sum + section.videos.length,
      0
    );

    // Get all video IDs for this course
    const videoIds = course.sections.flatMap(section => 
      section.videos.map(video => video.id)
    );

    // Query completed progress for this user and course
    const completedProgress = await prisma.progress.findMany({
      where: {
        userId: user.id,
        videoId: { in: videoIds },
        completed: true
      },
      select: { videoId: true, completedAt: true }
    });

    const completedVideos = completedProgress.length;
    const progressPercent = totalVideos > 0 
      ? Math.round((completedVideos / totalVideos) * 100)
      : 0;

    // Step 2: Calculate Days Since Last Study
    // Get most recent Progress.completedAt date
    const lastProgressDate = completedProgress
      .filter(p => p.completedAt)
      .map(p => new Date(p.completedAt!))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    // Get most recent DailyCheckIn.createdAt date
    const lastCheckIn = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: user.id,
        courseId: courseId
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    const lastCheckInDate = lastCheckIn ? new Date(lastCheckIn.createdAt) : null;

    // Use the most recent date between Progress and DailyCheckIn
    let lastStudyDate: Date | null = null;
    if (lastProgressDate && lastCheckInDate) {
      lastStudyDate = lastProgressDate > lastCheckInDate ? lastProgressDate : lastCheckInDate;
    } else if (lastProgressDate) {
      lastStudyDate = lastProgressDate;
    } else if (lastCheckInDate) {
      lastStudyDate = lastCheckInDate;
    }

    // Calculate days since last study
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let daysSinceLastStudy = 0;
    if (lastStudyDate) {
      const lastStudy = new Date(lastStudyDate);
      lastStudy.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - lastStudy.getTime();
      daysSinceLastStudy = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Step 3: Generate Dynamic Email Content with Gemini
    const emailContent = await generateRoastingEmail({
      userName: user.name || "there",
      courseTitle: course.title,
      progressPercent,
      completedVideos,
      totalVideos,
      daysSinceLastStudy
    });

    // Step 4: Format Email Template
    const emailHtml = createEmailTemplate({
      userName: user.name || "there",
      courseTitle: course.title,
      courseId: course.id,
      progressPercent,
      completedVideos,
      totalVideos,
      body: emailContent.body // This now includes ending remarks
    });

    // Step 5: Send Email
    const result = await sendReminderEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailHtml,
      courseId: course.id,
      courseTitle: course.title
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.messageId,
      message: "Test email sent successfully with AI-generated content",
      emailPreview: {
        subject: emailContent.subject,
        endingRemarks: emailContent.endingRemarks,
        progressPercent,
        completedVideos,
        totalVideos,
        daysSinceLastStudy
      }
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
