-- Arqueo (efectivo contado) separado de la base final del día.
ALTER TABLE "caja_diaria" ADD COLUMN "monto_arqueo_efectivo" DECIMAL(12,2);

-- Antes la "caja de cierre" era el efectivo contado: pasa a ser el arqueo.
UPDATE "caja_diaria"
SET "monto_arqueo_efectivo" = "monto_base_cierre_efectivo"
WHERE "monto_base_cierre_efectivo" IS NOT NULL;
