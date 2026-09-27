-- Impoconsumo solo en los métodos de pago que elija el admin.

ALTER TABLE "config_operativa"
  ADD COLUMN IF NOT EXISTS "impoconsumo_metodos_pago" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
