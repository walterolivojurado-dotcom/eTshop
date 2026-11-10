# eTshop — Sistema POS, Gestión de Inventarios y Ventas Multi-Tenant

> **eTshop** es el módulo/aplicación del ecosistema **eTambó** diseñado para misceláneas, supermercados y comercios locales. Comparte la misma base técnica y arquitectura multi-tenant de **eTambook**, conectada a **Supabase (PostgreSQL)** con aislamiento mediante **Row Level Security (RLS)** y triggers automáticos de inventario.

---

## 🏗️ Arquitectura y Características Clave

1. **Centro de Control Global Multi-Tenant (`companies`):**
   - Creación y administración centralizada de empresas/comercios por parte del `SUPERADMIN`.
   - Activación y suspensión de comercios en tiempo real y asignación de módulos (`modules` y `company_modules`).
2. **Identificador de Usuario Totalmente Flexible (`users.username`):**
   - A diferencia de sistemas restringidos a números de 10 dígitos, en **eTshop** el identificador de usuario (`username` / código / login) admite **cualquier cadena de texto libre** (alfanumérico, con puntos, guiones, caracteres especiales, ej: `superadmin`, `admin.central`, `CAJA-01`, `cajero#2`).
3. **Descuento y Reversión Automática de Inventario en PostgreSQL:**
   - **Trigger `trg_deduct_stock_after_sale_item`:** Al insertar cada línea en `sale_items`, valida existencias (respetando `allowNegativeStock`), descuenta automáticamente `products.stock` y crea el movimiento de trazabilidad en `stock_movements` (Kardex).
   - **Trigger `trg_restore_stock_on_sale_cancel`:** Al anular o reembolsar una venta (`status -> CANCELLED / REFUNDED`), restaura automáticamente el stock y registra la reversión en el Kardex.
4. **Row Level Security (RLS) en Supabase:**
   - Todas las tablas (`companies`, `users`, `role_profiles`, `modules`, `company_modules`, `categories`, `products`, `stock_movements`, `sales`, `sale_items`) cuentan con políticas RLS activas basadas en `company_id`.

---

## 📂 Estructura del Proyecto (`C:\Users\User\Desktop\eTshop`)

- `supabase/migrations/20261108000001_etshop_initial_schema.sql` — Migración SQL completa aplicada en Supabase (Tablas, Índices, Vista `profiles`, Triggers PL/pgSQL y Políticas RLS).
- `backend/` — API REST en Node.js + Express + TypeScript + Prisma ORM.
- `frontend/` — Aplicación Next.js (App Router) + Tailwind CSS + Zustand + API integrada (`/api`).

---

## 🔑 Credenciales Preconfiguradas (Semilla en Supabase)

| Rol | Usuario / Identificador (`username`) | Contraseña | Comercio |
|---|---|---|---|
| **SuperAdmin Global** | `superadmin` | `eTshop2026!` | Centro de Control Global (`/dashboard/businesses`) |
| **Admin de Comercio** | `admin.central` | `admin1234` | Miscelánea Central (`/b/miscelanea-central/dashboard/pos`) |
| **Cajero POS** | `CAJA-01` | `caja1234` | Miscelánea Central (`/b/miscelanea-central/dashboard/pos`) |

---

## 🚀 Ejecución Local

```bash
# 1. Iniciar Frontend + API Integrada (Puerto 3000)
cd C:\Users\User\Desktop\eTshop\frontend
npm run dev

# 2. (Opcional) Iniciar Servidor Backend Independiente (Puerto 4000)
cd C:\Users\User\Desktop\eTshop\backend
npm run dev
```

