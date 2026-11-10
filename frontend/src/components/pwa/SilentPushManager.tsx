'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { requestNotificationPermission } from '@/lib/pushNotifications';

/**
 * SilentPushManager handles background web push subscription
 * without any UI elements (banners/buttons).
 * It attempts to sync the subscription if permission is already granted.
 */
export function SilentPushManager() {
  const { isAuthenticated, token: accessToken } = useAuthStore();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    const syncSubscription = async () => {
      if (!isAuthenticated || !accessToken) return;
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return;

      if (Notification.permission === 'granted' || Notification.permission === 'default') {
        try {
          await requestNotificationPermission(accessToken);
        } catch (error) {
          console.warn('[SilentPush] Background sync skipped:', error);
        }
      }
    };

    const timer = setTimeout(syncSubscription, 1000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, accessToken]);

  return null;
}
