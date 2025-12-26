-- Corrige status de registros que entraram mas ainda estão como 'fila'
-- Estes registros têm entry_date preenchida mas status='fila'
-- Devem ter status='carregando'

UPDATE loading_records
SET status = 'carregando'
WHERE status = 'fila'
  AND entry_date IS NOT NULL
  AND exit_date IS NULL;

-- Ver quantos registros foram atualizados
SELECT 
  COUNT(*) as registros_corrigidos,
  'Registros mudados de fila → carregando' as descricao
FROM loading_records
WHERE status = 'carregando'
  AND entry_date IS NOT NULL
  AND exit_date IS NULL;
