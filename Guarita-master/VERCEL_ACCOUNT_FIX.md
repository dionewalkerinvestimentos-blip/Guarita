# Guia para Corrigir Conta do Vercel

## Problema Identificado
O Vercel está fazendo deploy em uma conta diferente do GitHub (desenvolvedordionewalker...).

## Soluções Passo a Passo

### Opção 1: Verificar e Corrigir no Dashboard Vercel

1. **Acesse o Vercel Dashboard:**
   - Vá para: https://vercel.com/dashboard
   - Verifique se está logado com a conta correta: **desenvolvedordionewalker...**

2. **Se estiver na conta errada:**
   - Clique no avatar/perfil no canto superior direito
   - Clique em "Log out"
   - Faça login novamente com: **desenvolvedordionewalker...**

3. **Verificar Conexão GitHub:**
   - No dashboard, vá em Settings > Git
   - Verifique se está conectado ao GitHub da conta: **desenvolvedordionewalker-max**
   - Se não, desconecte e reconecte com a conta correta

### Opção 2: Reimportar o Projeto na Conta Correta

1. **Na conta correta do Vercel:**
   - Clique em "New Project"
   - Conecte com GitHub (desenvolvedordionewalker-max)
   - Selecione o repositório: "Guarita"
   - Configure:
     - Project Name: `guaritaibasantaluzia`
     - Framework Preset: Vite
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `dist`

2. **Configurar Variáveis de Ambiente:**
   - VITE_SUPABASE_URL: `https://wjnsbrkspgzioafvqfhe.supabase.co`
   - VITE_SUPABASE_ANON_KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NDE0MjMsImV4cCI6MjA0NjMxNzQyM30.Cw8bs3aTBe6Qmr-0flDIR-dnx89C1LC0rJR_YCjIKP0`

3. **Configurar Domínio:**
   - Após o deploy, vá em Settings > Domains
   - O domínio deve ser: `guaritaibasantaluzia.vercel.app`

### Opção 3: Via Vercel CLI (Recomendado)

Execute estes comandos no terminal:

```bash
# 1. Instalar Vercel CLI globalmente
npm install -g vercel

# 2. Fazer logout da conta atual
vercel logout

# 3. Fazer login com a conta correta
vercel login
# (Use o email: desenvolvedordionewalker...)

# 4. No diretório do projeto
cd "C:\Users\dione.walker\dyad-apps\Guarita"

# 5. Configurar o projeto
vercel --prod

# 6. Responda as perguntas:
# - Set up and deploy? Y
# - Which scope? desenvolvedordionewalker...
# - Link to existing project? N
# - Project name? guaritaibasantaluzia
# - In which directory is your code located? ./
```

## Verificação Final

Após qualquer opção acima:

1. **Verifique o domínio:** https://guaritaibasantaluzia.vercel.app
2. **Confirme no dashboard:** O projeto deve aparecer na conta **desenvolvedordionewalker...**
3. **Teste o sistema:** Todas as funcionalidades devem estar funcionando

## Comandos Úteis

```bash
# Verificar qual conta está ativa
vercel whoami

# Listar projetos da conta atual
vercel ls

# Ver detalhes do projeto atual
vercel inspect
```

## Importante

- ✅ Usar sempre a conta: **desenvolvedordionewalker...**
- ✅ Repositório: **desenvolvedordionewalker-max/Guarita**
- ✅ Domínio final: **guaritaibasantaluzia.vercel.app**

---

Execute uma das opções acima para corrigir a conta do Vercel!