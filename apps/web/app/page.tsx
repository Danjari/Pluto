// apps/web/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
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

export default function Landing() {
  const router = useRouter();
  const { data: session } = useSession();

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

  const totalMinutes = (n: number) => Math.round(n / 60);

  async function onPreview() {
    setErr(null);

    // Gate: if not signed in, prompt login (we keep the bar only for logged-out state)
    if (!session) {
      signIn();
      return;
    }

    if (!url.trim()) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/courses/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to preview.");
      setData(json);
    } catch (e: any) {
      setErr(e.message || "Failed to preview.");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateCourse() {
    if (!session) {
      signIn();
      return;
    }
    if (!url.trim()) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create course.");
      router.push(`/courses/${json.courseId}`);
    } catch (e: any) {
      setErr(e.message || "Failed to create course.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vibe Hackathon</h1>
        <div className="flex gap-2">
          {session ? (
            <>
              <button
                className="px-3 py-2 border rounded-lg"
                onClick={() => router.push("/home")}
              >
                Home
              </button>
              <button
                className="px-3 py-2 border rounded-lg"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </button>
              <button
                className="px-3 py-2 border rounded-lg"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a className="px-3 py-2 border rounded-lg" href="/signup">
                Sign up
              </a>
              <a className="px-3 py-2 bg-black text-white rounded-lg" href="/signin">
                Log in
              </a>
            </>
          )}
        </div>
      </div>

      {/* Welcome (logged-in view) */}
      {session && (
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-semibold">
            Welcome, {session.user?.name || session.user?.email}
          </h2>
          <p className="text-gray-600 mt-2">
            Head to <button className="underline" onClick={() => router.push("/home")}>Home</button>{" "}
            to add a new course from a YouTube playlist, or open your{" "}
            <button className="underline" onClick={() => router.push("/dashboard")}>Dashboard</button>{" "}
            to continue learning.
          </p>
        </div>
      )}

      {/* Input + preview (only when NOT logged in) */}
      {!session && (
        <>
          <header className="space-y-3">
            <p className="text-gray-600">
              Paste a public YouTube playlist URL. You can always enter it; you’ll need to sign in to view results.
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

          {/* If they happen to sign in after previewing, this block won't show because it's under !session */}
          {data && (
            <>
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
                    className="rounded-lg bg-black text-white px-4 py-2"
                    onClick={() => signIn()} // must sign in before we can save
                    disabled={loading}
                  >
                    Sign in to save
                  </button>
                </div>
                {data.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-3">{data.description}</p>
                )}
              </div>

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
            </>
          )}

          {!data && !loading && (
            <div className="text-sm text-gray-500">
              Tip: try a public playlist like{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">
                https://www.youtube.com/playlist?list=PL8dPuuaLjXtOfse2ncvffeelTrqvHR8kS
              </code>
            </div>
          )}
        </>
      )}
    </main>
  );
}
