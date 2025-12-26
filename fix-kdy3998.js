import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjnsbrkspgzioafvqfhe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY1NDksImV4cCI6MjA3Nzg0MjU0OX0.J3b9opzn066qv2jqWXBtSXugAr30D0xNQM0YuG846og';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixKDY3998() {
  try {
    console.log('🔧 Verificando status atual do KDY3998...');
    
    // Buscar o registro do KDY3998
    const { data: kdy3998, error } = await supabase
      .from('loading_records')
      .select('*')
      .eq('plate', 'KDY3998')
      .single();
      
    if (error) {
      console.error('❌ Erro ao buscar KDY3998:', error);
      return;
    }
    
    console.log('📊 Status atual do KDY3998:');
    console.log(`  - Status: ${kdy3998.status}`);
    console.log(`  - Entry Date: ${kdy3998.entry_date}`);
    console.log(`  - Loaded At: ${kdy3998.loaded_at}`);
    console.log(`  - Updated At: ${kdy3998.updated_at}`);
    
    if (kdy3998.status === 'carregado') {
      // Se foi carregado hoje (considerando que acabamos de marcar), atualiza loaded_at para agora
      const agora = new Date().toISOString();
      
      console.log(`🔧 Atualizando loaded_at do KDY3998 para AGORA: ${agora}`);
      
      const { error: updateError } = await supabase
        .from('loading_records')
        .update({ 
          loaded_at: agora 
        })
        .eq('plate', 'KDY3998');
        
      if (updateError) {
        console.error('❌ Erro ao atualizar KDY3998:', updateError);
      } else {
        console.log('✅ KDY3998 corrigido! Agora loaded_at = HOJE');
        
        // Verificar se agora aparece nos concluídos
        const hoje = new Date().toISOString().split('T')[0];
        console.log(`📅 Data de hoje: ${hoje}`);
        console.log(`📅 Nova data loaded_at: ${agora.split('T')[0]}`);
        console.log('✅ Agora deve aparecer nos concluídos!');
      }
    } else {
      console.log('ℹ️  KDY3998 não está com status carregado');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Função para corrigir TODOS os registros que foram carregados hoje mas têm loaded_at de outros dias
async function fixAllLoadedToday() {
  try {
    console.log('\n🔧 Verificando todos os registros carregados...');
    
    const { data: carregados, error } = await supabase
      .from('loading_records')
      .select('*')
      .eq('status', 'carregado');
      
    if (error) {
      console.error('❌ Erro ao buscar carregados:', error);
      return;
    }
    
    const hoje = new Date().toISOString().split('T')[0];
    console.log(`📅 Data de hoje: ${hoje}`);
    
    for (const registro of carregados) {
      const loadedDate = registro.loaded_at ? new Date(registro.loaded_at).toISOString().split('T')[0] : null;
      
      console.log(`\n📋 Placa ${registro.plate}:`);
      console.log(`  - Status: ${registro.status}`);
      console.log(`  - Entry Date: ${registro.entry_date}`);  
      console.log(`  - Loaded At: ${registro.loaded_at} (data: ${loadedDate})`);
      
      // Se loaded_at não é de hoje, mas foi atualizado recentemente (última hora), 
      // provavelmente foi carregado hoje
      if (loadedDate !== hoje && registro.updated_at) {
        const updateTime = new Date(registro.updated_at);
        const agora = new Date();
        const diferencaHoras = (agora - updateTime) / (1000 * 60 * 60);
        
        console.log(`  - Updated At: ${registro.updated_at} (${diferencaHoras.toFixed(1)}h atrás)`);
        
        if (diferencaHoras < 2) { // Se foi atualizado nas últimas 2 horas
          console.log(`  ⚠️  Provável carregamento de hoje! Corrigindo...`);
          
          const { error: updateError } = await supabase
            .from('loading_records')
            .update({ 
              loaded_at: new Date().toISOString()
            })
            .eq('id', registro.id);
            
          if (updateError) {
            console.error(`  ❌ Erro ao corrigir ${registro.plate}:`, updateError);
          } else {
            console.log(`  ✅ ${registro.plate} corrigido!`);
          }
        } else {
          console.log(`  ℹ️  Não foi carregado hoje (${diferencaHoras.toFixed(1)}h atrás)`);
        }
      } else if (loadedDate === hoje) {
        console.log(`  ✅ Já está correto (loaded_at = hoje)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar as correções
console.log('🚀 Iniciando correções...');
await fixKDY3998();
await fixAllLoadedToday();
console.log('🎉 Correções concluídas!');