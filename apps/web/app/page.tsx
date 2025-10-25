"use client";

import { useState } from "react";
import SectionCard from "@/components/SectionCard";
import { pickThumb } from "@/lib/thumbs";

type PreviewSection = {
  title: string;
  orderIndex: number;
  videos: Array<{
    youtubeId: string;
    title: string;
    durationS?: number;
    thumbnailUrl?: string;
  }>;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<{
    playlistId: string;
    title: string;
    description?: string;
    totalVideos: number;
    totalDurationS: number;
    sections: PreviewSection[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPreview() {
    setErr(null);
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/courses/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setData(json);
    } catch (e: any) {
      setErr(e.message || "Failed to preview. Check your YouTube API key and the playlist URL.");
    } finally {
      setLoading(false);
    }
  }

  function totalMinutes(n: number) {
    return Math.round(n / 60);
  }

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8 space-y-6">
      {/* Hero */}
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold">Turn a YouTube playlist into a course</h1>
        <p className="text-gray-600">
           Paste a public playlist URL. We’ll fetch videos, calculate durations, and auto-section the content into bite-sized modules.
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-4 py-2"
            placeholder="https://www.youtube.com/playlist?list=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="rounded-lg px-4 py-2 bg-black text-white disabled:opacity-60"
            onClick={onPreview}
            disabled={loading || !url.trim()}
          >
            {loading ? "Loading…" : "Preview"}
          </button>
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
      </header>

      {/* Summary */}
      {data && (
        <div className="rounded-2xl border bg-white p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xl font-semibold">{data.title}</div>
              <div className="text-sm text-gray-600">
                Playlist <span className="font-mono">{data.playlistId}</span> •{" "}
                {data.totalVideos} videos • {totalMinutes(data.totalDurationS)} min total
              </div>
            </div>
            <button
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            >
              Jump to sections
            </button>
          </div>
          {data.description && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-3">{data.description}</p>
          )}
        </div>
      )}

      {/* Section cards with thumbnails */}
      {data && (
        <div className="space-y-5">
            {data.sections.map((sec, i) => (
              <SectionCard
                key={`${i}-${sec.videos?.[0]?.youtubeId ?? sec.title ?? "sec"}`}
                title={sec.title}
                videos={sec.videos}
                getThumb={(v) => pickThumb(v.youtubeId, v.thumbnailUrl)}
                onSelect={(v) => {
                  const id = v.youtubeId.includes("_") ? v.youtubeId.split("_")[0] : v.youtubeId;
                  window.open(`https://www.youtube.com/watch?v=${id}`, "_blank");
                }}
              />
            ))}
          </div>

      )}

      {!data && !loading && (
        <div className="text-sm text-gray-500">
          Tip: try a public playlist like{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">
            https://www.youtube.com/playlist?list=PL8dPuuaLjXtOfse2ncvffeelTrqvHR8kS
          </code>
        </div>
      )}
    </main>
  );
}
