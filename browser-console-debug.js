(async () => {
  console.log('--- Iniciando Diagnóstico Detalhado de Carregamentos ---');
  
  // Funções de utilidade de data (replicadas para garantir que o script funcione independentemente do bundle)
  const getTodayLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const convertIsoToLocalDateString = (isoString) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return toLocalDateString(date);
    } catch (e) {
      return null;
    }
  };

  // Configuração do cliente Supabase (usando as variáveis de ambiente do seu projeto)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjnsbrkspgzioafvqfhe.supabase.co';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NDE0MjMsImV4cCI6MjA0NjMxNzQyM30.Cw8bs3aTBe6Qmr-0flDIR-dnx89C1LC0rJR_YCjIKP0';
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: records, error } = await supabase
    .from('loading_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar registros de carregamento do Supabase:', error);
    return;
  }

  const today = getTodayLocalDate();
  console.log(`\n📅 Data de hoje (local): ${today}`);
  console.log(`📊 Total de registros de carregamento no banco: ${records.length}`);

  const fila = [];
  const carregando = [];
  const concluidos = [];

  console.log('\n--- Detalhes de Cada Registro e Onde Deveria Estar ---');
  records.forEach(r => {
    const loadedDate = convertIsoToLocalDateString(r.loaded_at);
    const exitDate = convertIsoToLocalDateString(r.exit_date);

    let expectedCategory = 'Nenhuma';

    // Lógica para Fila
    if (r.status === 'fila' && !r.entry_date) {
      fila.push(r);
      expectedCategory = 'Fila';
    } 
    // Lógica para Carregando
    else if (!r.exit_date && (r.status === 'carregando' || r.status === 'carregado' || (!r.status && r.entry_date))) {
      carregando.push(r);
      expectedCategory = 'Carregando';
    }
    // Lógica para Concluídos (hoje)
    else if (
      (r.status === 'concluido' && r.exit_date && exitDate === today) ||
      (r.status === 'carregado' && r.loaded_at && loadedDate === today)
    ) {
      concluidos.push(r);
      expectedCategory = 'Concluídos (Hoje)';
    }

    console.log(`\n--- Placa: ${r.plate} ---`);
    console.log(`  ID: ${r.id}`);
    console.log(`  Status no DB: "${r.status}"`);
    console.log(`  Data de Marcação: ${r.date} ${r.time}`);
    console.log(`  Entry Date: ${r.entry_date} ${r.entry_time || ''}`);
    console.log(`  Exit Date: ${r.exit_date} ${r.exit_time || ''} (Local: ${exitDate})`);
    console.log(`  Loaded At: ${r.loaded_at} (Local: ${loadedDate})`);
    console.log(`  Criado em: ${r.created_at}`);
    console.log(`  Atualizado em: ${r.updated_at}`);
    console.log(`  -> Categoria Esperada (pela lógica do script): ${expectedCategory}`);
  });

  console.log('\n--- Resumo Final dos Cards (Pela Lógica do Script) ---');
  console.log(`✅ Fila: ${fila.length} registros`);
  console.log(`✅ Carregando: ${carregando.length} registros`);
  console.log(`✅ Concluídos (Hoje): ${concluidos.length} registros`);
  console.log('\n--- Fim do Diagnóstico Detalhado ---');
})();