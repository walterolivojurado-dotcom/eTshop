"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function PWAUpdater() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      toast.info("Nueva versión, actualizar", {
        duration: 8000,
        action: {
          label: "ACTUALIZAR",
          onClick: () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
            window.location.reload();
          },
        },
      });
    };

    navigator.serviceWorker.ready.then((registration) => {
      // Periodic check
      registration.update();
      const interval = setInterval(() => registration.update(), 15 * 60 * 1000);

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              handleUpdate(registration);
            }
          });
        }
      });

      // Handle Serwist specific waiting events if present
      if (window.serwist) {
        window.serwist.addEventListener("waiting", () => handleUpdate(registration));
      }

      return () => clearInterval(interval);
    });

    // Forced reload on controller change
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  return null;
}

declare global {
  interface Window {
    serwist: any;
  }
}
