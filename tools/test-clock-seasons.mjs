/**
 * The season logic, against the calendars that actually exist.
 *
 * The strip has to work without Calendaria, and the two calendars write a
 * season down in incompatible ways - read off the live server, not assumed:
 *
 *   Calendaria / Harptos        dayStart 79, dayEnd 170      day of the *year*
 *   Foundry "Simplified         monthStart 3, monthEnd 5     month, 1-based,
 *   Gregorian"                                               days left undefined
 *
 * and Gregorian winter is `monthStart 12, monthEnd 2`, which runs across the
 * turn of the year. A range that ends before it begins is not an error here.
 *
 * Run: node tools/test-clock-seasons.mjs
 */

import fs from "node:fs";

/* The functions under test, lifted out of the module by name. Reaching into
   the source rather than importing it keeps clock.js free of exports that
   exist only for a test. */
const source = fs.readFileSync(new URL("../scripts/clock.js", import.meta.url), "utf8");
const from = source.indexOf("function dayOfYear");
const to = source.indexOf("function currentWeather");
const build = new Function("game", `${source.slice(from, to)}\nreturn { currentSeason, dayOfYear };`);
const { currentSeason } = build({ i18n: { localize: s => s } });

/* ── The two calendars, as the server reports them ───────────────── */

const gregorianisch = {
  name: "Simplified Gregorian",
  months: { values: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31].map((days, i) => ({ name: `M${i}`, days })) },
  seasons: { values: [
    { name: "Frühling", monthStart: 3,  monthEnd: 5 },
    { name: "Sommer",   monthStart: 6,  monthEnd: 8 },
    { name: "Herbst",   monthStart: 9,  monthEnd: 11 },
    { name: "Winter",   monthStart: 12, monthEnd: 2 }     // across the year end
  ] }
};

const harptos = {
  name: "Harptos",
  months: { values: Array.from({ length: 12 }, (_, i) => ({ name: `H${i}`, days: 30 })) },
  seasons: { values: [
    { name: "Frühling", dayStart: 79,  dayEnd: 170 },
    { name: "Sommer",   dayStart: 171, dayEnd: 262 },
    { name: "Herbst",   dayStart: 263, dayEnd: 353 },
    { name: "Winter",   dayStart: 354, dayEnd: 78 }        // across the year end
  ] }
};

const ohneJahreszeiten = { name: "nackt", months: { values: [{ name: "M", days: 30 }] }, seasons: { values: [] } };

/* ── The cases ───────────────────────────────────────────────────── */

const faelle = [
  ["Gregorianisch, Januar",   gregorianisch, { month: 0,  dayOfMonth: 4 },  "Winter"],
  ["Gregorianisch, April",    gregorianisch, { month: 3,  dayOfMonth: 0 },  "Frühling"],
  ["Gregorianisch, Juli",     gregorianisch, { month: 6,  dayOfMonth: 14 }, "Sommer"],
  ["Gregorianisch, Oktober",  gregorianisch, { month: 9,  dayOfMonth: 2 },  "Herbst"],
  ["Gregorianisch, Dezember", gregorianisch, { month: 11, dayOfMonth: 30 }, "Winter"],
  ["Harptos, Eleasis",        harptos,       { month: 10, dayOfMonth: 0 },  "Herbst"],
  ["Harptos, Jahresanfang",   harptos,       { month: 0,  dayOfMonth: 0 },  "Winter"],
  ["Index schlägt alles",     harptos,       { month: 0,  dayOfMonth: 0, season: 1 }, "Sommer"],
  ["Kalender ohne Zeiten",    ohneJahreszeiten, { month: 0, dayOfMonth: 0 }, null]
];

let schlecht = 0;
for (const [name, kalender, komponenten, erwartet] of faelle) {
  const ist = currentSeason(kalender, komponenten)?.name ?? null;
  const gut = ist === erwartet;
  if (!gut) schlecht++;
  console.log(`${gut ? "ok  " : "FEHL"} ${name.padEnd(24)} ${String(ist)}${gut ? "" : `  (erwartet: ${erwartet})`}`);
}

console.log(schlecht ? `\n${schlecht} Fall/Fälle falsch` : "\nalle Fälle richtig");
process.exit(schlecht ? 1 : 0);
