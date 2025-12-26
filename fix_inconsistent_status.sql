-- Corrigir registros inconsistentes: status='carregando' MAS com exit_date preenchida
-- Esses registros já saíram, então devem ter status='concluido'

-- 1. Ver os registros inconsistentes
SELECT 
  id,
  plate,
  driver,
  product,
  status,
  entry_date,
  entry_time,
  exit_date,
  exit_time,
  'INCONSISTENTE: tem exit_date mas status=carregando' as problema
FROM loading_records
WHERE status = 'carregando'
  AND exit_date IS NOT NULL
ORDER BY exit_date DESC;

-- 2. CORRIGIR: Atualizar status para 'concluido' nos que já saíram
UPDATE loading_records
SET 
  status = 'concluido',
  updated_at = NOW()
WHERE status = 'carregando'
  AND exit_date IS NOT NULL;

-- 3. Verificar a correção
SELECT 
  status,
  COUNT(*) as quantidade,
  COUNT(CASE WHEN exit_date IS NOT NULL THEN 1 END) as com_saida,
  COUNT(CASE WHEN exit_date IS NULL THEN 1 END) as sem_saida
FROM loading_records
WHERE status IN ('carregando', 'carregado', 'concluido')
GROUP BY status
ORDER BY status;

-- 4. Ver os registros que estão REALMENTE carregando (sem saída)
SELECT 
  id,
  plate,
  driver,
  product,
  status,
  entry_date,
  entry_time,
  exit_date,
  exit_time,
  EXTRACT(EPOCH FROM (NOW() - (entry_date || ' ' || entry_time)::timestamp)) / 3600 as horas_carregando
FROM loading_records
WHERE status = 'carregando'
  AND exit_date IS NULL
ORDER BY entry_date DESC, entry_time DESC;
