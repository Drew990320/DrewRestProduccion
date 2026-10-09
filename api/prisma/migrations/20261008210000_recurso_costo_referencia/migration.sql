ALTER TABLE "recurso" ADD COLUMN IF NOT EXISTS "costo_referencia" DECIMAL(12,4);

UPDATE "recurso" SET "costo_referencia" = "costo" WHERE "costo_referencia" IS NULL AND "costo" > 0;
