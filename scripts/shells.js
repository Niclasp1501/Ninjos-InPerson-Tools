/**
 * Geisterfenster wegräumen.
 *
 * Foundry v13 und v14 lassen beim Schließen eines ausgeklappten
 * Seitenleisten-Fensters die Hülle stehen: Der Rahmen bleibt im DOM, der
 * `.window-content` darin ist leer. Zwei Dinge gehen daran kaputt.
 *
 * Unsere Stilregeln fragen mit `:has()`, ob ein solches Fenster offen ist — und
 * eine Hülle erfüllt das genauso gut wie ein echtes Fenster. Das Blatt bliebe
 * also neben nichts schmal. Und die Prüfung „ist offen?" meldete weiter „ja",
 * sodass derselbe Knopf das Fenster nicht wieder öffnen könnte.
 *
 * **Foundry räumt die Hülle zu keinem festen Zeitpunkt weg.** Deshalb wird
 * mehrfach nachgesehen: sofort als Mikrotask, dann nach 0, 50 und 250
 * Millisekunden, dazu fünf Einzelbilder lang. Das ist nicht schön, es ist
 * gemessen — ein einzelner Durchgang erwischte die Hülle mal und mal nicht.
 *
 * Herausgelöst aus `actor-panel.js`, wo es zuerst entstanden ist: Die
 * Blattansicht klappt dieselben Fenster aus und hatte prompt dasselbe Problem.
 * Ein zweites Mal danebenzuschreiben wäre der sichere Weg, es nur an einer der
 * beiden Stellen zu reparieren, wenn es das nächste Mal auffällt.
 */

import { MODULE_ID } from "./const.js";

/**
 * Ist das ein Rahmen ohne Anwendung dahinter?
 *
 * Zwei Prüfungen, und die erste ist die verlässlichere: **Foundry selbst sagt
 * es.** Eine geschlossene Anwendung meldet `rendered === false`; steht ihr
 * Element trotzdem noch im Dokument, ist es eine Leiche. Gemessen an einem
 * hängengebliebenen Notiz-Verzeichnis:
 *
 *   journal.popout → { rendered: false, element.isConnected: true }
 *
 * Die zweite Prüfung — Rahmen da, Inhalt weg — hatte ich zuerst allein. Sie
 * findet nur die Hüllen, die Foundry ausgeräumt hat, und ließ genau den Fall
 * oben durch: ein vollständiges Fenster, das niemand mehr verwaltet.
 *
 * @param {HTMLElement} shell
 * @returns {boolean}
 */
export function isGhost(shell) {
  if (!shell) return false;

  const app = shell.id ? foundry.applications?.instances?.get(shell.id) : null;
  if (app && app.rendered === false) return true;

  const content = shell.querySelector(".window-content");
  if (!content) return true;
  return content.childElementCount === 0;
}

/**
 * Alle passenden Fenster durchsehen und die Leichen entfernen.
 *
 * @param {string} selector
 * @param {object} [options]
 * @param {boolean} [options.onlyGhost]   nur leere Hüllen, nicht alles
 * @param {(el: HTMLElement) => boolean} [options.alsoGhost]
 *        zusätzliche Prüfung für einen bestimmten Fenstertyp — das
 *        Akteursverzeichnis erkennt eine Leiche auch daran, dass die
 *        Verzeichnisliste fehlt.
 * @returns {number} wie viele Fenster angesehen wurden
 */
export function removeShells(selector, { onlyGhost = false, alsoGhost = null } = {}) {
  const shells = Array.from(document.querySelectorAll(selector));
  for (const shell of shells) {
    if (!onlyGhost || isGhost(shell) || alsoGhost?.(shell)) shell.remove();
  }
  return shells.length;
}

/**
 * Sofort unsichtbar machen — vor dem Schließen, nicht danach.
 *
 * `close()` ist asynchron, und bis es fertig ist, steht der Rahmen im Bild.
 * Das waren die „paar Millisekunden Geisterbild" nach dem Schließen: kein
 * Fehler im Aufräumen, sondern die Lücke zwischen Entscheidung und Vollzug.
 * Wer den Rahmen im selben Augenblick versteckt, in dem er das Schließen
 * anstößt, lässt dem Auge nichts zum Sehen.
 * @param {string} selector
 */
export function hideShells(selector) {
  for (const shell of document.querySelectorAll(selector)) {
    shell.style.setProperty("display", "none", "important");
  }
}

const laufend = new Set();

/**
 * Mehrfach nachsehen, weil Foundry sich nicht festlegt, wann es aufräumt.
 *
 * @param {string} selector
 * @param {object} [options]
 * @param {string} [options.reason]  steht im Protokoll, wenn etwas seltsam ist
 * @param {boolean} [options.onlyGhost]
 * @param {boolean} [options.force]   auch wenn für diesen Selektor schon läuft
 * @param {(el: HTMLElement) => boolean} [options.alsoGhost]
 */
export function queueSweep(selector, { reason = "unbekannt", onlyGhost = true, force = false, alsoGhost = null } = {}) {
  if (laufend.has(selector) && !force) return;
  laufend.add(selector);

  const durchgang = () => removeShells(selector, { onlyGhost, alsoGhost });

  queueMicrotask(() => {
    durchgang();
    laufend.delete(selector);
  });
  setTimeout(durchgang, 0);
  setTimeout(durchgang, 50);
  setTimeout(durchgang, 250);

  let bilder = 0;
  const proBild = () => {
    durchgang();
    if (++bilder < 5) requestAnimationFrame(proBild);
  };
  requestAnimationFrame(proBild);

  console.debug(`${MODULE_ID} | Hüllen durchgesehen (${reason})`);
}
