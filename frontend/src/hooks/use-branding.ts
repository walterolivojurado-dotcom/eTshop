import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { API_URL, getFileUrl } from "@/lib/api";
import Cookies from "js-cookie";

export interface BrandingData {
  companyName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  settings?: any;
  isLoaded: boolean;
}

const DEFAULT_BRANDING: BrandingData = {
  companyName: "eTshop",
  logoUrl: null,
  faviconUrl: null,
  settings: {},
  isLoaded: false,
};

/**
 * Actualiza el atributo `href` de los `<link rel="icon">` existentes SIN eliminarlos del DOM,
 * evitando el error `Cannot read properties of null (reading 'removeChild')` de React 19 / Next.js 16.
 */
export function applyDynamicFavicon(rawFaviconUrl?: string | null, fallbackSlug = "etshop") {
  if (typeof document === "undefined") return;

  const resolvedUrl =
    (rawFaviconUrl ? getFileUrl(rawFaviconUrl) : null) ||
    `${API_URL}/settings/favicon?slug=${encodeURIComponent(fallbackSlug)}&t=${Date.now()}`;

  const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
  if (existingIcons.length > 0) {
    existingIcons.forEach((link) => {
      link.href = resolvedUrl;
    });
  }
}

function getInitialBranding(): BrandingData {
  if (typeof window !== "undefined") {
    try {
      const currentPath = window.location.pathname || "";
      let initSlug = "etshop";
      if (currentPath.includes("/b/")) {
        const parts = currentPath.split("/");
        const bIndex = parts.indexOf("b");
        if (bIndex !== -1 && parts[bIndex + 1]) initSlug = parts[bIndex + 1];
      }
      const savedTenant = localStorage.getItem(`etshop-branding-${initSlug}`);
      const savedGlobal = localStorage.getItem("etshop-branding-etshop");
      const parsedTenant = savedTenant ? JSON.parse(savedTenant) : null;
      const parsedGlobal = savedGlobal ? JSON.parse(savedGlobal) : null;

      if (parsedTenant || parsedGlobal) {
        return {
          companyName: parsedTenant?.companyName || parsedGlobal?.companyName || "eTshop",
          logoUrl: parsedTenant?.logoUrl || parsedGlobal?.logoUrl || null,
          faviconUrl: parsedTenant?.faviconUrl || parsedGlobal?.faviconUrl || null,
          settings: parsedTenant?.settings || {},
          isLoaded: true,
        };
      }
    } catch {}
  }
  return DEFAULT_BRANDING;
}

export function useBranding(businessId?: string) {
  const [branding, setBranding] = useState<BrandingData>(getInitialBranding);
  const pathname = usePathname();

  useEffect(() => {
    const currentPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
    let initSlug = "";
    if (currentPath.includes("/b/")) {
      const parts = currentPath.split("/");
      const bIndex = parts.indexOf("b");
      if (bIndex !== -1 && parts[bIndex + 1]) initSlug = parts[bIndex + 1];
    }
    if (!initSlug || (currentPath.startsWith("/dashboard") && !currentPath.includes("/b/"))) {
      initSlug = "etshop";
    }

    const saved = localStorage.getItem(`etshop-branding-${initSlug}`);
    const savedGlobal = localStorage.getItem("etshop-branding-etshop");
    if (saved || savedGlobal) {
      try {
        const parsed = saved ? JSON.parse(saved) : {};
        const parsedGlobal = savedGlobal ? JSON.parse(savedGlobal) : {};
        const mergedLogo = parsed.logoUrl || parsedGlobal.logoUrl || null;
        const mergedFavicon = parsed.faviconUrl || parsedGlobal.faviconUrl || null;
        setBranding({
          companyName: parsed.companyName || parsedGlobal.companyName || "eTshop",
          logoUrl: mergedLogo,
          faviconUrl: mergedFavicon,
          settings: parsed.settings || {},
          isLoaded: Boolean(mergedLogo),
        });
        if (parsed.companyName) {
          document.title = `${parsed.companyName} — eTshop`;
        }
        if (mergedFavicon || mergedLogo) {
          applyDynamicFavicon(mergedFavicon || mergedLogo, initSlug);
        }
      } catch {}
    }

    async function fetchBranding() {
      const slug = initSlug || "etshop";
      const fullUrl = `${API_URL}/settings/public/${slug}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${fullUrl}?t=${Date.now()}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Not found");

        const result = await response.json();
        const data = result.data;

        if (data) {
          const themeId = data.settings?.theme || "default";
          const resolvedLogo = getFileUrl(data.logoUrl || data.platformLogoUrl) || null;
          const resolvedFavicon =
            getFileUrl(data.faviconUrl || data.platformFaviconUrl || data.logoUrl || data.platformLogoUrl) || null;

          const brandingData = {
            companyName: data.companyName || data.name || "eTshop",
            logoUrl: resolvedLogo,
            faviconUrl: resolvedFavicon,
            settings: data.settings || {},
          };

          setBranding({ ...brandingData, isLoaded: true });

          localStorage.setItem(`etshop-branding-${slug}`, JSON.stringify(brandingData));
          if (data.platformLogoUrl || slug === "etshop") {
            localStorage.setItem(
              "etshop-branding-etshop",
              JSON.stringify({
                companyName: data.platformCompanyName || data.companyName || "eTshop",
                logoUrl: getFileUrl(data.platformLogoUrl || data.logoUrl) || null,
                faviconUrl: getFileUrl(data.platformFaviconUrl || data.faviconUrl) || null,
              })
            );
          }
          Cookies.set("cb-theme", themeId, { expires: 365 });

          document.title = `${brandingData.companyName} — eTshop`;
          applyDynamicFavicon(resolvedFavicon || resolvedLogo, slug);
        }
      } catch {
        setBranding((prev) => ({ ...prev, isLoaded: true }));
      }
    }

    fetchBranding();

    const handleBrandingUpdate = () => {
      fetchBranding();
    };
    window.addEventListener("etshop-branding-updated", handleBrandingUpdate);
    return () => {
      window.removeEventListener("etshop-branding-updated", handleBrandingUpdate);
    };
  }, [pathname, businessId]);

  return {
    branding,
    displayName: branding.companyName,
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    loading: !branding.isLoaded,
  };
}
