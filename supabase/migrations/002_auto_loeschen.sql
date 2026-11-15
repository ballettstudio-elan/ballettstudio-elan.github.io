-- =====================================================================
-- Автоудаление старых заявок: каждую ночь удаляются заявки старше 6 месяцев.
-- Срок должен совпадать с текстом на странице Datenschutz
-- (src/data/rechtliches.js → loeschfrist).
--
-- Как запустить: Supabase → SQL Editor → вставить весь файл → Run.
-- =====================================================================

create extension if not exists pg_cron;

-- Если задание уже есть – сначала убрать (чтобы можно было запускать повторно)
select cron.unschedule(jobid) from cron.job where jobname = 'anfragen-loeschen';

-- Каждый день в 03:00 UTC
select cron.schedule(
  'anfragen-loeschen',
  '0 3 * * *',
  $$ delete from public.anfragen where created_at < now() - interval '6 months' $$
);

-- Проверка: должна быть одна строка с заданием
select jobname, schedule, active from cron.job where jobname = 'anfragen-loeschen';
