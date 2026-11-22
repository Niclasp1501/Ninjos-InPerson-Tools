/**
 * Prüft den Sichtschutz am eigenen Gerät und die Monitoranzeige.
 *
 * Was am Tisch schiefgehen könnte und man am Tablet nicht sieht:
 *
 *   - Wer den Sichtschutz bekommt: Spieler ja, Spielleitung und Monitore nie,
 *     und niemand, wenn die Spielleitung ihn verbietet.
 *   - Dass die Blende unter der Blende der Spielleitung nicht aufgeht.
 *   - Dass ein Neuladen die Blende nicht aufhebt.
 *   - Dass eine kaputte oder alte Wahl im Flag keinen Fehler wirft.
 *   - Welche Teile ein Monitor ausblendet, und dass bei laufendem Monk's
 *     Common Display gar nichts geschieht.
 *   - Dass nur die Spielleitung die Monitore zum Schließen bringt.
 *
 * node tools/test-sichtschutz.mjs
 */

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const a = JSON.stringify(ist), b = JSON.stringify(soll);
  const gut = a === b;
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${a}\n    soll: ${b}`}`);
};

/* ── Ein Foundry und ein Dokument, so klein wie es sein darf ─────── */

const einstellungen = {
  privacyAllow: true, monitorSC: "u-tv", monitorBM: "u-bm", idleLogo: "",
  monitorUi: { sc: ["sidebar", "hotbar"], bm: ["controls"] }, monitorShowLarge: true,
  monitorCloseImage: 0, monitorCloseJournal: 0
};

class Klassen {
  constructor() { this.s = new Set(); }
  add(...k) { k.forEach(x => this.s.add(x)); }
  remove(...k) { k.forEach(x => this.s.delete(x)); }
  toggle(k, an) { if (an === undefined) an = !this.s.has(k); if (an) this.s.add(k); else this.s.delete(k); return an; }
  contains(k) { return this.s.has(k); }
}

class Element {
  constructor(tag) {
    this.localName = tag; this.classList = new Klassen(); this.kinder = []; this.attr = {};
    this.style = { werte: {}, setProperty(k, v) { this.werte[k] = v; }, removeProperty(k) { delete this.werte[k]; } };
    this.dataset = {}; this.open = false; this.isConnected = false; this.hoerer = {};
  }
  append(...k) { this.kinder.push(...k); k.forEach(x => { if (x && typeof x === "object") x.isConnected = this.isConnected; }); }
  appendChild(k) { this.append(k); return k; }
  setAttribute(k, v) { this.attr[k] = String(v); }
  removeAttribute(k) { delete this.attr[k]; if (k === "open") this.open = false; }
  getAttribute(k) { return this.attr[k] ?? null; }
  addEventListener(art, fn) { (this.hoerer[art] ??= []).push(fn); }
  contains(x) { return x === this || this.kinder.some(k => k === x || k?.contains?.(x)); }
  showModal() { this.open = true; }
  focus() { }
  close() { this.open = false; }
  set innerHTML(_v) { }
  set textContent(v) { this.text = v; }
}
globalThis.Element = Element;

const body = new Element("body");
body.isConnected = true;
const premium = new Element("dialog");
premium.id = "inpersonp-blende";
globalThis.document = {
  body,
  documentElement: new Element("html"),
  createElement: tag => new Element(tag),
  getElementById: id => (id === "inpersonp-blende" && premiumDa ? premium : null),
  addEventListener() { }
};
let premiumDa = false;
globalThis.window = { addEventListener() { }, removeEventListener() { } };
globalThis.MutationObserver = class { observe() { } disconnect() { } };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => { };

const speicher = new Map();
globalThis.localStorage = {
  getItem: k => speicher.get(k) ?? null,
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: k => speicher.delete(k)
};

