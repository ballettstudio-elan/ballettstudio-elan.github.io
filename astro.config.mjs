// Einstellungen für Astro (das Programm, das aus den Dateien in "src" die fertige Website baut).
// Hier muss normalerweise nichts geändert werden.
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Adresse der fertigen Website. Nach der Veröffentlichung hier die echte Domain eintragen,
  // z. B. 'https://www.ballettstudio-elan.de'
  site: 'https://lev333misch.github.io',

  // Jede Seite wird als eigener Ordner erzeugt: /kontakt/ statt /kontakt.html
  trailingSlash: 'ignore',
  build: { format: 'directory' },

  // Kein Bild-Umwandlungsdienst nötig: Fotos liegen fertig in "public/images"
  image: { service: { entrypoint: 'astro/assets/services/noop' } },
});
