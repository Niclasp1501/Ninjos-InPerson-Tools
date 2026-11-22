/**
 * Sichtschutz am eigenen Gerät: die Selbstblende und verschleierte Bereiche
 * des Bogens.
 *
 * Ninjo, 22.11.2026: Spieler sollen selbst eine Art Bildschirmschutz
 * anmachen können, wenn sie das Gerät nicht nutzen oder weggehen, „so ähnlich
 * wie die vom Dungeon Master gemachte Blende“, aber eigengesteuert, um die
 * Notizen vor neugierigen Blicken der Nachbarn zu schützen. Und der Spieler
 * soll sich selbst aussuchen, was er auf seinem Bogen verschwimmen lässt.
 *
 * **Zwei Dinge, zwei Speicherorte.**
 *   - Ob die Blende gerade steht, gehört zum Gerät: Ein Tablet, das neu lädt,
 *     steht wieder vor ihr, sonst wäre Neuladen der Weg daran vorbei. Also
 *     im Gerätespeicher.
 *   - Welche Bereiche verschwimmen und nach wie vielen Minuten Ruhe die
 *     Blende von selbst kommt, gehört zum Spieler. Das steht als Flag an
 *     seinem Benutzer und gilt auf jedem Gerät, an dem er sich anmeldet.
 *
 * **Die Blende der Spielleitung bleibt maßgeblich.** Sie kommt aus dem
 * Premium-Modul, liegt als eigener modaler `<dialog>` in der obersten Schicht
 * und holt sich nach oben, sobald ein anderer Dialog aufgeht. Diese hier
 * drängt sich nie über sie, und solange sie steht, kommt kein Tippen bis zu
 * unserem Knopf durch. Ein Spieler kann sich also abdecken, aber nie
 * aufdecken, was die Spielleitung abgedeckt hat.
 *
 * **Aufgehoben wird durch Halten, nicht durch Tippen.** Ein Tipp passiert aus
 * Versehen, ein Finger, der anderthalb Sekunden auf einem Knopf bleibt, nicht.
 *
 * Nur für Spieler: nicht für die Spielleitung, nicht für die beiden Monitore.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { isMonitorUser } from "./state.js";

const DIALOG_ID = "inperson-selbstblende";
const FLAG = "sichtschutz";
const HALTEN_MS = 1500;
/** So lange bleibt ein aufgedeckter Bereich offen, gemessen ab dem letzten Tippen darin. */
const AUFGEDECKT_MS = 30000;
const PREMIUM_BLENDE = "inpersonp-blende";

/**
 * Die Bereiche, die ein Spieler verschwimmen lassen kann.
 *
 * Je Bereich zwei Wähler: einer für Tidy5e (Reiter mit
 * `data-tab-contents-for`), einer für den Bogen von dnd5e selbst
 * (`.tab[data-tab]`). Die Regeln dazu stehen von Hand im Stylesheet; ein neuer
 * Bereich braucht dort seine Zeilen.
 *
 * Die Sprachschlüssel stehen ausgeschrieben da, damit der Prüfer sie sieht.
 */
export const BEREICHE = [
  { id: "actions",   icon: "fa-bolt",          titel: "INPERSON.Privacy.Area.Actions" },
  { id: "inventory", icon: "fa-sack-dollar",   titel: "INPERSON.Privacy.Area.Inventory" },
  { id: "spells",    icon: "fa-wand-sparkles", titel: "INPERSON.Privacy.Area.Spells" },
  { id: "features",  icon: "fa-star",          titel: "INPERSON.Privacy.Area.Features" },
  { id: "effects",   icon: "fa-person-rays",   titel: "INPERSON.Privacy.Area.Effects" },
  { id: "biography", icon: "fa-feather",       titel: "INPERSON.Privacy.Area.Biography" },
  { id: "notes",     icon: "fa-book-open",     titel: "INPERSON.Privacy.Area.Notes" }
];

