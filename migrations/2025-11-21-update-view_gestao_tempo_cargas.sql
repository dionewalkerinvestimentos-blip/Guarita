-- Migration: Atualiza view_gestao_tempo_cargas para preservar NULL em vez de 0
-- Data: 2025-11-21

-- Dropar a view antiga primeiro
DROP VIEW IF EXISTS view_gestao_tempo_cargas;

-- Criar a nova view
CREATE OR REPLACE VIEW view_gestao_tempo_cargas AS
WITH viagens_dia AS (
  SELECT 
    id,
    plate,
    driver,
    date,
    entry_time,
    CAST(CASE 
      WHEN parada_puxe = true AND hora_parada_puxe IS NOT NULL THEN hora_parada_puxe
      ELSE exit_time::time
    END AS VARCHAR) as exit_time,
    rolls,
    talhao,
    parada_puxe,
    hora_parada_puxe,
    created_at,
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
    ROW_NUMBER() OVER (PARTITION BY plate, date ORDER BY entry_time) as viagem_num,
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
    LAG(v1.exit_time) OVER (PARTITION BY v1.plate, v1.date ORDER BY v1.entry_time) as exit_time_anterior,
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
  vctl.plate as placa,
  vctl.driver as motorista,
  to_char(vctl.date::date, 'DD/MM/YY') as data,
  v.vehicle_type as tipo_veiculo,
  talhao,
  viagem_num,
  rolls as qtd_rolos,
  parada_puxe,
  ROUND(tempo_lavoura::numeric, 0) as tempo_lavoura,
  ROUND(tempo_algodoeira::numeric, 0) as tempo_algodoeira,
  CASE
    WHEN tempo_lavoura IS NOT NULL THEN ROUND((tempo_lavoura + tempo_algodoeira)::numeric, 0)
    WHEN tempo_algodoeira IS NOT NULL THEN ROUND(tempo_algodoeira::numeric, 0)
    ELSE NULL
  END as tempo_total,
  CASE WHEN vctl.entry_time IS NOT NULL THEN to_char(vctl.entry_time::time, 'HH24:MI') ELSE NULL END as hora_entrada,
  CASE WHEN vctl.exit_time IS NOT NULL THEN to_char(vctl.exit_time::time, 'HH24:MI') ELSE NULL END as hora_saida
FROM viagens_com_tempo_lavoura vctl
LEFT JOIN vehicles v ON vctl.plate = v.plate
WHERE tempo_algodoeira IS NOT NULL
ORDER BY vctl.plate, viagem_num;

-- Fim da migração
