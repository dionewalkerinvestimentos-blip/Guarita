-- Criar função para prevenir atualização automática de loaded_at
-- loaded_at deve ser preservado quando registro for editado

CREATE OR REPLACE FUNCTION preserve_loaded_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Se loaded_at já existe no registro antigo, preservar o valor
  IF OLD.loaded_at IS NOT NULL THEN
    NEW.loaded_at := OLD.loaded_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para loading_records
DROP TRIGGER IF EXISTS preserve_loaded_at_trigger ON loading_records;
CREATE TRIGGER preserve_loaded_at_trigger
BEFORE UPDATE ON loading_records
FOR EACH ROW
EXECUTE FUNCTION preserve_loaded_at();

-- Testar: mostrar loaded_at atual
SELECT 
  plate,
  status,
  loaded_at,
  updated_at,
  'Before trigger' as note
FROM loading_records
WHERE plate IN ('RNA3E80', 'THI8E28', 'RAQ0J02')
ORDER BY updated_at DESC;
