-- Adiciona a coluna 'loaded_at' na tabela 'loading_records'
-- Esta coluna vai armazenar o timestamp de quando o status foi mudado para 'carregado'.

ALTER TABLE public.loading_records
ADD COLUMN loaded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.loading_records.loaded_at IS 'Timestamp de quando o carregamento foi finalizado (status mudou para "carregado").';

-- Opcional: Preencher a nova coluna para registros existentes que já estão 'carregado' ou 'concluido'.
-- Usaremos a 'entry_date' e 'entry_time' como uma aproximação para dados históricos.
-- Para novos registros, o app se encarregará de preencher o valor correto.

-- CORREÇÃO 1: Combina a data e a hora para criar um timestamp completo
UPDATE public.loading_records
SET loaded_at = (entry_date + entry_time)::timestamptz
WHERE status IN ('carregado', 'concluido') AND loaded_at IS NULL AND entry_date IS NOT NULL AND entry_time IS NOT NULL;

-- CORREÇÃO 2: Para casos onde só temos a data, converte diretamente para timestamptz
UPDATE public.loading_records
SET loaded_at = entry_date::timestamptz
WHERE status IN ('carregado', 'concluido') AND loaded_at IS NULL AND entry_date IS NOT NULL;

-- Adicionar um índice para otimizar as consultas baseadas nesta coluna
CREATE INDEX IF NOT EXISTS idx_loaded_at ON public.loading_records(loaded_at);
