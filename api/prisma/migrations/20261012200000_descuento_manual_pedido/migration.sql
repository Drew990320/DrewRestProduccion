-- Descuento manual del admin sobre lo pendiente de cobro de un pedido abierto.
ALTER TABLE "pedido" ADD COLUMN IF NOT EXISTS "descuento_manual_monto" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "pedido" ADD COLUMN IF NOT EXISTS "descuento_manual_motivo" VARCHAR(160);
ALTER TABLE "factura" ADD COLUMN IF NOT EXISTS "descuento_manual" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TYPE "TipoEventoPedido" ADD VALUE IF NOT EXISTS 'descuento_manual_actualizado';
