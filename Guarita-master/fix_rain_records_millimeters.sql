-- Script para ajustar a tabela rain_records para suportar medições iniciais sem milímetros
-- Execute este script no Supabase SQL Editor

-- 1. Alterar coluna millimeters para permitir NULL
ALTER TABLE rain_records
ALTER COLUMN millimeters DROP NOT NULL;

-- 2. Verificar a estrutura da tabela (opcional, pode não funcionar em todos os editores)
-- \d rain_records;

-- Mensagem de sucesso
SELECT 'Tabela rain_records ajustada para permitir milímetros nulos!' as status;
