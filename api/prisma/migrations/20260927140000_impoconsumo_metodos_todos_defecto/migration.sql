-- Por defecto el impoconsumo aplica a todos los métodos de pago.
-- La columna se creó vacía, lo que dejaba sin impoconsumo todos los cobros.

ALTER TABLE "config_operativa"
  ALTER COLUMN "impoconsumo_metodos_pago" SET DEFAULT ARRAY['efectivo', 'transferencia', 'tarjeta', 'fiado']::TEXT[];

UPDATE "config_operativa"
SET "impoconsumo_metodos_pago" = ARRAY['efectivo', 'transferencia', 'tarjeta', 'fiado']::TEXT[]
WHERE cardinality("impoconsumo_metodos_pago") = 0;
