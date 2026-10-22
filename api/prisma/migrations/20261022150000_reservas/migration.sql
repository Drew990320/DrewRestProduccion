DO $$ BEGIN
  CREATE TYPE "estado_reserva" AS ENUM ('activa', 'cumplida', 'cancelada', 'no_asistio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "reserva" (
  "id_reserva" SERIAL NOT NULL,
  "id_restaurante" INTEGER NOT NULL DEFAULT 1,
  "id_mesa" INTEGER,
  "id_lugar" INTEGER,
  "fecha" DATE NOT NULL,
  "hora" VARCHAR(5) NOT NULL,
  "duracion_min" INTEGER NOT NULL DEFAULT 120,
  "personas" INTEGER NOT NULL DEFAULT 2,
  "cliente_nombre" VARCHAR(120) NOT NULL,
  "cliente_telefono" VARCHAR(40),
  "notas" VARCHAR(500),
  "id_producto_servicio" INTEGER,
  "anticipo_monto" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "id_pedido_anticipo" INTEGER,
  "id_pedido" INTEGER,
  "estado" "estado_reserva" NOT NULL DEFAULT 'activa',
  "id_usuario" INTEGER NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reserva_pkey" PRIMARY KEY ("id_reserva")
);

ALTER TABLE "reserva" ADD COLUMN IF NOT EXISTS "anticipo_aplicado" DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "reserva_id_restaurante_fecha_estado_idx" ON "reserva"("id_restaurante", "fecha", "estado");
CREATE INDEX IF NOT EXISTS "reserva_id_mesa_idx" ON "reserva"("id_mesa");
CREATE INDEX IF NOT EXISTS "reserva_id_lugar_idx" ON "reserva"("id_lugar");

DO $$ BEGIN
  ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_mesa_fkey"
    FOREIGN KEY ("id_mesa") REFERENCES "mesa"("id_mesa") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_lugar_fkey"
    FOREIGN KEY ("id_lugar") REFERENCES "lugar_mesa"("id_lugar") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
