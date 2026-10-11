-- Gasto fijo de una vez al mes: día de pago (1–31). NULL = repartido en los días del mes.
ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN IF NOT EXISTS "dia_mes" INTEGER;
