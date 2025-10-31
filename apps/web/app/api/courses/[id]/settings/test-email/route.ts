import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true, title: true }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Call the email send endpoint
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const emailResponse = await fetch(`${baseUrl}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.email,
        subject: `Test Email - ${course.title}`,
        firstName: user.name || "there",
        from: process.env.FROM_EMAIL || "onboarding@resend.dev",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Test Email - ${course.title}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">📧 Test Email</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">Hello${user.name ? `, ${user.name}` : ""}!</h2>
                <p style="font-size: 16px; margin: 20px 0;">
                  This is a test email for your course: <strong>${course.title}</strong>
                </p>
                <p style="font-size: 14px; color: #666; margin: 20px 0;">
                  If you received this email, your email notifications are working correctly! ✅
                </p>
                <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    <strong>Course:</strong> ${course.title}<br>
                    <strong>Course ID:</strong> ${course.id}
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      return NextResponse.json(
        { error: emailData.error || "Failed to send email" },
        { status: emailResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      id: emailData.id,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
