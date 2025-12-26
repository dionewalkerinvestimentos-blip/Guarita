-- Script para atualizar produtor de "Santa Luzia" para "Bom Futuro" em cotton_pull
-- Execute este script no Supabase SQL Editor

-- 1. Verificar TODOS os produtores únicos (para identificar variações)
SELECT DISTINCT 
    producer,
    LENGTH(producer) as tamanho,
    COUNT(*) as total_registros
FROM cotton_pull
GROUP BY producer
ORDER BY total_registros DESC;

-- 2. Verificar registros com variações de "Santa Luzia"
SELECT 
    id, 
    date, 
    producer, 
    plate, 
    rolls 
FROM cotton_pull 
WHERE producer ILIKE '%santa%luzia%' OR producer ILIKE '%santa luzia%'
ORDER BY date DESC
LIMIT 20;

-- 3. Atualizar TODOS os registros que contenham "Santa Luzia" (case-insensitive)
UPDATE cotton_pull
SET producer = 'Bom Futuro'
WHERE producer ILIKE '%santa%luzia%' OR producer ILIKE '%santa luzia%';

-- 4. Verificar resultado da atualização
SELECT 
    producer,
    COUNT(*) as total_registros
FROM cotton_pull
GROUP BY producer
ORDER BY producer;

-- Mensagem de sucesso
SELECT 'Produtor atualizado para "Bom Futuro"!' as status;
