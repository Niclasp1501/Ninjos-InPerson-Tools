/**
 * Checks the account table of the setup window.
 *
 * One table now writes three settings that used to have a window each: the
 * two display accounts, table mode per player (FORCED) and the sheet view
 * accounts. A slip here would quietly change who gets what at the table,
 * in a world that has been set up for months.
 *
 * Usage: node tools/test-einrichten.mjs
 */

globalThis.foundry = { applications: { api: { ApplicationV2: class {}, HandlebarsApplicationMixin: B => class extends B {} } } };
globalThis.Hooks = { on() {}, once() {} };
globalThis.game = { settings: { get: () => null } };
const { kontenAuswerten, REITER } = await import("../scripts/einrichten.js");

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${JSON.stringify(ist)}\n    soll: ${JSON.stringify(soll)}`}`);
};

const konten = ["aaron", "roxy", "tv", "bm"];

pruefe("the tabs, in setup order", REITER, ["konten", "monitore", "tablets", "ton", "buehne", "feinheiten"]);

let r = kontenAuswerten({
  "rolle.aaron": "spieler", "tisch.aaron": "an", "blatt.aaron": true,
  "rolle.roxy": "spieler", "tisch.roxy": "",
  "rolle.tv": "sc",
  "rolle.bm": "bm"
}, konten, { forced: { roxy: false, gm: true }, sheetUsers: { roxy: true, gm: true } });
pruefe("displays from the roles", [r.sc, r.bm], ["tv", "bm"]);
pruefe("table mode: on, back to default, game master untouched", r.forced, { gm: true, aaron: true });
pruefe("sheet view: only ticked players, game master untouched", r.sheetUsers, { gm: true, aaron: true });

r = kontenAuswerten({ "rolle.aaron": "sc", "rolle.roxy": "sc", "tisch.roxy": "an" }, konten, {});
pruefe("one scene display only, the first wins", r.sc, "aaron");
pruefe("a second scene display gets no player settings", [r.forced, r.sheetUsers], [{}, {}]);

r = kontenAuswerten({ "rolle.tv": "sc" }, konten, { forced: { tv: false }, sheetUsers: { tv: true } });
pruefe("a display keeps its stored table mode (its fields are disabled)", r.forced, { tv: false });
pruefe("a display loses the sheet view", r.sheetUsers, {});

r = kontenAuswerten({ "rolle.aaron": "spieler", "tisch.aaron": "aus" }, konten, {});
pruefe("table mode off is stored as false", r.forced, { aaron: false });
pruefe("no display chosen, none stored", [r.sc, r.bm], ["", ""]);

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
