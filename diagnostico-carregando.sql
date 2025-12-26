-- Diagnóstico: Caminhões com status 'carregando' que não aparecem nos cards

-- 1. Ver TODOS os registros com status 'carregando'
SELECT 
  id,
  plate,
  driver,
  product,
  status,
  date as data_marcacao,
  time as hora_marcacao,
  entry_date,
  entry_time,
  exit_date,
  exit_time,
  loaded_at,
  created_at,
  updated_at
FROM loading_records
WHERE status = 'carregando'
ORDER BY entry_date DESC, entry_time DESC;

-- 2. Ver registros de HOJE com status 'carregando'
SELECT 
  id,
  plate,
  driver,
  product,
  status,
  date as data_marcacao,
  time as hora_marcacao,
  entry_date,
  entry_time,
  exit_date,
  exit_time,
  loaded_at,
  created_at,
  updated_at
FROM loading_records
WHERE status = 'carregando'
  AND entry_date = CURRENT_DATE::text
ORDER BY entry_time DESC;

-- 3. Ver registros que foram marcados ONTEM na fila e receberam entrada HOJE
SELECT 
  id,
  plate,
  driver,
  product,
  status,
  date as data_marcacao,
  time as hora_marcacao,
  entry_date,
  entry_time,
  exit_date,
  exit_time,
  loaded_at,
  created_at,
  updated_at
FROM loading_records
WHERE status = 'carregando'
  AND date::date < CURRENT_DATE
  AND entry_date = CURRENT_DATE::text
ORDER BY entry_time DESC;

-- 4. Ver TODOS os registros de HOJE (para contexto)
SELECT 
  status,
  COUNT(*) as quantidade
FROM loading_records
WHERE entry_date = CURRENT_DATE::text
   OR date = CURRENT_DATE::text
GROUP BY status
ORDER BY status;

-- 5. Ver registros problemáticos (com status carregando mas sem exit_date e sem entry_date de hoje)
SELECT 
  id,
  plate,
  driver,
  product,
  status,
  date as data_marcacao,
  entry_date,
  entry_time,
  exit_date,
  CASE 
    WHEN entry_date = CURRENT_DATE::text THEN '✓ Entrada HOJE'
    WHEN entry_date IS NULL THEN '✗ SEM entrada'
    ELSE '⚠ Entrada em ' || entry_date
  END as diagnostico
FROM loading_records
WHERE status = 'carregando'
  AND exit_date IS NULL
ORDER BY entry_date DESC NULLS LAST;
