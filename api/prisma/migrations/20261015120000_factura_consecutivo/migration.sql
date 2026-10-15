-- Numeración consecutiva de facturas con prefijo configurable.
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_prefijo" VARCHAR(12) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "factura_siguiente_numero" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "factura"
  ADD COLUMN IF NOT EXISTS "numero_consecutivo" INTEGER,
  ADD COLUMN IF NOT EXISTS "prefijo_consecutivo" VARCHAR(12);
