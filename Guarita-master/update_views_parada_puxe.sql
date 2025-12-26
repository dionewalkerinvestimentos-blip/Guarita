-- ============================================
-- Atualizar views para considerar parada_puxe
-- ============================================

-- ============================================
-- 1. Atualizar view_gestao_tempo_cargas
-- ============================================
DROP VIEW IF EXISTS view_gestao_tempo_cargas;

CREATE OR REPLACE VIEW view_gestao_tempo_cargas AS
WITH viagens_dia AS (
  -- Pegar todas as viagens de hoje com saída registrada
  SELECT 
    id,
    plate,
    driver,
    date,
    entry_time,
    exit_time,
    rolls,
    talhao,
    parada_puxe,
    hora_parada_puxe,
    created_at,
    -- Calcular tempo na algodoeira
    -- Se tem parada_puxe, usar hora_parada_puxe como fim, senão usar exit_time
    CASE 
      WHEN entry_time IS NOT NULL AND parada_puxe = true AND hora_parada_puxe IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (date || ' ' || hora_parada_puxe)::timestamp - 
          (date || ' ' || entry_time)::timestamp
        )) / 60
      WHEN entry_time IS NOT NULL AND exit_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (date || ' ' || exit_time)::timestamp - 
          (date || ' ' || entry_time)::timestamp
        )) / 60
      ELSE NULL
    END as tempo_algodoeira,
    -- Número da viagem do dia para cada caminhão
    ROW_NUMBER() OVER (PARTITION BY plate, date ORDER BY entry_time) as viagem_num,
    -- Total de viagens do dia para cada caminhão
    COUNT(*) OVER (PARTITION BY plate, date) as total_viagens_dia
  FROM cotton_pull
  WHERE date = CURRENT_DATE
    AND entry_time IS NOT NULL
    AND (exit_time IS NOT NULL OR (parada_puxe = true AND hora_parada_puxe IS NOT NULL))
  ORDER BY plate, entry_time
),
viagens_com_tempo_lavoura AS (
  SELECT 
    v1.id,
    v1.plate,
    v1.driver,
    v1.date,
    v1.entry_time,
    v1.exit_time,
    v1.rolls,
    v1.talhao,
    v1.parada_puxe,
    v1.tempo_algodoeira,
    v1.viagem_num,
    v1.total_viagens_dia,
    -- Pegar a saída da viagem anterior (ou hora_parada_puxe se for o caso)
    LAG(COALESCE(v1.hora_parada_puxe, v1.exit_time)) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time) as exit_time_anterior,
    -- Calcular tempo na lavoura (da saída anterior até entrada atual)
    CASE 
      WHEN LAG(COALESCE(v1.hora_parada_puxe, v1.exit_time)) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time) IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (v1.date || ' ' || v1.entry_time)::timestamp - 
          (v1.date || ' ' || LAG(COALESCE(v1.hora_parada_puxe, v1.exit_time)) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time))::timestamp
        )) / 60
      ELSE NULL
    END as tempo_lavoura
  FROM viagens_dia v1
)
SELECT 
  plate as placa,
  driver as motorista,
  talhao,
  viagem_num,
  rolls as qtd_rolos,
  parada_puxe,
  COALESCE(ROUND(tempo_lavoura::numeric, 0), 0) as tempo_lavoura,
  COALESCE(ROUND(tempo_algodoeira::numeric, 0), 0) as tempo_algodoeira,
  COALESCE(ROUND((tempo_lavoura + tempo_algodoeira)::numeric, 0), ROUND(tempo_algodoeira::numeric, 0)) as tempo_total,
  entry_time as hora_entrada,
  exit_time as hora_saida
FROM viagens_com_tempo_lavoura
-- Mostra TODAS as viagens (inclusive 1ª e última)
-- Apenas garante que tem tempo de algodoeira calculado
WHERE tempo_algodoeira IS NOT NULL
ORDER BY plate, viagem_num;

-- ============================================
-- 2. Atualizar view_gestao_tempo (médias)
-- ============================================
DROP VIEW IF EXISTS view_gestao_tempo CASCADE;

CREATE OR REPLACE VIEW view_gestao_tempo AS
WITH viagens_hoje AS (
  -- Pegar viagens de HOJE apenas para calcular as médias
  SELECT 
    id,
    plate,
    date,
    entry_time,
    exit_time,
    parada_puxe,
    hora_parada_puxe,
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
  -- Calcular tempo na algodoeira (entry_time até exit_time ou hora_parada_puxe)
  -- IGNORAR primeira e última viagem do dia
  SELECT 
    plate,
    date,
    entry_time,
    exit_time,
    parada_puxe,
    hora_parada_puxe,
    viagem_num,
    total_viagens_dia,
    CASE 
      -- Se tem parada_puxe, usar hora_parada_puxe
      WHEN entry_time IS NOT NULL AND parada_puxe = true AND hora_parada_puxe IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (date || ' ' || hora_parada_puxe)::timestamp - 
          (date || ' ' || entry_time)::timestamp
        )) / 60
      -- Senão, usar exit_time normal
      WHEN entry_time IS NOT NULL AND exit_time IS NOT NULL THEN
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
    hora_parada_puxe,
    tempo_algodoeira_min,
    LAG(date) OVER (PARTITION BY plate ORDER BY date, entry_time) as data_saida_anterior,
    -- Usar hora_parada_puxe se existir, senão exit_time
    LAG(COALESCE(hora_parada_puxe, exit_time)) OVER (PARTITION BY plate ORDER BY date, entry_time) as exit_time_anterior
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
-- TESTAR AS VIEWS
-- ============================================
SELECT * FROM view_gestao_tempo;
SELECT * FROM view_gestao_tempo_cargas;
