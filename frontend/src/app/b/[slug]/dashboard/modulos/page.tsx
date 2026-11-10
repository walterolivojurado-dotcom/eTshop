"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  ShieldCheck,
  Plus,
  Edit3,
  Loader2,
  Blocks,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const MODULE_LABELS: Record<string, string> = {
  pos: "Punto de Venta",
  inventario: "Inventario y Stock",
  categorias: "Categorías",
  ventas: "Historial de Ventas",
  usuarios: "Usuarios / Colaboradores",
  modulos: "Módulos y Perfiles",
  analitica: "Analítica y KPIs",
  configuracion: "Configuración",
};

export default function ModulesAndRolesPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { user } = useAuthStore();

  const [companyId, setCompanyId] = useState<string | null>(
    user?.companyId || user?.businessId || null
  );
  const [companyModules, setCompanyModules] = useState<any[]>([]);
  const [roleProfiles, setRoleProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [profileName, setProfileName] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["pos", "ventas"]);
  const [isGlobalView, setIsGlobalView] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (slug) {
      api.get(`/businesses/${slug}`).then((res) => {
        if (res.data.data?.id) setCompanyId(res.data.data.id);
      }).catch(() => {});
    }
  }, [slug]);

  const fetchData = async (cid: string) => {
    setIsLoading(true);
    try {
      const [modRes, profRes] = await Promise.all([
        api.get(`/role-profiles/company-modules?companyId=${cid}`),
        api.get(`/role-profiles?companyId=${cid}&includeInactive=true`),
      ]);
      setCompanyModules(modRes.data.data || []);
      setRoleProfiles(profRes.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error cargando módulos y roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchData(companyId);
  }, [companyId]);

  const openNewProfile = () => {
    setEditingProfile(null);
    setProfileName("");
    setSelectedModules(["pos", "ventas"]);
    setIsGlobalView(false);
    setIsModalOpen(true);
  };

  const openEditProfile = (rp: any) => {
    setEditingProfile(rp);
    setProfileName(rp.name);
    setSelectedModules(rp.modules || []);
    setIsGlobalView(rp.isGlobalViewEnabled ?? true);
    setIsModalOpen(true);
  };

  const toggleProfileMod = (code: string) => {
    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !profileName.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        companyId,
        name: profileName.trim(),
        modules: selectedModules,
        isGlobalViewEnabled: isGlobalView,
      };

      if (editingProfile) {
        await api.patch(`/role-profiles/${editingProfile.id}`, payload);
        toast.success("Perfil actualizado");
      } else {
        await api.post("/role-profiles", payload);
        toast.success("Perfil creado exitosamente");
      }

      setIsModalOpen(false);
      fetchData(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al guardar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* SECCIÓN 1: MÓDULOS DE LA EMPRESA (SOLO LECTURA) */}
      <div className="space-y-4">
        <div className="bg-card border border-border p-6 rounded-3xl">
          <h1 className="text-2xl font-black">
            Módulos Activos del Comercio
          </h1>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {companyModules.map((mod) => {
              const label = MODULE_LABELS[mod.code] || mod.name;
              return (
                <Card
                  key={mod.id}
                  className={`rounded-2xl border-2 transition-all ${
                    mod.isEnabled
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border/60 opacity-65"
                  }`}
                >
                  <CardContent className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-sm truncate">{label}</h3>
                      <span
                        className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                          mod.isEnabled
                            ? "text-emerald-500 font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {mod.isEnabled ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 shrink-0" /> Activo
                          </>
                        ) : (
                          "No contratado"
                        )}
                      </span>
                    </div>
                    <Switch
                      checked={Boolean(mod.isEnabled)}
                      disabled
                      aria-readonly="true"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: PERFILES Y PERMISOS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-3xl">
          <div>
            <h2 className="text-xl font-black">
              Perfiles y permisos
            </h2>
          </div>

          <Button
            onClick={openNewProfile}
            className="h-11 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Perfil
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleProfiles.map((rp) => (
            <Card key={rp.id} className="rounded-3xl border-2 border-border/70">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black">{rp.name}</CardTitle>
                <Badge variant="outline">
                  {rp._count?.users || 0} usuarios
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">
                    Módulos Autorizados:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(rp.modules || []).map((m: string) => (
                      <span
                        key={m}
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      >
                        {MODULE_LABELS[m] || m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openEditProfile(rp)}
                    className="rounded-xl text-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Configurar Permisos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal para Crear / Editar Perfil */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {editingProfile ? "Editar Perfil" : "Nuevo Perfil"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre del Perfil *</Label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Selecciona los Módulos Permitidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {companyModules
                  .filter((mod) => mod.isEnabled)
                  .map((mod) => {
                    const checked = selectedModules.includes(mod.code);
                    const label = MODULE_LABELS[mod.code] || mod.name;
                    return (
                      <button
                        key={mod.code}
                        type="button"
                        onClick={() => toggleProfileMod(mod.code)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          checked
                            ? "border-emerald-500 bg-emerald-500/10 font-bold text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {checked ? "✓ " : ""}
                        {label}
                      </button>
                    );
                  })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

