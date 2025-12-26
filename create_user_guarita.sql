-- Inserir usuário guarita
-- Execute este script no Supabase Dashboard (SQL Editor)

INSERT INTO users (
  id,
  username,
  email,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  uuid_generate_v4(),
  'guarita',
  'guarita@iba.com',
  crypt('123456', gen_salt('bf')), -- Hash seguro da senha 123456
  'Guarita',
  'user',
  true
) ON CONFLICT (username) DO UPDATE SET
  password_hash = crypt('123456', gen_salt('bf')),
  full_name = 'Guarita',
  role = 'user',
  is_active = true;

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