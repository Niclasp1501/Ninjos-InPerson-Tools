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

const BODY_CLASS = "inperson-sheetview";
const BAR_ID = "inperson-sheetview-bar";

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
 * Die Knöpfe, ausgeschrieben.
 *
 * Die Sprachschlüssel stehen hier vollständig da statt aus `SheetView.${name}`
 * zusammengesetzt zu werden: Der Prüfer liest den Quelltext, um zu sehen, ob
 * jeder Schlüssel in beiden Sprachen vorhanden ist, und einen Schlüssel, den er
 * nicht sieht, kann er auch nicht vermissen.
 */
const KNOEPFE = [
  { text: "INPERSON.SheetView.Who",   titel: "INPERSON.SheetView.WhoHint",   flaeche: "chars" },
  { text: "INPERSON.SheetView.Chat",  titel: "INPERSON.SheetView.ChatHint",  flaeche: "chat" },
  { text: "INPERSON.SheetView.Notes", titel: "INPERSON.SheetView.NotesHint", flaeche: "journal" },
  { text: "INPERSON.SheetView.Trade", titel: "INPERSON.SheetView.TradeHint", tun: () => openTrade() }
];

const SOFORT = [
  { zeichen: "A−", titel: "INPERSON.SheetView.Smaller",    tun: () => zoomen(-0.1) },
  { zeichen: "A+",       titel: "INPERSON.SheetView.Bigger",     tun: () => zoomen(0.1) },
  { zeichen: "⛶",  titel: "INPERSON.SheetView.Fullscreen", tun: vollbild },
  { zeichen: "⏻",  titel: "INPERSON.SheetView.LogOut",     tun: abmelden }
];

/** Ein Knopf. `flaeche` ruft eine Fläche, `tun` macht sofort etwas. */
function knopf({ text, titel, flaeche = null, tun = null, sofort = false }) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.title = titel;
  b.setAttribute("aria-label", titel);
  if (sofort) b.classList.add("now");
  if (flaeche) {
    b.dataset.flaeche = flaeche;
    b.setAttribute("aria-pressed", "false");
  }
  b.addEventListener("click", () => (flaeche ? flaecheUmschalten(flaeche) : tun?.()));
  return b;
}

function leisteBauen() {
  if (document.getElementById(BAR_ID)) return;

  const bar = document.createElement("div");
  bar.id = BAR_ID;
  bar.className = "inperson-sheetview-bar";

  for (const k of KNOEPFE) {
    bar.append(knopf({
      text: game.i18n.localize(k.text),
      titel: game.i18n.localize(k.titel),
      flaeche: k.flaeche,
      tun: k.tun
    }));
  }

  const trenner = document.createElement("span");
  trenner.className = "inperson-sv-spacer";
  bar.append(trenner);

  for (const k of SOFORT) {
    bar.append(knopf({
      text: k.zeichen,
      titel: game.i18n.localize(k.titel),
      tun: k.tun,
      sofort: true
    }));
  }

  document.body.appendChild(bar);
  mountClockInto(bar);
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
  await blattZeigen();
  console.log(`${MODULE_ID} | Blattansicht läuft (Beta)`);
}

async function beenden() {
  if (!laufend) return;
  laufend = false;
  await flaecheSchliessen();
  document.body.classList.remove(BODY_CLASS);
  document.getElementById(BAR_ID)?.remove();
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
