/**
 * Calendarias eigene Kuppel ausleihen - die schöne, teure Fassung.
 *
 * Unsere Kuppel zeichnet mit SVG-Formen, die das CSS bewegt: ein paar Dutzend
 * Striche und Punkte. Calendaria fährt dafür eine PixiJS-Szene auf einer
 * WebGL-Fläche auf, mit Tausenden Partikeln, Weichzeichnern und Wind. Das
 * sieht besser aus und kostet mehr - auf einem Tablet, dem wir gerade das
 * Spielfeld abgeschaltet haben, ist das ein echter Unterschied. Deshalb
 * entscheidet der Spielleiter, und deshalb steht hier nicht der Code ihrer
 * Szene, sondern nur der Griff daran.
 *
 * **Wir hängen das ganze Fenster um, nicht die Kuppel.** Der erste Versuch
 * nahm nur das `.dome`-Element heraus - Himmel und Sonne kamen, aber nie ein
 * Regentropfen. Der Grund steht in ihrem Code:
 *
 *     #dm(t, o) { const i = this.element?.querySelector(t); if (!i) return; … }
 *
 * Sie suchen die Zeichenfläche **innerhalb ihres Fensters**. Wandert die
 * Kuppel heraus, findet diese Suche nichts, die Funktion steigt aus, und
 * `setEffect` - das einzige, was je ein Wetter auf die Fläche bringt - wird
 * nie wieder gerufen. Also bleibt die Kuppel, wo sie hingehört, und das
 * Fenster kommt mit: aus dem Bild geschoben ist alles außer der Kuppel, und
 * Calendaria verwaltet seine Fläche weiter, als wäre nichts gewesen.
 *
 * **Drei Vorsichtsmaßnahmen**, jede aus einem echten Fall:
 *
 * 1. **Niemals ein sichtbares fremdes Fenster stehlen.** Der Spielleiter hat
 *    das HUD selbst offen; wer es ihm wegnimmt, macht seine Oberfläche kaputt.
 *    Steht schon ein sichtbares da, fallen wir auf die eigene Kuppel zurück.
 * 2. **Das Fenster festhalten.** Unsere Zeitleiste baut sich jede Minute über
 *    `innerHTML` neu auf und nimmt dabei jedes Kind heraus. Für Calendaria
 *    ist das Fenster damit nicht weg, sondern nur nicht mehr im Dokument - es
 *    baut kein neues. Wer es nicht festhält, verliert die Kuppel beim ersten
 *    Minutenwechsel.
 * 3. **Alles hinter Prüfungen.** Es ist eine innere Klasse eines fremden
 *    Moduls, kein zugesagter Weg. Fällt sie weg oder heißt sie anders, geht
 *    hier nichts kaputt - es kommt einfach unsere eigene Kuppel.
 */

import { MODULE_ID } from "./const.js";

/** Unsere eigene Instanz, damit wir keine fremde anfassen müssen. */
let eigenesHud = null;
let haengtIn = null;
let hookId = null;

/**
 * Kann dieses Gerät überhaupt WebGL?
 *
 * Calendarias Kuppel ist eine PixiJS-Szene und braucht eine Grafikeinheit.
 * Genau die haben wir auf diesen Geräten gerade abgeschaltet (`core.noCanvas`),
 * und ein älteres Android-Tablet gibt womöglich gar keinen Kontext mehr her -
 * dann stünde dort eine leere Fläche statt einer Kuppel. Einmal geprüft und
 * gemerkt; der Testkontext wird sofort wieder freigegeben, sonst hielten wir
 * einen der wenigen Plätze besetzt, die ein Browser vergibt.
 */
let webgl = null;
function webglMoeglich() {
  if (webgl !== null) return webgl;
  try {
    const probe = document.createElement("canvas");
    const kontext = probe.getContext("webgl2") ?? probe.getContext("webgl");
    kontext?.getExtension("WEBGL_lose_context")?.loseContext();
    webgl = !!kontext;
  } catch {
    webgl = false;
  }
  return webgl;
}

