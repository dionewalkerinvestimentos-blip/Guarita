-- Script para adicionar campo invoice_number na tabela loading_records
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna invoice_number
ALTER TABLE loading_records
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- 2. Comentário para documentação
COMMENT ON COLUMN loading_records.invoice_number IS 'Número da nota fiscal do carregamento';

-- 3. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'loading_records'
ORDER BY ordinal_position;

-- Mensagem de sucesso
SELECT 'Coluna invoice_number adicionada à tabela loading_records!' as status;
