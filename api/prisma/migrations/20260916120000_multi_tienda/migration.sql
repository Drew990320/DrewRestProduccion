-- Multi-tienda retail: entidad tienda + scope en categoria/mesa/pedido

CREATE TABLE "tienda" (
    "id_tienda" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "etiqueta" VARCHAR(80),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "numero_mesa_boutique" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tienda_pkey" PRIMARY KEY ("id_tienda")
);

CREATE UNIQUE INDEX "tienda_id_restaurante_nombre_key" ON "tienda"("id_restaurante", "nombre");
CREATE UNIQUE INDEX "tienda_id_restaurante_numero_mesa_boutique_key" ON "tienda"("id_restaurante", "numero_mesa_boutique");
CREATE INDEX "tienda_id_restaurante_activo_orden_idx" ON "tienda"("id_restaurante", "activo", "orden");

ALTER TABLE "tienda" ADD CONSTRAINT "tienda_id_restaurante_fkey"
  FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "categoria" ADD COLUMN "id_tienda" INTEGER;
ALTER TABLE "mesa" ADD COLUMN "id_tienda" INTEGER;
ALTER TABLE "pedido" ADD COLUMN "id_tienda" INTEGER;

CREATE INDEX "categoria_id_tienda_idx" ON "categoria"("id_tienda");
CREATE INDEX "mesa_id_tienda_idx" ON "mesa"("id_tienda");
CREATE INDEX "pedido_id_tienda_estado_idx" ON "pedido"("id_tienda", "estado");

-- Backfill: una tienda por restaurante con retail activo o categorías retail
INSERT INTO "tienda" ("id_restaurante", "nombre", "etiqueta", "activo", "numero_mesa_boutique", "orden", "creado_en", "actualizado_en")
SELECT
  r."id_restaurante",
  COALESCE(NULLIF(TRIM(op."etiqueta_boutique"), ''), 'Tienda'),
  COALESCE(NULLIF(TRIM(op."etiqueta_boutique"), ''), 'Tienda'),
  true,
  COALESCE(op."numero_mesa_boutique", 97),
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "restaurante" r
LEFT JOIN "config_operativa" op ON op."id_restaurante" = r."id_restaurante"
LEFT JOIN "config_restaurante" cr ON cr."id_restaurante" = r."id_restaurante"
WHERE COALESCE(cr."modulo_retail_activo", false) = true
   OR EXISTS (
     SELECT 1 FROM "categoria" c
     WHERE c."id_restaurante" = r."id_restaurante" AND c."canal" = 'retail'
   )
ON CONFLICT DO NOTHING;

-- Restaurantes con categorías retail pero sin tienda aún (nombre on nombre conflict)
INSERT INTO "tienda" ("id_restaurante", "nombre", "etiqueta", "activo", "numero_mesa_boutique", "orden", "creado_en", "actualizado_en")
SELECT DISTINCT
  c."id_restaurante",
  'Tienda',
  'Tienda',
  true,
  COALESCE(op."numero_mesa_boutique", 97),
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "categoria" c
LEFT JOIN "config_operativa" op ON op."id_restaurante" = c."id_restaurante"
WHERE c."canal" = 'retail'
  AND NOT EXISTS (
    SELECT 1 FROM "tienda" t WHERE t."id_restaurante" = c."id_restaurante"
  );

UPDATE "categoria" cat
SET "id_tienda" = t."id_tienda"
FROM "tienda" t
WHERE cat."canal" = 'retail'
  AND cat."id_restaurante" = t."id_restaurante"
  AND cat."id_tienda" IS NULL;

UPDATE "mesa" m
SET "id_tienda" = t."id_tienda"
FROM "tienda" t
WHERE m."id_restaurante" = t."id_restaurante"
  AND m."numero" = t."numero_mesa_boutique"
  AND m."id_tienda" IS NULL;

UPDATE "pedido" p
SET "id_tienda" = m."id_tienda"
FROM "mesa" m
WHERE p."id_mesa" = m."id_mesa"
  AND m."id_tienda" IS NOT NULL
  AND p."id_tienda" IS NULL;

ALTER TABLE "categoria" ADD CONSTRAINT "categoria_id_tienda_fkey"
  FOREIGN KEY ("id_tienda") REFERENCES "tienda"("id_tienda") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mesa" ADD CONSTRAINT "mesa_id_tienda_fkey"
  FOREIGN KEY ("id_tienda") REFERENCES "tienda"("id_tienda") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_tienda_fkey"
  FOREIGN KEY ("id_tienda") REFERENCES "tienda"("id_tienda") ON DELETE SET NULL ON UPDATE CASCADE;

-- Reemplazar uniques globales por parciales (restaurante vs retail/tienda)
DROP INDEX IF EXISTS "categoria_id_restaurante_canal_nombre_key";
DROP INDEX IF EXISTS "categoria_id_restaurante_canal_codigo_menu_key";

CREATE UNIQUE INDEX "categoria_restaurante_nombre_key"
  ON "categoria" ("id_restaurante", "nombre")
  WHERE "canal" = 'restaurante';

CREATE UNIQUE INDEX "categoria_restaurante_codigo_menu_key"
  ON "categoria" ("id_restaurante", "codigo_menu")
  WHERE "canal" = 'restaurante' AND "codigo_menu" IS NOT NULL;

CREATE UNIQUE INDEX "categoria_retail_tienda_nombre_key"
  ON "categoria" ("id_tienda", "nombre")
  WHERE "canal" = 'retail' AND "id_tienda" IS NOT NULL;

CREATE UNIQUE INDEX "categoria_retail_tienda_codigo_menu_key"
  ON "categoria" ("id_tienda", "codigo_menu")
  WHERE "canal" = 'retail' AND "id_tienda" IS NOT NULL AND "codigo_menu" IS NOT NULL;