/** Wo im Dokument ein Bereich steht. Für das Antippen, nicht für das Aussehen. */
const WAHL = {
  actions: '.sheet.actor [data-tab-contents-for="actions"]',
  inventory: '.sheet.actor [data-tab-contents-for="inventory"], .sheet.actor .tab[data-tab="inventory"]',
  spells: '.sheet.actor [data-tab-contents-for="spellbook"], .sheet.actor .tab[data-tab="spells"]',
  features: '.sheet.actor [data-tab-contents-for="features"], .sheet.actor .tab[data-tab="features"]',
  effects: '.sheet.actor [data-tab-contents-for="effects"], .sheet.actor .tab[data-tab="effects"]',
  biography: '.sheet.actor [data-tab-contents-for="biography"], .sheet.actor .tab[data-tab="biography"]',
  notes: ".inperson-eigene-notiz .window-content"
};

/** Wie viele Minuten Ruhe, bis die Blende von selbst kommt. 0 heißt nie. */
export const MINUTEN = [0, 2, 5, 10, 15];

/* ── Wer, und was er eingestellt hat ────────────────────────────── */

/** Bekommt dieses Konto den Sichtschutz überhaupt? */
export function sichtschutzFuer(user) {
  if (!user || user.isGM || isMonitorUser(user)) return false;
  try {
    return game.settings.get(MODULE_ID, SETTINGS.PRIVACY_ALLOW) !== false;
  } catch {
    return false;
  }
}

/**
 * Was der Spieler eingestellt hat, bereinigt.
 * @param {object} [roh] der Inhalt des Flags
 * @returns {{bereiche: string[], minuten: number}}
 */
export function wahlLesen(roh) {
  const ids = new Set(BEREICHE.map(b => b.id));
  const bereiche = Array.isArray(roh?.bereiche) ? [...new Set(roh.bereiche.filter(b => ids.has(b)))] : [];
  const minuten = MINUTEN.includes(Number(roh?.minuten)) ? Number(roh.minuten) : 0;
  return { bereiche, minuten };
}

function meineWahl() {
  return wahlLesen(game.user?.getFlag?.(MODULE_ID, FLAG));
}

async function wahlSpeichern(neu) {
  const wahl = wahlLesen({ ...meineWahl(), ...neu });
  await game.user.setFlag(MODULE_ID, FLAG, wahl);
  return wahl;
}

const text = schluessel => game.i18n.localize(schluessel);

/* ── Die Blende ─────────────────────────────────────────────────── */

const speicherKey = () => `${MODULE_ID}.selbstblende.${game.user.id}`;

function gemerkt() {
  try { return localStorage.getItem(speicherKey()) === "1"; } catch { return false; }
}

function merken(an) {
  try {
    if (an) localStorage.setItem(speicherKey(), "1");
    else localStorage.removeItem(speicherKey());
  } catch { /* ohne Gerätespeicher gilt die Blende bis zum Neuladen */ }
}

let _element = null;
let _offen = false;
let _waechter = null;

/** Steht die Blende der Spielleitung gerade über diesem Gerät? */
function premiumBlendeOffen() {
  return !!document.getElementById(PREMIUM_BLENDE)?.open;
}

function logoAdresse() {
  let pfad = "";
  try { pfad = game.settings.get(MODULE_ID, SETTINGS.IDLE_LOGO) || ""; } catch { }
  if (!pfad) return "";
  if (/^(https?:|data:|blob:)/i.test(pfad)) return pfad;
  return foundry.utils.getRoute(pfad.replace(/^\/+/, ""));
}

function bauen() {
  if (_element) return _element;
  const el = document.createElement("dialog");
  el.id = DIALOG_ID;
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", text("INPERSON.Privacy.CoverAria"));
  // Der Fokus geht auf die Blende selbst, nicht auf den Knopf: Sonst stünde
  // um ihn gleich ein Fokusring, als wäre er schon halb gedrückt.
  el.tabIndex = -1;
  el.autofocus = true;

  const ziel = logoAdresse();
  if (ziel) {
    const bild = document.createElement("img");
    bild.alt = "";
    bild.draggable = false;
    bild.addEventListener("load", () => bild.classList.add("ist-geladen"));
    bild.src = ziel;
    el.append(bild);
  }

  const satz = document.createElement("p");
  satz.className = "inperson-selbstblende-text";
  satz.textContent = text("INPERSON.Privacy.CoverText");
  el.append(satz);

  const knopf = document.createElement("button");
  knopf.type = "button";
  knopf.className = "inperson-selbstblende-halten";
  knopf.setAttribute("aria-label", text("INPERSON.Privacy.HoldToOpen"));
  knopf.innerHTML = `<i class="fa-solid fa-lock-open" aria-hidden="true"></i><span>${text("INPERSON.Privacy.HoldToOpen")}</span>`;
  haltenEinrichten(knopf);
  el.append(knopf);

  // Escape und die Zurück-Geste melden sich als cancel; die Blende bleibt.
  el.addEventListener("cancel", event => event.preventDefault());
  el.addEventListener("close", () => sichern());
  _element = el;
  return el;
}

