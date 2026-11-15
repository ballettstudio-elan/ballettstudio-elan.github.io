// =====================================================================
// ТЕКСТЫ САЙТА (кроме преподавателей, галереи, контактов и занятий –
// у них свои файлы в этой же папке).
//
// Как менять: исправьте текст внутри кавычек '...' и сохраните файл.
// Не удаляйте кавычки, запятые и скобки. Апостроф внутри текста
// пишите так: ’ (или используйте кавычки „…“).
// =====================================================================

export const studio = {
  // Название студии – используется везде на сайте
  name: 'BallettStudio „Elan“',
  kurzname: 'Elan',

  // Описание для Google и вкладки браузера
  beschreibung:
    'BallettStudio „Elan“ – Ballettunterricht für Kinder ab 5 Jahren. Seit über 20 Jahren, mit zwei erfahrenen Lehrkräften, vier Altersgruppen, Festen und Wettbewerben.',
};

// ---------- Меню сайта ----------
// Порядок пунктов = порядок строк. Чтобы убрать пункт из меню – удалите строку.
export const navigation = [
  { href: '/',             label: 'Startseite' },
  { href: '/ueber-uns/',   label: 'Über uns' },
  { href: '/unterricht/',  label: 'Unterricht' },
  { href: '/lehrkraefte/', label: 'Lehrkräfte' },
  { href: '/galerie/',     label: 'Galerie' },
  { href: '/kontakt/',     label: 'Kontakt' },
];

// ---------- Главная страница (Startseite) ----------
export const startseite = {
  hero: {
    oberzeile: 'Ballettstudio · seit über 20 Jahren',
    titel: 'Tanzen mit Freude, Anmut und Leichtigkeit',
    text: 'Bei uns entdecken Kinder ab 5 Jahren die Welt des Balletts – liebevoll begleitet und Schritt für Schritt gefördert.',
    knopfHaupt: 'Jetzt Probestunde anfragen',
    knopfZweit: 'Mehr über uns',
    bild: '/images/allgemein/gemaelde-ballerina.jpg',
    bildAlt: 'Gemälde einer Ballerina in Bewegung mit rotem Kleid vor blauem Hintergrund',
  },

  // Карточки преимуществ. Чтобы убрать карточку – удалите блок { ... }, целиком.
  vorteile: {
    liste: [
      { icon: 'jahre',   titel: 'Über 20 Jahre',         text: 'Unser Ballettstudio besteht seit über zwei Jahrzehnten.' },
      { icon: 'kind',    titel: 'Ab 5 Jahren',            text: 'Frühzeitige tänzerische Förderung für die Kleinsten.' },
      { icon: 'lehrer',  titel: 'Zwei Lehrkräfte',        text: 'Erfahrene Lehrkräfte mit fundierten tänzerischen Kenntnissen.' },
      { icon: 'saal',    titel: 'Ausgestatteter Saal',    text: 'Ballettstangen und weitere Trainingsgeräte für abwechslungsreiches Training.' },
      { icon: 'gruppen', titel: 'Vier Altersgruppen',     text: 'Die Kinder trainieren gemeinsam – passend zu Alter und Entwicklung.' },
      { icon: 'stern',   titel: 'Feste & Wettbewerbe',    text: 'Gemeinsame Erlebnisse, Auftritte und besondere Momente.' },
    ],
  },

  unterrichtTeaser: {
    oberzeile: 'Unterricht',
    titel: 'Ballett, das mitwächst',
    text: 'Qualifizierter Ballettunterricht in vier Altersgruppen – damit jedes Kind in seinem Tempo Freude, Haltung und Ausdruck entwickeln kann.',
    knopf: 'Zum Unterricht',
  },

  lehrkraefteTeaser: {
    oberzeile: 'Lehrkräfte',
    titel: 'Mit Erfahrung und Herz',
    text: 'Zwei erfahrene Lehrkräfte begleiten die Kinder mit fundierten tänzerischen Kenntnissen.',
    knopf: 'Alle Lehrkräfte',
  },

  galerieTeaser: {
    oberzeile: 'Galerie',
    titel: 'Momente aus dem Studio',
    knopf: 'Zur Galerie',
  },
};

// ---------- Блок «Записаться» внизу страниц ----------
export const aufruf = {
  titel: 'Lust auf die erste Ballettstunde?',
  text: 'Senden Sie uns ganz unverbindlich eine Anfrage. Wir melden uns persönlich bei Ihnen und stimmen einen passenden Termin ab.',
  knopf: 'Jetzt Probestunde anfragen',
};

// ---------- Über uns ----------
// Каждый блок = заголовок + абзацы (+ необязательное фото).
// Чтобы добавить абзац – добавьте строку в список "absaetze".
// Чтобы убрать фото у блока – удалите строки "bild" и "bildAlt".
export const ueberUns = {
  titel: 'Über uns',
  einleitung: 'Seit über 20 Jahren vermitteln wir Kindern die Freude am Tanz.',
  // Небольшое примечание под заголовком страницы. Чтобы убрать – поставьте hinweis: ''
  hinweis: 'Unser Unterricht findet auf Russisch statt. Unsere Lehrkräfte sprechen und unterrichten auf Russisch.',
  bloecke: [
    {
      titel: 'Unsere Geschichte',
      absaetze: [
        'Unser Ballettstudio besteht seit über 20 Jahren und bietet Kindern ab 5 Jahren eine frühzeitige tänzerische Förderung.',
        'Wir möchten die Freude am Tanz vermitteln und unseren jungen Tänzerinnen und Tänzern helfen, ihre Fähigkeiten Schritt für Schritt weiterzuentwickeln.',
      ],
      bild: '/images/galerie/gruppe-rosa-tutus.jpg',
      bildAlt: 'Kindergruppe in rosa Tutus mit Blumenkränzen und ihrer Lehrerin',
    },
    {
      titel: 'Professioneller Ballettunterricht',
      absaetze: [
        'Bei uns erwartet die Kinder qualifizierter Ballettunterricht, begleitet von zwei erfahrenen Lehrkräften mit fundierten tänzerischen Kenntnissen.',
        'Unser gut ausgestatteter Tanzsaal verfügt über Ballettstangen und weitere Trainingsgeräte, die ein gezieltes und abwechslungsreiches Training ermöglichen.',
      ],
    },
    {
      titel: 'Gemeinsam lernen und besondere Momente erleben',
      absaetze: [
        'Neben dem regulären Ballettunterricht organisieren wir verschiedene Feste und Wettbewerbe. So verbinden die Kinder ihre tänzerische Entwicklung mit gemeinsamen Erlebnissen und jeder Menge Freude.',
        'Unser Studio bietet insgesamt vier Altersgruppen, damit die Kinder entsprechend ihrem Alter und ihrer Entwicklung gemeinsam trainieren können.',
      ],
      bild: '/images/galerie/kostuemfest-luftballons.jpg',
      bildAlt: 'Kinder in bunten Kostümen mit Luftballons bei einem Fest im Studio',
    },
  ],
};
