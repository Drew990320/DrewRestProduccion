-- Fondo opcional en gastos extras: se reserva contra ganancia neta;
-- luego se registra el desembolso del fondo (no sale de caja).

ALTER TABLE "gasto_extra_ganancia"
  ADD COLUMN IF NOT EXISTS "usa_fondo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pagado_fondo" BOOLEAN NOT NULL DEFAULT true;
