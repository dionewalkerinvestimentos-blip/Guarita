import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjnsbrkspgzioafvqfhe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY1NDksImV4cCI6MjA3Nzg0MjU0OX0.J3b9opzn066qv2jqWXBtSXugAr30D0xNQM0YuG846og';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLoadedAt() {
  try {
    console.log('🔧 Iniciando correção do loaded_at para registros carregados...');
    
    // Primeiro, vamos ver quantos registros temos com status carregado
    const { data: carregados, error: errorCarregados } = await supabase
      .from('loading_records')
      .select('*')
      .eq('status', 'carregado');
      
    if (errorCarregados) {
      console.error('❌ Erro ao buscar carregados:', errorCarregados);
      return;
    }
    
    console.log(`📊 Total de registros com status 'carregado': ${carregados.length}`);
    
    // Listar registros sem loaded_at
    const semLoadedAt = carregados.filter(r => !r.loaded_at);
    console.log(`⚠️  Registros sem loaded_at: ${semLoadedAt.length}`);
    
    if (semLoadedAt.length > 0) {
      console.log('\n📋 Registros que serão corrigidos:');
      semLoadedAt.forEach(r => {
        console.log(`  - Placa: ${r.plate}, Data: ${r.entry_date}, Hora: ${r.entry_time || 'N/A'}`);
      });
      
      // Corrigir cada registro
      for (const registro of semLoadedAt) {
        let loadedAt;
        
        if (registro.entry_date && registro.entry_time) {
          // Combina data e hora
          loadedAt = new Date(`${registro.entry_date}T${registro.entry_time}`).toISOString();
        } else if (registro.entry_date) {
          // Usa apenas a data às 12:00
          loadedAt = new Date(`${registro.entry_date}T12:00:00`).toISOString();
        } else {
          // Usa created_at ou agora
          loadedAt = registro.created_at || new Date().toISOString();
        }
        
        console.log(`🔧 Corrigindo placa ${registro.plate}: loaded_at = ${loadedAt}`);
        
        const { error } = await supabase
          .from('loading_records')
          .update({ loaded_at: loadedAt })
          .eq('id', registro.id);
          
        if (error) {
          console.error(`❌ Erro ao corrigir ${registro.plate}:`, error);
        } else {
          console.log(`✅ Corrigido: ${registro.plate}`);
        }
      }
    } else {
      console.log('✅ Todos os registros carregados já têm loaded_at preenchido!');
    }
    
    // Verificação final
    const { data: verificacao } = await supabase
      .from('loading_records')
      .select('plate, status, loaded_at, entry_date')
      .eq('status', 'carregado')
      .order('loaded_at', { ascending: false });
      
    console.log('\n📊 Status final dos registros carregados:');
    verificacao.slice(0, 10).forEach(r => {
      console.log(`  - ${r.plate}: loaded_at = ${r.loaded_at ? new Date(r.loaded_at).toLocaleString('pt-BR') : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixLoadedAt();