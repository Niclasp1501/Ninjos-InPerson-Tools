/**
 * Die Blattansicht: der Bildschirm gehört dem Charakterblatt.
 *
 * Entwurf und Begründungen stehen in KONZEPT-blattansicht.md. Was hier zählt:
 *
 * **Verdecken, nicht umbauen.** Foundrys Oberfläche bleibt vollständig da und
 * funktionsfähig, sie wird nur nicht gezeigt. Module, die Teile davon
 * voraussetzen, laufen weiter — und wir können jederzeit zurück, ohne etwas
 * zusammenzusetzen.
 *
 * **Die Meldungen bleiben sichtbar.** Das ist der eine Punkt, an dem wir es
 * bewusst anders machen: Wer `#notifications` mit ausblendet, nimmt sich die
 * Möglichkeit, dem Spieler überhaupt noch etwas zu sagen. Wir haben dafür einen
 * eigenen Streifen bauen müssen (`notify.js`); hier ist er nicht nötig.
 *
 * **Die Leiste schwebt über dem Blatt und unter unseren Flächen.** Über dem
 * Blatt, damit es die volle Höhe behält. Unter den Flächen, weil sie sonst den
 * Rückweg verdeckte.
 *
 * Alles hängt an einem Beta-Schalter des Spielleiters. Diese Ansicht ist die
 * einzige Funktion des Moduls, die einem Spieler den ganzen Bildschirm nimmt —
 * geht sie schief, kommt er selbst nicht mehr an die Einstellungen.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { characterOf } from "./trade.js";
import { openTrade } from "./trade-start.js";
import { mountClockInto } from "./clock.js";
import { queueSweep, removeShells, hideShells, isGhost } from "./shells.js";

const BODY_CLASS = "inperson-sheetview";
const BAR_ID = "inperson-sheetview-bar";
const UHR_ID = "inperson-sheetview-uhr";

/**
 * Jede Leiste hängt in einem Anker, und nur der Anker wird verschoben.
 *
 * Die Leisten selbst sind über `zoom` verkleinert, und ein gezoomtes Element
 * misst sein left/top in eigenen Pixeln - Chrome und Safari nicht einmal
 * gleich. Eine Zeit lang habe ich beim Setzen durch den Faktor geteilt; das
 * war richtig gerechnet und trotzdem am Tablet ein Flattern. Der Anker ist
 * nicht gezoomt: Was am Zeiger gemessen wird, wird ungerechnet geschrieben.
 */
const BAR_ANKER = `${BAR_ID}-anker`;
const UHR_ANKER = `${UHR_ID}-anker`;

function ankerBauen(id, klasse) {
  const anker = document.createElement("div");
  anker.id = id;
  anker.className = `inperson-sv-anker ${klasse}`;
  return anker;
}

/** Schriftgröße als Faktor, je Gerät gemerkt. */
const ZOOM_KEY = `${MODULE_ID}.sheetviewZoom`;

let laufend = false;

/* ── Wann läuft sie ──────────────────────────────────────────────── */

/**
 * Für wen die Ansicht gilt.
 *
 * Spielleiter nie: Sie brauchen die Oberfläche, die hier verschwindet, und ein
 * Spielleiter ohne Szenenliste kann seinen Abend nicht führen. Und nur mit
 * zugewiesenem Charakter, denn ohne einen gäbe es nichts zu zeigen.
 */
export function sheetViewWanted() {
  if (!game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW)) return false;
  if (game.user.isGM) return false;
  // Nur ausgewählte Konten. Der Schalter allein traf jeden Spieler mit
  // Charakter, auch den am Laptop, der seine Szenenliste braucht.
  const wer = game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_USERS) ?? {};
  if (wer[game.user.id] !== true) return false;
  return !!characterOf(game.user);
}

export function sheetViewRunning() {
  return laufend;
}

/* ── Die Bühne ───────────────────────────────────────────────────── */

function blattApp() {
  const actor = characterOf(game.user);
  return actor?.sheet ?? null;
}

async function blattZeigen() {
  const sheet = blattApp();
  if (!sheet) return;
  if (!sheet.rendered) await sheet.render(true);
  sheet.element?.classList.add("inperson-stage-sheet");
}

/* ── Die Leiste ──────────────────────────────────────────────────── */

/**
 * Die Knöpfe, in zwei Gruppen.
 *
 * **Klein, weil sie umschaltet.** Neun Knöpfe nebeneinander ergeben eine
 * Leiste, die quer über den halben Schirm reicht; das war meine erste Fassung
 * und sie war zu groß. Stattdessen zeigt sie eine Gruppe zur Zeit, und ein
 * Knopf wechselt — dasselbe Verhalten, das Sheet Only mit seinen zwei
 * Knopfreihen hat, weil es sich am Tisch bewährt hat.
 *
 * Vorn steht, was man dauernd braucht; hinten, was man einmal am Abend tut.
 *
 * Die Sprachschlüssel stehen ausgeschrieben da statt zusammengesetzt: Der
 * Prüfer liest den Quelltext, und einen Schlüssel, den er nicht sieht, kann er
 * auch nicht vermissen.
 */
const GRUPPEN = {
  haupt: [
    { icon: "fa-users",        titel: "INPERSON.SheetView.WhoHint",   flaeche: "chars" },
    { icon: "fa-comments",     titel: "INPERSON.SheetView.ChatHint",  flaeche: "chat" },
    { icon: "fa-book-open",    titel: "INPERSON.SheetView.NotesHint", flaeche: "journal" },
    { icon: "fa-right-left",   titel: "INPERSON.SheetView.TradeHint", tun: () => openTrade() }
  ],
  extra: [
    { icon: "fa-magnifying-glass-minus", titel: "INPERSON.SheetView.Smaller",    tun: () => zoomen(-0.1) },
    { icon: "fa-magnifying-glass",       titel: "INPERSON.SheetView.ResetZoom",  tun: () => zoomen(null) },
    { icon: "fa-magnifying-glass-plus",  titel: "INPERSON.SheetView.Bigger",     tun: () => zoomen(0.1) },
    // Lautstärke, Sprache, die eigenen Moduleinstellungen: Ohne diesen Knopf
    // käme ein Spieler in der Ansicht an nichts davon heran.
    { icon: "fa-volume-high",            titel: "INPERSON.SheetView.Volume",     tun: lautstaerke },
    { icon: "fa-up-right-and-down-left-from-center", titel: "INPERSON.SheetView.BarSize", tun: leistengroesse },
    { icon: "fa-gear",                   titel: "INPERSON.SheetView.Settings",   tun: einstellungen },
    { icon: "fa-expand",                 titel: "INPERSON.SheetView.Fullscreen", tun: vollbild },
    { icon: "fa-right-from-bracket",     titel: "INPERSON.SheetView.LogOut",     tun: abmelden }
  ]
};

