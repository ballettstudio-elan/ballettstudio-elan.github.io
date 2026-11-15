-- =====================================================================
-- BalletStudio „Elan“ – Datenbank für Anfragen (Probestunde, Unterricht, Fragen)
--
-- КАК ПРИМЕНИТЬ: Supabase → SQL Editor → New query → вставить ВЕСЬ этот файл → Run.
-- Файл можно запускать повторно: он не удаляет существующие заявки.
--
-- Принцип безопасности:
--   * Посетители сайта (роль "anon") НЕ имеют доступа к таблице вообще.
--     Они могут только вызвать функцию public.anfrage_senden(...), которая
--     проверяет данные и сохраняет одну заявку.
--   * Читать, менять статус и удалять заявки может только пользователь,
--     который записан в таблицу public.admins (проверяется самой базой – RLS).
-- =====================================================================


-- ---------- 1. Администраторы ----------
-- Сюда добавляется user_id учётной записи мамы (см. README, раздел "Администратор").
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Вошедший пользователь может узнать только, является ли ОН САМ админом.
drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;


-- Вспомогательная проверка "текущий пользователь – админ?"
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- ---------- 2. Таблица заявок ----------
create table if not exists public.anfragen (
  id                 uuid primary key default gen_random_uuid(),
  -- Короткий номер для посетителя, например EL-261021-7F3A
  code               text not null unique,
  -- Случайный ключ формы: защищает от двойной отправки (повторное нажатие = та же заявка)
  client_token       uuid not null unique,

  typ                text not null check (typ in ('probestunde', 'unterricht', 'frage')),
  name               text not null check (char_length(name) between 2 and 100),
  email              text check (email is null or char_length(email) <= 200),
  telefon            text check (telefon is null or char_length(telefon) <= 40),
  altersgruppe       text check (altersgruppe is null or char_length(altersgruppe) <= 100),
  alter_kind         smallint check (alter_kind is null or alter_kind between 2 and 99),
  wunschdatum        date,
  wunschzeit         text check (wunschzeit is null or char_length(wunschzeit) <= 100),
  nachricht          text check (nachricht is null or char_length(nachricht) <= 2000),

  status             text not null default 'neu'
                     check (status in ('neu', 'in_bearbeitung', 'bestaetigt', 'abgelehnt', 'abgeschlossen')),

  datenschutz_am     timestamptz not null,           -- когда посетитель подтвердил Datenschutz
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint kontakt_vorhanden check (email is not null or telefon is not null)
);

create index if not exists anfragen_created_at_idx on public.anfragen (created_at desc);
create index if not exists anfragen_status_idx     on public.anfragen (status);


-- updated_at обновляется автоматически при любом изменении
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists anfragen_set_updated_at on public.anfragen;
create trigger anfragen_set_updated_at
  before update on public.anfragen
  for each row execute function public.set_updated_at();


-- ---------- 3. Права доступа и RLS ----------
alter table public.anfragen enable row level security;

-- Никаких прямых прав у посетителей. Админу: читать, менять ТОЛЬКО статус, удалять.
revoke all on public.anfragen from anon, authenticated;
grant select, delete   on public.anfragen to authenticated;
grant update (status)  on public.anfragen to authenticated;

drop policy if exists "anfragen_admin_select" on public.anfragen;
create policy "anfragen_admin_select" on public.anfragen
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "anfragen_admin_update" on public.anfragen;
create policy "anfragen_admin_update" on public.anfragen
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "anfragen_admin_delete" on public.anfragen;
create policy "anfragen_admin_delete" on public.anfragen
  for delete to authenticated
  using ((select public.is_admin()));

-- INSERT-политики нет намеренно: новые заявки создаются только функцией ниже.


