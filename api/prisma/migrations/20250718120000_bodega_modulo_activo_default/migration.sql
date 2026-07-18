-- Bodega visible por defecto en Más (módulo inventario / recursos).
ALTER TABLE "ConfigRestaurante"
  ALTER COLUMN "modulo_inventario_activo" SET DEFAULT true;

UPDATE "ConfigRestaurante"
SET "modulo_inventario_activo" = true
WHERE "modulo_inventario_activo" = false;
