-- Impuesto al consumo (impoconsumo): módulo superadmin, tarifa, categorías gravadas y monto en factura.

ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "modulo_impoconsumo_activo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "config_operativa"
  ADD COLUMN IF NOT EXISTS "impoconsumo_porcentaje" DECIMAL(5, 2) NOT NULL DEFAULT 8;

ALTER TABLE "categoria"
  ADD COLUMN IF NOT EXISTS "aplica_impoconsumo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "factura"
  ADD COLUMN IF NOT EXISTS "monto_impoconsumo" DECIMAL(10, 2) NOT NULL DEFAULT 0;