-- ---------- 4. Функция отправки заявки (единственный путь для посетителей) ----------
-- Ошибки возвращаются как короткие коды (например 'E_EMAIL'); сайт переводит их
-- в понятный немецкий текст (src/lib/anfrage-fehler.js).
create or replace function public.anfrage_senden(
  p_client_token  uuid,
  p_typ           text,
  p_name          text,
  p_email         text,
  p_telefon       text,
  p_altersgruppe  text,
  p_alter_kind    integer,
  p_wunschdatum   date,
  p_wunschzeit    text,
  p_nachricht     text,
  p_datenschutz   boolean,
  p_website       text,      -- скрытое поле-ловушка для спам-ботов: должно быть пустым
  p_ausfuellzeit  integer    -- сколько миллисекунд форма была открыта
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name      text := nullif(btrim(coalesce(p_name, '')), '');
  v_email     text := lower(nullif(btrim(coalesce(p_email, '')), ''));
  v_telefon   text := nullif(btrim(coalesce(p_telefon, '')), '');
  v_gruppe    text := nullif(btrim(coalesce(p_altersgruppe, '')), '');
  v_zeit      text := nullif(btrim(coalesce(p_wunschzeit, '')), '');
  v_nachricht text := nullif(btrim(coalesce(p_nachricht, '')), '');
  v_code      text;
  v_vorhanden text;
begin
  -- Повторная отправка той же формы → возвращаем уже сохранённый номер
  select a.code into v_vorhanden from public.anfragen a where a.client_token = p_client_token;
  if v_vorhanden is not null then
    return v_vorhanden;
  end if;

  -- Защита от ботов
  if p_client_token is null then raise exception 'E_UNGUELTIG'; end if;
  if coalesce(btrim(p_website), '') <> '' then raise exception 'E_SPAM'; end if;
  if p_ausfuellzeit is null or p_ausfuellzeit < 3000 then raise exception 'E_ZU_SCHNELL'; end if;

  -- Проверка полей
  if p_typ is null or p_typ not in ('probestunde', 'unterricht', 'frage') then raise exception 'E_TYP'; end if;
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 100 then raise exception 'E_NAME'; end if;
  if v_email is null and v_telefon is null then raise exception 'E_KONTAKT'; end if;
  if v_email is not null and (char_length(v_email) > 200
      or v_email !~ '^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]{2,}$') then raise exception 'E_EMAIL'; end if;
  if v_telefon is not null and v_telefon !~ '^\+?[0-9 ()/\-]{6,30}$' then raise exception 'E_TELEFON'; end if;
  if v_gruppe is not null and char_length(v_gruppe) > 100 then raise exception 'E_GRUPPE'; end if;
  if p_alter_kind is not null and (p_alter_kind < 2 or p_alter_kind > 99) then raise exception 'E_ALTER'; end if;
  if p_wunschdatum is not null and (p_wunschdatum < current_date or p_wunschdatum > current_date + 365) then
    raise exception 'E_DATUM';
  end if;
  if v_zeit is not null and char_length(v_zeit) > 100 then raise exception 'E_ZEIT'; end if;
  if v_nachricht is not null and char_length(v_nachricht) > 2000 then raise exception 'E_NACHRICHT'; end if;
  if p_typ = 'frage' and v_nachricht is null then raise exception 'E_NACHRICHT_FEHLT'; end if;
  if p_datenschutz is distinct from true then raise exception 'E_DATENSCHUTZ'; end if;

  -- Ограничение частоты: не больше 3 заявок с теми же контактами за 10 минут
  -- и не больше 30 заявок всего за 10 минут (защита от массовой рассылки).
  if (select count(*) from public.anfragen a
        where a.created_at > now() - interval '10 minutes'
          and ((v_email is not null and a.email = v_email)
            or (v_telefon is not null and a.telefon = v_telefon))) >= 3
     or (select count(*) from public.anfragen a
        where a.created_at > now() - interval '10 minutes') >= 30
  then
    raise exception 'E_LIMIT';
  end if;

  -- Уникальный короткий номер
  loop
    v_code := 'EL-' || to_char(now() at time zone 'Europe/Berlin', 'YYMMDD') || '-'
              || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    exit when not exists (select 1 from public.anfragen a where a.code = v_code);
  end loop;

  insert into public.anfragen (
    code, client_token, typ, name, email, telefon, altersgruppe, alter_kind,
    wunschdatum, wunschzeit, nachricht, datenschutz_am
  ) values (
    v_code, p_client_token, p_typ, v_name, v_email, v_telefon, v_gruppe, p_alter_kind,
    p_wunschdatum, v_zeit, v_nachricht, now()
  );

  return v_code;
end;
$$;

revoke all on function public.anfrage_senden(uuid, text, text, text, text, text, integer, date, text, text, boolean, text, integer) from public;
grant execute on function public.anfrage_senden(uuid, text, text, text, text, text, integer, date, text, text, boolean, text, integer) to anon, authenticated;


-- ---------- 5. Realtime: новые заявки сразу появляются в админ-панели ----------
-- (Realtime соблюдает RLS: события получает только админ.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'anfragen'
  ) then
    alter publication supabase_realtime add table public.anfragen;
  end if;
end;
$$;
