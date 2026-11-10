"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList
} from "recharts";
import { 
  TrendingUp, Users, Calendar as CalendarIcon, DollarSign, Loader2, ArrowUpRight, 
  Award, CreditCard, ChevronRight, X, BarChart3, PieChart as PieChartIcon, Table as TableIcon,
  RefreshCcw, Filter
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

interface ProfData {
  id?: string;
  name: string;
  revenue: number;
}

interface ServiceData {
  id?: string;
  name: string;
  revenue: number;
  count: number;
  color?: string;
}

interface TopClient {
  name: string;
  phone: string;
  totalSpent: number;
  appointmentsCount: number;
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ totalRevenue: 0, totalAppointments: 0, averageTicket: 0, retentionRate: 0 });
  const [profData, setProfData] = useState<ProfData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);

  // Filtering State
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  const [filters, setFilters] = useState({
    professionalId: "",
    serviceId: "",
    clientId: ""
  });

  const [serviceView, setServiceView] = useState<"pie" | "table">("pie");

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [date, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bizResp = await api.get("/businesses/me");
      const bizId = bizResp.data.data.businesses[0]?.id;
      if (!bizId) return;

      const queryParams = new URLSearchParams({
        businessId: bizId,
        ...(date?.from ? { startDate: date.from.toISOString() } : {}),
        ...(date?.to ? { endDate: date.to.toISOString() } : {}),
        ...(filters.professionalId ? { professionalId: filters.professionalId } : {}),
        ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
        ...(filters.clientId ? { clientId: filters.clientId } : {}),
      }).toString();

      const [kpiRes, profRes, servRes, clientRes] = await Promise.allSettled([
        api.get(`/analytics/kpis?${queryParams}`),
        api.get(`/analytics/revenue-by-professional?${queryParams}`),
        api.get(`/analytics/services-profitability?${queryParams}`),
        api.get(`/analytics/top-clients?${queryParams}`),
      ]);

      if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value.data.data);
      if (profRes.status === 'fulfilled') setProfData(profRes.value.data.data || []);
      if (servRes.status === 'fulfilled') setServiceData(servRes.value.data.data || []);
      if (clientRes.status === 'fulfilled') setTopClients(clientRes.value.data.data || []);
      
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: any) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const clearFilters = () => {
    setFilters({ professionalId: "", serviceId: "", clientId: "" });
  };

  const hasActiveFilters = filters.professionalId || filters.serviceId || filters.clientId;

  if (!mounted) return null;

  if (loading && !profData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Calculando métricas VIP...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Indicadores (BI)
            <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black tracking-widest px-2 py-0.5">Analítica Pro</Badge>
          </h2>
          <p className="text-muted-foreground font-medium">Inteligencia de negocios y análisis de rentabilidad avanzada.</p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {hasActiveFilters && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearFilters}
              className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-red-500/20"
            >
              <X className="h-3 w-3 mr-1" /> Limpiar Filtros
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 w-[280px] justify-start text-left font-bold rounded-2xl border-2 transition-all hover:border-primary/50",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd LLL", { locale: es })} -{" "}
                      {format(date.to, "dd LLL, yyyy", { locale: es })}
                    </>
                  ) : (
                    format(date.from, "dd LLL, yyyy", { locale: es })
                  )
                ) : (
                  <span>Seleccionar rango</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[28px] border-none shadow-2xl overflow-hidden" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-2xl shadow-primary/5 bg-gradient-to-br from-primary/10 via-background to-background rounded-[32px] overflow-hidden group">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                 <DollarSign className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none font-bold">Ingresos Reales</Badge>
            </div>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Total Ingresos</p>
            <h3 className="text-3xl font-black text-foreground">{formatCurrency(kpis?.totalRevenue)}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-primary/5 bg-background rounded-[32px] overflow-hidden group">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                 <CalendarIcon className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-none font-bold">Volumen Operativo</Badge>
            </div>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Citas Completadas</p>
            <h3 className="text-3xl font-black text-foreground">{kpis?.totalAppointments || 0} <span className="text-sm font-medium text-muted-foreground text-primary uppercase">servicios</span></h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-primary/5 bg-background rounded-[32px] overflow-hidden group border-b-4 border-b-emerald-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                 <RefreshCcw className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-none font-bold">Fidelización</Badge>
            </div>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Tasa de Retención</p>
            <h3 className="text-3xl font-black text-foreground">{(kpis?.retentionRate || 0).toFixed(1)}%</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Revenue by Professional */}
        <Card className="border-border shadow-xl rounded-[32px] bg-card overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                  <Users className="h-5 w-5 text-primary" /> Total por Profesional
                </CardTitle>
                <CardDescription>Ventas netas generadas por el equipo.</CardDescription>
              </div>
              {filters.professionalId && (
                <Badge className="bg-primary text-white font-black text-[9px] uppercase px-2">Filtrado</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[380px]">
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={profData || []} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      const prof = data.activePayload[0].payload;
                      setFilters(prev => ({ 
                        ...prev, 
                        professionalId: prev.professionalId === (prof.id || prof.name) ? "" : (prof.id || prof.name) 
                      }));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: '900' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: '700' }} 
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'currentColor', opacity: 0.03 }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                    itemStyle={{ fontWeight: '900', color: 'var(--primary)' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    radius={[12, 12, 4, 4]} 
                    barSize={45}
                    className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                  >
                    <LabelList 
                      dataKey="revenue" 
                      position="top" 
                      formatter={(val: any) => `$${(Number(val)/1000).toFixed(0)}k`} 
                      style={{ fontSize: '10px', fontWeight: '900', fill: 'hsl(var(--muted-foreground))' }}
                      dy={-10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Service Profitability */}
        <Card className="border-border shadow-xl rounded-[32px] bg-card overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                  <Award className="h-5 w-5 text-primary" /> Rentabilidad de Servicios
                </CardTitle>
                <CardDescription>Impacto de cada servicio en la facturación.</CardDescription>
              </div>
              <div className="flex items-center bg-muted/20 p-1 rounded-xl gap-1">
                <Button 
                  size="sm" 
                  variant={serviceView === "pie" ? "secondary" : "ghost"} 
                  onClick={() => setServiceView("pie")}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <PieChartIcon className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant={serviceView === "table" ? "secondary" : "ghost"} 
                  onClick={() => setServiceView("table")}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[380px]">
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
            ) : serviceView === "pie" ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="revenue"
                    nameKey="name"
                    onClick={(data: any) => {
                      if (data && data.activePayload && data.activePayload.length > 0) {
                        const svc = data.activePayload[0].payload;
                        setFilters(prev => ({ 
                          ...prev, 
                          serviceId: prev.serviceId === (svc.id || svc.name) ? "" : (svc.id || svc.name) 
                        }));
                      }
                    }}
                  >
                    {(serviceData || []).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || COLORS[index % COLORS.length]} 
                        className="hover:brightness-110 transition-all duration-300 outline-none"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                    itemStyle={{ fontWeight: '900' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <Table style={{ maxHeight: '300px' }}>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-black text-[9px] uppercase tracking-widest px-0">Servicio</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase tracking-widest">Citas</TableHead>
                      <TableHead className="text-right font-black text-[9px] uppercase tracking-widest px-0">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(serviceData || [])].sort((a,b) => b.revenue - a.revenue).map((s, idx) => (
                      <TableRow key={idx} className="border-border/50 hover:bg-muted/10 transition-colors">
                        <TableCell className="font-bold py-3 px-0 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-black text-xs opacity-50">{s.count}</TableCell>
                        <TableCell className="text-right font-black text-xs px-0">{formatCurrency(s.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card className="border-border shadow-xl rounded-[32px] bg-card overflow-hidden">
        <CardHeader className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-black flex items-center gap-2 uppercase tracking-tight">
                <CreditCard className="h-6 w-6 text-primary" /> Ranking VIP (LTV)
              </CardTitle>
              <CardDescription>Clientes con mayor inversión acumulada en el periodo.</CardDescription>
            </div>
            <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-2 h-11 group px-6">
              Exportar BI <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20 border-b border-border">
              <TableRow className="hover:bg-transparent h-14">
                <TableHead className="px-8 font-black uppercase text-[9px] tracking-[0.2em] opacity-40">Posición</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-[0.2em] opacity-40">Cliente VIP</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-[0.2em] opacity-40 text-center">Frecuencia</TableHead>
                <TableHead className="px-8 font-black uppercase text-[9px] tracking-[0.2em] opacity-40 text-right">Inversión Período</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(topClients || []).map((client, index) => (
                <TableRow 
                  key={index} 
                  className="border-border group transition-all hover:bg-primary/5 cursor-pointer"
                  onClick={() => {
                    // Logic to set clientId filter if we have ID
                  }}
                >
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-muted font-black text-xs text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      #{index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-foreground uppercase tracking-tight">{client.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground/60">{client.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    <Badge variant="secondary" className="rounded-xl bg-muted/50 text-foreground border-none px-4 py-1.5 font-black text-[10px] uppercase tracking-tighter">
                      {client.appointmentsCount} citas
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <span className="text-xl font-black text-primary font-outfit">{formatCurrency(client.totalSpent)}</span>
                  </TableCell>
                </TableRow>
              ))}
              {(!topClients || topClients.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic font-bold">
                    No se encontraron transacciones en este periodo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
