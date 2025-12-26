-- Verificar registros de puxe criados hoje
SELECT 
  id,
  plate,
  driver,
  date,
  entry_time,
  exit_time,
  rolls,
  created_at,
  updated_at
FROM cotton_pull
WHERE DATE(created_at) = '2025-11-08'  -- Criados hoje
ORDER BY created_at DESC
LIMIT 10;

-- Ver se a data está sendo salva incorretamente
SELECT 
  id,
  plate,
  driver,
  date,
  created_at,
  CASE 
    WHEN date < DATE(created_at) THEN '❌ Data anterior ao created_at'
    WHEN date = DATE(created_at) THEN '✅ Data correta'
    ELSE '⚠️ Data futura'
  END as diagnostico
FROM cotton_pull
WHERE DATE(created_at) = '2025-11-08'
ORDER BY created_at DESC;
