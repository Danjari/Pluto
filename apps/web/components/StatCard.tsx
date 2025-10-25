// apps/web/components/StatCard.tsx
"use client";

type Props = { title: string; value: string; helper?: string };
export default function StatCard({ title, value, helper }: Props) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {helper && <div className="text-xs text-gray-500 mt-1">{helper}</div>}
    </div>
  );
}
