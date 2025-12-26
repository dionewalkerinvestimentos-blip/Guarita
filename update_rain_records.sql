-- Atualização da tabela rain_records para adicionar hora de início e fim
-- Renomear campo 'time' para 'start_time' e adicionar 'end_time'

ALTER TABLE rain_records 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Migrar dados existentes (se houver)
UPDATE rain_records 
SET start_time = time 
WHERE start_time IS NULL AND time IS NOT NULL;

-- Depois que migrar os dados, pode remover a coluna antiga se necessário
-- ALTER TABLE rain_records DROP COLUMN time;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_rain_records_start_time ON rain_records(start_time);
CREATE INDEX IF NOT EXISTS idx_rain_records_end_time ON rain_records(end_time);