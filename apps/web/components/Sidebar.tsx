// apps/web/components/Sidebar.tsx
"use client";

type Video = {
  youtubeId: string;
  title: string;
  durationS?: number;
};

type Section = {
  title: string;
  orderIndex: number;
  videos: Video[];
};

type Props = {
  sections: Section[];
  progress: Record<string, boolean>;
  current: { secIdx: number; vidIdx: number };
  setCurrent: (s: { secIdx: number; vidIdx: number }) => void;
};

export default function Sidebar({ sections, progress, current, setCurrent }: Props) {
  return (
    <aside className="rounded-xl border bg-white p-3 max-h-[78vh] overflow-auto">
      {sections.map((s, si) => {
        const done = s.videos.filter((v) => !!progress[v.youtubeId]).length;
        return (
          <div key={si} className="mb-4">
            <div className="font-medium mb-2">
              Section {si + 1}: {s.title}
              <span className="ml-2 text-xs text-gray-500">
                {done} / {s.videos.length} completed
              </span>
            </div>
            <ul className="space-y-1">
              {s.videos.map((v, vi) => {
                const active = si === current.secIdx && vi === current.vidIdx;
                const isDone = !!progress[v.youtubeId];
                return (
                  <li key={v.youtubeId}>
                    <button
                      className={`w-full text-left px-2 py-2 rounded-lg border
                        ${active ? "border-black bg-gray-50" : "hover:bg-gray-50"}`}
                      onClick={() => setCurrent({ secIdx: si, vidIdx: vi })}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-4 w-4 rounded-full border ${isDone ? "bg-green-600 border-green-600" : "border-gray-400"}`} />
                        <div className="flex-1">
                          <div className="text-sm">{v.title}</div>
                          <div className="text-xs text-gray-500">
                            {v.durationS ? Math.round(v.durationS / 60) : 0} min
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}
