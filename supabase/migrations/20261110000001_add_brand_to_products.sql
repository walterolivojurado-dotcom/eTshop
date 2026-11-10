-- =============================================================================
-- eTshop - Agregar campo Marca (brand) a la tabla de productos
-- =============================================================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand TEXT;
