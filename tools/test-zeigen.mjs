/**
 * Prüft das Zeigen einer Journalseite.
 *
 * Was hier geprüft wird, ist genau das, was am Tisch schiefgehen könnte und
 * was man am Tablet nicht sieht:
 *
 *   - Wer in der Empfängerliste steht. Die Spielleitung nicht, man selbst
 *     nicht, die Monitorkonten nicht als Personen, der Fernseher zuletzt.
 *   - Dass ohne Besitz nichts hinausgeht, auch wenn jemand die Funktion
 *     direkt aufruft. Der Knopf ist Oberfläche, diese Funktion ist die Grenze.
 *   - Dass der Takt hält: zweimal hintereinander tippen zeigt einmal.
 *   - Dass die Spielleitung genau dann mitliest, wenn sie es soll.
 *
 * node tools/test-zeigen.mjs
 */

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const a = JSON.stringify(ist), b = JSON.stringify(soll);
  const gut = a === b;
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${a}\n    soll: ${b}`}`);
};

/* ── Ein Foundry, so klein wie es sein darf ──────────────────────── */

const einstellungen = {
  showAllow: true, showTv: true, showGmCopy: true,
  monitorSC: "u-tv", monitorBM: "u-bm"
};

const nutzer = [
  { id: "u-gm", name: "Dungeonmaster", isGM: true, active: true },
  { id: "u-ich", name: "Nadylos", isGM: false, active: true },
  { id: "u-roxy", name: "Roxy", isGM: false, active: true },
  { id: "u-albrion", name: "Albrion", isGM: false, active: false },
  { id: "u-tv", name: "MonitorSC", isGM: false, active: true },
  { id: "u-bm", name: "MonitorBM", isGM: false, active: true }
];
nutzer.get = id => nutzer.find(u => u.id === id) ?? null;

const gezeigt = [];
const geflüstert = [];

globalThis.game = {
  user: { id: "u-ich", name: "Nadylos", isGM: false },
  users: nutzer,
  settings: { get: (_m, k) => einstellungen[k] },
  i18n: {
    localize: k => k,
    format: (k, d) => `${k}:${JSON.stringify(d)}`
  }
};
globalThis.ChatMessage = {
  create: m => geflüstert.push(m),
  getWhisperRecipients: () => ["u-gm"]
};
globalThis.foundry = {
  applications: { api: { ApplicationV2: class { }, HandlebarsApplicationMixin: B => class extends B { } } },
  documents: {
    collections: {
      Journal: { show: async (seite, opts) => gezeigt.push({ seite: seite.name, users: opts.users }) }
    }
  }
};
globalThis.localStorage = {
  daten: new Map(),
  getItem(k) { return this.daten.get(k) ?? null; },
  setItem(k, v) { this.daten.set(k, v); }
};

const Z = await import("../scripts/zeigen.js");

/* ── 1. Die Empfängerliste ───────────────────────────────────────── */

const liste = Z.empfaengerListe();
pruefe("nur Mitspieler und der Fernseher", liste.map(e => e.name),
  ["Albrion", "Roxy", "INPERSON.Show.Tv"]);
pruefe("der Fernseher steht zuletzt", liste.at(-1).fernseher, true);
pruefe("Abwesende stehen dabei, aber erkennbar", liste.find(e => e.name === "Albrion").aktiv, false);

einstellungen.showTv = false;
pruefe("ohne Fernseher-Schalter kein Fernseher", Z.empfaengerListe().map(e => e.name), ["Albrion", "Roxy"]);
einstellungen.showTv = true;

/* ── 2. Ohne Besitz geht nichts hinaus ───────────────────────────── */

const fremd = { name: "Geheimnis des Spielleiters", isOwner: false };
const meins = { name: "Brief des Barons", isOwner: true };

pruefe("fremde Seite wird nicht gezeigt", await Z.seiteZeigen(fremd, ["u-roxy"]), false);
pruefe("und nichts ist hinausgegangen", gezeigt.length, 0);
pruefe("ohne Empfänger passiert nichts", await Z.seiteZeigen(meins, []), false);

/* ── 3. Die eigene Seite geht an genau die Gewählten ──────────────── */

pruefe("eigene Seite wird gezeigt", await Z.seiteZeigen(meins, ["u-roxy", "u-tv"]), true);
pruefe("an genau diese Konten", gezeigt.at(-1), { seite: "Brief des Barons", users: ["u-roxy", "u-tv"] });

/* ── 4. Der Takt hält ────────────────────────────────────────────── */

pruefe("sofort noch einmal: nein", await Z.seiteZeigen(meins, ["u-roxy"]), false);
pruefe("es blieb bei einem Mal", gezeigt.length, 1);

Z.taktMerken(Date.now() - 6000);
pruefe("nach sechs Sekunden wieder frei", Z.taktFrei(), true);

/* ── 5. Die Spielleitung liest mit ───────────────────────────────── */

pruefe("eine geflüsterte Zeile", geflüstert.length, 1);
pruefe("und zwar nur an die Spielleitung", geflüstert[0].whisper, ["u-gm"]);

einstellungen.showGmCopy = false;
Z.taktMerken(Date.now() - 6000);
await Z.seiteZeigen(meins, ["u-roxy"]);
pruefe("abgeschaltet bleibt der Chat still", geflüstert.length, 1);
einstellungen.showGmCopy = true;

/* ── 6. Der Hauptschalter ────────────────────────────────────────── */

einstellungen.showAllow = false;
Z.taktMerken(Date.now() - 6000);
pruefe("ausgeschaltet zeigt niemand etwas", await Z.seiteZeigen(meins, ["u-roxy"]), false);

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
