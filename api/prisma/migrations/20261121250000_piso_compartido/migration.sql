ALTER TABLE "restaurante"
  ADD COLUMN IF NOT EXISTS "id_restaurante_piso" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restaurante_id_restaurante_piso_fkey'
  ) THEN
    ALTER TABLE "restaurante"
      ADD CONSTRAINT "restaurante_id_restaurante_piso_fkey"
      FOREIGN KEY ("id_restaurante_piso") REFERENCES "restaurante"("id_restaurante")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
