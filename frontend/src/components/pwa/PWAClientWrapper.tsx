'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const SilentPushManager = dynamic(
  () => import('./SilentPushManager').then(mod => mod.SilentPushManager),
  { ssr: false }
);

const PWAInstallPrompt = dynamic(
  () => import('./PWAInstallPrompt').then(mod => mod.PWAInstallPrompt),
  { ssr: false }
);

const PWAUpdater = dynamic(
  () => import('./PWAUpdater').then(mod => mod.PWAUpdater),
  { ssr: false }
);

export function PWAClientWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // En desarrollo, desregistrar silenciosamente cualquier Service Worker legado
    if (
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  if (!mounted) return null;

  return (
    <>
      <PWAUpdater />
      <PWAInstallPrompt />
      <SilentPushManager />
    </>
  );
}
