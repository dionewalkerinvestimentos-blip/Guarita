# Implementação do Sistema de Pause/Resume do Puxe de Algodão

## Instruções de Setup

### 1. Executar Migration SQL

Acesse o **Supabase Console** → **SQL Editor** e execute os seguintes comandos:

```sql
-- Adicionar colunas para rastrear pausa e retomada
ALTER TABLE cotton_pull
ADD COLUMN IF NOT EXISTS hora_retomada_puxe TIME,
ADD COLUMN IF NOT EXISTS tempo_parado_minutos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_permanencia_liquido_minutos INTEGER DEFAULT 0;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_cotton_pull_parada_puxe 
ON cotton_pull(parada_puxe) WHERE parada_puxe = true;
```

### 2. Alterações no Código

Foram feitas as seguintes alterações:

**src/lib/supabase.ts**
- Adicionado `hora_retomada_puxe?: string` à interface `CottonPull`
- Adicionado `tempo_parado_minutos?: number` à interface `CottonPull`
- Adicionado `tempo_permanencia_liquido_minutos?: number` à interface `CottonPull`

**src/pages/CottonPull.tsx**
- Adicionada função `handleRetomaPuxe()` que:
  - Calcula o tempo que ficou parado (hora_retomada - hora_parada)
  - Calcula o tempo de permanência líquido (entrada até retomada)
  - Atualiza os campos no banco
  - Mostra toast com informações de retomada
- Adicionado botão "Retomar Puxe" na UI que aparece quando `parada_puxe = true`
- O botão só aparece para registros em parada, complementando o botão "Parada Puxe" existente

### 3. Fluxo de Uso

1. **Motorista entra**: `entry_time` é registrado
2. **Motorista sai para almoçar**: Clica em "Parada Puxe" → registra `parada_puxe = true` e `hora_parada_puxe`
3. **Motorista volta**: Clica em "Retomar Puxe" → registra `hora_retomada_puxe` e calcula tempos
4. **Motorista sai**: Clica em "Registrar Saída" → registra `exit_time`

### 4. Reset Diário no Painel TV

O painel TV (DashboardPortaria) já mostra apenas registros do dia atual. Para garantir reset completo:
- O filtro `filtro que traz registros de hoje é feito automaticamente via `getTodayLocalDate()`
- Cada dia novo, o painel TV mostrará apenas registros com a data de hoje

### 5. Verificação

Após executar a migration, você pode verificar se as colunas foram criadas com:

```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'cotton_pull' 
ORDER BY ordinal_position;
```

As novas colunas devem aparecer no resultado.

## Notas Importantes

- O cálculo de tempo parado desconsidera a mudança de dia (usa apenas hora:minuto:segundo)
- O tempo de permanência é mostrado em minutos inteiros (arredondado)
- Os dados de pausa são opcionais - registros sem parada continuam funcionando normalmente