/**
 * Halten statt tippen. Der Ring füllt sich, solange der Finger bleibt;
 * hebt er ab, rutscht ab oder kommt ein zweiter dazu, fängt es von vorn an.
 * Mit der Tastatur: Leertaste oder Eingabe gedrückt halten.
 */
function haltenEinrichten(knopf) {
  let start = 0;
  let bild = 0;
  const zuruecksetzen = () => {
    start = 0;
    cancelAnimationFrame(bild);
    knopf.style.setProperty("--inperson-halten", "0");
    knopf.classList.remove("wird-gehalten");
  };
  const schritt = () => {
    if (!start) return;
    const anteil = Math.min(1, (performance.now() - start) / HALTEN_MS);
    knopf.style.setProperty("--inperson-halten", String(anteil));
    if (anteil >= 1) {
      zuruecksetzen();
      selbstblendeAufheben();
      return;
    }
    bild = requestAnimationFrame(schritt);
  };
  const los = () => {
    if (start || premiumBlendeOffen()) return;
    start = performance.now();
    knopf.classList.add("wird-gehalten");
    bild = requestAnimationFrame(schritt);
  };
  knopf.addEventListener("pointerdown", event => {
    if (!event.isPrimary) return zuruecksetzen();
    event.preventDefault();
    knopf.setPointerCapture?.(event.pointerId);
    los();
  });
  for (const art of ["pointerup", "pointercancel", "lostpointercapture"]) knopf.addEventListener(art, zuruecksetzen);
  knopf.addEventListener("contextmenu", event => event.preventDefault());
  knopf.addEventListener("keydown", event => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) los();
  });
  knopf.addEventListener("keyup", zuruecksetzen);
  knopf.addEventListener("blur", zuruecksetzen);
}

/** Tastenkürzel des Browsers bleiben, alles andere erreicht Foundry nicht. */
function abfangen(event) {
  if (_element?.contains(event.target)) return;
  event.stopImmediatePropagation();
  const browser = event.type.startsWith("key") && (event.ctrlKey || event.metaKey || /^F\d+$/.test(event.key));
  if (event.cancelable && !browser) event.preventDefault();
}

const ABGEFANGEN = [
  "keydown", "keypress", "pointerdown", "pointerup", "mousedown", "mouseup", "click", "dblclick",
  "auxclick", "contextmenu", "dragstart", "touchstart", "touchmove", "touchend", "wheel"
];

/**
 * Die Blende ist offen und liegt oben. Außer unter der Blende der
 * Spielleitung: Die ist maßgeblich, sie holt sich selbst nach oben, und wir
 * holen uns nicht darüber.
 */
function sichern(aenderungen = []) {
  if (!_offen || !_element) return;
  if (!_element.isConnected) document.body.appendChild(_element);
  const fremd = aenderungen.some(a => a.target !== _element && a.target.localName === "dialog" && a.target.open);
  if (_element.open && !fremd) return;
  if (_element.open && premiumBlendeOffen()) return;
  try {
    if (_element.open) _element.close();
    _element.showModal();
    // showModal setzt den Fokus trotz autofocus auf den Knopf (gemessen in
    // Chrome); von Hand zurück auf die Blende.
    _element.focus({ preventScroll: true });
  } catch (fehler) {
    console.warn(`${MODULE_ID} | Die Selbstblende ließ sich nicht modal öffnen.`, fehler);
    _element.setAttribute("open", "");
  }
}

function zeigen() {
  if (_offen) return;
  bauen();
  _offen = true;
  bereicheZudecken();
  // Ein Modul, das direkte Kinder von <body> mit !important versteckt, schlägt
  // nur eine Angabe am Element selbst.
  _element.style.setProperty("display", "flex", "important");
  sichern();
  for (const art of ABGEFANGEN) window.addEventListener(art, abfangen, { capture: true, passive: false });
  _waechter = new MutationObserver(aenderungen => sichern(aenderungen));
  _waechter.observe(document.body, { childList: true });
  _waechter.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["open"] });
}

