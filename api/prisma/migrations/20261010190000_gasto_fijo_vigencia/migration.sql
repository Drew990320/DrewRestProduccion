-- Vigencia de gastos fijos: fechas y días de la semana en que cuentan
ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "fecha_inicio" DATE;
ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "fecha_fin" DATE;
ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "dias_semana" INTEGER NOT NULL DEFAULT 127;
