"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  Plus,
  Edit3,
  Loader2,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TenantStaffUsersPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { user } = useAuthStore();

  const [companyId, setCompanyId] = useState<string | null>(
    user?.companyId || user?.businessId || null
  );
  const [staff, setStaff] = useState<any[]>([]);
  const [roleProfiles, setRoleProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [profileFilter, setProfileFilter] = useState("ALL");

  // Modal Nuevo / Editar Usuario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleProfileId, setRoleProfileId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (slug) {
      api
        .get(`/businesses/${slug}`)
        .then((res) => {
          if (res.data.data?.id) setCompanyId(res.data.data.id);
        })
        .catch(() => {});
    }
  }, [slug]);

  const fetchStaffAndRoles = async (cid: string) => {
    setIsLoading(true);
    try {
      const [staffRes, profilesRes] = await Promise.all([
        api.get(`/staff?companyId=${cid}`),
        api.get(`/role-profiles?companyId=${cid}`),
      ]);
      setStaff(staffRes.data.data || []);
      setRoleProfiles(profilesRes.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error cargando usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchStaffAndRoles(companyId);
  }, [companyId]);

  const filteredStaff = useMemo(() => {
    return staff.filter((u) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProfile =
        profileFilter === "ALL"
          ? true
          : profileFilter === "TOTAL"
            ? !u.roleProfileId
            : u.roleProfileId === profileFilter;

      return matchesSearch && matchesProfile;
    });
  }, [staff, searchTerm, profileFilter]);

  const openNew = () => {
    setEditingUser(null);
    setName("");
    setUsername("");
    setPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRoleProfileId(roleProfiles[0]?.id || "");
    setIsModalOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username || "");
    setPhone(u.phone || "");
    setEmail(u.email || "");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRoleProfileId(u.roleProfileId || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !name.trim() || !username.trim()) return;

    if (!editingUser && !password.trim()) {
      toast.error("Ingresa una contraseña para el nuevo usuario");
      return;
    }

    if (password.trim() || confirmPassword.trim()) {
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: any = {
        companyId,
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role: roleProfileId ? "CASHIER" : "ADMIN",
        roleProfileId: roleProfileId || null,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      if (editingUser) {
        await api.patch(`/staff/${editingUser.id}`, payload);
        toast.success("Usuario actualizado correctamente");
      } else {
        await api.post("/staff", payload);
        toast.success("Usuario creado exitosamente");
      }

      setIsModalOpen(false);
      fetchStaffAndRoles(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al guardar usuario");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (u: any) => {
    if (!companyId) return;
    try {
      await api.patch(`/staff/${u.id}`, {
        companyId,
        isActive: !u.isActive,
      });
      toast.success(`Usuario ${!u.isActive ? "activado" : "inactivado"}`);
      fetchStaffAndRoles(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error cambiando estado");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black">
            Usuarios / Colaboradores
          </h1>
        </div>

        <Button
          onClick={openNew}
          className="h-11 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Buscador y filtro por perfil */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4 rounded-3xl">
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs font-bold">Buscar</Label>
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-3" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Filtrar por Perfil</Label>
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium"
          >
            <option value="ALL">Todos los perfiles</option>
            <option value="TOTAL">Acceso Total</option>
            {roleProfiles.map((rp) => (
              <option key={rp.id} value={rp.id}>
                {rp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="rounded-3xl border-border overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3.5 font-bold">ID</th>
                  <th className="px-4 py-3.5 font-bold">Usuario</th>
                  <th className="px-4 py-3.5 font-bold">Nombre del Usuario</th>
                  <th className="px-4 py-3.5 font-bold">Perfil</th>
                  <th className="px-4 py-3.5 font-bold">Fecha de Creación</th>
                  <th className="px-4 py-3.5 text-center font-bold">Estado</th>
                  <th className="px-4 py-3.5 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-foreground">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-muted-foreground text-sm font-normal"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((u) => {
                    const sequentialId =
                      staff.findIndex((item) => item.id === u.id) + 1;
                    const cleanUsername = String(u.username || "").replace(
                      /^@+/,
                      ""
                    );
                    const formattedDate = u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—";

                    return (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                          {sequentialId}
                        </td>
                        <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                          {cleanUsername}
                        </td>
                        <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                          {u.name}
                        </td>
                        <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                          {u.roleProfile?.name || "Acceso Total"}
                        </td>
                        <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                          {formattedDate}
                        </td>
                        <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                          <div className="flex items-center justify-center gap-2.5">
                            <Switch
                              checked={Boolean(u.isActive)}
                              onCheckedChange={() => toggleActive(u)}
                            />
                            <span className="font-normal text-sm text-foreground">
                              {u.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-normal">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(u)}
                            className="rounded-xl text-sm font-normal text-foreground"
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                            Editar
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre Completo *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Usuario *</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Perfil de Permisos</Label>
              <select
                value={roleProfileId}
                onChange={(e) => setRoleProfileId(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium"
              >
                <option value="">Acceso Total</option>
                {roleProfiles.map((rp) => (
                  <option key={rp.id} value={rp.id}>
                    {rp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {editingUser ? "Nueva Contraseña" : "Contraseña *"}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  {editingUser
                    ? "Confirmar Nueva Contraseña"
                    : "Confirmar Contraseña *"}
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    required={!editingUser || Boolean(password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
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

