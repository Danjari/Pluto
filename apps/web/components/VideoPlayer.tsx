// apps/web/components/VideoPlayer.tsx
"use client";

type Props = { youtubeId: string };

export default function VideoPlayer({ youtubeId }: Props) {
  const id = youtubeId.includes("_") ? youtubeId.split("_")[0] : youtubeId;
  const src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border">
      <iframe
        className="w-full h-full"
        src={src}
        title="Course video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
