-- Idempotencia de deducción en cobro: count por id_documento.
CREATE INDEX IF NOT EXISTS "mov_inventario_id_documento_idx"
  ON "mov_inventario" ("id_documento");
