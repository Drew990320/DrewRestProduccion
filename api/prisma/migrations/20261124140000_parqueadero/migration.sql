ALTER TABLE "config_restaurante"
  ADD COLUMN "modulo_parqueadero_activo" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "parking_settings" (
  "id_parking_settings" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL UNIQUE REFERENCES "restaurante"("id_restaurante"),
  "nombre" VARCHAR(120) NOT NULL DEFAULT 'Parqueadero',
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "zona_horaria" VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
  "moneda" VARCHAR(8) NOT NULL DEFAULT 'COP',
  "tolerancia_segundos" INTEGER NOT NULL DEFAULT 0,
  "permite_placa_parcial" BOOLEAN NOT NULL DEFAULT true,
  "permite_id_alternativo" BOOLEAN NOT NULL DEFAULT true,
  "politica_planes" VARCHAR(20) NOT NULL DEFAULT 'SINGLE',
  "politica_vencimiento" VARCHAR(30) NOT NULL DEFAULT 'CHARGE_REMAINDER',
  "permite_pago_parcial" BOOLEAN NOT NULL DEFAULT true,
  "horario_json" JSONB,
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "parking_vehicle_types" (
  "id_tipo" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL REFERENCES "restaurante"("id_restaurante"),
  "nombre" VARCHAR(80) NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  UNIQUE ("id_restaurante", "nombre")
);

CREATE TABLE "parking_rates" (
  "id_tarifa" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL,
  "id_tipo" INTEGER NOT NULL REFERENCES "parking_vehicle_types"("id_tipo"),
  "precio" DECIMAL(14,2) NOT NULL,
  "segundos_unidad" INTEGER NOT NULL,
  "cobro_minimo" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "tolerancia_segundos" INTEGER NOT NULL DEFAULT 0,
  "vigente_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activo" BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX "parking_rates_tipo_idx" ON "parking_rates" ("id_restaurante", "id_tipo", "activo");

CREATE TABLE "parking_plans" (
  "id_plan" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL,
  "id_tipo" INTEGER NOT NULL REFERENCES "parking_vehicle_types"("id_tipo"),
  "nombre" VARCHAR(80) NOT NULL,
  "dias" INTEGER NOT NULL,
  "precio" DECIMAL(14,2) NOT NULL,
  "modalidad" VARCHAR(20) NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "parking_plan_compatibility" (
  "id_compat" SERIAL PRIMARY KEY,
  "id_plan_a" INTEGER NOT NULL REFERENCES "parking_plans"("id_plan"),
  "id_plan_b" INTEGER NOT NULL REFERENCES "parking_plans"("id_plan"),
  UNIQUE ("id_plan_a", "id_plan_b")
);

CREATE TABLE "parking_vehicles" (
  "id_vehiculo" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL,
  "id_tipo" INTEGER NOT NULL REFERENCES "parking_vehicle_types"("id_tipo"),
  "letras" VARCHAR(8) NOT NULL DEFAULT '',
  "numeros" VARCHAR(8) NOT NULL DEFAULT '',
  "placa_completa" VARCHAR(16) NOT NULL DEFAULT '',
  "tipo_identificacion" VARCHAR(20) NOT NULL,
  "codigo_identificacion" VARCHAR(40) NOT NULL
);
CREATE INDEX "parking_vehicles_placa_idx" ON "parking_vehicles" ("id_restaurante", "placa_completa");

CREATE TABLE "parking_tickets" (
  "id_ticket" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL,
  "id_unidad" INTEGER,
  "id_vehiculo" INTEGER NOT NULL REFERENCES "parking_vehicles"("id_vehiculo"),
  "id_suscripcion" INTEGER,
  "estado" VARCHAR(24) NOT NULL,
  "entrada_en" TIMESTAMP(3) NOT NULL,
  "salida_en" TIMESTAMP(3),
  "tarifa_foto" JSONB NOT NULL,
  "politica_vencimiento" VARCHAR(30) NOT NULL,
  "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "pagado" DECIMAL(14,2) NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "parking_ticket_abierto_idx"
  ON "parking_tickets" ("id_vehiculo", COALESCE("id_unidad", 0))
  WHERE "estado" IN ('OPEN', 'PENDING_PAYMENT');

CREATE TABLE "parking_subscriptions" (
  "id_suscripcion" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL,
  "id_vehiculo" INTEGER NOT NULL REFERENCES "parking_vehicles"("id_vehiculo"),
  "id_plan" INTEGER NOT NULL REFERENCES "parking_plans"("id_plan"),
  "modalidad" VARCHAR(20) NOT NULL,
  "inicio_en" TIMESTAMP(3) NOT NULL,
  "vence_en" TIMESTAMP(3) NOT NULL,
  "precio" DECIMAL(14,2) NOT NULL,
  "pagado" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "estado" VARCHAR(20) NOT NULL,
  "uso_continuo" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "parking_subscription_payments" (
  "id_pago" SERIAL PRIMARY KEY,
  "id_suscripcion" INTEGER NOT NULL REFERENCES "parking_subscriptions"("id_suscripcion"),
  "monto" DECIMAL(14,2) NOT NULL,
  "metodo" VARCHAR(20) NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "referencia" VARCHAR(80),
  "idempotencia" VARCHAR(80) NOT NULL UNIQUE,
  "id_movimiento_caja" INTEGER,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "parking_ticket_payments" (
  "id_pago" SERIAL PRIMARY KEY,
  "id_ticket" INTEGER NOT NULL REFERENCES "parking_tickets"("id_ticket"),
  "monto" DECIMAL(14,2) NOT NULL,
  "metodo" VARCHAR(20) NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "referencia" VARCHAR(80),
  "idempotencia" VARCHAR(80) NOT NULL UNIQUE,
  "id_movimiento_caja" INTEGER,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "parking_adjustments" (
  "id_ajuste" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL,
  "id_ticket" INTEGER,
  "id_suscripcion" INTEGER,
  "tipo" VARCHAR(20) NOT NULL,
  "valor" DECIMAL(14,2) NOT NULL,
  "importe_original" DECIMAL(14,2) NOT NULL,
  "total_final" DECIMAL(14,2) NOT NULL,
  "id_solicitante" INTEGER NOT NULL,
  "id_autorizador" INTEGER NOT NULL,
  "motivo" VARCHAR(200) NOT NULL,
  "estado" VARCHAR(20) NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "parking_audit_logs" (
  "id_log" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL,
  "id_usuario" INTEGER,
  "accion" VARCHAR(60) NOT NULL,
  "detalle" JSONB,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
