-- TESTE SIMPLES MATERIAL_RECEIPTS
-- Execute linha por linha no Supabase SQL Editor

-- 1. Verificar se a tabela existe
\dt material_receipts

-- 2. Ver estrutura
\d material_receipts

-- 3. Testar inserção básica
INSERT INTO material_receipts (
  material_type,
  plate, 
  driver,
  net_weight
) VALUES (
  'Areia',
  'TST-1234',
  'João Teste', 
  10.5
);

-- 4. Ver o que foi inserido
SELECT * FROM material_receipts WHERE plate = 'TST-1234';

-- 5. Testar via API (simular o que a aplicação faz)
SELECT * FROM material_receipts ORDER BY date DESC, entry_time DESC;

-- 6. Limpar teste
DELETE FROM material_receipts WHERE plate = 'TST-1234';