function verbergen() {
  if (!_offen) return;
  _offen = false;
  _waechter?.disconnect();
  _waechter = null;
  for (const art of ABGEFANGEN) window.removeEventListener(art, abfangen, { capture: true });
  _element.style.removeProperty("display");
  if (_element.open) _element.close();
  _element.removeAttribute("open");
  ruheNeuStarten();
}

/** Das eigene Gerät abdecken. */
export function selbstblendeSetzen() {
  if (!sichtschutzFuer(game.user)) return false;
  merken(true);
  zeigen();
  return true;
}

/** Wieder aufdecken. Unter der Blende der Spielleitung geschieht nichts. */
export function selbstblendeAufheben() {
  if (premiumBlendeOffen()) return false;
  merken(false);
  verbergen();
  return true;
}

export const selbstblendeAktiv = () => _offen;

/* ── Von selbst nach Ruhe ───────────────────────────────────────── */

let _ruhe = null;
const AKTIVITAET = ["pointerdown", "keydown", "wheel", "touchstart"];

function ruheNeuStarten() {
  clearTimeout(_ruhe);
  _ruhe = null;
  if (_offen || !sichtschutzFuer(game.user)) return;
  const minuten = meineWahl().minuten;
  if (!minuten) return;
  _ruhe = setTimeout(() => selbstblendeSetzen(), minuten * 60000);
}

/* ── Verschleierte Bereiche ─────────────────────────────────────── */

/** Bereich → Zeitgeber, solange er aufgedeckt ist. */
const _aufgedeckt = new Map();

/**
 * Die Klassen am `body`. Das Aussehen steht im Stylesheet; der Bogen selbst
 * wird nicht angefasst, denn Tidy5e zeichnet seine Reiter neu und nähme
 * eine Klasse am Reiter beim nächsten Zeichnen wieder mit.
 */
export function bereicheAnwenden() {
  const an = sichtschutzFuer(game.user);
  const gewaehlt = an ? meineWahl().bereiche : [];
  const body = document.body;
  if (!body) return;
  for (const { id } of BEREICHE) {
    body.classList.toggle(`inperson-schutz-${id}`, gewaehlt.includes(id));
    if (!gewaehlt.includes(id)) zudecken(id);
  }
  body.style.setProperty("--inperson-schutz-text", JSON.stringify(text("INPERSON.Privacy.TapToReveal")));
}

function aufdecken(id) {
  clearTimeout(_aufgedeckt.get(id));
  _aufgedeckt.set(id, setTimeout(() => zudecken(id), AUFGEDECKT_MS));
  document.body.classList.add(`inperson-schutz-offen-${id}`);
}

function zudecken(id) {
  clearTimeout(_aufgedeckt.get(id));
  _aufgedeckt.delete(id);
  document.body?.classList.remove(`inperson-schutz-offen-${id}`);
}

function bereicheZudecken() {
  for (const id of [..._aufgedeckt.keys()]) zudecken(id);
}

/** In welchem gewählten Bereich liegt dieses Element? */
function bereichVon(ziel, nurVerdeckt) {
  if (!(ziel instanceof Element)) return null;
  for (const id of meineWahl().bereiche) {
    if (nurVerdeckt && _aufgedeckt.has(id)) continue;
    if (!nurVerdeckt && !_aufgedeckt.has(id)) continue;
    if (ziel.closest(WAHL[id])) return id;
  }
  return null;
}

/**
 * Ein Tipp auf einen verschwommenen Bereich deckt ihn auf und tut sonst
 * nichts: Er drückt keinen Knopf darin, den man nicht sehen konnte. Ein Tipp
 * in einem aufgedeckten Bereich hält ihn offen.
 */
function beimTippen(event) {
  if (_offen || !sichtschutzFuer(game.user)) return;
  const verdeckt = bereichVon(event.target, true);
  if (verdeckt) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "click") aufdecken(verdeckt);
    return;
  }
  const offen = bereichVon(event.target, false);
  if (offen) aufdecken(offen);
}

