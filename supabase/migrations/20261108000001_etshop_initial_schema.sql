-- =============================================================================
-- eTshop - Sistema POS y Gestión de Inventarios Multi-Tenant
-- Migración Inicial de Base de Datos (Supabase / PostgreSQL)
-- Incluye: Tablas Multi-Tenant, Perfiles con Username Libre, Módulos,
-- Categorías, Productos/Stock, Ventas + Detalle, Triggers Automáticos y RLS.
-- =============================================================================

-- 1. Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tipos Enumerados (Enums)
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'CASHIER', 'INVENTORY', 'CLIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'MIXED', 'CREDIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StockMovementType" AS ENUM ('INITIAL', 'SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'CANCELLED_SALE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 3. TABLA DE EMPRESAS / COMERCIOS (TENANTS) -> companies
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    nit TEXT,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    currency TEXT NOT NULL DEFAULT 'COP',
    timezone TEXT NOT NULL DEFAULT 'America/Bogota',
    logo_url TEXT,
    company_name TEXT,
    favicon_url TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'ACTIVE',
    plan_name TEXT NOT NULL DEFAULT 'PRO',
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_users INTEGER NOT NULL DEFAULT 5,
    active_modules TEXT[] NOT NULL DEFAULT ARRAY['pos', 'inventario', 'categorias', 'ventas', 'clientes', 'usuarios', 'modulos', 'configuracion', 'analitica']::TEXT[],
    settings JSONB DEFAULT '{"taxRate": 0, "receiptFooter": "¡Gracias por su compra en eTshop!", "allowNegativeStock": false}'::JSONB,
    owner_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. TABLA DE PERFILES DE ROL POR EMPRESA -> role_profiles
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.role_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    modules TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_global_view_enabled BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. TABLA DE USUARIOS / PERFILES -> users (con vista/alias profiles)
-- Soporta username / identificador de CUALQUIER formato de texto libre
-- (alfanumérico, guiones, puntos, caracteres especiales, sin límite numérico)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    phone_code TEXT DEFAULT '+57',
    password_hash TEXT NOT NULL,
    role "Role" NOT NULL DEFAULT 'CASHIER',
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    lock_until TIMESTAMPTZ,
    refresh_token TEXT,
    refresh_token_exp TIMESTAMPTZ,
    current_session_id TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role_profile_id UUID REFERENCES public.role_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_username_company_unique UNIQUE (username, company_id)
);

-- Índice único parcial para que el username de SUPERADMIN (company_id IS NULL) sea único globalmente
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_superadmin_username 
ON public.users (username) 
WHERE company_id IS NULL;

-- Relación de owner_id en companies hacia users
DO $$ BEGIN
    ALTER TABLE public.companies
    ADD CONSTRAINT fk_companies_owner
    FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vista compatible `profiles` para consultas que utilicen el estándar Supabase `public.profiles`
CREATE OR REPLACE VIEW public.profiles AS
SELECT
    id,
    username,
    name,
    email,
    phone,
    role,
    avatar_url,
    is_active,
    company_id,
    role_profile_id,
    created_at,
    updated_at
FROM public.users;

-- =============================================================================
-- 6. TABLAS DE MÓDULOS Y PERMISOS -> modules & company_modules
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Package',
    is_core BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}'::JSONB,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT company_modules_unique UNIQUE (company_id, module_id)
);

