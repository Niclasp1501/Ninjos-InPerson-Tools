/**
 * „Du bist dran" – der Streifen für die Kampfreihenfolge.
 *
 * Am Tisch ruft es der Spielleiter, aber der Fernseher zeigt es dem Einzelnen
 * nicht, und ein Tablet, das nur das Blatt zeigt, hat keine Kampfverfolgung.
 * Kein gesichtetes Modul im Katalog schließt diese Lücke: Auf dem Tablet
 * steht „Du bist dran", solange der eigene Charakter am Zug ist, und „Gleich
 * bist du dran", wenn er der nächste ist. Sonst steht dort nichts – ein
 * Streifen, der dauernd da ist, wird nach einer Runde nicht mehr gelesen.
 *
 * Nur in der Blattansicht. Wer die normale Oberfläche hat, hat Foundrys
 * Kampfverfolgung.
 */

import { characterOf } from "./trade.js";

const ID = "inperson-sv-zug";

let an = false;
let vorherDran = false;

/** Wer nach dem aktuellen Kämpfer kommt – ohne Besiegte und Versteckte. */
function naechster(combat) {
  const turns = combat.turns ?? [];
  if (!turns.length) return null;
  for (let i = 1; i <= turns.length; i++) {
    const c = turns[(combat.turn + i) % turns.length];
    if (c && !c.isDefeated && !c.hidden) return c;
  }
  return null;
}

export function zugPruefen() {
  const alt = document.getElementById(ID);
  if (!an) { alt?.remove(); vorherDran = false; return; }

  const combat = game.combats?.active ?? game.combat;
  const ich = characterOf(game.user);
  if (!combat?.started || !ich) { alt?.remove(); vorherDran = false; return; }

  const dran = combat.combatant?.actorId === ich.id;
  const gleich = !dran && naechster(combat)?.actorId === ich.id;
  if (!dran && !gleich) { alt?.remove(); vorherDran = false; return; }

  const streifen = alt ?? document.createElement("div");
  streifen.id = ID;
  streifen.className = `inperson-sv-zug ${dran ? "dran" : "gleich"}`;
  streifen.innerHTML = `<i class="fa-solid ${dran ? "fa-dice-d20" : "fa-hourglass-half"}"></i>`
    + `<span>${game.i18n.localize(dran ? "INPERSON.SheetView.YourTurn" : "INPERSON.SheetView.NextTurn")}</span>`;
  if (!alt) document.body.append(streifen);

  // Ein kurzes Brummen, wenn der Zug beginnt – nur dann, nicht bei jedem
  // Neuzeichnen, und nur auf Geräten, die es können.
  if (dran && !vorherDran) {
    try { navigator.vibrate?.(150); } catch { /* egal */ }
  }
  vorherDran = dran;
}

export function zugStarten() {
  an = true;
  zugPruefen();
}

export function zugBeenden() {
  an = false;
  zugPruefen();
}

/** Einmal beim Laden: Alles, was die Reihenfolge ändert, prüft neu. */
export function installZug() {
  for (const hook of ["combatStart", "combatTurnChange", "combatRound", "updateCombat", "deleteCombat", "updateCombatant", "deleteCombatant"]) {
    Hooks.on(hook, () => zugPruefen());
  }
}
