"use client";
import { useEffect, useMemo, useState } from "react";
import { loadDemoCourse, loadProgress, setCompleted, overallPercent } from "@/lib/demo";
import { useRouter } from "next/navigation";

export default function CoursePage() {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<{[k:string]: boolean}>({});
  const [current, setCurrent] = useState<{secIdx:number; vidIdx:number}>({ secIdx: 0, vidIdx: 0 });

  useEffect(() => {
    const c = loadDemoCourse();
    if (!c) {
      router.push("/");
      return;
    }
    setCourse(c);
    setProgress(loadProgress());
  }, [router]);

  const currentVideo = useMemo(() => {
    if (!course) return null;
    const sec = course.sections[current.secIdx];
    return sec?.videos[current.vidIdx] ?? null;
  }, [course, current]);

  if (!course) return <main className="p-6">Loading…</main>;

  const percent = overallPercent(course, progress);

  function toggleComplete(vidId: string) {
    const newVal = !progress[vidId];
    setCompleted(vidId, newVal);
    setProgress({ ...progress, [vidId]: newVal });
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
    <main className="grid grid-cols-12 gap-4 p-6">
      {/* Sidebar */}
      <aside className="col-span-4 border rounded p-3 h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">{course.title}</div>
          <div className="text-sm text-gray-600">{percent}%</div>
        </div>
        {course.sections.map((s: any, si: number) => (
          <div key={si} className="mb-3">
            <div className="font-medium">{s.title}</div>
            <ul className="mt-1 space-y-1">
              {s.videos.map((v: any, vi: number) => {
                const active = si === current.secIdx && vi === current.vidIdx;
                const done = !!progress[v.youtubeId];
                return (
                  <li key={v.youtubeId}>
                    <button
                      className={`w-full text-left px-2 py-1 rounded ${active ? "bg-black text-white" : "hover:bg-gray-100"}`}
                      onClick={() => setCurrent({ secIdx: si, vidIdx: vi })}
                    >
                      <span className="mr-2">{done ? "✅" : "⭕"}</span>
                      {v.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>

      {/* Player */}
      <section className="col-span-8">
        {currentVideo ? (
          <div className="space-y-4">
            <div className="text-xl font-semibold">{currentVideo.title}</div>
            {/* For demo, show a placeholder YouTube embed. Replace with real ID later */}
            <div className="aspect-video w-full border rounded overflow-hidden bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/dQw4w9WgXcQ`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="flex gap-2">
              <button className="border rounded px-3 py-2" onClick={goPrev}>Previous</button>
              <button className="border rounded px-3 py-2" onClick={goNext}>Next</button>
              <button
                className={`rounded px-3 py-2 ${progress[currentVideo.youtubeId] ? "bg-green-600 text-white" : "border"}`}
                onClick={() => toggleComplete(currentVideo.youtubeId)}
              >
                {progress[currentVideo.youtubeId] ? "Completed ✓" : "Mark complete"}
              </button>
            </div>
          </div>
        ) : (
          <div>No video selected.</div>
        )}
      </section>
    </main>
  );
}
