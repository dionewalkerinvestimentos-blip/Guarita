-- Criação da tabela loading_records para carregamentos
CREATE TABLE IF NOT EXISTS loading_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  product VARCHAR(50) NOT NULL, -- Pluma, Caroço, Fibrilha, Briquete
  harvest_year VARCHAR(10) NOT NULL DEFAULT '2024/2025', -- Safra: 2024/2025, 2023/2024, etc.
  truck_type VARCHAR(50) NOT NULL, -- Rodotrem, Bitrem, etc.
  is_sider BOOLEAN DEFAULT false,
  carrier VARCHAR(255) NOT NULL, -- Transportadora
  destination VARCHAR(255) NOT NULL,
  plate VARCHAR(20) NOT NULL,
  driver VARCHAR(255) NOT NULL,
  entry_date DATE,
  entry_time TIME,
  exit_date DATE,
  exit_time TIME,
  bales INTEGER DEFAULT 0,
  weight DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_loading_records_date ON loading_records(date);
CREATE INDEX IF NOT EXISTS idx_loading_records_product ON loading_records(product);
CREATE INDEX IF NOT EXISTS idx_loading_records_carrier ON loading_records(carrier);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_loading_records_updated_at ON loading_records;
CREATE TRIGGER update_loading_records_updated_at 
  BEFORE UPDATE ON loading_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();