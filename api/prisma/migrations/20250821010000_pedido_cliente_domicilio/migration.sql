-- Datos de domicilio / entrega en pedidos para llevar
ALTER TABLE "pedido" ADD COLUMN IF NOT EXISTS "cliente_nombre" TEXT;
ALTER TABLE "pedido" ADD COLUMN IF NOT EXISTS "cliente_telefono" TEXT;
ALTER TABLE "pedido" ADD COLUMN IF NOT EXISTS "cliente_direccion" TEXT;
