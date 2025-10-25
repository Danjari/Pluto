"use client";

import VideoCard from "./VideoCard";

type Video = {
  youtubeId: string;
  title: string;
  durationS?: number;
  thumbnailUrl?: string;
};

type Props = {
  title: string;
  videos: Video[];
  getThumb: (v: Video) => string;
  onSelect?: (v: Video) => void;
};

export default function SectionCard({ title, videos, getThumb, onSelect }: Props) {
  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-5">
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">{videos.length} lectures</span>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {videos.map((v) => (
          <VideoCard
            key={v.youtubeId}
            thumb={getThumb(v)}
            title={v.title}
            durationMin={v.durationS ? Math.round(v.durationS / 60) : undefined}
            onClick={() => onSelect?.(v)}
          />
        ))}
      </div>
    </section>
  );
}
