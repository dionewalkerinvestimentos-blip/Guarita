-- ===== DIAGNÓSTICO E CORREÇÃO MATERIAL_RECEIPTS =====
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE tablename = 'material_receipts';

-- 2. VERIFICAR ESTRUTURA DA TABELA
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'material_receipts' 
ORDER BY ordinal_position;

-- 3. VERIFICAR POLÍTICAS RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'material_receipts';

-- 4. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'material_receipts';

-- 5. TESTAR PERMISSÕES - INSERÇÃO
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Tentar inserir um registro de teste
    INSERT INTO material_receipts (
        material_type, 
        plate, 
        driver, 
        net_weight,
        unit_type
    ) VALUES (
        'Teste Diagnóstico', 
        'TST-0000', 
        'Sistema', 
        1.0,
        'KG'
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'SUCESSO: Inserção funcionando. ID: %', test_id;
    
    -- Remover o registro de teste
    DELETE FROM material_receipts WHERE id = test_id;
    RAISE NOTICE 'Registro de teste removido com sucesso.';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO na inserção: % - %', SQLSTATE, SQLERRM;
END $$;

-- 6. CORREÇÃO: RECRIAR POLÍTICAS RLS
-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow all operations on material_receipts" ON material_receipts;
DROP POLICY IF EXISTS "Enable read access for all users" ON material_receipts;
DROP POLICY IF EXISTS "Enable insert for all users" ON material_receipts;
DROP POLICY IF EXISTS "Enable update for all users" ON material_receipts;
DROP POLICY IF EXISTS "Enable delete for all users" ON material_receipts;

-- Desabilitar RLS temporariamente
ALTER TABLE material_receipts DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE material_receipts ENABLE ROW LEVEL SECURITY;

-- Criar política permissiva para TODOS os usuários
CREATE POLICY "material_receipts_policy_all" 
ON material_receipts 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- 7. VERIFICAR NOVAMENTE APÓS CORREÇÃO
SELECT 'Políticas após correção:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'material_receipts';

-- 8. TESTE FINAL
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO material_receipts (
        material_type, 
        plate, 
        driver, 
        net_weight,
        unit_type
    ) VALUES (
        'Teste Final', 
        'FIN-9999', 
        'Sistema Corrigido', 
        2.5,
        'KG'
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'TESTE FINAL SUCESSO: ID %', test_id;
    
    DELETE FROM material_receipts WHERE id = test_id;
    RAISE NOTICE 'Correção aplicada com sucesso!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'AINDA HÁ ERRO: % - %', SQLSTATE, SQLERRM;
END $$;

-- 9. CONTAR REGISTROS EXISTENTES
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN date = CURRENT_DATE THEN 1 END) as registros_hoje
FROM material_receipts;