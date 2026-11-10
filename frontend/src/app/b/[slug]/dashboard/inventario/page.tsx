"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Edit3,
  ArrowUpDown,
  AlertTriangle,
  History,
  Loader2,
  Tags,
  Calendar as CalendarIcon,
  ChevronDown,
  X,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function InventoryPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { user } = useAuthStore();

  const [companyId, setCompanyId] = useState<string | null>(
    user?.companyId || user?.businessId || null
  );
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de Crear / Editar Producto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodBarcode, setProdBarcode] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodCostPrice, setProdCostPrice] = useState("0");
  const [prodSalePrice, setProdSalePrice] = useState("0");
  const [prodStock, setProdStock] = useState("0");
  const [prodMinStock, setProdMinStock] = useState("5");
  const [prodUnit, setProdUnit] = useState("UND");
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Modal de Ajuste de Stock (Kardex)
  const [adjustProduct, setAdjustProduct] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<"PURCHASE" | "ADJUSTMENT" | "RETURN">("PURCHASE");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Modal de Movimientos de Inventario y Filtro por Fecha
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  useEffect(() => {
    async function resolveTenant() {
      if (slug) {
        try {
          const res = await api.get(`/businesses/${slug}`);
          if (res.data.data?.id) setCompanyId(res.data.data.id);
        } catch {}
      }
    }
    resolveTenant();
  }, [slug]);

  const fetchInventoryData = async (cid: string) => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, movRes] = await Promise.all([
        api.get(`/inventory/products?companyId=${cid}&includeInactive=true`),
        api.get(`/inventory/categories?companyId=${cid}`),
        api.get(`/inventory/movements?companyId=${cid}`),
      ]);
      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
      setMovements(movRes.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar inventario");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchInventoryData(companyId);
    }
  }, [companyId]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdName("");
    setProdSku("");
    setProdBarcode("");
    setProdCategoryId(categories[0]?.id || "");
    setProdCostPrice("0");
    setProdSalePrice("0");
    setProdStock("10");
    setProdMinStock("5");
    setProdUnit("UND");
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: any) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdSku(prod.sku || "");
    setProdBarcode(prod.barcode || "");
    setProdCategoryId(prod.categoryId || "");
    setProdCostPrice(String(prod.costPrice));
    setProdSalePrice(String(prod.salePrice));
    setProdStock(String(prod.stock));
    setProdMinStock(String(prod.minStock));
    setProdUnit(prod.unit || "UND");
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !prodName.trim()) return;

    setIsSavingProduct(true);
    try {
      const payload = {
        companyId,
        name: prodName.trim(),
        sku: prodSku.trim() || undefined,
        barcode: prodBarcode.trim() || undefined,
        categoryId: prodCategoryId || null,
        costPrice: Number(prodCostPrice) || 0,
        salePrice: Number(prodSalePrice) || 0,
        stock: Number(prodStock) || 0,
        minStock: Number(prodMinStock) || 0,
        unit: prodUnit || "UND",
      };

      if (editingProduct) {
        await api.patch(`/inventory/products/${editingProduct.id}`, payload);
        toast.success("Producto actualizado correctamente");
      } else {
        await api.post("/inventory/products", payload);
        toast.success("Producto creado en el inventario");
      }

      setIsProductModalOpen(false);
      fetchInventoryData(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error guardando producto");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !adjustProduct || !adjustQty) return;

    const rawQty = Number(adjustQty);
    if (rawQty === 0) {
      toast.error("La cantidad debe ser diferente de 0");
      return;
    }

    setIsAdjusting(true);
    try {
      await api.post(`/inventory/products/${adjustProduct.id}/adjust-stock`, {
        companyId,
        type: adjustType,
        quantity: rawQty,
        notes: adjustNotes.trim() || undefined,
      });

      toast.success(`Existencias de "${adjustProduct.name}" actualizadas`);
      setAdjustProduct(null);
      setAdjustQty("");
      setAdjustNotes("");
      fetchInventoryData(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error ajustando stock");
    } finally {
      setIsAdjusting(false);
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

  const filteredMovements = movements.filter((mov) => {
    const movDate = new Date(mov.createdAt);
    if (startDate && movDate < startOfDay(startDate)) {
      return false;
    }
    if (endDate && movDate > endOfDay(endDate)) {
      return false;
    }
    return true;
  });

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const matchesLow = !lowStockFilter || p.isLowStock;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchesCat && matchesLow && matchesSearch;
  });

  const lowStockTotal = products.filter((p) => p.isLowStock).length;
  const totalValorVenta = products.reduce(
    (acc, p) => acc + Math.max(0, Number(p.stock)) * Number(p.salePrice),
    0
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Gestión de Inventario y Control de Stock
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsMovementsModalOpen(true)}
            className="h-12 px-5 rounded-2xl font-bold"
          >
            <History className="h-5 w-5 mr-2 text-emerald-500" />
            Movimientos de Inventario
          </Button>
          <Button
            onClick={openNewProductModal}
            className="h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-border/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Referencias en Catálogo
              </p>
              <p className="text-2xl font-black mt-1">{products.length}</p>
            </div>
            <Package className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Valorizado en Venta
              </p>
              <p className="text-2xl font-black text-emerald-500 mt-1">
                ${formatNumber(totalValorVenta)}
              </p>
            </div>
            <Tags className="h-8 w-8 text-sky-500" />
          </CardContent>
        </Card>

        <Card
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`rounded-3xl cursor-pointer transition-all ${
            lowStockFilter
              ? "border-2 border-amber-500 bg-amber-500/10"
              : "border-border/80"
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Alertas de Stock Mínimo
              </p>
              <p className="text-2xl font-black text-amber-500 mt-1">
                {lowStockTotal} productos
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Tabla de Productos */}
      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o código de barras..."
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant={lowStockFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className="rounded-xl text-xs font-bold"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Solo Stock Bajo
            </Button>
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
                  <th className="px-4 py-3.5 font-bold">Producto / Código</th>
                  <th className="px-4 py-3.5 font-bold">Categoría</th>
                  <th className="px-4 py-3.5 font-bold">Costo</th>
                  <th className="px-4 py-3.5 font-bold">Precio Venta</th>
                  <th className="px-4 py-3.5 font-bold">Existencia Actual</th>
                  <th className="px-4 py-3.5 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-foreground">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3.5 text-sm text-foreground">
                      <p className="font-bold text-sm text-foreground">
                        {prod.name}
                      </p>
                      <p className="text-xs font-normal text-muted-foreground">
                        SKU: {prod.sku || "—"} • Barras: {prod.barcode || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      {prod.category ? prod.category.name : "General"}
                    </td>
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      ${formatNumber(prod.costPrice)}
                    </td>
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      ${formatNumber(prod.salePrice)}
                    </td>
                    <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                      {prod.stock} {prod.unit} (Mín: {prod.minStock})
                    </td>
                    <td className="px-4 py-3.5 space-x-2 font-normal">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAdjustProduct(prod);
                          setAdjustType("PURCHASE");
                          setAdjustQty("");
                        }}
                        className="rounded-xl text-sm font-normal text-foreground"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                        Ajustar Stock
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditProductModal(prod)}
                        className="rounded-xl text-foreground"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Ventana Aparte: Movimientos de Inventario (Kardex) */}
      <Dialog
        open={isMovementsModalOpen}
        onOpenChange={setIsMovementsModalOpen}
      >
        <DialogContent className="w-[94vw] sm:max-w-[1440px] max-h-[85vh] flex flex-col rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pr-6">
              <DialogTitle className="text-lg font-black">
                Movimientos de Inventario
              </DialogTitle>

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
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="w-[170px] px-4 py-3.5 font-bold whitespace-nowrap">
                    Fecha
                  </th>
                  <th className="w-[28%] min-w-[280px] px-4 py-3.5 font-bold">
                    Producto
                  </th>
                  <th className="w-[100px] px-4 py-3.5 font-bold whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="w-[100px] px-4 py-3.5 text-right font-bold whitespace-nowrap">
                    Cantidad
                  </th>
                  <th className="w-[190px] px-4 py-3.5 text-right font-bold whitespace-nowrap">
                    Stock Anterior → Nuevo
                  </th>
                  <th className="w-[13%] min-w-[150px] px-4 py-3.5 font-bold whitespace-nowrap">
                    Usuario
                  </th>
                  <th className="w-[32%] min-w-[340px] px-4 py-3.5 font-bold">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-foreground">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-muted-foreground text-sm font-normal"
                    >
                      No se encontraron movimientos en el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3.5 font-normal text-sm text-foreground whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                        {mov.product?.name}
                      </td>
                      <td className="px-4 py-3.5 font-normal text-sm text-foreground whitespace-nowrap">
                        {mov.type}
                      </td>
                      <td className="px-4 py-3.5 text-right font-normal text-sm text-foreground whitespace-nowrap">
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-normal text-sm text-foreground whitespace-nowrap">
                        {mov.previousStock} → {mov.newStock}
                      </td>
                      <td className="px-4 py-3.5 font-normal text-sm text-foreground whitespace-nowrap">
                        {mov.user?.username
                          ? String(mov.user.username).replace(/^@+/, "")
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 font-normal text-sm text-foreground">
                        {mov.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DialogFooter className="m-0 px-6 py-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMovementsModalOpen(false)}
              className="rounded-xl"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear / Editar Producto */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {editingProduct ? "Editar Producto" : "Nuevo Producto en Inventario"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre del Producto *</Label>
              <Input
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Código SKU</Label>
                <Input
                  value={prodSku}
                  onChange={(e) => setProdSku(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Código de Barras</Label>
                <Input
                  value={prodBarcode}
                  onChange={(e) => setProdBarcode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <select
                  value={prodCategoryId}
                  onChange={(e) => setProdCategoryId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Unidad de Medida</Label>
                <Input
                  value={prodUnit}
                  onChange={(e) => setProdUnit(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio de Costo</Label>
                <Input
                  type="number"
                  value={prodCostPrice}
                  onChange={(e) => setProdCostPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio de Venta *</Label>
                <Input
                  type="number"
                  value={prodSalePrice}
                  onChange={(e) => setProdSalePrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stock Actual</Label>
                <Input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Alerta Stock Mínimo</Label>
                <Input
                  type="number"
                  value={prodMinStock}
                  onChange={(e) => setProdMinStock(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingProduct}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                {isSavingProduct ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Ajuste de Stock */}
      <Dialog open={!!adjustProduct} onOpenChange={() => setAdjustProduct(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              Ajuste de Existencias: {adjustProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs flex justify-between">
              <span>Stock actual en bodega:</span>
              <strong className="text-emerald-500">
                {adjustProduct?.stock} {adjustProduct?.unit}
              </strong>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de Movimiento</Label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-bold"
              >
                <option value="PURCHASE">Entrada por Compra</option>
                <option value="ADJUSTMENT">Ajuste de Inventario</option>
                <option value="RETURN">Devolución de Cliente</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Observación</Label>
              <Input
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustProduct(null)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isAdjusting}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                {isAdjusting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

