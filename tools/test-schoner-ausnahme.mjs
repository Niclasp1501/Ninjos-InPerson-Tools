/**
 * Checks the scenes exempt from the scene display's screensaver.
 *
 * Wrong in either direction is noticed only at the table: an intro covered by
 * black halfway through, or a screensaver that never starts because a scene
 * was counted as exempt that is not.
 *
 * Usage: node tools/test-schoner-ausnahme.mjs
 */

import { exemptFromScreensaver, screensaverCandidates, NO_SCREENSAVER_FLAG } from "../scripts/schoner-ausnahme.js";

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${JSON.stringify(ist)}\n    soll: ${JSON.stringify(soll)}`}`);
};

const szene = (id, flags = {}) => ({
  id,
  getFlag: (modul, key) => (modul === "ninjos-inperson-tools" ? flags[key] : undefined)
});

pruefe("the flag is called noScreensaver", NO_SCREENSAVER_FLAG, "noScreensaver");
pruefe("a scene with the switch on is exempt", exemptFromScreensaver(szene("intro", { noScreensaver: true })), true);
pruefe("a scene with the switch off is not", exemptFromScreensaver(szene("karte", { noScreensaver: false })), false);
pruefe("a scene that never had the switch is not", exemptFromScreensaver(szene("alt")), false);
pruefe("the map's own setting does not count as the switch", exemptFromScreensaver(szene("karte", { mapScreensaver: "off" })), false);
pruefe("no scene, nothing exempt", exemptFromScreensaver(null), false);
pruefe("another module's flag of the same name does not count",
  exemptFromScreensaver({ getFlag: (modul, key) => (modul === "anderes-modul" && key === "noScreensaver") || undefined }), false);
pruefe("exempt scenes leave the screensaver's own folder",
  screensaverCandidates([szene("a"), szene("b", { noScreensaver: true }), szene("c")]).map(s => s.id), ["a", "c"]);
pruefe("an empty folder stays empty", screensaverCandidates(undefined), []);

console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
