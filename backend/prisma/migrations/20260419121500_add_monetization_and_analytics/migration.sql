-- AlterTable
ALTER TABLE "businesses" ADD COLUMN "active_modules" TEXT[] DEFAULT ARRAY['citas', 'clientes', 'profesionales', 'servicios', 'perfiles', 'configuracion', 'analitica']::TEXT[];
ALTER TABLE "businesses" ADD COLUMN "max_professionals" INTEGER NOT NULL DEFAULT 1;
