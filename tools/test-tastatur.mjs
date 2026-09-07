/**
 * Prüft die Tastatur-Behandlung der Blattansicht.
 *
 * Das eigentliche Verhalten - fährt die Tastatur auf, rückt die Seite nach -
 * lässt sich nur am Tablet sehen. Was sich hier prüfen lässt, ist die Rechnung,
 * und genau dort saßen die Fallen:
 *
 *   - Eine einfahrende Adressleiste ist keine Tastatur. Ohne Untergrenze
 *     zuckt das Blatt bei jedem Scrollen.
 *   - Gehoben wird um den Fehlbetrag der **Unterkante**, nie weiter, als die
 *     Tastatur hoch ist.
 *   - Wächst die Tastatur nach, wird nachgelegt statt von vorn gerechnet.
 *   - Tastatur zu oder Feld verlassen: exakt zurück, kein Rest am Körper.
 *
 * node tools/test-tastatur.mjs
 */

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const gut = ist === soll;
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${ist}\n    soll: ${soll}`}`);
};

/* ── Ein Browser, so klein wie er sein darf ──────────────────────── */

const horcher = new Map();
const merke = (ziel, art, fn) => {
  const k = `${ziel}:${art}`;
  horcher.set(k, [...(horcher.get(k) ?? []), fn]);
};
const vergiss = (ziel, art, fn) => {
  const k = `${ziel}:${art}`;
  const rest = (horcher.get(k) ?? []).filter(f => f !== fn);
  if (rest.length) horcher.set(k, rest); else horcher.delete(k);
};
const feuere = k => { for (const fn of [...(horcher.get(k) ?? [])]) fn({ target: feld }); };

const koerperStil = new Map();
const feld = {
  isConnected: true,
  unten: 0,
  closest: wahl => (wahl.includes("input") ? feld : null),
  scrollIntoView: () => {},
  // `unten` ist die Lage ohne Hub; das Rechteck wandert mit der Seite mit,
  // genau wie getBoundingClientRect im Browser.
  getBoundingClientRect: () => {
    const h = parseInt((koerperStil.get("translate") ?? "0 -0px").split("-")[1], 10) || 0;
    return { top: feld.unten - 40 - h, bottom: feld.unten - h };
  }
};

globalThis.window = {
  innerHeight: 800,
  innerWidth: 1280,
  visualViewport: {
    height: 800,
    offsetTop: 0,
    addEventListener: (art, fn) => merke("sicht", art, fn),
    removeEventListener: (art, fn) => vergiss("sicht", art, fn)
  }
};
globalThis.document = {
  activeElement: null,
  addEventListener: (art, fn) => merke("dok", art, fn),
  removeEventListener: (art, fn) => vergiss("dok", art, fn),
  body: {
    style: {
      translate: undefined,
      setProperty() {},
      removeProperty: k => { if (k === "translate") document.body.style.translate = undefined; }
    }
  }
};
Object.defineProperty(document.body.style, "translate", {
  get: () => koerperStil.get("translate"),
  set: v => (v === undefined ? koerperStil.delete("translate") : koerperStil.set("translate", v))
});

const { tastaturStarten, tastaturBeenden } = await import("../scripts/tastatur.js");
const hub = () => koerperStil.get("translate") ?? "";

const fokus = () => {
  document.activeElement = feld;
  feuere("dok:focusin");
};
const sichtwechsel = () => feuere("sicht:resize");
const warten = ms => new Promise(r => setTimeout(r, ms));

tastaturStarten();

/* ── 1. Adressleiste ist keine Tastatur ──────────────────────────── */

window.visualViewport.height = 750;   // 50 Pixel
feld.unten = 790;
fokus(); sichtwechsel(); await warten(400);
pruefe("50 Pixel gelten nicht als Tastatur", hub(), "");

/* ── 2. Feld über der Tastatur: nichts tun ───────────────────────── */

window.visualViewport.height = 420;   // 380 Pixel Tastatur
feld.unten = 300;
fokus(); sichtwechsel(); await warten(400);
pruefe("sichtbares Feld bleibt, wo es ist", hub(), "");

/* ── 3. Feld hinter der Tastatur: um den Fehlbetrag heben ────────── */

// Unterkante 700, sichtbar bis 420, plus 24 Luft = 304
feld.unten = 700;
fokus(); sichtwechsel(); await warten(400);
pruefe("um den Fehlbetrag der Unterkante gehoben", hub(), "0 -304px");

/* ── 4. Nie weiter als die Tastatur hoch ist ─────────────────────── */

feld.unten = 1200;                    // fehlte 804, Tastatur ist 380
fokus(); sichtwechsel(); await warten(400);
pruefe("Hub auf Tastaturhöhe gedeckelt", hub(), "0 -380px");

/* ── 5. Tastatur wächst nach: nachlegen ──────────────────────────── */

feld.unten = 700;                     // zurück auf die 304er-Lage
fokus(); await warten(400);
pruefe("Ausgang 304", hub(), "0 -304px");
// Wortvorschläge: Tastatur 40 höher → fehlt 40 mehr
window.visualViewport.height = 380;
sichtwechsel();
pruefe("bei nachwachsender Tastatur nachgelegt", hub(), "0 -344px");

/* ── 6. Tastatur zu: alles zurück ────────────────────────────────── */

window.visualViewport.height = 800;
sichtwechsel();
pruefe("Tastatur zu → Seite zurück", hub(), "");

/* ── 7. Feld verlassen: zurück, Sprung zwischen Feldern nicht ────── */

window.visualViewport.height = 420; feld.unten = 700;
fokus(); await warten(400);
pruefe("wieder gehoben", hub(), "0 -304px");
feuere("dok:focusout");          // Fokus wandert zu einem anderen Feld
await warten(80);
pruefe("Sprung zwischen Feldern hüpft nicht", hub(), "0 -304px");
document.activeElement = null;
feuere("dok:focusout");
await warten(80);
pruefe("Feld verlassen → Seite zurück", hub(), "");

/* ── 8. Beenden räumt vollständig auf ────────────────────────────── */

fokus(); await warten(400);
tastaturBeenden();
pruefe("Beenden senkt", hub(), "");
pruefe("Horcher abgemeldet", horcher.has("sicht:resize") || horcher.has("dok:focusin"), false);

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
