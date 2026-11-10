import axios from 'axios';
import { API_URL } from '@/lib/api';

// Base64 helper
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(token: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  // En desarrollo el Service Worker está deshabilitado para evitar bucles de caché
  if (process.env.NODE_ENV === 'development') {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (!registrations || registrations.length === 0) {
      return false;
    }

    // 1. Get Service Worker Registration with Timeout
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 8000)
    );

    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      timeout
    ]);

    if (!registration) {
      console.warn('[Web Push] Service Worker no estuvo listo a tiempo.');
      return false;
    }

    // 2. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    // 3. Get or Create Subscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BN4c0O_-vT8GYCGJeUI8W6r20WiasIOFGWt1yJOM6ajlpsNEnuJXzQnBUQ2a8ZJxtIr7jDnte9984ie0b0burgA";

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    // 4. Send to backend
    await axios.post(`${API_URL}/notifications/subscribe`, { subscription }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return true;
  } catch (error) {
    console.warn('[Web Push] No se pudo sincronizar la suscripción push:', error);
    return false;
  }
}
