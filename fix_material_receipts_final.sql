-- Script para recriar a tabela material_receipts com estrutura correta
-- Execute este script no Supabase SQL Editor

-- 1. Drop table se existir (cuidado: vai perder dados!)
DROP TABLE IF EXISTS material_receipts CASCADE;

-- 2. Criar nova tabela com estrutura correta
CREATE TABLE material_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_time TIME,
    exit_time TIME,
    material_type VARCHAR NOT NULL,
    plate VARCHAR NOT NULL,
    driver VARCHAR NOT NULL,
    supplier VARCHAR,
    net_weight NUMERIC NOT NULL DEFAULT 0,
    volume_m3 NUMERIC,
    volume_m2 NUMERIC,
    volume_liters NUMERIC,
    unit_type VARCHAR NOT NULL CHECK (unit_type IN ('KG', 'M3', 'M2', 'LITROS')) DEFAULT 'KG',
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR
);

-- 3. Desabilitar RLS
ALTER TABLE material_receipts DISABLE ROW LEVEL SECURITY;

-- 4. Inserir dados de teste para verificar funcionamento
INSERT INTO material_receipts (
    date, entry_time, material_type, plate, driver, net_weight, unit_type, observations
) VALUES 
('2024-11-05', '08:30', 'Areia', 'ABC-1234', 'João Silva', 15000, 'KG', 'Teste de funcionamento'),
('2024-11-05', '14:15', 'Cascalho', 'DEF-5678', 'Maria Santos', 20000, 'KG', 'Segundo teste');

-- 5. Verificar se funcionou
SELECT * FROM material_receipts ORDER BY created_at DESC;

-- 6. Grants necessários
GRANT ALL ON material_receipts TO anon, authenticated;

-- Mensagem de sucesso
SELECT 'Tabela material_receipts recriada com sucesso!' as status;