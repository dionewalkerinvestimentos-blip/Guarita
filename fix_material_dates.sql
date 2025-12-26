-- Corrigir datas dos materiais que foram salvos com 1 dia a menos
-- Execute este script no Supabase SQL Editor

-- Atualizar registros que estão com data errada (adicionar 1 dia)
-- 04/11 -> 05/11
-- 05/11 -> 06/11

UPDATE material_receipts 
SET date = date + INTERVAL '1 day'
WHERE date IN ('2025-11-04', '2025-11-05');

-- Verificar os resultados
SELECT id, date, material_type, plate, driver 
FROM material_receipts 
WHERE date >= '2025-11-04' 
ORDER BY date DESC;
