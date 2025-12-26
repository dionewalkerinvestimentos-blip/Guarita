-- Migration: Criar tabela aeration_events para registrar liga/desliga de aeradores
-- Data: 2025-12-23

BEGIN;

-- Tabela principal de eventos de aeração
CREATE TABLE IF NOT EXISTS aeration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barracao integer NOT NULL, -- 1 ou 2
  motor_index integer NOT NULL, -- índice do motor dentro do barracão (1..N)
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  status text NOT NULL DEFAULT 'off', -- 'on' | 'off'
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_aeration_barracao ON aeration_events (barracao);
CREATE INDEX IF NOT EXISTS idx_aeration_motor ON aeration_events (motor_index);

COMMIT;

-- Fim da migração