/* ── Knöpfe anderer Module ───────────────────────────────────────── */

/**
 * Was FANG, NDRS und wer sonst noch will in die Leiste stellen.
 *
 * Kein Element mit fremder Kennung, das andere Module im DOM suchen müssten —
 * das war Sheet Onlys Weg, und er zwingt jedes Modul zu einem Beobachter, der
 * die ganze Seite absucht. Hier melden sie einen Knopf an, und die Leiste
 * zeichnet ihn, wann immer sie sich zeichnet. Wer sich vor uns meldet, hat die
 * Schnittstelle noch nicht: dafür ruft main.js `ninjosInPersonTools.ready`.
 *
 * @type {Map<string, {icon: string, title: string, onClick: Function, group: string}>}
 */
const fremde = new Map();

export const sheetViewApi = {
  /**
   * @param {object} knopf
   * @param {string} knopf.id       eindeutig je Modul, z. B. "fang"
   * @param {string} knopf.icon     Font-Awesome-Klasse ohne Stil, z. B. "fa-diagram-project"
   * @param {string} knopf.title    Tooltip, fertig übersetzt oder als Sprachschlüssel
   * @param {Function} knopf.onClick
   * @param {"haupt"|"extra"} [knopf.group]  vorn bei den täglichen oder hinten
   */
  registerButton({ id, icon, title, onClick, group = "haupt" } = {}) {
    if (!id || !icon || typeof onClick !== "function") {
      throw new Error(`${MODULE_ID} | registerButton braucht id, icon und onClick`);
    }
    fremde.set(String(id), { icon, title: title ?? id, onClick, group: group === "extra" ? "extra" : "haupt" });
    const bar = document.getElementById(BAR_ID);
    if (bar) gruppeZeichnen(bar);
  },
  unregisterButton(id) {
    if (!fremde.delete(String(id))) return;
    const bar = document.getElementById(BAR_ID);
    if (bar) gruppeZeichnen(bar);
  },
  isRunning: () => laufend
};

/**
 * Ein Knopf: ein Zeichen, kein Wort.
 *
 * Wörter machen die Leiste breit und sind in acht Sprachen acht verschiedene
 * Breiten. Das Zeichen bleibt gleich groß, der Name steht im Tooltip und in der
 * Bedienhilfe — dort, wo ihn braucht, wer ihn braucht.
 */
function knopf({ icon, titel, flaeche = null, tun = null }) {
  const b = document.createElement("button");
  b.type = "button";
  b.innerHTML = `<i class="fa-solid ${foundry.utils.escapeHTML(icon)}"></i>`;
  b.title = titel;
  b.setAttribute("aria-label", titel);
  if (flaeche) {
    b.dataset.flaeche = flaeche;
    b.setAttribute("aria-pressed", "false");
  }
  b.addEventListener("click", () => {
    // Wer gezogen hat, wollte nicht drücken.
    if (wurdeGezogen()) return;
    if (flaeche) flaecheUmschalten(flaeche);
    else tun?.();
  });
  return b;
}

let gruppe = "haupt";

function gruppeZeichnen(bar) {
  const reihe = bar.querySelector(".inperson-sv-reihe");
  reihe.replaceChildren();
  for (const k of GRUPPEN[gruppe]) {
    reihe.append(knopf({
      icon: k.icon,
      titel: game.i18n.localize(k.titel),
      flaeche: k.flaeche,
      tun: k.tun
    }));
  }
  for (const [id, f] of fremde) {
    if (f.group !== gruppe) continue;
    const b = knopf({
      icon: f.icon,
      titel: game.i18n.has(f.title) ? game.i18n.localize(f.title) : f.title,
      tun: () => f.onClick()
    });
    b.dataset.modul = id;
    reihe.append(b);
  }
  markieren();
}

function leisteBauen() {
  if (document.getElementById(BAR_ID)) return;

  const bar = document.createElement("div");
  bar.id = BAR_ID;
  bar.className = "inperson-sheetview-bar";

  const reihe = document.createElement("div");
  reihe.className = "inperson-sv-reihe";
  bar.append(reihe);

  const wechsel = document.createElement("button");
  wechsel.type = "button";
  wechsel.className = "inperson-sv-wechsel";
  wechsel.innerHTML = `<i class="fa-solid fa-bars"></i>`;
  wechsel.title = game.i18n.localize("INPERSON.SheetView.More");
  wechsel.setAttribute("aria-label", game.i18n.localize("INPERSON.SheetView.More"));
  wechsel.addEventListener("click", () => {
    if (wurdeGezogen()) return;
    gruppe = gruppe === "haupt" ? "extra" : "haupt";
    gruppeZeichnen(bar);
  });
  bar.append(wechsel);

  const anker = ankerBauen(BAR_ANKER, "inperson-sv-anker-bar");
  anker.append(bar);
  document.body.appendChild(anker);
  gruppeZeichnen(bar);
  ziehbarMachen(anker, PLATZ_KEY);
  platzWiederherstellen(anker, PLATZ_KEY);
}

/**
 * Die Zeitleiste steht für sich.
 *
 * Sie steckte zuerst in der Menüleiste — mit dem Himmelsbogen darin wurde die
 * 833 Pixel breit und 96 hoch, also alles andere als klein. Es sind auch zwei
 * verschiedene Dinge: die eine wird bedient, die andere angeschaut. Beide sind
 * verschiebbar, jede mit ihrem eigenen gemerkten Platz.
 */
function uhrBauen() {
  if (document.getElementById(UHR_ID)) return;
  const halter = document.createElement("div");
  halter.id = UHR_ID;
  halter.className = "inperson-sheetview-uhr";
  const anker = ankerBauen(UHR_ANKER, "inperson-sv-anker-uhr");
  anker.append(halter);
  document.body.appendChild(anker);
  mountClockInto(halter);
  if (!halter.firstChild) return anker.remove();   // Leiste ist abgeschaltet
  ziehbarMachen(anker, UHR_PLATZ_KEY);
  platzWiederherstellen(anker, UHR_PLATZ_KEY);
}

/**
 * Die beiden Leisten zum Start anordnen: die Zeit oben, die Knöpfe darunter.
 *
 * Quer: Zeitleiste mit Kuppel am oberen Rand, die Menüleiste direkt
 * darunter - über dem Banner des Blatts, wo es sonst nichts zu bedienen gibt.
 * Hochkant sitzen die Attribute im Kopf des Blatts genau dort (gemessen an
 * 804 × 1105: die Menüleiste lag auf STÄ, GES und KON), also unten: die
 * Knöpfe am unteren Rand, die Zeitleiste darüber.
 *
 * Nur, wenn niemand die jeweilige Leiste woandershin gezogen hat. Alles in
 * Bildschirmpixeln, weil nur die ungezoomten Anker gesetzt werden.
 */
