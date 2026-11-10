"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, UserCheck, Lock, ShoppingCart, Eye, EyeOff } from "lucide-react";
import { APP_VERSION, BRANDING_FOOTER } from "@/config/constants";
import api from "@/lib/api";
import { useSystemBranding } from "@/hooks/use-system-branding";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth-store";

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Ingresa tu usuario"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [commerceName, setCommerceName] = useState<string>("");
  const router = useRouter();
  const params = useParams();
  const slugParam = typeof params?.slug === "string" ? params.slug : null;
  const setAuth = useAuthStore((state) => state.setAuth);
  const { systemLogoUrl, isSystemLoaded } = useSystemBranding();

  useEffect(() => {
    if (!slugParam) return;
    api
      .get(`/businesses/${slugParam}`)
      .then((res) => {
        const data = res.data?.data;
        if (data?.name) {
          setCommerceName(data.name);
        }
      })
      .catch(() => {});
  }, [slugParam]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        username: values.username.trim(),
        identifier: values.username.trim(),
        password: values.password,
        companySlug: slugParam,
        businessSlug: slugParam,
      });

      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);

      toast.success(`¡Bienvenido, ${user.name}!`);

      const targetSlug = slugParam || user.company?.slug || user.business?.slug;

      if (user.role === "SUPERADMIN" && !slugParam) {
        router.push("/dashboard/businesses");
      } else if (targetSlug) {
        const modules: string[] =
          user.role === "ADMIN" || user.role === "SUPERADMIN"
            ? user.company?.activeModules || ["pos"]
            : user.roleProfile?.modules || ["pos"];

        if (modules.includes("pos")) {
          router.push(`/b/${targetSlug}/dashboard/pos`);
        } else if (modules.includes("inventario")) {
          router.push(`/b/${targetSlug}/dashboard/inventario`);
        } else {
          router.push(`/b/${targetSlug}/dashboard`);
        }
      } else {
        router.push("/dashboard/businesses");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Error al iniciar sesión. Verifica tu usuario y contraseña.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-emerald-500/20 bg-slate-900/90 backdrop-blur-xl shadow-2xl rounded-3xl text-slate-100">
          <CardHeader className="space-y-4 text-center pb-4 pt-8 px-7">
            <div className="w-full flex items-center justify-center">
              {systemLogoUrl ? (
                <img
                  src={systemLogoUrl}
                  alt="Logo"
                  className="w-full max-h-36 object-contain"
                />
              ) : !isSystemLoaded ? (
                <div className="h-24 w-full" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-emerald-400" />
                </div>
              )}
            </div>
            {slugParam && (
              <div className="space-y-1 pt-1">
                <CardDescription className="text-slate-400 text-sm">
                  Acceso al comercio
                </CardDescription>
                {commerceName && (
                  <p className="text-lg font-black text-emerald-400 leading-snug">
                    {commerceName}
                  </p>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 px-7 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Usuario
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserCheck className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                          <Input
                            autoComplete="username"
                            className="pl-11 h-12 rounded-xl bg-slate-800/80 border-slate-700 text-white focus-visible:ring-emerald-500"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Contraseña
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="pl-11 pr-11 h-12 rounded-xl bg-slate-800/80 border-slate-700 text-white focus-visible:ring-emerald-500"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
