-- Adicionar coluna exit_time na tabela cotton_pull se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cotton_pull' AND column_name = 'exit_time') THEN
    ALTER TABLE cotton_pull ADD COLUMN exit_time TIME;
  END IF;
END$$;