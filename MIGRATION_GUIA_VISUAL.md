# Como Executar a Migration do Sistema de Pause/Resume

## PASSO 1: Acessar Supabase Console

1. Acesse: https://app.supabase.com
2. Faça login com sua conta Bom Futuro
3. Selecione o projeto **Guarita** ou **guarita**

## PASSO 2: Ir para SQL Editor

No menu lateral esquerdo, clique em:
```
SQL Editor → + New Query
```

## PASSO 3: Copiar e Colar o SQL

Cole o seguinte código no editor:

```sql
-- Adicionar colunas para rastrear pausa e retomada do puxe
ALTER TABLE cotton_pull
ADD COLUMN IF NOT EXISTS hora_retomada_puxe TIME,
ADD COLUMN IF NOT EXISTS tempo_parado_minutos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_permanencia_liquido_minutos INTEGER DEFAULT 0;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_cotton_pull_parada_puxe 
ON cotton_pull(parada_puxe) WHERE parada_puxe = true;
```

## PASSO 4: Executar

Clique no botão verde **"▶ Run"** (canto superior direito do editor)

Você deve ver:
```
✅ Success
Query executed successfully
```

## PASSO 5: Verificar (Opcional)

Para confirmar que funcionou, rode este SELECT em um nova query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cotton_pull' 
  AND column_name IN ('hora_retomada_puxe', 'tempo_parado_minutos', 'tempo_permanencia_liquido_minutos')
ORDER BY ordinal_position;
```

Deve retornar 3 linhas com as novas colunas.

---

## ✅ Pronto!

Após executar a migration, o sistema de Pause/Resume estará totalmente funcional:

- **Parada Puxe**: Botão amarelo ⏸️ (quando motorista sai para almoçar)
- **Retomar Puxe**: Botão azul ▶️ (quando motorista volta)
- **Tempo Rastreado**: Tempo parado e permanência líquida salvos no banco

## 🆘 Se der erro

Se aparecer erro como `ERROR: column "hora_retomada_puxe" already exists`, significa que a coluna já existe (OK!) e você pode ignorar.

Se der outro erro, copie a mensagem e me mande!
