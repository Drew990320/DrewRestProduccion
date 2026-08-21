-- Comandas por canal: qué tipos de pedido recibe cada impresora de cocina.
ALTER TABLE "impresora_pos" ADD COLUMN IF NOT EXISTS "comanda_mesa" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "impresora_pos" ADD COLUMN IF NOT EXISTS "comanda_mostrador" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "impresora_pos" ADD COLUMN IF NOT EXISTS "comanda_para_llevar" BOOLEAN NOT NULL DEFAULT true;
