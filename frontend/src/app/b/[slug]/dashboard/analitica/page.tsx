"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  BarChart2,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TenantAnalyticsPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { user } = useAuthStore();

  const [companyId, setCompanyId] = useState<string | null>(
    user?.companyId || user?.businessId || null
  );
  const [kpis, setKpis] = useState<any | null>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [byCashier, setByCashier] = useState<any[]>([]);
  const [byPayment, setByPayment] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      api.get(`/businesses/${slug}`).then((res) => {
        if (res.data.data?.id) setCompanyId(res.data.data.id);
      }).catch(() => {});
    }
  }, [slug]);

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    Promise.all([
      api.get(`/analytics/kpis?businessId=${companyId}`),
      api.get(`/analytics/services?businessId=${companyId}`),
      api.get(`/analytics/professionals?businessId=${companyId}`),
      api.get(`/analytics/clients?businessId=${companyId}`),
    ])
      .then(([kpiRes, prodRes, cashRes, payRes]) => {
        setKpis(kpiRes.data.data);
        setTopProducts(prodRes.data.data || []);
        setByCashier(cashRes.data.data || []);
        setByPayment(payRes.data.data || []);
      })
      .catch(() => toast.error("Error cargando analítica del comercio"))
      .finally(() => setIsLoading(false));
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-card border border-border p-6 rounded-3xl">
        <h1 className="text-2xl font-black">
          Analítica Financiera y Rotación de Inventario
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Ingresos por Ventas
              </p>
              <p className="text-2xl font-black text-emerald-500 mt-1">
                ${Number(kpis?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Utilidad Bruta Estimada
              </p>
              <p className="text-2xl font-black text-sky-500 mt-1">
                ${Number(kpis?.grossProfit || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Margen: {Number(kpis?.profitMargin || 0).toFixed(1)}%
              </span>
            </div>
            <TrendingUp className="h-8 w-8 text-sky-500" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Tickets Facturados
              </p>
              <p className="text-2xl font-black mt-1">
                {kpis?.totalSales || 0} ventas
              </p>
              <span className="text-[11px] text-muted-foreground">
                Promedio: ${Math.round(Number(kpis?.averageTicket || 0)).toLocaleString()}
              </span>
            </div>
            <ShoppingBag className="h-8 w-8 text-indigo-500" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Alertas Stock Mínimo
              </p>
              <p className="text-2xl font-black text-amber-500 mt-1">
                {kpis?.lowStockCount || 0} prod.
              </p>
              <span className="text-[11px] text-muted-foreground">
                De {kpis?.totalProducts || 0} activos
              </span>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base font-black">
              Top Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aún no hay ventas registradas.
              </p>
            ) : (
              topProducts.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/30 border border-border/50 text-xs"
                >
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-muted-foreground">{item.count} unidades</p>
                  </div>
                  <span className="font-black text-emerald-500">
                    ${Number(item.revenue).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base font-black">
              Ventas por Cajero / Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byCashier.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aún no hay ventas registradas.
              </p>
            ) : (
              byCashier.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/30 border border-border/50 text-xs"
                >
                  <span className="font-bold">{c.name}</span>
                  <span className="font-black text-emerald-500">
                    ${Number(c.revenue).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base font-black">
              Recaudo por Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byPayment.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aún no hay ventas registradas.
              </p>
            ) : (
              byPayment.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/30 border border-border/50 text-xs"
                >
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-muted-foreground">
                      {m.appointmentsCount} transacciones
                    </p>
                  </div>
                  <span className="font-black text-sky-500">
                    ${Number(m.totalSpent).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
