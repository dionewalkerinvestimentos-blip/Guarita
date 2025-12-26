-- Corrigir datas do puxe de lavoura criados hoje mas com data de ontem
UPDATE cotton_pull
SET date = '2025-11-08'
WHERE DATE(created_at) = '2025-11-08'  -- Criados hoje
  AND date = '2025-11-07';  -- Mas com data de ontem

-- Verificar a correção
SELECT 
  id,
  plate,
  driver,
  date,
  created_at,
  'Data corrigida para hoje' as status
FROM cotton_pull
WHERE DATE(created_at) = '2025-11-08'
ORDER BY created_at DESC;
