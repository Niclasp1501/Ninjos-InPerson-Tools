/**
 * Das Steuerungsfenster für die Ebene des Battlemap-Monitors.
 *
 * Drei Dinge an einer Stelle, weil man sie im selben Moment braucht:
 *
 *   - die Art, wie der Monitor seine Ebene wählt: autonom, wie Foundry, manuell
 *   - die Ebenen der aktiven Karte, mit der Zahl der Spielerfiguren darauf; ein
 *     Tipp auf eine Ebene gibt sie vor und schaltet auf manuell
 *   - was den Fernseher schwarz machen würde: Ebenen, auf denen der Monitor
 *     durch keine Figur sieht, und Spielerfiguren, die er nicht beobachten darf
 *
 * Der letzte Punkt ist kein Beiwerk. Der Monitor sieht nur durch die Augen der
 * Figuren, die er beobachten darf. Fehlt ihm dieses Recht, bleibt das Bild
 * schwarz, egal wie klug er seine Ebene wählt. Am 26.09.2026 fehlte es für
 * Nyra Nordwind, eine neue Figur, und niemand hatte es bemerkt.
 *
 * Geöffnet über Shift+E, über den Knopf am Battlemap-Monitor im Bedienfeld und
 * über den Rechtsklick auf eine Ebene in der Navigationsleiste (der gibt die
 * Ebene direkt vor, ohne Fenster).
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { isMonitorUser } from "./state.js";
import { getBattlemapDisplay } from "./monitor.js";
import {
  MODI, modus, vorgabe, dachOffen, ebeneVon, istSpielerfigur, ebeneVorgeben, modusSetzen
} from "./ebenen.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Ausgeschrieben statt zusammengesetzt, damit die Prüfung der Sprachdateien sie findet. */
const MODUS_TEXTE = {
  autonom: { name: "INPERSON.Ebenen.Mode.autonom", hint: "INPERSON.Ebenen.Mode.autonomHint" },
  foundry: { name: "INPERSON.Ebenen.Mode.foundry", hint: "INPERSON.Ebenen.Mode.foundryHint" },
  manuell: { name: "INPERSON.Ebenen.Mode.manuell", hint: "INPERSON.Ebenen.Mode.manuellHint" }
};

