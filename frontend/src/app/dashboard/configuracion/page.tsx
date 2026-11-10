"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, Building2, ExternalLink, Link as LinkIcon, Copy, Globe, Sparkles, X, AlertTriangle, CreditCard, Shield, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api, { getFileUrl } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ThemeSelector } from "@/components/theme-selector";
import { ImageUpload } from "@/components/image-upload";
import { applyDynamicFavicon } from "@/hooks/use-branding";

export default function ConfiguracionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    companyName: "",
    logoUrl: "",
    faviconUrl: "",
    theme: "default"
  });

  const [activeTab, setActiveTab] = useState<"branding" | "payments">("branding");
  const [paymentsData, setPaymentsData] = useState({
    provider: "mercadopago",
    publicKey: "",
    accessToken: "",
    isActive: false
  });
  const [isSavingPayments, setIsSavingPayments] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const { user, isLoading: authLoading } = useAuthStore();

  const hasPaymentsModule = user?.business?.activeModules?.includes('pagos') || business?.activeModules?.includes('pagos') || user?.role === 'SUPERADMIN';

  const sanitizeAssetUrl = (url?: string | null) => {
    if (!url || url.startsWith("/uploads/") || url.startsWith("uploads/")) return "";
    return url;
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'SUPERADMIN' && !slug) {
      toast.info("Redirigiendo a configuración de plataforma...");
      router.push("/dashboard/plataforma");
      return;
    }

    fetchBusinessData();
  }, [slug, user, authLoading]);

  const fetchPaymentConfig = async () => {
    setIsLoadingPayments(true);
    try {
      const response = await api.get("/settings/payment-config");
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        setPaymentsData({
          provider: config.provider || "mercadopago",
          publicKey: config.publicKey || "",
          accessToken: config.accessToken || "",
          isActive: config.isActive !== undefined ? config.isActive : false
        });
      }
    } catch (error) {
      console.error("Error al cargar configuración de pagos:", error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleSavePayments = async () => {
    setIsSavingPayments(true);
    try {
      const response = await api.patch("/settings/payment-config", paymentsData);
      toast.success("¡Configuración de pasarela de pagos actualizada!");
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        setPaymentsData({
          provider: config.provider || "mercadopago",
          publicKey: config.publicKey || "",
          accessToken: config.accessToken || "",
          isActive: config.isActive !== undefined ? config.isActive : false
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al guardar configuración de pagos");
    } finally {
      setIsSavingPayments(false);
    }
  };

  const fetchBusinessData = async () => {
    setIsLoading(true);
    try {
      let biz;
      
      if (slug) {
        const response = await api.get(`/settings/public/${slug}?t=${Date.now()}`);
        biz = response.data.data;
      } else {
        const response = await api.get(`/businesses/me?t=${Date.now()}`);
        const businesses = response.data.data.businesses;
        biz = businesses && businesses.length > 0 ? businesses[0] : null;
      }
      
      if (biz) {
        setBusiness(biz);
        setFormData({
          companyName: biz.companyName || biz.name,
          logoUrl: sanitizeAssetUrl(biz.logoUrl),
          faviconUrl: sanitizeAssetUrl(biz.faviconUrl),
          theme: biz.settings?.theme || "default"
        });
      }
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setIsLoading(false);
    }
  };

  const getClientPortalUrl = () => {
    if (!business?.slug) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/b/${business.slug}/cliente`;
    }
    return `https://schedula-pro-r3wv.vercel.app/b/${business.slug}/cliente`;
  };

  const handleCopyLink = () => {
    const link = getClientPortalUrl();
    navigator.clipboard.writeText(link);
    toast.success("¡Link copiado al portapapeles!");
  };

  const persistBranding = async (nextData: typeof formData, reloadAfter = false) => {
    if (!business) return;
    setIsSaving(true);
    try {
      await api.patch("/settings/branding", {
        businessId: business.id,
        ...nextData
      });
      if (typeof window !== "undefined") {
        const targetSlug = business.slug || slug || "calenbaq";
        localStorage.removeItem(`cb-branding-${targetSlug}`);
        applyDynamicFavicon(nextData.faviconUrl || nextData.logoUrl, targetSlug);
      }
      if (reloadAfter) {
        toast.success("¡Identidad visual actualizada!");
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (error) {
      toast.error("Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    await persistBranding(formData, true);
  };

  const handleLogoChange = async (val: string) => {
    const nextData = { ...formData, logoUrl: val };
    setFormData(nextData);
    await persistBranding(nextData, false);
  };

  const handleFaviconChange = async (val: string) => {
    const nextData = { ...formData, faviconUrl: val };
    setFormData(nextData);
    await persistBranding(nextData, false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const clientUrl = getClientPortalUrl();
  const isPortalDisabled = business?.settings?.clientPortalEnabled === false;

  return (
    <div className="space-y-10 max-w-6xl mx-auto p-6 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-foreground tracking-tight">Configuración</h1>
        <p className="text-muted-foreground font-medium">Personaliza la identidad visual y los canales de reserva de {business?.name || "tu negocio"}.</p>
      </div>

      <div className="flex flex-col gap-10">
        {hasPaymentsModule && (
          <div className="flex gap-2 p-1.5 bg-muted/30 border border-border/50 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("branding")}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${
                activeTab === "branding"
                  ? "bg-card text-foreground shadow-md border border-border/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Identidad & Tema
            </button>
            <button
              onClick={() => {
                setActiveTab("payments");
                fetchPaymentConfig();
              }}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${
                activeTab === "payments"
                  ? "bg-card text-foreground shadow-md border border-border/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pasarela de Pagos
            </button>
          </div>
        )}

        <div className="w-full space-y-10">
          {activeTab === "branding" ? (
            <>
              {/* Identidad Visual */}
              <Card className="border-none shadow-xl bg-card rounded-[32px] overflow-hidden border border-border">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2 font-black">
                        <Building2 className="h-5 w-5 text-primary" />
                        Identidad Visual
                      </CardTitle>
                      <CardDescription className="font-medium mt-1">Logo, icono y nombre de marca</CardDescription>
                    </div>
                    {isSaving && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-8">
                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="companyName" className="font-bold text-foreground ml-1">Nombre Comercial <span className="text-red-500">*</span></Label>
                      <Input 
                        id="companyName"
                        placeholder="Ej. Studio Glam"
                        className="h-14 bg-muted/30 border-border rounded-2xl focus:ring-primary font-bold"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <Label className="font-bold text-foreground ml-1">Logo de la Empresa</Label>
                        <div className="bg-muted/10 p-6 rounded-3xl border-2 border-dashed border-border/50 flex flex-col items-center gap-4 text-center">
                          {formData.logoUrl ? (
                            <div className="relative group">
                              <img 
                                src={getFileUrl(formData.logoUrl)} 
                                alt="Logo" 
                                className="h-24 w-auto object-contain rounded-xl" 
                              />
                              <Button 
                                type="button"
                                variant="destructive" 
                                size="icon" 
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => handleLogoChange("")}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-primary/40" />
                            </div>
                          )}
                          
                          <div className="space-y-2 w-full">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recomendado: PNG Transparente</p>
                            <ImageUpload
                              label=""
                              value={formData.logoUrl}
                              onChange={handleLogoChange}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="font-bold text-foreground ml-1">Favicon / Icono</Label>
                        <div className="bg-muted/10 p-6 rounded-3xl border-2 border-dashed border-border/50 flex flex-col items-center gap-4 text-center">
                          {formData.faviconUrl ? (
                            <div className="relative group">
                              <img 
                                src={getFileUrl(formData.faviconUrl)} 
                                alt="Favicon" 
                                className="h-24 w-auto object-contain rounded-xl" 
                              />
                              <Button 
                                type="button"
                                variant="destructive" 
                                size="icon" 
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => handleFaviconChange("")}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                              <Globe className="h-8 w-8 text-primary/40" />
                            </div>
                          )}

                          <div className="space-y-2 w-full">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Icono de Pestaña</p>
                            <ImageUpload
                              label=""
                              value={formData.faviconUrl}
                              onChange={handleFaviconChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Selector Section */}
              <Card className="border-none shadow-xl bg-card rounded-[32px] overflow-hidden border border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2 font-black">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Motor de Temas Dinámicos
                  </CardTitle>
                  <CardDescription className="font-medium text-xs">Selecciona una estética premium para tu dashboard y portal.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeSelector 
                    currentTheme={formData.theme} 
                    onSelect={(themeId) => setFormData({...formData, theme: themeId})}
                  />
                </CardContent>
              </Card>

              {/* Booking Link Section */}
              {business?.slug && (
                <Card className="border-none shadow-xl bg-primary/5 rounded-[32px] overflow-hidden border-2 border-primary/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2 font-black text-primary">
                      <LinkIcon className="h-5 w-5" />
                      Link de Reserva para Clientes
                    </CardTitle>
                    <CardDescription className="text-primary/70 font-bold">Comparte este link para recibir citas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isPortalDisabled && user?.role !== 'SUPERADMIN' ? (
                      <div className="flex items-start gap-4 bg-amber-500/10 border-2 border-amber-400/30 rounded-2xl p-5">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-black text-sm text-amber-600">Tu portal público está desactivado</p>
                          <p className="text-xs text-amber-700/80 font-medium">
                            El acceso a <span className="font-mono font-bold">/cliente</span> está bloqueado. Contacta a <span className="font-black">eTambook</span> para reactivar tu portal de reservas.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-card p-4 rounded-2xl border-2 border-primary/10 shadow-sm">
                        <div className="flex-1 font-mono font-bold text-sm text-primary truncate">
                          {clientUrl}
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="rounded-xl border-primary/10 text-primary hover:bg-primary/5 shrink-0"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shrink-0"
                          onClick={() => window.open(clientUrl, '_blank')}
                        >
                          Ver Portal <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="pt-6">
                <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-12 h-20 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[28px] font-black text-2xl shadow-2xl shadow-primary/30 transition-all active:scale-95 group"
                  >
                    {isSaving ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-3 h-8 w-8 group-hover:scale-110 transition-transform" />
                        Guardar Cambios
                      </>
                    )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-10 animate-in fade-in-50 duration-300">
              <Card className="border-none shadow-xl bg-card rounded-[32px] overflow-hidden border border-border">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2 font-black">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Configurar Pasarela de Pagos
                      </CardTitle>
                      <CardDescription className="font-medium mt-1">
                        Habilita cobros de abonos para tus citas de forma simple y segura.
                      </CardDescription>
                    </div>
                    {isLoadingPayments && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  {/* Pasarela Switch Habilitación */}
                  <div className="flex items-center justify-between p-6 bg-muted/20 border border-border/50 rounded-3xl">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <span className="font-black text-foreground">Estado de la Pasarela</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Activa o desactiva la exigencia de pagos para las citas de tu negocio globalmente.
                      </p>
                    </div>
                    <button
                      onClick={() => setPaymentsData({ ...paymentsData, isActive: !paymentsData.isActive })}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        paymentsData.isActive ? "bg-emerald-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          paymentsData.isActive ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Selección de Pasarela */}
                  <div className="space-y-4">
                    <Label className="font-bold text-foreground ml-1">Selección de Pasarela</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mercado Pago Option */}
                      <div
                        onClick={() => setPaymentsData({ ...paymentsData, provider: "mercadopago" })}
                        className={`cursor-pointer group flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${
                          paymentsData.provider === "mercadopago"
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5 animate-pulse"
                            : "border-border bg-muted/10 hover:bg-muted/20 hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black transition-all ${
                            paymentsData.provider === "mercadopago" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            MP
                          </div>
                          <div>
                            <p className="font-black text-foreground">Mercado Pago</p>
                            <p className="text-xs text-muted-foreground font-medium">Checkout Pro & link de cobro</p>
                          </div>
                        </div>
                        {paymentsData.provider === "mercadopago" && (
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>

                      {/* Wompi Option */}
                      <div
                        onClick={() => setPaymentsData({ ...paymentsData, provider: "wompi" })}
                        className={`cursor-pointer group flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${
                          paymentsData.provider === "wompi"
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5 animate-pulse"
                            : "border-border bg-muted/10 hover:bg-muted/20 hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black transition-all ${
                            paymentsData.provider === "wompi" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            WP
                          </div>
                          <div>
                            <p className="font-black text-foreground">Wompi</p>
                            <p className="text-xs text-muted-foreground font-medium">Bancolombia & PSE integrado</p>
                          </div>
                        </div>
                        {paymentsData.provider === "wompi" && (
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Llaves / Credenciales */}
                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="publicKey" className="font-bold text-foreground ml-1">
                        Public Key <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="publicKey"
                        placeholder="Ej. APP_USR-xxxxxx o pub_test_xxxxxx"
                        className="h-14 bg-muted/30 border-border rounded-2xl focus:ring-primary font-bold"
                        value={paymentsData.publicKey}
                        onChange={(e) => setPaymentsData({ ...paymentsData, publicKey: e.target.value })}
                      />
                      <p className="text-[11px] text-muted-foreground font-medium ml-1">
                        Llave pública proveída por el portal de desarrolladores de tu pasarela.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="accessToken" className="font-bold text-foreground ml-1">
                        Access Token / Private Key <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accessToken"
                        type="password"
                        placeholder="••••••••••••••••••••••••"
                        className="h-14 bg-muted/30 border-border rounded-2xl focus:ring-primary font-bold"
                        value={paymentsData.accessToken}
                        onChange={(e) => setPaymentsData({ ...paymentsData, accessToken: e.target.value })}
                      />
                      <p className="text-[11px] text-muted-foreground font-medium ml-1">
                        Tu credencial privada. Está protegida con encriptación y se enmascara automáticamente al guardarse.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botón de Guardar Pagos */}
              <div className="pt-6">
                <Button
                  onClick={handleSavePayments}
                  disabled={isSavingPayments || isLoadingPayments}
                  className="w-full sm:w-auto px-12 h-20 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[28px] font-black text-2xl shadow-2xl shadow-primary/30 transition-all active:scale-95 group"
                >
                  {isSavingPayments ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-3 h-8 w-8 group-hover:scale-110 transition-transform" />
                      Guardar Configuración de Pagos
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