function leisteUnterDieUhr() {
  const bar = document.getElementById(BAR_ANKER);
  const uhr = document.getElementById(UHR_ANKER);
  if (!bar) return;
  const hochkant = lage() === "hoch";
  const barFrei = !localStorage.getItem(lageKey(PLATZ_KEY));
  const uhrFrei = !!uhr && !localStorage.getItem(lageKey(UHR_PLATZ_KEY));
  const oben = element => {
    element.style.removeProperty("top");
    element.style.removeProperty("bottom");
  };

  if (hochkant) {
    if (barFrei) {
      bar.style.top = "auto";
      bar.style.bottom = "calc(env(safe-area-inset-bottom, 0px) + 12px)";
    }
    if (uhrFrei) {
      const dach = window.innerHeight - bar.getBoundingClientRect().top;
      uhr.style.top = "auto";
      uhr.style.bottom = `${Math.round(dach + 12)}px`;
    }
    return;
  }

  if (uhrFrei) oben(uhr);
  if (barFrei) {
    oben(bar);
    if (uhr) bar.style.top = `${Math.round(uhr.getBoundingClientRect().bottom + 12)}px`;
  }
}

/* ── Verschieben ─────────────────────────────────────────────────── */

// Version 2 der Schlüssel: Die alten enthalten Plätze aus der Zeit, als beide
// Leisten oben standen und sich überdeckten. Ein neuer Name wirft sie weg,
// ohne dass jemand etwas löschen muss.
// Version 2 der Schlüssel: Die alten enthalten Plätze aus der Zeit, als beide
// Leisten oben standen und sich überdeckten. Ein neuer Name wirft sie weg,
// ohne dass jemand etwas löschen muss.
const PLATZ_KEY = `${MODULE_ID}.sheetviewBar2`;
const UHR_PLATZ_KEY = `${MODULE_ID}.sheetviewUhr2`;

/**
 * Hoch oder quer - jede Lage merkt sich ihre eigenen Plätze und Größen.
 *
 * Ein Platz, der quer neben dem Banner gut war, liegt hochkant auf den
 * Attributen; dasselbe gilt für die Größe. Der Gerätespeicher bleibt über
 * Neuladen und Neuanmelden erhalten, weil er am Browser hängt, nicht an der
 * Sitzung.
 */
function lage() {
  return window.innerHeight > window.innerWidth ? "hoch" : "quer";
}

function lageKey(key) {
  return `${key}.${lage()}`;
}

/** Alle Schlüssel, die diese Ansicht im Gerätespeicher anlegt. */
function alleGeraeteSchluessel() {
  const aus = [];
  for (const key of [PLATZ_KEY, UHR_PLATZ_KEY, GROESSE_KEY, GROESSE_UHR_KEY]) aus.push(key, `${key}.hoch`, `${key}.quer`);
  // Dazu die Namen früherer Fassungen, die auf alten Tablets noch liegen.
  aus.push(ZOOM_KEY, SPERRE_KEY, `${MODULE_ID}.sheetviewBar`, `${MODULE_ID}.sheetviewUhr`);
  return aus;
}

/**
 * Hat der Spielleiter für dieses Konto einen Neustart verlangt?
 *
 * Er kommt an den Gerätespeicher eines Tablets nicht heran. Also steht in
 * einer Welteinstellung je Konto ein Zeitstempel; jedes Gerät merkt sich, bis
 * zu welchem es aufgeräumt hat. So greift es auch auf einem Tablet, das beim
 * Drücken des Knopfs aus war - beim nächsten Laden.
 */
const RESET_KEY = `${MODULE_ID}.sheetviewReset`;

/**
 * Leisten festhalten: Wer seinen Platz gefunden hat, will ihn nicht beim
 * nächsten langen Druck versehentlich verlieren. Je Gerät, ohne Lage.
 */
const SPERRE_KEY = `${MODULE_ID}.sheetviewFest`;

function festgehalten() {
  return localStorage.getItem(SPERRE_KEY) === "1";
}

function sperreAnwenden() {
  const fest = festgehalten();
  for (const id of [BAR_ANKER, UHR_ANKER]) document.getElementById(id)?.classList.toggle("fest", fest);
}

function resetPruefen() {
  const stempel = Number(game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_RESET)?.[game.user.id] ?? 0);
  if (!stempel) return false;
  const erledigt = Number(localStorage.getItem(RESET_KEY)) || 0;
  if (stempel <= erledigt) return false;
  for (const key of alleGeraeteSchluessel()) localStorage.removeItem(key);
  localStorage.setItem(RESET_KEY, String(stempel));
  console.log(`${MODULE_ID} | Leisten auf Startwerte zurückgesetzt (Spielleiter)`);
  return true;
}

/** Plätze und Größen der aktuellen Lage anwenden - beim Start und beim Drehen. */
function lageAnwenden({ behalten = false } = {}) {
  groesseAnwenden();
  for (const [id, key] of [[BAR_ANKER, PLATZ_KEY], [UHR_ANKER, UHR_PLATZ_KEY]]) {
    const element = document.getElementById(id);
    if (!element) continue;
    for (const p of ["left", "top", "right", "bottom", "transform"]) element.style.removeProperty(p);
    platzWiederherstellen(element, key, { behalten });
  }
  leisteUnterDieUhr();
}

/**
 * Nur bei einem echten Drehen neu anordnen.
 *
 * Auf dem Tablet feuert `resize` auch, wenn die Browserleiste beim Ziehen
 * ein- oder ausklappt - und dann räumte das hier mitten im Ziehen beide
 * Leisten um: die gezogene sprang zurück, die andere wanderte mit. Das war
 * das Flattern. Also: Während gezogen wird, passiert nichts; und ohne
 * Wechsel zwischen hoch und quer auch nicht.
 */
let drehTimer = null;
let letzteLage = null;
let ziehtGerade = 0;

function beimDrehen() {
  clearTimeout(drehTimer);
  drehTimer = setTimeout(() => {
    if (ziehtGerade > 0) { beimDrehen(); return; }
    const jetzt = lage();
    if (jetzt === letzteLage) return;
    letzteLage = jetzt;
    lageAnwenden();
  }, 150);
}
/**
 * Wie lange halten, bevor die Leiste zieht.
 *
 * War kurz eine Einstellung auf der Seite des Spielleiters - und genau dort
 * gehört sie nicht hin: Wer die Ansicht einrichtet, will nicht über
 * Millisekunden entscheiden. 400 hat am Tisch funktioniert; das reicht.
 */
