-- Adicionar campo status à tabela loading_records
-- Execute este script no Supabase SQL Editor

-- Tipo ENUM para status
DO $$ BEGIN
    CREATE TYPE loading_status AS ENUM ('fila', 'carregando', 'carregado', 'concluido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna status
ALTER TABLE loading_records 
ADD COLUMN IF NOT EXISTS status loading_status DEFAULT 'fila';

-- Atualizar registros existentes baseado nas regras atuais
-- Se tem exit_time e todos os dados completos = concluido
UPDATE loading_records 
SET status = 'concluido'
WHERE exit_time IS NOT NULL 
  AND invoice_number IS NOT NULL 
  AND weight > 0 
  AND bales > 0;

-- Se tem entry_time mas não está concluído = carregando
UPDATE loading_records 
SET status = 'carregando'
WHERE entry_time IS NOT NULL 
  AND status = 'fila';

-- Comentar a coluna
COMMENT ON COLUMN loading_records.status IS 'Status do carregamento: fila (aguardando), carregando (em progresso), carregado (finalizado mas sem dados completos), concluido (totalmente finalizado)';
