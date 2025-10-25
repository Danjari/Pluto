"use client";

type Props = {
  thumb: string;
  title: string;
  durationMin?: number;
  onClick?: () => void;
};

export default function VideoCard({ thumb, title, durationMin, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl overflow-hidden border bg-white hover:shadow-md transition-shadow"
    >
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <div className="line-clamp-2 font-medium">{title}</div>
        {typeof durationMin === "number" && (
          <div className="text-xs text-gray-500 mt-1">{durationMin} min</div>
        )}
      </div>
    </button>
  );
}
