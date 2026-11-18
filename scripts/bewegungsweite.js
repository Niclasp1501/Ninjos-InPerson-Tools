/**
 * Bewegungsweite in Farbe auch auf dem Monitor.
 *
 * Ninjo, 19.11.2026: Zieht jemand eine Spielerfigur, soll der Tischmonitor
 * die farbige Messung zeigen wie bei dnd5e (grün bis zur Geschwindigkeit,
 * gelb bis zur doppelten, rot darüber), „aber nur für die Charaktere, für die
 * er auch Beobachter ist".
 *
 * dnd5e färbt das Lineal nur auf dem Rechner, der gerade zieht:
 * `TokenRuler5e#getSpeedBasedStyle` bricht ab, wenn der angezeigte Plan nicht
 * vom eigenen Benutzer stammt. Alle anderen Rechner, auch der Monitor, sehen
 * die Messung in der Farbe des Ziehenden. Die Methode ist privat, also lässt
 * sie sich nicht umschreiben; diese Datei hängt eine Unterklasse an die
 * Linealklasse, die nach dnd5e dieselbe Rechnung noch einmal macht, und zwar
 * nur
 *
 * - auf einem der beiden Monitore der In-Person Tools,
 * - für einen fremden Plan (den eigenen hat dnd5e schon gefärbt),
 * - wenn das Monitorkonto an der Figur mindestens Beobachter ist.
 *
 * Die Rechnung folgt dnd5e 6.0.6 (`dnd5e.mjs`, TokenRuler5e) Zeile für Zeile.
 * Die Farben liest sie aus `CONFIG.DND5E.tokenRulerColors`, also dieselben,
 * die dnd5e und jedes Modul dort einstellen.
 */

import { MODULE_ID } from "./const.js";
import { isMonitorUser } from "./state.js";

/** Färbt diese Rechnung den Plan? Ausgelagert für die Prüfung ohne Foundry. */
export function sollFaerben({ istMonitor, eigenerPlan, teleport, beobachter, kreatur }) {
  return !!(istMonitor && !eigenerPlan && !teleport && beobachter && kreatur);
}

/**
 * Welche Stufe gilt: "normal" bis zur Geschwindigkeit, "double" bis zur
 * doppelten, sonst "triple". Wie dnd5e: Kann die Bewegungsart aufs Gehen
 * ausweichen (oder ist sie dnd5e unbekannt), zählt die größere der beiden.
 * Die 0,1 zieht dnd5e ab, damit genau die volle Weite noch grün ist.
 */
export function stufe(kosten, aktion, speeds, bewegungsarten) {
  let tempo = speeds?.[aktion] ?? 0;
  const art = bewegungsarten?.[aktion];
  if (art?.walkFallback || !art) tempo = Math.max(tempo, speeds?.walk ?? 0);
  const anteil = (kosten - 0.1) / tempo;
  if (anteil <= 1) return "normal";
  if (anteil <= 2) return "double";
  return "triple";
}

function faerben(lineal, waypoint, style) {
  try {
    const token = lineal.token;
    const actor = token?.actor;
    const speeds = actor?.system?.attributes?.movement?.speeds;
    const ja = sollFaerben({
      istMonitor: isMonitorUser(game.user),
      eigenerPlan: game.user.id in (token?._plannedMovement ?? {}),
      teleport: !!CONFIG.Token.movement.actions[waypoint.action]?.teleport,
      beobachter: !!actor?.testUserPermission(game.user, "OBSERVER"),
      kreatur: !!(speeds && actor.system.isCreature)
    });
    if (!ja) return style;
    const farben = CONFIG.DND5E?.tokenRulerColors ?? {};
    const farbe = farben[stufe(waypoint.measurement.cost, waypoint.action, speeds, CONFIG.DND5E?.movementTypes)];
    if (farbe != null) style.color = farbe;
  } catch (fehler) {
    // Ein Fehler hier darf das Lineal nie kaputt machen; dann eben ohne Farbe.
    console.warn(`${MODULE_ID} | Bewegungsweite ließ sich nicht färben.`, fehler);
  }
  return style;
}

/**
 * Bei `setup`: Die Linealklasse steht dann fest (dnd5e setzt sie bei `init`),
 * und Foundry baut die Tokens erst danach mit dem ersten Zeichnen der Szene.
 * Eingehängt wird auf jedem Rechner, entschieden erst beim Zeichnen; so gilt
 * eine neue Monitorwahl ohne Neuladen.
 */
export function bewegungsweiteEinrichten() {
  if (game.system?.id !== "dnd5e" || !CONFIG.DND5E?.tokenRulerColors) return;
  const Basis = CONFIG.Token.rulerClass;
  if (!Basis || Basis.inpersonBewegungsweite) return;

  class MonitorLineal extends Basis {
    static inpersonBewegungsweite = true;

    _getWaypointStyle(waypoint) {
      const style = super._getWaypointStyle(waypoint);
      // Unsichtbare Zwischenpunkte (radius 0) lässt dnd5e ohne Farbe.
      if (!style?.radius) return style;
      return faerben(this, waypoint, style);
    }

    _getSegmentStyle(waypoint) {
      return faerben(this, waypoint, super._getSegmentStyle(waypoint));
    }

    _getGridHighlightStyle(waypoint, offset) {
      return faerben(this, waypoint, super._getGridHighlightStyle(waypoint, offset));
    }
  }

  CONFIG.Token.rulerClass = MonitorLineal;
}