/** Läuft Calendaria, und hat es die Kuppel, die wir meinen? */
export function calendariaKuppelMoeglich() {
  if (!game.modules.get("calendaria")?.active) return false;
  if (!webglMoeglich()) return false;
  const HUD = globalThis.CALENDARIA?.apps?.HUD;
  if (typeof HUD !== "function") return false;
  // Ohne Leseerlaubnis für das HUD bekämen wir ein leeres Fenster.
  try {
    const darf = globalThis.CALENDARIA?.permissions?.canViewHUD;
    if (typeof darf === "function" && !darf()) return false;
  } catch { /* dann eben versuchen */ }
  return true;
}

/**
 * Steht schon ein Kalenderfenster im Bild, das jemand anderem gehört?
 *
 * Nur sichtbare zählen. Calendaria legt sein HUD auch dann an, wenn es
 * ausgeschaltet ist; ein Fenster mit `display: none` zeigt niemandem etwas.
 */
function fremdesHudSichtbar() {
  for (const hud of document.querySelectorAll(".calendaria-hud")) {
    if (hud === eigenesHud?.element) continue;
    if (getComputedStyle(hud).display === "none") continue;
    return true;
  }
  return false;
}

/** Unser eigenes, unsichtbares Kalenderfenster - einmal gebaut, dann behalten. */
async function hudBesorgen() {
  if (eigenesHud?.element?.isConnected || eigenesHud?.element) return eigenesHud;
  const HUD = globalThis.CALENDARIA.apps.HUD;
  eigenesHud = new HUD();
  await eigenesHud.render({ force: true });
  eigenesHud.element?.classList.add("inperson-fremde-kuppel");
  return eigenesHud;
}

/** Das Fenster in unseren Platzhalter hängen - und dort halten. */
export async function kuppelEinhaengen(platz) {
  if (!platz || !calendariaKuppelMoeglich()) return false;
  if (fremdesHudSichtbar()) return false;

  try {
    const hud = await hudBesorgen();
    const element = hud?.element;
    if (!element) return false;

    if (element.parentElement !== platz) platz.replaceChildren(element);
    haengtIn = platz;

    // Erst jetzt das Wetter anwenden: Vorher hing das Fenster woanders und
    // hatte womöglich keine Größe - eine Partikelszene auf null mal null
    // Pixeln wirft nichts aus. Nach dem Umhängen findet ihre eigene Suche
    // die Fläche wieder, und `setEffect` läuft mit den richtigen Maßen.
    await hud.render({ parts: ["dome"] });

    // Calendaria blendet die Kuppel je nach Einstellung selbst aus; in
    // unserer Leiste ist sie der ganze Zweck.
    const kuppel = element.querySelector(".dome");
    if (!kuppel) return false;
    kuppel.classList.remove("hidden");
    kuppel.style.removeProperty("opacity");

    // Nach jedem Neuzeichnen kann Calendaria die Kuppel wieder verstecken
    // oder das Fenster verschieben wollen.
    if (hookId === null) {
      hookId = Hooks.on("renderApplicationV2", app => {
        if (app !== eigenesHud || !haengtIn?.isConnected) return;
        const frisch = app.element?.querySelector(".dome");
        frisch?.classList.remove("hidden");
        frisch?.style.removeProperty("opacity");
      });
    }
    return true;
  } catch (fehler) {
    console.warn(`${MODULE_ID} | Calendarias Kuppel ließ sich nicht einhängen`, fehler);
    return false;
  }
}

/** Alles zurückgeben: Hook ab, Fenster zu. */
export function kuppelLoslassen() {
  if (hookId !== null) {
    Hooks.off("renderApplicationV2", hookId);
    hookId = null;
  }
  haengtIn = null;
  try { eigenesHud?.close(); } catch { /* schon zu */ }
  eigenesHud = null;
}
