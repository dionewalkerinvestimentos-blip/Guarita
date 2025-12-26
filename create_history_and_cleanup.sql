-- Sistema de Histórico e Limpeza Automática
-- Execute este script no Supabase SQL Editor

-- 0. Remover objetos antigos se existirem (para recriar com tipos corretos)
DROP VIEW IF EXISTS all_loadings CASCADE;
DROP FUNCTION IF EXISTS get_loading_history CASCADE;
DROP FUNCTION IF EXISTS archive_completed_loadings CASCADE;
DROP TABLE IF EXISTS loading_history CASCADE;

-- 1. Criar tabela de histórico para preservar todos os carregamentos
CREATE TABLE loading_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  original_id uuid NOT NULL, -- ID original do loading_records
  date date NOT NULL,
  time_value text NOT NULL, -- Renomeado para evitar palavra reservada, armazena como texto
  entry_date date,
  entry_time text,
  exit_date date,
  exit_time text,
  product text NOT NULL,
  harvest_year text NOT NULL,
  truck_type text NOT NULL,
  plate text NOT NULL,
  driver text NOT NULL,
  carrier text NOT NULL,
  destination text,
  client text,
  invoice_number text,
  bales integer,
  weight numeric,
  is_sider boolean DEFAULT false,
  status text, -- fila, carregando, carregado, concluido
  observations text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz, -- Quando foi concluído e movido para histórico
  updated_at timestamptz
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_loading_history_date ON loading_history(date);
CREATE INDEX IF NOT EXISTS idx_loading_history_plate ON loading_history(plate);
CREATE INDEX IF NOT EXISTS idx_loading_history_status ON loading_history(status);
CREATE INDEX IF NOT EXISTS idx_loading_history_completed_at ON loading_history(completed_at);

-- Comentar a tabela
COMMENT ON TABLE loading_history IS 'Histórico completo de todos os carregamentos. Registros nunca são deletados.';

-- 2. Função para mover registros concluídos para o histórico
CREATE OR REPLACE FUNCTION archive_completed_loadings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insere registros concluídos no histórico
  INSERT INTO loading_history (
    original_id, date, time_value, entry_date, entry_time, exit_date, exit_time,
    product, harvest_year, truck_type, plate, driver, carrier,
    destination, client, invoice_number, bales, weight, is_sider,
    status, observations, created_by, created_at, completed_at, updated_at
  )
  SELECT 
    id, date, "time"::text, entry_date, entry_time, exit_date, exit_time,
    product, harvest_year, truck_type, plate, driver, carrier,
    destination, client, invoice_number, bales, weight, is_sider,
    status, observations, created_by, created_at, now(), updated_at
  FROM loading_records
  WHERE status = 'concluido'
    AND exit_date IS NOT NULL
  ON CONFLICT DO NOTHING; -- Evita duplicatas se rodar mais de uma vez
  
  -- Remove apenas os registros concluídos da tabela principal
  DELETE FROM loading_records
  WHERE status = 'concluido'
    AND exit_date IS NOT NULL;
    
  RAISE NOTICE 'Registros concluídos arquivados com sucesso';
END;
$$;

COMMENT ON FUNCTION archive_completed_loadings() IS 'Move registros concluídos para a tabela de histórico e os remove da tabela principal';

-- 3. Criar extensão pg_cron se não existir (necessário para agendamento)
-- NOTA: No Supabase, você precisa habilitar pg_cron no dashboard
-- Database > Extensions > procure por "pg_cron" e habilite

-- 4. Agendar limpeza automática para todo dia à meia-noite
-- IMPORTANTE: Ajuste o timezone conforme necessário (America/Sao_Paulo para Brasília)
-- Execute este comando após habilitar pg_cron:

/*
SELECT cron.schedule(
  'cleanup-completed-loadings',     -- nome do job
  '0 0 * * *',                      -- todo dia à meia-noite (00:00)
  $$SELECT archive_completed_loadings();$$
);
*/

-- Para ver os jobs agendados:
-- SELECT * FROM cron.job;

-- Para remover um job (se necessário):
-- SELECT cron.unschedule('cleanup-completed-loadings');

-- 5. Função para consultar histórico (útil para relatórios)
CREATE OR REPLACE FUNCTION get_loading_history(
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  plate_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  date date,
  time_value text,
  entry_date date,
  entry_time text,
  exit_date date,
  exit_time text,
  product text,
  harvest_year text,
  truck_type text,
  plate text,
  driver text,
  carrier text,
  destination text,
  client text,
  invoice_number text,
  bales integer,
  weight numeric,
  is_sider boolean,
  status text,
  completed_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id, h.date, h.time_value, h.entry_date, h.entry_time, h.exit_date, h.exit_time,
    h.product, h.harvest_year, h.truck_type, h.plate, h.driver, h.carrier,
    h.destination, h.client, h.invoice_number, h.bales, h.weight, h.is_sider,
    h.status, h.completed_at
  FROM loading_history h
  WHERE 
    (start_date IS NULL OR h.date >= start_date)
    AND (end_date IS NULL OR h.date <= end_date)
    AND (plate_filter IS NULL OR h.plate ILIKE '%' || plate_filter || '%')
  ORDER BY h.completed_at DESC, h.date DESC, h.time_value DESC;
END;
$$;

COMMENT ON FUNCTION get_loading_history IS 'Consulta histórico de carregamentos com filtros opcionais';

-- 6. Política de segurança RLS para a tabela de histórico
ALTER TABLE loading_history ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura do histórico" ON loading_history
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas o sistema pode inserir no histórico (via função)
CREATE POLICY "Sistema pode inserir histórico" ON loading_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Ninguém pode deletar do histórico (preservação permanente)
-- Não criar política de DELETE = ninguém pode deletar

COMMENT ON POLICY "Permitir leitura do histórico" ON loading_history IS 'Usuários autenticados podem ler o histórico';
COMMENT ON POLICY "Sistema pode inserir histórico" ON loading_history IS 'Sistema pode inserir novos registros no histórico';

-- 7. Função manual para executar limpeza (útil para testes)
-- Execute isto para testar: SELECT archive_completed_loadings();

-- 8. View para unir dados ativos + histórico (consulta completa)
CREATE OR REPLACE VIEW all_loadings AS
SELECT 
  id,
  date,
  "time"::text as time_value,
  entry_date,
  entry_time,
  exit_date,
  exit_time,
  product,
  harvest_year,
  truck_type,
  plate,
  driver,
  carrier,
  destination,
  client,
  invoice_number,
  bales,
  weight,
  is_sider,
  status,
  'active' as source,
  created_at,
  updated_at
FROM loading_records
UNION ALL
SELECT 
  original_id as id,
  date,
  time_value,
  entry_date,
  entry_time,
  exit_date,
  exit_time,
  product,
  harvest_year,
  truck_type,
  plate,
  driver,
  carrier,
  destination,
  client,
  invoice_number,
  bales,
  weight,
  is_sider,
  status,
  'history' as source,
  created_at,
  updated_at
FROM loading_history
ORDER BY date DESC, time_value DESC;

COMMENT ON VIEW all_loadings IS 'View que une registros ativos e histórico para consultas completas';
