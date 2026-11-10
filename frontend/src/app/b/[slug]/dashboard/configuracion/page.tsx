"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { Settings, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function TenantConfigPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { user, checkAuth } = useAuthStore();

  const [company, setCompany] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [nit, setNit] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api
      .get(`/businesses/${slug}`)
      .then((res) => {
        const c = res.data.data;
        if (c) {
          setCompany(c);
          setName(c.name || "");
          setNit(c.nit || "");
          setAddress(c.address || "");
          setPhone(c.phone || "");
          setReceiptFooter(
            c.settings?.receiptFooter || "¡Gracias por su compra en eTshop!"
          );
          setAllowNegativeStock(Boolean(c.settings?.allowNegativeStock));
        }
      })
      .catch(() => { });
  }, [slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;

    setIsSaving(true);
    try {
      await api.patch(`/businesses/${company.id}`, {
        name: name.trim(),
        nit: nit.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        settings: {
          ...(company.settings || {}),
          receiptFooter,
          allowNegativeStock,
        },
      });
      toast.success("Configuración del comercio actualizada");
      await checkAuth();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error guardando configuración");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-card border border-border p-6 rounded-3xl">
        <h1 className="text-2xl font-black">
          Configuración del Comercio y Ticket POS
        </h1>
      </div>

      <Card className="rounded-3xl border-border">
        <CardHeader>
          <CardTitle className="text-base font-black">
            Datos Generales y Reglas Operativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre Comercial *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>NIT / Identificación Tributaria</Label>
                <Input
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Dirección del Punto de Venta</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono de Contacto</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Mensaje al Pie del Ticket de Venta</Label>
              <Input
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">
                  Permitir Ventas con Stock en Cero / Negativo
                </p>
              </div>
              <Switch
                checked={allowNegativeStock}
                onCheckedChange={setAllowNegativeStock}
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Guardar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