let flag = null;
const gesendet = [];
const nutzer = [
  { id: "u-gm", name: "Dungeonmaster", isGM: true },
  { id: "u-ich", name: "Nadylos", isGM: false },
  { id: "u-tv", name: "MonitorSC", isGM: false },
  { id: "u-bm", name: "MonitorBM", isGM: false }
];
nutzer.get = id => nutzer.find(u => u.id === id) ?? null;
const ich = {
  id: "u-ich", name: "Nadylos", isGM: false,
  getFlag: () => flag,
  setFlag: async (_m, _k, v) => { flag = v; }
};
const module = new Map([["monks-common-display", { active: false }]]);
globalThis.game = {
  user: ich,
  users: nutzer,
  modules: module,
  settings: { get: (_m, k) => einstellungen[k] },
  i18n: { localize: k => k, format: (k, d) => `${k}:${JSON.stringify(d)}` },
  socket: { emit: (_n, d) => gesendet.push(d) }
};
globalThis.foundry = { utils: { getRoute: p => `/${p}` }, applications: { instances: new Map() } };
globalThis.Hooks = { on() { }, once() { } };

const S = await import("../scripts/sichtschutz.js");
const M = await import("../scripts/monitoranzeige.js");

/* ── 1. Wer den Sichtschutz bekommt ──────────────────────────────── */

pruefe("ein Spieler bekommt ihn", S.sichtschutzFuer(ich), true);
pruefe("die Spielleitung nicht", S.sichtschutzFuer(nutzer.get("u-gm")), false);
pruefe("der Szenen-Monitor nicht", S.sichtschutzFuer(nutzer.get("u-tv")), false);
pruefe("der Karten-Monitor nicht", S.sichtschutzFuer(nutzer.get("u-bm")), false);
einstellungen.privacyAllow = false;
pruefe("verboten bekommt ihn niemand", S.sichtschutzFuer(ich), false);
pruefe("und Abdecken geschieht nicht", S.selbstblendeSetzen(), false);
einstellungen.privacyAllow = true;

/* ── 2. Die Wahl im Flag ─────────────────────────────────────────── */

pruefe("nichts gespeichert: nichts verschwommen, nie von selbst", S.wahlLesen(undefined), { bereiche: [], minuten: 0 });
pruefe("Unbekanntes und Doppeltes fliegt raus",
  S.wahlLesen({ bereiche: ["inventory", "geheim", "inventory", "spells"], minuten: 5 }),
  { bereiche: ["inventory", "spells"], minuten: 5 });
pruefe("krumme Minuten zählen als nie", S.wahlLesen({ bereiche: "inventory", minuten: 7 }), { bereiche: [], minuten: 0 });

flag = { bereiche: ["inventory", "notes"], minuten: 0 };
S.bereicheAnwenden();
pruefe("gewählte Bereiche stehen am body",
  ["inventory", "notes", "spells"].map(b => body.classList.contains(`inperson-schutz-${b}`)), [true, true, false]);
pruefe("der Hinweistext liegt als CSS-Zeichenkette bereit",
  body.style.werte["--inperson-schutz-text"], JSON.stringify("INPERSON.Privacy.TapToReveal"));

/* ── 3. Die Blende ───────────────────────────────────────────────── */

pruefe("abdecken klappt", S.selbstblendeSetzen(), true);
pruefe("sie steht", S.selbstblendeAktiv(), true);
pruefe("und ist gemerkt, ein Neuladen hebt sie nicht auf", speicher.get("ninjos-inperson-tools.selbstblende.u-ich"), "1");

premiumDa = true; premium.open = true;
pruefe("unter der Blende der Spielleitung geht sie nicht auf", S.selbstblendeAufheben(), false);
pruefe("sie steht weiter", S.selbstblendeAktiv(), true);
premium.open = false; premiumDa = false;

pruefe("ohne Blende der Spielleitung geht sie auf", S.selbstblendeAufheben(), true);
pruefe("sie steht nicht mehr", S.selbstblendeAktiv(), false);
pruefe("und das Gerät hat sie vergessen", speicher.has("ninjos-inperson-tools.selbstblende.u-ich"), false);

speicher.set("ninjos-inperson-tools.selbstblende.u-ich", "1");
S.sichtschutzFrueh();
pruefe("ein abgedecktes Tablet steht nach dem Neuladen gleich wieder abgedeckt", S.selbstblendeAktiv(), true);
einstellungen.privacyAllow = false;
S.sichtschutzAbgleichen();
pruefe("verbietet die Spielleitung es, geht die Blende auf", S.selbstblendeAktiv(), false);
pruefe("und die Bereiche sind wieder klar", body.classList.contains("inperson-schutz-inventory"), false);
einstellungen.privacyAllow = true;

