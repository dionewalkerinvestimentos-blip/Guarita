# 🔧 Instruções de Configuração - Sistema de Histórico e Limpeza Automática

## 📋 Resumo do Sistema

- **Fila e Carregando**: Permanecem sempre visíveis, nunca são removidos
- **Concluídos**: São arquivados no histórico e removidos da visualização às 00:00 diariamente
- **Histórico**: Todos os carregamentos são preservados permanentemente na tabela `loading_history`

---

## 🚀 Passo a Passo de Instalação

### 0️⃣ Corrigir Status de Registros Antigos (EXECUTAR PRIMEIRO!)

**IMPORTANTE**: Execute este script ANTES de tudo para corrigir registros que não têm status definido.

1. Acesse seu **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo: **`fix_old_statuses.sql`**
4. **Copie TODO o conteúdo** do arquivo
5. **Cole** no SQL Editor do Supabase
6. Clique em **Run** ou pressione **Ctrl+Enter**
7. Aguarde a mensagem de sucesso

**O que isso faz:**
- ✅ Marca como `'concluido'` todos registros que têm `exit_date` preenchido
- ✅ Marca como `'carregando'` todos registros que têm `entry_date` mas não `exit_date`
- ✅ Marca como `'fila'` todos registros que não têm datas preenchidas
- ✅ Exibe relatório de quantos registros foram atualizados

---

### 1️⃣ Criar Tabela de Histórico e Funções

1. Acesse seu **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo: **`setup_history_CLEAN.sql`**
4. **Copie TODO o conteúdo** do arquivo
5. **Cole** no SQL Editor do Supabase
6. Clique em **Run** ou pressione **Ctrl+Enter**
7. Aguarde a mensagem de sucesso

⚠️ **IMPORTANTE**: Use o arquivo `setup_history_CLEAN.sql` (versão limpa, sem comentários problemáticos)

**O que isso cria:**
- ✅ Tabela `loading_history` (armazena todos os registros permanentemente)
- ✅ Função `archive_completed_loadings()` (move concluídos para histórico)
- ✅ Função `get_loading_history()` (consulta histórico com filtros)
- ✅ View `all_loadings` (consulta unificada de ativos + histórico)
- ✅ Políticas de segurança RLS

---

### 2️⃣ Habilitar Extensão pg_cron (Agendamento Automático)

1. No Supabase Dashboard, vá em **Database** → **Extensions**
2. Procure por `pg_cron`
3. Clique em **Enable** (Habilitar)
4. Aguarde alguns segundos

---

### 3️⃣ Configurar Limpeza Automática Diária

Após habilitar o pg_cron:

1. Abra o arquivo: **`schedule_cleanup.sql`**
2. **Copie o conteúdo** (apenas o comando SELECT)
3. **Cole** no SQL Editor do Supabase
4. Clique em **Run**

O arquivo contém:
```sql
SELECT cron.schedule(
  'cleanup-completed-loadings',
  '0 0 * * *',
  $$SELECT archive_completed_loadings();$$
);
```

**O que isso faz:**
- Agenda a função `archive_completed_loadings()` para rodar todo dia às 00:00
- Move registros com `status = 'concluido'` para a tabela de histórico
- Remove esses registros da tabela `loading_records` (deixando apenas fila/carregando/carregado)

---

### 4️⃣ Adicionar Coluna Status (se ainda não fez)

Se você ainda não executou o `add_status_to_loading_records.sql`, execute-o agora:

1. Abra o **SQL Editor**
2. Cole e execute: `add_status_to_loading_records.sql`
3. Isso cria a coluna `status` com os valores: `fila`, `carregando`, `carregado`, `concluido`

---

## 🧪 Testar o Sistema

### Teste Manual de Arquivamento

Para testar se está funcionando, execute no SQL Editor:

```sql
-- Ver quantos registros concluídos existem
SELECT COUNT(*) FROM loading_records WHERE status = 'concluido';

-- Executar arquivamento manualmente (simula a limpeza da meia-noite)
SELECT archive_completed_loadings();

-- Verificar que foram movidos para o histórico
SELECT COUNT(*) FROM loading_history;

-- Ver que não existem mais concluídos na tabela ativa
SELECT COUNT(*) FROM loading_records WHERE status = 'concluido';
```

---

## 📊 Consultas Úteis

### Ver Jobs Agendados
```sql
SELECT * FROM cron.job;
```

### Ver Histórico de Execuções
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Desabilitar Limpeza Automática (se necessário)
```sql
SELECT cron.unschedule('cleanup-completed-loadings');
```

### Ver Todos os Carregamentos (Ativos + Histórico)
```sql
SELECT * FROM all_loadings WHERE date >= '2025-11-01' ORDER BY date DESC;
```

### Consultar Histórico por Período
```sql
SELECT * FROM get_loading_history('2025-11-01', '2025-11-07', NULL);
```

### Consultar Histórico por Placa
```sql
SELECT * FROM get_loading_history(NULL, NULL, 'ABC-1234');
```

---

## 🔍 Como Funciona o Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│  LOADING_RECORDS (Tabela Ativa - Visível no App)           │
├─────────────────────────────────────────────────────────────┤
│  • Fila       → Permanece até virar "carregando"           │
│  • Carregando → Permanece até virar "carregado"            │
│  • Carregado  → Permanece até marcar saída (vira concluído)│
│  • Concluído  → REMOVIDO às 00:00 (movido para histórico)  │
└─────────────────────────────────────────────────────────────┘
                            ↓ (00:00 diariamente)
┌─────────────────────────────────────────────────────────────┐
│  LOADING_HISTORY (Histórico Permanente)                    │
├─────────────────────────────────────────────────────────────┤
│  • Todos os carregamentos concluídos                        │
│  • NUNCA são deletados                                       │
│  • Disponível para consultas e relatórios                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Importante

1. **Backup**: Antes de executar qualquer script, faça backup do banco de dados
2. **Timezone**: O horário 00:00 será baseado no timezone do servidor Supabase (geralmente UTC)
3. **Primeira Execução**: Na primeira vez, arquive manualmente os registros antigos:
   ```sql
   SELECT archive_completed_loadings();
   ```
4. **Testes**: Sempre teste com `SELECT` antes de executar operações de modificação

---

## 📱 Próximos Passos no Código

Para acessar o histórico no frontend, você pode criar queries como:

```typescript
// Consultar histórico
const { data: history } = await supabase
  .from('loading_history')
  .select('*')
  .order('completed_at', { ascending: false });

// Consultar tudo (ativos + histórico)
const { data: allLoadings } = await supabase
  .from('all_loadings')
  .select('*')
  .order('date', { ascending: false });
```

---

## 🎯 Resultado Final

✅ **Fila e Carregando**: Sempre visíveis no dashboard  
✅ **Carregado**: Visível com badge de alerta até registrar saída  
✅ **Concluído**: Removido automaticamente às 00:00  
✅ **Histórico**: Preservado para sempre, disponível para relatórios  
✅ **Performance**: Tabela ativa sempre limpa, histórico indexado  

---

Se tiver alguma dúvida durante a execução, consulte a documentação do Supabase sobre pg_cron:
https://supabase.com/docs/guides/database/extensions/pg_cron
