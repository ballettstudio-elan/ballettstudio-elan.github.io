// =====================================================================
// Логика админ-панели.
// Важно: эта страница НЕ является защитой сама по себе. Даже если кто-то
// откроет её без пароля, база данных (RLS) не отдаст ему ни одной заявки.
// Все тексты выводятся через textContent – защита от вредного кода в заявках.
// =====================================================================
import { supabase, supabaseKonfiguriert } from '../lib/supabase.js';
import { statusListe, anfrageTypen } from '../data/unterricht.js';

const $ = (sel) => document.querySelector(sel);
const statusLabel = Object.fromEntries(statusListe.map((s) => [s.value, s.label]));
const typLabel = { ...Object.fromEntries(anfrageTypen.map((t) => [t.value, t.label])), frage: 'Frage' };
const POLL_MS = 60_000;   // запасное обновление раз в минуту

let anfragen = [];
let filter = 'alle';
let suche = '';
let aktuelleId = null;
let kanal = null;
let pollTimer = null;
let bekannteIds = null;

// ---------- Вспомогательные функции ----------
function zeige(view) {
  document.querySelectorAll('[data-view]').forEach((el) => { el.hidden = el.dataset.view !== view; });
}
function el(tag, props = {}, ...kinder) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.includes('-')) node.setAttribute(k, v);
    else node[k] = v;
  });
  kinder.flat().forEach((c) => c != null && node.append(c));
  return node;
}
function toast(text, art = '') {
  const t = el('div', { class: `toast ${art}`, text });
  $('[data-toasts]').append(t);
  setTimeout(() => t.remove(), art === 'new' ? 9000 : 4500);
}
const fmtDatumZeit = (iso) =>
  new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(iso));
