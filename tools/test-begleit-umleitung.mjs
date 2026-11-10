/**
 * Checks the redirect from a companion scene to its map.
 *
 * Wrong in one direction, activating a map would bounce to some other map;
 * wrong in the other, a companion would come up on its own without the map
 * the table needs. Both only show at the table.
 *
 * Usage: node tools/test-begleit-umleitung.mjs
 */

globalThis.Hooks = { on() {}, once() {} };
globalThis.game = { settings: { get: () => true } };
const { redirectFor, hasOwnMusic } = await import("../scripts/begleit-umleitung.js");

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${JSON.stringify(ist)}\n    soll: ${JSON.stringify(soll)}`}`);
};

const begleiter = {
  hafen: ["hafenbild", "taverne"],
  kerker: ["kerkerbild", "taverne"],
  turm: ["turm-oben"],
  "turm-oben": ["turm-unten"]
};
const szenen = ["hafen", "kerker", "turm", "turm-oben", "turm-unten", "hafenbild", "kerkerbild", "taverne", "wald"].map(id => ({ id }));
const ctx = { scenes: szenen, companionsOf: s => begleiter[s.id] ?? [] };
const plan = id => {
  const p = redirectFor({ id }, ctx);
  return p.art === "karte" ? ["karte", p.karte.id] : p.art === "wahl" ? ["wahl", p.karten.map(k => k.id)] : ["normal"];
};

pruefe("a companion of one map leads to that map", plan("hafenbild"), ["karte", "hafen"]);
pruefe("a companion of two maps asks which", plan("taverne"), ["wahl", ["hafen", "kerker"]]);
pruefe("a map activates as before", plan("hafen"), ["normal"]);
pruefe("a map that is also some map's companion stays a map", plan("turm-oben"), ["normal"]);
pruefe("a scene nobody pairs activates as before", plan("wald"), ["normal"]);
pruefe("no scene, nothing to do", redirectFor(null, ctx).art, "normal");
pruefe("a scene listing itself is not its own map",
  redirectFor({ id: "selbst" }, { scenes: [{ id: "selbst" }], companionsOf: () => [] }).art, "normal");

pruefe("music: a playlist counts", hasOwnMusic({ playlist: { id: "p" } }), true);
pruefe("music: a single track counts", hasOwnMusic({ playlistSound: { id: "s" } }), true);
pruefe("music: none, the map's stays", hasOwnMusic({ playlist: null, playlistSound: null }), false);

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
