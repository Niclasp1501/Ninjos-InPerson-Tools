/**
 * Platz für die Bildschirmtastatur.
 *
 * **Der Fehler:** In der Blattansicht schob sich die Tastatur über das Feld,
 * in das gerade getippt wurde, und nichts rückte nach oben. Ein Ereignis in
 * FANGs Chronik ließ sich so nicht eintragen - man sah die Überschrift und
 * schrieb blind. Unter Sheet Only geht es, und genau der Vergleich führt zur
 * Ursache.
 *
 * **Warum es passiert:** Foundrys Spielseite setzt
 *
 *     <meta name="viewport" content="width=device-width, initial-scale=1.0,
 *           maximum-scale=1.0, user-scalable=no">
 *
 * Ohne die Angabe `interactive-widget` gilt der Standard `resizes-visual`: Die
 * Tastatur legt sich über die Seite, ohne sie zu verkleinern. Der Sichtbereich
 * schrumpft, der Layoutbereich nicht - `100dvh` bleibt `100dvh`, und ein
 * Element mit `position: fixed` bleibt genau da, wo es war. Der Browser holt
 * ein Feld zwar ins Bild, hält es aber schon für sichtbar, sobald seine
 * **Oberkante** im Bild ist - der Text darunter steht dann hinter der Tastatur.
 * Sheet Only lässt das Dokument scrollen; dort schiebt der Browser die ganze
 * Seite, und alles bewegt sich gemeinsam. Unsere Blattansicht besteht aus
 * `overflow: hidden` am Körper und lauter festen Elementen - es gibt nichts,
 * was er schieben könnte.
 *
 * **Was nicht funktioniert hat, damit es niemand noch einmal versucht:**
 *
 * - `interactive-widget=resizes-content` an die Angabe hängen. Dann baut der
 *   Browser beim Aufgehen der Tastatur den ganzen Layoutbereich um: schwarzes
 *   Flackern über den ganzen Schirm, und nach dem Schließen blieb der
 *   verkleinerte Zustand hängen - FANG öffnete danach nur noch halb hoch.
 * - Nur das eine Fenster heben, in dem getippt wird. Es flog allein davon,
 *   der Rest blieb stehen, und zusammen mit den anderen Ausgleichen flog es
 *   zu weit.
 *
 * **Was funktioniert:** Sheet Only nachbauen. Foundrys `body` ist genau einen
 * Bildschirm hoch (`height: 100vh`), und ein `translate` am Körper nimmt alle
 * festen Kinder mit - Blatt, Leisten, jedes Fenster. Wir messen, wie weit die
 * Unterkante des Feldes hinter der Tastatur liegt, und heben um genau das die
 * **ganze Seite** an, nie weiter, als die Tastatur hoch ist. Tastatur zu, Feld
 * verlassen: alles zurück. Kein Umbau des Layouts, also kein Flackern und
 * nichts, was hängen bleiben könnte.
 */

/** Woran ein Feld zu erkennen ist, in das jemand schreibt. */
const SCHREIBFELD = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

/**
 * Unter dieser Höhe ist es keine Tastatur.
 *
 * Der Sichtbereich schwankt auch ohne sie - eine einfahrende Adressleiste sind
 * schon 50 Pixel. Wer darauf reagiert, lässt das Blatt beim Scrollen zucken.
 */
const MINDESTHOEHE = 120;

/** Abstand, den das Feld über der Tastatur behalten soll. */
const LUFT = 24;

let laeuft = false;

/** Um wie viele Pixel die Seite gerade angehoben ist. */
let hub = 0;

/**
 * Wie viel Bild die Tastatur verdeckt.
 *
 * `visualViewport.height` ist, was man noch sieht; `offsetTop`, wie weit das
 * Sichtfenster dabei nach unten gerutscht ist. Was von der Fensterhöhe übrig
 * bleibt, liegt hinter der Tastatur.
 */
function verdeckt() {
  const sicht = window.visualViewport;
  if (!sicht) return 0;
  const rest = window.innerHeight - (sicht.height + sicht.offsetTop);
  return rest > MINDESTHOEHE ? Math.round(rest) : 0;
}

