"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TenantDashboardIndexPage() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  useEffect(() => {
    if (slug) {
      router.replace(`/b/${slug}/dashboard/pos`);
    }
  }, [slug, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
}
