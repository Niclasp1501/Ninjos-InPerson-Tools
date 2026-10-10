/**
 * Andockstellen für Zusatzmodule.
 *
 * Bezahlte Funktionen kommen nie als gesperrter Code in dieses Modul, sondern
 * als eigenes Modul, das sich hier andockt (Regel des Workspace, 11.09.2026:
 * „Der Quellcode bleibt öffentlich, Bezahltes kommt als Zusatzmodul"). Was ein
 * solches Modul braucht, steht hier als Liste, in die es sich einträgt; dieses
 * Modul fragt die Listen beim Zeichnen ab und weiß sonst nichts von ihm.
 *
 * Erreichbar als `game.modules.get("ninjos-inperson-tools").api.extension`,
 * Fassung in `interface`. Ändert sich eine Signatur, steigt
 * {@link SCHNITTSTELLE}, und das Zusatzmodul prüft dagegen, statt gegen die
 * Versionsnummer.
 *
 * Angelegt am 08.10.2026 für den Gleichlauf von Bild und Ton, die erste
 * Funktion von Ninjo's In-Person Tools Premium.
 */

import { MODULE_ID } from "./const.js";

/** Die Fassung der Schnittstelle. */
export const SCHNITTSTELLE = 2;

const _leistenKnoepfe = [];
const _reiterTeile = [];

/**
 * Was Zusatzmodule in die Begleitleiste stellen wollen, frisch gebaut.
 * Fehler eines Zusatzmoduls bleiben bei ihm: Die Leiste zeichnet trotzdem.
 * @returns {HTMLElement[]}
 */
export function leistenKnoepfe() {
  return bauen(_leistenKnoepfe, []);
}

/**
 * Was Zusatzmodule in den Reiter „Am Tisch" der Szenen-Einstellungen stellen.
 * @param {Scene} scene
 * @returns {HTMLElement[]}
 */
export function reiterTeile(scene) {
  return bauen(_reiterTeile, [scene]);
}

function bauen(liste, args) {
  const ergebnis = [];
  for (const fn of liste) {
    try {
      const el = fn(...args);
      if (el instanceof HTMLElement) ergebnis.push(el);
    } catch (fehler) {
      console.error(`${MODULE_ID} | Zusatzmodul: Teil ließ sich nicht bauen`, fehler);
    }
  }
  return ergebnis;
}

/**
 * Die Schnittstelle, zusammengesetzt in main.js, weil sie Funktionen aus
 * mehreren Dateien weiterreicht.
 * @param {object} teile
 * @param {() => void} teile.refreshCompanionBar
 * @param {() => User|null} teile.sceneDisplay
 * @param {() => string|null} teile.displayedSceneId
 * @param {() => void} teile.newPicture
 */
export function erweiterungApi({
  refreshCompanionBar, sceneDisplay, displayedSceneId, newPicture, holdScreensaver, isSceneDisplay
}) {
  return {
    interface: SCHNITTSTELLE,
    /**
     * Ein Knopf in der Begleitleiste der Spielleitung. `fn()` wird bei jedem
     * Zeichnen gefragt und gibt ein Element zurück oder `null`. Steht dort
     * etwas, zeigt sich die Leiste auch ohne Begleitszenen.
     * @param {() => HTMLElement|null} fn
     */
    addCompanionBarButton(fn) {
      if (typeof fn === "function") _leistenKnoepfe.push(fn);
      refreshCompanionBar();
    },
    /**
     * Ein Abschnitt im Reiter „Am Tisch" der Szenen-Einstellungen, vor der
     * Drehung. Formularfelder darin werden mit der Szene gespeichert, wie
     * Foundrys eigene (`flags.<modul>.<schluessel>`).
     * @param {(scene: Scene) => HTMLElement|null} fn
     */
    addSceneTabSection(fn) {
      if (typeof fn === "function") _reiterTeile.push(fn);
    },
    /** Die Begleitleiste neu zeichnen, etwa wenn sich ein eigener Knopf ändert. */
    refreshCompanionBar,
    /** Das Konto des Szenen-Monitors, oder `null`. */
    sceneDisplay,
    /** Welche Szene der Szenen-Monitor gerade zeigt, soweit die Spielleitung es weiß. */
    displayedSceneId,
    /**
     * Auf diesem Rechner beginnt ein neues Bild: Der Bildschirmschoner fängt
     * seine Wartezeit von vorn an. Wirkt nur auf dem Szenen-Monitor.
     */
    newPicture,
    /**
     * Seit Schnittstelle 2. Den Bildschirmschoner auf diesem Rechner anhalten,
     * solange `an` gilt, etwa während eine Bühne auf dem Szenen-Monitor steht.
     * Mehrere Gründe nebeneinander, je mit eigenem Schlüssel.
     * @param {string} schluessel
     * @param {boolean} an
     */
    holdScreensaver,
    /** Seit Schnittstelle 2. Ist dieser Rechner der Szenen-Monitor? */
    isSceneDisplay
  };
}