const HALTEN_MS = 400;

/**
 * Ob gerade gezogen wurde — die einzige Angabe, die beide Leisten teilen.
 *
 * Sie dient nur dazu, den Klick zu unterdrücken, der auf ein Ziehen folgt.
 * Alles andere gehört der einzelnen Leiste: Anfangs lagen Griffpunkt und
 * gegriffenes Element hier oben, und weil `ziehbarMachen` zweimal läuft, zog
 * ein Griff an der einen die andere mit. Genau das war zu sehen.
 */
let gezogen = false;

function wurdeGezogen() {
  return gezogen;
}

/**
 * Ziehen erst nach langem Druck.
 *
 * Auf einem Touchscreen ist jede Berührung erst einmal ein Tipp. Zöge die
 * Leiste sofort, wäre kein Knopf mehr zu treffen — man würde sie beim Drücken
 * verschieben. Also: kurz halten, dann bewegt sie sich; und wer gezogen hat,
 * löst beim Loslassen keinen Knopf aus.
 *
 * Jede Leiste hat ihren eigenen Zustand. Der steckt bewusst in dieser Funktion
 * und nicht daneben.
 */
function ziehbarMachen(element, key) {
  let timer = null;
  let aktiv = false;
  let griffX = 0;
  let griffY = 0;

  const start = event => {
    if (festgehalten()) return;
    const punkt = event.touches?.[0] ?? event;
    clearTimeout(timer);
    timer = setTimeout(() => {
      aktiv = true;
      gezogen = true;
      ziehtGerade++;
      // Erst messen, dann die Klasse: `wird-gezogen` setzt ein eigenes
      // transform und verdrängt damit das translateX(-50%) der Startlage -
      // die Leiste sprang beim ersten Ziehen nach dem Laden um eine halbe
      // Breite zur Seite, weil der Griff nach dem Sprung gemessen wurde.
      const r = element.getBoundingClientRect();
      griffX = punkt.clientX - r.left;
      griffY = punkt.clientY - r.top;
      element.classList.add("wird-gezogen");
    }, HALTEN_MS);
  };

  const bewegen = event => {
    if (!aktiv) return;
    event.preventDefault();
    const punkt = event.touches?.[0] ?? event;
    setzen(element, punkt.clientX - griffX, punkt.clientY - griffY);
  };

  const ende = () => {
    clearTimeout(timer);
    if (!aktiv) return;
    aktiv = false;
    ziehtGerade = Math.max(0, ziehtGerade - 1);
    element.classList.remove("wird-gezogen");
    const r = element.getBoundingClientRect();
    localStorage.setItem(lageKey(key), JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) }));
    // Erst nach dem Klick zurücksetzen, sonst feuert der Knopf doch noch.
    setTimeout(() => { gezogen = false; }, 0);
  };

  element.addEventListener("mousedown", start);
  element.addEventListener("touchstart", start, { passive: true });
  // Android öffnet nach langem Druck ein Kontextmenü und bricht die Berührung
  // ab - genau in dem Moment, in dem das Ziehen beginnen soll.
  element.addEventListener("contextmenu", event => event.preventDefault());
  document.addEventListener("mousemove", bewegen);
  document.addEventListener("touchmove", bewegen, { passive: false });
  document.addEventListener("mouseup", ende);
  document.addEventListener("touchend", ende);
  // Ein Zeigerwechsel mitten im Ziehen darf die Leiste nicht am Zeiger kleben
  // lassen.
  document.addEventListener("pointercancel", ende);
}

/**
 * Setzen und dabei im Bild halten.
 *
 * `right` und `bottom` müssen mit weg. Das Stylesheet stellt die Uhrleiste über
 * `right: 14px` an den rechten Rand; wer dann nur `left` setzt, hat beides
 * gesetzt, und das Element wird gedehnt statt verschoben. Gemessen: 552 Pixel
 * breit bei Position 1585 auf einem 2030 Pixel breiten Schirm — 107 Pixel
 * hingen hinaus, obwohl hier geklemmt wird.
 */
function setzen(bar, x, y) {
  bar.style.right = "auto";
  bar.style.bottom = "auto";
  bar.style.transform = "none";
  const r = bar.getBoundingClientRect();
  const maxX = Math.max(0, window.innerWidth - r.width);
  const maxY = Math.max(0, window.innerHeight - r.height);
  bar.style.left = `${Math.round(Math.min(maxX, Math.max(0, x)))}px`;
  bar.style.top = `${Math.round(Math.min(maxY, Math.max(0, y)))}px`;
}

/**
 * Den gemerkten Platz zurückholen — aber nur, wenn er taugt.
 *
 * Zwei Prüfungen, beide aus einem echten Fall. Er muss auf *diesem* Schirm
 * liegen: Wer die Leiste am 27-Zoll-Bildschirm nach außen schiebt, fände sie
 * auf dem Tablet sonst nicht wieder. Und er darf die andere Leiste nicht
 * überdecken — genau das war zu sehen, ein gespeicherter Platz aus früheren
 * Zeiten legte die Knöpfe mitten auf die Uhr.
 */
function platzWiederherstellen(bar, key, { behalten = false } = {}) {
  let platz = null;
  try { platz = JSON.parse(localStorage.getItem(lageKey(key)) ?? "null"); } catch { /* egal */ }
  if (!platz) return;
  if (platz.x > window.innerWidth - 40 || platz.y > window.innerHeight - 40) return;

  const vorher = bar.getBoundingClientRect();
  setzen(bar, platz.x, platz.y);

  const andere = document.getElementById(bar.id === BAR_ANKER ? UHR_ANKER : BAR_ANKER);
  // `behalten`: Beim Größenregler dürfen sich die beiden kurz berühren - wer
  // gerade schiebt, sieht es und zieht danach weiter. Nur beim Laden wird ein
  // überdeckender Platz verworfen.
  if (!behalten && andere && ueberlappen(bar, andere)) {
    // Zurück auf den Platz aus dem Stylesheet.
    bar.style.removeProperty("left");
    bar.style.removeProperty("top");
    bar.style.removeProperty("right");
    bar.style.removeProperty("bottom");
    bar.style.removeProperty("transform");
    localStorage.removeItem(lageKey(key));
    console.warn(`${MODULE_ID} | gemerkter Platz überdeckte die andere Leiste, verworfen`, platz, vorher);
  }
}

