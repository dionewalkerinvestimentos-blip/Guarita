-- ============================================
-- VIEW: view_ranking_puxe (ATUALIZADA)
-- Descrição: Ranking de caminhões com tempos corretos
-- Ignora primeira e última viagem do dia
-- ============================================

DROP VIEW IF EXISTS view_ranking_puxe CASCADE;

CREATE OR REPLACE VIEW view_ranking_puxe AS
WITH viagens_por_dia AS (
  -- Enumerar viagens de cada caminhão por dia
  SELECT 
    plate,
    driver,
    date,
    entry_time,
    exit_time,
    rolls,
    talhao,
    ROW_NUMBER() OVER (PARTITION BY plate, date ORDER BY entry_time) as viagem_num,
    COUNT(*) OVER (PARTITION BY plate, date) as total_viagens_dia,
    -- Calcular tempo algodoeira
    CASE 
      WHEN entry_time IS NOT NULL AND exit_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (date || ' ' || exit_time)::timestamp - 
          (date || ' ' || entry_time)::timestamp
        )) / 60
      ELSE NULL
    END as tempo_algodoeira
  FROM cotton_pull
  WHERE entry_time IS NOT NULL
    AND exit_time IS NOT NULL
),
viagens_com_tempo_lavoura AS (
  -- Calcular tempo de viagem (lavoura)
  SELECT 
    v1.plate,
    v1.driver,
    v1.date,
    v1.entry_time,
    v1.exit_time,
    v1.rolls,
    v1.talhao,
    v1.viagem_num,
    v1.total_viagens_dia,
    v1.tempo_algodoeira,
    -- Tempo na lavoura = entrada atual - saída anterior
    CASE 
      WHEN LAG(v1.exit_time) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time) IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (v1.date || ' ' || v1.entry_time)::timestamp - 
          (v1.date || ' ' || LAG(v1.exit_time) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time))::timestamp
        )) / 60
      ELSE NULL
    END as tempo_lavoura
  FROM viagens_por_dia v1
),
viagens_validas AS (
  -- Filtrar apenas viagens válidas (não primeira nem última)
  SELECT 
    plate,
    driver,
    date,
    tempo_algodoeira,
    tempo_lavoura,
    tempo_algodoeira + COALESCE(tempo_lavoura, 0) as tempo_total
  FROM viagens_com_tempo_lavoura
  WHERE viagem_num > 1  -- Ignora primeira viagem
    AND viagem_num < total_viagens_dia  -- Ignora última viagem
    AND tempo_algodoeira IS NOT NULL
    AND tempo_algodoeira > 0
    AND tempo_algodoeira < 300  -- Máximo 5h na algodoeira (acima = parou puxe)
    AND (tempo_lavoura IS NULL OR (tempo_lavoura > 0 AND tempo_lavoura < 300))  -- Máximo 5h na lavoura (acima = parou puxe)
)
SELECT 
  driver as motorista,
  plate as placa,
  COUNT(*) as viagens,
  ROUND(AVG(tempo_algodoeira)::numeric, 0) as media_algodoeira_min,
  ROUND(AVG(COALESCE(tempo_lavoura, 0))::numeric, 0) as media_viagem_min,
  ROUND(AVG(tempo_total)::numeric, 0) as media_total_min,
  MAX(date) as ultima_viagem
FROM viagens_validas
GROUP BY driver, plate
HAVING COUNT(*) >= 3  -- Mínimo 3 viagens válidas
ORDER BY viagens DESC, media_total_min ASC;

-- ============================================
-- TESTAR A VIEW
-- ============================================
SELECT * FROM view_ranking_puxe;
