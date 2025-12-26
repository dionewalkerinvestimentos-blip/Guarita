-- Verificar dados do RNA3E80
SELECT 
  id,
  plate,
  driver,
  status,
  date as data_marcacao,
  entry_date,
  loaded_at,
  exit_date,
  created_at,
  updated_at
FROM loading_records
WHERE plate = 'RNA3E80'
ORDER BY created_at DESC
LIMIT 5;
