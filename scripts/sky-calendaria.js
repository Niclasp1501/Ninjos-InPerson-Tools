/**
 * Calendarias eigene Kuppel ausleihen - die schöne, teure Fassung.
 *
 * Unsere Kuppel zeichnet mit SVG-Formen, die das CSS bewegt: ein paar Dutzend
 * Striche und Punkte. Calendaria fährt dafür eine PixiJS-Szene auf einer
 * WebGL-Fläche auf, mit Tausenden Partikeln, Weichzeichnern und Wind. Das
 * sieht besser aus und kostet mehr - auf einem Tablet, dem wir gerade das
 * Spielfeld abgeschaltet haben, ist das ein echter Unterschied.
 *
 * Deshalb entscheidet der Spielleiter, und deshalb steht hier nicht der Code
 * ihrer Szene, sondern nur der Griff daran: Wir lassen Calendaria seine
 * Kuppel bauen und hängen genau dieses eine Element in unsere Leiste um.
 *
 * **Drei Vorsichtsmaßnahmen**, jede aus einem echten Fall:
 *
 * 1. **Niemals eine sichtbare fremde Kuppel stehlen.** Der Spielleiter hat
 *    Calendarias HUD selbst offen; wer ihm dort die Kuppel herauszieht, macht
 *    ein fremdes Fenster kaputt. Steht schon eine, die nicht von uns ist,
 *    fallen wir auf die eigene zurück.
 * 2. **Nach jedem Neuzeichnen wieder zugreifen.** Calendaria zeichnet die
 *    Kuppel bei jedem Wetterwechsel neu (`render({parts:["dome","bar"]})`);
 *    unser umgehängtes Element wäre danach eine Waise, und im HUD stünde ein
 *    neues.
 * 3. **Alles hinter Prüfungen.** Es ist eine innere Klasse eines fremden
 *    Moduls, kein zugesagter Weg. Fällt sie weg oder heißt sie anders, geht
 *    hier nichts kaputt - es kommt einfach unsere eigene Kuppel.
 */

import { MODULE_ID } from "./const.js";

/** Unsere eigene Instanz, damit wir keine fremde anfassen müssen. */
let eigenesHud = null;
let kuppel = null;
let haengtIn = null;
let hookId = null;

/** Läuft Calendaria, und hat es die Kuppel, die wir meinen? */
export function calendariaKuppelMoeglich() {
  if (!game.modules.get("calendaria")?.active) return false;
  const HUD = globalThis.CALENDARIA?.apps?.HUD;
  if (typeof HUD !== "function") return false;
  // Ohne Leseerlaubnis für das HUD bekämen wir ein leeres Fenster.
  try {
    const darf = globalThis.CALENDARIA?.permissions?.canViewHUD;
    if (typeof darf === "function" && !darf()) return false;
  } catch { /* dann eben versuchen */ }
  return true;
}

/** Steht schon eine Kuppel im Bild, die jemand anderem gehört? */
function fremdeKuppelSichtbar() {
  for (const hud of document.querySelectorAll(".calendaria-hud")) {
    if (hud !== eigenesHud?.element) return true;
  }
  return false;
}

/**
 * Das Kuppel-Element besorgen: unser eigenes HUD bauen, wenn es noch keins
 * gibt, und daraus die Kuppel nehmen.
 */
async function kuppelBesorgen() {
  if (!eigenesHud) {
    const HUD = globalThis.CALENDARIA.apps.HUD;
    eigenesHud = new HUD();
    await eigenesHud.render({ force: true });
    // Das Fenster selbst wollen wir nicht sehen - nur seine Kuppel. Es bleibt
    // im Dokument, weil Calendaria darin weiterrechnet.
    eigenesHud.element?.style.setProperty("display", "none", "important");
  }
  const gefunden = eigenesHud.element?.querySelector(".dome");
  if (!gefunden) return null;
  // Calendaria blendet die Kuppel je nach Einstellung selbst aus; in unserer
  // Leiste ist sie der ganze Zweck.
  gefunden.classList.remove("hidden");
  gefunden.style.removeProperty("opacity");
  gefunden.classList.add("inperson-fremde-kuppel");
  return gefunden;
}

/** Die Kuppel in unseren Platzhalter hängen - und dort halten. */
export async function kuppelEinhaengen(platz) {
  if (!platz || !calendariaKuppelMoeglich()) return false;
  if (fremdeKuppelSichtbar()) return false;

  try {
    kuppel = await kuppelBesorgen();
    if (!kuppel) return false;
    platz.replaceChildren(kuppel);
    haengtIn = platz;

    // Nach jedem Neuzeichnen des HUD steckt eine frische Kuppel darin.
    if (hookId === null) {
      hookId = Hooks.on("renderApplicationV2", app => {
        if (app !== eigenesHud || !haengtIn?.isConnected) return;
        // Im nächsten Zug: Calendaria ist mit dem Einhängen noch nicht fertig.
        setTimeout(() => kuppelEinhaengen(haengtIn), 0);
      });
    }
    return true;
  } catch (fehler) {
    console.warn(`${MODULE_ID} | Calendarias Kuppel ließ sich nicht einhängen`, fehler);
    return false;
  }
}

/** Alles zurückgeben: Hook ab, Fenster zu, Kuppel weg. */
export function kuppelLoslassen() {
  if (hookId !== null) {
    Hooks.off("renderApplicationV2", hookId);
    hookId = null;
  }
  haengtIn = null;
  kuppel = null;
  try { eigenesHud?.close(); } catch { /* schon zu */ }
  eigenesHud = null;
}