function ueberlappen(a, b) {
  const x = a.getBoundingClientRect();
  const y = b.getBoundingClientRect();
  return !(x.right < y.left || y.right < x.left || x.bottom < y.top || y.bottom < x.top);
}

/* ── Die drei, die sofort etwas tun ──────────────────────────────── */

/**
 * Schriftgröße.
 *
 * Ohne Tastatur gibt es auf einem Tablet keinen anderen Weg — auf iPadOS und
 * Android existiert kein Strg+. Der Faktor liegt im Gerätespeicher, nicht in
 * einer Welteinstellung: wie groß jemand Schrift braucht, ist eine Sache der
 * Augen und des Bildschirms, nicht der Spielrunde.
 */
function zoomen(schritt) {
  const jetzt = Number(localStorage.getItem(ZOOM_KEY)) || 1;
  // null heißt: zurück auf eins.
  const neu = schritt == null ? 1 : Math.min(1.8, Math.max(0.7, Math.round((jetzt + schritt) * 10) / 10));
  localStorage.setItem(ZOOM_KEY, String(neu));
  zoomAnwenden();
}

/**
 * Den Faktor setzen. Wirkt über `zoom` auf dem Blatt, nicht über `font-size`.
 *
 * Der erste Versuch ging über die Schriftgröße und tat nachweislich nichts:
 * Tidy5e setzt seine Maße selbst, unsere Variable erreichte keines davon.
 */
function zoomAnwenden() {
  const faktor = Number(localStorage.getItem(ZOOM_KEY)) || 1;
  document.documentElement.style.setProperty("--inperson-sv-zoom", String(faktor));
}

async function vollbild() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (error) {
    // iOS auf dem Telefon kann das nicht. Kein Fehler, sondern eine Tatsache -
    // dort führt der Weg über "zum Startbildschirm hinzufügen".
    console.warn(`${MODULE_ID} | Vollbild nicht möglich`, error);
    ui.notifications?.info(game.i18n.localize("INPERSON.SheetView.NoFullscreen"));
  }
}

/**
 * Foundrys Einstellungen, als Fenster.
 *
 * Das Blatt liegt bei z-index 20 und die Flächen bei 9999; ein gewöhnliches
 * Fenster stünde dazwischen und wäre sichtbar - nur hinter einer offenen
 * Fläche nicht. Also erst die Fläche zu.
 */
const LAUT_ID = "inperson-sv-lautstaerke";
const GROESSE_ID = "inperson-sv-groesse";

/**
 * Ein kleines Feld unter (oder über) der Leiste, das sich von selbst schließt.
 *
 * Ein zweiter Druck auf den Knopf, ein Tipp daneben oder Escape schließt.
 * Escape gehört dabei uns: Foundry würde damit sonst das oberste Fenster
 * schließen - und das ist in dieser Ansicht das Blatt.
 *
 * @param {string} id
 * @param {(feld: HTMLElement) => void} fuellen
 */
function feldSchliessen(id) {
  const feld = document.getElementById(id);
  if (!feld) return false;
  (feld.parentElement?.classList.contains("inperson-sv-anker") ? feld.parentElement : feld).remove();
  return true;
}

function feldOeffnen(id, fuellen) {
  if (feldSchliessen(id)) return;

  const bar = document.getElementById(BAR_ID);
  const feld = document.createElement("div");
  feld.id = id;
  feld.className = "inperson-sv-feld";
  fuellen(feld);
  const anker = ankerBauen(`${id}-anker`, "inperson-sv-anker-feld");
  anker.append(feld);
  document.body.append(anker);

  feldPlatzieren(feld);

  const zu = event => {
    if (event.type === "keydown" && event.key !== "Escape") return;
    if (event.type === "pointerdown" && (feld.contains(event.target) || bar.contains(event.target))) return;
    if (event.type === "keydown") event.stopPropagation();
    feldSchliessen(id);
    document.removeEventListener("pointerdown", zu, true);
    document.removeEventListener("keydown", zu, true);
  };
  document.addEventListener("pointerdown", zu, true);
  document.addEventListener("keydown", zu, true);
}

/**
 * Unter die Leiste, mittig dazu; am Rand eingeklemmt, falls sie dort steht.
 *
 * Das Feld ist auf kleinen Schirmen genauso gezoomt wie die Leiste, seine
 * left/top sind also in eigenen Pixeln - daher der Faktor. Eigene Funktion,
 * weil der Größenregler die Leiste *und* das Feld während des Schiebens
 * umzoomt und das Feld dann neu hin muss.
 */
function feldPlatzieren(feld) {
  const bar = document.getElementById(BAR_ANKER);
  const anker = feld?.parentElement;
  if (!bar || !anker) return;
  const b = bar.getBoundingClientRect();
  const f = anker.getBoundingClientRect();
  const u = document.getElementById(UHR_ANKER)?.getBoundingClientRect();
  const links = Math.min(window.innerWidth - f.width - 8, Math.max(8, b.left + b.width / 2 - f.width / 2));
  // Quer liegt die Zeitleiste unter den Knöpfen: dann unter beide. Hochkant
  // liegt sie darunter am Rand und die Knöpfe stehen darüber: dann über die
  // Knöpfe. Kurz: unter die Gruppe, wenn dort Platz ist, sonst darüber.
  const boden = u && u.top >= b.bottom - 4 && u.top <= b.bottom + 90 ? u.bottom : b.bottom;
  const dach = u && u.bottom <= b.top + 4 && u.bottom >= b.top - 90 ? u.top : b.top;
  const passtUnten = boden + 8 + f.height < window.innerHeight;
  const oben = passtUnten ? boden + 8 : dach - 8 - f.height;
  anker.style.left = `${Math.round(links)}px`;
  anker.style.top = `${Math.round(oben)}px`;
}

/** Eine Zeile Symbol + Name + Schalter. */
function schalterZeile({ icon, titel, wert, bei }) {
  const zeile = document.createElement("label");
  zeile.className = "inperson-sv-schalter";
  zeile.innerHTML = `<i class="fa-solid ${icon}"></i>
    <span>${game.i18n.localize(titel)}</span>
    <input type="checkbox" ${wert ? "checked" : ""}>`;
  zeile.querySelector("input").addEventListener("change", event => bei(event.target.checked));
  return zeile;
}

/** Eine Zeile Symbol + Name + Schieberegler. */
function reglerZeile({ icon, titel, min, max, step, wert, bei, fertig = null }) {
  const zeile = document.createElement("label");
  zeile.innerHTML = `<i class="fa-solid ${icon}"></i>
    <span>${game.i18n.localize(titel)}</span>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${wert}">`;
  const input = zeile.querySelector("input");
  input.addEventListener("input", event => bei(Number(event.target.value)));
  if (fertig) input.addEventListener("change", () => fertig());
  return zeile;
}

