-- Script para corrigir status de registros antigos
-- Execute este script no Supabase SQL Editor

-- 1. Atualizar registros que têm exit_date (saída completa) mas sem status
UPDATE loading_records
SET status = 'concluido'
WHERE exit_date IS NOT NULL
  AND (status IS NULL OR status = 'carregando');

-- 2. Atualizar registros que têm entry_date mas não têm exit_date (ainda carregando)
UPDATE loading_records
SET status = 'carregando'
WHERE entry_date IS NOT NULL
  AND exit_date IS NULL
  AND (status IS NULL OR status = 'fila');

-- 3. Atualizar registros que não têm entry_date (na fila)
UPDATE loading_records
SET status = 'fila'
WHERE entry_date IS NULL
  AND exit_date IS NULL
  AND status IS NULL;

-- Verificar os resultados
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN exit_date IS NOT NULL THEN 1 END) as com_saida,
  COUNT(CASE WHEN entry_date IS NOT NULL AND exit_date IS NULL THEN 1 END) as em_processo,
  COUNT(CASE WHEN entry_date IS NULL AND exit_date IS NULL THEN 1 END) as na_fila
FROM loading_records
GROUP BY status
ORDER BY status;
