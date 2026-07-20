-- up.sql - migration inicial (init_guarita)
-- Gerado a partir de create_all_tables.sql
-- Executar com `supabase db push` ou `psql` apontando para o DB

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

-- Índices para melhor performance na tabela cotton_pull
CREATE INDEX IF NOT EXISTS idx_cotton_pull_date ON cotton_pull(date);
CREATE INDEX IF NOT EXISTS idx_cotton_pull_producer ON cotton_pull(producer);
CREATE INDEX IF NOT EXISTS idx_cotton_pull_farm ON cotton_pull(farm);

-- Tabela de Registros de Chuva
CREATE TABLE IF NOT EXISTS rain_records (
	id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
	date DATE NOT NULL,
	time TIME NOT NULL,
	-- optional start/end times used by the frontend
	start_time TIME,
	end_time TIME,
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
CREATE INDEX IF NOT EXISTS idx_rain_records_start_time ON rain_records(start_time);
CREATE INDEX IF NOT EXISTS idx_rain_records_end_time ON rain_records(end_time);

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

