-- Combined migration: create_all_tables.sql
-- Run this once in Supabase SQL Editor (or via psql) to create tables, functions, triggers, views and initial users.

-- >>> Begin: supabase_schema.sql

-- Guarita Database Schema for Supabase
-- Sistema de Gestão Agrícola

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user', 'viewer'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtores/Fazendas
CREATE TABLE IF NOT EXISTS producers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir produtores padrão (apenas se não existirem)
INSERT INTO producers (name, code) VALUES 
('SANTA LUZIA', 'SL'),
('SAO JOSE', 'SJ'),
('PLANTA', 'PL'),
('CARAJAS', 'CR'),
('VENTANIA', 'VT'),
('SIMARELLI', 'SM'),
('MAMOSE', 'MM'),
('JUCARA', 'JC')
ON CONFLICT (code) DO NOTHING;

-- Tabela de Veículos/Entradas e Saídas
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'Carregamento', 'Descarga', etc.
  date DATE NOT NULL,
  entry_time TIME NOT NULL,
  exit_time TIME,
  plate VARCHAR(20) NOT NULL,
  driver VARCHAR(255) NOT NULL,
  vehicle_type VARCHAR(100) NOT NULL, -- 'Carreta', 'Caminhão', 'Van'
  purpose TEXT,
  producer_id UUID REFERENCES producers(id),
  producer_name VARCHAR(255), -- Para casos onde não há referência direta
  observations TEXT,
  internal_time_minutes INTEGER, -- Tempo calculado em minutos
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance na tabela vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_date ON vehicles(date);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_producer_id ON vehicles(producer_id);

-- Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  photo_url TEXT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'Peça', 'Ferramenta', 'Equipamento'
  destination VARCHAR(255) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  donation_to VARCHAR(255),
  authorized_by VARCHAR(255) NOT NULL,
  withdrawn_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'completed', 'pending'
  return_date DATE,
  return_notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance na tabela equipment
CREATE INDEX IF NOT EXISTS idx_equipment_date ON equipment(date);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);

