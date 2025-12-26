# 🚀 Deploy do Sistema Guarita v2.0

## Status Atual
✅ **Código commitado no GitHub**  
✅ **Build de produção gerado**  
✅ **Sistema pronto para deploy**

## 📦 Repositório
https://github.com/desenvolvedordionewalker-max/Guarita

## 🛠️ Opções de Deploy

### 1. Vercel (Recomendado - Gratuito)

#### Deploy Automático:
1. ✅ **PROJETO JÁ CONFIGURADO NO VERCEL!**
2. Acesse: https://vercel.com/projetos-projects-58a6f383/guarita.ibasantaluzia
3. Configure as variáveis de ambiente:
   ```
   VITE_SUPABASE_URL=https://wjnsbrkspgzioafvqfhe.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY1NDksImV4cCI6MjA3Nzg0MjU0OX0.J3b9opzn066qv2jqWXBtSXugAr30D0xNQM0YuG846og
   ```
4. Clique em "Redeploy" se necessário
5. ✅ Deploy automático das melhorias!

#### Link direto para import:
https://vercel.com/new/clone?repository-url=https://github.com/desenvolvedordionewalker-max/Guarita

### 2. Netlify (Alternativo - Gratuito)

1. Acesse [netlify.com](https://netlify.com)
2. Conecte com GitHub
3. Selecione o repositório `Guarita`
4. Configurações:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Adicione as variáveis de ambiente
6. Deploy!

### 3. Deploy Manual (Qualquer Servidor)

```bash
# 1. Clone o repositório
git clone https://github.com/desenvolvedordionewalker-max/Guarita.git
cd Guarita

# 2. Instale dependências
npm install

# 3. Configure .env
echo "VITE_SUPABASE_URL=sua_url" > .env
echo "VITE_SUPABASE_ANON_KEY=sua_chave" >> .env

# 4. Build para produção
npm run build

# 5. Upload dos arquivos da pasta 'dist/' para seu servidor
```

## 🔧 Variáveis de Ambiente Necessárias

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## ✅ Funcionalidades Implementadas

- ✅ Dashboard com contadores corretos
- ✅ Puxe de algodão com campo Talhão
- ✅ Carregamento otimizado
- ✅ Modo TV melhorado
- ✅ Controle de veículos flexível
- ✅ Upload de fotos unificado

## 📊 Próximos Passos (v2.1)

- [ ] Sistema de letras maiúsculas
- [ ] Reset automático à meia-noite
- [ ] Click para lançar saída

## 🆘 Suporte

Para problemas de deploy, verifique:
1. Variáveis de ambiente configuradas
2. Conexão com Supabase
3. Logs de build/deploy