const fmtDatum = (d) =>
  new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${d}T00:00:00Z`));
const panelFehler = (text) => {
  const box = $('[data-panel-error]');
  box.textContent = text || '';
  box.hidden = !text;
};

// ---------- Вход / выход ----------
async function start() {
  if (!supabaseKonfiguriert) {
    zeige('login');
    loginFehler('Die Datenbank ist noch nicht eingerichtet (Datei .env fehlt). Siehe README.');
    $('[data-login-btn]').disabled = true;
    return;
  }
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') abgemeldet();
  });

  // Ist die Datenbank nicht erreichbar, hängt getSession() sonst minutenlang – daher Zeitlimit
  try {
    const antwort = await Promise.race([
      supabase.auth.getSession(),
      new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (antwort === null) throw new Error('timeout');
    if (antwort.data?.session) await nachAnmeldung(antwort.data.session.user);
    else zeige('login');
  } catch {
    zeige('login');
    loginFehler('Keine Verbindung zur Datenbank. Bitte Internetverbindung prüfen oder später erneut versuchen.');
  }
}

function loginFehler(text) {
  const box = $('[data-login-error]');
  box.textContent = text || '';
  box.hidden = !text;
}

$('[data-login-form]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const btn = $('[data-login-btn]');
  const email = form.email.value.trim();
  const password = form.password.value;
  if (!email || !password) { loginFehler('Bitte E-Mail und Passwort eingeben.'); return; }
  btn.disabled = true; btn.classList.add('is-loading'); loginFehler('');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      loginFehler(error.status === 400 || /invalid/i.test(error.message)
        ? 'E-Mail oder Passwort ist falsch.'
        : 'Anmeldung nicht möglich. Bitte später erneut versuchen.');
      return;
    }
    form.password.value = '';
    await nachAnmeldung(data.user);
  } catch {
    loginFehler('Keine Verbindung. Bitte Internetverbindung prüfen.');
  } finally {
    btn.disabled = false; btn.classList.remove('is-loading');
  }
});

async function nachAnmeldung(user) {
  // Проверяем в базе, что этот пользователь действительно админ
  const { data, error } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error || !data) {
    await supabase.auth.signOut();
    zeige('login');
    loginFehler(error ? 'Zugriff konnte nicht geprüft werden. Bitte erneut versuchen.' : 'Dieses Konto hat keinen Zugriff auf die Verwaltung.');
    return;
  }
  $('[data-user-email]').textContent = user.email ?? '';
  zeige('panel');
  await laden();
  liveStarten();
}

$('[data-logout]').addEventListener('click', () => supabase.auth.signOut());

function abgemeldet() {
  if (kanal) { supabase.removeChannel(kanal); kanal = null; }
  clearInterval(pollTimer);
  anfragen = []; bekannteIds = null;
  $('[data-list]').replaceChildren();
  $('[data-detail]').open && $('[data-detail]').close();
  document.title = 'Anfragen · Verwaltung';
  zeige('login');
}

// ---------- Загрузка заявок ----------
async function laden({ stumm = false } = {}) {
  const { data, error } = await supabase
    .from('anfragen')
    .select('id, code, typ, name, email, telefon, altersgruppe, alter_kind, wunschdatum, wunschzeit, nachricht, status, created_at, updated_at, datenschutz_am')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    if (!stumm) panelFehler('Anfragen konnten nicht geladen werden. Bitte „Aktualisieren“ drücken oder später erneut versuchen.');
    return false;
  }
  panelFehler('');

  // Новые заявки, появившиеся с прошлой загрузки → уведомление
  if (bekannteIds) {
    data.filter((a) => !bekannteIds.has(a.id)).forEach((a) => toast(`Neue Anfrage von ${a.name} (${typLabel[a.typ] ?? a.typ})`, 'new'));
  }
  bekannteIds = new Set(data.map((a) => a.id));
  anfragen = data;
  $('[data-updated]').textContent = `Stand: ${new Intl.DateTimeFormat('de-DE', { timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date())}`;
  zeichnen();
  if (aktuelleId && $('[data-detail]').open) {
    const a = anfragen.find((x) => x.id === aktuelleId);
    if (a) detailFuellen(a); else $('[data-detail]').close();
  }
  return true;
}

function liveStarten() {
  kanal = supabase
    .channel('anfragen-admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'anfragen' }, () => laden({ stumm: true }))
    .subscribe((status) => { $('[data-live]').classList.toggle('on', status === 'SUBSCRIBED'); });

  clearInterval(pollTimer);
  pollTimer = setInterval(() => laden({ stumm: true }), POLL_MS);
}
// Когда вкладку снова открыли – сразу обновить список
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && bekannteIds) laden({ stumm: true });
});

$('[data-reload]').addEventListener('click', async () => {
  if (await laden()) toast('Liste aktualisiert');
});

// ---------- Список ----------
function zeichnen() {
  const neu = anfragen.filter((a) => a.status === 'neu').length;
  const badge = $('[data-new-badge]');
  badge.hidden = neu === 0;
  badge.textContent = neu === 1 ? '1 neue' : `${neu} neue`;
  document.title = neu ? `(${neu}) Anfragen · Verwaltung` : 'Anfragen · Verwaltung';

  document.querySelectorAll('[data-count]').forEach((c) => {
    const k = c.dataset.count;
    c.textContent = String(k === 'alle' ? anfragen.length : anfragen.filter((a) => a.status === k).length);
  });

  const q = suche.toLowerCase();
  const liste = anfragen.filter((a) =>
    (filter === 'alle' || a.status === filter) &&
    (!q || [a.name, a.email, a.telefon, a.code, a.nachricht].some((v) => v && v.toLowerCase().includes(q))));

  const box = $('[data-list]');
  box.replaceChildren();
  if (!liste.length) {
    box.append(el('p', { class: 'empty', text: anfragen.length ? 'Keine Anfragen für diese Auswahl.' : 'Noch keine Anfragen eingegangen.' }));
    return;
  }
  liste.forEach((a) => {
    const meta = el('div', { class: 'item-meta' },
      el('span', { class: 'pill typ', text: typLabel[a.typ] ?? a.typ }),
      el('span', { class: `pill st-${a.status}`, text: statusLabel[a.status] ?? a.status }),
      a.wunschdatum ? el('span', { text: `Wunsch: ${fmtDatum(a.wunschdatum)}${a.wunschzeit ? ', ' + a.wunschzeit : ''}` }) : null,
      el('span', { text: a.email || a.telefon || '' }),
    );
    const item = el('button', { class: `item${a.status === 'neu' ? ' is-new' : ''}`, type: 'button' },
      el('span', { class: 'dot', 'aria-hidden': 'true' }),
      el('span', {}, el('span', { class: 'item-name', text: a.name }), meta),
      el('span', { class: 'item-date', text: fmtDatumZeit(a.created_at) }),
    );
    item.setAttribute('aria-label', `${a.name}, ${statusLabel[a.status]}, öffnen`);
    item.addEventListener('click', () => oeffnen(a.id));
    box.append(item);
  });
}

document.querySelectorAll('[data-filter]').forEach((tab) => tab.addEventListener('click', () => {
  filter = tab.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
  zeichnen();
}));
$('[data-search]').addEventListener('input', (e) => { suche = e.target.value.trim(); zeichnen(); });

// ---------- Подробности ----------
function detailFuellen(a) {
  $('[data-detail-code]').textContent = `Anfrage ${a.code}`;
  $('[data-detail-name]').textContent = a.name;
  $('[data-detail-status]').textContent = statusLabel[a.status] ?? a.status;
  document.querySelectorAll('[data-set-status]').forEach((b) => b.classList.toggle('is-current', b.dataset.setStatus === a.status));

  const zeilen = [
    ['Art', typLabel[a.typ] ?? a.typ],
    ['Eingegangen', fmtDatumZeit(a.created_at)],
    ['E-Mail', a.email ? el('a', { href: `mailto:${a.email}`, text: a.email }) : null],
    ['Telefon', a.telefon ? el('a', { href: `tel:${a.telefon.replace(/[^\d+]/g, '')}`, text: a.telefon }) : null],
    ['Altersgruppe', a.altersgruppe],
    ['Alter des Kindes', a.alter_kind != null ? `${a.alter_kind} Jahre` : null],
    ['Wunschdatum', a.wunschdatum ? fmtDatum(a.wunschdatum) : null],
    ['Wunschzeit', a.wunschzeit],
    ['Zuletzt geändert', a.updated_at !== a.created_at ? fmtDatumZeit(a.updated_at) : null],
  ];
  const dl = $('[data-detail-fields]');
  dl.replaceChildren();
  zeilen.filter(([, v]) => v).forEach(([k, v]) => dl.append(el('dt', { text: k }), el('dd', {}, v)));
  if (a.nachricht) {
    dl.append(el('dt', { text: 'Nachricht' }), el('dd', {}, el('div', { class: 'message', text: a.nachricht })));
  }
}

function oeffnen(id) {
  const a = anfragen.find((x) => x.id === id);
  if (!a) return;
  aktuelleId = id;
  detailFuellen(a);
  $('[data-detail]').showModal();
}
$('[data-close]').addEventListener('click', () => $('[data-detail]').close());
$('[data-detail]').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

// Смена статуса – сохраняется в базе данных
document.querySelectorAll('[data-set-status]').forEach((btn) => btn.addEventListener('click', async () => {
  const status = btn.dataset.setStatus;
  const buttons = document.querySelectorAll('[data-set-status]');
  buttons.forEach((b) => (b.disabled = true));
  try {
    const { data, error } = await supabase.from('anfragen').update({ status }).eq('id', aktuelleId).select('id, status, updated_at').maybeSingle();
    if (error || !data) throw error ?? new Error('nicht gespeichert');
    const a = anfragen.find((x) => x.id === aktuelleId);
    Object.assign(a, data);
    detailFuellen(a);
    zeichnen();
    toast(`Status gespeichert: ${statusLabel[status]}`);
  } catch {
    toast('Status konnte nicht gespeichert werden. Bitte erneut versuchen.', 'error');
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}));

// Удаление – только после подтверждения
$('[data-delete]').addEventListener('click', () => {
  const a = anfragen.find((x) => x.id === aktuelleId);
  if (!a) return;
  $('[data-confirm-name]').textContent = a.name;
  $('[data-confirm]').showModal();
  $('[data-confirm-no]').focus();
});
$('[data-confirm-no]').addEventListener('click', () => $('[data-confirm]').close());
$('[data-confirm-yes]').addEventListener('click', async () => {
  const btn = $('[data-confirm-yes]');
  btn.disabled = true;
  try {
    const { data, error } = await supabase.from('anfragen').delete().eq('id', aktuelleId).select('id');
    if (error || !data?.length) throw error ?? new Error('nicht gelöscht');
    anfragen = anfragen.filter((x) => x.id !== aktuelleId);
    bekannteIds?.delete(aktuelleId);
    $('[data-confirm]').close();
    $('[data-detail]').close();
    zeichnen();
    toast('Anfrage gelöscht');
  } catch {
    toast('Anfrage konnte nicht gelöscht werden.', 'error');
  } finally {
    btn.disabled = false;
  }
});

start();
