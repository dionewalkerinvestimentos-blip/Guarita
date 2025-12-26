-- Script para recalcular tempos de viagem de todos os registros existentes
-- Execute este script no Supabase SQL Editor APÓS migrar os dados

-- ===========================================================
-- RECALCULAR TEMPOS DE LAVOURA (VIAGEM)
-- ===========================================================

-- PASSO 1: Desabilitar o trigger temporariamente para evitar conflito
ALTER TABLE puxe_viagens DISABLE TRIGGER trigger_calcular_tempos;

-- PASSO 2: Para cada viagem, calcular o tempo entre a saída da viagem anterior
-- e a chegada desta viagem (para a mesma placa)
UPDATE puxe_viagens pv1
SET tempo_lavoura_min = EXTRACT(EPOCH FROM (pv1.hora_chegada - pv2.saida_anterior)) / 60,
    total_viagem_min = COALESCE(pv1.tempo_unidade_min, 0) + EXTRACT(EPOCH FROM (pv1.hora_chegada - pv2.saida_anterior)) / 60
FROM (
    SELECT DISTINCT ON (pv_inner.id)
        pv_inner.id as viagem_id,
        pv_prev.hora_saida as saida_anterior
    FROM puxe_viagens pv_inner
    LEFT JOIN puxe_viagens pv_prev ON 
        pv_prev.placa = pv_inner.placa
        AND pv_prev.hora_saida IS NOT NULL
        AND pv_prev.hora_saida < pv_inner.hora_chegada
        AND DATE(pv_prev.hora_saida) = DATE(pv_inner.hora_chegada) -- Mesmo dia
    WHERE pv_inner.hora_chegada IS NOT NULL
    ORDER BY pv_inner.id, pv_prev.hora_saida DESC
) pv2
WHERE pv1.id = pv2.viagem_id
    AND pv2.saida_anterior IS NOT NULL;

-- PASSO 3: Reabilitar o trigger
ALTER TABLE puxe_viagens ENABLE TRIGGER trigger_calcular_tempos;

-- Verificar resultados
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN tempo_unidade_min IS NOT NULL THEN 1 END) as com_tempo_algodoeira,
    COUNT(CASE WHEN tempo_lavoura_min IS NOT NULL THEN 1 END) as com_tempo_viagem,
    COUNT(CASE WHEN total_viagem_min IS NOT NULL THEN 1 END) as com_tempo_total,
    ROUND(AVG(tempo_unidade_min), 2) as media_algodoeira,
    ROUND(AVG(tempo_lavoura_min), 2) as media_viagem,
    ROUND(AVG(total_viagem_min), 2) as media_total
FROM puxe_viagens;

-- Mostrar alguns exemplos
SELECT 
    placa,
    data,
    TO_CHAR(hora_chegada, 'HH24:MI') as entrada,
    TO_CHAR(hora_saida, 'HH24:MI') as saida,
    tempo_unidade_min as tempo_algodoeira,
    tempo_lavoura_min as tempo_viagem,
    total_viagem_min as tempo_total
FROM puxe_viagens
WHERE tempo_lavoura_min IS NOT NULL
ORDER BY data DESC, hora_chegada DESC
LIMIT 10;
