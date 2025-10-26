"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Play, BookOpen, Clock, Users } from "lucide-react";

interface HeroSectionProps {
  url: string;
  setUrl: (url: string) => void;
  onPreview: () => void;
  loading: boolean;
  err: string | null;
}

export default function HeroSection({ url, setUrl, onPreview, loading, err }: HeroSectionProps) {
  const { data: session } = useSession();

  const playlistPlaceholders = [
    "Paste a YouTube playlist URL to get started"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) {
      // Encode the URL and redirect to signin with callbackUrl
      const encodedUrl = encodeURIComponent(url);
      const callbackUrl = encodeURIComponent(`/home?playlistUrl=${encodedUrl}`);
      window.location.href = `/signin?callbackUrl=${callbackUrl}`;
      return;
    }
    onPreview();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Ripple Effect */}
      <BackgroundRippleEffect 
        rows={6} 
        cols={20} 
        cellSize={60}
      />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-12"
        >
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
              Never skip a YouTube course <span className="text-green-600">ever again</span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Turn any YouTube playlist into an interactive learning experience. 
              Organize content, track progress, and create structured courses from your favorite videos.
            </p>
          </motion.div>

          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <BackgroundGradient className="rounded-[22px] p-4 bg-white">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-slate-900">Start Learning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PlaceholdersAndVanishInput
                    placeholders={playlistPlaceholders}
                    onChange={handleInputChange}
                    onSubmit={handleSubmit}
                  />
                  <div className="flex justify-center">
                    <Button
                      onClick={onPreview}
                      disabled={loading || !url.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Preview Course
                        </>
                      )}
                    </Button>
                  </div>
                  {err && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm text-center"
                    >
                      {err}
                    </motion.div>
                  )}
                  {!session && (
                    <p className="text-sm text-slate-500 text-center">
                      You&apos;ll need to sign in to preview and create courses
                    </p>
                  )}
                </CardContent>
              </Card>
            </BackgroundGradient>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            <div className="text-center space-y-4 p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Organized Learning</h3>
              <p className="text-slate-600">Structure your content into logical sections and track your progress</p>
            </div>
            
            <div className="text-center space-y-4 p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Progress Tracking</h3>
              <p className="text-slate-600">Monitor your learning journey with detailed analytics and insights</p>
            </div>
            
            <div className="text-center space-y-4 p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Community</h3>
              <p className="text-slate-600">Share and discover courses with a vibrant learning community</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
