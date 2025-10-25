// apps/web/lib/demo.ts
"use client";
import { autoSection, RawVideo } from "@/lib/sectioning";

export type DemoCourse = {
  id: string;
  playlistId: string;
  title: string;
  description?: string;
  sections: { title: string; orderIndex: number; videos: RawVideo[] }[];
};

function cleanId(id: string) {
  const i = id.indexOf("_");
  return i > 0 ? id.slice(0, i) : id;
}

export function buildDemoPreview(playlistUrl: string): DemoCourse {
  let playlistId = "PL_DEMO";
  try {
    const u = new URL(playlistUrl);
    playlistId = u.searchParams.get("list") ?? playlistId;
  } catch {}
  const count = 18; // nicer grid for demo
  const videos: RawVideo[] = Array.from({ length: count }).map((_, i) => ({
    youtubeId: `dQw4w9WgXcQ_${i + 1}`, // demo; real data replaces this
    title: `Lesson ${i + 1}`,
    durationS: 12 * 60 + (i % 4) * 90, // ~12–15 min
    position: i,
    thumbnailUrl: `https://i.ytimg.com/vi/${cleanId(`dQw4w9WgXcQ_${i + 1}`)}/hqdefault.jpg`,
  }));
  const sections = autoSection(videos);
  return {
    id: `demo_${playlistId}_${Date.now()}`,
    playlistId,
    title: "Complete React Tutorial 2024",
    description: "Auto-generated course from YouTube playlist (demo mode).",
    sections,
  };
}

const COURSE_KEY = "demoCourse";
const PROGRESS_KEY = "demoProgress"; // { [videoId]: boolean }
const STREAK_KEY = "demoStreak";     // simple integer

export function saveDemoCourse(course: DemoCourse) {
  localStorage.setItem(COURSE_KEY, JSON.stringify(course));
}

export function loadDemoCourse(): DemoCourse | null {
  const raw = localStorage.getItem(COURSE_KEY);
  return raw ? (JSON.parse(raw) as DemoCourse) : null;
}

export type DemoProgress = { [videoId: string]: boolean };

export function loadProgress(): DemoProgress {
  const raw = localStorage.getItem(PROGRESS_KEY);
  return raw ? (JSON.parse(raw) as DemoProgress) : {};
}

export function setCompleted(videoId: string, completed: boolean) {
  const p = loadProgress();
  p[videoId] = completed;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  // naive streak bump if completed today
  if (completed) {
    const streak = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10) || 0;
    localStorage.setItem(STREAK_KEY, String(streak)); // leave as-is for demo
  }
}

export function overallPercent(course: DemoCourse, prog: DemoProgress) {
  const total = course.sections.reduce((s, sec) => s + sec.videos.length, 0);
  const done = course.sections.reduce((s, sec) => s + sec.videos.filter(v => prog[v.youtubeId]).length, 0);
  return total ? Math.round((100 * done) / total) : 0;
}

export function totalDuration(course: DemoCourse) {
  return course.sections.reduce((s, sec) => s + sec.videos.reduce((a, v) => a + (v.durationS || 0), 0), 0);
}

export function timeRemaining(course: DemoCourse, prog: DemoProgress) {
  return course.sections.reduce(
    (s, sec) => s + sec.videos.filter(v => !prog[v.youtubeId]).reduce((a, v) => a + (v.durationS || 0), 0),
    0
  );
}

export function cleanYoutubeId(youtubeId: string) {
  const i = youtubeId.indexOf("_");
  return i > 0 ? youtubeId.slice(0, i) : youtubeId;
}
