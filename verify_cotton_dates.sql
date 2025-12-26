-- VERIFICAR DATAS DO PUXE DE ALGODÃO
-- Ver quantos registros existem para cada data

SELECT 
  date,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN exit_time IS NULL THEN 1 END) as em_andamento,
  COUNT(CASE WHEN exit_time IS NOT NULL THEN 1 END) as concluidos,
  MIN(entry_time) as primeira_entrada,
  MAX(entry_time) as ultima_entrada
FROM cotton_pull
WHERE date IN ('2025-11-07', '2025-11-08')
GROUP BY date
ORDER BY date DESC;

-- Ver registros criados hoje mas que têm data diferente
SELECT 
  'INCONSISTÊNCIA' as alerta,
  date as data_no_registro,
  created_at::date as data_criacao,
  COUNT(*) as total
FROM cotton_pull
WHERE created_at::date = '2025-11-08'
  AND date != '2025-11-08'
GROUP BY date, created_at::date;

-- Ver os 10 registros mais recentes
SELECT 
  id,
  date,
  entry_time,
  exit_time,
  plate,
  driver,
  producer,
  created_at
FROM cotton_pull
ORDER BY created_at DESC
LIMIT 10;
