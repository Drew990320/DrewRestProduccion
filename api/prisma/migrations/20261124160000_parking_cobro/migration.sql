ALTER TABLE "parking_settings"
  ADD COLUMN "unidad_cobro" VARCHAR(12) NOT NULL DEFAULT 'hora',
  ADD COLUMN "modo_redondeo" VARCHAR(12) NOT NULL DEFAULT 'exacto';
