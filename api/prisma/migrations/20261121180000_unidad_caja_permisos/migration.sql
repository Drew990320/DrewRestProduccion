CREATE TABLE "usuario_unidad" (
  "id_usuario" INTEGER NOT NULL,
  "id_unidad" INTEGER NOT NULL,
  CONSTRAINT "usuario_unidad_pkey" PRIMARY KEY ("id_usuario", "id_unidad")
);

CREATE INDEX "usuario_unidad_id_unidad_idx" ON "usuario_unidad"("id_unidad");

ALTER TABLE "usuario_unidad"
  ADD CONSTRAINT "usuario_unidad_id_usuario_fkey"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "usuario_unidad"
  ADD CONSTRAINT "usuario_unidad_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "caja_unidad" (
  "id_caja_unidad" SERIAL NOT NULL,
  "id_unidad" INTEGER NOT NULL,
  "fecha" DATE NOT NULL,
  "monto_base_efectivo" DECIMAL(12,2) NOT NULL,
  "monto_base_cierre_efectivo" DECIMAL(12,2),
  "monto_arqueo_efectivo" DECIMAL(12,2),
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "caja_unidad_pkey" PRIMARY KEY ("id_caja_unidad")
);

CREATE UNIQUE INDEX "caja_unidad_id_unidad_fecha_key" ON "caja_unidad"("id_unidad", "fecha");

ALTER TABLE "caja_unidad"
  ADD CONSTRAINT "caja_unidad_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "producto" ADD COLUMN "id_unidad" INTEGER;
CREATE INDEX "producto_id_unidad_idx" ON "producto"("id_unidad");
ALTER TABLE "producto"
  ADD CONSTRAINT "producto_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "gasto_fijo_ganancia" ADD COLUMN "id_unidad" INTEGER;
ALTER TABLE "gasto_fijo_ganancia"
  ADD CONSTRAINT "gasto_fijo_ganancia_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "gasto_extra_ganancia" ADD COLUMN "id_unidad" INTEGER;
CREATE INDEX "gasto_extra_ganancia_id_unidad_idx" ON "gasto_extra_ganancia"("id_unidad");
ALTER TABLE "gasto_extra_ganancia"
  ADD CONSTRAINT "gasto_extra_ganancia_id_unidad_fkey"
  FOREIGN KEY ("id_unidad") REFERENCES "unidad_operativa"("id_unidad") ON DELETE RESTRICT ON UPDATE CASCADE;
