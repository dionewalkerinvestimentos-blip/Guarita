# 🚨 SOLUÇÃO: Erro 400 material_receipts (Tabela existe mas não funciona)

## 🔍 **PROBLEMA IDENTIFICADO:**
A tabela `material_receipts` existe no Supabase, mas retorna erro 400. Isso indica problema de **permissões RLS** (Row Level Security).

## ✅ **SOLUÇÃO RÁPIDA - Execute no Supabase:**

### **MÉTODO 1 - CORREÇÃO AUTOMÁTICA:**
1. Acesse: https://supabase.com/dashboard/project/wjnsbrkspgzioafvqfhe
2. Vá em **SQL Editor**
3. Cole e execute este código:

```sql
-- Corrigir permissões RLS
ALTER TABLE material_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE material_receipts ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow all operations on material_receipts" ON material_receipts;

-- Criar política permissiva
CREATE POLICY "material_receipts_full_access" 
ON material_receipts FOR ALL TO public
USING (true) WITH CHECK (true);

-- Testar
INSERT INTO material_receipts (material_type, plate, driver, net_weight) 
VALUES ('Teste', 'TST-9999', 'Sistema', 1.0);

SELECT COUNT(*) FROM material_receipts;
DELETE FROM material_receipts WHERE plate = 'TST-9999';
```

### **MÉTODO 2 - RECRIAR TABELA (Se método 1 não funcionar):**
```sql
-- Backup dados existentes (se houver)
CREATE TABLE material_receipts_backup AS SELECT * FROM material_receipts;

-- Deletar tabela
DROP TABLE material_receipts CASCADE;

-- Recriar tabela
CREATE TABLE material_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME NOT NULL DEFAULT CURRENT_TIME,
  exit_time TIME,
  material_type VARCHAR(100) NOT NULL,
  plate VARCHAR(20) NOT NULL,
  driver VARCHAR(255) NOT NULL,
  supplier VARCHAR(255),
  net_weight DECIMAL(10,3) NOT NULL,
  volume_m3 DECIMAL(10,3),
  volume_m2 DECIMAL(10,3), 
  volume_liters DECIMAL(10,3),
  unit_type VARCHAR(20) NOT NULL DEFAULT 'KG',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Políticas permissivas
ALTER TABLE material_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_material_receipts" ON material_receipts FOR ALL TO public USING (true) WITH CHECK (true);

-- Restaurar dados (se havia backup)
-- INSERT INTO material_receipts SELECT * FROM material_receipts_backup;
-- DROP TABLE material_receipts_backup;
```

## 🧪 **TESTE APÓS CORREÇÃO:**
1. Execute no SQL Editor:
```sql
SELECT COUNT(*) FROM material_receipts;
```

2. Na aplicação:
   - Acesse "Material Recebidos"
   - Tente cadastrar um material de teste
   - Verifique se aparece no modo TV

## 🚀 **RESULTADO ESPERADO:**
- ✅ Sem erro 400
- ✅ Materiais salvando corretamente  
- ✅ Banner do modo TV funcionando
- ✅ Detalhes aparecendo: "🔧 [Nome] → [Destino]"

## 📞 **Se ainda não funcionar:**
1. Verifique se você tem permissões de administrador no projeto
2. Tente acessar "Table Editor" > material_receipts e inserir manualmente
3. Verifique os logs em "Logs" > "API"

## ⚡ **QUICK FIX:**
Se tiver pressa, execute apenas isto:
```sql
ALTER TABLE material_receipts DISABLE ROW LEVEL SECURITY;
```
(Menos seguro, mas funciona imediatamente)