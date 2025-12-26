# 🔧 CORREÇÃO: Tabela material_receipts não encontrada

## 🚨 **PROBLEMA:**
A tabela `material_receipts` não existe no Supabase, causando erro 400 ao tentar salvar materiais.

## ✅ **SOLUÇÃO - Execute no Supabase:**

### **Passo 1: Acessar Supabase**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto (wjnsbrkspgzioafvqfhe)
3. Vá em **SQL Editor** (ícone </> na lateral)

### **Passo 2: Executar Script**
1. Clique em **"+ New Query"**
2. Cole o conteúdo do arquivo `fix_material_receipts_table.sql`
3. **Execute BLOCO POR BLOCO** (não tudo de uma vez)

### **Passo 3: Ordem de Execução**
Execute na seguinte ordem:

#### **Bloco 1 - Criar Tabela:**
```sql
CREATE TABLE IF NOT EXISTS material_receipts (
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
```

#### **Bloco 2 - Índices:**
```sql
CREATE INDEX IF NOT EXISTS idx_material_receipts_date ON material_receipts(date);
CREATE INDEX IF NOT EXISTS idx_material_receipts_material_type ON material_receipts(material_type);
CREATE INDEX IF NOT EXISTS idx_material_receipts_plate ON material_receipts(plate);
CREATE INDEX IF NOT EXISTS idx_material_receipts_created_at ON material_receipts(created_at);
```

#### **Bloco 3 - Função Trigger:**
```sql
CREATE OR REPLACE FUNCTION update_material_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### **Bloco 4 - Trigger:**
```sql
DROP TRIGGER IF EXISTS update_material_receipts_updated_at ON material_receipts;
CREATE TRIGGER update_material_receipts_updated_at 
BEFORE UPDATE ON material_receipts 
FOR EACH ROW EXECUTE FUNCTION update_material_receipts_updated_at();
```

#### **Bloco 5 - Políticas de Segurança:**
```sql
ALTER TABLE material_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on material_receipts" ON material_receipts;
CREATE POLICY "Allow all operations on material_receipts" 
ON material_receipts FOR ALL 
USING (true)
WITH CHECK (true);
```

### **Passo 4: Verificar**
Execute para verificar se funcionou:
```sql
SELECT COUNT(*) FROM material_receipts;
```

## 🎯 **RESULTADO ESPERADO:**
- ✅ Tabela criada sem erros
- ✅ Sistema de materiais funcionando
- ✅ Banner no modo TV mostrando informações

## 📞 **Se ainda houver problemas:**
1. Verifique se você tem permissões de administrador
2. Tente executar apenas o CREATE TABLE primeiro
3. Verifique no dashboard se a tabela aparece em "Table Editor"

## 🔄 **Após correção:**
1. Recarregue a aplicação
2. Teste inserir um material
3. Verifique se aparece no modo TV