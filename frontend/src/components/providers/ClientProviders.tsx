'use client';

import { ThemeInitializer } from "@/components/theme-initializer";
import { Toaster } from "@/components/ui/sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeInitializer />
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
