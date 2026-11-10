"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ImageUpload } from "@/components/image-upload";
import { applyDynamicFavicon } from "@/hooks/use-branding";

export default function PlatformBrandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [platformEntity, setPlatformEntity] = useState<any>(null);

  const [formData, setFormData] = useState({
    companyName: "eTshop",
    logoUrl: "",
    faviconUrl: "",
  });

  const { user } = useAuthStore();

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/settings/public/etshop?t=${Date.now()}`);
      const data = response.data.data;

      if (data) {
        setPlatformEntity(data);
        setFormData({
          companyName: data.companyName || "eTshop",
          logoUrl: data.logoUrl || "",
          faviconUrl: data.faviconUrl || "",
        });
      }
    } catch {
      toast.error("Error al cargar la identidad global");
    } finally {
      setIsLoading(false);
    }
  };

  const persistBranding = async (nextData: typeof formData, notifySuccess = true) => {
    if (user?.role !== "SUPERADMIN") {
      toast.error("Solo el SuperAdmin puede modificar el logo inmutable de la plataforma.");
      return;
    }

    setIsSaving(true);
    try {
      await api.patch("/settings/branding", {
        businessId: platformEntity?.id || "etshop",
        ...nextData,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("etshop-branding-etshop");
        applyDynamicFavicon(nextData.faviconUrl || nextData.logoUrl, "etshop");
        window.dispatchEvent(new Event("etshop-branding-updated"));
      }

      if (notifySuccess) {
        toast.success("Logo e identidad global de Login actualizados");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al guardar el logo global");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = async (val: string) => {
    const nextData = { ...formData, logoUrl: val };
    setFormData(nextData);
    await persistBranding(nextData, true);
  };

  const handleFaviconChange = async (val: string) => {
    const nextData = { ...formData, faviconUrl: val };
    setFormData(nextData);
    await persistBranding(nextData, true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="bg-card border border-border p-6 rounded-3xl">
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
          Identidad y Logo Global de Login
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-border">
          <CardHeader>
            <CardTitle className="text-lg font-black">
              Logo Oficial de Inicio de Sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="font-bold">
                Título Global en el Login
              </Label>
              <Input
                id="companyName"
                className="h-11 rounded-xl font-bold"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
              />
            </div>

            <ImageUpload
              label="Logo de Login"
              value={formData.logoUrl}
              onChange={handleLogoChange}
            />

            <ImageUpload
              label="Favicon / Icono de Pestaña del Navegador"
              value={formData.faviconUrl}
              onChange={handleFaviconChange}
            />

            <Button
              type="button"
              disabled={isSaving}
              onClick={() => persistBranding(formData, true)}
              className="w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Guardar
            </Button>
          </CardContent>
        </Card>

        {/* Vista Previa en Tiempo Real de cómo se verá en el Login de cualquier empresa */}
        <Card className="rounded-3xl border-border bg-slate-950 text-white overflow-hidden flex flex-col justify-center p-6">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
              Vista Previa del Login
            </span>

            <div className="w-full flex items-center justify-center py-2">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo Global Login"
                  className="w-full max-h-36 object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">Sin logo</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

