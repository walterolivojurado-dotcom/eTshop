"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkAuth();
  }, [checkAuth, pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!isLoading && isAuthenticated && user) {
      if (user.role !== "SUPERADMIN") {
        const userBusinessSlug =
          user.company?.slug || user.business?.slug || (user as any).businessSlug;
        if (userBusinessSlug) {
          router.push(`/b/${userBusinessSlug}/dashboard/pos`);
        } else {
          router.push("/login");
        }
        return;
      }

      if (pathname === "/dashboard") {
        router.push("/dashboard/businesses");
      }
    }
  }, [isMounted, isLoading, isAuthenticated, user, pathname, router]);

  if (!isMounted || isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card/50 backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <h1 className="text-sm font-bold text-muted-foreground">
              Centro de Control Global
            </h1>
          </div>
        </header>
        <main className="flex-1 p-6 relative">
          <div className="mx-auto max-w-[1600px] w-[95%] h-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
