// Перевод кодов ошибок из базы данных (функция anfrage_senden) в понятный немецкий текст.
export const fehlerTexte = {
  E_SPAM: 'Ihre Anfrage konnte nicht gesendet werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.',
  E_UNGUELTIG: 'Ihre Anfrage konnte nicht gesendet werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.',
  E_ZU_SCHNELL: 'Das ging sehr schnell. Bitte prüfen Sie Ihre Angaben und senden Sie das Formular in ein paar Sekunden erneut.',
  E_TYP: 'Bitte wählen Sie die Art Ihrer Anfrage.',
  E_NAME: 'Bitte geben Sie Ihren Namen an (mindestens 2 Zeichen).',
  E_KONTAKT: 'Bitte geben Sie eine E-Mail-Adresse oder eine Telefonnummer an, damit wir Ihnen antworten können.',
  E_EMAIL: 'Bitte prüfen Sie die E-Mail-Adresse.',
  E_TELEFON: 'Bitte prüfen Sie die Telefonnummer (nur Ziffern, Leerzeichen und + / - ( )).',
  E_GRUPPE: 'Bitte prüfen Sie die Altersgruppe.',
  E_ALTER: 'Bitte geben Sie ein gültiges Alter an.',
  E_DATUM: 'Bitte wählen Sie ein Datum ab heute und innerhalb der nächsten 12 Monate.',
  E_ZEIT: 'Die Angabe zur Wunschzeit ist zu lang.',
  E_NACHRICHT: 'Die Nachricht ist zu lang (höchstens 2000 Zeichen).',
  E_NACHRICHT_FEHLT: 'Bitte schreiben Sie uns Ihre Frage.',
  E_DATENSCHUTZ: 'Bitte bestätigen Sie die Datenschutzhinweise.',
  E_LIMIT: 'Es wurden in kurzer Zeit zu viele Anfragen gesendet. Bitte versuchen Sie es in etwa 10 Minuten erneut.',
};

export const allgemeinerFehler =
  'Ihre Anfrage konnte leider nicht gesendet werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';

export function fehlerText(error) {
  const msg = String(error?.message ?? '');
  const code = msg.match(/E_[A-Z_]+/)?.[0];
  return fehlerTexte[code] ?? allgemeinerFehler;
}
