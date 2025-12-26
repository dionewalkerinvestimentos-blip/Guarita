-- Criar view para Gestão de Tempo
-- Esta view calcula a média de tempo que os caminhões passam na algodoeira
-- e o tempo médio entre saída da algodoeira e próxima entrada

-- PRIMEIRO: Verificar se a tabela cotton_pull tem os campos necessários
-- Campos necessários: entrada_algodoeira, saida_algodoeira
-- Se os campos não existirem, renomear ou ajustar conforme a estrutura real

-- Criar a view (ajustar conforme os nomes reais das colunas)
CREATE OR REPLACE VIEW view_gestao_tempo AS
WITH viagens_completas AS (
  SELECT 
    id,
    plate,
    date,
    entry_time,
    exit_time,
    -- Calcular tempo na algodoeira em minutos
    CASE 
      WHEN entry_time IS NOT NULL AND exit_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (date || ' ' || exit_time)::timestamp - 
          (date || ' ' || entry_time)::timestamp
        )) / 60
      ELSE NULL
    END as tempo_algodoeira_minutos,
    -- Para calcular tempo na lavoura, precisamos comparar com a viagem anterior
    LAG(exit_time) OVER (PARTITION BY plate ORDER BY date, entry_time) as saida_anterior,
    LAG(date) OVER (PARTITION BY plate ORDER BY date, entry_time) as date_anterior
  FROM cotton_pull
  WHERE entry_time IS NOT NULL
),
tempos_calculados AS (
  SELECT 
    tempo_algodoeira_minutos,
    -- Calcular tempo na lavoura (tempo entre saída anterior e entrada atual)
    CASE 
      WHEN saida_anterior IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (date || ' ' || entry_time)::timestamp - 
          (date_anterior || ' ' || saida_anterior)::timestamp
        )) / 60
      ELSE NULL
    END as tempo_lavoura_minutos
  FROM viagens_completas
  WHERE tempo_algodoeira_minutos IS NOT NULL
    AND tempo_algodoeira_minutos > 0
    AND tempo_algodoeira_minutos < 1440 -- menos de 24h (filtrar valores absurdos)
)
SELECT 
  COALESCE(AVG(tempo_algodoeira_minutos), 0)::numeric(10,2) as tempo_algodoeira,
  COALESCE(AVG(tempo_lavoura_minutos), 0)::numeric(10,2) as tempo_lavoura
FROM tempos_calculados;

-- Verificar a view
SELECT * FROM view_gestao_tempo;

-- Para testar sem view (query direta):
-- SELECT 
--   COALESCE(AVG(tempo_algodoeira), 0)::numeric(10,2) as tempo_algodoeira,
--   COALESCE(AVG(tempo_lavoura), 0)::numeric(10,2) as tempo_lavoura
-- FROM (...)

-- NOTA: Se os campos da tabela cotton_pull tiverem nomes diferentes,
-- ajustar a query acima. Os campos esperados são:
-- - id, plate, date, entry_time, exit_time
