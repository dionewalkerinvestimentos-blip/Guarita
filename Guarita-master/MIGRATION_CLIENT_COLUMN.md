# Migração: Adicionar coluna client à tabela loading_records

## Problema
O sistema está tentando usar o campo `client` na tabela `loading_records`, mas a coluna não existe no banco de dados, causando o erro:
```
Could not find the "client" column of "loading_records" in the schema cache
```

## Solução
Execute o seguinte SQL no Supabase Dashboard (SQL Editor):

```sql
-- Adicionar coluna client na tabela loading_records
-- Campo opcional para registrar o cliente do carregamento

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'loading_records' 
                   AND column_name = 'client'
                   AND table_schema = 'public') THEN
        ALTER TABLE loading_records ADD COLUMN client VARCHAR(255);
    END IF;
END $$;

-- Adicionar comentário na coluna
COMMENT ON COLUMN loading_records.client IS 'Cliente do carregamento (opcional)';

-- Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'loading_records' 
AND table_schema = 'public'
AND column_name = 'client';
```

## Como executar:

1. Acesse o Supabase Dashboard
2. Vá para o projeto Guarita
3. Navegue até "SQL Editor"
4. Cole o código SQL acima
5. Execute o script
6. Verifique se a coluna foi criada com sucesso

## Verificação:
Após executar, você deve ver um resultado similar a:
```
column_name | data_type      | is_nullable | column_default
client      | character varying | YES        | null
```

## Status:
- ✅ Interface TypeScript (LoadingRecord) já atualizada
- ✅ Código da aplicação já preparado
- ⏳ **PENDENTE: Executar migração no banco de dados**