-- VERIFICAR e CORRIGIR produto "reciclado" que mudou para "Pluma"

-- 1. Ver se existem registros com produto alterado incorretamente
SELECT 
  id,
  plate,
  product,
  driver,
  status,
  created_at,
  updated_at
FROM loading_records
WHERE plate = 'SPN7B67'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver histórico de alterações (se tiver tabela de auditoria)
-- Se o produto foi alterado, pode ter sido por trigger ou pela aplicação

-- 3. CORRIGIR - Se encontrar registro errado, descomentar e executar:
-- UPDATE loading_records
-- SET product = 'Reciclados'
-- WHERE plate = 'SPN7B67'
--   AND product = 'Pluma'
--   AND created_at::date = '2025-11-08';

-- 4. Verificar todos os produtos registrados hoje
SELECT DISTINCT product, COUNT(*) as total
FROM loading_records
WHERE date = '2025-11-08'
GROUP BY product
ORDER BY product;
