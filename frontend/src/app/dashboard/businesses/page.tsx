"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Settings2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  ShoppingCart,
  Users,
  AtSign,
  Eye,
  EyeOff,
  X,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AVAILABLE_MODULES = [
  { id: "pos", label: "Punto de Venta" },
  { id: "inventario", label: "Inventario y Stock" },
  { id: "categorias", label: "Categorías" },
  { id: "ventas", label: "Historial de Ventas" },
  { id: "usuarios", label: "Usuarios / Colaboradores" },
  { id: "modulos", label: "Módulos y Perfiles" },
  { id: "analitica", label: "Analítica y KPIs" },
  { id: "configuracion", label: "Configuración" },
];

const MODULE_LABELS_MAP: Record<string, string> = Object.fromEntries(
  AVAILABLE_MODULES.map((m) => [m.id, m.label])
);

export default function BusinessesGlobalCenterPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal amplio para crear nuevo comercio
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [nit, setNit] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerUsername, setOwnerUsername] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createModules, setCreateModules] = useState<string[]>(
    AVAILABLE_MODULES.map((m) => m.id)
  );

  // Modal de suscripción y módulos
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subMaxUsers, setSubMaxUsers] = useState(5);
  const [subModules, setSubModules] = useState<string[]>([]);
  const [isUpdatingSub, setIsUpdatingSub] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = async (biz: any) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/b/${biz.slug}/login`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(biz.id);
      toast.success("URL copiada al portapapeles");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("No se pudo copiar la URL");
    }
  };

  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/businesses");
      setBusinesses(res.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar empresas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleNameChange = (val: string) => {
    setCompanyName(val);
    const autoSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setCompanySlug(autoSlug);
  };

  const toggleCreateModule = (modId: string) => {
    setCreateModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !companySlug || !ownerName || !ownerUsername || !ownerPassword) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }
    if (createModules.length === 0) {
      toast.error("Selecciona al menos un módulo para el comercio");
      return;
    }

    setIsCreating(true);
    try {
      await api.post("/auth/register", {
        companyName,
        businessName: companyName,
        companySlug,
        businessSlug: companySlug,
        nit,
        address,
        name: ownerName,
        username: ownerUsername.trim(),
        phone: ownerUsername.trim(),
        email: ownerEmail || undefined,
        password: ownerPassword,
        activeModules: createModules,
      });

      toast.success(`¡Comercio "${companyName}" creado exitosamente!`);
      setIsCreateOpen(false);
      setCompanyName("");
      setCompanySlug("");
      setNit("");
      setAddress("");
      setOwnerName("");
      setOwnerUsername("");
      setOwnerEmail("");
      setOwnerPassword("");
      setCreateModules(AVAILABLE_MODULES.map((m) => m.id));
      fetchBusinesses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear la empresa");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (biz: any) => {
    try {
      await api.patch(`/admin/businesses/${biz.id}/status`, {
        isActive: !biz.isActive,
      });
      toast.success(
        `Comercio ${!biz.isActive ? "activado" : "suspendido"} correctamente`
      );
      fetchBusinesses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error actualizando estado");
    }
  };

  const openSubModal = (biz: any) => {
    setSelectedBusiness(biz);
    setSubMaxUsers(biz.maxUsers || biz.maxProfessionals || 5);
    setSubModules(biz.activeModules || AVAILABLE_MODULES.map((m) => m.id));
    setIsSubModalOpen(true);
  };

  const toggleModule = (modId: string) => {
    setSubModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleSaveSubscription = async () => {
    if (!selectedBusiness) return;
    setIsUpdatingSub(true);
    try {
      await api.patch(`/admin/businesses/${selectedBusiness.id}/subscription`, {
        maxUsers: subMaxUsers,
        maxProfessionals: subMaxUsers,
        activeModules: subModules,
      });
      toast.success("Módulos y plan actualizados para la empresa");
      setIsSubModalOpen(false);
      fetchBusinesses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar suscripción");
    } finally {
      setIsUpdatingSub(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest mb-1">
            Centro de Control Global
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Empresas y Comercios
          </h1>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
        >
          Crear
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((biz) => (
            <Card
              key={biz.id}
              className="rounded-3xl border-2 border-border/70 hover:border-emerald-500/40 transition-all overflow-hidden flex flex-col"
            >
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-black leading-tight">
                      {biz.name}
                    </CardTitle>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      /b/{biz.slug} {biz.nit ? `• NIT: ${biz.nit}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={biz.isActive ? "default" : "destructive"}
                    className={
                      biz.isActive
                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                        : ""
                    }
                  >
                    {biz.isActive ? "ACTIVO" : "SUSPENDIDO"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  {/* Datos del Administrador Dueño */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Administrador Asignado
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {biz.owner?.name || "Sin asignar"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono">
                      <AtSign className="h-3.5 w-3.5" />
                      <span>{biz.owner?.username || biz.owner?.phone || "—"}</span>
                    </div>
                  </div>

                  {/* Contadores en tiempo real */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/50">
                      <Package className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                      <div className="text-base font-black">{biz._count?.products || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Productos</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/50">
                      <ShoppingCart className="h-4 w-4 mx-auto text-sky-500 mb-1" />
                      <div className="text-base font-black">{biz._count?.sales || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Ventas</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/50">
                      <Users className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                      <div className="text-base font-black">
                        {biz._count?.users || 1}/{biz.maxUsers || 5}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Usuarios</div>
                    </div>
                  </div>

                  {/* Módulos Activos */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Módulos Activos ({(biz.activeModules || []).length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(biz.activeModules || []).map((m: string) => (
                        <span
                          key={m}
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        >
                          {MODULE_LABELS_MAP[m] || m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-3 border-t border-border/60 flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/b/${biz.slug}/dashboard/pos`)}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    Abrir POS / Panel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyUrl(biz)}
                    className="rounded-xl"
                    title="Copiar URL del comercio"
                  >
                    {copiedId === biz.id ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSubModal(biz)}
                    className="rounded-xl"
                    title="Configurar Módulos y Plan"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(biz)}
                    className="rounded-xl"
                    title={biz.isActive ? "Suspender empresa" : "Activar empresa"}
                  >
                    {biz.isActive ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ventana Amplia para Crear Comercio */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-border overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-black">Crear comercio</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateBusiness}
              className="p-6 overflow-y-auto space-y-6"
            >
              {/* Datos del Comercio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre del Comercio *</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Identificar URL *</Label>
                  <Input
                    value={companySlug}
                    onChange={(e) => setCompanySlug(e.target.value.toLowerCase())}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>NIT / RUT</Label>
                  <Input
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Dirección del Local</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Credenciales del Administrador */}
              <div className="pt-4 border-t border-border space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-500">
                  Credenciales del Administrador del Comercio
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre Completo *</Label>
                    <Input
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Usuario *</Label>
                    <Input
                      value={ownerUsername}
                      onChange={(e) => setOwnerUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Correo</Label>
                    <Input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Contraseña Inicial *</Label>
                    <div className="relative">
                      <Input
                        type={showCreatePassword ? "text" : "password"}
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword((v) => !v)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showCreatePassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asignación de Módulos */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-500">
                    Asignar Módulos al Comercio ({createModules.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCreateModules(AVAILABLE_MODULES.map((m) => m.id))
                      }
                      className="text-xs font-bold text-emerald-500 hover:underline"
                    >
                      Todos
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() => setCreateModules(["pos"])}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Solo POS
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isSelected = createModules.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleCreateModule(mod.id)}
                        className={`flex items-center text-left gap-2.5 p-3 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-border/60 hover:border-border"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center shrink-0 text-[10px] font-black ${
                            isSelected
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-muted border border-border"
                          }`}
                        >
                          {isSelected && "✓"}
                        </div>
                        <span
                          className={`text-xs leading-tight ${
                            isSelected
                              ? "font-bold text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {mod.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-11 px-6 rounded-2xl font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="h-11 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black"
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Crear"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Asignación de Módulos por Tenant */}
      {isSubModalOpen && selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border-2 border-border overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-emerald-500/5">
              <h3 className="text-xl font-black">Asignación de Módulos y Cupos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Comercio:{" "}
                <span className="font-bold text-emerald-500">
                  {selectedBusiness.name}
                </span>
              </p>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Límite de Usuarios / Cajeros Permitidos
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    value={subMaxUsers}
                    onChange={(e) => setSubMaxUsers(parseInt(e.target.value) || 1)}
                    className="h-11 w-28 text-center font-bold rounded-xl"
                  />
                  <span className="text-sm text-muted-foreground">
                    usuarios activos en la empresa
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Módulos Habilitados
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isAct = subModules.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleModule(mod.id)}
                        className={`flex items-center text-left gap-2.5 p-3 rounded-2xl border-2 transition-all ${
                          isAct
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-border/60 hover:border-border"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ${
                            isAct
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-muted border border-border"
                          }`}
                        >
                          {isAct && "✓"}
                        </div>
                        <span
                          className={`text-xs leading-tight ${
                            isAct ? "font-bold text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {mod.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubModalOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveSubscription}
                disabled={isUpdatingSub}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                {isUpdatingSub ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
