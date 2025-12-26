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

-- 7. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'puxe_viagens'
ORDER BY ordinal_position;

-- Mensagem de sucesso
SELECT 'Tabela puxe_viagens criada com sucesso!' as status;
