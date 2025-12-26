-- Script para adicionar o campo company (Empresa/Local) na tabela vehicles
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna company para armazenar empresa/local de origem
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS company TEXT;

-- 2. Comentário para documentação
COMMENT ON COLUMN vehicles.company IS 'Empresa ou local de origem do veículo';

-- Mensagem de sucesso
SELECT 'Campo company adicionado à tabela vehicles!' as status;
