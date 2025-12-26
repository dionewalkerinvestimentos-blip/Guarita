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

-- ============================================
-- TESTAR
-- ============================================
SELECT * FROM rain_alert;
