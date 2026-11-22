/**
 * Was die beiden Monitore von Foundrys Oberfläche zeigen, und wie gezeigte
 * Bilder und Journale dort erscheinen und wieder gehen.
 *
 * Bis zum 22.11.2026 hat das Monk's Common Display erledigt. Ninjo wollte es
 * im freien Modul, „damit das auch standalone fähig ist“. Nachgebaut nach dem
 * Verhalten, ohne Code von dort (es steht unter GPL-3.0): siehe die Analyse
 * vom 20.11.2026.
 *
 * **Erlaubnisliste statt Kampf gegen fremde Regeln.** Ausgeblendet werden
 * benannte Teile von Foundry, je Monitor wählbar. Der eine Sammelpunkt
 * „Einblendungen anderer Module“ blendet jedes direkte Kind von `<body>` aus,
 * das weder zu Foundrys Spielfeld noch zu einem Fenster noch zu uns gehört.
 * Was wir selbst an `<body>` hängen, beginnt mit „inperson“ und bleibt so
 * sichtbar, ohne dass jede neue Anzeige einen Umweg braucht.
 *
 * **Läuft Monk's Common Display noch, tut dieser Teil nichts.** Zwei
 * Ausblenderegeln, die gegeneinander arbeiten, sind schlimmer als eine. Das
 * Einrichtungsfenster sagt es dann dazu.
 */

import { MODULE_ID, SETTINGS, SOCKET } from "./const.js";
import { isMonitorUser, isSceneDisplay } from "./state.js";

/** Die Teile, die ein Monitor ausblenden kann. Je Teil eine Regel im Stylesheet. */
export const TEILE = [
  { id: "controls",   titel: "INPERSON.MonitorUi.Part.Controls" },
  { id: "players",    titel: "INPERSON.MonitorUi.Part.Players" },
  { id: "navigation", titel: "INPERSON.MonitorUi.Part.Navigation" },
  { id: "hotbar",     titel: "INPERSON.MonitorUi.Part.Hotbar" },
  { id: "sidebar",    titel: "INPERSON.MonitorUi.Part.Sidebar" },
  { id: "chat",       titel: "INPERSON.MonitorUi.Part.Chat" },
  { id: "cameras",    titel: "INPERSON.MonitorUi.Part.Cameras" },
  { id: "foreign",    titel: "INPERSON.MonitorUi.Part.Foreign" }
];
const ALLE = TEILE.map(t => t.id);

/** Ab Werk ist auf beiden Monitoren alles aus, wie bisher mit Common Display. */
export const VORGABE = { sc: [...ALLE], bm: [...ALLE] };

export const COMMON_DISPLAY = "monks-common-display";

/** Ist Monk's Common Display in dieser Welt aktiv? Dann halten wir uns heraus. */
export function commonDisplayAktiv() {
  return !!game.modules?.get?.(COMMON_DISPLAY)?.active;
}

/**
 * Die gespeicherte Wahl, bereinigt.
 * @param {object} roh
 * @returns {{sc: string[], bm: string[]}}
 */
export function teileLesen(roh) {
  const sauber = liste => Array.isArray(liste) ? [...new Set(liste.filter(t => ALLE.includes(t)))] : null;
  return { sc: sauber(roh?.sc) ?? [...VORGABE.sc], bm: sauber(roh?.bm) ?? [...VORGABE.bm] };
}

/** Welcher Monitor dieses Konto ist: "sc", "bm" oder null. */
export function monitorArt(user) {
  if (!isMonitorUser(user)) return null;
  return isSceneDisplay(user) ? "sc" : "bm";
}

const get = key => game.settings.get(MODULE_ID, key);

/**
 * Was auf diesem Gerät gilt: die Liste der auszublendenden Teile und ob
 * Gezeigtes groß erscheint. Leer, wenn das Gerät kein Monitor ist oder
 * Common Display noch läuft.
 */
export function hierGilt(user = game.user) {
  const art = monitorArt(user);
  if (!art || commonDisplayAktiv()) return { teile: [], gross: false, art };
  return { teile: teileLesen(get(SETTINGS.MONITOR_UI))[art], gross: get(SETTINGS.MONITOR_LARGE) !== false, art };
}

