-- Script para adicionar campo company na tabela vehicles
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna company para armazenar Empresa/Local de origem
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS company TEXT;

-- Mensagem de sucesso
SELECT 'Campo company adicionado à tabela vehicles!' as status;