/**
 * Drei Regler: Playlist, Umgebung, Oberfläche.
 *
 * Foundrys eigene Regler stecken in der Playlist-Seitenleiste, und die ist in
 * dieser Ansicht weg. Es sind Foundrys Client-Einstellungen, also gilt der
 * Wert nur für dieses Gerät - genau das, was man an einem Tablet will, das
 * neben dem Fernseher steht und stumm sein soll.
 */
const REGLER = [
  { key: "globalPlaylistVolume",  icon: "fa-music",     titel: "INPERSON.SheetView.VolumePlaylist" },
  { key: "globalAmbientVolume",   icon: "fa-tree",      titel: "INPERSON.SheetView.VolumeAmbient" },
  { key: "globalInterfaceVolume", icon: "fa-bell",      titel: "INPERSON.SheetView.VolumeInterface" }
];

function lautstaerke() {
  feldOeffnen(LAUT_ID, feld => {
    for (const regler of REGLER) {
      const wert = Number(game.settings.get("core", regler.key));
      feld.append(reglerZeile({
        icon: regler.icon, titel: regler.titel, min: 0, max: 1, step: 0.05,
        wert: Number.isFinite(wert) ? wert : 1,
        bei: v => game.settings.set("core", regler.key, v)
      }));
    }
  });
}

/**
 * Wie groß die Leisten sind - je Gerät, vom Spieler.
 *
 * Die automatischen Stufen nach Bildschirmbreite (Stylesheet) sind nur der
 * Ausgangspunkt: Auf dem Tablet hochkant war die volle Größe gerade richtig,
 * quer wirkte sie zu groß - und was "richtig" ist, hängt an Augen, Fingern
 * und Zoll. Der Faktor liegt daher neben der Schriftgröße im Gerätespeicher
 * und multipliziert sich mit der Stufe.
 */
const GROESSE_KEY = `${MODULE_ID}.sheetviewLeiste`;
const GROESSE_UHR_KEY = `${MODULE_ID}.sheetviewUhrGroesse`;

/**
 * Zwei Faktoren, nicht einer: Menüleiste und Zeitleiste wachsen getrennt.
 * Mit einem gemeinsamen Regler wirkten sie ungleich - die eine hat Knöpfe,
 * die andere Text und Kuppel, und dieselbe Zahl sieht verschieden groß aus.
 */
function groesseAnwenden() {
  const leiste = Number(localStorage.getItem(lageKey(GROESSE_KEY))) || 1;
  const uhr = Number(localStorage.getItem(lageKey(GROESSE_UHR_KEY))) || 1;
  document.documentElement.style.setProperty("--inperson-sv-leiste", String(leiste));
  document.documentElement.style.setProperty("--inperson-sv-uhr", String(uhr));
}

function leistengroesse() {
  feldOeffnen(GROESSE_ID, feld => {
    // Erst die Zeit, dann die Knöpfe - in der Reihenfolge, in der sie auf dem
    // Schirm stehen.
    for (const [key, icon, titel] of [
      [GROESSE_UHR_KEY, "fa-clock", "INPERSON.SheetView.BarSizeClock"],
      [GROESSE_KEY,     "fa-grip",  "INPERSON.SheetView.BarSizeButtons"]
    ]) feld.append(reglerZeile({
      icon, titel,
      min: 0.6, max: 1.4, step: 0.05,
      wert: Number(localStorage.getItem(lageKey(key))) || 1,
      bei: v => {
        localStorage.setItem(lageKey(key), String(v));
        groesseAnwenden();
        // Ein gezogener Platz steht in gezoomten Pixeln in left/top; mit
        // neuem Faktor wanderte die Leiste beim Schieben weg und flatterte.
        // Also den Platz nach jedem Schritt neu anwenden. Synchron, nicht im
        // nächsten Bild: getComputedStyle erzwingt die Neuberechnung, und ein
        // Tab im Hintergrund bekommt gar keine Bilder - dort blieb es liegen.
        lageAnwenden({ behalten: true });
      },
      // Das Feld erst beim Loslassen nachsetzen - während des Schiebens
      // bleibt es, wo der Finger ist.
      fertig: () => feldPlatzieren(document.getElementById(GROESSE_ID))
    }));

    feld.append(schalterZeile({
      icon: "fa-lock", titel: "INPERSON.SheetView.LockPosition",
      wert: festgehalten(),
      bei: an => {
        if (an) localStorage.setItem(SPERRE_KEY, "1");
        else localStorage.removeItem(SPERRE_KEY);
        sperreAnwenden();
      }
    }));
  });
}

async function einstellungen() {
  await flaecheSchliessen();
  game.settings.sheet.render({ force: true });
}

function abmelden() {
  const dialog = foundry.applications.api.DialogV2;
  dialog.confirm({
    window: { title: game.i18n.localize("INPERSON.SheetView.LogOut") },
    content: `<p>${game.i18n.localize("INPERSON.SheetView.LogOutAsk")}</p>`,
    yes: { callback: () => game.logOut() }
  });
}

/* ── Die Flächen ─────────────────────────────────────────────────── */

let offeneFlaeche = null;

/**
 * Was wir aufgeklappt haben, als Anwendung.
 *
 * Nötig, weil wir nicht jedes Fenster über `renderPopout` bekommen: Monks
 * Little Details fängt das für das Akteursverzeichnis ab, also bauen wir dort
 * die Anwendung selbst — und dann hängt sie *nicht* an `app.popout`. Wer nur
 * dort nachsieht, schließt genau dieses eine Fenster nie. Gemessen: es blieb
 * offen und meldete `rendered: true`.
 */
const geoeffnet = new Map();

/**
 * Charaktere, Chat und Notizen sind Foundrys eigene Verzeichnisse, ausgeklappt
 * und von uns an den rechten Rand geheftet — dieselbe Verankerung, die wir für
 * Sheet Only bauen mussten, weil Foundry die Lage aus der Position eines
 * versteckten Reiters rechnet.
 */
const FLAECHEN = {
  chars: () => game.actors.apps?.[0],
  chat: () => ui.chat,
  journal: () => game.journal.apps?.[0]
};

/**
 * Eines nach dem anderen.
 *
 * Ohne diese Kette überholen sich Öffnen und Schließen. Gemessen: zwölf Runden
 * schnelles Auf und Zu hinterließen **zwei offene Fenster** — Chat und Notizen,
 * beide mit Inhalt, beide von niemandem mehr verwaltet. Das ist die
 * „Phantomseite": kein leerer Rahmen, sondern ein Fenster, dessen Schließen im
 * Wettlauf verlorenging.
 *
 * `renderPopout` und `close` sind beide asynchron und dauern unterschiedlich
 * lang. Wer zweimal tippt, startet das zweite, bevor das erste fertig ist.
 */
