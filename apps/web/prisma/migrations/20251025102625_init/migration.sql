-- CreateEnum
CREATE TYPE "LearningFrequency" AS ENUM ('DAILY', 'THREE_PER_WEEK', 'WEEKLY');

-- CreateEnum
CREATE TYPE "ProgressionMode" AS ENUM ('LINEAR', 'OPEN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "tz" TEXT NOT NULL DEFAULT 'Asia/Dubai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notificationPreferences" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningGoal" TEXT NOT NULL,
    "motivation" TEXT,
    "targetCompletionDate" TIMESTAMP(3),
    "learningFrequency" "LearningFrequency" NOT NULL DEFAULT 'THREE_PER_WEEK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalVideos" INTEGER NOT NULL DEFAULT 0,
    "totalDurationS" INTEGER NOT NULL DEFAULT 0,
    "progressionMode" "ProgressionMode" NOT NULL DEFAULT 'LINEAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationS" INTEGER NOT NULL DEFAULT 0,
    "thumbnailUrl" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "watchTimeS" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "user_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "goal_user_createdAt_idx" ON "Goal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "course_user_createdAt_idx" ON "Course"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "course_unique_user_playlist" ON "Course"("userId", "playlistId");

-- CreateIndex
CREATE INDEX "section_order_idx" ON "Section"("courseId", "orderIndex");

-- CreateIndex
CREATE INDEX "video_section_order_idx" ON "Video"("sectionId", "orderIndex");

-- CreateIndex
CREATE INDEX "video_course_idx" ON "Video"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "video_unique_course_youtube" ON "Video"("courseId", "youtubeId");

-- CreateIndex
CREATE INDEX "progress_user_idx" ON "Progress"("userId");

-- CreateIndex
CREATE INDEX "progress_video_idx" ON "Progress"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "progress_unique_user_video" ON "Progress"("userId", "videoId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
