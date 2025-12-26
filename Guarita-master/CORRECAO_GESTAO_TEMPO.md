# Correção - Gestão de Tempo

## Problemas Corrigidos

### 1. Ranking com Tempos Negativos
**Problema:** Caminhões que ficam pernoitando na unidade (saída após 18h e entrada no dia seguinte) geravam tempos negativos.

**Solução:** 
- Modificar views SQL para **ignorar primeira e última viagem do dia**
- Primeira viagem não tem tempo de lavoura (caminhão veio de onde?)
- Última viagem pode ter ficado pernoitando (tempo inválido)

**Arquivos modificados:**
- `create_view_gestao_tempo_v2.sql` - Adicionado filtro `viagem_num > 1 AND viagem_num < total_viagens_dia`
- `create_view_gestao_tempo_cargas.sql` - Adicionado filtro `viagem_num > 1 AND viagem_num < total_viagens_dia`

### 2. Histórico Completo sem Tempo de Viagem
**Problema:** Ao clicar no ranking, o histórico completo não mostrava tempo de viagem lavoura.

**Solução:**
- Recalcular tempos de viagem no `handleRankingClick`
- Processar viagens dia a dia
- Calcular tempo lavoura como diferença entre saída anterior e entrada atual
- Tratar casos de virada de dia (tempo negativo + 1440 minutos)

**Arquivo modificado:**
- `src/pages/RelatorioGestaoPuxe.tsx` - Função `handleRankingClick` completamente reescrita

## Lógica de Filtro

### Viagens Válidas para Cálculo de Média
```
Viagem 1: IGNORADA (sem tempo lavoura anterior)
Viagem 2: VÁLIDA ✓
Viagem 3: VÁLIDA ✓
Viagem 4: VÁLIDA ✓
...
Última Viagem: IGNORADA (pode estar pernoitando)
```

### Exemplo Prático
```
Caminhão ABC-1234:
08:00 - Entrada 1ª viagem (IGNORADA)
08:15 - Saída 1ª viagem

09:30 - Entrada 2ª viagem (VÁLIDA) - Tempo lavoura: 75min
09:45 - Saída 2ª viagem - Tempo algodoeira: 15min

11:00 - Entrada 3ª viagem (VÁLIDA) - Tempo lavoura: 75min
11:20 - Saída 3ª viagem - Tempo algodoeira: 20min

17:30 - Entrada última viagem (IGNORADA - pode pernoitar)
17:45 - Saída última viagem
```

## Execução das Views

Execute os arquivos SQL no Supabase na seguinte ordem:

```sql
-- 1. Recriar view de médias
\i create_view_gestao_tempo_v2.sql

-- 2. Recriar view de cargas
\i create_view_gestao_tempo_cargas.sql
```

## Validação

Após executar as views, verifique:

1. ✅ Médias não possuem valores negativos
2. ✅ Ranking não mostra tempos negativos
3. ✅ Histórico completo mostra tempo de viagem
4. ✅ Primeira e última viagem do dia são ignoradas nos cálculos

## Notas Técnicas

- **Tempo máximo algodoeira:** 240 minutos (4 horas)
- **Tempo máximo lavoura:** 1440 minutos (24 horas)
- **Filtro de horário:** Viagens após 17h são consideradas última viagem do dia
- **Tratamento virada de dia:** Tempos negativos são ajustados somando 1440 minutos
