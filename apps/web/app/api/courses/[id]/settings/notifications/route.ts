import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get or create notification settings
    let settings = await prisma.courseNotificationSettings.findUnique({
      where: { courseId },
      select: {
        id: true,
        emailNotificationsEnabled: true,
        studyDays: true,
        notificationTime: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.courseNotificationSettings.create({
        data: {
          courseId,
          userId: user.id,
          emailNotificationsEnabled: true,
          studyDays: ["MON", "WED", "FRI"], // Default to Mon, Wed, Fri
          notificationTime: "21:00"
        },
        select: {
          id: true,
          emailNotificationsEnabled: true,
          studyDays: true,
          notificationTime: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    const { emailNotificationsEnabled, studyDays, notificationTime } = body;

    // Validate input
    if (typeof emailNotificationsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "emailNotificationsEnabled must be a boolean" },
        { status: 400 }
      );
    }

    if (!Array.isArray(studyDays) || studyDays.length === 0) {
      return NextResponse.json(
        { error: "studyDays must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate study days
    const validDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const invalidDays = studyDays.filter(day => !validDays.includes(day));
    if (invalidDays.length > 0) {
      return NextResponse.json(
        { error: `Invalid study days: ${invalidDays.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate notification time (HH:mm format)
    if (notificationTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(notificationTime)) {
      return NextResponse.json(
        { error: "notificationTime must be in HH:mm format" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Upsert notification settings
    const settings = await prisma.courseNotificationSettings.upsert({
      where: { courseId },
      update: {
        emailNotificationsEnabled,
        studyDays,
        notificationTime: notificationTime || "21:00",
        updatedAt: new Date()
      },
      create: {
        courseId,
        userId: user.id,
        emailNotificationsEnabled,
        studyDays,
        notificationTime: notificationTime || "21:00"
      },
      select: {
        id: true,
        emailNotificationsEnabled: true,
        studyDays: true,
        notificationTime: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
