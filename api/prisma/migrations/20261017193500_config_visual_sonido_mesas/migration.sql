-- Sonido de cambio de mesa: encendido y tono elegido en Personalización.
ALTER TABLE "config_visual" ADD COLUMN IF NOT EXISTS "sonido_mesas_activo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_visual" ADD COLUMN IF NOT EXISTS "sonido_mesas_id" VARCHAR(20) NOT NULL DEFAULT 'campana';