let kette = Promise.resolve();

function nacheinander(arbeit) {
  kette = kette.then(arbeit, arbeit);
  return kette;
}

function flaecheUmschalten(name) {
  // Synchron, noch im Klick: alles aus dem Bild, was gleich zugehen soll.
  // Die Kette darunter läuft erst nach dem Handler an - und in dieser Lücke
  // stand der Rahmen sonst für ein, zwei Bilder sichtbar da. Gemessen: die
  // erste Probe 0 ms nach dem Klick zeigte ihn noch.
  const bleibt = offeneFlaeche === name ? null : name;
  for (const node of document.querySelectorAll(".sidebar-popout")) {
    if (!(bleibt && KLASSEN[bleibt] && node.classList.contains(KLASSEN[bleibt]))) {
      node.classList.remove("inperson-offen");
    }
  }

  return nacheinander(async () => {
    const wollen = offeneFlaeche === name ? null : name;
    offeneFlaeche = wollen;

    await allesSchliessenAusser(null);
    if (!wollen) return markieren();

    const app = FLAECHEN[wollen]?.();
    const popout = app ? await ausklappen(app) : null;

    // In der Zwischenzeit kann schon wieder getippt worden sein. Dann ist
    // dieses Fenster verwaist, und zwar genau das hier — es wird deshalb
    // direkt geschlossen und nicht nur „alles offene", denn es kann in diesem
    // Moment noch gar nicht im Dokument stehen.
    if (offeneFlaeche !== wollen) {
      try { await popout?.close?.(); } catch { /* schon zu */ }
      await allesSchliessenAusser(null);
      markieren();
      return abgleichen();
    }
    if (!popout) offeneFlaeche = null;
    else {
      geoeffnet.set(wollen, popout);
      // Sichtbar wird ein Fenster erst mit dieser Klasse (siehe CSS). Alles
      // andere, was als Seitenleisten-Fenster auftaucht, bleibt unsichtbar —
      // Geister eingeschlossen.
      popout.element?.classList.add("inperson-offen");
    }

    markieren();
    abgleichen();

    // Schließt der Spieler es über das eigene Kreuz, erfahren wir es nur hier.
    popout?.element?.addEventListener?.("close", () => {
      if (offeneFlaeche === wollen) offeneFlaeche = null;
      queueSweep(".sidebar-popout", { reason: "vom Spieler geschlossen", force: true });
      markieren();
    }, { once: true });
  });
}

/**
 * Nachsehen, ob die Wirklichkeit noch zu `offeneFlaeche` passt.
 *
 * Der Wettlauf lässt sich nicht restlos ausschließen: Ein `renderPopout`, das
 * spät fertig wird, hängt sein Fenster ins Dokument, nachdem das letzte
 * Aufräumen durch war. Gemessen beim Hämmern im 60-Millisekunden-Takt — am Ende
 * stand das Akteursverzeichnis offen, obwohl zuletzt „Notizen" angetippt worden
 * war.
 *
 * Also wird kurz danach noch einmal verglichen und geradegezogen. Einmal, nicht
 * dauernd: Es geht um den Nachzügler, nicht um eine Überwachung.
 */
let abgleichTimer = null;

function abgleichen() {
  clearTimeout(abgleichTimer);
  abgleichTimer = setTimeout(() => {
    const soll = offeneFlaeche ? KLASSEN[offeneFlaeche] : null;
    for (const node of document.querySelectorAll(".sidebar-popout")) {
      if (soll && node.classList.contains(soll)) continue;
      const app = foundry.applications.instances?.get(node.id)
        ?? [...geoeffnet.values()].find(a => a?.element === node);
      if (app?.close) app.close().then(() => node.remove(), () => node.remove());
      else node.remove();
    }
  }, 900);
}

/** Woran man das Fenster einer Fläche im Dokument erkennt. */
const KLASSEN = {
  chars: "actors-sidebar",
  chat: "chat-sidebar",
  journal: "journal-sidebar"
};

/**
 * Alles zumachen, was nicht offen sein soll.
 *
 * Nicht „das eine schließen", sondern „alles außer diesem" — das repariert sich
 * selbst, auch wenn vorher etwas durchgerutscht ist. Danach die leeren Hüllen,
 * die Foundry stehen lässt (siehe shells.js).
 */
async function allesSchliessenAusser(behalten) {
  // Zuerst, synchron: alles Unerwünschte aus dem Bild nehmen. Das eigentliche
  // Schließen dauert, und in dieser Zeit stand der Rahmen sonst sichtbar da.
  for (const node of document.querySelectorAll(".sidebar-popout")) {
    const soll = behalten && KLASSEN[behalten] && node.classList.contains(KLASSEN[behalten]);
    if (!soll) node.classList.remove("inperson-offen");
  }

  // Erst über die Anwendung schließen, nicht über das Element. Wer den Knoten
  // wegnimmt, lässt eine Anwendung zurück, die sich für offen hält — und die
  // zeichnet sich bei der nächsten Gelegenheit wieder hin.
  //
  // Beide Wege, weil ein Fenster auf zwei Arten entstanden sein kann: über
  // `renderPopout` (dann hängt es an `app.popout`) oder von uns selbst gebaut
  // (dann steht es nur hier).
  for (const [name, app] of [...geoeffnet]) {
    if (name === behalten) continue;
    geoeffnet.delete(name);
    try { await app?.close?.(); } catch { /* war schon zu */ }
  }
  for (const [name, hol] of Object.entries(FLAECHEN)) {
    if (name === behalten) continue;
    const popout = hol()?.popout;
    if (!popout) continue;
    try { await popout.close(); } catch { /* war schon zu */ }
  }

  // Dann die Rahmen, die trotzdem stehen blieben. Foundry meldet für sie
  // `rendered === false` und lässt ihr Element im Dokument — siehe shells.js.
  queueSweep(".sidebar-popout", { reason: "nach dem Schließen", force: true });
}

/**
 * Ausklappen, notfalls von Hand.
 *
 * `renderPopout` ist nicht verlässlich: Monks Little Details fängt es für das
 * Akteursverzeichnis ab und öffnet stattdessen das eigene Charakterblatt, ohne
 * durchzureichen. Kommt nichts zurück, bauen wir das Fenster selbst — genau wie
 * in actor-panel.js.
 */
