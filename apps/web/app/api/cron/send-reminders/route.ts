import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRoastingEmail } from "@/lib/gemini";
import { createEmailTemplate, sendReminderEmail } from "@/lib/email";

// Day name to abbreviation mapping
const DAY_MAP: Record<string, string> = {
  "Sunday": "SUN",
  "Monday": "MON",
  "Tuesday": "TUE",
  "Wednesday": "WED",
  "Thursday": "THU",
  "Friday": "FRI",
  "Saturday": "SAT",
};

function getCurrentDayAbbreviation(): string {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  return DAY_MAP[dayName] || "MON";
}

function isWithinNotificationTime(notificationTime: string, toleranceMinutes: number = 60): boolean {
  const now = new Date();
  const [hours, minutes] = notificationTime.split(":").map(Number);
  const notificationDate = new Date();
  notificationDate.setHours(hours, minutes, 0, 0);
  
  const diffMs = Math.abs(now.getTime() - notificationDate.getTime());
  const diffMinutes = diffMs / (1000 * 60);
  
  return diffMinutes <= toleranceMinutes;
}

export async function GET(request: NextRequest) {
  return await handleCronRequest(request);
}

export async function POST(request: NextRequest) {
  return await handleCronRequest(request);
}

async function handleCronRequest(request: NextRequest) {
  try {
    // Secure with CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentDay = getCurrentDayAbbreviation();

    // Get all notification settings where email is enabled
    const notificationSettings = await prisma.courseNotificationSettings.findMany({
      where: {
        emailNotificationsEnabled: true,
        studyDays: {
          has: currentDay // Check if today is a study day
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tz: true
          }
        },
        course: {
          include: {
            sections: {
              include: {
                videos: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    const results = {
      processed: 0,
      sent: 0,
      skipped: {
        alreadyCheckedIn: 0,
        alreadySent: 0,
        notInTime: 0,
        noProgress: 0
      },
      errors: [] as string[]
    };

    for (const settings of notificationSettings) {
      try {
        results.processed++;

        // Check if current time matches notification time (with 60 minute tolerance)
        if (!isWithinNotificationTime(settings.notificationTime, 60)) {
          results.skipped.notInTime++;
          continue;
        }

        // Check if user has checked in today
        const checkIn = await prisma.dailyCheckIn.findUnique({
          where: {
            userId_courseId_checkInDate: {
              userId: settings.userId,
              courseId: settings.courseId,
              checkInDate: todayDateString
            }
          }
        });

        if (checkIn) {
          results.skipped.alreadyCheckedIn++;
          continue;
        }

        // Check if email was already sent today
        const todayStart = new Date(todayDateString);
        const todayEnd = new Date(todayDateString);
        todayEnd.setHours(23, 59, 59, 999);

        const existingEmail = await prisma.emailNotificationLog.findFirst({
          where: {
            userId: settings.userId,
            courseId: settings.courseId,
            emailType: "reminder",
            sentAt: {
              gte: todayStart,
              lte: todayEnd
            }
          }
        });

        if (existingEmail) {
          results.skipped.alreadySent++;
          continue;
        }

        // Calculate course progress
        const videoIds = settings.course.sections.flatMap(section =>
          section.videos.map(video => video.id)
        );

        const totalVideos = videoIds.length;
        if (totalVideos === 0) {
          results.skipped.noProgress++;
          continue;
        }

        const completedProgress = await prisma.progress.findMany({
          where: {
            userId: settings.userId,
            videoId: { in: videoIds },
            completed: true
          },
          select: { videoId: true, completedAt: true }
        });

        const completedVideos = completedProgress.length;
        const progressPercent = totalVideos > 0
          ? Math.round((completedVideos / totalVideos) * 100)
          : 0;

        // Calculate days since last study
        const lastProgressDate = completedProgress
          .filter(p => p.completedAt)
          .map(p => new Date(p.completedAt!))
          .sort((a, b) => b.getTime() - a.getTime())[0];

        const lastCheckInRecord = await prisma.dailyCheckIn.findFirst({
          where: {
            userId: settings.userId,
            courseId: settings.courseId
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        const lastCheckInDate = lastCheckInRecord ? new Date(lastCheckInRecord.createdAt) : null;

        let lastStudyDate: Date | null = null;
        if (lastProgressDate && lastCheckInDate) {
          lastStudyDate = lastProgressDate > lastCheckInDate ? lastProgressDate : lastCheckInDate;
        } else if (lastProgressDate) {
          lastStudyDate = lastProgressDate;
        } else if (lastCheckInDate) {
          lastStudyDate = lastCheckInDate;
        }

        let daysSinceLastStudy = 0;
        if (lastStudyDate) {
          const lastStudy = new Date(lastStudyDate);
          lastStudy.setHours(0, 0, 0, 0);
          const diffTime = today.getTime() - lastStudy.getTime();
          daysSinceLastStudy = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        // Generate email content with Gemini
        const emailContent = await generateRoastingEmail({
          userName: settings.user.name || "there",
          courseTitle: settings.course.title,
          progressPercent,
          completedVideos,
          totalVideos,
          daysSinceLastStudy
        });

        // Format email template
        const emailHtml = createEmailTemplate({
          userName: settings.user.name || "there",
          courseTitle: settings.course.title,
          courseId: settings.course.id,
          progressPercent,
          completedVideos,
          totalVideos,
          body: emailContent.body
        });

        // Send email
        const result = await sendReminderEmail({
          to: settings.user.email,
          subject: emailContent.subject,
          html: emailHtml,
          courseId: settings.course.id,
          courseTitle: settings.course.title
        });

        if (result.success) {
          // Log the email
          await prisma.emailNotificationLog.create({
            data: {
              userId: settings.userId,
              courseId: settings.courseId,
              emailType: "reminder"
            }
          });
          results.sent++;
        } else {
          results.errors.push(`Failed to send email to ${settings.user.email}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Error processing course ${settings.courseId}: ${errorMsg}`);
        console.error(`Error processing reminder for course ${settings.courseId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
