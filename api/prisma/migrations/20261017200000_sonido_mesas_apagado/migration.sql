-- El tono de mesas llega apagado. Cada restaurante lo enciende en Personalización.
ALTER TABLE "config_visual" ALTER COLUMN "sonido_mesas_activo" SET DEFAULT false;
UPDATE "config_visual" SET "sonido_mesas_activo" = false;
