"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthStore } from "@/lib/auth-store";
import { useBranding } from "@/hooks/use-branding";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface BusinessDashboardLayoutProps {
  children: React.ReactNode;
}

export default function BusinessDashboardLayout({ children }: BusinessDashboardLayoutProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { displayName } = useBranding();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isMounted && !isLoading) {
      if (!isAuthenticated) {
        router.push(`/b/${slug}/login`);
        return;
      }

      const currentUser = useAuthStore.getState().user;

      if (currentUser) {
        // SuperAdmin puede inspeccionar y gestionar cualquier comercio desde el Centro de Control Global
        if (currentUser.role === "SUPERADMIN") {
          return;
        }

        // Aislamiento Multi-Tenant para usuarios de un comercio
        const userBusinessSlug =
          currentUser.company?.slug ||
          currentUser.business?.slug ||
          (currentUser as any).businessSlug;

        if (userBusinessSlug && userBusinessSlug !== slug) {
          const businessModules =
            currentUser.company?.activeModules ||
            currentUser.business?.activeModules || ["pos"];
          const ORDER = [
            "pos",
            "inventario",
            "categorias",
            "ventas",
            "usuarios",
            "modulos",
            "analitica",
            "configuracion",
          ];
          let targetModule = "pos";

          for (const mod of ORDER) {
            if (businessModules.includes(mod)) {
              targetModule = mod;
              break;
            }
          }

          router.push(`/b/${userBusinessSlug}/dashboard/${targetModule}`);
        }
      }
    }
  }, [isMounted, isLoading, isAuthenticated, router, slug]);

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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/50 backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-[10px] sm:text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              {displayName || slug}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-5 relative">
          <div className="mx-auto max-w-[1800px] w-full h-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
