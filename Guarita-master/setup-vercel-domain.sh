#!/bin/bash
# Script para configurar o domínio Vercel correto
# Execute este script para garantir que o domínio seja sempre o mesmo

echo "🚀 Configurando domínio Vercel..."

# Instalar Vercel CLI se não estiver instalado
npm install -g vercel

# Fazer login no Vercel (será solicitado)
vercel login

# Configurar o projeto com o nome correto
vercel --prod --confirm

# Remover domínios extras (opcional)
echo "📝 Para remover domínios extras:"
echo "1. Acesse https://vercel.com/dashboard"
echo "2. Vá em seu projeto > Settings > Domains"
echo "3. Remova domínios extras, mantenha apenas: guaritaibasantaluzia.vercel.app"

echo "✅ Configuração concluída!"
echo "🌐 Seu domínio: https://guaritaibasantaluzia.vercel.app"