-- =============================================================================
-- 7. TABLAS DE CATEGORÍAS Y PRODUCTOS (INVENTARIO) -> categories & products
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#10b981',
    icon TEXT DEFAULT 'Tag',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT categories_name_company_unique UNIQUE (name, company_id)
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    barcode TEXT,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
    unit TEXT NOT NULL DEFAULT 'UND',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_company_barcode ON public.products(company_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_company_sku ON public.products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_company_name ON public.products(company_id, name);

-- Tabla de Kardex / Movimientos de Inventario para trazabilidad completa
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type "StockMovementType" NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_company_product ON public.stock_movements(company_id, product_id, created_at DESC);

-- =============================================================================
-- 8. TABLAS DE VENTAS Y DETALLE -> sales & sale_items
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sale_number TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    customer_name TEXT DEFAULT 'Cliente Mostrador',
    customer_doc TEXT,
    customer_phone TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method "PaymentMethod" NOT NULL DEFAULT 'CASH',
    amount_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sales_number_company_unique UNIQUE (sale_number, company_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_company_created ON public.sales(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_company_product ON public.sale_items(company_id, product_id);

-- =============================================================================
-- 9. TRIGGERS Y FUNCIONES DE BASE DE DATOS
--    - Actualización automática de updated_at
--    - Descuento automático de stock e inserción en Kardex al insertar sale_items
--    - Reversión automática de stock al anular una venta (status -> CANCELLED/REFUNDED)
--    - Sincronización entre company_modules y companies.active_modules
-- =============================================================================

-- 9.1 Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sales_updated_at ON public.sales;
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9.2 Función y Trigger para descuento automático de inventario al registrar un item de venta
CREATE OR REPLACE FUNCTION public.fn_deduct_stock_on_sale_item()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock NUMERIC(12, 2);
    v_new_stock NUMERIC(12, 2);
    v_allow_negative BOOLEAN := false;
    v_sale_user_id UUID;
    v_product_name TEXT;
BEGIN
    -- Obtener stock actual y nombre del producto bloqueando la fila para concurrencia segura
    SELECT stock, name INTO v_current_stock, v_product_name
    FROM public.products
    WHERE id = NEW.product_id AND company_id = NEW.company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto (%) no encontrado en la empresa (%)', NEW.product_id, NEW.company_id;
    END IF;

    -- Consultar si la empresa permite stock negativo en su configuración JSONB
    SELECT COALESCE((settings->>'allowNegativeStock')::BOOLEAN, false)
    INTO v_allow_negative
    FROM public.companies
    WHERE id = NEW.company_id;

    v_new_stock := v_current_stock - NEW.quantity;

    IF (v_new_stock < 0 AND NOT v_allow_negative) THEN
        RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %', v_product_name, v_current_stock, NEW.quantity;
    END IF;

    -- Actualizar stock del producto
    UPDATE public.products
    SET stock = v_new_stock,
        updated_at = NOW()
    WHERE id = NEW.product_id AND company_id = NEW.company_id;

    -- Obtener el usuario que realizó la venta
    SELECT user_id INTO v_sale_user_id FROM public.sales WHERE id = NEW.sale_id;

    -- Registrar movimiento en Kardex (stock_movements)
    INSERT INTO public.stock_movements (
        company_id,
        product_id,
        user_id,
        type,
        quantity,
        previous_stock,
        new_stock,
        reference_id,
        notes
    ) VALUES (
        NEW.company_id,
        NEW.product_id,
        v_sale_user_id,
        'SALE',
        -NEW.quantity,
        v_current_stock,
        v_new_stock,
        NEW.sale_id,
        'Descuento automático por venta #' || COALESCE((SELECT sale_number FROM public.sales WHERE id = NEW.sale_id), NEW.sale_id::TEXT)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deduct_stock_after_sale_item ON public.sale_items;
CREATE TRIGGER trg_deduct_stock_after_sale_item
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_deduct_stock_on_sale_item();

-- 9.3 Función y Trigger para restaurar stock automáticamente si una venta pasa a CANCELLED o REFUNDED
CREATE OR REPLACE FUNCTION public.fn_restore_stock_on_sale_cancel()
RETURNS TRIGGER AS $$
DECLARE
    r_item RECORD;
    v_current_stock NUMERIC(12, 2);
    v_new_stock NUMERIC(12, 2);
BEGIN
    IF (OLD.status = 'COMPLETED' AND NEW.status IN ('CANCELLED', 'REFUNDED')) THEN
        FOR r_item IN
            SELECT product_id, quantity
            FROM public.sale_items
            WHERE sale_id = NEW.id AND company_id = NEW.company_id
        LOOP
            SELECT stock INTO v_current_stock
            FROM public.products
            WHERE id = r_item.product_id AND company_id = NEW.company_id
            FOR UPDATE;

            IF FOUND THEN
                v_new_stock := v_current_stock + r_item.quantity;

                UPDATE public.products
                SET stock = v_new_stock,
                    updated_at = NOW()
                WHERE id = r_item.product_id AND company_id = NEW.company_id;

                INSERT INTO public.stock_movements (
                    company_id,
                    product_id,
                    user_id,
                    type,
                    quantity,
                    previous_stock,
                    new_stock,
                    reference_id,
                    notes
                ) VALUES (
                    NEW.company_id,
                    r_item.product_id,
                    NEW.user_id,
                    'CANCELLED_SALE',
                    r_item.quantity,
                    v_current_stock,
                    v_new_stock,
                    NEW.id,
                    'Reversión automática por anulación de venta #' || NEW.sale_number
                );
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_restore_stock_on_sale_cancel ON public.sales;
CREATE TRIGGER trg_restore_stock_on_sale_cancel
AFTER UPDATE OF status ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.fn_restore_stock_on_sale_cancel();

-- =============================================================================
-- 10. ROW LEVEL SECURITY (RLS) MULTI-TENANT POR company_id
-- =============================================================================
-- Funciones auxiliares para leer el company_id y el rol desde el contexto JWT de Supabase
-- o variables de sesión PostgreSQL (`app.current_company_id`, `app.current_role`)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
DECLARE
    v_claim TEXT;
BEGIN
    v_claim := COALESCE(
        NULLIF(current_setting('request.jwt.claim.company_id', true), ''),
        NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'company_id', ''),
        NULLIF(current_setting('app.current_company_id', true), '')
    );
    IF v_claim IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN v_claim::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := COALESCE(
        NULLIF(current_setting('request.jwt.claim.role', true), ''),
        NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''),
        NULLIF(current_setting('app.current_role', true), '')
    );
    RETURN (v_role = 'SUPERADMIN' OR current_user IN ('postgres', 'service_role'));
EXCEPTION WHEN OTHERS THEN
    RETURN (current_user IN ('postgres', 'service_role'));
END;
$$ LANGUAGE plpgsql STABLE;

-- Habilitar RLS en todas las tablas de negocio
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para `companies`
DROP POLICY IF EXISTS "tenant_isolation_companies" ON public.companies;
CREATE POLICY "tenant_isolation_companies" ON public.companies
    FOR ALL
    USING (public.is_superadmin() OR id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR id = public.current_tenant_id());

-- Políticas RLS para `role_profiles`
DROP POLICY IF EXISTS "tenant_isolation_role_profiles" ON public.role_profiles;
CREATE POLICY "tenant_isolation_role_profiles" ON public.role_profiles
    FOR ALL
    USING (public.is_superadmin() OR company_id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR company_id = public.current_tenant_id());

-- Políticas RLS para `users`
DROP POLICY IF EXISTS "tenant_isolation_users" ON public.users;
CREATE POLICY "tenant_isolation_users" ON public.users
    FOR ALL
    USING (public.is_superadmin() OR company_id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR company_id = public.current_tenant_id());

-- Políticas RLS para `modules` (Lectura global, escritura solo SuperAdmin)
DROP POLICY IF EXISTS "modules_read_all" ON public.modules;
CREATE POLICY "modules_read_all" ON public.modules
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "modules_write_superadmin" ON public.modules;
CREATE POLICY "modules_write_superadmin" ON public.modules
    FOR ALL
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

-- Políticas RLS para `company_modules`
DROP POLICY IF EXISTS "tenant_isolation_company_modules" ON public.company_modules;
CREATE POLICY "tenant_isolation_company_modules" ON public.company_modules
    FOR ALL
    USING (public.is_superadmin() OR company_id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR company_id = public.current_tenant_id());

-- Políticas RLS para `categories`
DROP POLICY IF EXISTS "tenant_isolation_categories" ON public.categories;
CREATE POLICY "tenant_isolation_categories" ON public.categories
    FOR ALL
    USING (public.is_superadmin() OR company_id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR company_id = public.current_tenant_id());

-- Políticas RLS para `products`
DROP POLICY IF EXISTS "tenant_isolation_products" ON public.products;
CREATE POLICY "tenant_isolation_products" ON public.products
    FOR ALL
    USING (public.is_superadmin() OR company_id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR company_id = public.current_tenant_id());

-- Políticas RLS para `stock_movements`
DROP POLICY IF EXISTS "tenant_isolation_stock_movements" ON public.stock_movements;
CREATE POLICY "tenant_isolation_stock_movements" ON public.stock_movements
    FOR ALL
    USING (public.is_superadmin() OR company_id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR company_id = public.current_tenant_id());

-- Políticas RLS para `sales`
DROP POLICY IF EXISTS "tenant_isolation_sales" ON public.sales;
CREATE POLICY "tenant_isolation_sales" ON public.sales
    FOR ALL
    USING (public.is_superadmin() OR company_id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR company_id = public.current_tenant_id());

-- Políticas RLS para `sale_items`
DROP POLICY IF EXISTS "tenant_isolation_sale_items" ON public.sale_items;
CREATE POLICY "tenant_isolation_sale_items" ON public.sale_items
    FOR ALL
    USING (public.is_superadmin() OR company_id = public.current_tenant_id())
    WITH CHECK (public.is_superadmin() OR company_id = public.current_tenant_id());

-- =============================================================================
-- 11. CATÁLOGO INICIAL DE MÓDULOS DE eTshop
-- =============================================================================
INSERT INTO public.modules (code, name, description, icon, is_core, sort_order)
VALUES
    ('pos', 'Punto de Venta (POS / Caja)', 'Terminal ágil de caja para registrar ventas, lector de códigos, cálculo de vueltos y recibos.', 'ShoppingCart', true, 1),
    ('inventario', 'Gestión de Inventario y Stock', 'Catálogo de productos, SKU/Códigos de barras, control de existencias, kardex y alertas de stock mínimo.', 'Package', true, 2),
    ('categorias', 'Categorías de Productos', 'Clasificación de productos por familias y colores para búsqueda rápida en el POS.', 'Tags', false, 3),
    ('ventas', 'Historial y Arqueo de Ventas', 'Registro detallado de transacciones, métodos de pago, anulaciones y reportes de caja.', 'Receipt', true, 4),
    ('usuarios', 'Usuarios y Cajeros', 'Administración de personal del comercio con identificadores/usernames libres.', 'Users', false, 5),
    ('modulos', 'Roles, Módulos y Permisos', 'Perfiles de acceso granular por rol y activación de funciones dentro de la empresa.', 'ShieldCheck', false, 6),
    ('analitica', 'Analítica y Reportes BI', 'Métricas de ingresos, utilidad bruta, productos más vendidos y rotación de inventario.', 'BarChart2', false, 7),
    ('configuracion', 'Configuración del Comercio', 'Datos fiscales, logo, moneda, impuestos y personalización del ticket de venta.', 'Settings', true, 8)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    is_core = EXCLUDED.is_core,
    sort_order = EXCLUDED.sort_order;
