"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Users, AtSign, Store, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data.data || []))
      .catch(() => toast.error("Error cargando usuarios globales"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-card border border-border p-6 rounded-3xl">
        <h1 className="text-2xl font-black">
          Directorio Global de usuarios
        </h1>
      </div>

      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-black">
            Usuarios Registrados
          </CardTitle>
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
                  <th className="px-4 py-3.5">NOMBRE</th>
                  <th className="px-4 py-3.5">USUARIO</th>
                  <th className="px-4 py-3.5">PERFIL</th>
                  <th className="px-4 py-3.5">COMERCIAL</th>
                  <th className="px-4 py-3.5">ESTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3.5 font-bold">{u.name}</td>
                    <td className="px-4 py-3.5 font-mono text-emerald-500">
                      <span className="inline-flex items-center gap-1">
                        <AtSign className="h-3.5 w-3.5" />
                        {u.username || u.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.company ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <Store className="h-3.5 w-3.5 text-emerald-500" />
                          {u.company.name}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 font-bold">
                          Plataforma Global
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        className={
                          u.isActive
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-red-500/15 text-red-500"
                        }
                      >
                        {u.isActive ? "ACTIVO" : "INACTIVO"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
