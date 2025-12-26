-- Migration: Adiciona coluna exit_date em vehicles
-- Data: 2025-12-10

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS exit_date DATE;

-- Opcional: criar índice para consultas por data de saída
CREATE INDEX IF NOT EXISTS idx_vehicles_exit_date ON vehicles(exit_date);
