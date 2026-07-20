-- down.sql - rollback da migration inicial (init_guarita)
-- Reverte views, triggers, functions e tabelas criadas por up.sql
-- Executar com `psql` apontando para o DB (ex: `psql $env:SUPABASE_DB_URL -f supabase/migrations/.../down.sql`)

BEGIN;

-- Remover views (CASCADE para cobrir dependências)
DROP VIEW IF EXISTS all_loadings CASCADE;
DROP VIEW IF EXISTS view_relatorio_puxe CASCADE;
DROP VIEW IF EXISTS view_puxe_diario CASCADE;
DROP VIEW IF EXISTS view_gestao_tempo_cargas CASCADE;
DROP VIEW IF EXISTS view_gestao_tempo CASCADE;
DROP VIEW IF EXISTS view_ranking_puxe CASCADE;

-- Remover triggers (se existirem)
DROP TRIGGER IF EXISTS update_material_receipts_updated_at ON material_receipts;
DROP TRIGGER IF EXISTS update_loading_records_updated_at ON loading_records;
DROP TRIGGER IF EXISTS update_saved_values_updated_at ON saved_values;
DROP TRIGGER IF EXISTS update_rain_records_updated_at ON rain_records;
DROP TRIGGER IF EXISTS update_cotton_pull_updated_at ON cotton_pull;
DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
DROP TRIGGER IF EXISTS update_producers_updated_at ON producers;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Remover funções (IF EXISTS para segurança)
DROP FUNCTION IF EXISTS update_material_receipts_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS preserve_loaded_at() CASCADE;
DROP FUNCTION IF EXISTS archive_completed_loadings() CASCADE;
DROP FUNCTION IF EXISTS get_loading_history() CASCADE;
DROP FUNCTION IF EXISTS calcular_tempos_viagem() CASCADE;
DROP FUNCTION IF EXISTS authenticate_user(TEXT, TEXT) CASCADE;

-- Remover tabelas (ordem inversa de dependências)
DROP TABLE IF EXISTS material_receipts CASCADE;
DROP TABLE IF EXISTS loading_history CASCADE;
DROP TABLE IF EXISTS loading_records CASCADE;
DROP TABLE IF EXISTS saved_values CASCADE;
DROP TABLE IF EXISTS rain_records CASCADE;
DROP TABLE IF EXISTS cotton_pull CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS producers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Opcional: remover extensão (descomente se desejar)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT;
