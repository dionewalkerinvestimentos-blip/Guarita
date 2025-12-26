-- Script para criar Views Analíticas de Gestão de Puxe de Rolos
-- Execute este script no Supabase SQL Editor APÓS executar create_puxe_viagens_table.sql

-- ===========================================================
-- 🔷 VIEW PRINCIPAL: view_relatorio_puxe
-- Consolida todos os dados de viagens com cálculos de tempo
-- ===========================================================
CREATE OR REPLACE VIEW view_relatorio_puxe AS
SELECT
    pv.id,
    pv.placa,
    pv.motorista,
    pv.fazenda_origem as fazenda,
    pv.data,
    pv.hora_chegada,
    pv.hora_saida,
    pv.tempo_unidade_min,
    pv.tempo_lavoura_min,
    pv.total_viagem_min,
    pv.observacao,
    DATE_TRUNC('day', pv.hora_chegada) AS dia,
    DATE_TRUNC('month', pv.hora_chegada) AS mes,
    DATE_TRUNC('year', pv.hora_chegada) AS ano
FROM puxe_viagens pv
WHERE pv.hora_chegada IS NOT NULL;

-- ===========================================================
-- 🔹 VIEW AGREGADA DIÁRIA
-- Médias e totais por dia
-- ===========================================================
CREATE OR REPLACE VIEW view_puxe_diario AS
SELECT 
    DATE(dia) as dia,
    COUNT(*) AS total_viagens,
    COUNT(DISTINCT placa) AS total_veiculos,
    COUNT(DISTINCT motorista) AS total_motoristas,
    ROUND(AVG(tempo_unidade_min), 2) AS media_algodoeira_min,
    ROUND(AVG(tempo_lavoura_min), 2) AS media_viagem_min,
    ROUND(AVG(total_viagem_min), 2) AS media_total_min,
    ROUND(MIN(tempo_unidade_min), 2) AS min_algodoeira_min,
    ROUND(MAX(tempo_unidade_min), 2) AS max_algodoeira_min,
    ROUND(MIN(tempo_lavoura_min), 2) AS min_viagem_min,
    ROUND(MAX(tempo_lavoura_min), 2) AS max_viagem_min
FROM view_relatorio_puxe
GROUP BY dia
ORDER BY dia DESC;

-- ===========================================================
-- 🔹 VIEW AGREGADA MENSAL / POR FAZENDA
-- Análise mensal por origem
-- ===========================================================
CREATE OR REPLACE VIEW view_puxe_mensal AS
SELECT 
    TO_CHAR(mes, 'YYYY-MM') as mes,
    fazenda,
    COUNT(*) AS viagens,
    COUNT(DISTINCT placa) AS veiculos_distintos,
    ROUND(AVG(tempo_unidade_min), 2) AS media_algodoeira_min,
    ROUND(AVG(tempo_lavoura_min), 2) AS media_viagem_min,
    ROUND(AVG(total_viagem_min), 2) AS media_total_min,
    ROUND(SUM(tempo_unidade_min), 2) AS total_algodoeira_min,
    ROUND(SUM(tempo_lavoura_min), 2) AS total_viagem_min
FROM view_relatorio_puxe
GROUP BY mes, fazenda
ORDER BY mes DESC, fazenda;

-- ===========================================================
-- 🔹 VIEW RANKING DE CAMINHÕES / MOTORISTAS
-- Top performers por quantidade de viagens
-- ===========================================================
CREATE OR REPLACE VIEW view_ranking_puxe AS
SELECT 
    motorista,
    placa,
    COUNT(*) AS viagens,
    ROUND(AVG(tempo_unidade_min), 2) AS media_algodoeira_min,
    ROUND(AVG(tempo_lavoura_min), 2) AS media_viagem_min,
    ROUND(AVG(total_viagem_min), 2) AS media_total_min,
    ROUND(MIN(tempo_lavoura_min), 2) AS melhor_tempo_viagem_min,
    ROUND(MAX(tempo_lavoura_min), 2) AS pior_tempo_viagem_min,
    MAX(DATE(hora_chegada)) AS ultima_viagem
FROM view_relatorio_puxe
WHERE tempo_lavoura_min IS NOT NULL
GROUP BY motorista, placa
ORDER BY viagens DESC, media_total_min ASC;

-- ===========================================================
-- 🔹 VIEW DETALHADA PARA EXPORTAÇÃO
-- Todas as viagens com dados completos formatados
-- ===========================================================
CREATE OR REPLACE VIEW view_puxe_exportacao AS
SELECT 
    pv.placa,
    pv.motorista,
    pv.fazenda_origem as fazenda,
    TO_CHAR(pv.data, 'DD/MM/YYYY') as data,
    TO_CHAR(pv.hora_chegada, 'HH24:MI') as chegada,
    TO_CHAR(pv.hora_saida, 'HH24:MI') as saida,
    ROUND(pv.tempo_unidade_min, 2) as tempo_algodoeira_min,
    ROUND(pv.tempo_lavoura_min, 2) as tempo_viagem_min,
    ROUND(pv.total_viagem_min, 2) as tempo_total_min,
    pv.observacao
FROM puxe_viagens pv
ORDER BY pv.hora_chegada DESC;

-- ===========================================================
-- 🔹 ÍNDICES ADICIONAIS (otimiza os dashboards)
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_motorista ON puxe_viagens(motorista);
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_fazenda ON puxe_viagens(fazenda_origem);
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_data_placa ON puxe_viagens(data, placa);

-- ===========================================================
-- 🔹 GRANTS PARA RLS (permite acesso às views)
-- ===========================================================
ALTER VIEW view_relatorio_puxe SET (security_invoker = true);
ALTER VIEW view_puxe_diario SET (security_invoker = true);
ALTER VIEW view_puxe_mensal SET (security_invoker = true);
ALTER VIEW view_ranking_puxe SET (security_invoker = true);
ALTER VIEW view_puxe_exportacao SET (security_invoker = true);

-- Verificar views criadas
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE viewname LIKE 'view_puxe%' OR viewname LIKE 'view_relatorio_puxe'
ORDER BY viewname;

-- Mensagem de sucesso
SELECT 'Views analíticas criadas com sucesso!' as status,
       'Execute SELECT * FROM view_puxe_diario LIMIT 10 para testar' as teste;
