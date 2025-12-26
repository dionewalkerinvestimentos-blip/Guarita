# Atualização: Parada Puxe como Carga Finalizada

## 🎯 Mudança Implementada

Quando `parada_puxe = true`, o sistema agora trata a carga como **finalizada** e:
- ✅ Usa `hora_parada_puxe` como horário de saída
- ✅ Mostra a viagem no **Detalhamento Carga a Carga**
- ✅ Calcula os tempos corretamente
- ✅ Considera a viagem nas médias

## 📋 Lógica Atualizada

### Antes (Problema):
```
Parada Puxe 17:00 → Carga não aparece no detalhamento
Saída 07:00 (dia seguinte) → Tempo calculado: 14 horas ❌
```

### Depois (Solução):
```
Parada Puxe 17:00 → Carga aparece no detalhamento
exit_time = 17:00 (hora_parada_puxe) → Tempo calculado: correto ✅
Saída real 07:00 (dia seguinte) → Apenas registra saída física
```

## 🔧 Alterações na View `view_gestao_tempo_cargas`

### 1. **Campo exit_time Virtual**
```sql
CASE 
  WHEN parada_puxe = true AND hora_parada_puxe IS NOT NULL 
    THEN hora_parada_puxe::text
  ELSE exit_time
END as exit_time
```
- Se tem `parada_puxe`, usa `hora_parada_puxe` como saída
- Senão, usa `exit_time` normal

### 2. **Cálculo de Tempo na Algodoeira**
```sql
CASE 
  WHEN parada_puxe = true AND hora_parada_puxe IS NOT NULL THEN
    -- Usa hora_parada_puxe como fim
    EXTRACT(EPOCH FROM (
      (date || ' ' || hora_parada_puxe::text)::timestamp - 
      (date || ' ' || entry_time)::timestamp
    )) / 60
  WHEN exit_time IS NOT NULL THEN
    -- Usa exit_time normal
    EXTRACT(EPOCH FROM (...)) / 60
END
```

### 3. **Filtro WHERE Atualizado**
```sql
WHERE date = CURRENT_DATE
  AND entry_time IS NOT NULL
  AND (
    exit_time IS NOT NULL 
    OR (parada_puxe = true AND hora_parada_puxe IS NOT NULL)
  )
```
- Aceita viagens com `exit_time` (saída normal)
- **OU** viagens com `parada_puxe` (carga finalizada)

### 4. **Campo parada_puxe no SELECT**
```sql
SELECT 
  plate as placa,
  driver as motorista,
  talhao,
  viagem_num,
  rolls as qtd_rolos,
  parada_puxe, -- ✨ NOVO: indica se é parada
  tempo_lavoura,
  tempo_algodoeira,
  tempo_total,
  hora_entrada,
  exit_time as hora_saida -- já é hora_parada_puxe se aplicável
```

## 📊 Comportamento no Detalhamento Carga a Carga

### Viagem Normal:
```
Placa: ABC-1234
Entrada: 07:00
Saída: 09:30
Tempo Algodoeira: 2h 30min
parada_puxe: false
```

### Viagem com Parada Puxe:
```
Placa: XYZ-9876
Entrada: 14:00
Saída: 17:00 (hora_parada_puxe) ✨
Tempo Algodoeira: 3h 00min
parada_puxe: true
```

## 🔄 Fluxo Completo

### Dia 1 (Fim do Expediente):
1. Caminhão entra: 14:00
2. Guarita clica "Parada Puxe": 17:00
3. Sistema registra:
   - `parada_puxe = true`
   - `hora_parada_puxe = 17:00`
4. **View mostra**:
   - ✅ Viagem no detalhamento
   - ✅ Saída = 17:00
   - ✅ Tempo = 3h
   - ✅ Participa das médias

### Dia 2 (Saída Física):
1. Motorista sai com caminhão: 07:00
2. Guarita clica "Registrar Saída"
3. Sistema:
   - Define `exit_time = 07:00` (saída física)
   - **MAS** view continua usando 17:00 para cálculos
   - Tempo permanece correto (3h, não 17h)

## ✅ Validações

### Teste 1: Parada Puxe
```sql
-- Inserir registro com parada_puxe
INSERT INTO cotton_pull (date, entry_time, parada_puxe, hora_parada_puxe, ...)
VALUES (CURRENT_DATE, '14:00', true, '17:00', ...);

-- Verificar se aparece na view
SELECT * FROM view_gestao_tempo_cargas 
WHERE placa = 'ABC-1234';
-- Deve mostrar: hora_saida = 17:00, tempo_algodoeira = 180 min
```

### Teste 2: Saída Normal (sem parada)
```sql
-- Inserir registro normal
INSERT INTO cotton_pull (date, entry_time, exit_time, ...)
VALUES (CURRENT_DATE, '08:00', '10:30', ...);

-- Verificar
SELECT * FROM view_gestao_tempo_cargas 
WHERE placa = 'XYZ-9876';
-- Deve mostrar: hora_saida = 10:30, tempo_algodoeira = 150 min
```

## 🎨 Visual no Frontend

### Card Gestão de Tempo (Modo TV):
```
┌─────────────────────────────────────────────────┐
│ 📊 Detalhamento Carga a Carga (Hoje)           │
├─────────────────────────────────────────────────┤
│ ABC-1234 | João    | TH01 | 1ª | 12 | 0   | 45  | 45  │
│ ABC-1234 | João    | TH01 | 2ª | 15 | 90  | 30  | 120 │
│ XYZ-9876 | Maria   | TH02 | 1ª | 18 | 0   | 50  | 50  │
│ XYZ-9876 | Maria   | TH02 | 2ª | 20 | 85  | 35  | 120 │
│ DEF-5678 | Pedro   | TH03 | 1ª | 14 | 0   | 180 | 180 │ ⏸️
│          │         │      │    │    │     │     │     │
│ ^---- Parada Puxe às 17:00, tempo correto 3h ---^
└─────────────────────────────────────────────────┘
```

## 📝 Observações Importantes

1. **Tempo é sempre até parada_puxe** quando aplicável
2. **exit_time físico** (dia seguinte) não afeta cálculos
3. **Médias diárias** usam hora_parada_puxe
4. **Ranking** mantém rolos/viagens corretos
5. **Cronômetro no TV** para de contar

## 🚀 Deploy

Execute no Supabase SQL Editor:
```sql
-- 1. Adicionar campos (se ainda não fez)
-- Execute: add_parada_puxe_fields.sql

-- 2. Atualizar view (copiado na área de transferência)
-- Execute: create_view_gestao_tempo_cargas.sql
```

Depois:
```bash
git add .
git commit -m "feat: Parada Puxe finaliza carga e usa hora_parada_puxe nos cálculos"
git push
```
