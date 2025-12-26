# Script PowerShell para corrigir configuração do Vercel
# Execute este script no PowerShell como Administrador

Write-Host "🚀 Corrigindo configuração do Vercel..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale primeiro!" -ForegroundColor Red
    exit
}

# Instalar Vercel CLI
Write-Host "📦 Instalando Vercel CLI..." -ForegroundColor Yellow
npm install -g vercel

# Fazer logout da conta atual
Write-Host "🔓 Fazendo logout da conta atual..." -ForegroundColor Yellow
vercel logout

Write-Host ""
Write-Host "🔑 Agora você precisa fazer login com a conta correta:" -ForegroundColor Cyan
Write-Host "   Email: desenvolvedordionewalker..." -ForegroundColor White
Write-Host ""

# Fazer login
vercel login

# Navegar para o diretório do projeto
Set-Location "C:\Users\dione.walker\dyad-apps\Guarita"

Write-Host ""
Write-Host "📁 Configurando projeto no Vercel..." -ForegroundColor Cyan
Write-Host "   Quando perguntado:" -ForegroundColor Yellow
Write-Host "   - Set up and deploy? → Y" -ForegroundColor White
Write-Host "   - Which scope? → desenvolvedordionewalker..." -ForegroundColor White
Write-Host "   - Link to existing project? → N" -ForegroundColor White  
Write-Host "   - Project name? → guaritaibasantaluzia" -ForegroundColor White
Write-Host "   - Directory? → ./" -ForegroundColor White
Write-Host ""

# Configurar projeto
vercel --prod

Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host "🌐 Seu domínio: https://guaritaibasantaluzia.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Verificando configuração atual..." -ForegroundColor Yellow

# Verificar conta atual
Write-Host "👤 Conta ativa:" -ForegroundColor White
vercel whoami

# Listar projetos
Write-Host ""
Write-Host "📋 Projetos na conta:" -ForegroundColor White
vercel ls

Write-Host ""
Write-Host "🎉 Pronto! Verifique https://guaritaibasantaluzia.vercel.app" -ForegroundColor Green