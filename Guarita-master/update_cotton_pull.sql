-- Atualização da tabela cotton_pull para adicionar campo de saída
-- Adiciona campo exit_time para registrar quando o veículo saiu

ALTER TABLE cotton_pull 
ADD COLUMN IF NOT EXISTS exit_time TIME;

-- Adiciona índice para performance
CREATE INDEX IF NOT EXISTS idx_cotton_pull_exit_time ON cotton_pull(exit_time);