import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRoastingEmail } from "@/lib/gemini";
import { sendReminderEmail, createEmailTemplate } from "@/lib/email";

// Helper function to get timezone offset in hours
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
    return (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0; // Default to UTC if timezone is invalid
  }
}

// Helper function to get current day in timezone
function getCurrentDayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    return dayNames[dayInTimezone.getDay()];
  } catch {
    // Fallback to UTC
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return dayNames[new Date().getDay()];
  }
}

// Helper function to get current hour in timezone
function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const hourInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    return hourInTimezone.getHours();
  } catch {
    return new Date().getHours();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUTC = new Date();
    console.log(`[CRON] Starting reminder job at ${currentUTC.toISOString()}`);

    // Get all notification settings that are enabled
    const allSettings = await prisma.courseNotificationSettings.findMany({
      where: {
        emailNotificationsEnabled: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            tz: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            totalVideos: true,
            sections: {
              include: {
                videos: {
                  select: { id: true, title: true }
                }
              }
            }
          }
        }
      }
    });

    console.log(`[CRON] Found ${allSettings.length} notification settings`);

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        userId: string;
        courseId: string;
        status: 'sent' | 'skipped' | 'error';
        reason?: string;
      }>
    };

    // Process each setting
    for (const setting of allSettings) {
      results.processed++;
      
      try {
        const user = setting.user;
        const course = setting.course;
        const timezone = user.tz || 'UTC';
        
        // Check if today is a study day for this user
        const currentDay = getCurrentDayInTimezone(timezone);
        if (!setting.studyDays.includes(currentDay)) {
          results.skipped++;
          results.details.push({
            userId: user.id,
            courseId: course.id,
            status: 'skipped',
            reason: `Today (${currentDay}) not in study days (${setting.studyDays.join(', ')})`
          });
          continue;
        }

        // Check if it's the right time to send (within 1 hour window)
        const currentHour = getCurrentHourInTimezone(timezone);
        const notificationHour = parseInt(setting.notificationTime.split(':')[0]);
        
        if (Math.abs(currentHour - notificationHour) > 1) {
          results.skipped++;
          results.details.push({
            userId: user.id,
            courseId: course.id,
            status: 'skipped',
            reason: `Current hour (${currentHour}) not close to notification time (${notificationHour})`
          });
          continue;
        }

        // Check if we already sent an email today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const alreadySent = await prisma.emailNotificationLog.findFirst({
          where: {
            userId: user.id,
            courseId: course.id,
            emailType: 'reminder',
            sentAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        if (alreadySent) {
          results.skipped++;
          results.details.push({
            userId: user.id,
            courseId: course.id,
            status: 'skipped',
            reason: 'Email already sent today'
          });
          continue;
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

        // Check if user has checked in today (new approach)
        // For testing: Use current hour instead of date (resets every hour)
        // TODO: Change back to date format for production
        const todayDateString = today.toISOString().split('T')[0] + '-' + today.getHours();
        
        const checkedInToday = await prisma.dailyCheckIn.findUnique({
          where: {
            userId_courseId_checkInDate: {
              userId: user.id,
              courseId: course.id,
              checkInDate: todayDateString
            }
          }
        });

        if (checkedInToday) {
          results.skipped++;
          results.details.push({
            userId: user.id,
            courseId: course.id,
            status: 'skipped',
            reason: 'User already checked in today - no reminder needed'
          });
          continue;
        }

        // Calculate days since last check-in
        const lastCheckIn = await prisma.dailyCheckIn.findFirst({
          where: {
            userId: user.id,
            courseId: course.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        const daysSinceLastStudy = lastCheckIn?.createdAt 
          ? Math.floor((Date.now() - new Date(lastCheckIn.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Generate email content
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

        // Send email
        const emailResult = await sendReminderEmail({
          to: user.email,
          subject: emailContent.subject,
          html,
          courseId: course.id,
          courseTitle: course.title
        });

        if (emailResult.success) {
          // Log the email
          await prisma.emailNotificationLog.create({
            data: {
              userId: user.id,
              courseId: course.id,
              emailType: 'reminder'
            }
          });

          results.sent++;
          results.details.push({
            userId: user.id,
            courseId: course.id,
            status: 'sent'
          });
          
          console.log(`[CRON] Sent email to ${user.email} for course ${course.title}`);
        } else {
          results.errors++;
          results.details.push({
            userId: user.id,
            courseId: course.id,
            status: 'error',
            reason: emailResult.error
          });
          console.error(`[CRON] Failed to send email to ${user.email}: ${emailResult.error}`);
        }

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.errors++;
        results.details.push({
          userId: setting.user.id,
          courseId: setting.course.id,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`[CRON] Error processing setting for user ${setting.user.id}:`, error);
      }
    }

    console.log(`[CRON] Completed: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      timestamp: currentUTC.toISOString(),
      ...results
    });

  } catch (error) {
    console.error('[CRON] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
