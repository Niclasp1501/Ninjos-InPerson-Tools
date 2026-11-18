/**
 * Prüfung der Bewegungsfarben auf dem Monitor (scripts/bewegungsweite.js), ohne Foundry.
 *
 *   node tools/test-bewegungsweite.mjs
 */

let fehler = 0;
function pruefe(name, ist, soll) {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${JSON.stringify(ist)}\n    soll: ${JSON.stringify(soll)}`}`);
}

const { sollFaerben, stufe } = await import("../scripts/bewegungsweite.js");

// Wie in dnd5e 6.0.6: CONFIG.DND5E.movementTypes, walk/fly/swim/climb/burrow.
const arten = { walk: {}, fly: {}, swim: { walkFallback: true }, climb: { walkFallback: true }, burrow: {} };
const speeds = { walk: 9, fly: 0, swim: 0, climb: 0, burrow: 0 };

const grund = { istMonitor: true, eigenerPlan: false, teleport: false, beobachter: true, kreatur: true };
pruefe("Monitor, fremder Plan, Beobachter: färbt", sollFaerben(grund), true);
pruefe("Kein Monitor: dnd5e bleibt zuständig", sollFaerben({ ...grund, istMonitor: false }), false);
pruefe("Eigener Plan: hat dnd5e schon gefärbt", sollFaerben({ ...grund, eigenerPlan: true }), false);
pruefe("Nicht Beobachter: keine Farbe", sollFaerben({ ...grund, beobachter: false }), false);
pruefe("Teleport: keine Farbe", sollFaerben({ ...grund, teleport: true }), false);
pruefe("Keine Kreatur (Fahrzeug): keine Farbe", sollFaerben({ ...grund, kreatur: false }), false);

pruefe("9 m bei 9 m: grün", stufe(9, "walk", speeds, arten), "normal");
pruefe("10,5 m: gelb", stufe(10.5, "walk", speeds, arten), "double");
pruefe("18 m: noch gelb", stufe(18, "walk", speeds, arten), "double");
pruefe("19,5 m: rot", stufe(19.5, "walk", speeds, arten), "triple");
pruefe("Schwimmen ohne eigenes Tempo nimmt das Gehen", stufe(9, "swim", speeds, arten), "normal");
pruefe("Unbekannte Aktion nimmt das Gehen", stufe(9, "crawl", speeds, arten), "normal");
pruefe("Fliegen ohne Flugtempo: rot", stufe(1.5, "fly", speeds, arten), "triple");

console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.` : "\nAlles bestanden.");
process.exit(fehler ? 1 : 0);
