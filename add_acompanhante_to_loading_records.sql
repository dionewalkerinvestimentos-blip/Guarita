-- Adicionar campo acompanhante à tabela loading_records
-- Execute este script no Supabase SQL Editor

ALTER TABLE loading_records 
ADD COLUMN IF NOT EXISTS acompanhante BOOLEAN DEFAULT false;

-- Comentar a coluna
COMMENT ON COLUMN loading_records.acompanhante IS 'Indica se há um acompanhante no carregamento';
