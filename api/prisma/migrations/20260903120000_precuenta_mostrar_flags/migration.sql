-- Precuenta: flags de contenido independientes de factura_mostrar_*.
ALTER TABLE "config_restaurante"
  ADD COLUMN "precuenta_mostrar_logo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "precuenta_mostrar_mesero" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "precuenta_mostrar_comensales" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "precuenta_mostrar_detalle_items" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "precuenta_mostrar_descuentos" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "precuenta_mostrar_metodo_pago" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "precuenta_mostrar_vuelto" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "precuenta_mostrar_propina" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "precuenta_mostrar_gracias" BOOLEAN NOT NULL DEFAULT true;

-- Al actualizar, precuenta hereda lo que ya tenían configurado para factura/precuenta unificada.
UPDATE "config_restaurante" SET
  "precuenta_mostrar_logo" = "factura_mostrar_logo",
  "precuenta_mostrar_mesero" = "factura_mostrar_mesero",
  "precuenta_mostrar_comensales" = "factura_mostrar_comensales",
  "precuenta_mostrar_detalle_items" = "factura_mostrar_detalle_items",
  "precuenta_mostrar_descuentos" = "factura_mostrar_descuentos",
  "precuenta_mostrar_metodo_pago" = "factura_mostrar_metodo_pago",
  "precuenta_mostrar_vuelto" = "factura_mostrar_vuelto",
  "precuenta_mostrar_propina" = "factura_mostrar_propina",
  "precuenta_mostrar_gracias" = "factura_mostrar_gracias";
