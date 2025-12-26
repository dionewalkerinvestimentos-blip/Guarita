-- Correção da estrutura da tabela loading_records
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a coluna harvest_year existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'loading_records' 
AND table_schema = 'public';

-- 2. Adicionar coluna harvest_year se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'loading_records' 
                   AND column_name = 'harvest_year'
                   AND table_schema = 'public') THEN
        ALTER TABLE loading_records ADD COLUMN harvest_year TEXT;
    END IF;
END $$;

-- 3. Verificar outras colunas necessárias e criar se faltarem
DO $$
BEGIN
    -- Verificar e criar coluna truck_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'loading_records' 
                   AND column_name = 'truck_type'
                   AND table_schema = 'public') THEN
        ALTER TABLE loading_records ADD COLUMN truck_type TEXT;
    END IF;
    
    -- Verificar e criar coluna is_sider
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'loading_records' 
                   AND column_name = 'is_sider'
                   AND table_schema = 'public') THEN
        ALTER TABLE loading_records ADD COLUMN is_sider BOOLEAN DEFAULT false;
    END IF;
    
    -- Verificar e criar coluna carrier
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'loading_records' 
                   AND column_name = 'carrier'
                   AND table_schema = 'public') THEN
        ALTER TABLE loading_records ADD COLUMN carrier TEXT;
    END IF;
END $$;

-- 4. Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'loading_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;