-- Tabela de Puxe de Algodão
CREATE TABLE IF NOT EXISTS cotton_pull (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  entry_time TIME NOT NULL,
  exit_time TIME, -- Campo para horário de saída
  producer VARCHAR(255) NOT NULL,
  farm VARCHAR(255) NOT NULL, -- CARAJAS, VENTANIA, etc.
  talhao VARCHAR(100), -- Campo adicional para especificar talhão
  plate VARCHAR(20) NOT NULL,
  driver VARCHAR(255) NOT NULL,
  rolls INTEGER NOT NULL,
  observations TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna exit_time se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cotton_pull' AND column_name = 'exit_time') THEN
    ALTER TABLE cotton_pull ADD COLUMN exit_time TIME;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'cotton_pull' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE cotton_pull ADD COLUMN IF NOT EXISTS parada_puxe BOOLEAN DEFAULT false;
    ALTER TABLE cotton_pull ADD COLUMN IF NOT EXISTS hora_parada_puxe TIME;
  END IF;
END
$$;

-- Índices para melhor performance na tabela cotton_pull
CREATE INDEX IF NOT EXISTS idx_cotton_pull_date ON cotton_pull(date);
CREATE INDEX IF NOT EXISTS idx_cotton_pull_producer ON cotton_pull(producer);
CREATE INDEX IF NOT EXISTS idx_cotton_pull_farm ON cotton_pull(farm);

-- Tabela de Registros de Chuva
CREATE TABLE IF NOT EXISTS rain_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  millimeters DECIMAL(5,2) NOT NULL, -- Ex: 999.99 mm
  location VARCHAR(255) DEFAULT 'Principal', -- Caso tenha múltiplos locais
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance na tabela rain_records
CREATE INDEX IF NOT EXISTS idx_rain_records_date ON rain_records(date);
CREATE INDEX IF NOT EXISTS idx_rain_records_year_month ON rain_records(EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

-- Tabela para armazenar listas de valores salvos (placas, motoristas, etc.)
CREATE TABLE IF NOT EXISTS saved_values (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'plates', 'drivers', 'vehicle_types'
  value VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Valores padrão serão inseridos dinamicamente pela aplicação

-- Índices para saved_values
CREATE INDEX IF NOT EXISTS idx_saved_values_category ON saved_values(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_values_category_value ON saved_values(category, value);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at (remover se já existirem)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_producers_updated_at ON producers;
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
DROP TRIGGER IF EXISTS update_cotton_pull_updated_at ON cotton_pull;
DROP TRIGGER IF EXISTS update_rain_records_updated_at ON rain_records;
DROP TRIGGER IF EXISTS update_saved_values_updated_at ON saved_values;

-- Criar triggers novamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_producers_updated_at BEFORE UPDATE ON producers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cotton_pull_updated_at BEFORE UPDATE ON cotton_pull FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rain_records_updated_at BEFORE UPDATE ON rain_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_values_updated_at BEFORE UPDATE ON saved_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Registros de Carregamento
CREATE TABLE IF NOT EXISTS loading_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  product VARCHAR(100) NOT NULL,
  harvest_year VARCHAR(10) DEFAULT '2024/2025',
  truck_type VARCHAR(50) NOT NULL,
  is_sider BOOLEAN DEFAULT false,
  carrier VARCHAR(255) NOT NULL,
  destination VARCHAR(255),
  client VARCHAR(255),
  invoice_number VARCHAR(255),
  status VARCHAR(50) DEFAULT 'fila',
  plate VARCHAR(20) NOT NULL,
  driver VARCHAR(255) NOT NULL,
  entry_date DATE,
  entry_time TIME,
  exit_date DATE,
  exit_time TIME,
  bales INTEGER DEFAULT 0,
  weight DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at na tabela loading_records
DROP TRIGGER IF EXISTS update_loading_records_updated_at ON loading_records;
CREATE TRIGGER update_loading_records_updated_at BEFORE UPDATE ON loading_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> End: supabase_schema.sql


-- >>> Begin: create_material_receipts.sql

-- Tabela para Recebimento de Materiais
-- Execute este script no Supabase Dashboard (SQL Editor)

CREATE TABLE IF NOT EXISTS material_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME NOT NULL DEFAULT CURRENT_TIME,
  exit_time TIME, -- Hora de saída
  material_type VARCHAR(50) NOT NULL, -- Areia, Cascalho, Cavaco, Pedra Brita, Pó de Pedra, Álcool
  plate VARCHAR(20) NOT NULL,
  driver VARCHAR(255) NOT NULL,
  net_weight DECIMAL(10,3) NOT NULL, -- Peso Líquido em toneladas (OBRIGATÓRIO)
  volume_m3 DECIMAL(10,3), -- Volume em metros cúbicos
  volume_m2 DECIMAL(10,3), -- Volume em metros quadrados
  volume_liters DECIMAL(10,3), -- Volume em litros
  unit_type VARCHAR(10) NOT NULL DEFAULT 'KG', -- KG, M3, M2, LITROS
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_material_receipts_date ON material_receipts(date);
CREATE INDEX IF NOT EXISTS idx_material_receipts_material_type ON material_receipts(material_type);
CREATE INDEX IF NOT EXISTS idx_material_receipts_plate ON material_receipts(plate);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_material_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_material_receipts_updated_at ON material_receipts;
CREATE TRIGGER update_material_receipts_updated_at 
BEFORE UPDATE ON material_receipts 
FOR EACH ROW EXECUTE FUNCTION update_material_receipts_updated_at();

-- >>> End: create_material_receipts.sql


-- >>> Begin: create_rain_alert_table.sql

-- ============================================
-- TABELA: rain_alert
-- Descrição: Controle de alerta de chuva em tempo real
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS rain_alert (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_raining BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro inicial (sempre haverá apenas 1 registro)
INSERT INTO rain_alert (id, is_raining, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', false, NOW())
ON CONFLICT (id) DO NOTHING;

-- Índice
CREATE INDEX IF NOT EXISTS idx_rain_alert_updated ON rain_alert(updated_at DESC);

-- RLS Policies
ALTER TABLE rain_alert ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para todos (anônimo também para o Modo TV)
CREATE POLICY "Permitir leitura para todos"
ON rain_alert FOR SELECT
USING (true);

-- Permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para autenticados"
ON rain_alert FOR UPDATE
USING (auth.role() = 'authenticated');

-- >>> End: create_rain_alert_table.sql


-- >>> Begin: create_puxe_viagens_table.sql

-- Script para criar tabela de Gestão de Puxe de Rolos
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela puxe_viagens
CREATE TABLE IF NOT EXISTS puxe_viagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa TEXT NOT NULL,
    motorista TEXT NOT NULL,
    fazenda_origem TEXT NOT NULL,
    data DATE NOT NULL,
    hora_chegada TIMESTAMP NOT NULL,
    hora_saida TIMESTAMP,
    tempo_unidade_min NUMERIC,
    tempo_lavoura_min NUMERIC,
    total_viagem_min NUMERIC,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_placa ON puxe_viagens(placa);
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_data ON puxe_viagens(data);
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_hora_chegada ON puxe_viagens(hora_chegada);

-- 3. Criar função para calcular tempos automaticamente
CREATE OR REPLACE FUNCTION calcular_tempos_viagem()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular tempo na unidade (se houver hora_saida)
    IF NEW.hora_saida IS NOT NULL THEN
        NEW.tempo_unidade_min := EXTRACT(EPOCH FROM (NEW.hora_saida - NEW.hora_chegada)) / 60;
    END IF;
    
    -- Calcular tempo de lavoura e total (baseado na próxima viagem da mesma placa)
    -- Isso será calculado quando a próxima viagem for registrada
    UPDATE puxe_viagens
    SET tempo_lavoura_min = EXTRACT(EPOCH FROM (NEW.hora_chegada - hora_saida)) / 60,
        total_viagem_min = tempo_unidade_min + EXTRACT(EPOCH FROM (NEW.hora_chegada - hora_saida)) / 60
    WHERE placa = NEW.placa
        AND hora_saida IS NOT NULL
        AND hora_chegada < NEW.hora_chegada
        AND id = (
            SELECT id FROM puxe_viagens
            WHERE placa = NEW.placa
                AND hora_saida < NEW.hora_chegada
            ORDER BY hora_saida DESC
            LIMIT 1
        );
    
    -- Atualizar updated_at
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para calcular tempos automaticamente
DROP TRIGGER IF EXISTS trigger_calcular_tempos ON puxe_viagens;
CREATE TRIGGER trigger_calcular_tempos
    BEFORE INSERT OR UPDATE ON puxe_viagens
    FOR EACH ROW
    EXECUTE FUNCTION calcular_tempos_viagem();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE puxe_viagens ENABLE ROW LEVEL SECURITY;

-- 6. Criar policies para acesso
CREATE POLICY "Permitir leitura para todos" ON puxe_viagens
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para todos" ON puxe_viagens
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para todos" ON puxe_viagens
    FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para todos" ON puxe_viagens
    FOR DELETE USING (true);

-- >>> End: create_puxe_viagens_table.sql


-- >>> Begin: create_puxe_views.sql

-- Script para criar Views Analíticas de Gestão de Puxe de Rolos
-- Execute este script no Supabase SQL Editor APÓS executar create_puxe_viagens_table.sql

-- ===========================================================
-- 🔷 VIEW PRINCIPAL: view_relatorio_puxe
-- Consolida todos os dados de viagens com cálculos de tempo
-- ===========================================================
CREATE OR REPLACE VIEW view_relatorio_puxe AS
SELECT
    pv.id,
    pv.placa,
    pv.motorista,
    pv.fazenda_origem as fazenda,
    pv.data,
    pv.hora_chegada,
    pv.hora_saida,
    pv.tempo_unidade_min,
    pv.tempo_lavoura_min,
    pv.total_viagem_min,
    pv.observacao,
    DATE_TRUNC('day', pv.hora_chegada) AS dia,
    DATE_TRUNC('month', pv.hora_chegada) AS mes,
    DATE_TRUNC('year', pv.hora_chegada) AS ano
FROM puxe_viagens pv
WHERE pv.hora_chegada IS NOT NULL;

-- ===========================================================
-- 🔹 VIEW AGREGADA DIÁRIA
-- Médias e totais por dia
-- ===========================================================
CREATE OR REPLACE VIEW view_puxe_diario AS
SELECT 
    DATE(dia) as dia,
    COUNT(*) AS total_viagens,
    COUNT(DISTINCT placa) AS total_veiculos,
    COUNT(DISTINCT motorista) AS total_motoristas,
    ROUND(AVG(tempo_unidade_min), 2) AS media_algodoeira_min,
    ROUND(AVG(tempo_lavoura_min), 2) AS media_viagem_min,
    ROUND(AVG(total_viagem_min), 2) AS media_total_min,
    ROUND(MIN(tempo_unidade_min), 2) AS min_algodoeira_min,
    ROUND(MAX(tempo_unidade_min), 2) AS max_algodoeira_min,
    ROUND(MIN(tempo_lavoura_min), 2) AS min_viagem_min,
    ROUND(MAX(tempo_lavoura_min), 2) AS max_viagem_min
FROM view_relatorio_puxe
GROUP BY dia
ORDER BY dia DESC;

-- ===========================================================
-- 🔹 VIEW AGREGADA MENSAL / POR FAZENDA
-- Análise mensal por origem
-- ===========================================================
CREATE OR REPLACE VIEW view_puxe_mensal AS
SELECT 
    TO_CHAR(mes, 'YYYY-MM') as mes,
    fazenda,
    COUNT(*) AS viagens,
    COUNT(DISTINCT placa) AS veiculos_distintos,
    ROUND(AVG(tempo_unidade_min), 2) AS media_algodoeira_min,
    ROUND(AVG(tempo_lavoura_min), 2) AS media_viagem_min,
    ROUND(AVG(total_viagem_min), 2) AS media_total_min,
    ROUND(SUM(tempo_unidade_min), 2) AS total_algodoeira_min,
    ROUND(SUM(tempo_lavoura_min), 2) AS total_viagem_min
FROM view_relatorio_puxe
GROUP BY mes, fazenda
ORDER BY mes DESC, fazenda;

-- ===========================================================
-- 🔹 VIEW RANKING DE CAMINHÕES / MOTORISTAS
-- Top performers por quantidade de viagens
-- ===========================================================
CREATE OR REPLACE VIEW view_ranking_puxe AS
SELECT 
    motorista,
    placa,
    COUNT(*) AS viagens,
    ROUND(AVG(tempo_unidade_min), 2) AS media_algodoeira_min,
    ROUND(AVG(tempo_lavoura_min), 2) AS media_viagem_min,
    ROUND(AVG(total_viagem_min), 2) AS media_total_min,
    ROUND(MIN(tempo_lavoura_min), 2) AS melhor_tempo_viagem_min,
    ROUND(MAX(tempo_lavoura_min), 2) AS pior_tempo_viagem_min,
    MAX(DATE(hora_chegada)) AS ultima_viagem
FROM view_relatorio_puxe
WHERE tempo_lavoura_min IS NOT NULL
GROUP BY motorista, placa
ORDER BY viagens DESC, media_total_min ASC;

-- ===========================================================
-- 🔹 VIEW DETALHADA PARA EXPORTAÇÃO
-- Todas as viagens com dados completos formatados
-- ===========================================================
CREATE OR REPLACE VIEW view_puxe_exportacao AS
SELECT 
    pv.placa,
    pv.motorista,
    pv.fazenda_origem as fazenda,
    TO_CHAR(pv.data, 'DD/MM/YYYY') as data,
    TO_CHAR(pv.hora_chegada, 'HH24:MI') as chegada,
    TO_CHAR(pv.hora_saida, 'HH24:MI') as saida,
    ROUND(pv.tempo_unidade_min, 2) as tempo_algodoeira_min,
    ROUND(pv.tempo_lavoura_min, 2) as tempo_viagem_min,
    ROUND(pv.total_viagem_min, 2) as tempo_total_min,
    pv.observacao
FROM puxe_viagens pv
ORDER BY pv.hora_chegada DESC;

-- ===========================================================
-- 🔹 ÍNDICES ADICIONAIS (otimiza os dashboards)
-- ===========================================================
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_motorista ON puxe_viagens(motorista);
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_fazenda ON puxe_viagens(fazenda_origem);
CREATE INDEX IF NOT EXISTS idx_puxe_viagens_data_placa ON puxe_viagens(data, placa);

-- ===========================================================
-- 🔹 GRANTS PARA RLS (permite acesso às views)
-- ===========================================================
ALTER VIEW view_relatorio_puxe SET (security_invoker = true);
ALTER VIEW view_puxe_diario SET (security_invoker = true);
ALTER VIEW view_puxe_mensal SET (security_invoker = true);
ALTER VIEW view_ranking_puxe SET (security_invoker = true);
ALTER VIEW view_puxe_exportacao SET (security_invoker = true);

-- >>> End: create_puxe_views.sql


-- >>> Begin: create_preserve_loaded_at_trigger.sql

-- Criar função para prevenir atualização automática de loaded_at
-- loaded_at deve ser preservado quando registro for editado

CREATE OR REPLACE FUNCTION preserve_loaded_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Se loaded_at já existe no registro antigo, preservar o valor
  IF OLD.loaded_at IS NOT NULL THEN
    NEW.loaded_at := OLD.loaded_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para loading_records
DROP TRIGGER IF EXISTS preserve_loaded_at_trigger ON loading_records;
CREATE TRIGGER preserve_loaded_at_trigger
BEFORE UPDATE ON loading_records
FOR EACH ROW
EXECUTE FUNCTION preserve_loaded_at();

-- >>> End: create_preserve_loaded_at_trigger.sql


-- >>> Begin: create_history_and_cleanup.sql

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

-- 7. Função manual para executar limpeza (útil para testes)
-- Execute isto para testar: SELECT archive_completed_loadings();

-- 8. View para unir dados ativos + histórico (consulta completa)
CREATE OR REPLACE VIEW all_loadings AS
SELECT 
  id,
  date,
  "time"::text as time_value,
  entry_date,
  entry_time::text AS entry_time,
  exit_date,
  exit_time::text AS exit_time,
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

-- >>> End: create_history_and_cleanup.sql


-- >>> Begin: create_auth_function.sql

-- Função para autenticar usuário
-- Execute este script no Supabase Dashboard (SQL Editor)

-- Habilitar extensão para criptografia se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para autenticar usuário
CREATE OR REPLACE FUNCTION authenticate_user(
  input_username TEXT,
  input_password TEXT
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.is_active
  FROM users u
  WHERE u.username = input_username 
    AND u.password_hash = crypt(input_password, u.password_hash)
    AND u.is_active = true;
END;
$$;

-- >>> End: create_auth_function.sql


-- >>> Begin: create_user_simple.sql + create_user_guarita.sql

-- Criar tabela users (caso não tenha sido criada acima) e inserir usuário guarita
-- A função supabase_schema já cria a tabela `users`; abaixo apenas garante e insere o usuário.

-- Primeiro, garantir a existência da tabela users (idempotente)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir o usuário guarita (senha hash segura, se pgcrypto estiver habilitado)
INSERT INTO users (
  username,
  email,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  'guarita',
  'guarita@iba.com',
  crypt('Senha@2026', gen_salt('bf')),
  'Guarita',
  'user',
  true
) ON CONFLICT (username) DO UPDATE SET
  password_hash = crypt('Senha@2026', gen_salt('bf')),
  full_name = 'Guarita',
  role = 'user',
  is_active = true,
  updated_at = NOW();

-- >>> End: create_user_simple.sql + create_user_guarita.sql


-- >>> Begin: view & analytics scripts (gestao_tempo, gestao_tempo_v2, gestao_tempo_cargas, ranking)

-- Obs: As views abaixo dependem de tabelas (cotton_pull, etc.). Se as tabelas não existirem, as views podem falhar. Execute apenas após confirmar a presença das tabelas.

-- view_gestao_tempo (v2-safe version)

CREATE OR REPLACE VIEW view_gestao_tempo AS
WITH viagens_hoje AS (
  SELECT 
    id,
    plate,
    date,
    entry_time,
    exit_time,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY plate, date ORDER BY entry_time) as viagem_num,
    COUNT(*) OVER (PARTITION BY plate, date) as total_viagens_dia
  FROM cotton_pull
  WHERE date = CURRENT_DATE
    AND entry_time IS NOT NULL
  ORDER BY plate, date, entry_time
),
tempos_algodoeira AS (
  SELECT 
    plate,
    date,
    entry_time,
    exit_time,
    viagem_num,
    total_viagens_dia,
    CASE 
      WHEN entry_time IS NOT NULL AND exit_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          (date || ' ' || exit_time)::timestamp - 
          (date || ' ' || entry_time)::timestamp
        )) / 60
      ELSE NULL
    END as tempo_algodoeira_min
  FROM viagens_hoje
  WHERE viagem_num > 1
    AND viagem_num < total_viagens_dia
),
viagens_sequenciais AS (
  SELECT 
    plate,
    date as data_entrada,
    entry_time,
    exit_time,
    tempo_algodoeira_min,
    LAG(date) OVER (PARTITION BY plate ORDER BY date, entry_time) as data_saida_anterior,
    LAG(exit_time) OVER (PARTITION BY plate ORDER BY date, entry_time) as exit_time_anterior
  FROM tempos_algodoeira
  WHERE tempo_algodoeira_min IS NOT NULL
    AND tempo_algodoeira_min > 0
    AND tempo_algodoeira_min < 300
),
tempos_lavoura AS (
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
      AND tempo_lavoura_min > 0 
      AND tempo_lavoura_min < 300 
    THEN tempo_lavoura_min 
  END)::numeric, 0), 0) as tempo_lavoura
FROM tempos_lavoura
WHERE tempo_algodoeira_min > 0;

-- view_gestao_tempo_cargas
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
  plate as placa,
  driver as motorista,
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
  entry_time as hora_entrada,
  exit_time as hora_saida
FROM viagens_com_tempo_lavoura
WHERE tempo_algodoeira IS NOT NULL
ORDER BY plate, viagem_num;

-- view_ranking_puxe (atualizado)
CREATE OR REPLACE VIEW view_ranking_puxe AS
WITH viagens_por_dia AS (
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
  SELECT 
    plate,
    driver,
    date,
    tempo_algodoeira,
    tempo_lavoura,
    tempo_algodoeira + COALESCE(tempo_lavoura, 0) as tempo_total
  FROM viagens_com_tempo_lavoura
  WHERE viagem_num > 1
    AND viagem_num < total_viagens_dia
    AND tempo_algodoeira IS NOT NULL
    AND tempo_algodoeira > 0
    AND tempo_algodoeira < 300
    AND (tempo_lavoura IS NULL OR (tempo_lavoura > 0 AND tempo_lavoura < 300))
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
HAVING COUNT(*) >= 3
ORDER BY viagens DESC, media_total_min ASC;

-- >>> End: view & analytics scripts


-- Final note: If any CREATE VIEW or CREATE FUNCTION fails due to missing dependent tables, execute the file again after creating the missing tables.

-- End of combined migration
