// apps/web/components/course/CourseViewer.tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Video = {
  id: string;
  youtubeId: string;
  title: string;
  durationS: number | null;
  thumbnailUrl: string | null;
  orderIndex: number;
};

type Section = {
  id: string;
  title: string;
  orderIndex: number;
  videos: Video[];
};

export default function CourseViewer({
  course,
  progress,
}: {
  course: { id: string; title: string; totalVideos: number; sections: Section[] };
  progress: Record<string, boolean>;
}) {
  const [current, setCurrent] = useState<{ s: number; v: number }>({ s: 0, v: 0 });
  const [done, setDone] = useState<Record<string, boolean>>(progress ?? {});

  const flatVideos = useMemo(() => course.sections.flatMap(s => s.videos), [course.sections]);
  const currentVideo = course.sections[current.s]?.videos[current.v] ?? null;

  const totals = useMemo(() => {
    const total = course.sections.reduce((sum, s) => sum + s.videos.length, 0);
    const completed = Object.values(done).filter(Boolean).length;
    return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [course.sections, done]);

  function ytId(yid: string) {
    return yid.includes("_") ? yid.split("_")[0] : yid;
  }

  async function toggleComplete() {
    if (!currentVideo) return;
    const newVal = !done[currentVideo.id];
    setDone(p => ({ ...p, [currentVideo.id]: newVal }));
    await fetch("/api/progress/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: currentVideo.id, completed: newVal }),
    }).catch(() => {});
  }

  function goNext() {
    const s = current.s, v = current.v;
    const sec = course.sections[s];
    if (v + 1 < sec.videos.length) setCurrent({ s, v: v + 1 });
    else if (s + 1 < course.sections.length) setCurrent({ s: s + 1, v: 0 });
  }
  function goPrev() {
    const s = current.s, v = current.v;
    if (v > 0) setCurrent({ s, v: v - 1 });
    else if (s > 0) {
      const prevSec = course.sections[s - 1];
      setCurrent({ s: s - 1, v: prevSec.videos.length - 1 });
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 grid grid-cols-12 gap-4">
      {/* SIDEBAR */}
      <aside className="col-span-12 md:col-span-4">
        <div className="rounded-2xl border bg-white">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold">{course.title}</h2>
            <div className="text-xs text-gray-600">
              {totals.completed} of {totals.total} completed
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${totals.percent}%` }} />
            </div>
          </div>

          <div className="max-h-[70vh] overflow-auto p-2">
            {course.sections.map((sec, si) => {
              const secCompleted = sec.videos.filter(v => done[v.id]).length;
              return (
                <div key={sec.id} className="mb-3">
                  <div className="px-2 py-1 text-sm font-semibold">
                    Section {si + 1}: {sec.title}
                    <span className="ml-2 text-xs text-gray-500">
                      {secCompleted} / {sec.videos.length}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {sec.videos.map((v, vi) => {
                      const active = current.s === si && current.v === vi;
                      return (
                        <li key={v.id}>
                          <button
                            className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left ${
                              active ? "bg-gray-100" : "hover:bg-gray-50"
                            }`}
                            onClick={() => setCurrent({ s: si, v: vi })}
                          >
                            {/* INTRINSIC-SIZE THUMBNAIL (no fill) */}
                            {v.thumbnailUrl ? (
                              <Image
                                src={v.thumbnailUrl}
                                alt={v.title}
                                width={96}
                                height={64} // 3:2-ish thumbnail
                                className="rounded bg-gray-100 object-cover"
                              />
                            ) : (
                              <div className="w-[96px] h-[64px] rounded bg-gray-100" />
                            )}
                            <div className="flex-1">
                              <div className="line-clamp-1 text-sm">{v.title}</div>
                              <div className="text-xs text-gray-500">
                                {Math.round((v.durationS || 0) / 60)} min
                              </div>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border ${
                                done[v.id] ? "bg-green-500 border-green-500" : "border-gray-300"
                              }`}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* PLAYER + CONTROLS */}
      <section className="col-span-12 md:col-span-8 space-y-3">
        {/* Fixed aspect ratio; never full-screen */}
        <div className="rounded-2xl border overflow-hidden bg-black">
          <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
            {currentVideo ? (
              <iframe
                title={currentVideo.title}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${ytId(currentVideo.youtubeId)}?rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-white">Select a video</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button className="px-3 py-2 rounded-lg border" onClick={goPrev}>
            ← Previous
          </button>
          <div className="text-sm text-gray-600">
            {flatVideos.findIndex(v => v.id === currentVideo?.id) + 1} of {flatVideos.length}
          </div>
          <button className="px-3 py-2 rounded-lg border" onClick={goNext}>
            Next →
          </button>
        </div>

        {currentVideo && (
          <div className="rounded-2xl border bg-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{currentVideo.title}</div>
              <div className="text-sm text-gray-500">
                Video {current.v + 1} • Section {current.s + 1} •{" "}
                {Math.round((currentVideo.durationS || 0) / 60)} min
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.youtube.com/watch?v=${ytId(currentVideo.youtubeId)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg border"
              >
                Open on YouTube
              </a>
              <button
                className={`px-3 py-2 rounded-lg ${
                  done[currentVideo.id] ? "bg-green-600 text-white" : "border"
                }`}
                onClick={toggleComplete}
              >
                {done[currentVideo.id] ? "Completed ✓" : "Mark as Complete"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
