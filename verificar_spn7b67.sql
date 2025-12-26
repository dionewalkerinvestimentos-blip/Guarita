-- VERIFICAR o caminhão SPN7B67

-- 1. Ver o registro atual
SELECT 
  id,
  plate,
  product,
  status,
  entry_date,
  entry_time,
  exit_date,
  exit_time,
  created_at,
  updated_at
FROM loading_records
WHERE plate = 'SPN7B67'
  AND date = '2025-11-08'
ORDER BY created_at DESC;

-- 2. Ver TODOS os registros de hoje
SELECT 
  plate,
  product,
  status,
  entry_date,
  exit_date
FROM loading_records
WHERE date = '2025-11-08'
ORDER BY created_at DESC;

-- 3. Contar por produto
SELECT 
  product,
  status,
  COUNT(*) as total
FROM loading_records
WHERE date = '2025-11-08'
GROUP BY product, status
ORDER BY product, status;
