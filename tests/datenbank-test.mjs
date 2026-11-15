// Проверка базы данных и защиты (RLS) без интернета и без Supabase.
// Запуск:  npm run test:db
// Используется PGlite – настоящий PostgreSQL внутри Node. Роли и auth.uid()
// имитируют Supabase. Это не заменяет проверку в настоящем проекте Supabase.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const migration = readFileSync(process.argv[2], 'utf8');
const db = new PGlite();
let ok = 0, fail = 0;
const check = (name, cond, info = '') => { cond ? ok++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  -> ' + info : ''}`); };

// Имитация окружения Supabase
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  -- как в Supabase: по умолчанию anon/authenticated получают все права на новые таблицы и функции
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  create publication supabase_realtime;
  insert into auth.users values ('11111111-1111-1111-1111-111111111111','mama@test.de'),
                                ('22222222-2222-2222-2222-222222222222','fremd@test.de');
`);
await db.exec(migration);
await db.exec(migration); // повторный запуск не должен ломаться
check('Migration läuft (auch zweimal)', true);
await db.exec(`insert into public.admins (user_id) values ('11111111-1111-1111-1111-111111111111')`);

async function als(rolle, sub, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false); set role ${rolle};`);
  try { return { rows: (await db.query(sql, params)).rows }; }
  catch (e) { return { error: e.message }; }
  finally { await db.exec('reset role'); }
}
const senden = (o = {}) => {
  const p = { token: crypto.randomUUID(), typ: 'probestunde', name: 'Anna Muster', email: 'anna@test.de', telefon: null,
    gruppe: null, alter: 5, datum: null, zeit: 'nachmittags', nachricht: 'Hallo', ds: true, website: '', ms: 5000, ...o };
  return als('anon', null, `select public.anfrage_senden($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) as code`,
    [p.token, p.typ, p.name, p.email, p.telefon, p.gruppe, p.alter, p.datum, p.zeit, p.nachricht, p.ds, p.website, p.ms]);
};

// ---- Посетитель (anon) ----
let r = await senden();
check('Gültige Anfrage wird gespeichert', r.rows?.[0]?.code?.startsWith('EL-'), r.rows?.[0]?.code ?? r.error);
const token = crypto.randomUUID();
const a1 = await senden({ token, email: 'doppelt@test.de' });
const a2 = await senden({ token, email: 'doppelt@test.de' });
check('Doppelte Absendung → gleiche Nummer, kein Duplikat', a1.rows[0].code === a2.rows[0].code);

const fehler = async (name, o, code) => { const x = await senden(o); check(name, x.error?.includes(code), x.error ?? 'kein Fehler!'); };
await fehler('Honeypot gefüllt → abgelehnt', { website: 'http://spam' }, 'E_SPAM');
await fehler('Zu schnell ausgefüllt → abgelehnt', { ms: 500 }, 'E_ZU_SCHNELL');
await fehler('Kein Name → abgelehnt', { name: ' ' }, 'E_NAME');
await fehler('Weder E-Mail noch Telefon → abgelehnt', { email: '', telefon: '' }, 'E_KONTAKT');
await fehler('Falsche E-Mail → abgelehnt', { email: 'kaputt@' }, 'E_EMAIL');
await fehler('Falsches Telefon → abgelehnt', { email: null, telefon: 'abc' }, 'E_TELEFON');
await fehler('Datenschutz nicht bestätigt → abgelehnt', { ds: false }, 'E_DATENSCHUTZ');
await fehler('Unbekannter Typ → abgelehnt', { typ: 'admin' }, 'E_TYP');
await fehler('Datum in Vergangenheit → abgelehnt', { datum: '2020-01-01' }, 'E_DATUM');
await fehler('Frage ohne Text → abgelehnt', { typ: 'frage', nachricht: '' }, 'E_NACHRICHT_FEHLT');
await fehler('Zu lange Nachricht → abgelehnt', { nachricht: 'x'.repeat(2001) }, 'E_NACHRICHT');
r = await senden({ telefon: '+49 (0)171 123-45/6', email: null });
check('Telefon ohne E-Mail ist erlaubt', !!r.rows?.[0]?.code, r.error);
r = await senden({ name: '<script>alert(1)</script>' });
check('HTML im Namen wird nur als Text gespeichert', !!r.rows?.[0]?.code, r.error);

