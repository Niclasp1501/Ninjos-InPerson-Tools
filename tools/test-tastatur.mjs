/**
 * Prüft die Tastatur-Behandlung der Blattansicht.
 *
 * Das eigentliche Verhalten - fährt die Tastatur auf, rückt das Feld ins Bild -
 * lässt sich nur am Tablet sehen. Was sich hier prüfen lässt, ist die Mechanik
 * darunter, und genau dort saßen die Fallen:
 *
 *   - Foundrys Angabe zum Sichtbereich wird **ergänzt**, nicht ersetzt.
 *     `user-scalable=no` ist seine Entscheidung; wer die Zeile überschreibt,
 *     macht das Blatt am Tablet plötzlich zoombar.
 *   - Beim Beenden steht wieder exakt die ursprüngliche Angabe da.
 *   - Eine einfahrende Adressleiste ist keine Tastatur. Ohne Untergrenze
 *     zuckt das Blatt bei jedem Scrollen.
 *
 * node tools/test-tastatur.mjs
 */

const URSPRUNG = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const gut = ist === soll;
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${ist}\n    soll: ${soll}`}`);
};

/* ── Ein Browser, so klein wie er sein darf ──────────────────────── */

const horcher = new Map();
const merke = (ziel, art, fn) => horcher.set(`${ziel}:${art}`, fn);

const meta = { name: "viewport", content: URSPRUNG };
const wurzelStil = new Map();

globalThis.window = {
  innerHeight: 800,
  innerWidth: 1280,
  visualViewport: {
    height: 800,
    offsetTop: 0,
    addEventListener: (art, fn) => merke("sicht", art, fn),
    removeEventListener: art => horcher.delete(`sicht:${art}`)
  }
};
globalThis.document = {
  querySelector: wahl => (wahl.includes("viewport") ? meta : null),
  addEventListener: (art, fn) => merke("dok", art, fn),
  removeEventListener: art => horcher.delete(`dok:${art}`),
  documentElement: {
    style: {
      setProperty: (k, v) => wurzelStil.set(k, v),
      removeProperty: k => wurzelStil.delete(k)
    }
  }
};

const { tastaturStarten, tastaturBeenden } = await import("../scripts/tastatur.js");

/* ── 1. Die Angabe wird ergänzt, nicht ersetzt ───────────────────── */

tastaturStarten();
pruefe("Angabe ergänzt", meta.content, `${URSPRUNG}, interactive-widget=resizes-content`);
pruefe("Foundrys eigene Angaben bleiben", meta.content.includes("user-scalable=no"), true);

/* ── 2. Ohne Tastatur steht dort nichts ──────────────────────────── */

pruefe("ohne Tastatur keine Variable", wurzelStil.has("--inperson-tastatur"), false);

/* ── 3. Eine einfahrende Adressleiste ist keine Tastatur ─────────── */

window.visualViewport.height = 750;   // 50 Pixel - unter der Grenze
horcher.get("sicht:resize")();
pruefe("50 Pixel gelten nicht als Tastatur", wurzelStil.has("--inperson-tastatur"), false);

/* ── 4. Eine echte Tastatur schon ────────────────────────────────── */

window.visualViewport.height = 420;   // 380 Pixel Tastatur
horcher.get("sicht:resize")();
pruefe("Tastaturhöhe gemessen", wurzelStil.get("--inperson-tastatur"), "380px");

/* ── 5. Verschobenes Sichtfenster zählt mit ──────────────────────── */

// Der Browser hat die Seite hochgeschoben, um ein Feld freizulegen: Was hinter
// der Tastatur liegt, ist Fensterhöhe minus (Sichthöhe + Versatz).
window.visualViewport.offsetTop = 100;
horcher.get("sicht:resize")();
pruefe("Versatz des Sichtfensters abgezogen", wurzelStil.get("--inperson-tastatur"), "280px");

/* ── 6. Beenden räumt vollständig auf ────────────────────────────── */

tastaturBeenden();
pruefe("Angabe wiederhergestellt", meta.content, URSPRUNG);
pruefe("Variable entfernt", wurzelStil.has("--inperson-tastatur"), false);
pruefe("Horcher abgemeldet", horcher.has("sicht:resize") || horcher.has("dok:focusin"), false);

/* ── 7. Zweimal starten schadet nicht ────────────────────────────── */

tastaturStarten();
tastaturStarten();
pruefe("Angabe nicht doppelt ergänzt",
  (meta.content.match(/interactive-widget/g) ?? []).length, 1);
tastaturBeenden();
pruefe("nach doppeltem Start sauber", meta.content, URSPRUNG);

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