/** Eigene Notizen erkennt man am Besitz. Was die Spielleitung zeigt, bleibt klar. */
function notizMarkieren(app) {
  const doc = app?.document;
  if (doc?.documentName !== "JournalEntry" || game.user.isGM) return;
  app.element?.classList.toggle("inperson-eigene-notiz", !!doc.isOwner);
}

/* ── Die Einstellungen des Spielers ─────────────────────────────── */

/**
 * Was im Feld der Blattansicht steht: abdecken, die Bereiche, die Minuten.
 * Gebaut hier, damit die Blattansicht nur einen Knopf kennt.
 * @param {HTMLElement} feld
 * @param {{schalterZeile: Function}} helfer
 */
export function sichtschutzFeldFuellen(feld, { schalterZeile, nachAbdecken = null }) {
  const jetzt = document.createElement("button");
  jetzt.type = "button";
  jetzt.className = "inperson-sv-feldknopf";
  jetzt.innerHTML = `<i class="fa-solid fa-user-lock" aria-hidden="true"></i><span>${text("INPERSON.Privacy.CoverNow")}</span>`;
  jetzt.addEventListener("click", () => {
    nachAbdecken?.();
    selbstblendeSetzen();
  });
  feld.append(jetzt);

  const ueber = document.createElement("p");
  ueber.className = "inperson-sv-feldtitel";
  ueber.textContent = text("INPERSON.Privacy.BlurTitle");
  feld.append(ueber);

  const wahl = meineWahl();
  for (const b of BEREICHE) {
    feld.append(schalterZeile({
      icon: b.icon, titel: b.titel,
      wert: wahl.bereiche.includes(b.id),
      bei: async an => {
        const jetzig = new Set(meineWahl().bereiche);
        if (an) jetzig.add(b.id); else jetzig.delete(b.id);
        await wahlSpeichern({ bereiche: [...jetzig] });
      }
    }));
  }

  const zeile = document.createElement("label");
  zeile.className = "inperson-sv-auswahl";
  const name = text("INPERSON.Privacy.AutoCover");
  zeile.innerHTML = `<i class="fa-solid fa-hourglass-half" aria-hidden="true"></i><span>${name}</span>`;
  const auswahl = document.createElement("select");
  auswahl.setAttribute("aria-label", name);
  for (const m of MINUTEN) {
    const o = document.createElement("option");
    o.value = String(m);
    o.textContent = m ? game.i18n.format("INPERSON.Privacy.AfterMinutes", { minutes: m }) : text("INPERSON.Privacy.Never");
    o.selected = m === wahl.minuten;
    auswahl.append(o);
  }
  auswahl.addEventListener("change", () => wahlSpeichern({ minuten: Number(auswahl.value) }));
  zeile.append(auswahl);
  feld.append(zeile);
}

/* ── Einrichten ─────────────────────────────────────────────────── */

/** Bei `setup`: Ein abgedecktes Tablet, das neu lädt, zeigt nichts, bevor die Blende steht. */
export function sichtschutzFrueh() {
  if (gemerkt() && sichtschutzFuer(game.user)) zeigen();
}

/** Die Einstellung der Spielleitung hat sich geändert. */
export function sichtschutzAbgleichen() {
  if (!sichtschutzFuer(game.user)) {
    merken(false);
    verbergen();
  }
  bereicheAnwenden();
  ruheNeuStarten();
}

export function installSichtschutz() {
  bereicheAnwenden();
  if (gemerkt() && sichtschutzFuer(game.user)) zeigen();
  ruheNeuStarten();

  for (const art of AKTIVITAET) {
    window.addEventListener(art, () => { if (!_offen && _ruhe) ruheNeuStarten(); }, { capture: true, passive: true });
  }
  document.addEventListener("pointerdown", beimTippen, true);
  document.addEventListener("click", beimTippen, true);

  Hooks.on("updateUser", (user, changes) => {
    if (user.id !== game.user.id) return;
    if (changes.flags?.[MODULE_ID]?.[FLAG] === undefined && !("character" in changes)) return;
    bereicheAnwenden();
    ruheNeuStarten();
  });
  Hooks.on("renderJournalEntrySheet", app => notizMarkieren(app));
}

/** Was unter `api.privacy` steht, für Makros. */
export const sichtschutzApi = {
  cover: selbstblendeSetzen,
  uncover: selbstblendeAufheben,
  isCovered: selbstblendeAktiv
};
