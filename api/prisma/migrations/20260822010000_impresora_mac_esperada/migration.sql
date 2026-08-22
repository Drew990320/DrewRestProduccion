-- Ancla impresoras de red a su MAC para detectar IPs cruzadas (DHCP).
ALTER TABLE "impresora_pos" ADD COLUMN IF NOT EXISTS "mac_esperada" VARCHAR(17);
