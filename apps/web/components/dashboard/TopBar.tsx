// apps/web/components/dashboard/TopBar.tsx
"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TopBar({
  appTitle,
  breadcrumb,
  userName,
}: {
  appTitle: string;
  breadcrumb?: string;
  userName?: string | null;
}) {
  const router = useRouter();
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold">
          <span className="text-red-600">{appTitle}</span>
        </h1>
        {breadcrumb && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {breadcrumb}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 border rounded-lg hover:bg-gray-50"
          onClick={() => router.push("/")}
        >
          Home
        </button>
        <button
          className="px-3 py-2 bg-black text-white rounded-lg"
          onClick={() => router.push("/home")}
        >
          Add New Course
        </button>
        <button
          className="px-3 py-2 border rounded-lg hover:bg-gray-50"
          onClick={() => signOut({ callbackUrl: "/" })}
          title={userName ?? "Sign out"}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
