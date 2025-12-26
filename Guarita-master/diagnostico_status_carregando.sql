-- Diagnóstico completo: Ver TODOS os registros com status 'carregando'

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
  CASE 
    WHEN exit_date IS NOT NULL THEN '❌ TEM EXIT_DATE (inconsistente!)'
    WHEN entry_date IS NULL THEN '⚠️ SEM ENTRY_DATE (não entrou ainda)'
    ELSE '✅ OK - Carregando'
  END as diagnostico
FROM loading_records
WHERE status = 'carregando'
ORDER BY 
  CASE WHEN exit_date IS NOT NULL THEN 1 ELSE 2 END,
  CASE WHEN entry_date IS NULL THEN 1 ELSE 2 END,
  entry_date DESC;

-- 2. Contar por situação
SELECT 
  CASE 
    WHEN exit_date IS NOT NULL THEN 'Inconsistente: tem exit_date'
    WHEN entry_date IS NULL THEN 'Sem entry_date (na fila?)'
    ELSE 'OK: Carregando ativamente'
  END as situacao,
  COUNT(*) as quantidade
FROM loading_records
WHERE status = 'carregando'
GROUP BY 
  CASE 
    WHEN exit_date IS NOT NULL THEN 'Inconsistente: tem exit_date'
    WHEN entry_date IS NULL THEN 'Sem entry_date (na fila?)'
    ELSE 'OK: Carregando ativamente'
  END
ORDER BY quantidade DESC;

-- 3. Ver registros na FILA que deveriam estar carregando
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
  'Deveria estar CARREGANDO mas status=fila' as problema
FROM loading_records
WHERE status = 'fila'
  AND entry_date IS NOT NULL
ORDER BY entry_date DESC;