/** Die Klassen am `body` setzen. Bei `setup`, und wann immer sich etwas ändert. */
export function monitorAnzeigeAnwenden() {
  const body = document.body;
  if (!body) return;
  const { teile, gross } = hierGilt();
  for (const id of ALLE) body.classList.toggle(`inperson-ui-aus-${id}`, teile.includes(id));
  body.classList.toggle("inperson-gezeigt-gross", gross);
}

/* ── Gezeigtes auf dem Monitor ──────────────────────────────────── */

/** Fenster → Zeitgeber für das Selbstschließen. */
const _zeitgeber = new WeakMap();

function istBild(app) {
  const Bild = foundry.applications?.apps?.ImagePopout;
  return !!Bild && app instanceof Bild;
}

function istJournal(app) {
  const doc = app?.document;
  return doc?.documentName === "JournalEntry" || doc?.documentName === "JournalEntryPage";
}

/**
 * Ein gezeigtes Fenster auf dem Monitor: groß, ohne Kopf, und nach der
 * eingestellten Zeit wieder zu. Jedes neue Zeichnen startet die Uhr neu, denn
 * ein zweites Zeigen desselben Journals zeichnet dasselbe Fenster neu.
 */
function gezeigtGezeichnet(app) {
  const bild = istBild(app);
  if (!bild && !istJournal(app)) return;
  const { art, gross } = hierGilt();
  if (!art) return;
  app.element?.classList.add("inperson-monitor-gezeigt", bild ? "inperson-monitor-bild" : "inperson-monitor-journal");
  app.element?.classList.toggle("ist-gross", gross);
  if (commonDisplayAktiv()) return;

  clearTimeout(_zeitgeber.get(app));
  const sekunden = Number(get(bild ? SETTINGS.MONITOR_CLOSE_IMAGE : SETTINGS.MONITOR_CLOSE_JOURNAL)) || 0;
  if (sekunden > 0) _zeitgeber.set(app, setTimeout(() => app.close?.().catch?.(() => { }), sekunden * 1000));
}

/**
 * Alles Gezeigte auf diesem Gerät schließen: Bilder und Journale.
 * @returns {Promise<number>} wie viele Fenster zugingen
 */
export async function gezeigtesSchliessen() {
  let zu = 0;
  for (const app of [...(foundry.applications?.instances?.values?.() ?? [])]) {
    if (!istBild(app) && !istJournal(app)) continue;
    try { await app.close(); zu++; } catch { /* schon zu */ }
  }
  return zu;
}

/**
 * Die Spielleitung schließt auf beiden Monitoren, was dort gezeigt wird.
 * Nur dort, nicht bei sich selbst und nicht bei den Spielern.
 */
export function aufMonitorenSchliessen() {
  if (!game.user.isGM) return false;
  game.socket.emit(SOCKET.NAME, { type: SOCKET.MONITOR_CLOSE, von: game.user.id });
  return true;
}

/** Die Nachricht beim Monitor. */
export function monitorSocket(nachricht) {
  if (nachricht?.type !== SOCKET.MONITOR_CLOSE) return;
  if (!monitorArt(game.user)) return;
  if (!game.users.get(nachricht.von)?.isGM) return;
  gezeigtesSchliessen();
}

/** Der Knopf in der Begleitleiste der Spielleitung. */
export function schliessenKnopf() {
  const titel = game.i18n.localize("INPERSON.MonitorUi.CloseShown");
  const knopf = document.createElement("button");
  knopf.type = "button";
  knopf.className = "inperson-begleitleiste-schoner";
  knopf.setAttribute("aria-label", titel);
  knopf.dataset.tooltip = titel;
  knopf.innerHTML = `<i class="fa-solid fa-rectangle-xmark" aria-hidden="true"></i>`;
  knopf.addEventListener("click", () => aufMonitorenSchliessen());
  return knopf;
}

export function installMonitorAnzeige() {
  monitorAnzeigeAnwenden();
  Hooks.on("renderApplicationV2", app => {
    try { gezeigtGezeichnet(app); }
    catch (fehler) { console.warn(`${MODULE_ID} | Gezeigtes auf dem Monitor`, fehler); }
  });
  Hooks.on("closeApplicationV2", app => clearTimeout(_zeitgeber.get(app)));
  if (game.user.isGM && commonDisplayAktiv()) {
    console.info(`${MODULE_ID} | Monk's Common Display ist aktiv; die Monitoranzeige von In-Person bleibt aus, bis es abgeschaltet ist.`);
  }
}
