-- El corte ya avanza una línea antes de cortar: las 2 líneas en blanco de fábrica sobran.
-- Solo se tocan las impresoras que siguen con el valor de fábrica.
ALTER TABLE "impresora_pos" ALTER COLUMN "margen_fin_lineas" SET DEFAULT 0;
UPDATE "impresora_pos" SET "margen_fin_lineas" = 0 WHERE "margen_fin_lineas" = 2;
