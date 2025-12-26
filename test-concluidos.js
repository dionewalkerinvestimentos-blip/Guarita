import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjnsbrkspgzioafvqfhe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY1NDksImV4cCI6MjA3Nzg0MjU0OX0.J3b9opzn066qv2jqWXBtSXugAr30D0xNQM0YuG846og';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConcluidos() {
  try {
    console.log('🧪 Testando lógica de concluídos...');
    
    // Buscar todos os carregamentos
    const { data: loadingRecords, error } = await supabase
      .from('loading_records')
      .select('*')
      .eq('status', 'carregado');
      
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
    console.log(`📅 Hoje: ${today}`);
    
    console.log('\n📋 Registros carregados:');
    
    const concluidos = loadingRecords.filter(l => {
      if (!l.loaded_at) return false;
      
      const loadedDate = new Date(l.loaded_at).toLocaleDateString('sv-SE');
      console.log(`  - ${l.plate}: loaded_at=${l.loaded_at} -> data=${loadedDate} (hoje=${loadedDate === today ? 'SIM' : 'NÃO'})`);
      
      return loadedDate === today;
    });
    
    console.log(`\n📊 Resultado: ${concluidos.length} registros devem aparecer nos concluídos:`);
    concluidos.forEach(l => {
      console.log(`  ✅ ${l.plate} (${l.product})`);
    });
    
    // Testar especificamente o KDY3998
    const kdy3998 = loadingRecords.find(l => l.plate === 'KDY3998');
    if (kdy3998) {
      const loadedDate = new Date(kdy3998.loaded_at).toLocaleDateString('sv-SE');
      console.log(`\n🔍 KDY3998 específico:`);
      console.log(`  - Status: ${kdy3998.status}`);
      console.log(`  - Loaded At: ${kdy3998.loaded_at}`);
      console.log(`  - Data: ${loadedDate}`);
      console.log(`  - Deve aparecer: ${loadedDate === today ? '✅ SIM' : '❌ NÃO'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConcluidos();