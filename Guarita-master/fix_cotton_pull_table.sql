-- Scripts SQL para adicionar colunas que podem estar faltando na tabela cotton_pull
-- Execute estes comandos no painel SQL do Supabase

-- Adicionar coluna talhao se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cotton_pull' AND column_name = 'talhao') THEN
    ALTER TABLE cotton_pull ADD COLUMN talhao VARCHAR(100);
  END IF;
END$$;

-- Adicionar coluna exit_time se não existir  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cotton_pull' AND column_name = 'exit_time') THEN
    ALTER TABLE cotton_pull ADD COLUMN exit_time TIME;
  END IF;
END$$;

-- Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'cotton_pull' 
ORDER BY ordinal_position;