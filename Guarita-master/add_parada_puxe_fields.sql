-- ============================================
-- Adicionar campos para funcionalidade "Parada Puxe"
-- ============================================

-- Adicionar campos na tabela cotton_pull
ALTER TABLE cotton_pull
ADD COLUMN IF NOT EXISTS parada_puxe BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hora_parada_puxe TIME NULL;

-- Comentários para documentação
COMMENT ON COLUMN cotton_pull.parada_puxe IS 'Indica se o caminhão teve parada de puxe (fim do dia sem saída registrada)';
COMMENT ON COLUMN cotton_pull.hora_parada_puxe IS 'Hora em que foi registrada a parada de puxe';

-- ============================================
-- TESTAR OS CAMPOS
-- ============================================
-- Verificar se os campos foram criados
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'cotton_pull'
  AND column_name IN ('parada_puxe', 'hora_parada_puxe');
