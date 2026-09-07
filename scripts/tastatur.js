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
 * Element mit `position: fixed` bleibt genau da, wo es war. Unsere Blattansicht
 * besteht aus beidem: `overflow: hidden` am Körper und ein Blatt über die volle
 * Höhe. Damit gibt es nichts, was der Browser noch scrollen könnte. Sheet Only
 * lässt das Dokument scrollen, deshalb erledigt es der Browser dort von selbst.
 *
 * **Die Lösung, in dieser Reihenfolge:**
 *
 * 1. `interactive-widget=resizes-content` an die Angabe hängen, solange die
 *    Blattansicht läuft. Dann verkleinert der Browser den Layoutbereich selbst:
 *    `100dvh` schrumpft, feste Fenster passen wieder, und das Feld wird von der
 *    Seite selbst ins Bild geholt. Das ist die eingebaute Lösung, kein Nachbau.
 * 2. Für Geräte, die das nicht kennen (vor Chrome 108), wird die Höhe der
 *    Tastatur gemessen und als `--inperson-tastatur` gesetzt; das Blatt zieht
 *    sich darum zusammen. Wo Schritt 1 greift, misst Schritt 2 null - der
 *    Sichtbereich schrumpft dort gemeinsam mit dem Fenster, also zieht sich
 *    nichts doppelt zusammen.
 * 3. Zum Schluss das Feld selbst ins Bild rollen. Beide Schritte davor schaffen
 *    nur den Platz; dass die richtige Zeile darin steht, ist noch einmal etwas
 *    anderes - besonders in einer langen Maske, in der weiter unten getippt
 *    wird.
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

let laeuft = false;
let vorherigeAngabe = null;

/** Foundrys Angabe zum Sichtbereich. */
function angabe() {
  return document.querySelector('meta[name="viewport"]');
}

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

function messen() {
  const hoehe = verdeckt();
  const wurzel = document.documentElement;
  if (hoehe) wurzel.style.setProperty("--inperson-tastatur", `${hoehe}px`);
  else wurzel.style.removeProperty("--inperson-tastatur");
}

/**
 * Das Feld ins Bild rollen, nachdem die Tastatur oben ist.
 *
 * `block: "center"` und nicht `"nearest"`: Bei einem Feld, das gerade eben noch
 * sichtbar ist, täte `nearest` nichts - und dann steht die Schreibmarke zwar im
 * Bild, aber einen Millimeter über der Tastatur, ohne den Text darunter, den
 * man beim Schreiben sehen will.
 */
function insBild(feld) {
  if (!feld?.isConnected) return;
  try {
    feld.scrollIntoView({ block: "center", behavior: "smooth" });
  } catch {
    feld.scrollIntoView(false);
  }
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
    messen();
    insBild(feld);
  };
  sicht?.addEventListener("resize", fertig);
  setTimeout(fertig, 350);
}

/**
 * Solange die Blattansicht läuft, darf die Tastatur die Seite verkleinern.
 *
 * Die Angabe wird nur ergänzt, nie ersetzt: `user-scalable=no` und die
 * Höchstvergrößerung sind Foundrys Entscheidung und bleiben, wie sie sind.
 */
export function tastaturStarten() {
  if (laeuft) return;
  laeuft = true;

  const meta = angabe();
  if (meta && !meta.content.includes("interactive-widget")) {
    vorherigeAngabe = meta.content;
    meta.content = `${meta.content}, interactive-widget=resizes-content`;
  }

  window.visualViewport?.addEventListener("resize", messen);
  window.visualViewport?.addEventListener("scroll", messen);
  document.addEventListener("focusin", beimFokus, true);
  messen();
}

export function tastaturBeenden() {
  if (!laeuft) return;
  laeuft = false;

  const meta = angabe();
  if (meta && vorherigeAngabe !== null) meta.content = vorherigeAngabe;
  vorherigeAngabe = null;

  window.visualViewport?.removeEventListener("resize", messen);
  window.visualViewport?.removeEventListener("scroll", messen);
  document.removeEventListener("focusin", beimFokus, true);
  document.documentElement.style.removeProperty("--inperson-tastatur");
}
