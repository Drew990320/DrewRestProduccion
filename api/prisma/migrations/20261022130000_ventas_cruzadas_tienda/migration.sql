ALTER TABLE "config_operativa"
  ADD COLUMN IF NOT EXISTS "ventas_cruzadas_tienda" BOOLEAN NOT NULL DEFAULT false;
