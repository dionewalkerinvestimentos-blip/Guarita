-- ============================================
-- FIX: Políticas RLS para tabela rain_alert
-- ============================================
-- Problema: Usuários conseguem ler mas não atualizar
-- Solução: Adicionar políticas permissivas para UPDATE
-- ============================================

-- 1. Verificar se a tabela existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rain_alert') THEN
        RAISE EXCEPTION 'Tabela rain_alert não existe!';
    END IF;
END $$;

-- 2. Habilitar RLS (se ainda não estiver)
ALTER TABLE public.rain_alert ENABLE ROW LEVEL SECURITY;

-- 3. Remover TODAS as políticas antigas (inclusive as novas se existirem)
DROP POLICY IF EXISTS "Permitir SELECT para todos" ON public.rain_alert;
DROP POLICY IF EXISTS "Permitir UPDATE para todos" ON public.rain_alert;
DROP POLICY IF EXISTS "Permitir INSERT para todos" ON public.rain_alert;
DROP POLICY IF EXISTS "Allow all operations" ON public.rain_alert;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rain_alert;
DROP POLICY IF EXISTS "Enable update for all users" ON public.rain_alert;
DROP POLICY IF EXISTS "rain_alert_select_policy" ON public.rain_alert;
DROP POLICY IF EXISTS "rain_alert_update_policy" ON public.rain_alert;
DROP POLICY IF EXISTS "rain_alert_insert_policy" ON public.rain_alert;

-- 4. Criar políticas permissivas
-- Política de SELECT (leitura) - permite todos usuários autenticados
CREATE POLICY "rain_alert_select_policy" 
ON public.rain_alert 
FOR SELECT 
TO authenticated
USING (true);

-- Política de UPDATE (atualização) - permite todos usuários autenticados
CREATE POLICY "rain_alert_update_policy" 
ON public.rain_alert 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política de INSERT (inserção) - permite todos usuários autenticados
CREATE POLICY "rain_alert_insert_policy" 
ON public.rain_alert 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 5. Verificar políticas criadas
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
WHERE tablename = 'rain_alert';

-- 6. Garantir que o registro existe
INSERT INTO public.rain_alert (id, is_raining, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 7. Verificar o registro
SELECT * FROM public.rain_alert WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- RESULTADO ESPERADO:
-- ✅ 3 políticas criadas (SELECT, UPDATE, INSERT)
-- ✅ Registro existente confirmado
-- ============================================
