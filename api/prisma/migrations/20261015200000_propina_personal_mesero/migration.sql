-- Propinas que el mesero anota en su cuenta. No participan del cuadre de caja.

CREATE TABLE IF NOT EXISTS "propina_personal_mesero" (
  "id_propina" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "fecha" DATE NOT NULL,
  "monto" DECIMAL(12, 2) NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "propina_personal_mesero_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "propina_personal_mesero_id_usuario_fecha_idx"
  ON "propina_personal_mesero"("id_usuario", "fecha");
