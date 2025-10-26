// apps/web/components/dashboard/TopBar.tsx
"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Home, LogOut } from "lucide-react";

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
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-600 mt-1">
            Manage your learning courses and track your progress
          </p>
        </div>
        {breadcrumb && (
          <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            {breadcrumb}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">

        <Button
          onClick={() => router.push("/home")}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Course
        </Button>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
          title={userName ?? "Sign out"}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
