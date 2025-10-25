// apps/web/app/courses/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import Sidebar from "@/components/Sidebar";
import { loadDemoCourse, loadProgress, setCompleted, overallPercent, timeRemaining, cleanYoutubeId } from "@/lib/demo";

export default function CoursePage() {
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [current, setCurrent] = useState<{ secIdx: number; vidIdx: number }>({ secIdx: 0, vidIdx: 0 });

  useEffect(() => {
    const c = loadDemoCourse();
    if (!c) {
      window.location.href = "/";
      return;
    }
    setCourse(c);
    setProgress(loadProgress());
  }, []);

  const currentVideo = useMemo(() => {
    if (!course) return null;
    const sec = course.sections[current.secIdx];
    return sec?.videos[current.vidIdx] ?? null;
  }, [course, current]);

  if (!course) return <main className="p-6">Loading…</main>;

  const percent = overallPercent(course, progress);
  const total = course.sections.reduce((s: number, sec: any) => s + sec.videos.length, 0);
  const remainingMin = Math.round((timeRemaining(course, progress) || 0) / 60);
  const completedToday = 0; // simple demo value
  const streakDays = 0;     // simple demo value

  function toggleComplete() {
    if (!currentVideo) return;
    const id = currentVideo.youtubeId;
    const newVal = !progress[id];
    setCompleted(id, newVal);
    setProgress({ ...progress, [id]: newVal });
  }

  function goNext() {
    const { secIdx, vidIdx } = current;
    const sec = course.sections[secIdx];
    if (vidIdx + 1 < sec.videos.length) setCurrent({ secIdx, vidIdx: vidIdx + 1 });
    else if (secIdx + 1 < course.sections.length) setCurrent({ secIdx: secIdx + 1, vidIdx: 0 });
  }

  function goPrev() {
    const { secIdx, vidIdx } = current;
    if (vidIdx > 0) setCurrent({ secIdx, vidIdx: vidIdx - 1 });
    else if (secIdx > 0) {
      const prevSec = course.sections[secIdx - 1];
      setCurrent({ secIdx: secIdx - 1, vidIdx: prevSec.videos.length - 1 });
    }
  }

  return (
    <main className="p-4 sm:p-6 space-y-4 max-w-[1200px] mx-auto">
      {/* Title + summary */}
      <div>
        <div className="p-4 bg-green-100 text-green-800 rounded">Tailwind works</div>
        <button className="text-sm text-gray-500 hover:underline" onClick={() => (window.location.href = "/")}>
          ← Back
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">{course.title}</h1>
        <div className="text-sm text-gray-600 mt-1">
          {total} videos • Auto-generated course
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{percent}% complete • {Object.values(progress).filter(Boolean).length} of {total} videos</span>
          </div>
          <ProgressBar percent={percent} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <StatCard title="Overall Progress" value={`${percent}%`} helper={`0 of ${total} completed`} />
        <StatCard title="Current Streak" value={`${streakDays} days`} helper="Keep it up! 🔥" />
        <StatCard title="Completed Today" value={`${completedToday}`} helper="Start watching" />
        <StatCard title="Time Remaining" value={`${remainingMin}m`} helper="Estimated completion" />
      </div>

      {/* Layout: sidebar + player */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4">
          <Sidebar sections={course.sections} progress={progress} current={current} setCurrent={setCurrent} />
        </div>

        <div className="col-span-12 md:col-span-8 space-y-3">
          {currentVideo ? (
            <>
              <VideoPlayer youtubeId={cleanYoutubeId(currentVideo.youtubeId)} />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{currentVideo.title}</div>
                  <div className="text-sm text-gray-500">
                    {Math.round((currentVideo.durationS || 0) / 60)} min
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="border rounded-lg px-3 py-2" onClick={goPrev}>Previous</button>
                  <button className="border rounded-lg px-3 py-2" onClick={goNext}>Next</button>
                  <button
                    className={`rounded-lg px-3 py-2 ${progress[currentVideo.youtubeId] ? "bg-green-600 text-white" : "border"}`}
                    onClick={toggleComplete}
                  >
                    {progress[currentVideo.youtubeId] ? "Completed ✓" : "Mark complete"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border bg-white p-6">Select a lecture from the left.</div>
          )}
        </div>
      </div>
    </main>
  );
}