for (let i = 0; i < 3; i++) await senden({ email: 'flut@test.de' });
await fehler('Mehr als 3 Anfragen in 10 Min. mit gleicher E-Mail → Limit', { email: 'flut@test.de' }, 'E_LIMIT');

r = await als('anon', null, 'select * from public.anfragen');
check('Besucher kann Anfragen NICHT lesen', !!r.error, r.error);
r = await als('anon', null, `insert into public.anfragen (code, client_token, typ, name, email, datenschutz_am) values ('X', gen_random_uuid(), 'frage', 'Hack', 'h@h.de', now())`);
check('Besucher kann NICHT direkt einfügen', !!r.error, r.error);
r = await als('anon', null, `update public.anfragen set status = 'bestaetigt'`);
check('Besucher kann Status NICHT ändern', !!r.error, r.error);
r = await als('anon', null, `delete from public.anfragen`);
check('Besucher kann NICHT löschen', !!r.error, r.error);
r = await als('anon', null, 'select * from public.admins');
check('Besucher kann Admin-Liste NICHT lesen', !!r.error, r.error);

// ---- Вошедший, но НЕ админ ----
const fremd = '22222222-2222-2222-2222-222222222222';
r = await als('authenticated', fremd, 'select * from public.anfragen');
check('Angemeldeter Nicht-Admin sieht 0 Anfragen', r.rows?.length === 0, r.error ?? `${r.rows?.length} Zeilen`);
r = await als('authenticated', fremd, `update public.anfragen set status = 'abgelehnt' returning id`);
check('Nicht-Admin kann Status NICHT ändern', r.error || r.rows.length === 0);
r = await als('authenticated', fremd, `delete from public.anfragen returning id`);
check('Nicht-Admin kann NICHT löschen', r.error || r.rows.length === 0);
r = await als('authenticated', fremd, `insert into public.admins values ('${fremd}')`);
check('Nicht-Admin kann sich NICHT selbst zum Admin machen', !!r.error, r.error);

// ---- Админ ----
const mama = '11111111-1111-1111-1111-111111111111';
r = await als('authenticated', mama, 'select id, status, created_at, updated_at from public.anfragen order by created_at');
const anzahl = r.rows?.length;
check('Admin sieht alle Anfragen', anzahl > 0, `${anzahl} Anfragen`);
const id = r.rows[0].id;
r = await als('authenticated', mama, `select * from public.admins`);
check('Admin sieht nur eigenen Admin-Eintrag', r.rows?.length === 1);
await new Promise((res) => setTimeout(res, 20));
r = await als('authenticated', mama, `update public.anfragen set status = 'bestaetigt' where id = $1 returning status, updated_at > created_at as geaendert`, [id]);
check('Admin kann Status auf „bestätigt“ setzen', r.rows?.[0]?.status === 'bestaetigt', r.error);
check('updated_at wird automatisch aktualisiert', r.rows?.[0]?.geaendert === true);
r = await als('authenticated', mama, `select status from public.anfragen where id = $1`, [id]);
check('Status bleibt gespeichert (neue Abfrage)', r.rows?.[0]?.status === 'bestaetigt');
r = await als('authenticated', mama, `update public.anfragen set status = 'quatsch' where id = $1`, [id]);
check('Ungültiger Status wird abgelehnt', !!r.error, r.error);
r = await als('authenticated', mama, `update public.anfragen set name = 'Geändert' where id = $1`, [id]);
check('Admin kann nur den Status ändern, keine anderen Felder', !!r.error, r.error);
r = await als('authenticated', mama, `delete from public.anfragen where id = $1 returning id`, [id]);
check('Admin kann Anfrage löschen', r.rows?.length === 1, r.error);
r = await als('authenticated', mama, `select count(*)::int as n from public.anfragen`);
check('Gelöschte Anfrage ist weg', r.rows[0].n === anzahl - 1);

r = await db.query(`select count(*)::int n from pg_publication_tables where pubname='supabase_realtime' and tablename='anfragen'`);
check('Tabelle ist für Realtime freigegeben', r.rows[0].n === 1);

console.log(`\n${ok} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
