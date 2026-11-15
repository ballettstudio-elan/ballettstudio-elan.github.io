// =====================================================================
// ПРЕПОДАВАТЕЛИ (Lehrkräfte)
//
// Каждый преподаватель – один блок { ... }, в списке ниже.
//
//  name       – имя
//  rolle      – короткая подпись под именем (можно '')
//  foto       – путь к фото. Фото кладите в папку public/images/lehrkraefte/
//               и пишите путь так: '/images/lehrkraefte/имя-файла.jpg'
//               Нет фото → foto: '' (покажется аккуратная заглушка с инициалами)
//  fotoAlt    – описание фото для незрячих
//  kurztext   – одна-две фразы о преподавателе (можно '')
//  anzeigen   – true = показывать на сайте, false = спрятать (данные сохраняются)
//  abschnitte – блоки текста (Ausbildung, Erfahrung, Unterricht ...).
//               ЧТОБЫ УДАЛИТЬ БЛОК (например „Ausbildung“): удалите его строку
//               { titel: 'Ausbildung', text: '...' }, целиком.
//               ЧТОБЫ ВРЕМЕННО ОТКЛЮЧИТЬ: поставьте // в начале строки.
//               ЧТОБЫ ДОБАВИТЬ: скопируйте строку-пример и уберите // в начале.
//
// Важно: пишите только настоящие сведения. Ничего не придумано –
// поэтому у преподавателей пока нет текстов про образование и опыт.
// =====================================================================

export const lehrkraefte = [
  {
    name: 'Olena Boiarko',
    rolle: 'Ballettlehrerin',
    foto: '/images/lehrkraefte/balett_photo_13.jpg',
    fotoAlt: 'Olena Boiarko im Ballettsaal',
    kurztext: 'Erfahrene Lehrkraft mit fundierten tänzerischen Kenntnissen.',
    anzeigen: true,
    abschnitte: [
      // { titel: 'Ausbildung', text: 'Hier die Ausbildung eintragen (Schulen, Akademien, Abschlüsse).' },
      // { titel: 'Erfahrung',  text: 'Hier die Erfahrung eintragen (Bühnen, Jahre im Unterricht).' },
      // { titel: 'Unterricht', text: 'Hier die Schwerpunkte eintragen (Gruppen, Stile).' },
    ],
  },

  // Второй преподаватель: имя и данные в старом сайте не были указаны.
  // ВПИШИТЕ ИМЯ вместо [NAME …]. Фото: положите файл в public/images/lehrkraefte/
  // и впишите путь в foto, например '/images/lehrkraefte/maria.jpg'.
  {
    name: 'Olena Osman',
    rolle: 'Ballettlehrerin',
    foto: '/images/lehrkraefte/olena_college_1.png',
    fotoAlt: '',
    kurztext: 'Erfahrene Lehrkraft mit fundierten tänzerischen Kenntnissen.',
    anzeigen: true,
    abschnitte: [
      // { titel: 'Ausbildung', text: '...' },
      // { titel: 'Erfahrung',  text: '...' },
    ],
  },
];

// Только те, у кого anzeigen: true (используется страницами сайта)
export const sichtbareLehrkraefte = lehrkraefte.filter((l) => l.anzeigen);
