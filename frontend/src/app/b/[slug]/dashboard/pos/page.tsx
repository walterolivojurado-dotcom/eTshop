"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Receipt,
  Loader2,
  AlertTriangle,
  User,
  Printer,
  TrendingUp,
  CalendarRange,
} from "lucide-react";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface CartItem {
  productId: string;
  name: string;
  sku?: string;
  unitPrice: number;
  stock: number;
  unit: string;
  quantity: number;
}

export default function PosTerminalPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { user } = useAuthStore();

  const [companyId, setCompanyId] = useState<string | null>(
    user?.companyId || user?.businessId || null
  );
  const [companyInfo, setCompanyInfo] = useState<any>(user?.company || null);

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Carrito de Venta
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerDoc, setCustomerDoc] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal de Recibo / Ticket generado
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function initTenant() {
      try {
        if (slug) {
          const res = await api.get(`/businesses/${slug}`);
          const comp = res.data.data;
          if (comp?.id) {
            setCompanyId(comp.id);
            setCompanyInfo(comp);
          }
        } else if (user?.companyId) {
          setCompanyId(user.companyId);
        }
      } catch {
        // Fallback silencioso a companyId del usuario autenticado
        if (user?.companyId) {
          setCompanyId(user.companyId);
        }
      }
    }
    initTenant();
  }, [slug, user?.companyId]);

  const loadPosCatalog = async (cid: string) => {
    setIsLoading(true);
    try {
      const [catRes, prodRes, salesRes] = await Promise.all([
        api.get(`/inventory/categories?companyId=${cid}`),
        api.get(`/inventory/products?companyId=${cid}`),
        api.get(`/sales?companyId=${cid}`).catch(() => ({ data: { data: [] } })),
      ]);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setSales(salesRes.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error cargando catálogo POS");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadPosCatalog(companyId);
    }
  }, [companyId]);

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.warning(`"${product.name}" no tiene existencias disponibles.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          toast.warning(`Stock máximo disponible para "${product.name}": ${product.stock}`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku || undefined,
          unitPrice: Number(product.salePrice),
          stock: Number(product.stock),
          unit: product.unit || "UND",
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty > item.stock) {
            toast.warning(`Solo hay ${item.stock} unidades disponibles`);
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Búsqueda por lector de código de barras (Enter agrega directo al carrito)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const exactMatch = products.find(
        (p) =>
          p.barcode?.toLowerCase() === q ||
          p.sku?.toLowerCase() === q ||
          p.name.toLowerCase() === q
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery("");
        toast.success(`Agregado: ${exactMatch.name}`);
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const total = Math.max(0, subtotal - discount);
  const received =
    paymentMethod === "CASH"
      ? Number(amountReceived) || 0
      : total;
  const changeAmount = Math.max(0, received - total);

  const quickBills = [5000, 10000, 20000, 50000, 100000];

  const now = new Date();
  const completedSales = sales.filter((s) => s.status === "COMPLETED");
  const salesToday = completedSales.filter((s) => {
    const d = new Date(s.createdAt);
    return d >= startOfDay(now) && d <= endOfDay(now);
  });
  const salesMonth = completedSales.filter((s) => {
    const d = new Date(s.createdAt);
    return d >= startOfMonth(now) && d <= endOfMonth(now);
  });
  const totalDia = salesToday.reduce((acc, s) => acc + Number(s.total), 0);
  const totalMes = salesMonth.reduce((acc, s) => acc + Number(s.total), 0);
  const currentMonthLabel = format(now, "MMMM yyyy", { locale: es });

  const handleCheckout = async () => {
    if (!companyId) return;
    if (cart.length === 0) {
      toast.error("El carrito de venta está vacío");
      return;
    }

    if (paymentMethod === "CASH" && received < total) {
      toast.error(
        `El efectivo recibido ($${formatNumber(received)}) es menor al total ($${formatNumber(total)})`
      );
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.post("/sales", {
        companyId,
        customerName: customerName.trim() || undefined,
        customerDoc: customerDoc.trim() || undefined,
        paymentMethod,
        amountReceived: received,
        discountAmount: discount,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      const sale = res.data.data;
      setCompletedSale(sale);
      setCart([]);
      setAmountReceived("");
      setDiscountAmount("0");
      setCustomerName("");
      setCustomerDoc("");
      toast.success(`¡Venta ${sale.saleNumber} registrada y stock actualizado!`);
      loadPosCatalog(companyId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al procesar la venta");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA IZQUIERDA: CATÁLOGO DE PRODUCTOS Y BUSCADOR DE CÓDIGO DE BARRAS */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Tarjetas Destacadas: Total del Día y Total del Mes */}
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

          <div className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  Terminal Punto de Venta
                </h1>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 w-fit">
                Cajero: {user?.name}
              </Badge>
            </div>

            {/* Buscador por nombre, SKU o lector de código de barras */}
            <div className="relative">
              <Barcode className="absolute left-3.5 top-3.5 h-5 w-5 text-emerald-500" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar producto o código de barras..."
                className="pl-11 h-12 rounded-2xl text-base border-2 focus-visible:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Filtro por Categorías (Distribución envolvente y directa sin barra de scroll) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-500 shadow-sm"
                    : "bg-background hover:bg-muted text-foreground border-border/80 hover:border-emerald-500/50"
                }`}
              >
                <span>Todos</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                    selectedCategory === "ALL"
                      ? "bg-slate-950/20 text-slate-950"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const catCount = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                      isSelected
                        ? "shadow-sm text-white font-bold"
                        : "bg-background hover:bg-muted text-foreground border-border/80 hover:border-emerald-500/50"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: cat.color || "#10b981",
                            borderColor: cat.color || "#10b981",
                            color: "#ffffff",
                          }
                        : {}
                    }
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || "#10b981" }}
                    />
                    <span>{cat.name}</span>
                    {catCount > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                          isSelected
                            ? "bg-black/25 text-white font-bold"
                            : "bg-muted text-muted-foreground font-normal"
                        }`}
                      >
                        {catCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grilla de Productos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-2">
              <Search className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-bold text-base">No se encontraron productos</p>
              <p className="text-xs text-muted-foreground">
                Intenta con otro término o verifica el inventario.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.productId === product.id);
                const outOfStock = product.stock <= 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                    className={`group text-left p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[148px] relative overflow-hidden ${
                      outOfStock
                        ? "opacity-50 bg-muted/40 border-border cursor-not-allowed"
                        : inCart
                        ? "bg-emerald-500/10 border-emerald-500 shadow-md"
                        : "bg-card border-border/80 hover:border-emerald-500/60 hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-muted text-muted-foreground truncate max-w-[120px]">
                          {product.brand ? product.brand : (product.barcode || "GENERAL")}
                        </span>
                        {inCart && (
                          <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2 text-foreground">
                        {product.name}
                      </h3>
                      {product.sku && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Línea:
                          </span>
                          <span className="font-semibold text-foreground/90 truncate">
                            {product.sku}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-border/50 flex items-end justify-between gap-1">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Precio
                        </span>
                        <span className="text-sm sm:text-base font-black text-emerald-500">
                          ${formatNumber(product.salePrice)}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            outOfStock
                              ? "bg-red-500/15 text-red-500"
                              : product.isLowStock
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {product.isLowStock && !outOfStock && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {product.stock} {product.unit}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: CUENTA ACTUAL, CÁLCULO DE VUELTO Y PAGO */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-4">
          <Card className="rounded-3xl border-2 border-border shadow-xl overflow-hidden">
            <div className="p-4 bg-emerald-500/10 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base">Ticket de Caja Actual</h2>
              </div>
              {cart.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCart([])}
                  className="h-8 text-xs text-red-500 hover:text-red-600"
                >
                  Vaciar
                </Button>
              )}
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Datos rápidos del cliente */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Cliente
                  </Label>
                  <div className="relative mt-1">
                    <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-8 h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Cédula / NIT
                  </Label>
                  <Input
                    value={customerDoc}
                    onChange={(e) => setCustomerDoc(e.target.value)}
                    className="mt-1 h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Lista de items en el carrito */}
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 border-y border-border py-3">
                {cart.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground space-y-1">
                    <ShoppingCart className="h-8 w-8 mx-auto opacity-40" />
                    <p className="text-xs font-semibold">
                      Selecciona productos para iniciar la venta
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-muted/40 border border-border/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{item.name}</p>
                        {item.sku && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Línea:</span> {item.sku}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          ${formatNumber(item.unitPrice)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, -1)}
                          className="h-7 w-7 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, 1)}
                          className="h-7 w-7 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[75px]">
                        <p className="text-xs font-black text-emerald-500">
                          ${formatNumber(item.unitPrice * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-[10px] text-red-500 hover:underline inline-flex items-center gap-0.5"
                        >
                          <Trash2 className="h-2.5 w-2.5" /> Quitar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Método de Pago */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Método de Pago
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`flex flex-col items-center p-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                      paymentMethod === "CASH"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <Banknote className="h-4 w-4 mb-1" />
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={`flex flex-col items-center p-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                      paymentMethod === "TRANSFER"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="h-4 w-4 mb-1" />
                    Transferencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`flex flex-col items-center p-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                      paymentMethod === "CARD"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mb-1" />
                    Tarjeta
                  </button>
                </div>
              </div>

              {/* Efectivo Recibido y Cálculo Automático de Vuelto */}
              {paymentMethod === "CASH" && (
                <div className="space-y-2 p-3 rounded-2xl bg-muted/30 border border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Efectivo Recibido
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={
                          amountReceived !== ""
                            ? formatNumber(amountReceived)
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          setAmountReceived(raw);
                        }}
                        className="mt-1 h-10 font-black text-base rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Descuento
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={
                          discountAmount !== ""
                            ? formatNumber(discountAmount)
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          setDiscountAmount(raw || "0");
                        }}
                        className="mt-1 h-10 font-bold text-sm rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Billetes rápidos */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setAmountReceived(String(total))}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                    >
                      Exacto
                    </button>
                    {quickBills.map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setAmountReceived(String(bill))}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-background border border-border hover:border-emerald-500"
                      >
                        ${formatNumber(bill)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen Total y Vuelto */}
              <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>${formatNumber(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-amber-400">
                    <span>Descuento</span>
                    <span>-${formatNumber(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Total a Cobrar
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    ${formatNumber(total)}
                  </span>
                </div>
                {paymentMethod === "CASH" && (
                  <div className="flex justify-between items-center pt-1 text-sm font-bold text-sky-400">
                    <span>Cambio / Vuelto a entregar:</span>
                    <span className="text-lg font-black">
                      ${formatNumber(changeAmount)}
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="button"
                disabled={isProcessing || cart.length === 0}
                onClick={handleCheckout}
                className="w-full h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Registrando venta...
                  </>
                ) : (
                  "Facturar"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmación / Ticket de Venta */}
      <Dialog open={!!completedSale} onOpenChange={() => setCompletedSale(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500 font-black">
              <CheckCircle2 className="h-6 w-6" />
              ¡Venta Registrada Exitosamente!
            </DialogTitle>
          </DialogHeader>

          {completedSale && (
            <div className="p-4 rounded-2xl bg-muted/40 border border-border font-mono text-xs space-y-3">
              <div className="text-center border-b border-border pb-2">
                <p className="font-black text-sm uppercase">
                  {companyInfo?.name || "eTshop Comercio"}
                </p>
                <p className="text-muted-foreground">
                  Ticket: <strong>{completedSale.saleNumber}</strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(completedSale.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                {completedSale.customerName && (
                  <p>Cliente: {completedSale.customerName}</p>
                )}
                <p>
                  Atendió: {completedSale.user?.name} ({completedSale.user?.username})
                </p>
                <p>Método: {completedSale.paymentMethod}</p>
              </div>

              <div className="border-y border-border py-2 space-y-1">
                {(completedSale.items || []).map((it: any) => (
                  <div key={it.id} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.productName}
                    </span>
                    <span className="font-bold">
                      ${formatNumber(it.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-sm font-black">
                  <span>TOTAL PAGADO:</span>
                  <span className="text-emerald-500">
                    ${formatNumber(completedSale.total)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Recibido:</span>
                  <span>${formatNumber(completedSale.amountReceived)}</span>
                </div>
                <div className="flex justify-between font-bold text-sky-500">
                  <span>Cambio / Vuelto:</span>
                  <span>${formatNumber(completedSale.changeAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="rounded-xl"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir Ticket
            </Button>
            <Button
              type="button"
              onClick={() => setCompletedSale(null)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            >
              Nueva Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

