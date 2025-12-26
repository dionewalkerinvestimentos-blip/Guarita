# 🚀 CONFIGURAÇÃO VERCEL - GUARITA

## ✅ **PROJETO CONFIGURADO:**
**Link do Projeto:** https://vercel.com/projetos-projects-58a6f383/guarita.ibasantaluzia

---

## 🔧 **CONFIGURAR VARIÁVEIS DE AMBIENTE:**

### **Passo 1 - Acessar Configurações:**
1. Acesse: https://vercel.com/projetos-projects-58a6f383/guarita.ibasantaluzia
2. Clique na aba **"Settings"**
3. No menu lateral, clique em **"Environment Variables"**

### **Passo 2 - Adicionar Variáveis:**

**Variável 1:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://wjnsbrkspgzioafvqfhe.supabase.co`
- **Environments:** ✅ Production ✅ Preview ✅ Development

**Variável 2:**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY1NDksImV4cCI6MjA3Nzg0MjU0OX0.J3b9opzn066qv2jqWXBtSXugAr30D0xNQM0YuG846og`
- **Environments:** ✅ Production ✅ Preview ✅ Development

### **Passo 3 - Forçar Redeploy:**
1. Vá para a aba **"Deployments"**
2. No último deployment, clique nos **3 pontos (⋯)**
3. Clique em **"Redeploy"**
4. Aguarde o build completar

---

## 🎯 **VERIFICAR SE FUNCIONOU:**

Após o deploy, as seguintes melhorias DEVEM estar ativas:

### ✅ **Dashboard Principal:** 
- Deve mostrar "Total Carregamentos" ao invés de "Total Veículos"
- Contadores corretos para fila/carregando/concluídos

### ✅ **Puxe de Algodão:**
- Campo "Talhão" deve aparecer no formulário
- Modal de horário de saída funcionando

### ✅ **Sistema de Carregamento:**
- Formulário só aparece após clicar "Novo Carregamento"
- Cadastro de novos produtos funcionando

### ✅ **Modo TV (Dashboard Portaria):**
- Cards devem mostrar "Carregando" ao invés de "CARREGA"
- Ranking com nome do motorista e total de viagens

### ✅ **Controle de Veículos:**
- Data de saída deve ser opcional (não obrigatória)

---

## 🚨 **SE NÃO FUNCIONAR:**

1. **Verificar Variáveis:** Certifique-se que as 2 variáveis estão configuradas
2. **Clear Cache:** Ctrl+F5 ou modo anônimo no browser
3. **Check Logs:** Na aba "Functions" do Vercel, verificar se há erros
4. **Redeploy:** Força um novo deployment

---

## 📱 **LINK DE ACESSO:**
Seu sistema estará disponível em um link como:
`https://guarita-ibasantaluzia-xxx.vercel.app`

**Data de configuração:** ${new Date().toLocaleString('pt-BR')}