-- Sistema de Historico e Limpeza Automatica - VERSAO 2
-- Execute este script completo no Supabase SQL Editor

-- Passo 1: Remover objetos antigos se existirem
DROP VIEW IF EXISTS all_loadings CASCADE;
DROP FUNCTION IF EXISTS get_loading_history CASCADE;
DROP FUNCTION IF EXISTS archive_completed_loadings CASCADE;
DROP TABLE IF EXISTS loading_history CASCADE;

-- Passo 2: Criar tabela de historico
CREATE TABLE loading_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  original_id uuid NOT NULL,
  date date NOT NULL,
  time_value text NOT NULL,
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
  status text,
  observations text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz
);

-- Passo 3: Criar indices
CREATE INDEX idx_loading_history_date ON loading_history(date);
CREATE INDEX idx_loading_history_plate ON loading_history(plate);
CREATE INDEX idx_loading_history_status ON loading_history(status);
CREATE INDEX idx_loading_history_completed_at ON loading_history(completed_at);

-- Passo 4: Criar funcao de arquivamento
CREATE OR REPLACE FUNCTION archive_completed_loadings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO loading_history (
    original_id, date, time_value, entry_date, entry_time, exit_date, exit_time,
    product, harvest_year, truck_type, plate, driver, carrier,
    destination, client, invoice_number, bales, weight, is_sider,
    status, observations, created_by, created_at, completed_at, updated_at
  )
  SELECT 
    id, date, "time"::text, entry_date, entry_time::text, exit_date, exit_time::text,
    product, harvest_year, truck_type, plate, driver, carrier,
    destination, client, invoice_number, bales, weight, is_sider,
    status::text, observations, created_by, created_at, now(), updated_at
  FROM loading_records
  WHERE exit_date IS NOT NULL AND exit_date < CURRENT_DATE
  ON CONFLICT DO NOTHING;
  
  DELETE FROM loading_records
  WHERE exit_date IS NOT NULL AND exit_date < CURRENT_DATE;
    
  RAISE NOTICE 'Registros concluidos arquivados com sucesso';
END;
$$;

-- Passo 5: Criar funcao de consulta
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

-- Passo 6: Habilitar RLS
ALTER TABLE loading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura do historico" ON loading_history
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Sistema pode inserir historico" ON loading_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Passo 7: Criar view unificada
CREATE OR REPLACE VIEW all_loadings AS
SELECT 
  id,
  date,
  "time"::text as time_value,
  entry_date,
  entry_time::text as entry_time,
  exit_date,
  exit_time::text as exit_time,
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
  status::text as status,
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
