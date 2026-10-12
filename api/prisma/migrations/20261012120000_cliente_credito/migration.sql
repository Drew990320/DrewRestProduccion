-- Clientes recordados para fiados / línea de crédito
CREATE TABLE "cliente_credito" (
    "id_cliente" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "nombre" VARCHAR(120) NOT NULL,
    "telefono" VARCHAR(40),
    "documento" VARCHAR(40),
    "notas" VARCHAR(500),
    "linea_credito_activa" BOOLEAN NOT NULL DEFAULT false,
    "limite_credito" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cliente_credito_pkey" PRIMARY KEY ("id_cliente")
);
CREATE INDEX "cliente_credito_id_restaurante_nombre_idx" ON "cliente_credito"("id_restaurante", "nombre");
CREATE INDEX "cliente_credito_id_restaurante_telefono_idx" ON "cliente_credito"("id_restaurante", "telefono");

CREATE TABLE "abono_credito" (
    "id_abono" SERIAL NOT NULL,
    "id_credito" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "notas" VARCHAR(300),
    "id_usuario" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "abono_credito_pkey" PRIMARY KEY ("id_abono")
);
CREATE INDEX "abono_credito_id_credito_creado_en_idx" ON "abono_credito"("id_credito", "creado_en");
ALTER TABLE "abono_credito" ADD CONSTRAINT "abono_credito_id_credito_fkey"
    FOREIGN KEY ("id_credito") REFERENCES "cuenta_credito"("id_credito") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cuenta_credito" ADD COLUMN "id_cliente" INTEGER;
CREATE INDEX "cuenta_credito_id_cliente_idx" ON "cuenta_credito"("id_cliente");
ALTER TABLE "cuenta_credito" ADD CONSTRAINT "cuenta_credito_id_cliente_fkey"
    FOREIGN KEY ("id_cliente") REFERENCES "cliente_credito"("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recordar a los clientes de fiados existentes (mismo nombre + teléfono = mismo cliente)
INSERT INTO "cliente_credito" ("id_restaurante", "nombre", "telefono", "creado_en")
SELECT p."id_restaurante", MIN(TRIM(c."nombre_cliente")), NULLIF(TRIM(COALESCE(c."telefono", '')), ''), MIN(c."creado_en")
FROM "cuenta_credito" c
JOIN "pedido" p ON p."id_pedido" = c."id_pedido"
GROUP BY p."id_restaurante", LOWER(TRIM(c."nombre_cliente")), NULLIF(TRIM(COALESCE(c."telefono", '')), '');

UPDATE "cuenta_credito" c
SET "id_cliente" = cl."id_cliente"
FROM "pedido" p, "cliente_credito" cl
WHERE p."id_pedido" = c."id_pedido"
  AND cl."id_restaurante" = p."id_restaurante"
  AND LOWER(TRIM(cl."nombre")) = LOWER(TRIM(c."nombre_cliente"))
  AND COALESCE(cl."telefono", '') = COALESCE(NULLIF(TRIM(COALESCE(c."telefono", '')), ''), '');
