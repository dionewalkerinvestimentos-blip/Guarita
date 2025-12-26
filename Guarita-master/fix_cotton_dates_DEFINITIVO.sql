-- CORRIGIR DEFINITIVAMENTE as datas do puxe de lavoura
-- Atualizar TODOS os registros criados hoje mas com data errada

-- 1. Ver quantos registros estão errados
SELECT 
  COUNT(*) as total_errados,
  'Registros criados hoje (08/11) mas com data de ontem (07/11)' as problema
FROM cotton_pull
WHERE created_at::date = '2025-11-08'  -- Criados hoje
  AND date = '2025-11-07';  -- Mas têm data de ontem

-- 2. Listar os registros que serão corrigidos
SELECT 
  id,
  plate,
  driver,
  date as data_errada,
  '2025-11-08' as data_correta,
  created_at
FROM cotton_pull
WHERE created_at::date = '2025-11-08'
  AND date = '2025-11-07'
ORDER BY created_at DESC;

-- 3. CORRIGIR - Atualizar a data para hoje (08/11)
UPDATE cotton_pull
SET date = '2025-11-08'
WHERE created_at::date = '2025-11-08'  -- Criados hoje
  AND date = '2025-11-07';  -- Com data errada

-- 4. Verificar a correção
SELECT 
  id,
  plate,
  driver,
  date,
  created_at,
  '✅ CORRIGIDO' as status
FROM cotton_pull
WHERE created_at::date = '2025-11-08'
ORDER BY created_at DESC;

-- 5. Contar registros de hoje com data correta
SELECT 
  COUNT(*) as total_hoje,
  'Registros de hoje (08/11) com data CORRETA' as status
FROM cotton_pull
WHERE date = '2025-11-08';
