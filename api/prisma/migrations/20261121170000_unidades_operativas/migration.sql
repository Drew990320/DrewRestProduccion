-- Cajas independientes. Apagado por defecto: las filas existentes quedan sin unidad.

CREATE TYPE "ModoInventarioUnidades" AS ENUM ('compartido', 'independiente');

ALTER TABLE "config_restaurante"
  ADD COLUMN "modulo_unidades_operativas_activo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "modo_inventario_unidades" "ModoInventarioUnidades" NOT NULL DEFAULT 'compartido';

CREATE TABLE "unidad_operativa" (
  "id_unidad" SERIAL NOT NULL,
  "id_restaurante" INTEGER NOT NULL,
  "nombre" VARCHAR(80) NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "unidad_operativa_pkey" PRIMARY KEY ("id_unidad")
);

CREATE UNIQUE INDEX "unidad_operativa_id_restaurante_nombre_key"
  ON "unidad_operativa"("id_restaurante", "nombre");
CREATE INDEX "unidad_operativa_id_restaurante_activo_orden_idx"
  ON "unidad_operativa"("id_restaurante", "activo", "orden");

ALTER TABLE "unidad_operativa"
  ADD CONSTRAINT "unidad_operativa_id_restaurante_fkey"
  FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "detalle_pedido" ADD COLUMN "id_unidad" INTEGER;
CREATE INDEX "detalle_pedido_id_unidad_idx" ON "detalle_pedido"("id_unidad");
ALTER TABLE "detalle_pedido"
  ADD CONSTRAINT "detalle_pedido_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "movimiento_caja" ADD COLUMN "id_unidad" INTEGER;
CREATE INDEX "movimiento_caja_id_unidad_fecha_idx" ON "movimiento_caja"("id_unidad", "fecha");
ALTER TABLE "movimiento_caja"
  ADD CONSTRAINT "movimiento_caja_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "caja_diaria" ADD COLUMN "id_unidad" INTEGER;
ALTER TABLE "caja_diaria"
  ADD CONSTRAINT "caja_diaria_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventario" ADD COLUMN "id_unidad" INTEGER;
CREATE INDEX "inventario_id_unidad_idx" ON "inventario"("id_unidad");
ALTER TABLE "inventario"
  ADD CONSTRAINT "inventario_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad")
  ON DELETE RESTRICT ON UPDATE CASCADE;
