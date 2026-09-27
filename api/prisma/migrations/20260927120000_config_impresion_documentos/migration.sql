ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "imprimir_comanda_al_enviar" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "imprimir_factura_al_cobrar" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "factura_copia_cliente_defecto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "imprimir_ticket_autoservicio" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "imprimir_base_caja" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "imprimir_cierre_base_caja" BOOLEAN NOT NULL DEFAULT true;
