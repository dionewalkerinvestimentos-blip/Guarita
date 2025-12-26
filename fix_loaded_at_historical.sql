-- Script para corrigir o campo 'loaded_at' para registros com status 'carregado'
-- que não possuem 'loaded_at' preenchido ou está incorreto.

-- ATENÇÃO: Faça um backup da sua tabela 'loading_records' antes de executar este script.
-- CREATE TABLE public.loading_records_backup AS SELECT * FROM public.loading_records;

-- 1. Atualizar 'loaded_at' para registros 'carregado' onde 'loaded_at' é NULL.
--    Usaremos 'updated_at' como uma estimativa razoável de quando o status foi alterado para 'carregado'.
UPDATE public.loading_records
SET loaded_at = updated_at
WHERE status = 'carregado'
  AND loaded_at IS NULL;

-- 2. Opcional: Para registros 'carregado' onde 'loaded_at' é anterior à 'entry_date' (o que seria ilógico),
--    podemos ajustar 'loaded_at' para ser igual a 'entry_date' ou 'updated_at'.
--    Vamos usar 'updated_at' para ser mais preciso com a última modificação de status.
UPDATE public.loading_records
SET loaded_at = updated_at
WHERE status = 'carregado'
  AND loaded_at < entry_date::timestamp with time zone; -- Compara timestamps

-- 3. Verificar os resultados da atualização (opcional, mas recomendado)
SELECT id, plate, status, entry_date, loaded_at, updated_at
FROM public.loading_records
WHERE status = 'carregado'
ORDER BY loaded_at DESC
LIMIT 10;

-- 4. Verificar registros 'concluido' para garantir que 'exit_date' e 'exit_time' estão preenchidos
SELECT id, plate, status, exit_date, exit_time
FROM public.loading_records
WHERE status = 'concluido'
ORDER BY exit_date DESC
LIMIT 10;

-- Mensagem de conclusão
RAISE NOTICE 'Correção do campo loaded_at para registros carregados concluída. Verifique os logs e a aplicação.';