function anheben(pixel) {
  hub = Math.max(0, Math.round(pixel));
  if (hub) document.body.style.translate = `0 -${hub}px`;
  else document.body.style.removeProperty("translate");
}

/** Die Seite zurück an ihren Platz. */
function senken() {
  if (hub) anheben(0);
}

/**
 * Das Feld ins Bild holen.
 *
 * Erst rollen, ohne Animation: Was innerhalb des Fensters scrollbar ist, soll
 * scrollen, und gemessen werden darf erst danach. Dann die Frage, die der
 * Browser nicht stellt: Liegt die **Unterkante** des Feldes noch über der
 * Tastatur? Fehlt etwas, kommt es zum bisherigen Hub dazu - so wird beim
 * Nachwachsen der Tastatur nicht von vorn gerechnet, sondern nachgelegt.
 */
function insBild(feld) {
  if (!feld?.isConnected) return;
  const tastatur = verdeckt();
  if (!tastatur) { senken(); return; }

  try { feld.scrollIntoView({ block: "center", behavior: "instant" }); }
  catch { feld.scrollIntoView(false); }

  const sicht = window.visualViewport;
  const sichtUnten = sicht.offsetTop + sicht.height;
  const mass = feld.getBoundingClientRect();
  const fehlt = mass.bottom + LUFT - sichtUnten;

  // Nie weiter, als die Tastatur hoch ist: Darüber hinaus gäbe es nichts mehr
  // freizulegen, nur einen schwarzen Streifen unter dem Blatt.
  const ziel = Math.min(hub + fehlt, tastatur);
  if (Math.abs(ziel - hub) >= 1) anheben(ziel);
}

/**
 * Der Sichtbereich hat sich verändert - nachziehen.
 *
 * Die Tastatur wächst nach dem Aufgehen oft noch einmal: Die Wortvorschläge
 * kommen einen Augenblick später dazu, und schon liegt das Feld wieder
 * dahinter. Und sie geht zu - dann muss alles zurück, auch wenn das Feld den
 * Fokus behält.
 */
function beimSichtwechsel() {
  const aktiv = document.activeElement;
  if (aktiv?.closest?.(SCHREIBFELD)) insBild(aktiv);
  else senken();
}

function beimFokus(ereignis) {
  const feld = ereignis.target?.closest?.(SCHREIBFELD);
  if (!feld) return;
  /*
   * Die Tastatur fährt auf; erst danach steht fest, wie viel Platz bleibt. Ein
   * einzelnes `setTimeout` traf mal zu früh, mal zu spät, je nachdem wie flink
   * das Gerät war. Also auf die Meldung des Sichtbereichs warten - und ein
   * Zeitlimit dahinter, falls sie ausbleibt, weil gar keine Tastatur kommt
   * (Tastatur am Kabel, Maus am Tablet).
   */
  const sicht = window.visualViewport;
  let erledigt = false;
  const fertig = () => {
    if (erledigt) return;
    erledigt = true;
    sicht?.removeEventListener("resize", fertig);
    insBild(feld);
  };
  sicht?.addEventListener("resize", fertig);
  setTimeout(fertig, 350);
}

/**
 * Beim Verlassen des Feldes senken - aber erst, wenn kein anderes Feld den
 * Fokus übernimmt. Zwischen zwei Feldern einer Maske gibt es einen Augenblick
 * ohne Fokus; wer da sofort senkt, lässt die Seite bei jedem Sprung hüpfen.
 */
function beimFokusVerlassen() {
  setTimeout(() => {
    if (document.activeElement?.closest?.(SCHREIBFELD)) return;
    senken();
  }, 50);
}

/** Anmelden, solange die Blattansicht läuft. */
export function tastaturStarten() {
  if (laeuft) return;
  laeuft = true;
  window.visualViewport?.addEventListener("resize", beimSichtwechsel);
  document.addEventListener("focusin", beimFokus, true);
  document.addEventListener("focusout", beimFokusVerlassen, true);
}

export function tastaturBeenden() {
  if (!laeuft) return;
  laeuft = false;
  window.visualViewport?.removeEventListener("resize", beimSichtwechsel);
  document.removeEventListener("focusin", beimFokus, true);
  document.removeEventListener("focusout", beimFokusVerlassen, true);
  senken();
}
