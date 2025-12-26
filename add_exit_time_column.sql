-- Script SQL para adicionar coluna exit_time na tabela cotton_pull
-- Execute este script no painel do Supabase

ALTER TABLE cotton_pull ADD COLUMN IF NOT EXISTS exit_time TIME;