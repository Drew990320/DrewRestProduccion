-- Personal del restaurante: pagos de turno no limitados al rol mesero.
ALTER TABLE "usuario" ADD COLUMN "elegible_pago_turno" BOOLEAN NOT NULL DEFAULT false;

UPDATE "usuario" u
SET "elegible_pago_turno" = true
FROM "rol" r
WHERE u."id_rol" = r."id_rol" AND r."nombre" = 'mesero';
