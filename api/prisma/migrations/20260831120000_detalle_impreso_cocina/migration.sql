-- Marca si la línea ya salió impresa en comanda (reintento sin re-enviar a cocina).
ALTER TABLE "detalle_pedido" ADD COLUMN IF NOT EXISTS "impreso_cocina" BOOLEAN NOT NULL DEFAULT false;

-- Pedidos ya enviados a cocina: asumir impresos (solo fallos futuros quedan reintentables).
UPDATE "detalle_pedido"
SET "impreso_cocina" = true
WHERE "enviado_cocina" = true AND "impreso_cocina" = false;
