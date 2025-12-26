-- Migration: Forçar colunas de data em equipment para DATE
-- Data: 2025-12-22

-- Observação: execute este script no Supabase SQL Editor ou via psql

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='date') THEN
    EXECUTE 'ALTER TABLE equipment ALTER COLUMN "date" TYPE DATE USING ("date"::date)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='return_date') THEN
    EXECUTE 'ALTER TABLE equipment ALTER COLUMN return_date TYPE DATE USING (return_date::date)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='exit_date') THEN
    EXECUTE 'ALTER TABLE equipment ALTER COLUMN exit_date TYPE DATE USING (exit_date::date)';
  END IF;
END $$;

COMMIT;

-- Fim da migração
