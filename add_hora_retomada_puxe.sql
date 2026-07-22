-- Adicionar coluna hora_retomada_puxe para rastrear quando o motorista retomou após parada para almoço
ALTER TABLE cotton_pull
ADD COLUMN IF NOT EXISTS hora_retomada_puxe TIME,
ADD COLUMN IF NOT EXISTS tempo_parado_minutos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_permanencia_liquido_minutos INTEGER DEFAULT 0;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_cotton_pull_parada_puxe ON cotton_pull(parada_puxe) WHERE parada_puxe = true;

-- Adicionar comentários para documentação
COMMENT ON COLUMN cotton_pull.hora_retomada_puxe IS 'Horário em que o motorista retomou trabalho após parada (almoço)';
COMMENT ON COLUMN cotton_pull.tempo_parado_minutos IS 'Tempo em minutos que ficou parado durante o carregamento';
COMMENT ON COLUMN cotton_pull.tempo_permanencia_liquido_minutos IS 'Tempo total de permanência descontando pausas';
