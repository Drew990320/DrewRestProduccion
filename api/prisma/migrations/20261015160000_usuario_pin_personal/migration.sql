-- PIN propio del mesero y preferencia del contador de propinas.

ALTER TABLE "usuario"
  ADD COLUMN IF NOT EXISTS "pin_personal_hash" VARCHAR(255);

ALTER TABLE "usuario"
  ADD COLUMN IF NOT EXISTS "mostrar_contador_propinas" BOOLEAN NOT NULL DEFAULT false;
