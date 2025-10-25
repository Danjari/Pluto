"use client";
import { autoSection, RawVideo } from "./sectioning";

export type DemoCourse = {
  id: string;
  playlistId: string;
  title: string;
  description?: string;
  sections: { title: string; orderIndex: number; videos: RawVideo[] }[];
};

function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export function buildDemoPreview(playlistUrl: string): DemoCourse {
  // Extract playlistId if present; otherwise fake one
  let playlistId = "PL_DEMO";
  try {
    const u = new URL(playlistUrl);
    playlistId = u.searchParams.get("list") ?? playlistId;
  } catch {}
  const count = randomInt(8, 14); // 8–14 videos
  const videos: RawVideo[] = Array.from({ length: count }).map((_, i) => ({
    youtubeId: `dQw4w9WgXcQ_${i + 1}`, // fake IDs (you can replace with real later)
    title: `Lesson ${i + 1}: Topic ${randomInt(1, 99)}`,
    durationS: 240 + i * 15,
    position: i,
  }));
  const sections = autoSection(videos);
  return {
    id: `demo_${playlistId}_${Date.now()}`,
    playlistId,
    title: "Demo Course from YouTube Playlist",
    description: "Preview generated in demo mode (no backend).",
    sections,
  };
}

const COURSE_KEY = "demoCourse";
const PROGRESS_KEY = "demoProgress";

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
}

export function overallPercent(course: DemoCourse, prog: DemoProgress) {
  const total = course.sections.reduce((s, sec) => s + sec.videos.length, 0);
  const done = course.sections.reduce((s, sec) => s + sec.videos.filter(v => prog[v.youtubeId]).length, 0);
  return total ? Math.round((100 * done) / total) : 0;
}
