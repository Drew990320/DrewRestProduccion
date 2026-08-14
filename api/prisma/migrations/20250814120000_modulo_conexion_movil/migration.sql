-- QR de conexión móvil (app / vincular / web). Solo superadmin lo activa.
ALTER TABLE "config_restaurante" ADD COLUMN IF NOT EXISTS "modulo_conexion_movil_activo" BOOLEAN NOT NULL DEFAULT false;
