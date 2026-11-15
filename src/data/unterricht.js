// =====================================================================
// ЗАНЯТИЯ, ВОЗРАСТНЫЕ ГРУППЫ И ТИПЫ ЗАЯВОК
// =====================================================================

// ---------- Возрастные группы ----------
// В студии 4 группы, но названия и возраст групп в старом сайте не были указаны.
// Когда будут известны – заполните список, например:
//   { name: 'Minis', alter: '4–5 Jahre', text: 'Spielerischer Einstieg ins Ballett.' },
// Как только список не пустой:
//   * группы появятся карточками на странице Unterricht,
//   * в форме записи появится выбор группы.
export const altersgruppen = [
   { name: 'Gruppe 1', alter: 'ab 5-7 Jahren', text: '_________' },
   { name: 'Gruppe 2', alter: 'ab 8-11 Jahren', text: '_________' },
   { name: 'Gruppe 3', alter: 'ab 12-15 Jahren', text: '_________' },
   { name: 'Gruppe 4', alter: 'ab 16-25 Jahren', text: '_________' },
];

// ---------- Расписание и цены ----------
// Пока не известны → на сайте показывается фраза "на запрос".
// Если появятся – впишите строки, например:
//   { tag: 'Montag', zeit: '16:00–17:00', gruppe: 'Minis' },
export const stundenplan = [
  { tag: 'Montag', zeit: '15:20–16:20', gruppe: 'Gruppe 1' },
  { tag: 'Montag', zeit: '16:20–17:45', gruppe: 'Gruppe 2' },
  { tag: 'Montag', zeit: '18:00–19:30', gruppe: 'Gruppe 4' },
  { tag: 'Dienstag', zeit: '18:00–19:30', gruppe: 'Gruppe 3' },
  { tag: 'Mittwoch', zeit: '16:20–17:45', gruppe: 'Gruppe 2' },
  { tag: 'Mittwoch', zeit: '18:00–19:30', gruppe: 'Gruppe 3' },
  { tag: 'Donnerstag', zeit: '15:20–16:20', gruppe: 'Gruppe 1' },
  { tag: 'Donnerstag', zeit: '16:20–17:45', gruppe: 'Gruppe 2' },
  
];
export const preiseHinweis = 'Zu den Preisen informieren wir Sie gern persönlich: Wir melden uns nach Ihrer Anfrage per E-Mail bei Ihnen.';

// ---------- Тексты страницы Unterricht ----------
export const unterrichtSeite = {
  titel: 'Unterricht',
  einleitung: 'Qualifizierter Ballettunterricht für Kinder ab 5 Jahren – in vier Altersgruppen, mit zwei erfahrenen Lehrkräften.',
  merkmale: [
    { titel: 'Für Kinder ab 5 Jahren', text: 'Frühzeitige tänzerische Förderung: Die Kinder entwickeln ihre Fähigkeiten Schritt für Schritt weiter.' },
    { titel: 'Vier Altersgruppen', text: 'Die Kinder trainieren gemeinsam – entsprechend ihrem Alter und ihrer Entwicklung.' },
    { titel: 'Gut ausgestatteter Saal', text: 'Ballettstangen und weitere Trainingsgeräte ermöglichen ein gezieltes und abwechslungsreiches Training.' },
    { titel: 'Feste und Wettbewerbe', text: 'Neben dem regulären Unterricht organisieren wir Feste und Wettbewerbe – für gemeinsame Erlebnisse und jede Menge Freude.' },
  ],
  // Шаги записи (описывают, как работает сайт – менять не обязательно)
  ablauf: [
    { titel: 'Anfrage senden', text: 'Füllen Sie das kurze Formular für Ihre Probestunde aus.' },
    { titel: 'Wir melden uns', text: 'Wir prüfen Ihre Anfrage und melden uns persönlich per E-Mail oder Telefon.' },
  ],
};

// ---------- Типы заявок в форме ----------
// Ключ (value) менять нельзя – он связан с базой данных.
// Подписи (label) можно менять.
export const anfrageTypen = [
  { value: 'probestunde', label: 'Probestunde',       text: 'Unverbindlich eine erste Stunde ausprobieren' },
  // Отключено: сейчас можно записаться только на пробное занятие.
  // Чтобы вернуть выбор «Unterrichtsanfrage» в форме – уберите // в начале строки ниже.
  // { value: 'unterricht',  label: 'Unterrichtsanfrage', text: 'Anfrage zum regulären Ballettunterricht' },
];

// Подписи статусов для админ-панели
export const statusListe = [
  { value: 'neu',            label: 'Neu' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung' },
  { value: 'bestaetigt',     label: 'Bestätigt' },
  { value: 'abgelehnt',      label: 'Abgelehnt' },
  { value: 'abgeschlossen',  label: 'Abgeschlossen' },
];
