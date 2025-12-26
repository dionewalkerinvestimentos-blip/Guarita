-- ============================================
-- VIEW: view_gestao_tempo_cargas
-- Descrição: Detalhamento carga a carga com tempos individuais
-- ============================================

-- Dropar a view antiga primeiro
DROP VIEW IF EXISTS view_gestao_tempo_cargas;

-- Criar a nova view
CREATE OR REPLACE VIEW view_gestao_tempo_cargas AS
WITH viagens_dia AS (
  -- Pegar todas as viagens de hoje com saída registrada OU com parada_puxe
  SELECT 
    id,
    plate,
    driver,
    date,
    entry_time,
    -- Se tem parada_puxe, usar hora_parada_puxe como exit_time
    CAST(CASE 
      WHEN parada_puxe = true AND hora_parada_puxe IS NOT NULL THEN hora_parada_puxe
      ELSE exit_time::time
    END AS VARCHAR) as exit_time,
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
          (date || ' ' || CAST(hora_parada_puxe AS VARCHAR))::timestamp - 
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
    -- Aceita exit_time OU parada_puxe (carga finalizada)
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
    -- Pegar a saída da viagem anterior (já considera parada_puxe pois foi tratado no CTE anterior)
    LAG(v1.exit_time) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time) as exit_time_anterior,
    -- Calcular tempo na lavoura (da saída anterior até entrada atual)
    CASE 
      WHEN LAG(v1.exit_time) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time) IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (v1.date || ' ' || v1.entry_time)::timestamp - 
          (v1.date || ' ' || LAG(v1.exit_time) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time))::timestamp
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
-- Aceita viagens finalizadas (exit_time) ou com parada_puxe
WHERE tempo_algodoeira IS NOT NULL
ORDER BY plate, viagem_num;

-- ============================================
-- TESTAR A VIEW
-- ============================================
SELECT * FROM view_gestao_tempo_cargas;

-- ============================================
-- VERIFICAR DADOS
-- ============================================
-- Ver todas as viagens de hoje
-- SELECT 
--   plate, 
--   driver,
--   entry_time, 
--   exit_time,
--   rolls
-- FROM cotton_pull 
-- WHERE date = CURRENT_DATE 
--   AND entry_time IS NOT NULL
-- ORDER BY plate, entry_time;
