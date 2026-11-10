"use client";

import * as React from "react";
import {
  ShoppingCart,
  Package,
  Tags,
  Receipt,
  Users,
  ShieldCheck,
  BarChart2,
  Settings,
  LogOut,
  LayoutDashboard,
  Store,
  User,
  AtSign,
} from "lucide-react";
import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api, { getFileUrl } from "@/lib/api";
import { useSystemBranding } from "@/hooks/use-system-branding";
import { useBranding } from "@/hooks/use-branding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuthStore();
  const { systemLogoUrl, isSystemLoaded } = useSystemBranding();
  const { logoUrl: tenantLogoUrl, loading: tenantBrandingLoading } = useBranding();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { isMobile, setOpenMobile } = useSidebar();

  const urlSlug = typeof params?.slug === "string" ? params.slug : null;
  const isTenantRoute = Boolean(pathname?.startsWith("/b/") && urlSlug);
  const isGlobalCenter = !isTenantRoute;
  const slug = urlSlug || user?.company?.slug || user?.business?.slug;

  const [tenantActiveModules, setTenantActiveModules] = React.useState<string[] | null>(() => {
    if (typeof window !== "undefined" && urlSlug) {
      try {
        const cached = localStorage.getItem(`etshop-modules-${urlSlug}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  React.useEffect(() => {
    if (!isTenantRoute || !urlSlug) {
      setTenantActiveModules(null);
      return;
    }

    try {
      const cached = localStorage.getItem(`etshop-modules-${urlSlug}`);
      if (cached) {
        setTenantActiveModules(JSON.parse(cached));
      }
    } catch {}

    const fetchTenantModules = () => {
      api
        .get(`/businesses/${urlSlug}`)
        .then((res) => {
          const mods = res.data?.data?.activeModules;
          if (Array.isArray(mods)) {
            setTenantActiveModules(mods);
            try {
              localStorage.setItem(`etshop-modules-${urlSlug}`, JSON.stringify(mods));
            } catch {}
          }
        })
        .catch(() => {});
    };

    fetchTenantModules();
    window.addEventListener("etshop-modules-updated", fetchTenantModules);
    return () => {
      window.removeEventListener("etshop-modules-updated", fetchTenantModules);
    };
  }, [isTenantRoute, urlSlug, pathname]);

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push(isTenantRoute && urlSlug ? `/b/${urlSlug}/login` : "/login");
  };

  // Módulos habilitados para el comercio actual y el perfil del usuario
  const companyModules =
    tenantActiveModules ||
    user?.company?.activeModules ||
    user?.business?.activeModules || [
      "pos",
      "inventario",
      "categorias",
      "ventas",
      "usuarios",
      "modulos",
      "analitica",
      "configuracion",
    ];

  const userAllowedModules =
    !user ||
    user.role === "SUPERADMIN" ||
    (user.role === "ADMIN" && !user.roleProfile?.modules?.length)
      ? companyModules
      : (user.roleProfile?.modules || ["pos", "ventas"]).filter((m) =>
          companyModules.includes(m)
        );

  const baseTenantPath = slug ? `/b/${slug}/dashboard` : "/dashboard";

  const tenantNavItems = [
    {
      code: "pos",
      title: "Punto de Venta",
      url: `${baseTenantPath}/pos`,
      icon: ShoppingCart,
    },
    {
      code: "inventario",
      title: "Inventario y Stock",
      url: `${baseTenantPath}/inventario`,
      icon: Package,
    },
    {
      code: "categorias",
      title: "Categorías",
      url: `${baseTenantPath}/categorias`,
      icon: Tags,
    },
    {
      code: "ventas",
      title: "Historial de Ventas",
      url: `${baseTenantPath}/ventas`,
      icon: Receipt,
    },
    {
      code: "usuarios",
      title: "Usuarios / Colaboradores",
      url: `${baseTenantPath}/usuarios`,
      icon: Users,
    },
    {
      code: "modulos",
      title: "Módulos y Perfiles",
      url: `${baseTenantPath}/modulos`,
      icon: ShieldCheck,
    },
    {
      code: "analitica",
      title: "Analítica y KPIs",
      url: `${baseTenantPath}/analitica`,
      icon: BarChart2,
    },
    {
      code: "configuracion",
      title: "Configuración",
      url: `${baseTenantPath}/configuracion`,
      icon: Settings,
    },
  ].filter((item) => userAllowedModules.includes(item.code));

  const saasNavItems = [
    {
      title: "Empresas",
      url: "/dashboard/businesses",
      icon: Store,
    },
    {
      title: "Usuarios Globales",
      url: "/dashboard/users",
      icon: Users,
    },
    {
      title: "Logo de Login",
      url: "/dashboard/plataforma",
      icon: Settings,
    },
  ];

  const activeLogoUrl = systemLogoUrl || tenantLogoUrl;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-border/50 py-4 px-4">
        <div className="flex items-center justify-center w-full">
          {activeLogoUrl ? (
            <img
              src={activeLogoUrl}
              alt="Logo"
              className="w-full max-h-16 object-contain"
            />
          ) : !isSystemLoaded && tenantBrandingLoading ? (
            <div className="h-12 w-full" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShoppingCart className="h-6 w-6 text-emerald-500" />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isGlobalCenter ? (
          <SidebarGroup>
            <SidebarGroupLabel>Centro de Control Global</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5 px-2">
                {saasNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.url} className="flex items-center gap-3 py-3 px-3">
                          {item.icon ? <item.icon className="h-5 w-5 shrink-0" /> : null}
                          <span className="text-sm font-bold">{item.title}</span>
                        </Link>
                      }
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      onClick={handleNavClick}
                      className="h-12 rounded-xl"
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Operación del Comercio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5 px-2">
                {tenantNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.url} className="flex items-center gap-3 py-3 px-3">
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="text-sm font-bold tracking-tight">{item.title}</span>
                        </Link>
                      }
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      onClick={handleNavClick}
                      className="h-12 rounded-xl"
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="h-auto py-3 px-3 flex items-center gap-3 rounded-xl"
                  >
                    <Avatar className="h-10 w-10 rounded-xl border border-emerald-500/30">
                      <AvatarImage src={getFileUrl(user?.avatarUrl)} alt={user?.name} />
                      <AvatarFallback className="rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                      <span className="w-full truncate font-bold text-sm text-foreground">
                        {user?.name}
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <AtSign className="h-3 w-3 text-emerald-500" />
                        <span className="truncate font-mono">{user?.username || user?.phone}</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent className="w-56 rounded-xl" side="top" align="end">
                <DropdownMenuItem
                  onClick={() => {
                    handleNavClick();
                    router.push(slug ? `/b/${slug}/dashboard/perfil` : "/dashboard/perfil");
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
