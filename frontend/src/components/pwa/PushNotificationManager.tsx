'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestNotificationPermission } from '@/lib/pushNotifications';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

export function PushNotificationManager() {
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthenticated, token: accessToken, user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'default'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    // If permission is already granted, try to sync subscription in background
    if (Notification.permission === 'granted' && isAuthenticated && accessToken) {
      requestNotificationPermission(accessToken).catch(console.warn);
    }

    // Show banner if permission is default and user is authenticated (especially for clients)
    if (Notification.permission === 'default' && isAuthenticated) {
      // Radical persistence: Check if user already dismissed or subscribed
      const dismissed = localStorage.getItem('pwa_notifications_dismissed');
      const subscribed = localStorage.getItem('pwa_subscribed');
      
      if (dismissed !== 'true' && subscribed !== 'true') {
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isMounted, isAuthenticated, accessToken]);

  // Sync isVisible state with localStorage/permission changes
  useEffect(() => {
    if (!isMounted) return;
    
    const dismissed = localStorage.getItem('pwa_notifications_dismissed');
    const subscribed = localStorage.getItem('pwa_subscribed');

    if (dismissed === 'true' || subscribed === 'true' || permission === 'granted' || permission === 'denied') {
      setIsVisible(false);
    }
  }, [isMounted, permission]);

  const handleRequestPermission = async () => {
    if (!accessToken) return;
    
    // IMMEDIATE FEEDBACK: Close banner and mark as dismissed locally BEFORE async work
    setIsVisible(false);
    localStorage.setItem('pwa_notifications_dismissed', 'true');
    
    setIsSubmitting(true);

    try {
      const success = await requestNotificationPermission(accessToken);
      if (typeof window !== 'undefined') {
        setPermission(Notification.permission);
        if (success) {
          localStorage.setItem('pwa_subscribed', 'true');
        }
      }
      
      if (success) {
        import('sonner').then(({ toast }) => toast.success('¡Suscripción exitosa! Ya recibirás recordatorios.'));
      } else if (Notification.permission === 'denied') {
        import('sonner').then(({ toast }) => toast.error('Permiso denegado. Revisa los ajustes de tu celular.'));
      }
    } catch (error: any) {
      console.error('Error requesting notification permission:', error);
      const msg = error.message || 'Error desconocido';
      import('sonner').then(({ toast }) => toast.error(`Nota: ${msg}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show for authenticated users (Clients or Professionals) who haven't decided yet
  if (!isMounted || !isVisible || !isAuthenticated || permission !== 'default') return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700 sm:left-auto sm:right-6 sm:w-96">
      <div className="bg-card border-2 border-primary/20 p-5 rounded-[32px] shadow-2xl backdrop-blur-xl relative overflow-hidden group" suppressHydrationWarning>
        {/* Decorative background element */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
        
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl shrink-0">
            <Bell className="h-6 w-6 text-primary animate-ring" />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-foreground uppercase tracking-tight">Recordatorios de Citas</h4>
              <button 
                onClick={() => {
                  localStorage.setItem('pwa_notifications_dismissed', 'true');
                  setIsVisible(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
              No te pierdas ninguna cita. Activa las notificaciones para recibir confirmaciones y recordatorios 2 horas antes.
            </p>
            <div className="pt-3">
              <Button 
                onClick={handleRequestPermission}
                disabled={isSubmitting}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Activar Notificaciones"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .animate-ring {
          animation: ring 2s infinite;
          transform-origin: top center;
        }
      `}</style>
    </div>
  );
}
