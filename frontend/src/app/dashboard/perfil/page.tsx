"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, User, Lock, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { ImageUpload } from "@/components/image-upload";

export default function PerfilPage() {
  const { user, checkAuth } = useAuthStore();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    try {
      await api.patch('/auth/me/profile', { name, avatarUrl });
      toast.success("Perfil actualizado correctamente");
      await checkAuth(); // Sync the session store with new details
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar perfil");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    setIsSubmittingPassword(true);
    try {
      await api.patch('/auth/me/password', { currentPassword, newPassword });
      toast.success("Contraseña actualizada con éxito");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar la contraseña");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 p-8 font-outfit animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Mi Perfil
        </h1>
        <p className="text-muted-foreground font-medium text-lg mt-1">
          Gestiona tu información personal y protege tu acceso.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PROFILE SETTINGS */}
        <Card className="border-border shadow-xl bg-card rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <h2 className="text-xl font-black mb-6 border-b border-border pb-4">Datos Personales</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-full">
                  <ImageUpload 
                    label="Foto de Perfil" 
                    value={avatarUrl} 
                    onChange={setAvatarUrl} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre Completo <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="name" 
                    placeholder="Tu nombre" 
                    className="pl-11 h-12 border-2 border-border/50 bg-muted/5 rounded-2xl font-bold focus-visible:ring-primary/20 transition-all text-base"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Correo (Solo lectura)</Label>
                <Input 
                  value={user?.email || "Sin correo detectado"} 
                  readOnly 
                  className="h-12 border-2 border-transparent bg-muted/20 text-muted-foreground rounded-2xl font-bold cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Teléfono (Solo lectura)</Label>
                <Input 
                  value={user?.phone || "Sin teléfono detectado"} 
                  readOnly 
                  className="h-12 border-2 border-transparent bg-muted/20 text-muted-foreground rounded-2xl font-bold cursor-not-allowed"
                />
              </div>

              <Button type="submit" disabled={isSubmittingProfile} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-2xl font-black text-base shadow-lg shadow-primary/20 transition-all mt-6">
                {isSubmittingProfile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Guardar Perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* SECURITY SETTINGS */}
        <Card className="border-border shadow-xl bg-card rounded-[32px] overflow-hidden border-2 border-red-500/5">
          <CardContent className="p-8">
            <h2 className="text-xl font-black mb-6 border-b border-border pb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-destructive" /> Seguridad de Acceso
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-pass" className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Contraseña Actual *</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="current-pass" 
                    type="password"
                    placeholder="••••••••" 
                    className="pl-11 h-12 border-2 border-border/50 bg-muted/5 rounded-2xl font-bold focus-visible:ring-primary/20 transition-all tracking-widest"
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-pass" className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nueva Contraseña <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="new-pass" 
                    type="password"
                    placeholder="••••••••" 
                    className="pl-11 h-12 border-2 border-border/50 bg-muted/5 rounded-2xl font-bold focus-visible:ring-primary/20 transition-all tracking-widest"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pass" className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmar Nueva Contraseña <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="confirm-pass" 
                    type="password"
                    placeholder="••••••••" 
                    className="pl-11 h-12 border-2 border-border/50 bg-muted/5 rounded-2xl font-bold focus-visible:ring-primary/20 transition-all tracking-widest"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmittingPassword} variant="destructive" className="w-full h-12 rounded-2xl font-black text-base shadow-lg shadow-destructive/20 transition-all mt-6 hover:bg-red-600 hover:text-white">
                {isSubmittingPassword ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Actualizar Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
