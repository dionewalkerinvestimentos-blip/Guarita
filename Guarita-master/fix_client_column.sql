-- Adicionar coluna client na tabela loading_records
-- Execute este script no Supabase Dashboard > SQL Editor

ALTER TABLE loading_records ADD COLUMN IF NOT EXISTS client VARCHAR(255);

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'loading_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;