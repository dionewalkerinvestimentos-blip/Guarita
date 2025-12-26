-- Script para ajustar a tabela vehicles para suportar saída externa
-- Execute este script no Supabase SQL Editor

-- 1. Alterar coluna entry_time para permitir NULL (para saída externa)
ALTER TABLE vehicles 
ALTER COLUMN entry_time DROP NOT NULL;

-- 2. Verificar a estrutura da tabela
\d vehicles;

-- 3. Testar inserção de saída externa
INSERT INTO vehicles (type, date, exit_time, plate, driver, vehicle_type, purpose, observations)
VALUES ('Saída Externa', CURRENT_DATE, '14:30', 'TEST-001', 'João Teste', 'Carro', 'Teste saída externa', 'Teste do sistema');

-- 4. Verificar se funcionou
SELECT * FROM vehicles WHERE type = 'Saída Externa' ORDER BY created_at DESC LIMIT 1;

-- 5. Remover registro de teste
DELETE FROM vehicles WHERE plate = 'TEST-001' AND type = 'Saída Externa';

-- Mensagem de sucesso
SELECT 'Tabela vehicles ajustada para suportar saída externa!' as status;