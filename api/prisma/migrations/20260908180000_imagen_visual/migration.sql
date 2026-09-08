-- Tamaño de logo en ticket/factura y fotos del menú (personalización visual).

ALTER TABLE "config_visual" ADD COLUMN IF NOT EXISTS "logo_ticket_tamano" VARCHAR(20);
ALTER TABLE "config_visual" ADD COLUMN IF NOT EXISTS "menu_imagen_altura" VARCHAR(20);
ALTER TABLE "config_visual" ADD COLUMN IF NOT EXISTS "menu_imagen_ajuste" VARCHAR(20);
