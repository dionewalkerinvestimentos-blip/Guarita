-- Corrige registros com status 'carregado' que não têm loaded_at preenchido
-- Este script garante que todos os caminhões carregados apareçam nos concluídos

-- CORREÇÃO 1: Para registros que têm entry_date e entry_time - usa essa data/hora como loaded_at
UPDATE public.loading_records 
SET loaded_at = (
    CASE 
        WHEN entry_time IS NOT NULL THEN 
            -- Combina entry_date com entry_time para criar timestamp completo
            (entry_date::text || ' ' || entry_time::text)::timestamp AT TIME ZONE 'America/Sao_Paulo'
        ELSE 
            -- Se não tem entry_time, usa entry_date às 12:00
            (entry_date::text || ' 12:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo'
    END
)
WHERE status = 'carregado' 
    AND loaded_at IS NULL 
    AND entry_date IS NOT NULL;

-- CORREÇÃO 2: Para registros sem entry_date mas que estão carregados, usa created_at ou updated_at
UPDATE public.loading_records 
SET loaded_at = COALESCE(updated_at, created_at, NOW())
WHERE status = 'carregado' 
    AND loaded_at IS NULL 
    AND entry_date IS NULL;

-- Verificar quantos registros foram corrigidos
SELECT 
    COUNT(*) as total_carregados,
    COUNT(CASE WHEN loaded_at IS NOT NULL THEN 1 END) as com_loaded_at,
    COUNT(CASE WHEN loaded_at IS NULL THEN 1 END) as sem_loaded_at
FROM public.loading_records 
WHERE status = 'carregado';

-- Listar registros carregados para verificação
SELECT 
    plate,
    driver,
    product,
    status,
    entry_date,
    entry_time,
    exit_date,
    exit_time,
    loaded_at,
    created_at
FROM public.loading_records 
WHERE status = 'carregado'
ORDER BY loaded_at DESC NULLS LAST
LIMIT 20;