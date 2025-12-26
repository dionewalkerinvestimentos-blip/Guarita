-- Adicionar coluna harvest_year na tabela loading_records
ALTER TABLE loading_records 
ADD COLUMN IF NOT EXISTS harvest_year VARCHAR(10) NOT NULL DEFAULT '2024/2025';

-- Adicionar comentário na coluna
COMMENT ON COLUMN loading_records.harvest_year IS 'Safra: 2024/2025, 2023/2024, etc.';