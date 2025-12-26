-- Função para autenticar usuário
-- Execute este script no Supabase Dashboard (SQL Editor)

-- Habilitar extensão para criptografia se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para autenticar usuário
CREATE OR REPLACE FUNCTION authenticate_user(
  input_username TEXT,
  input_password TEXT
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.is_active
  FROM users u
  WHERE u.username = input_username 
    AND u.password_hash = crypt(input_password, u.password_hash)
    AND u.is_active = true;
END;
$$;