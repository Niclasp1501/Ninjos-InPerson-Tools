/**
 * Keine Bestätigungen auf dem Bildschirm.
 *
 * Eine Meldung oben in der Mitte ist für Fehler und Probleme da, für etwas,
 * das jemand wissen muss, weil er sonst nicht merkt, dass etwas schiefging.
 * Wer gerade eine Szene auf den Monitor geschickt hat, weiß das schon. Am
 * 03.10.2026 kamen bei jedem Wechsel einer Begleitszene Meldungen auf den
 * Schirm der Spielleitung, und Ninjo: „generell mag ich nicht mit Pop-ups zu
 * arbeiten, wenn die nur was anzeigen, wo ich weiß, was ich tue. Die sollten
 * nur Fehler oder Probleme anzeigen."
 *
 * Was früher eine Info war, steht deshalb in der Konsole. Wer nachsehen will,
 * findet es dort, und am Tisch stört es niemanden. Warnungen und Fehler gehen
 * weiter über `ui.notifications`.
 */

import { MODULE_ID } from "./const.js";

/**
 * @param {string} message Fertiger Text oder, mit `localize`, ein Sprachschlüssel
 * @param {{localize?: boolean}} [options]
 */
export function still(message, { localize = false } = {}) {
  const text = localize ? game.i18n.localize(message) : message;
  console.info(`${MODULE_ID} | ${text}`);
}

/**
 * Foundrys eigene Meldung beim Ansehen einer Szene ohne Spielfeld abfangen.
 *
 * `Scene#view` sagt auf jedem Rechner mit abgeschaltetem Spielfeld „Die Szene
 * „…" wird jetzt angesehen, aber nicht dargestellt" und nennt dabei den Namen
 * der Szene. Das sind genau die Tablets im Tischmodus: Bei jeder aktivierten
 * Szene stand ihr Name mitten auf dem Schirm der Spieler, verdeckte das Blatt
 * und verriet, wohin es als Nächstes geht (03.10.2026).
 *
 * Bei `init`, auf jedem Rechner.
 */
export function stilleMeldungenEinrichten() {
  const ZIEL = "foundry.applications.ui.Notifications.prototype.notify";
  const huelle = function (wrapped, message, ...rest) {
    if (message === "INFO.SceneViewCanvasDisabled") {
      console.debug(`${MODULE_ID} | Meldung „Szene ohne Spielfeld" unterdrückt.`);
      return null;
    }
    return wrapped(message, ...rest);
  };
  try {
    const lw = globalThis.libWrapper;
    if (lw?.register) {
      lw.register(MODULE_ID, ZIEL, huelle, "MIXED");
      return;
    }
    const proto = foundry.applications?.ui?.Notifications?.prototype;
    if (typeof proto?.notify !== "function") {
      console.error(`${MODULE_ID} | ${ZIEL} nicht gefunden.`);
      return;
    }
    const original = proto.notify;
    proto.notify = function (...args) {
      return huelle.call(this, original.bind(this), ...args);
    };
  } catch (fehler) {
    console.error(`${MODULE_ID} | ${ZIEL} ließ sich nicht umhüllen`, fehler);
  }
}
