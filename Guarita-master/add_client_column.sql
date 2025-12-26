-- Adicionar coluna client na tabela loading_records
-- Campo opcional para registrar o cliente do carregamento

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'loading_records' 
                   AND column_name = 'client'
                   AND table_schema = 'public') THEN
        ALTER TABLE loading_records ADD COLUMN client VARCHAR(255);
    END IF;
END $$;

-- Adicionar comentário na coluna
COMMENT ON COLUMN loading_records.client IS 'Cliente do carregamento (opcional)';

-- Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'loading_records' 
AND table_schema = 'public'
AND column_name = 'client';