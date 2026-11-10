-- =============================================================================
-- eTshop - Migración de Inicialización de SuperAdmin en Producción (Supabase)
-- 
-- Requisitos cumplidos:
-- 1. Inserta o actualiza de forma idempotente únicamente el registro del usuario
--    SUPERADMIN en `public.users` con las credenciales de QA (eTshop2026!).
-- 2. No inserta empresas/comercios (companies), categorías, productos, stock ni ventas.
-- 3. Seguro para ejecución al desplegar por primera vez (CI/CD, Supabase Dashboard o CLI).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    v_superadmin_id UUID;
    v_password_hash TEXT;
BEGIN
    -- 1. Generar hash bcrypt estándar de 10 rondas con pgcrypto
    -- Credenciales de QA: Usuario: 'superadmin' / Teléfono: '1143225890' / Clave: 'eTshop2026!'
    v_password_hash := crypt('eTshop2026!', gen_salt('bf', 10));

    -- 2. Detectar si ya existe el usuario SuperAdmin por rol, username o teléfono
    SELECT id INTO v_superadmin_id
    FROM public.users
    WHERE role = 'SUPERADMIN' 
       OR username = 'superadmin' 
       OR phone = '1143225890'
    LIMIT 1;

    IF v_superadmin_id IS NOT NULL THEN
        -- Sincronizar credenciales del SuperAdmin existente garantizando aislamiento
        UPDATE public.users
        SET
            username = 'superadmin',
            name = 'SuperAdmin eTshop',
            email = 'admin@etshop.com',
            phone = '1143225890',
            phone_code = '+57',
            password_hash = v_password_hash,
            role = 'SUPERADMIN',
            is_active = true,
            company_id = NULL,
            role_profile_id = NULL,
            failed_attempts = 0,
            lock_until = NULL,
            updated_at = NOW()
        WHERE id = v_superadmin_id;

        RAISE NOTICE '✅ SuperAdmin existente (ID: %) sincronizado exitosamente.', v_superadmin_id;
    ELSE
        -- Insertar únicamente el usuario SuperAdmin
        INSERT INTO public.users (
            id,
            username,
            name,
            email,
            phone,
            phone_code,
            password_hash,
            role,
            is_active,
            failed_attempts,
            company_id,
            role_profile_id,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'superadmin',
            'SuperAdmin eTshop',
            'admin@etshop.com',
            '1143225890',
            '+57',
            v_password_hash,
            'SUPERADMIN',
            true,
            0,
            NULL,
            NULL,
            NOW(),
            NOW()
        );

        RAISE NOTICE '✅ Usuario SuperAdmin creado exitosamente en public.users.';
    END IF;
END $$;

