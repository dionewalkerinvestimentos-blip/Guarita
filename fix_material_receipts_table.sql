-- ===== CRIAÇÃO DA TABELA MATERIAL_RECEIPTS =====
-- Execute este script no Supabase Dashboard > SQL Editor
-- IMPORTANTE: Execute LINHA POR LINHA ou BLOCO POR BLOCO

-- 1. Criar a tabela material_receipts
CREATE TABLE IF NOT EXISTS material_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME NOT NULL DEFAULT CURRENT_TIME,
  exit_time TIME,
  material_type VARCHAR(100) NOT NULL,
  plate VARCHAR(20) NOT NULL,
  driver VARCHAR(255) NOT NULL,
  supplier VARCHAR(255),
  net_weight DECIMAL(10,3) NOT NULL,
  volume_m3 DECIMAL(10,3),
  volume_m2 DECIMAL(10,3), 
  volume_liters DECIMAL(10,3),
  unit_type VARCHAR(20) NOT NULL DEFAULT 'KG',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_material_receipts_date ON material_receipts(date);
CREATE INDEX IF NOT EXISTS idx_material_receipts_material_type ON material_receipts(material_type);
CREATE INDEX IF NOT EXISTS idx_material_receipts_plate ON material_receipts(plate);
CREATE INDEX IF NOT EXISTS idx_material_receipts_created_at ON material_receipts(created_at);

-- 3. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_material_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para updated_at
DROP TRIGGER IF EXISTS update_material_receipts_updated_at ON material_receipts;
CREATE TRIGGER update_material_receipts_updated_at 
BEFORE UPDATE ON material_receipts 
FOR EACH ROW EXECUTE FUNCTION update_material_receipts_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE material_receipts ENABLE ROW LEVEL SECURITY;

-- 6. Criar política permissiva (ajustar conforme necessário)
DROP POLICY IF EXISTS "Allow all operations on material_receipts" ON material_receipts;
CREATE POLICY "Allow all operations on material_receipts" 
ON material_receipts FOR ALL 
USING (true)
WITH CHECK (true);

-- 7. Inserir dados de teste (opcional)
INSERT INTO material_receipts (
  date, 
  entry_time, 
  material_type, 
  plate, 
  driver, 
  supplier,
  net_weight, 
  unit_type, 
  observations
) VALUES 
(
  CURRENT_DATE, 
  CURRENT_TIME, 
  'Areia', 
  'ABC-1234', 
  'João Silva', 
  'Mineradora Santos',
  15.5, 
  'KG', 
  'Material de teste - pode ser removido'
);

-- 8. Verificar se a tabela foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'material_receipts' 
ORDER BY ordinal_position;

-- 9. Verificar os dados
SELECT COUNT(*) as total_registros FROM material_receipts;
SELECT * FROM material_receipts LIMIT 5;

-- 10. Testar inserção (execute este bloco separadamente se necessário)
DO $$
BEGIN
  INSERT INTO material_receipts (
    material_type, 
    plate, 
    driver, 
    net_weight
  ) VALUES (
    'Teste', 
    'TST-9999', 
    'Usuario Teste', 
    1.0
  );
  
  RAISE NOTICE 'Inserção de teste realizada com sucesso!';
  
  DELETE FROM material_receipts WHERE plate = 'TST-9999';
  RAISE NOTICE 'Registro de teste removido com sucesso!';
END $$;