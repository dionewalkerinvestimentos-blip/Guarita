-- Verificar TODOS os registros criados hoje (2025-11-08)
SELECT 
  id,
  plate,
  driver,
  date,
  entry_time,
  DATE(created_at AT TIME ZONE 'America/Sao_Paulo') as data_criacao_br,
  created_at,
  CASE 
    WHEN date = '2025-11-08' THEN '✅ Data correta'
    WHEN date = '2025-11-07' THEN '❌ Data errada (ontem)'
    ELSE '⚠️ Data diferente'
  END as status
FROM cotton_pull
WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = '2025-11-08'
ORDER BY created_at DESC;

-- Corrigir TODOS que foram criados hoje mas tem data de ontem
UPDATE cotton_pull
SET date = DATE(created_at AT TIME ZONE 'America/Sao_Paulo')
WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = '2025-11-08'
  AND date != DATE(created_at AT TIME ZONE 'America/Sao_Paulo');

-- Verificar resultado
SELECT 
  'APÓS CORREÇÃO' as momento,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN date = '2025-11-08' THEN 1 END) as com_data_correta
FROM cotton_pull
WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = '2025-11-08';
