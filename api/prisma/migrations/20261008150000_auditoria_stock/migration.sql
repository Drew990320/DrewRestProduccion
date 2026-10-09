-- CreateTable
CREATE TABLE IF NOT EXISTS "auditoria_stock" (
    "id_auditoria" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "accion" VARCHAR(40) NOT NULL,
    "origen" VARCHAR(20) NOT NULL,
    "id_referencia" INTEGER,
    "nombre" VARCHAR(200) NOT NULL,
    "stock_anterior" DECIMAL(12,3),
    "stock_nuevo" DECIMAL(12,3),
    "motivo" VARCHAR(255),
    "id_usuario" INTEGER NOT NULL,
    "nombre_usuario" VARCHAR(120) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_stock_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "auditoria_stock_id_restaurante_creado_en_idx" ON "auditoria_stock"("id_restaurante", "creado_en");
