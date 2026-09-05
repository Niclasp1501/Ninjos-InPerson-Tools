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
import { queueSweep, removeShells } from "./shells.js";

const BODY_CLASS = "inperson-sheetview";
const BAR_ID = "inperson-sheetview-bar";
const UHR_ID = "inperson-sheetview-uhr";

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
    { icon: "fa-magnifying-glass-plus",  titel: "INPERSON.SheetView.Bigger",     tun: () => zoomen(0.1) },
    { icon: "fa-expand",                 titel: "INPERSON.SheetView.Fullscreen", tun: vollbild },
    { icon: "fa-right-from-bracket",     titel: "INPERSON.SheetView.LogOut",     tun: abmelden }
  ]
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
  b.innerHTML = `<i class="fa-solid ${icon}"></i>`;
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

  document.body.appendChild(bar);
  gruppeZeichnen(bar);
  ziehbarMachen(bar, PLATZ_KEY);
  platzWiederherstellen(bar, PLATZ_KEY);
}

/**
 * Die Zeitleiste steht für sich.
 *
 * Sie steckte zuerst in der Knopfleiste — mit dem Himmelsbogen darin wurde die
 * 833 Pixel breit und 96 hoch, also alles andere als klein. Es sind auch zwei
 * verschiedene Dinge: die eine wird bedient, die andere angeschaut. Beide sind
 * verschiebbar, jede mit ihrem eigenen gemerkten Platz.
 */
function uhrBauen() {
  if (document.getElementById(UHR_ID)) return;
  const halter = document.createElement("div");
  halter.id = UHR_ID;
  halter.className = "inperson-sheetview-uhr";
  document.body.appendChild(halter);
  mountClockInto(halter);
  if (!halter.firstChild) return halter.remove();   // Leiste ist abgeschaltet
  ziehbarMachen(halter, UHR_PLATZ_KEY);
  platzWiederherstellen(halter, UHR_PLATZ_KEY);
}

/* ── Verschieben ─────────────────────────────────────────────────── */

// Version 2 der Schlüssel: Die alten enthalten Plätze aus der Zeit, als beide
// Leisten oben standen und sich überdeckten. Ein neuer Name wirft sie weg,
// ohne dass jemand etwas löschen muss.
const PLATZ_KEY = `${MODULE_ID}.sheetviewBar2`;
const UHR_PLATZ_KEY = `${MODULE_ID}.sheetviewUhr2`;
const HALTEN_MS = 400;

let gezogen = false;
let timer = null;
let gegriffen = null;
let griffX = 0;
let griffY = 0;

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
 */
function ziehbarMachen(bar, key) {
  const start = event => {
    gezogen = false;
    const punkt = event.touches?.[0] ?? event;
    clearTimeout(timer);
    timer = setTimeout(() => {
      gezogen = true;
      gegriffen = bar;
      bar.classList.add("wird-gezogen");
      const r = bar.getBoundingClientRect();
      griffX = punkt.clientX - r.left;
      griffY = punkt.clientY - r.top;
    }, HALTEN_MS);
  };

  const bewegen = event => {
    if (!gegriffen) return;
    event.preventDefault();
    const punkt = event.touches?.[0] ?? event;
    setzen(bar, punkt.clientX - griffX, punkt.clientY - griffY);
  };

  const ende = () => {
    clearTimeout(timer);
    if (gegriffen) {
      gegriffen.classList.remove("wird-gezogen");
      const r = bar.getBoundingClientRect();
      localStorage.setItem(key, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) }));
      gegriffen = null;
    }
    // Erst nach dem Klick zurücksetzen, sonst feuert der Knopf doch noch.
    setTimeout(() => { gezogen = false; }, 0);
  };

  bar.addEventListener("mousedown", start);
  bar.addEventListener("touchstart", start, { passive: true });
  document.addEventListener("mousemove", bewegen);
  document.addEventListener("touchmove", bewegen, { passive: false });
  document.addEventListener("mouseup", ende);
  document.addEventListener("touchend", ende);
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
  bar.style.left = `${Math.min(maxX, Math.max(0, x))}px`;
  bar.style.top = `${Math.min(maxY, Math.max(0, y))}px`;
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
function platzWiederherstellen(bar, key) {
  let platz = null;
  try { platz = JSON.parse(localStorage.getItem(key) ?? "null"); } catch { /* egal */ }
  if (!platz) return;
  if (platz.x > window.innerWidth - 40 || platz.y > window.innerHeight - 40) return;

  const vorher = bar.getBoundingClientRect();
  setzen(bar, platz.x, platz.y);

  const andere = document.getElementById(bar.id === BAR_ID ? UHR_ID : BAR_ID);
  if (andere && ueberlappen(bar, andere)) {
    // Zurück auf den Platz aus dem Stylesheet.
    bar.style.removeProperty("left");
    bar.style.removeProperty("top");
    bar.style.removeProperty("right");
    bar.style.removeProperty("bottom");
    bar.style.removeProperty("transform");
    localStorage.removeItem(key);
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
  const neu = Math.min(1.8, Math.max(0.7, Math.round((jetzt + schritt) * 10) / 10));
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

async function flaecheUmschalten(name) {
  if (offeneFlaeche === name) return flaecheSchliessen();
  await flaecheSchliessen();

  const app = FLAECHEN[name]?.();
  if (!app) return;

  const popout = await ausklappen(app);
  if (!popout) return;

  offeneFlaeche = name;
  markieren();

  // Wenn der Spieler das Fenster über dessen eigenes Kreuz schließt, erfahren
  // wir es nur hier.
  const node = popout.element;
  node?.addEventListener?.("close", () => {
    offeneFlaeche = null;
    queueSweep(".sidebar-popout", { reason: "vom Spieler geschlossen", force: true });
    markieren();
  }, { once: true });
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

async function flaecheSchliessen() {
  offeneFlaeche = null;
  for (const node of document.querySelectorAll(".sidebar-popout")) {
    const app = foundry.applications.instances?.get(node.id);
    if (app?.close) await app.close();
    else node.remove();
  }
  // Und danach die Leichen. Foundry lässt die Hülle stehen — siehe shells.js;
  // ohne das bleibt ein leerer Rahmen am Rand kleben und der Knopf glaubt
  // weiterhin, die Fläche sei offen.
  queueSweep(".sidebar-popout", { reason: "Fläche geschlossen", force: true });
  markieren();
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
  zoomAnwenden();
  leisteBauen();
  uhrBauen();
  await blattZeigen();
  console.log(`${MODULE_ID} | Blattansicht läuft (Beta)`);
}

async function beenden() {
  if (!laufend) return;
  laufend = false;
  await flaecheSchliessen();
  removeShells(".sidebar-popout", { onlyGhost: false });
  document.body.classList.remove(BODY_CLASS);
  document.getElementById(BAR_ID)?.remove();
  document.getElementById(UHR_ID)?.remove();
  blattApp()?.element?.classList.remove("inperson-stage-sheet");
  document.documentElement.style.removeProperty("--inperson-sv-zoom");
}

/** Zustand herstellen, wie die Einstellung ihn verlangt. */
export function syncSheetView() {
  if (sheetViewWanted()) starten();
  else beenden();
}

export function installSheetView() {
  syncSheetView();

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
