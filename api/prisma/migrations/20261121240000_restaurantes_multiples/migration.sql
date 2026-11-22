ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "modulo_restaurantes_multiples_activo" BOOLEAN NOT NULL DEFAULT false;
