-- Migration: Permitir unidade 'UN' em material_receipts.unit_type
-- Data: 2025-12-22

-- Observação: execute este script no Supabase SQL Editor ou via psql

BEGIN;

ALTER TABLE material_receipts
  DROP CONSTRAINT IF EXISTS material_receipts_unit_type_check;

ALTER TABLE material_receipts
  ADD CONSTRAINT material_receipts_unit_type_check
    CHECK (unit_type IN ('KG','M3','M2','LITROS','UN'));

COMMIT;

-- Fim da migração
