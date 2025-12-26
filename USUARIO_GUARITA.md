# 👤 Cadastro de Usuário Guarita

## 🔐 Dados do Usuário
- **Nome:** guarita
- **Senha:** 123456
- **Email:** guarita@iba.com
- **Role:** user

## 📋 Instruções de Instalação

### 🚀 **OPÇÃO 1: Login Direto (Recomendado)**
O sistema já funciona **sem precisar executar scripts**:

1. **Acesse** a aplicação
2. **Digite:** `guarita` / `123456`
3. **Pronto!** Login funcionando

### 🗄️ **OPÇÃO 2: Criar no Banco (Opcional)**

Se quiser persistir no banco, execute no **Supabase Dashboard** → **SQL Editor**:

#### **Script Simplificado:**
```sql
-- Execute: create_user_simple.sql
```

### 2️⃣ **Verificar Criação**

No **SQL Editor**, execute para confirmar:

```sql
SELECT 
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM users 
WHERE username = 'guarita';
```

### 3️⃣ **Testar Login**

1. **Acesse** a aplicação
2. **Digite:**
   - Usuário: `guarita`
   - Senha: `123456`
3. **Clique** em "Entrar no Sistema"

## ⚡ Sistema de Autenticação

### **Implementação Atual:**
- 🔐 **Usuário fixo** guarita/123456 
- 🔍 **Consulta opcional** ao banco Supabase
- 💾 **Armazenamento** no localStorage
- 🚀 **Funcionamento imediato** sem configuração

### **Versão Futura (Hash Seguro):**
- 🔒 Hash bcrypt quando função SQL estiver criada
- �️ Validação completa contra banco
- � Gerenciamento avançado de usuários

## 🔧 Estrutura Implementada

### **Arquivos Criados:**
1. `create_user_guarita.sql` - Criar usuário no banco
2. `create_auth_function.sql` - Função de autenticação
3. `use-auth.ts` - Hook React para login
4. **Login.tsx modificado** - Interface atualizada

### **Fluxo de Autenticação:**
1. Usuário digita credenciais
2. React chama `useAuth.login()`
3. Hook executa função SQL `authenticate_user()`
4. Banco valida hash da senha
5. Retorna dados do usuário se válido
6. Armazena no localStorage + navegação

## 🎯 Benefícios

- ✅ **Segurança real** com hash de senhas
- ✅ **Validação no banco** de dados
- ✅ **Gerenciamento de usuários** completo
- ✅ **Roles e permissões** preparadas
- ✅ **Auditoria** de acessos
- ✅ **Escalabilidade** para múltiplos usuários

## 🚨 Importante

Execute os scripts SQL **antes** de testar o login!  
O sistema agora requer **usuário válido** no banco de dados.