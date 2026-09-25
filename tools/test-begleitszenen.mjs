/**
 * Prüft die Begleitszenen als Liste.
 *
 * Was hier geprüft wird, ist das, was man am Tisch erst merkt, wenn der
 * zweite Bildschirm das Falsche zeigt:
 *
 *   - Alte Welten: Eine einzelne Kennung, wie sie bis 14.2611.78 gespeichert
 *     wurde, ist eine Liste mit einem Eintrag. Kein Paar geht verloren.
 *   - Die Reihenfolge bleibt, denn die erste ist die, auf die der Monitor
 *     beim Aktivieren springt.
 *   - Gelöschte Szenen, Wiederholungen und die Karte selbst fallen heraus.
 *   - Gespeichert wird als Zeichenkette, und eine leere Liste entfernt das
 *     Flag, statt eine leere Zeichenkette liegen zu lassen.
 *
 * node tools/test-begleitszenen.mjs
 */

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const a = JSON.stringify(ist), b = JSON.stringify(soll);
  const gut = a === b;
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${a}\n    soll: ${b}`}`);
};

/* ── Ein Foundry, so klein wie es sein darf ──────────────────────── */

const szenen = new Map();
function szene(id, flag) {
  const s = {
    id, name: `Szene ${id}`,
    flags: flag === undefined ? {} : { "ninjos-inperson-tools": { companionScene: flag } },
    getFlag(_m, k) { return this.flags["ninjos-inperson-tools"]?.[k]; },
    async setFlag(_m, k, v) { (this.flags["ninjos-inperson-tools"] ??= {})[k] = v; },
    async unsetFlag(_m, k) { delete this.flags["ninjos-inperson-tools"]?.[k]; }
  };
  szenen.set(id, s);
  return s;
}
globalThis.game = {
  user: { isGM: true },
  scenes: {
    get: id => szenen.get(id) ?? null,
    [Symbol.iterator]: () => szenen.values()
  },
  settings: { get: () => "" },
  users: { get: () => null }
};
globalThis.foundry = { utils: {} };

const M = await import("../scripts/monitor.js");

/* ── 1. Lesen ───────────────────────────────────────────────────── */

pruefe("leer", M.companionIds(undefined), []);
pruefe("alte einzelne Kennung", M.companionIds("abc"), ["abc"]);
pruefe("Liste mit Leerzeichen", M.companionIds(" a , b,c "), ["a", "b", "c"]);
pruefe("Wiederholung fällt raus, erste Stelle bleibt", M.companionIds("a,b,a,c,b"), ["a", "b", "c"]);
pruefe("leere Einträge fallen raus", M.companionIds("a,,b,"), ["a", "b"]);
pruefe("Array geht auch", M.companionIds(["x", "y"]), ["x", "y"]);

/* ── 2. Auflösen gegen die Welt ─────────────────────────────────── */

szene("etage1"); szene("etage2"); szene("dach");
const turm = szene("turm", "etage1,geloescht,etage2,turm,dach");
pruefe("gelöschte Szene und die Karte selbst fallen raus",
  M.getCompanionScenes(turm).map(s => s.id), ["etage1", "etage2", "dach"]);
pruefe("die erste ist die beim Aktivieren", M.getCompanionScene(turm)?.id, "etage1");

const alt = szene("alt", "etage2");
pruefe("altes Paar gilt weiter", M.getCompanionScene(alt)?.id, "etage2");
pruefe("ohne Begleitszene keine", M.getCompanionScene(szene("wiese")), null);

/* ── 3. Schreiben ───────────────────────────────────────────────── */

await M.setCompanionScenes(turm, ["dach", "etage1", "dach"]);
pruefe("gespeichert als Zeichenkette in Reihenfolge",
  turm.flags["ninjos-inperson-tools"].companionScene, "dach,etage1");

await M.addCompanionScene(turm, "etage2");
await M.addCompanionScene(turm, "etage1");
pruefe("anhängen, ohne Doppelte",
  turm.flags["ninjos-inperson-tools"].companionScene, "dach,etage1,etage2");

await M.addCompanionScene(turm, "turm");
pruefe("die Karte selbst wird nicht angehängt",
  turm.flags["ninjos-inperson-tools"].companionScene, "dach,etage1,etage2");

await M.setCompanionScenes(turm, []);
pruefe("leere Liste entfernt das Flag",
  "companionScene" in turm.flags["ninjos-inperson-tools"], false);

/* ── 4. Die Übersicht der Paare ─────────────────────────────────── */

pruefe("Paare listen alle Begleitszenen",
  M.listCompanionPairs().map(p => [p.scene.id, p.companions.map(c => c.id)]),
  [["alt", ["etage2"]]]);

console.log(`\n${fehler ? `${fehler} Fehler` : "alles gut"}`);
process.exit(fehler ? 1 : 0);
