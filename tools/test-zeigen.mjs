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
  { id: "u-roxy", name: "Roxy", isGM: false, active: true, character: { name: "Ayla" } },
  { id: "u-albrion", name: "Albrion", isGM: false, active: false },
  { id: "u-tv", name: "MonitorSC", isGM: false, active: true },
  { id: "u-bm", name: "MonitorBM", isGM: false, active: true }
];
nutzer.get = id => nutzer.find(u => u.id === id) ?? null;

const gezeigt = [];
const geflüstert = [];
const gesendet = [];

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
globalThis.game.socket = { emit: (_kanal, n) => gesendet.push(n) };
globalThis.foundry = {
  utils: { randomID: () => "t-" + gesendet.length },
  applications: {
    api: { ApplicationV2: class { render() { } }, HandlebarsApplicationMixin: B => class extends B { } },
    instances: new Map()
  },
  documents: {
    collections: {
      Journal: {
        show: async (seite, opts) => gezeigt.push({ seite: seite.name, users: opts.users, force: opts.force }),
        showImage: (src, opts) => gezeigt.push({ bild: src, users: opts.users, title: opts.title })
      }
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
  ["Albrion", "Ayla", "INPERSON.Show.Tv"]);
pruefe("die Figur zuerst, das Konto dahinter", liste.find(e => e.id === "u-roxy").konto, "Roxy");
pruefe("ohne Figur bleibt die Anmeldung, ohne Zusatz", liste.find(e => e.id === "u-albrion").konto, "");
pruefe("der Fernseher steht zuletzt", liste.at(-1).fernseher, true);
pruefe("Abwesende stehen dabei, aber erkennbar", liste.find(e => e.name === "Albrion").aktiv, false);

einstellungen.showTv = false;
pruefe("ohne Fernseher-Schalter kein Fernseher", Z.empfaengerListe().map(e => e.name), ["Albrion", "Ayla"]);
einstellungen.showTv = true;

/* ── 2. Ohne Besitz geht nichts hinaus ───────────────────────────── */

const fremd = { name: "Geheimnis des Spielleiters", isOwner: false };
const meins = { name: "Brief des Barons", isOwner: true };

pruefe("fremde Seite wird nicht gezeigt", await Z.zeigenStarten(fremd, ["u-roxy"]), null);
pruefe("und nichts ist hinausgegangen", gezeigt.length, 0);
pruefe("ohne Empfänger passiert nichts", await Z.zeigenStarten(meins, []), null);

/* ── 3. Menschen werden gefragt, der Fernseher nicht ─────────────── */

const vorgang = await Z.zeigenStarten(meins, ["u-roxy", "u-tv"]);
pruefe("der Vorgang läuft", !!vorgang, true);
pruefe("der Fernseher bekommt die Seite sofort, auch ohne eigene Rechte", gezeigt.at(-1), { seite: "Brief des Barons", users: ["u-tv"], force: true });
pruefe("der Mensch bekommt erst ein Angebot", gesendet.at(-1).type, "showOffer");
pruefe("und zwar nur er", gesendet.at(-1).an, ["u-roxy"]);
pruefe("sein Stand ist offen", vorgang.stand.get("u-roxy"), "gefragt");
pruefe("der Fernseher sieht schon zu", vorgang.stand.get("u-tv"), "sieht");

/* ── 4. Der Takt hält ────────────────────────────────────────────── */

pruefe("sofort noch einmal: nein", await Z.zeigenStarten(meins, ["u-roxy"]), null);
pruefe("es blieb bei einem Mal", gezeigt.length, 1);

Z.taktMerken(Date.now() - 6000);
pruefe("nach sechs Sekunden wieder frei", Z.taktFrei(), true);

/* ── 5. Die Spielleitung liest mit ───────────────────────────────── */

pruefe("eine geflüsterte Zeile", geflüstert.length, 1);
pruefe("und zwar nur an die Spielleitung", geflüstert[0].whisper, ["u-gm"]);

einstellungen.showGmCopy = false;
Z.taktMerken(Date.now() - 6000);
await Z.zeigenStarten(meins, ["u-roxy"]);
pruefe("abgeschaltet bleibt der Chat still", geflüstert.length, 1);
einstellungen.showGmCopy = true;

/* ── 6. Der Hauptschalter ────────────────────────────────────────── */

einstellungen.showAllow = false;
Z.taktMerken(Date.now() - 6000);
pruefe("ausgeschaltet zeigt niemand etwas", await Z.zeigenStarten(meins, ["u-roxy"]), null);

/* ── 7. Wer darf das Zeigen beenden ──────────────────────────────── */

const offen = { token: "t-1", von: "u-ich", seiteUuid: "x", name: "Brief" };

pruefe("der Zeigende darf beenden",
  Z.darfSchliessen({ token: "t-1", von: "u-ich" }, offen), true);
pruefe("die Spielleitung darf beenden",
  Z.darfSchliessen({ token: "t-1", von: "u-gm", gm: true }, offen), true);
pruefe("ein anderer Mitspieler nicht",
  Z.darfSchliessen({ token: "t-1", von: "u-roxy" }, offen), false);
pruefe("eine fremde Kennung nicht",
  Z.darfSchliessen({ token: "t-9", von: "u-ich" }, offen), false);
pruefe("ohne laufenden Vorgang nichts",
  Z.darfSchliessen({ token: "t-1", von: "u-ich" }, null), false);

/* ── 8. Beenden geht an alle ─────────────────────────────────────── */

einstellungen.showAllow = true;
Z.taktMerken(Date.now() - 6000);
await Z.zeigenStarten(meins, ["u-roxy"]);
gesendet.length = 0;
pruefe("beenden meldet sich", Z.zeigenBeenden(), true);
pruefe("und zwar als Schliessen", gesendet.at(-1).type, "showClose");
pruefe("ohne Vorgang gibt es nichts zu beenden", Z.zeigenBeenden(), false);

/* ── 9. Bilder: nur die Spielleitung, und erst gefragt ───────────── */

const fenster = {
  options: {
    src: "worlds/x/karte.webp",
    window: { title: "Karte der Bucht" },
    caption: "",
    uuid: "JournalEntry.j1.JournalEntryPage.p1"
  }
};
const bild = Z.bildAusFenster(fenster);
pruefe("aus dem Bildfenster wird ein Bild", [bild.art, bild.src, bild.name], ["bild", "worlds/x/karte.webp", "Karte der Bucht"]);
pruefe("ohne Datei kein Bild", Z.bildAusFenster({ options: {} }), null);
pruefe("ohne Titel heißt es wie die Datei", Z.bildAusFenster({ options: { src: "a/b/c.png", window: {} } }).name, "c.png");

Z.taktMerken(Date.now() - 6000);
pruefe("ein Spieler zeigt kein Bild", await Z.zeigenStarten(bild, ["u-roxy"]), null);

game.user = { id: "u-gm", name: "Dungeonmaster", isGM: true };
// Das Dokument hinter dem Bild kennt Roxy, Albrion nicht.
foundry.utils.fromUuidSync = () => ({ testUserPermission: u => u.id === "u-roxy" });

gezeigt.length = 0; gesendet.length = 0; const flüsternVorher = geflüstert.length;
Z.taktMerken(Date.now() - 6000);
const bildVorgang = await Z.zeigenStarten(bild, ["u-roxy", "u-tv"]);
pruefe("die Spielleitung zeigt das Bild", !!bildVorgang, true);
pruefe("der Fernseher bekommt es sofort", gezeigt.at(-1), { bild: "worlds/x/karte.webp", users: ["u-tv"], title: "Karte der Bucht" });
pruefe("der Mensch wird gefragt", [gesendet.at(-1).type, gesendet.at(-1).an], ["showOffer", ["u-roxy"]]);
pruefe("das Angebot nennt die Datei", gesendet.at(-1).bildSrc, "worlds/x/karte.webp");
pruefe("und den Titel, den Roxy ohnehin sähe", gesendet.at(-1).name, "Karte der Bucht");
pruefe("die Spielleitung flüstert sich nichts selbst", geflüstert.length, flüsternVorher);

pruefe("Titel verdeckt, wenn einer ihn nicht sähe", Z.bildNameFuer(bild, ["u-roxy", "u-albrion"]), null);
pruefe("showTitle aus verdeckt immer", Z.bildNameFuer({ ...bild, showTitle: false }, ["u-roxy"]), null);
pruefe("showTitle an zeigt immer", Z.bildNameFuer({ ...bild, showTitle: true }, ["u-albrion"]), "Karte der Bucht");

// Roxy sagt ja: erst jetzt geht das Bild an sie, und nur an sie.
await Z.zeigenSocket({ type: "showAnswer", an: "u-gm", token: bildVorgang.token, von: "u-roxy", antwort: "ja" });
pruefe("nach dem Ja bekommt Roxy das Bild", gezeigt.at(-1).users, ["u-roxy"]);
pruefe("ihr Stand ist sieht zu", bildVorgang.stand.get("u-roxy"), "sieht");

// Beim Empfänger: das Schliessen macht genau dieses Bild zu.
game.user = { id: "u-roxy", name: "Roxy", isGM: false };
await Z.zeigenSocket({ type: "showOffer", an: ["u-roxy"], token: "t-bild", von: "u-gm", bildSrc: "worlds/x/karte.webp", name: null });
let zu = [];
class ImagePopout { constructor(src) { this.options = { src }; } close() { zu.push(this.options.src); } }
foundry.applications.apps = { ImagePopout };
foundry.applications.instances = new Map([
  ["a", new ImagePopout("worlds/x/karte.webp")],
  ["b", new ImagePopout("worlds/x/anderes.webp")]
]);
await Z.zeigenSocket({ type: "showClose", token: "t-bild", von: "u-gm", gm: true });
pruefe("beim Empfänger geht nur das gezeigte Bild zu", zu, ["worlds/x/karte.webp"]);

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
