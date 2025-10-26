// apps/web/components/dashboard/CourseGrid.tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type CourseCardData = {
  id: string;
  title: string;
  createdAt: string;
  totalVideos: number;
  totalDurationS: number;
  thumb?: string | null;
  completedVideos: number;
  percent: number;
  lastWatchedAt?: string | null;
};

export default function CourseGrid({ initialCourses }: { initialCourses: CourseCardData[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return initialCourses;
    return initialCourses.filter((c) => c.title.toLowerCase().includes(s));
  }, [q, initialCourses]);

  return (
    <section className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses..."
          className="w-full rounded-xl border px-4 py-2 pl-10"
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          No courses match your search.
        </div>
      ) : (
        <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/courses/${c.id}`}
                className="block rounded-2xl overflow-hidden border bg-white hover:shadow-md transition-shadow"
              >
                {/* Intrinsic-sized image (prevents full-screen blow-up) */}
                <div className="bg-gray-100">
                  <Image
                    src={c.thumb || "/placeholder.png"}   // ensure you have a small placeholder file or change this
                    alt={c.title}
                    width={640}
                    height={360}            // 16:9
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={false}
                  />
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-semibold line-clamp-2">{c.title}</h3>
                  <p className="text-sm text-gray-600">{c.totalVideos} videos</p>

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{c.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${c.percent}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      Last watched: {c.lastWatchedAt ? new Date(c.lastWatchedAt).toLocaleString() : "—"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        c.percent === 100 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.percent === 100 ? "Completed" : "In Progress"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
