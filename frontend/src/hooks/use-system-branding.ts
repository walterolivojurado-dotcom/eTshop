import { useState, useEffect } from "react";
import { API_URL, getFileUrl } from "@/lib/api";

export interface BrandingData {
  companyName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  isLoaded: boolean;
}

function getInitialSystemBranding(): BrandingData {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("etshop-branding-etshop");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          companyName: parsed.companyName || "eTshop",
          logoUrl: parsed.logoUrl || null,
          faviconUrl: parsed.faviconUrl || null,
          isLoaded: true,
        };
      }
    } catch {}
  }
  return {
    companyName: "eTshop",
    logoUrl: null,
    faviconUrl: null,
    isLoaded: false,
  };
}

export function useSystemBranding() {
  const [branding, setBranding] = useState<BrandingData>(getInitialSystemBranding);

  useEffect(() => {
    const saved = localStorage.getItem("etshop-branding-etshop");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.logoUrl) {
          setBranding((prev) => ({
            ...prev,
            companyName: parsed.companyName || prev.companyName,
            logoUrl: parsed.logoUrl,
            faviconUrl: parsed.faviconUrl || prev.faviconUrl,
          }));
        }
      } catch {}
    }

    async function fetchSystemBranding() {
      try {
        const slug = "etshop";
        const response = await fetch(`${API_URL}/settings/public/${slug}?t=${Date.now()}`);
        if (!response.ok) throw new Error("System branding not found");

        const result = await response.json();
        const data = result.data;

        if (data) {
          const nextBranding = {
            companyName: data.companyName || data.name || "eTshop",
            logoUrl: getFileUrl(data.logoUrl) || null,
            faviconUrl: getFileUrl(data.faviconUrl) || null,
          };
          setBranding({
            ...nextBranding,
            isLoaded: true,
          });
          localStorage.setItem("etshop-branding-etshop", JSON.stringify(nextBranding));
        }
      } catch {
        setBranding((prev) => ({ ...prev, isLoaded: true }));
      }
    }

    fetchSystemBranding();

    const handleBrandingUpdate = () => {
      fetchSystemBranding();
    };
    window.addEventListener("etshop-branding-updated", handleBrandingUpdate);
    return () => {
      window.removeEventListener("etshop-branding-updated", handleBrandingUpdate);
    };
  }, []);

  return {
    systemName: branding.companyName,
    systemLogoUrl: branding.logoUrl,
    isSystemLoaded: branding.isLoaded,
  };
}
