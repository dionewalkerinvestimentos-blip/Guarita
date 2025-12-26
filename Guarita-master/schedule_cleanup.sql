-- Agendamento da Limpeza Automática
-- Execute este comando DEPOIS de:
-- 1. Executar setup_history_CLEAN.sql
-- 2. Habilitar a extensão pg_cron (Database > Extensions)

SELECT cron.schedule(
  'cleanup-completed-loadings',
  '0 0 * * *',
  $$SELECT archive_completed_loadings();$$
);

-- Para verificar se foi criado:
-- SELECT * FROM cron.job;

-- Para remover (se necessário):
-- SELECT cron.unschedule('cleanup-completed-loadings');
