-- Periodicidad mensual vs diaria en gastos fijos y extras.
ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "periodicidad" VARCHAR(16) NOT NULL DEFAULT 'mensual';
ALTER TABLE "gasto_extra_ganancia" ADD COLUMN IF NOT EXISTS "periodicidad" VARCHAR(16) NOT NULL DEFAULT 'diario';
