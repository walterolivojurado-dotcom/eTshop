"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

export default function GlobalDashboardIndexPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === "SUPERADMIN") {
      router.replace("/dashboard/businesses");
    } else if (user?.company?.slug || user?.business?.slug) {
      const slug = user.company?.slug || user.business?.slug;
      router.replace(`/b/${slug}/dashboard/pos`);
    } else {
      router.replace("/dashboard/businesses");
    }
  }, [user, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
}
