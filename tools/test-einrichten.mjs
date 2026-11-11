/**
 * Checks how the setup window turns its fields into the account settings.
 *
 * The window writes three settings that decide who gets what at the table:
 * the two display accounts, table mode per player (FORCED) and the sheet
 * view accounts. A slip here would quietly change that in a world that has
 * been set up for months.
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

pruefe("the tabs: the start page, then one per feature", REITER, ["funktionen", "monitore", "tischmodus", "blatt", "zeit", "tausch", "ton", "buehne"]);

let r = kontenAuswerten({
  monitorSC: "tv", monitorBM: "bm",
  "tisch.aaron": "an", "blatt.aaron": true,
  "tisch.roxy": ""
}, konten, { forced: { roxy: false, gm: true }, sheetUsers: { roxy: true, gm: true } });
pruefe("displays from the displays tab", [r.sc, r.bm], ["tv", "bm"]);
pruefe("table mode: on, back to default, game master untouched", r.forced, { gm: true, aaron: true });
pruefe("sheet view: only ticked players, game master untouched", r.sheetUsers, { gm: true, aaron: true });

r = kontenAuswerten({ monitorSC: "tv", monitorBM: "tv" }, konten, {});
pruefe("one account cannot be both displays, the scene display wins", [r.sc, r.bm], ["tv", ""]);

r = kontenAuswerten({ monitorSC: "tv", "tisch.tv": "an", "blatt.tv": true }, konten, { forced: { tv: false }, sheetUsers: { tv: true } });
pruefe("a display keeps its stored table mode and takes none from the form", r.forced, { tv: false });
pruefe("a display gets no sheet view", r.sheetUsers, {});

r = kontenAuswerten({ "tisch.aaron": "aus" }, konten, { forced: { roxy: true } });
pruefe("table mode off is stored as false; a player without a row keeps what was stored", r.forced, { roxy: true, aaron: false });
pruefe("no display chosen, none stored", [r.sc, r.bm], ["", ""]);

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
