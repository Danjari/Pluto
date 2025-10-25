// apps/web/app/page.tsx
"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPreview() {
    setErr(null);
    setData(null);
    setLoading(true);
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
      setErr(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">YouTube Playlist → Course (Preview)</h1>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="https://www.youtube.com/playlist?list=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="border rounded px-4 py-2"
          onClick={onPreview}
          disabled={loading}
        >
          {loading ? "Loading..." : "Preview"}
        </button>
      </div>

      {err && <div className="text-red-600">{err}</div>}

      {data && (
        <div className="space-y-3">
          <div>
            <div className="text-lg font-semibold">{data.title}</div>
            <div className="text-sm text-gray-600">
              Playlist: {data.playlistId} • {data.totalVideos} videos •{" "}
              {Math.round(data.totalDurationS / 60)} min total
            </div>
          </div>

          <div className="border rounded p-4 bg-gray-50">
            {data.sections.map((s: any) => (
              <div key={s.orderIndex} className="mb-4">
                <div className="font-medium">{s.title}</div>
                <ul className="list-disc pl-6">
                  {s.videos.map((v: any) => (
                    <li key={v.youtubeId}>
                      {v.title}{" "}
                      <span className="text-gray-500 text-sm">
                        ({Math.round(v.durationS / 60)} min)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
