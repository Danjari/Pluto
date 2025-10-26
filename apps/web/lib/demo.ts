// apps/web/lib/demo.ts
"use client";

export type RawVideo = {
  youtubeId: string;
  title: string;
  durationS?: number;
};

export type DemoCourse = {
  id: string;
  playlistId: string;
  title: string;
  description?: string;
  sections: { title: string; orderIndex: number; videos: RawVideo[] }[];
};

const COURSE_KEY = "demoCourse";
const PROGRESS_KEY = "demoProgress";

export function saveDemoCourse(course: DemoCourse) {
  localStorage.setItem(COURSE_KEY, JSON.stringify(course));
}

export function loadDemoCourse(): DemoCourse | null {
  const raw = localStorage.getItem(COURSE_KEY);
  return raw ? (JSON.parse(raw) as DemoCourse) : null;
}

export type DemoProgress = Record<string, boolean>;

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

export function timeRemaining(course: DemoCourse, prog: DemoProgress) {
  return course.sections.reduce(
    (s, sec) => s + sec.videos.filter(v => !prog[v.youtubeId]).reduce((a, v) => a + (v.durationS || 0), 0),
    0
  );
}

export function cleanYoutubeId(id: string) {
  const i = id.indexOf("_");
  return i > 0 ? id.slice(0, i) : id;
}
