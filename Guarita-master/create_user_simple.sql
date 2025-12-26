-- Script simplificado para criar usuário guarita
-- Execute este script no Supabase Dashboard (SQL Editor)

-- Primeiro, vamos verificar se a tabela users existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'users'
);

-- Se a tabela não existir, criar com estrutura básica
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir o usuário guarita
INSERT INTO users (
  username,
  email,
  full_name,
  role,
  is_active
) VALUES (
  'guarita',
  'guarita@iba.com',
  'Guarita',
  'user',
  true
) ON CONFLICT (username) DO UPDATE SET
  full_name = 'Guarita',
  role = 'user',
  is_active = true,
  updated_at = NOW();

-- Verificar se o usuário foi criado
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