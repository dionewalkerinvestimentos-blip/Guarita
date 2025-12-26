import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjnsbrkspgzioafvqfhe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY1NDksImV4cCI6MjA3Nzg0MjU0OX0.J3b9opzn066qv2jqWXBtSXugAr30D0xNQM0YuG846og';

const supabase = createClient(supabaseUrl, supabaseKey);

async function corrigirRTP9C62() {
  try {
    console.log('🔧 Corrigindo RTP9C62 - foi carregado ONTEM, não hoje...');
    
    // Buscar dados do RTP9C62
    const { data: rtp, error } = await supabase
      .from('loading_records')
      .select('*')
      .eq('plate', 'RTP9C62')
      .single();
      
    if (error) {
      console.error('❌ Erro ao buscar RTP9C62:', error);
      return;
    }
    
    console.log('📊 Dados atuais do RTP9C62:');
    console.log(`  - Entry Date: ${rtp.entry_date}`);
    console.log(`  - Created At: ${rtp.created_at}`);  
    console.log(`  - Updated At: ${rtp.updated_at}`);
    console.log(`  - Loaded At: ${rtp.loaded_at} (INCORRETO)`);
    
    // RTP9C62 foi criado em 06/11, então foi carregado ontem
    // Vamos corrigir o loaded_at para ontem baseado no created_at
    const dataCarregamento = new Date(rtp.created_at);
    dataCarregamento.setHours(14, 0, 0, 0); // 14:00 de ontem como aproximação
    
    const loadedAtCorreto = dataCarregamento.toISOString();
    
    console.log(`🔧 Corrigindo loaded_at para: ${loadedAtCorreto}`);
    
    const { error: updateError } = await supabase
      .from('loading_records')
      .update({ 
        loaded_at: loadedAtCorreto
      })
      .eq('plate', 'RTP9C62');
      
    if (updateError) {
      console.error('❌ Erro ao corrigir:', updateError);
    } else {
      console.log('✅ RTP9C62 corrigido!');
      console.log('📅 Agora loaded_at = 06/11 (ontem)');
      console.log('✅ Não deve mais aparecer nos concluídos de hoje');
    }
    
    // Verificar todos os registros carregados para confirmar quais são de hoje
    const { data: todosCarregados } = await supabase
      .from('loading_records')
      .select('plate, entry_date, loaded_at, status, created_at')
      .eq('status', 'carregado')
      .order('loaded_at', { ascending: false });
      
    const hoje = new Date().toLocaleDateString('sv-SE');
    
    console.log('\n📋 Status final - Registros carregados:');
    console.log(`📅 Hoje: ${hoje}`);
    
    let concluidosHoje = 0;
    todosCarregados.forEach(r => {
      const loadedDate = new Date(r.loaded_at).toLocaleDateString('sv-SE');
      const isHoje = loadedDate === hoje;
      
      console.log(`  - ${r.plate}: loaded_at=${loadedDate} ${isHoje ? '✅ CONCLUÍDO HOJE' : '❌ NÃO É HOJE'}`);
      
      if (isHoje) concluidosHoje++;
    });
    
    console.log(`\n📊 RESULTADO: ${concluidosHoje} registros devem aparecer nos concluídos de hoje`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

corrigirRTP9C62();