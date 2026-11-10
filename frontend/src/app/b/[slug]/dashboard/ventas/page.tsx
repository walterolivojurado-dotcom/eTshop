"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  Search,
  Eye,
  XCircle,
  Loader2,
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  TrendingUp,
  CalendarRange,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const formatNumber = (value: number | string) => {
  return Number(value || 0)
    .toLocaleString("en-US")
    .replace(/,/g, ".");
};

export default function SalesHistoryPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { user } = useAuthStore();

  const [companyId, setCompanyId] = useState<string | null>(
    user?.companyId || user?.businessId || null
  );
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (slug) {
      api.get(`/businesses/${slug}`).then((res) => {
        if (res.data.data?.id) setCompanyId(res.data.data.id);
      }).catch(() => {});
    }
  }, [slug]);

  const fetchSales = async (cid: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/sales?companyId=${cid}`);
      setSales(res.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error cargando historial de ventas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchSales(companyId);
  }, [companyId]);

  const handleCancelSale = async (saleId: string) => {
    if (!companyId) return;
    setIsCancelling(true);
    try {
      await api.post(`/sales/${saleId}/cancel?companyId=${companyId}`, {
        reason: "Anulación desde arqueo de caja",
        status: "CANCELLED",
      });
      toast.success("Venta anulada y stock restaurado en el inventario automáticamente");
      setSelectedSale(null);
      fetchSales(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al anular venta");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    if (date && endDate && startOfDay(endDate) < startOfDay(date)) {
      setEndDate(date);
      toast.warning("La fecha fin se ajustó para no ser menor a la fecha inicio");
    }
    if (date) setIsStartOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date && startDate && startOfDay(date) < startOfDay(startDate)) {
      toast.error("La fecha fin jamás puede ser menor a la fecha inicio");
      return;
    }
    setEndDate(date);
    if (date) setIsEndOpen(false);
  };

  const filteredSales = sales.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.saleNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.user?.username && s.user.username.toLowerCase().includes(q)) ||
      (s.user?.name && s.user.name.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    const saleDate = new Date(s.createdAt);
    if (startDate && saleDate < startOfDay(startDate)) {
      return false;
    }
    if (endDate && saleDate > endOfDay(endDate)) {
      return false;
    }

    return true;
  });

  const now = new Date();
  const allCompletedSales = sales.filter((s) => s.status === "COMPLETED");
  const salesToday = allCompletedSales.filter((s) => {
    const d = new Date(s.createdAt);
    return d >= startOfDay(now) && d <= endOfDay(now);
  });
  const salesMonth = allCompletedSales.filter((s) => {
    const d = new Date(s.createdAt);
    return d >= startOfMonth(now) && d <= endOfMonth(now);
  });
  const totalDia = salesToday.reduce((acc, s) => acc + Number(s.total), 0);
  const totalMes = salesMonth.reduce((acc, s) => acc + Number(s.total), 0);
  const currentMonthLabel = format(now, "MMMM yyyy", { locale: es });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-card border border-border p-6 rounded-3xl">
        <h1 className="text-2xl font-black">
          Historial de Ventas y Arqueo de Caja
        </h1>
      </div>

      {/* KPIs: Total del Día y Total del Mes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total del Día
                </p>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Hoy • {salesToday.length}{" "}
                  {salesToday.length === 1 ? "venta" : "ventas"}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-black text-emerald-500 tracking-tight">
                ${formatNumber(totalDia)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total del Mes
                </p>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 capitalize">
                  {currentMonthLabel} • {salesMonth.length}{" "}
                  {salesMonth.length === 1 ? "venta" : "ventas"}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-black text-sky-500 tracking-tight">
                ${formatNumber(totalMes)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
              <CalendarRange className="h-6 w-6 text-sky-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por # de factura, cliente o usuario cajero..."
                className="pl-10 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Selector interactivo Fecha Inicio */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Fecha inicio:
                </span>
                <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`cursor-pointer inline-flex items-center justify-between gap-2.5 h-9 px-3.5 rounded-xl border text-sm transition-all ${
                        startDate
                          ? "border-emerald-500/60 bg-emerald-500/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-emerald-500/50 hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>
                          {startDate
                            ? format(startDate, "dd/MM/yyyy", { locale: es })
                            : "dd/mm/aaaa"}
                        </span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-auto p-0 rounded-2xl border border-border shadow-2xl overflow-hidden bg-popover"
                  >
                    <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Fecha de Inicio
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartDateSelect(new Date())}
                          className="cursor-pointer text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                          Hoy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStartDateSelect(startOfMonth(new Date()))
                          }
                          className="cursor-pointer text-[11px] px-2 py-0.5 rounded-lg bg-background border border-border hover:border-emerald-500/50 text-foreground transition-colors"
                        >
                          Este mes
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <Calendar
                        mode="single"
                        locale={es}
                        selected={startDate}
                        defaultMonth={startDate || endDate || new Date()}
                        onSelect={handleStartDateSelect}
                        disabled={
                          endDate ? { after: endOfDay(endDate) } : undefined
                        }
                      />
                    </div>
                    <div className="border-t border-border/60 px-3 py-2 bg-muted/30 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setStartDate(undefined);
                          setIsStartOpen(false);
                        }}
                        className="cursor-pointer text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Borrar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDateSelect(new Date())}
                        className="cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Seleccionar hoy
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selector interactivo Fecha Fin */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Fecha fin:
                </span>
                <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`cursor-pointer inline-flex items-center justify-between gap-2.5 h-9 px-3.5 rounded-xl border text-sm transition-all ${
                        endDate
                          ? "border-emerald-500/60 bg-emerald-500/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-emerald-500/50 hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>
                          {endDate
                            ? format(endDate, "dd/MM/yyyy", { locale: es })
                            : "dd/mm/aaaa"}
                        </span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-auto p-0 rounded-2xl border border-border shadow-2xl overflow-hidden bg-popover"
                  >
                    <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Fecha de Fin
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEndDateSelect(new Date())}
                        className="cursor-pointer text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                      >
                        Hoy
                      </button>
                    </div>
                    <div className="p-2">
                      <Calendar
                        mode="single"
                        locale={es}
                        selected={endDate}
                        defaultMonth={endDate || startDate || new Date()}
                        onSelect={handleEndDateSelect}
                        disabled={
                          startDate
                            ? { before: startOfDay(startDate) }
                            : undefined
                        }
                      />
                    </div>
                    <div className="border-t border-border/60 px-3 py-2 bg-muted/30 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setEndDate(undefined);
                          setIsEndOpen(false);
                        }}
                        className="cursor-pointer text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Borrar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEndDateSelect(new Date())}
                        className="cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Seleccionar hoy
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {(startDate || endDate) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  className="cursor-pointer rounded-xl text-xs font-normal text-muted-foreground hover:text-destructive hover:border-destructive/40"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3.5 font-bold"># Ticket</th>
                  <th className="px-4 py-3.5 font-bold">Fecha y Hora</th>
                  <th className="px-4 py-3.5 font-bold">Cliente</th>
                  <th className="px-4 py-3.5 font-bold">Cajero</th>
                  <th className="px-4 py-3.5 font-bold">Método</th>
                  <th className="px-4 py-3.5 text-right font-bold">Total</th>
                  <th className="px-4 py-3.5 text-center font-bold">Estado</th>
                  <th className="px-4 py-3.5 text-right font-bold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-foreground">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      {sale.saleNumber}
                    </td>
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      {sale.customerName === "Cliente Mostrador"
                        ? ""
                        : sale.customerName || ""}
                    </td>
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      {sale.user?.name}
                    </td>
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      {sale.paymentMethod === "CASH" && "Efectivo"}
                      {sale.paymentMethod === "CARD" && "Tarjeta"}
                      {sale.paymentMethod === "TRANSFER" && "Transferencia"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-normal text-sm text-foreground">
                      ${formatNumber(sale.total)}
                    </td>
                    <td className="px-4 py-3.5 text-center font-normal text-sm text-foreground">
                      {sale.status === "COMPLETED" ? "Completada" : "Anulada"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-normal">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSale(sale)}
                        className="rounded-xl text-sm font-normal text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ver Detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalle de Venta */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              Detalle de Venta {selectedSale?.saleNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-muted/40 border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block">Cliente:</span>
                  <span>
                    {selectedSale.customerName === "Cliente Mostrador"
                      ? ""
                      : selectedSale.customerName || ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Cajero:</span>
                  <span>{selectedSale.user?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Recibido:</span>
                  <span>${formatNumber(selectedSale.amountReceived)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Vuelto entregado:</span>
                  <span className="text-sky-500">
                    ${formatNumber(selectedSale.changeAmount)}
                  </span>
                </div>
              </div>

              <div className="border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold">Producto</th>
                      <th className="px-3 py-2 text-center font-bold">Cant.</th>
                      <th className="px-3 py-2 text-right font-bold">Precio</th>
                      <th className="px-3 py-2 text-right font-bold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-sm text-foreground">
                    {(selectedSale.items || []).map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-normal">{item.productName}</td>
                        <td className="px-3 py-2 text-center font-normal">{item.quantity}</td>
                        <td className="px-3 py-2 text-right font-normal">
                          ${formatNumber(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-normal">
                          ${formatNumber(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="font-bold">Total de la Venta</span>
                <span className="text-xl font-black text-emerald-500">
                  ${formatNumber(selectedSale.total)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedSale?.status === "COMPLETED" && (
              <Button
                type="button"
                variant="destructive"
                disabled={isCancelling}
                onClick={() => handleCancelSale(selectedSale.id)}
                className="rounded-xl"
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1.5" />
                )}
                Anular Venta y Restaurar Stock
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedSale(null)}
              className="rounded-xl"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

