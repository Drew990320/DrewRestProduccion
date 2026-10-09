-- CreateTable
CREATE TABLE IF NOT EXISTS "presentacion_recurso" (
    "id_presentacion" SERIAL NOT NULL,
    "id_recurso" INTEGER NOT NULL,
    "nombre" VARCHAR(40) NOT NULL,
    "factor" DECIMAL(14,6) NOT NULL,
    "codigo_barras" VARCHAR(80),
    "costo_ultimo" DECIMAL(12,2),
    "predeterminada" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presentacion_recurso_pkey" PRIMARY KEY ("id_presentacion")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "presentacion_recurso_id_recurso_nombre_key" ON "presentacion_recurso"("id_recurso", "nombre");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "presentacion_recurso" ADD CONSTRAINT "presentacion_recurso_id_recurso_fkey"
    FOREIGN KEY ("id_recurso") REFERENCES "recurso"("id_recurso") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
