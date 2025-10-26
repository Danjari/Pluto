"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function HomeAfterLogin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (status === "loading") {
    return <main className="p-6">Loading…</main>;
  }

  if (!session) {
    // If someone hits /home without being signed in, send them to the sign-in page.
    // You can also show a sign-in button here instead of redirecting.
    if (typeof window !== "undefined") router.replace("/signin");
    return null;
  }

  async function onCreate() {
    if (!url.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create course");
      router.push(`/courses/${json.courseId}`);
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {session.user?.name || session.user?.email}</h1>
          <p className="text-sm text-gray-600">
            User ID: {(session.user as any)?.id ?? "N/A"}
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Playlist bar */}
      <section className="space-y-3">
        <p className="text-gray-600">
          Paste a public YouTube playlist URL to create a new course.
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
            onClick={onCreate}
            disabled={busy || !url.trim()}
          >
            {busy ? "Creating…" : "Create course"}
          </button>
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
      </section>
    </main>
  );
}
