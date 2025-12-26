import { createClient } from '@supabase/supabase-js'

// TESTE DE CONEXÃO - Substitua pelas suas credenciais reais do Supabase
const supabaseUrl = 'https://wjnsbrkspgzioafvqfhe.supabase.co'

// Cole aqui a chave anon correta do seu painel Supabase
const supabaseAnonKey = 'COLE_AQUI_SUA_CHAVE_ANON_CORRETA'

export const testSupabaseConnection = async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    const { data, error } = await supabase
      .from('producers')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error)
      return false
    }
    
    console.log('✅ Conexão funcionando!', data)
    return true
  } catch (err) {
    console.error('❌ Erro na conexão:', err)
    return false
  }
}

// Para testar, chame esta função no console do navegador:
// testSupabaseConnection()