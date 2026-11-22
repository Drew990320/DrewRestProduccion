-- Costo de la línea en el momento del cobro. No se recalcula si cambia el producto.
ALTER TABLE "detalle_pedido"
  ADD COLUMN IF NOT EXISTS "costo_unitario_cierre" DECIMAL(12, 2);

-- Lo ya facturado se congela con el costo que el catálogo tiene ahora.
-- A partir de esta migración, cada cobro nuevo guarda el suyo y no se vuelve a tocar.
UPDATE "detalle_pedido" AS d
SET "costo_unitario_cierre" = COALESCE(
  p."precio_costo",
  CASE
    WHEN r."activa" = true AND r."costo_calculado" IS NOT NULL THEN r."costo_calculado"
    ELSE 0
  END
)
FROM "producto" AS p
LEFT JOIN "receta_producto" AS r ON r."id_producto" = p."id_producto"
WHERE d."id_producto" = p."id_producto"
  AND d."id_factura" IS NOT NULL
  AND d."costo_unitario_cierre" IS NULL;
