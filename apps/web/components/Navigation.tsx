"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Navigation() {
  const router = useRouter();
  const { data: session } = useSession();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate opacity and blur based on scroll position
  const opacity = Math.max(0.1, 1 - scrollY / 300); // Fades from 1 to 0.1 over 300px
  const blur = Math.min(20, scrollY / 10); // Increases blur up to 20px

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out border-b border-white/20"
      style={{
        backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        boxShadow: scrollY > 10 ? '0 8px 32px rgba(0, 0, 0, 0.1)' : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-slate-900 font-manrope">
              Pluto
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                
                <Button asChild>
                  <a href="/signin">Log in</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
