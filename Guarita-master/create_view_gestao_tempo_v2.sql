-- ============================================
-- VIEW: view_gestao_tempo
-- Descrição: Calcula médias de tempo na algodoeira e na lavoura
-- ============================================

-- Verificar estrutura da tabela primeiro
-- SELECT * FROM cotton_pull LIMIT 5;

-- CRIAR A VIEW
CREATE OR REPLACE VIEW view_gestao_tempo AS
WITH viagens_hoje AS (
  -- Pegar viagens de HOJE apenas para calcular as médias
  SELECT 
    id,
    plate,
    date,
    entry_time,
    exit_time,
    created_at,
    -- Número da viagem do dia para cada caminhão
    ROW_NUMBER() OVER (PARTITION BY plate, date ORDER BY entry_time) as viagem_num,
    -- Total de viagens do dia para cada caminhão
    COUNT(*) OVER (PARTITION BY plate, date) as total_viagens_dia
  FROM cotton_pull
  WHERE date = CURRENT_DATE
    AND entry_time IS NOT NULL
  ORDER BY plate, date, entry_time
),
tempos_algodoeira AS (
  -- Calcular tempo na algodoeira (entry_time até exit_time)
  -- IGNORAR primeira e última viagem do dia
  SELECT 
    plate,
    date,
    entry_time,
    exit_time,
    viagem_num,
    total_viagens_dia,
    CASE 
      WHEN entry_time IS NOT NULL AND exit_time IS NOT NULL THEN
        -- Calcular diferença em minutos
        EXTRACT(EPOCH FROM (
          (date || ' ' || exit_time)::timestamp - 
          (date || ' ' || entry_time)::timestamp
        )) / 60
      ELSE NULL
    END as tempo_algodoeira_min
  FROM viagens_hoje
  WHERE viagem_num > 1  -- Ignora primeira viagem
    AND viagem_num < total_viagens_dia  -- Ignora última viagem
),
viagens_sequenciais AS (
  -- Pegar viagem atual e a anterior de cada caminhão
  SELECT 
    plate,
    date as data_entrada,
    entry_time,
    exit_time,
    tempo_algodoeira_min,
    LAG(date) OVER (PARTITION BY plate ORDER BY date, entry_time) as data_saida_anterior,
    LAG(exit_time) OVER (PARTITION BY plate ORDER BY date, entry_time) as exit_time_anterior
  FROM tempos_algodoeira
  WHERE tempo_algodoeira_min IS NOT NULL
    AND tempo_algodoeira_min > 0 
    AND tempo_algodoeira_min < 300 -- Máximo 5 horas (300 min) na algodoeira (acima = parou puxe)
    -- Excluir entradas no horário de almoço (11h às 13h)
    AND NOT (entry_time >= '11:00:00' AND entry_time <= '13:00:00')
),
tempos_lavoura AS (
  -- Calcular tempo na lavoura (saída anterior até entrada atual)
  SELECT 
    plate,
    tempo_algodoeira_min,
    CASE 
      WHEN data_saida_anterior IS NOT NULL AND exit_time_anterior IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (data_entrada || ' ' || entry_time)::timestamp - 
          (data_saida_anterior || ' ' || exit_time_anterior)::timestamp
        )) / 60
      ELSE NULL
    END as tempo_lavoura_min
  FROM viagens_sequenciais
)
SELECT 
  COALESCE(ROUND(AVG(tempo_algodoeira_min)::numeric, 0), 0) as tempo_algodoeira,
  COALESCE(ROUND(AVG(CASE 
    WHEN tempo_lavoura_min IS NOT NULL 
      AND tempo_lavoura_min > 0 -- Excluir zeros (1ª viagem)
      AND tempo_lavoura_min < 300 -- Máximo 5 horas (300 min) na lavoura (acima = parou puxe)
    THEN tempo_lavoura_min 
  END)::numeric, 0), 0) as tempo_lavoura
FROM tempos_lavoura
WHERE tempo_algodoeira_min > 0;

-- ============================================
-- TESTAR A VIEW
-- ============================================
SELECT * FROM view_gestao_tempo;

-- ============================================
-- QUERY PARA DEBUGGING (ver valores individuais)
-- ============================================
/*
WITH viagens_hoje AS (
  SELECT 
    id,
    plate,
    date,
    entry_time,
    exit_time,
    CASE 
      WHEN entry_time IS NOT NULL AND exit_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (date || ' ' || exit_time)::timestamp - 
          (date || ' ' || entry_time)::timestamp
        )) / 60
      ELSE NULL
    END as tempo_algodoeira
  FROM cotton_pull
  WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    AND entry_time IS NOT NULL
    AND exit_time IS NOT NULL
  ORDER BY date DESC, entry_time DESC
  LIMIT 20
)
SELECT 
  plate,
  date,
  entry_time,
  exit_time,
  ROUND(tempo_algodoeira::numeric, 1) as tempo_algodoeira_min
FROM viagens_hoje
WHERE tempo_algodoeira IS NOT NULL
  AND tempo_algodoeira > 0;
*/

-- ============================================
-- SE A VIEW DER ERRO, EXECUTE ISSO PRIMEIRO:
-- ============================================
-- DROP VIEW IF EXISTS view_gestao_tempo;

-- ============================================
-- VERIFICAR SE HÁ DADOS NA TABELA
-- ============================================
-- SELECT COUNT(*) FROM cotton_pull WHERE entry_time IS NOT NULL AND exit_time IS NOT NULL;
