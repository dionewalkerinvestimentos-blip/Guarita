-- Corrigir loaded_at do RNA3E80
-- O loaded_at foi atualizado para hoje por erro, mas deveria ser ontem (data da saída)

UPDATE loading_records
SET loaded_at = '2025-11-07 17:01:00'  -- Mesmo horário da saída
WHERE plate = 'RNA3E80'
  AND id = '08d790ab-bf52-42fd-8e48-72da222fa1cf';

-- Verificar a correção
SELECT 
  plate,
  status,
  entry_date,
  loaded_at,
  exit_date,
  updated_at
FROM loading_records
WHERE plate = 'RNA3E80'
  AND id = '08d790ab-bf52-42fd-8e48-72da222fa1cf';
