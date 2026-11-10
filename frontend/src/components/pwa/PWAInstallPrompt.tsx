'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    } else {
      console.log('User dismissed the PWA install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="bg-foreground text-background p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 border border-background/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-2xl">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight leading-none">Instalar eTambó</span>
            <span className="text-[10px] font-bold opacity-70">Acceso rápido desde tu inicio</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-xl hover:bg-background/10"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleInstall}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xs px-6 h-10 rounded-2xl shadow-lg shadow-primary/40"
          >
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
}