class EbenenSteuerung extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-ebenen",
    tag: "div",
    window: { title: "INPERSON.Ebenen.Title", icon: "fa-solid fa-layer-group", resizable: true },
    position: { width: 420, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-ebenen"],
    actions: {
      art: EbenenSteuerung.#onArt,
      ebene: EbenenSteuerung.#onEbene,
      dach: EbenenSteuerung.#onDach,
      rechte: EbenenSteuerung.#onRechte
    }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/ebenen.hbs`, scrollable: [".inperson-ebenen-liste"] }
  };

  /** @override */
  async _prepareContext() {
    const monitor = getBattlemapDisplay();
    const scene = game.scenes?.active ?? null;
    const art = modus();
    const { sceneId, levelId } = vorgabe();

    const modi = MODI.map(id => ({ id, aktiv: id === art, ...MODUS_TEXTE[id] }));

    const ebenen = [];
    const mehrere = (scene?.levels?.size ?? 0) > 1;
    if (scene && mehrere) {
      const zeigt = monitor?.viewedScene === scene.id ? monitor.viewedLevel : null;
      // Von oben nach unten, wie ein Haus steht: das Dach zuerst.
      for (const level of [...scene.levels.sorted].reverse()) {
        const hier = scene.tokens.filter(t => ebeneVon(t) === level.id && !t.hidden);
        ebenen.push({
          id: level.id,
          name: level.name,
          figuren: hier.filter(t => istSpielerfigur(t)).length,
          zeigt: level.id === zeigt,
          vorgegeben: art === "manuell" && sceneId === scene.id && levelId === level.id,
          ohneSicht: !!monitor && scene.tokenVision && !hier.some(t =>
            t.sight?.enabled && t.actor?.testUserPermission(monitor, "OBSERVER"))
        });
      }
    }

    return {
      hatMonitor: !!monitor,
      monitorName: monitor?.name ?? "",
      monitorOffline: !!monitor && !monitor.active,
      szene: scene?.name ?? null,
      mehrere,
      modi,
      ebenen,
      vorgabeAnderswo: art === "manuell" && !!sceneId && sceneId !== scene?.id,
      dachOffen: dachOffen(),
      fehlend: monitor ? ohneBeobachterrecht(monitor).map(a => a.name) : []
    };
  }

  static async #onArt(event, target) {
    const art = target.dataset.art;
    if (art === "manuell") {
      // Manuell braucht eine Ebene. Ohne Vorgabe für diese Karte nehmen wir
      // die, die der Monitor gerade zeigt; so ändert der Knopf allein nichts
      // am Bild, er hält es nur fest.
      const scene = game.scenes?.active;
      const monitor = getBattlemapDisplay();
      if (scene && vorgabe().sceneId !== scene.id) {
        const jetzt = monitor?.viewedScene === scene.id ? monitor.viewedLevel : null;
        const ebene = jetzt ?? scene.initialLevel?.id;
        if (ebene) return ebeneVorgeben(scene.id, ebene);
      }
    }
    await modusSetzen(art);
  }

  static async #onEbene(event, target) {
    const scene = game.scenes?.active;
    if (scene && target.dataset.levelId) await ebeneVorgeben(scene.id, target.dataset.levelId);
  }

  static async #onDach() {
    await game.settings.set(MODULE_ID, SETTINGS.MONITOR_ROOF_OPEN, !dachOffen());
  }

  /** Dem Monitor das Beobachterrecht an den fehlenden Spielerfiguren geben. */
  static async #onRechte() {
    const monitor = getBattlemapDisplay();
    if (!monitor) return;
    const fehlend = ohneBeobachterrecht(monitor);
    const stufe = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
    for (const actor of fehlend) {
      await actor.update({ [`ownership.${monitor.id}`]: stufe });
    }
    ui.notifications.info(game.i18n.format("INPERSON.Ebenen.RightsGiven", {
      anzahl: fehlend.length, monitor: monitor.name
    }));
    this.render();
  }
}

/**
 * Spielerfiguren, die der Monitor nicht beobachten darf.
 *
 * Alle der Welt, nicht nur die der aktiven Karte: Die nächste Karte hat
 * dieselbe Gruppe, und dort fällt es sonst erst auf, wenn der Fernseher
 * schwarz ist.
 * @returns {Actor[]}
 */
function ohneBeobachterrecht(monitor) {
  return (game.actors ?? []).filter(actor =>
    game.users.some(u => !u.isGM && !isMonitorUser(u) && actor.testUserPermission(u, "OWNER"))
    && !actor.testUserPermission(monitor, "OBSERVER"))
    .sort((a, b) => a.name.localeCompare(b.name));
}

let fenster = null;
let geplant = null;

export function openEbenenSteuerung() {
  if (!game.user.isGM) return;
  fenster ??= new EbenenSteuerung();
  return fenster.render({ force: true });
}

/** Neu zeichnen, wenn es offen ist. Zusammengefasst, Bewegungen melden sich in Schüben. */
export function refreshEbenenSteuerung() {
  if (!fenster?.rendered) return;
  clearTimeout(geplant);
  geplant = setTimeout(() => { if (fenster?.rendered) fenster.render(); }, 150);
}

/**
 * Mitziehen, solange es offen ist. Bei `ready`, nur bei der Spielleitung.
 *
 * Welche Ebene der Monitor zeigt, erfährt jeder Rechner über Foundrys
 * `userActivity`, ohne Hook; wir hören auf dieselbe Nachricht.
 */
export function installEbenenSteuerung() {
  for (const hook of ["updateScene", "createToken", "deleteToken", "updateToken", "updateActor"]) {
    Hooks.on(hook, refreshEbenenSteuerung);
  }
  game.socket.on("userActivity", (userId, daten) => {
    if (userId === getBattlemapDisplay()?.id && daten && ("levelId" in daten || "sceneId" in daten)) {
      refreshEbenenSteuerung();
    }
  });
}
