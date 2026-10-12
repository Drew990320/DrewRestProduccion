-- Plano del local: posición y forma de cada mesa dentro de su lugar.
ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "plano_x" DOUBLE PRECISION;
ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "plano_y" DOUBLE PRECISION;
ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "plano_forma" VARCHAR(20);
