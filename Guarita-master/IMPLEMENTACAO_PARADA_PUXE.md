# Implementação: Funcionalidade "Parada Puxe"

## 📋 Resumo
Funcionalidade para pausar a contagem de tempo quando o caminhão encerra o dia mas ainda não saiu da algodoeira, sem afetar a contagem de rolos, viagens ou rankings.

## 🎯 Objetivo
Corrigir a contagem de tempo dentro da unidade quando o caminhão fica estacionado durante a noite aguardando saída no dia seguinte.

## 📁 Arquivos Alterados

### 1. **SQL - Estrutura do Banco**
- `add_parada_puxe_fields.sql` - Adiciona campos `parada_puxe` e `hora_parada_puxe` na tabela `cotton_pull`
- `update_views_parada_puxe.sql` - Atualiza views para considerar parada_puxe nos cálculos de tempo

### 2. **TypeScript - Interface**
- `src/lib/supabase.ts` - Adiciona campos opcionais ao interface `CottonPull`

### 3. **React - Componente**
- `src/pages/CottonPull.tsx` - Implementa botão "Parada Puxe" e lógica de pausar tempo

## 🔧 Alterações Implementadas

### Banco de Dados
```sql
ALTER TABLE cotton_pull
ADD COLUMN parada_puxe BOOLEAN DEFAULT FALSE,
ADD COLUMN hora_parada_puxe TIME NULL;
```

### Interface TypeScript
```typescript
export interface CottonPull {
  // ... campos existentes
  parada_puxe?: boolean
  hora_parada_puxe?: string
}
```

### Funcionalidades no UI

#### Botão "Parada Puxe"
- **Localização**: Aba "Aguardando Saída", ao lado do botão "Registrar Saída"
- **Ícone**: ⏸️ (PauseCircle)
- **Cor**: Amarelo (`bg-yellow-400/20`)
- **Ação**: 
  - Define `parada_puxe = true`
  - Registra `hora_parada_puxe` com horário atual
  - Para o cronômetro visualmente
  - Exibe status "Parada Puxe ⏸️ (aguardando retomada)"

#### Cálculo de Tempo Ajustado
- **Quando `parada_puxe = true`**:
  - Tempo na algodoeira = `hora_parada_puxe - entry_time`
  - Cronômetro visual mostra tempo pausado
  - Tempo após parada é ignorado nos cálculos

- **Quando `parada_puxe = false`** (normal):
  - Tempo na algodoeira = `exit_time - entry_time`
  - Cronômetro continua contando até saída

#### Views SQL Atualizadas

**view_gestao_tempo_cargas**:
```sql
CASE 
  WHEN parada_puxe = true AND hora_parada_puxe IS NOT NULL THEN
    -- Usa hora_parada_puxe como fim
  WHEN exit_time IS NOT NULL THEN
    -- Usa exit_time como fim (normal)
END
```

**view_gestao_tempo** (médias):
- Considera `hora_parada_puxe` ao calcular médias
- Exclui horário de almoço (11h-13h)
- Ignora primeira e última viagem
- Limite máximo de 5h (300 min)

## ✅ Regras de Negócio Mantidas

### Não Afeta:
- ✅ Quantidade de rolos puxados
- ✅ Quantidade de viagens
- ✅ Totais do dia
- ✅ Ranking de motoristas
- ✅ Indicadores de produtividade

### Afeta Apenas:
- ⏱️ Tempo de permanência na algodoeira (cálculo correto)
- 📊 Médias de tempo (views gestão_tempo)
- 🖥️ Cronômetro visual (para quando pausado)

## 📝 Fluxo de Uso

1. **Fim do Dia**:
   - Motorista termina trabalho
   - Guarita clica em "Parada Puxe ⏸️"
   - Sistema registra hora e pausa cronômetro

2. **Durante a Noite**:
   - Caminhão fica estacionado
   - Tempo não conta para médias
   - Status exibe "Parada Puxe ⏸️"

3. **Dia Seguinte**:
   - Motorista sai com o caminhão
   - Guarita clica em "Registrar Saída"
   - Sistema usa `hora_parada_puxe` para calcular tempo real
   - Limpa flags de parada

## 🚀 Deploy

### Passo 1: Executar SQL no Supabase
```bash
# 1. Adicionar campos
Execute: add_parada_puxe_fields.sql

# 2. Atualizar views
Execute: update_views_parada_puxe.sql
```

### Passo 2: Deploy do Código
```bash
git add .
git commit -m "feat: Implementar funcionalidade Parada Puxe"
git push
```

### Passo 3: Testar
1. Ir para módulo "Puxe de Algodão da Lavoura"
2. Registrar entrada de um caminhão
3. Verificar seção "Aguardando Saída"
4. Clicar em "Parada Puxe ⏸️"
5. Verificar:
   - Status mudou para "Parada Puxe ⏸️"
   - Cronômetro pausou
   - Hora da parada foi registrada
6. Clicar em "Registrar Saída"
7. Verificar que o tempo calculado está correto (até a hora da parada)

## 🎨 Visual

### Antes da Parada
```
┌─────────────────────────────────────────────────────┐
│ ABC-1234 - João Silva                               │
│ CARAJAS | 12 rolos                                  │
│ Entrada: 07:30 | Permanência: 2h 15min              │
│                                                      │
│ [🗑️] [Registrar Saída] ──────────────────────────── │
└─────────────────────────────────────────────────────┘
```

### Depois da Parada
```
┌─────────────────────────────────────────────────────┐
│ ABC-1234 - João Silva                               │
│ CARAJAS | 12 rolos                                  │
│ ⏸️ Parada Puxe ⏸️ (aguardando retomada)            │
│ Entrada: 07:30 | Parada: 17:00 | Permanência: 9h 30m│
│                                                      │
│ [🗑️] [Registrar Saída] ──────────────────────────── │
└─────────────────────────────────────────────────────┘
```

## ⚠️ Observações Importantes

1. **Botão "Parada Puxe"** só aparece se `parada_puxe = false`
2. **Uma vez pausado**, não pode ser despausado (apenas registrar saída)
3. **Tempo é calculado** até `hora_parada_puxe`, não até `exit_time`
4. **Views SQL** foram atualizadas para considerar parada em todos os cálculos
5. **Médias diárias** usam o tempo correto (até a parada)

## 🔍 Verificação de Qualidade

- [x] Campos adicionados ao banco
- [x] Interface TypeScript atualizada
- [x] Botão "Parada Puxe" implementado
- [x] Cálculo de tempo ajustado
- [x] Views SQL atualizadas
- [x] Visual com status de parada
- [x] Cronômetro pausado visualmente
- [x] Não afeta rolos/viagens/rankings
- [x] Documentação completa
