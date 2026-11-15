// =====================================================================
// ДАННЫЕ ДЛЯ IMPRESSUM И DATENSCHUTZ
//
// В старом сайте этих данных не было, поэтому всё пусто.
// Пустое поле '' показывается на сайте жёлтой пометкой [BITTE ERGÄNZEN: …],
// чтобы его нельзя было забыть.
//
// Если какой-то пункт к вам не относится (например, нет Umsatzsteuer-ID),
// впишите в него: null  – тогда блок исчезнет со страницы.
// Что именно обязательно – см. LEGAL_CHECKLIST.md и уточните у юриста.
// =====================================================================

export const rechtliches = {
  // Пока true – вверху юридических страниц виден жёлтый баннер «Entwurf».
  // Поставьте false только после проверки текстов.
  entwurf: false,

  // ---- Impressum ----
  betreiber: 'Olena Boiarko',          // полное имя владельца или название организации
  rechtsform: 'Einzelunternehmen',         // например: 'Einzelunternehmen' / 'e. V.' / null
  strasse: 'Friedensplatz 15',            // ladungsfähige Anschrift (адрес для юридической почты)
  plzOrt: '46045 Oberhausen',
  vertreten: null,        // для e. V./GmbH: кто представляет, иначе null
  register: null,         // например: 'Vereinsregister Amtsgericht X, VR 1234' или null
  ustId: null,            // Umsatzsteuer-ID, если есть, иначе null
  inhaltlichVerantwortlich: null,       // блок «Verantwortlich für den Inhalt» скрыт (нет редакционных материалов)

  // ---- Datenschutz ----
  hostingAnbieter: '',    // например: 'Netlify, Inc., 512 2nd Street, San Francisco, USA'
  supabaseRegion: 'Europäische Union',     // регион проекта Supabase (указано: EU)
  loeschfrist: '6 Monate nach Eingang der Anfrage',        // через сколько удаляются заявки
  aufsichtsbehoerde: 'Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestr. 2-4, 40213 Düsseldorf',  // Oberhausen liegt in NRW
  stand: 'Oktober 2026',              // дата текста
};
