-- Códigos de menú: categoría 01–99; producto = categoría + consecutivo (011, 012…).

ALTER TABLE "categoria" ADD COLUMN "codigo_menu" VARCHAR(2);
ALTER TABLE "producto" ADD COLUMN "codigo_menu" VARCHAR(12);

-- Backfill categorías por restaurante/canal (orden alfabético).
WITH ranked AS (
  SELECT
    "id_categoria",
    ROW_NUMBER() OVER (
      PARTITION BY "id_restaurante", "canal"
      ORDER BY "nombre" ASC, "id_categoria" ASC
    ) AS rn
  FROM "categoria"
)
UPDATE "categoria" c
SET "codigo_menu" = LPAD(ranked.rn::text, 2, '0')
FROM ranked
WHERE c."id_categoria" = ranked."id_categoria"
  AND ranked.rn <= 99;

-- Backfill productos dentro de cada categoría.
WITH ranked AS (
  SELECT
    p."id_producto",
    c."codigo_menu" AS cat_code,
    ROW_NUMBER() OVER (
      PARTITION BY p."id_categoria"
      ORDER BY p."nombre" ASC, p."id_producto" ASC
    ) AS rn
  FROM "producto" p
  INNER JOIN "categoria" c ON c."id_categoria" = p."id_categoria"
  WHERE c."codigo_menu" IS NOT NULL
)
UPDATE "producto" p
SET "codigo_menu" = ranked.cat_code || ranked.rn::text
FROM ranked
WHERE p."id_producto" = ranked."id_producto";

CREATE UNIQUE INDEX "categoria_id_restaurante_canal_codigo_menu_key"
  ON "categoria" ("id_restaurante", "canal", "codigo_menu");

CREATE INDEX "producto_codigo_menu_idx" ON "producto" ("codigo_menu");
CREATE INDEX "producto_id_categoria_codigo_menu_idx"
  ON "producto" ("id_categoria", "codigo_menu");