async function ausklappen(app) {
  try {
    const popout = await app.renderPopout?.();
    if (popout) return popout;
  } catch (error) {
    console.warn(`${MODULE_ID} | renderPopout scheiterte`, error);
  }

  try {
    const optionen = foundry.utils.mergeObject(app.options, {
      id: `${app.tabName ?? app.id}-popout`,
      window: { frame: true, positioned: true, minimizable: true, controls: [] }
    }, { inplace: false });
    optionen.classes = [...(optionen.classes ?? []), "sidebar-popout"];
    const eigen = new app.constructor(optionen);
    await eigen.render({ force: true });
    return eigen;
  } catch (error) {
    console.error(`${MODULE_ID} | Fläche ließ sich nicht öffnen`, error);
    return null;
  }
}

function flaecheSchliessen() {
  return nacheinander(async () => {
    offeneFlaeche = null;
    await allesSchliessenAusser(null);
    markieren();
    abgleichen();
  });
}

function markieren() {
  for (const b of document.querySelectorAll(`#${BAR_ID} [data-flaeche]`)) {
    b.setAttribute("aria-pressed", String(b.dataset.flaeche === offeneFlaeche));
  }
}

/* ── An und aus ──────────────────────────────────────────────────── */

async function starten() {
  if (laufend) return;
  laufend = true;
  document.body.classList.add(BODY_CLASS);
  resetPruefen();
  zoomAnwenden();
  leisteBauen();
  uhrBauen();
  lageAnwenden();
  sperreAnwenden();
  letzteLage = lage();
  // Das Tablet wird gedreht: Plätze und Größe der neuen Lage holen.
  window.addEventListener("resize", beimDrehen);
  await blattZeigen();
  console.log(`${MODULE_ID} | Blattansicht läuft (Beta)`);
}

async function beenden() {
  // Nicht an `laufend` hängen. Auf einem Spielleiter-Client standen beide
  // Leisten über der normalen Oberfläche, obwohl die Ansicht dort nie laufen
  // darf - wie auch immer sie dorthin kamen, das Aufräumen muss greifen, auch
  // wenn dieses Modul selbst glaubt, es sei nie gestartet worden.
  const spuren = document.getElementById(BAR_ANKER) || document.getElementById(UHR_ANKER)
    || document.getElementById(BAR_ID) || document.getElementById(UHR_ID)
    || document.body.classList.contains(BODY_CLASS);
  if (!laufend && !spuren) return;
  laufend = false;
  await flaecheSchliessen();
  geoeffnet.clear();
  removeShells(".sidebar-popout", { onlyGhost: false });
  document.body.classList.remove(BODY_CLASS);
  window.removeEventListener("resize", beimDrehen);
  for (const id of [BAR_ANKER, UHR_ANKER, BAR_ID, UHR_ID]) document.getElementById(id)?.remove();
  feldSchliessen(LAUT_ID);
  feldSchliessen(GROESSE_ID);
  document.documentElement.style.removeProperty("--inperson-sv-leiste");
  document.documentElement.style.removeProperty("--inperson-sv-uhr");
  blattApp()?.element?.classList.remove("inperson-stage-sheet");
  document.documentElement.style.removeProperty("--inperson-sv-zoom");
}

/** Zustand herstellen, wie die Einstellung ihn verlangt. */
export function syncSheetView() {
  if (!sheetViewWanted()) return beenden();
  if (laufend) {
    // Läuft schon - dann kann nur der Spielleiter etwas verlangt haben.
    if (resetPruefen()) { zoomAnwenden(); lageAnwenden(); }
    return;
  }
  return starten();
}

/**
 * Den Chat aufklappen, wenn der Spieler selbst etwas tut.
 *
 * Wer einen Trank benutzt oder würfelt, will das Ergebnis sehen, ohne erst
 * einen Knopf zu suchen. Nur eigene Nachrichten - sonst ginge bei jedem Wurf
 * des Spielleiters auf allen Tablets der Chat auf.
 */
function chatBeiBenutzung(message) {
  if (!laufend) return;
  if (!game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_CHAT_ON_USE)) return;
  if (message?.author?.id !== game.user.id) return;
  if (offeneFlaeche === "chat") return;
  flaecheUmschalten("chat");
}

export function installSheetView() {
  syncSheetView();

  Hooks.on("createChatMessage", message => chatBeiBenutzung(message));

  // Das Blatt ist die Bühne; ohne es ist der Schirm schwarz. Foundry schließt
  // es auf Escape, mancher Modulknopf schließt es auch - dann kommt es wieder,
  // sobald das Schließen durch ist. Gemessen: Escape im Lautstärkefeld nahm
  // das Blatt gleich mit.
  const wiederZeigen = app => {
    if (!laufend) return;
    if (app?.actor?.id !== characterOf(game.user)?.id && app?.document?.id !== characterOf(game.user)?.id) return;
    setTimeout(() => { if (laufend) blattZeigen(); }, 50);
  };
  Hooks.on("closeActorSheet", wiederZeigen);
  Hooks.on("closeApplicationV2", wiederZeigen);

  // Über das eigene Kreuz geschlossen: Das DOM-Ereignis "close" kam nicht
  // verlässlich, der Rahmen blieb als Geist stehen - über unsere Knöpfe nie,
  // weil dort hideShells vor dem Schließen läuft. Also dasselbe hier: sofort
  // unsichtbar, dann aufräumen, und was nach gut einer Sekunde noch steht,
  // ist eine Leiche.
  Hooks.on("closeApplicationV2", app => {
    if (!laufend) return;
    const el = app?.element;
    if (!el?.classList?.contains("sidebar-popout")) return;
    el.style.setProperty("display", "none", "important");
    for (const [name, a] of geoeffnet) if (a === app) geoeffnet.delete(name);
    const soll = offeneFlaeche ? KLASSEN[offeneFlaeche] : null;
    if (soll && el.classList.contains(soll)) offeneFlaeche = null;
    markieren();
    queueSweep(".sidebar-popout", { reason: "closeApplicationV2", force: true });
    setTimeout(() => { if (el.isConnected && isGhost(el)) el.remove(); }, 1200);
  });

  // Das Blatt wird bei jedem Akteurswechsel neu gezeichnet und verliert dabei
  // unsere Klasse.
  Hooks.on("renderActorSheet", app => {
    if (laufend && app?.actor?.id === characterOf(game.user)?.id) {
      app.element?.classList.add("inperson-stage-sheet");
    }
  });
  Hooks.on("renderApplicationV2", app => {
    if (laufend && app?.document?.id === characterOf(game.user)?.id) {
      app.element?.classList.add("inperson-stage-sheet");
    }
  });
}
