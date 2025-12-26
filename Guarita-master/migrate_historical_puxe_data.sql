-- Script para migrar dados históricos do cotton_pull para puxe_viagens
-- Execute este script no Supabase SQL Editor APÓS criar a tabela puxe_viagens

-- Este script irá:
-- 1. Buscar todos os registros de cotton_pull que têm entrada E saída
-- 2. Criar registros correspondentes em puxe_viagens
-- 3. Os triggers calcularão automaticamente os tempos

-- ===========================================================
-- MIGRAÇÃO DE DADOS HISTÓRICOS
-- ===========================================================

-- Inserir registros históricos do cotton_pull na tabela puxe_viagens
INSERT INTO puxe_viagens (
    placa,
    motorista,
    fazenda_origem,
    data,
    hora_chegada,
    hora_saida
)
SELECT 
    cp.plate as placa,
    cp.driver as motorista,
    cp.farm as fazenda_origem,
    cp.date::date as data,
    -- Combinar data com hora para criar timestamp completo
    (cp.date || ' ' || cp.entry_time)::timestamp as hora_chegada,
    -- Apenas incluir hora_saida se existir
    CASE 
        WHEN cp.exit_time IS NOT NULL 
        THEN (cp.date || ' ' || cp.exit_time)::timestamp 
        ELSE NULL 
    END as hora_saida
FROM cotton_pull cp
WHERE cp.entry_time IS NOT NULL
    -- Evitar duplicatas: não inserir se já existe registro para mesma placa/data/hora
    AND NOT EXISTS (
        SELECT 1 
        FROM puxe_viagens pv 
        WHERE pv.placa = cp.plate 
            AND pv.data = cp.date::date
            AND pv.hora_chegada = (cp.date || ' ' || cp.entry_time)::timestamp
    )
ORDER BY cp.date, cp.entry_time;

-- Verificar quantos registros foram migrados
SELECT 
    'Migração concluída!' as status,
    COUNT(*) as total_registros_migrados,
    COUNT(CASE WHEN hora_saida IS NOT NULL THEN 1 END) as registros_com_saida,
    COUNT(CASE WHEN hora_saida IS NULL THEN 1 END) as registros_sem_saida
FROM puxe_viagens;

-- Mostrar resumo por fazenda
SELECT 
    fazenda_origem,
    COUNT(*) as total_viagens,
    COUNT(DISTINCT placa) as veiculos_distintos,
    MIN(data) as primeira_viagem,
    MAX(data) as ultima_viagem
FROM puxe_viagens
GROUP BY fazenda_origem
ORDER BY total_viagens DESC;

-- Verificar se há registros com tempos calculados
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN tempo_unidade_min IS NOT NULL THEN 1 END) as com_tempo_unidade,
    COUNT(CASE WHEN tempo_lavoura_min IS NOT NULL THEN 1 END) as com_tempo_lavoura,
    ROUND(AVG(tempo_unidade_min), 2) as media_tempo_unidade,
    ROUND(AVG(tempo_lavoura_min), 2) as media_tempo_lavoura
FROM puxe_viagens;
