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
 * 3. Das Fenster heben, in dem getippt wird. Das ist der Schritt, der am
 *    Tablet den Unterschied machte: FANGs Ereignisfenster ist ein eigenes,
 *    festes Element ueber dem Blatt. Das Blatt darunter darf schrumpfen, so
 *    viel es will - das Fenster bleibt, wo es ist. Und der Browser hilft nicht:
 *    Er haelt ein Feld fuer sichtbar, sobald seine **Oberkante** im Bild ist,
 *    auch wenn der Text darin schon hinter der Tastatur steht. Also messen
 *    wir selbst, ob die Unterkante des Feldes noch ueber der Tastatur liegt,
 *    und schieben das Fenster um genau den Fehlbetrag nach oben - per CSS
 *    `translate`, das Foundrys eigene Lage nicht anfasst und beim Schliessen
 *    der Tastatur rueckstandslos verschwindet.
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

/** Das Fenster, das gerade ueber die Tastatur gehoben ist, falls eins. */
let gehoben = null;

/** Abstand, den das Feld ueber der Tastatur behalten soll. */
const LUFT = 24;

/** Woran ein Fenster zu erkennen ist - beide Bauarten Foundrys. */
const FENSTER = ".application, .app.window-app, .inperson-stage-sheet";


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
  else {
    wurzel.style.removeProperty("--inperson-tastatur");
    senken();
  }
  return hoehe;
}

/**
 * Der Sichtbereich hat sich veraendert - nachheben.
 *
 * Die Tastatur waechst nach dem Aufgehen oft noch einmal: Die Wortvorschlaege
 * kommen einen Augenblick spaeter dazu, und schon liegt das Feld wieder
 * dahinter. Deshalb bei jeder Groessenaenderung neu messen, solange ein Feld
 * den Fokus hat.
 */
function beimSichtwechsel() {
  const hoehe = messen();
  if (!hoehe) return;
  const aktiv = document.activeElement;
  if (aktiv?.closest?.(SCHREIBFELD)) insBild(aktiv);
}

/**
 * Das Feld ins Bild holen - erst rollen, dann heben.
 *
 * Rollen zuerst, ohne Animation: Was innerhalb des Fensters scrollbar ist,
 * soll erst einmal scrollen, und gemessen werden darf erst, wenn das getan
 * ist. Mit `smooth` stand das Mass mitten in der Bewegung.
 *
 * Dann die eigentliche Frage: Liegt die **Unterkante** des Feldes noch ueber
 * der Tastatur? Der Browser prueft nur die Oberkante, und genau daran lag es.
 * Fehlt etwas, wird das Fenster um den Fehlbetrag angehoben - hoechstens so
 * weit, dass seine eigene Oberkante nicht aus dem Bild verschwindet, denn ein
 * Fenster ohne Titelzeile ist nicht mehr zu greifen.
 */
function insBild(feld) {
  if (!feld?.isConnected) return;
  try { feld.scrollIntoView({ block: "center", behavior: "instant" }); }
  catch { feld.scrollIntoView(false); }

  const sicht = window.visualViewport;
  const sichtOben = sicht ? sicht.offsetTop : 0;
  const sichtUnten = sicht ? sicht.offsetTop + sicht.height : window.innerHeight;

  const fenster = feld.closest(FENSTER);
  if (!fenster) return;
  senken();

  const mass = feld.getBoundingClientRect();
  const fehlt = mass.bottom + LUFT - sichtUnten;
  if (fehlt <= 0) return;

  // Nicht weiter, als die Oberkante des Fensters hergibt.
  const rahmen = fenster.getBoundingClientRect();
  const spielraum = Math.max(0, rahmen.top - sichtOben);
  const hub = Math.round(Math.min(fehlt, spielraum));
  if (hub <= 0) return;

  fenster.style.translate = `0 -${hub}px`;
  gehoben = fenster;
}

/** Ein gehobenes Fenster zurueck an seinen Platz. */
function senken() {
  if (!gehoben) return;
  gehoben.style.removeProperty("translate");
  gehoben = null;
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
 * Beim Verlassen des Feldes senken - aber erst, wenn kein anderes Feld im
 * selben Fenster den Fokus uebernimmt. Zwischen zwei Feldern einer Maske
 * gibt es einen Augenblick ohne Fokus; wer da sofort senkt, laesst das
 * Fenster bei jedem Tab-Sprung huepfen.
 */
function beimFokusVerlassen() {
  setTimeout(() => {
    const aktiv = document.activeElement;
    if (aktiv?.closest?.(SCHREIBFELD) && gehoben?.contains(aktiv)) return;
    senken();
  }, 50);
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

  window.visualViewport?.addEventListener("resize", beimSichtwechsel);
  window.visualViewport?.addEventListener("scroll", messen);
  document.addEventListener("focusin", beimFokus, true);
  document.addEventListener("focusout", beimFokusVerlassen, true);
  messen();
}

export function tastaturBeenden() {
  if (!laeuft) return;
  laeuft = false;

  const meta = angabe();
  if (meta && vorherigeAngabe !== null) meta.content = vorherigeAngabe;
  vorherigeAngabe = null;

  window.visualViewport?.removeEventListener("resize", beimSichtwechsel);
  window.visualViewport?.removeEventListener("scroll", messen);
  document.removeEventListener("focusin", beimFokus, true);
  document.removeEventListener("focusout", beimFokusVerlassen, true);
  senken();
  document.documentElement.style.removeProperty("--inperson-tastatur");
}
