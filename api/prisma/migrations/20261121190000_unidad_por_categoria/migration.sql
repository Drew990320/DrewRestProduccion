ALTER TABLE "categoria" ADD COLUMN "id_unidad" INTEGER;
CREATE INDEX "categoria_id_unidad_idx" ON "categoria"("id_unidad");
ALTER TABLE "categoria"
  ADD CONSTRAINT "categoria_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "producto" ADD COLUMN "hereda_unidad" BOOLEAN NOT NULL DEFAULT true;
UPDATE "producto" SET "hereda_unidad" = false WHERE "id_unidad" IS NOT NULL;