/* ── 4. Die Monitore ─────────────────────────────────────────────── */

pruefe("ohne gespeicherte Wahl ist auf beiden Monitoren alles aus",
  M.teileLesen(null).sc.length === M.TEILE.length && M.teileLesen(null).bm.length === M.TEILE.length, true);
pruefe("unbekannte Teile fliegen raus", M.teileLesen({ sc: ["sidebar", "kaffee"], bm: [] }), { sc: ["sidebar"], bm: [] });

pruefe("ein Spieler ist kein Monitor", M.hierGilt(ich), { teile: [], gross: false, art: null });
pruefe("der Szenen-Monitor blendet seine Teile aus", M.hierGilt(nutzer.get("u-tv")), { teile: ["sidebar", "hotbar"], gross: true, art: "sc" });
pruefe("der Karten-Monitor seine", M.hierGilt(nutzer.get("u-bm")).teile, ["controls"]);

game.user = nutzer.get("u-tv");
M.monitorAnzeigeAnwenden();
pruefe("am body des Szenen-Monitors",
  ["sidebar", "hotbar", "controls"].map(t => body.classList.contains(`inperson-ui-aus-${t}`)), [true, true, false]);

module.get("monks-common-display").active = true;
M.monitorAnzeigeAnwenden();
pruefe("läuft Common Display, blendet In-Person nichts aus",
  M.TEILE.some(t => body.classList.contains(`inperson-ui-aus-${t.id}`)) || body.classList.contains("inperson-gezeigt-gross"), false);
module.get("monks-common-display").active = false;

/* ── 5. Schließen auf den Monitoren ──────────────────────────────── */

let zu = 0;
class ImagePopout { close() { zu++; return Promise.resolve(); } }
foundry.applications.apps = { ImagePopout };
const journal = { document: { documentName: "JournalEntry" }, close() { zu++; return Promise.resolve(); } };
const blatt = { document: { documentName: "Actor" }, close() { zu += 100; return Promise.resolve(); } };
foundry.applications.instances = new Map([["a", new ImagePopout()], ["b", journal], ["c", blatt]]);

game.user = ich;
pruefe("ein Spieler kann die Monitore nicht schließen lassen", M.aufMonitorenSchliessen(), false);
game.user = nutzer.get("u-gm");
pruefe("die Spielleitung schon", M.aufMonitorenSchliessen(), true);
pruefe("die Nachricht geht hinaus", gesendet.at(-1).type, "monitorClose");

game.user = nutzer.get("u-tv");
M.monitorSocket({ type: "monitorClose", von: "u-ich" });
await new Promise(r => setTimeout(r, 0));
pruefe("von einem Spieler geschickt: nichts geht zu", zu, 0);
M.monitorSocket({ type: "monitorClose", von: "u-gm" });
await new Promise(r => setTimeout(r, 0));
pruefe("von der Spielleitung: Bild und Journal zu, der Bogen bleibt", zu, 2);

zu = 0;
game.user = ich;
M.monitorSocket({ type: "monitorClose", von: "u-gm" });
await new Promise(r => setTimeout(r, 0));
pruefe("bei einem Spieler schließt die Nachricht nichts", zu, 0);

/* ── 6. Das Einrichtungsfenster ──────────────────────────────────── */

globalThis.foundry.applications.api = { ApplicationV2: class { }, HandlebarsApplicationMixin: B => class extends B { } };
const { monitorTeileAuswerten } = await import("../scripts/einrichten.js");
pruefe("aus den Häkchen die Liste je Monitor",
  monitorTeileAuswerten({ "ui.sc.sidebar": true, "ui.sc.chat": true, "ui.bm.foreign": true, "ui.bm.chat": false }),
  { sc: ["sidebar", "chat"], bm: ["foreign"] });
pruefe("ohne Häkchen bleibt alles sichtbar", monitorTeileAuswerten({}), { sc: [], bm: [] });

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
