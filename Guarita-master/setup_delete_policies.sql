-- Políticas RLS para permitir exclusão - Sistema Guarita
-- Execute este script no editor SQL do Supabase

-- 1. HABILITAR RLS (se não estiver habilitado)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loading_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotton_pull ENABLE ROW LEVEL SECURITY;
ALTER TABLE rain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PERMISSIVAS PARA OPERAÇÕES COMPLETAS
-- Estas políticas permitem SELECT, INSERT, UPDATE e DELETE para todos os usuários autenticados

-- Política para VEHICLES
DROP POLICY IF EXISTS "Allow all operations on vehicles" ON vehicles;
CREATE POLICY "Allow all operations on vehicles" ON vehicles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política para LOADING_RECORDS
DROP POLICY IF EXISTS "Allow all operations on loading_records" ON loading_records;
CREATE POLICY "Allow all operations on loading_records" ON loading_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política para COTTON_PULL
DROP POLICY IF EXISTS "Allow all operations on cotton_pull" ON cotton_pull;
CREATE POLICY "Allow all operations on cotton_pull" ON cotton_pull
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política para RAIN_RECORDS
DROP POLICY IF EXISTS "Allow all operations on rain_records" ON rain_records;
CREATE POLICY "Allow all operations on rain_records" ON rain_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política para EQUIPMENT
DROP POLICY IF EXISTS "Allow all operations on equipment" ON equipment;
CREATE POLICY "Allow all operations on equipment" ON equipment
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política para PRODUCERS (tabela de referência)
DROP POLICY IF EXISTS "Allow all operations on producers" ON producers;
CREATE POLICY "Allow all operations on producers" ON producers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. ALTERNATIVA: Políticas mais específicas por operação (comentadas - use se preferir)
/*
-- Para cada tabela, você pode criar políticas específicas:

-- VEHICLES - Políticas específicas
DROP POLICY IF EXISTS "Allow select vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow delete vehicles" ON vehicles;

CREATE POLICY "Allow select vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Allow insert vehicles" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update vehicles" ON vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow delete vehicles" ON vehicles FOR DELETE USING (true);

-- LOADING_RECORDS - Políticas específicas
DROP POLICY IF EXISTS "Allow select loading_records" ON loading_records;
DROP POLICY IF EXISTS "Allow insert loading_records" ON loading_records;
DROP POLICY IF EXISTS "Allow update loading_records" ON loading_records;
DROP POLICY IF EXISTS "Allow delete loading_records" ON loading_records;

CREATE POLICY "Allow select loading_records" ON loading_records FOR SELECT USING (true);
CREATE POLICY "Allow insert loading_records" ON loading_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update loading_records" ON loading_records FOR UPDATE USING (true);
CREATE POLICY "Allow delete loading_records" ON loading_records FOR DELETE USING (true);

-- Repita para outras tabelas conforme necessário...
*/

-- 4. VERIFICAR POLÍTICAS ATIVAS
-- Execute para verificar se as políticas foram criadas:
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
WHERE schemaname = 'public' 
  AND tablename IN ('vehicles', 'loading_records', 'cotton_pull', 'rain_records', 'equipment', 'producers')
ORDER BY tablename, policyname;

-- 5. COMENTÁRIOS IMPORTANTES:
-- - Essas políticas permitem operações completas (CRUD) para usuários autenticados
-- - Para ambiente de produção, considere políticas mais restritivas baseadas em roles
-- - As políticas "USING (true)" e "WITH CHECK (true)" permitem todas as operações
-- - Para restringir por usuário, use: auth.uid() = user_id (se tiver campo user_id)
-- - Para restringir por role, use: auth.jwt() ->> 'role' = 'admin'

-- Data de criação: 2025-11-04