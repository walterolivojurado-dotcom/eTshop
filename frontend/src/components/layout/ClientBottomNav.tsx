"use client";

import React from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Calendar, History, User, LogOut, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ClientBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const slug = params?.slug as string;
  const { logout } = useAuthStore();
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false);

  const navItems = [
    {
      label: "Agendar",
      icon: LayoutGrid,
      href: `/b/${slug}/cliente`,
    },
    {
      label: "Citas",
      icon: History,
      href: `/b/${slug}/cliente/citas`,
    },
    {
      label: "Perfil",
      icon: User,
      href: `/b/${slug}/cliente/perfil`,
    },
    {
      label: "Salir",
      icon: LogOut,
      onClick: () => setIsLogoutOpen(true),
      className: "text-destructive"
    },
  ];

  return (
    <>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg bg-background/60 backdrop-blur-2xl border border-border/50 z-[100] h-20 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden">
        <div className="grid grid-cols-4 h-full px-2">
          {navItems.map((item) => {
            const isActive = item.href ? pathname === item.href : false;
            const Icon = item.icon;
            
            return (
              <button
                key={item.label}
                onClick={item.onClick ? item.onClick : () => router.push(item.href!)}
                className="flex flex-col items-center justify-center gap-1 transition-all relative group"
              >
                <div className={cn(
                  "p-2.5 rounded-2xl transition-all duration-500",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-110" 
                    : cn("text-muted-foreground group-hover:bg-muted/50", item.className)
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-[9px] font-semibold uppercase tracking-widest transition-all duration-300",
                  isActive ? "text-primary translate-y-0.5" : "text-muted-foreground/40"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-in zoom-in duration-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="max-w-[320px] rounded-[24px] p-6 text-center">
          <DialogHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-2">
              <LogOut className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">¿Cerrar Sesión?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Estás a punto de salir de tu cuenta. Tendrás que ingresar tus datos nuevamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 mt-4">
            <Button 
               variant="default"
               className="h-12 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90"
               onClick={() => logout()}
            >
              Cerrar Sesión
            </Button>
            <Button 
               variant="ghost"
               className="h-12 rounded-xl font-semibold text-muted-foreground"
               onClick={() => setIsLogoutOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
