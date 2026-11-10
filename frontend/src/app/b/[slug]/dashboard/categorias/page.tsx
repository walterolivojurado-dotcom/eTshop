"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { Plus, Edit3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CategoriesPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { user } = useAuthStore();

  const [companyId, setCompanyId] = useState<string | null>(
    user?.companyId || user?.businessId || null
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#10b981");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (slug) {
      api.get(`/businesses/${slug}`).then((res) => {
        if (res.data.data?.id) setCompanyId(res.data.data.id);
      }).catch(() => {});
    }
  }, [slug]);

  const fetchCategories = async (cid: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/inventory/categories?companyId=${cid}&includeInactive=true`);
      setCategories(res.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error cargando categorías");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchCategories(companyId);
  }, [companyId]);

  const openNew = () => {
    setEditingCat(null);
    setName("");
    setDescription("");
    setColor("#10b981");
    setIsModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setColor(cat.color || "#10b981");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !name.trim()) return;

    setIsSaving(true);
    try {
      if (editingCat) {
        await api.patch(`/inventory/categories/${editingCat.id}`, {
          companyId,
          name: name.trim(),
          description: description.trim() || null,
          color,
        });
        toast.success("Categoría actualizada");
      } else {
        await api.post("/inventory/categories", {
          companyId,
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        });
        toast.success("Categoría creada");
      }
      setIsModalOpen(false);
      fetchCategories(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al guardar categoría");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (cat: any) => {
    if (!companyId) return;

    const currentActive = cat.isActive ?? true;
    const productsCount = cat._count?.products || 0;

    if (currentActive && productsCount > 0) {
      toast.error("No se puede inactivar una categoría que tiene productos asociados");
      return;
    }

    try {
      await api.patch(`/inventory/categories/${cat.id}`, {
        companyId,
        isActive: !currentActive,
      });
      toast.success(`Categoría ${!currentActive ? "activada" : "inactivada"}`);
      fetchCategories(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar estado de la categoría");
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border px-6 py-4 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black">
            Categorías de Productos
          </h1>
        </div>

        <Button
          onClick={openNew}
          className="h-10 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const isActive = cat.isActive ?? true;
            const productsCount = cat._count?.products || 0;

            return (
              <Card
                key={cat.id}
                size="sm"
                className={`rounded-2xl border-2 p-3.5 gap-2.5 justify-between transition-all ${
                  isActive
                    ? "border-border/70"
                    : "border-border/40 opacity-65"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || "#10b981" }}
                      />
                      <h3
                        className="text-sm font-black truncate"
                        title={cat.name}
                      >
                        {cat.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted shrink-0">
                      {productsCount} prod.
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[28px] leading-snug">
                    {cat.description || "Sin descripción"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div
                    className="flex items-center gap-2"
                    title={
                      isActive && productsCount > 0
                        ? "No se puede inactivar porque tiene productos asociados"
                        : undefined
                    }
                  >
                    <Switch
                      size="sm"
                      checked={Boolean(isActive)}
                      onCheckedChange={() => handleToggleActive(cat)}
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                      {isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(cat)}
                    className="h-7 px-2.5 rounded-lg text-xs"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {editingCat ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color Identificador en el POS</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-16 rounded-lg cursor-pointer border border-border"
                />
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
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

