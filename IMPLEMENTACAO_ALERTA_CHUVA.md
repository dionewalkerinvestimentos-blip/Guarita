# Implementação de Alerta de Chuva em Tempo Real

## 1. Executar SQL no Supabase

Execute o arquivo `create_rain_alert_table.sql` no SQL Editor do Supabase.

## 2. Adicionar Botão no Dashboard

No arquivo `src/pages/Dashboard.tsx`, adicione:

### Import:
```typescript
import { useRainAlert } from "@/hooks/use-rain-alert";
import { Cloud } from "lucide-react";
```

### No component Dashboard (após outros hooks):
```typescript
const { isRaining, toggleRainAlert } = useRainAlert();
```

### Botão (adicionar próximo aos outros botões do header, linha ~600):
```typescript
<Button
  variant={isRaining ? "destructive" : "outline"}
  size="sm"
  onClick={() => toggleRainAlert(!isRaining)}
  className="gap-2"
>
  <Cloud className={`w-4 h-4 ${isRaining ? 'animate-pulse' : ''}`} />
  {isRaining ? 'Pausar Chuva' : 'Ativar Chuva'}
</Button>
```

## 3. Adicionar Animação no Modo TV

No arquivo `src/pages/DashboardPortaria.tsx`:

### Import:
```typescript
import { useRainAlert } from "@/hooks/use-rain-alert";
import { RainAnimation } from "@/components/RainAnimation";
```

### No component (após outros hooks):
```typescript
const { isRaining } = useRainAlert();
```

### Renderizar animação (antes do return principal, dentro do JSX):
```typescript
{isRaining && <RainAnimation />}
```

## Arquivos Criados

1. `create_rain_alert_table.sql` - SQL para criar a tabela
2. `src/hooks/use-rain-alert.ts` - Hook para gerenciar o alerta
3. `src/components/RainAnimation.tsx` - Componente de animação de chuva

## Como Funciona

1. Guarda clica no botão "Ativar Chuva" no Dashboard
2. Status é salvo no banco de dados (tabela `rain_alert`)
3. Modo TV recebe atualização em tempo real via Supabase Realtime
4. Animação de gotas de chuva começa a cair na tela
5. Ícone da gota no header pisca enquanto está chovendo
6. Guarda clica em "Pausar Chuva" para desativar

## Recursos

- ✅ Sincronização em tempo real entre Dashboard e Modo TV
- ✅ Animação suave de gotas de chuva
- ✅ Ícone piscante no Modo TV quando ativo
- ✅ Botão visual no Dashboard (vermelho quando ativo)
- ✅ Toast de confirmação ao ativar/desativar
