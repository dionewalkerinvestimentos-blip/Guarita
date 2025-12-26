-- Tabela para Recebimento de Materiais
-- Execute este script no Supabase Dashboard (SQL Editor)

CREATE TABLE IF NOT EXISTS material_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME NOT NULL DEFAULT CURRENT_TIME,
  exit_time TIME, -- Hora de saída
  material_type VARCHAR(50) NOT NULL, -- Areia, Cascalho, Cavaco, Pedra Brita, Pó de Pedra, Álcool
  plate VARCHAR(20) NOT NULL,
  driver VARCHAR(255) NOT NULL,
  net_weight DECIMAL(10,3) NOT NULL, -- Peso Líquido em toneladas (OBRIGATÓRIO)
  volume_m3 DECIMAL(10,3), -- Volume em metros cúbicos
  volume_m2 DECIMAL(10,3), -- Volume em metros quadrados
  volume_liters DECIMAL(10,3), -- Volume em litros
  unit_type VARCHAR(10) NOT NULL DEFAULT 'KG', -- KG, M3, M2, LITROS
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_material_receipts_date ON material_receipts(date);
CREATE INDEX IF NOT EXISTS idx_material_receipts_material_type ON material_receipts(material_type);
CREATE INDEX IF NOT EXISTS idx_material_receipts_plate ON material_receipts(plate);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_material_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_material_receipts_updated_at ON material_receipts;
CREATE TRIGGER update_material_receipts_updated_at 
BEFORE UPDATE ON material_receipts 
FOR EACH ROW EXECUTE FUNCTION update_material_receipts_updated_at();

-- Política de segurança (opcional)
-- ALTER TABLE material_receipts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON material_receipts FOR ALL USING (true);

-- Verificar criação da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'material_receipts' 
ORDER BY ordinal_position;