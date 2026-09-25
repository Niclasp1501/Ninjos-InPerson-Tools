/**
 * Begleitszenen umschalten, während gespielt wird.
 *
 * Eine Battlemap kann mehrere Begleitszenen tragen. Die erste kommt beim
 * Aktivieren von selbst auf den Szenen-Monitor, die übrigen holt dieses
 * Fenster mit einem Tipp dorthin: die Etagen eines Turms, derselbe Platz bei
 * Tag und bei Nacht, ein Haus von innen und von außen. Vorher ging das nur,
 * indem man die Szene in der Seitenleiste suchte und per Rechtsklick schickte,
 * mitten im Kampf also gar nicht.
 *
 * **Es zeigt immer die Begleitszenen der aktiven Karte**, nicht die einer
 * frei gewählten. Wer umschalten will, meint die Karte, die gerade auf dem
 * Tisch liegt; eine Auswahl davor wäre ein Schritt, den niemand braucht. Trägt
 * die aktive Karte keine eigenen, steht dort die Standard-Begleitszene, damit
 * das Fenster nicht leer wirkt, obwohl der Monitor etwas zeigt.
 *
 * **Ein Tipp schlägt die Fixierung**, weil er über `showOnMonitor` geht, den
 * Weg für alles, was die Spielleitung gezielt schickt. Die Fixierung wandert
 * mit: Der Monitor bleibt danach auf der neuen Szene stehen, bis wieder etwas
 * anderes kommt.
 *
 * **Es geht nicht von selbst auf.** Ein Fenster, das beim Aktivieren einer
 * Karte aufspringt, liegt im entscheidenden Moment über der Karte. Geöffnet
 * wird es über Shift+B oder den Knopf am Szenen-Monitor im Bedienfeld; einmal
 * offen, folgt es der aktiven Karte von selbst.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import {
  getCompanionScenes, getDefaultCompanionScene, getSceneDisplay, getPinnedScene, showOnMonitor
} from "./monitor.js";
import { thumbOf, withFallback } from "./scene-field.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Nach einem Tipp so lange die gewählte Szene als aktuell zeigen, bis der Monitor sich gemeldet hat. */
const NACHLAUF_MS = 1500;

class Begleitwahl extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-begleitwahl",
    tag: "div",
    window: { title: "INPERSON.Begleitwahl.Title", icon: "fa-solid fa-images", resizable: true },
    position: { width: 380, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-begleitwahl"],
    actions: { zeigen: Begleitwahl.#onZeigen }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/begleitwahl.hbs`,
      scrollable: [".inperson-begleitwahl-liste"]
    }
  };

  /**
   * Die eben angetippte Szene. Der Monitor meldet seinen Wechsel erst nach
   * einem Augenblick; bis dahin stünde die Markierung noch auf der alten.
   */
  #gewaehlt = null;

  /** @override */
  async _prepareContext() {
    const karte = game.scenes?.active ?? null;
    const display = getSceneDisplay();

    let szenen = karte ? getCompanionScenes(karte) : [];
    let ausStandard = false;
    if (!szenen.length) {
      const standard = getDefaultCompanionScene();
      if (standard && standard.id !== karte?.id) {
        szenen = [standard];
        ausStandard = true;
      }
    }

    // Wo der Monitor wirklich steht, meldet er selbst; die gemerkte Szene ist
    // nur verlässlich, solange er fixiert ist.
    const jetzt = this.#gewaehlt
      ?? (display?.active ? display.viewedScene : null)
      ?? getPinnedScene()?.id
      ?? null;

    return {
      karte: karte?.name ?? null,
      hatMonitor: !!display,
      monitorOffline: !!display && !display.active,
      ausStandard,
      szenen: szenen.map((szene, i) => ({
        id: szene.id,
        name: szene.name,
        bild: thumbOf(szene),
        zuerst: i === 0 && !ausStandard,
        aktuell: szene.id === jetzt
      }))
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element.querySelectorAll(".inperson-begleitwahl-szene img").forEach(withFallback);
  }

  static async #onZeigen(event, target) {
    const szene = game.scenes?.get(target.dataset.sceneId);
    if (!szene) return;
    await showOnMonitor(szene);
    this.#gewaehlt = szene.id;
    this.render();
    setTimeout(() => {
      this.#gewaehlt = null;
      if (this.rendered) this.render();
    }, NACHLAUF_MS);
  }
}

let fenster = null;

/** Das Fenster öffnen, oder nach vorn holen, wenn es schon offen ist. */
export function openBegleitwahl() {
  if (!game.user.isGM) return;
  fenster ??= new Begleitwahl();
  return fenster.render({ force: true });
}

/**
 * Mitziehen, solange es offen ist.
 *
 * Neu gezeichnet wird, wenn eine andere Karte aktiv wird, sich an den
 * Begleitszenen etwas ändert, eine Szene dazukommt oder verschwindet, und wenn
 * die gemerkte Szene des Monitors sich ändert. Letzteres deckt auch die Wege,
 * die nicht über dieses Fenster laufen: Rechtsklick in der Seitenleiste,
 * Fixieren im Bedienfeld.
 */
export function installBegleitwahl() {
  const neu = () => { if (fenster?.rendered) fenster.render(); };
  Hooks.on("updateScene", (szene, changes) => {
    if ("active" in changes || changes.flags?.[MODULE_ID] !== undefined || "name" in changes || "thumb" in changes) neu();
  });
  Hooks.on("createScene", neu);
  Hooks.on("deleteScene", neu);
  Hooks.on("updateSetting", setting => {
    if (setting.key === `${MODULE_ID}.${SETTINGS.MONITOR_SCENE}`) neu();
  });
}
