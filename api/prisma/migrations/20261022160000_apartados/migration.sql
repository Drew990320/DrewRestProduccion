DO $$ BEGIN
  CREATE TYPE "estado_apartado" AS ENUM ('activo', 'entregado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "apartado" (
  "id_apartado" SERIAL NOT NULL,
  "id_restaurante" INTEGER NOT NULL DEFAULT 1,
  "id_tienda" INTEGER NOT NULL,
  "cliente_nombre" VARCHAR(120) NOT NULL,
  "cliente_telefono" VARCHAR(40),
  "notas" VARCHAR(500),
  "total" DECIMAL(12,2) NOT NULL,
  "fecha_limite" DATE,
  "estado" "estado_apartado" NOT NULL DEFAULT 'activo',
  "id_usuario" INTEGER NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "entregado_en" TIMESTAMP(3),
  CONSTRAINT "apartado_pkey" PRIMARY KEY ("id_apartado")
);

CREATE TABLE IF NOT EXISTS "apartado_item" (
  "id_item" SERIAL NOT NULL,
  "id_apartado" INTEGER NOT NULL,
  "id_producto" INTEGER NOT NULL,
  "id_variante" INTEGER,
  "nombre" VARCHAR(200) NOT NULL,
  "cantidad" INTEGER NOT NULL,
  "precio_unitario" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "apartado_item_pkey" PRIMARY KEY ("id_item")
);

CREATE TABLE IF NOT EXISTS "apartado_abono" (
  "id_abono" SERIAL NOT NULL,
  "id_apartado" INTEGER NOT NULL,
  "monto" DECIMAL(12,2) NOT NULL,
  "id_pedido" INTEGER NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "apartado_abono_pkey" PRIMARY KEY ("id_abono")
);

CREATE INDEX IF NOT EXISTS "apartado_id_restaurante_estado_idx" ON "apartado"("id_restaurante", "estado");
CREATE INDEX IF NOT EXISTS "apartado_id_tienda_idx" ON "apartado"("id_tienda");
CREATE INDEX IF NOT EXISTS "apartado_item_id_apartado_idx" ON "apartado_item"("id_apartado");
CREATE INDEX IF NOT EXISTS "apartado_abono_id_apartado_idx" ON "apartado_abono"("id_apartado");
CREATE INDEX IF NOT EXISTS "apartado_abono_id_pedido_idx" ON "apartado_abono"("id_pedido");

DO $$ BEGIN
  ALTER TABLE "apartado" ADD CONSTRAINT "apartado_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "apartado" ADD CONSTRAINT "apartado_id_tienda_fkey"
    FOREIGN KEY ("id_tienda") REFERENCES "tienda"("id_tienda") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "apartado_item" ADD CONSTRAINT "apartado_item_id_apartado_fkey"
    FOREIGN KEY ("id_apartado") REFERENCES "apartado"("id_apartado") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "apartado_abono" ADD CONSTRAINT "apartado_abono_id_apartado_fkey"
    FOREIGN KEY ("id_apartado") REFERENCES "apartado"("id_apartado") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
