"use client";

import { useRequireAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  )
}: ProtectedRouteProps) {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
