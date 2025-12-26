# Guarita - Sistema de Gestão Agrícola 🚜

Sistema completo de gestão para controle de veículos, equipamentos, algodão e registros pluviométricos.

## 🚀 **Últimas Atualizações - v2.5**

✅ **Sistema de Saída Externa implementado**
- Novo tipo "Saída Externa" para colaboradores
- Registro de saída antes da entrada
- Botão especial para registrar retorno
- Interface adaptável com indicadores visuais

✅ **Correções de Banco de Dados**
- Fix do erro 400 ao inserir veículos
- Correção do problema material_receipts
- Script SQL para recriar tabela com permissões

✅ **Novos Relatórios WhatsApp**
- Seção "Saída de Equipamentos" no resumo diário
- Relatório completo "Puxe de Rolos" detalhado
- Análise por placa/motorista com tempo de permanência
- Botões para copiar e enviar via WhatsApp

## 🔧 **Configuração Concluída**

✅ **Banco de dados Supabase configurado**  
✅ **Frontend conectado ao banco**  
✅ **Dados mock removidos**  
✅ **Interface integrada com dados reais**

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/29bde026-507f-46c1-b6e4-8a781c638345) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/29bde026-507f-46c1-b6e4-8a781c638345) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Testar localmente (Windows)

1. Copie o arquivo de exemplo e preencha suas credenciais Supabase (opcional):

```powershell
copy .env.local.example .env.local
# Edite .env.local e cole seu VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

2. Inicie o projeto usando o script local (carrega `.env.local` automaticamente):

```powershell
npm run dev:local
```

Observações:
- Se não quiser usar Supabase real, deixe as variáveis em branco; o cliente usa valores padrão (útil para testes rápidos).
- O script `scripts/start-local.ps1` apenas carrega variáveis de `.env.local` na sessão PowerShell e executa `npm run dev`.
- Para macOS/Linux, você pode definir as variáveis de ambiente normalmente e rodar `npm run dev`.
