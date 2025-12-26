-- CORRIGIR SPN7B67 - Mudar de 'fila' para 'carregando'

-- 1. Ver o registro atual
SELECT 
  id,
  plate,
  product,
  status,
  entry_date,
  entry_time
FROM loading_records
WHERE plate = 'SPN7B67'
  AND date = '2025-11-08';

-- 2. CORRIGIR - Atualizar status para 'carregando'
UPDATE loading_records
SET status = 'carregando'
WHERE plate = 'SPN7B67'
  AND date = '2025-11-08'
  AND status = 'fila'
  AND entry_date IS NOT NULL;

-- 3. Verificar a correção
SELECT 
  id,
  plate,
  product,
  status,
  entry_date,
  entry_time,
  '✅ CORRIGIDO' as resultado
FROM loading_records
WHERE plate = 'SPN7B67'
  AND date = '2025-11-08';
