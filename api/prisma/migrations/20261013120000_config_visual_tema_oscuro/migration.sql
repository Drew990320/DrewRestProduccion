-- Paleta propia del modo oscuro y modo predeterminado de los equipos.
ALTER TABLE "config_visual" ADD COLUMN IF NOT EXISTS "colores_oscuro" JSONB;
ALTER TABLE "config_visual" ADD COLUMN IF NOT EXISTS "tema_predeterminado" VARCHAR(10);
