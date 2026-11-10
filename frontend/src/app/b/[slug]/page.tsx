"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

export default function BusinessRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/b/${slug}/login`);
      return;
    }

    if (user) {
      router.replace(`/b/${slug}/dashboard/pos`);
    }
  }, [isLoading, isAuthenticated, user, router, slug]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-50 font-outfit">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-zinc-500 font-bold animate-pulse text-lg tracking-tight">Redirigiendo a {slug}...</p>
    </div>
  );
}
