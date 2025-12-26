# Configuração do Domínio Vercel

## Problema
O Vercel estava gerando novos domínios a cada deploy em vez de usar sempre o mesmo.

## Solução Implementada

### 1. Configuração no vercel.json
- Nome do projeto definido como `guaritaibasantaluzia`
- Redirects configurados para redirecionar outros domínios para o principal
- Headers de cache configurados

### 2. Domínio Principal
**https://guaritaibasantaluzia.vercel.app**

### 3. Como Garantir que Sempre Use o Mesmo Domínio

#### Método 1: Via Dashboard Vercel (Recomendado)
1. Acesse https://vercel.com/dashboard
2. Encontre seu projeto "Guarita" ou "guaritaibasantaluzia"  
3. Vá em **Settings** > **Domains**
4. **Remova todos os domínios extras** (deixe apenas guaritaibasantaluzia.vercel.app)
5. Se necessário, adicione o domínio principal como primário

#### Método 2: Via CLI
```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# No diretório do projeto
vercel --prod
```

### 4. Configurações Importantes

#### No vercel.json:
- `name`: "guaritaibasantaluzia" (define o nome do projeto)
- `redirects`: Redireciona outros domínios para o principal
- `env`: Variáveis de ambiente do Supabase

#### Variáveis de Ambiente:
- `VITE_SUPABASE_URL`: https://wjnsbrkspgzioafvqfhe.supabase.co
- `VITE_SUPABASE_ANON_KEY`: (chave configurada)

### 5. Verificação

Após o próximo deploy, o sistema deve:
- ✅ Sempre usar https://guaritaibasantaluzia.vercel.app
- ✅ Redirecionar outros domínios automaticamente
- ✅ Manter o mesmo domínio em todos os deployments futuros

### 6. Troubleshooting

Se ainda aparecerem novos domínios:
1. Verifique no dashboard do Vercel se há múltiplos projetos
2. Delete projetos duplicados
3. Mantenha apenas um projeto com o nome "guaritaibasantaluzia"
4. Configure como projeto principal

---

**Domínio Final**: https://guaritaibasantaluzia.vercel.app