-- Cómo se muestran las categorías en la barra del menú: iconos | texto | ambos
ALTER TABLE "config_visual" ADD COLUMN IF NOT EXISTS "menu_categoria_vista" VARCHAR(20);
