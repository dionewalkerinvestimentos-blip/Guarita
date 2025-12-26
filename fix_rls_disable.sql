-- SOLUÇÃO RÁPIDA: Desabilitar RLS para material_receipts
-- Execute no Supabase SQL Editor para resolver erro 400 imediatamente

-- 1. DESABILITAR ROW LEVEL SECURITY (solução imediata)
ALTER TABLE material_receipts DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR SE FUNCIONOU
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'material_receipts';
-- Deve retornar rowsecurity = false

-- 3. TESTE RÁPIDO DE INSERÇÃO
INSERT INTO material_receipts (
    material_type,
    plate, 
    driver,
    net_weight,
    unit_type
) VALUES (
    'Teste Imediato',
    'TST-0001',
    'Sistema', 
    1.0,
    'KG'
);

-- 4. VERIFICAR SE INSERIU
SELECT COUNT(*) as total FROM material_receipts;
SELECT * FROM material_receipts WHERE plate = 'TST-0001';

-- 5. LIMPAR TESTE
DELETE FROM material_receipts WHERE plate = 'TST-0001';

-- PRONTO! Agora a aplicação deve funcionar sem erro 400