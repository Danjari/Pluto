"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SectionCard from "@/components/SectionCard";
import { pickThumb } from "@/lib/thumbs";
import { ArrowRight, BookOpen, Users } from "lucide-react";

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
  const { data: session, status } = useSession();

  const [url, setUrl] = useState("");

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);
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
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to preview.");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateCourse() {
    if (!session) {
      // Encode the URL and redirect to signin with callbackUrl
      const encodedUrl = encodeURIComponent(url);
      const callbackUrl = encodeURIComponent(`/home?playlistUrl=${encodedUrl}`);
      window.location.href = `/signin?callbackUrl=${callbackUrl}`;
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
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to create course.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection 
        url={url}
        setUrl={setUrl}
        onPreview={onPreview}
        loading={loading}
        err={err}
      />

      {/* Preview Section */}
      {data && (
        <div className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-4xl font-bold text-slate-900 mb-4">Course Preview</h2>
                <p className="text-xl text-slate-600">Review your course before creating it</p>
              </div>

              <Card className="border-2 border-blue-200 shadow-lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl text-slate-900">{data.title}</CardTitle>
                      <CardDescription className="mt-2 text-slate-600">
                        Playlist ID: <code className="bg-slate-100 px-2 py-1 rounded text-sm">{data.playlistId}</code> •{" "}
                        {data.totalVideos} videos • {totalMinutes(data.totalDurationS)} min total
                      </CardDescription>
                    </div>
                    <Button
                      onClick={onCreateCourse}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-6"
                    >
                      {loading ? "Creating..." : "Create Course"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                {data.description && (
                  <CardContent>
                    <p className="text-slate-600">{data.description}</p>
                  </CardContent>
                )}
              </Card>

              <div className="space-y-6">
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
            </motion.div>
          </div>
        </div>
      )}

      {/* Welcome Section for logged-in users */}
      {session && (
        <div className="py-20 bg-gradient-to-br from-blue-50 to-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <h2 className="text-4xl font-bold text-slate-900">
                Welcome back, {session.user?.name || session.user?.email}!
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Ready to continue your learning journey? Head to your dashboard to manage courses 
                or create a new one from a YouTube playlist.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => router.push("/home")} className="bg-green-600 hover:bg-green-700">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Create New Course
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push("/dashboard")} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Users className="w-5 h-5 mr-2" />
                  View Dashboard
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <span className="text-2xl font-bold">Pluto</span>
            </div>
            <p className="text-slate-300 text-lg">
              Transform your learning experience with structured YouTube courses
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
