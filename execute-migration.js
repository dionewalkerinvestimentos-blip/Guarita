#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lqxlpandozuisrvcjwsm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY não definida. Execute com:');
  console.error('SUPABASE_SERVICE_KEY="sua-chave" node execute-migration.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Iniciando migration...');
    console.log(`📍 URL: ${supabaseUrl}`);
    
    // Executar migration SQL
    const migrations = [
      `ALTER TABLE cotton_pull
       ADD COLUMN IF NOT EXISTS hora_retomada_puxe TIME,
       ADD COLUMN IF NOT EXISTS tempo_parado_minutos INTEGER DEFAULT 0,
       ADD COLUMN IF NOT EXISTS tempo_permanencia_liquido_minutos INTEGER DEFAULT 0;`,
      
      `CREATE INDEX IF NOT EXISTS idx_cotton_pull_parada_puxe 
       ON cotton_pull(parada_puxe) WHERE parada_puxe = true;`
    ];

    for (const sql of migrations) {
      console.log(`\n📝 Executando:\n${sql}`);
      const { error } = await supabase.rpc('execute_sql', { sql });
      
      if (error) {
        console.error(`❌ Erro: ${error.message}`);
        if (error.message.includes('42P16')) {
          console.log('ℹ️  Coluna pode já existir. Continuando...');
        } else {
          throw error;
        }
      } else {
        console.log('✅ Executado com sucesso');
      }
    }
    
    console.log('\n✅ Migration concluída!');
    console.log('\n📊 Verificando colunas:');
    
    const { data, error } = await supabase
      .from('cotton_pull')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Erro ao verificar: ${error.message}`);
    } else {
      if (data && data.length > 0) {
        const record = data[0];
        console.log('Colunas de retomada:', {
          hora_retomada_puxe: 'hora_retomada_puxe' in record ? '✅ Existe' : '❌ Não encontrada',
          tempo_parado_minutos: 'tempo_parado_minutos' in record ? '✅ Existe' : '❌ Não encontrada',
          tempo_permanencia_liquido_minutos: 'tempo_permanencia_liquido_minutos' in record ? '✅ Existe' : '❌ Não encontrada',
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro na migration:', error);
    process.exit(1);
  }
}

runMigration();
