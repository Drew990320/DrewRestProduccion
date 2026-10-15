ALTER TABLE "config_operativa"
  ADD COLUMN "autoservicio_bienvenida" VARCHAR(120) NOT NULL DEFAULT '¡Bienvenido! Arma tu pedido aquí',
  ADD COLUMN "autoservicio_inactividad_seg" INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN "autoservicio_permite_mesa" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "autoservicio_permite_sin_mesa" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "autoservicio_permite_para_llevar" BOOLEAN NOT NULL DEFAULT true;
