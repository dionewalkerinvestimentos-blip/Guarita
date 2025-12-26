-- Migration: Adicionar coluna exit_date em material_receipts
-- Data: 2025-12-22

-- Observação: execute este script no Supabase SQL Editor ou via psql

BEGIN;

ALTER TABLE material_receipts
  ADD COLUMN IF NOT EXISTS exit_date DATE;

COMMIT;

-- Fim da migração
