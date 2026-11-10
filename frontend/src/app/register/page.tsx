"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Phone, Lock, User, Building2, Globe } from "lucide-react";
import { APP_VERSION, BRANDING_FOOTER } from "@/config/constants";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const registerSchema = z.object({
  businessName: z.string().min(3, "El nombre del negocio debe tener al menos 3 caracteres"),
  businessSlug: z.string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  name: z.string().min(3, "Tu nombre debe tener al menos 3 caracteres"),
  phone: z.string()
    .min(10, "El número debe tener 10 dígitos")
    .max(10, "El número debe tener 10 dígitos")
    .regex(/^\d+$/, "Solo se permiten números"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: "",
      businessSlug: "",
      name: "",
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("businessName", name);
    
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    form.setValue("businessSlug", slug, { shouldValidate: true });
  };

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      await api.post(`/auth/register`, values);
      
      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión.");
      router.push("/login");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al registrarse. Intenta con otros datos."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-outfit py-12">
      <Card className="w-full max-w-lg border-none shadow-2xl bg-white/90 backdrop-blur-2xl rounded-[32px] overflow-hidden">
        <div className="h-2 bg-indigo-600 w-full" />
        <CardHeader className="space-y-3 text-center pt-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center shadow-inner">
               <Building2 className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-zinc-900">Empieza con eTambó</CardTitle>
          <CardDescription className="text-zinc-500 font-medium px-6">
            Crea tu cuenta empresarial y empieza a gestionar tus citas hoy mismo.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-zinc-700 font-bold ml-1">Nombre del Negocio</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                          <Input 
                            placeholder="Mi Empresa S.A.S" 
                            className="pl-12 h-12 bg-zinc-50 border-zinc-100 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleBusinessNameChange(e);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="ml-1 text-[12px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessSlug"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-zinc-700 font-bold ml-1">URL de tu negocio</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-orange-600 transition-colors" />
                          <Input 
                            placeholder="mi-empresa" 
                            className="pl-12 h-12 bg-zinc-50 border-zinc-100 rounded-xl focus:ring-orange-500/20 focus:border-orange-500 transition-all lowercase"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px] ml-1">
                        etambo.pro/b/<strong>{field.value || "tu-negocio"}</strong>
                      </FormDescription>
                      <FormMessage className="ml-1 text-[12px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-700 font-bold ml-1">Nombre Administrador</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                          <Input 
                            placeholder="Juan Pérez" 
                            className="pl-12 h-12 bg-zinc-50 border-zinc-100 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="ml-1 text-[12px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-700 font-bold ml-1">Celular</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                          <Input 
                            placeholder="3001234567" 
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="pl-12 h-12 bg-zinc-50 border-zinc-100 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              field.onChange(val);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="ml-1 text-[12px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-zinc-700 font-bold ml-1">Contraseña de acceso</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-12 h-12 bg-zinc-50 border-zinc-100 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="ml-1 text-[12px]" />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 rounded-2xl shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-4" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando Empresa...
                  </>
                ) : (
                  "Registrar Empresa"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-3 py-6 bg-zinc-50/50 border-t border-zinc-100">
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>¿Ya tienes una cuenta?</span>
            <Link href="/login" className="p-0 h-auto font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Inicia sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center space-y-1 opacity-40 pointer-events-none">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">
          {BRANDING_FOOTER}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground/60 tracking-widest">
          {APP_VERSION}
        </p>
      </div>
    </div>
  );
}
