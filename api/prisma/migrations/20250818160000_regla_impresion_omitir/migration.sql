-- Omitir zona/plato en estación de cocina (no imprimir; evita huérfanos).
ALTER TABLE "regla_impresion_cocina" ADD COLUMN IF NOT EXISTS "omitir" BOOLEAN NOT NULL DEFAULT false;
