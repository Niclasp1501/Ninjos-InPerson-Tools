/**
 * Prüfungen für die Kuppel: Mondphase und Wetterabdeckung.
 *
 * Beides ist schon einmal still danebengegangen. Die Sichel war zwei
 * Fassungen lang seitenverkehrt — bei 82 % beleuchtet stand eine dünne Sichel
 * am Himmel, und niemandem fiel es auf, weil die Zahl stimmte und nur das
 * Bild falsch war. Und beim Wetter deckten wir 21 von Calendarias 41 Vorlagen
 * ab; ein Sandsturm kam als Schneetreiben heraus.
 *
 * Ausführen: node tools/test-sky.mjs
 */

import { mondPfad, wetterArt, WETTER_VORLAGEN } from "../scripts/sky.js";

let fehler = 0;
const pruefe = (name, bedingung, hinweis = "") => {
  if (bedingung) return;
  fehler++;
  console.error(`✗ ${name}${hinweis ? " — " + hinweis : ""}`);
};

/* ── Der Mond ────────────────────────────────────────────────────── */

/**
 * Auf welcher Seite liegt der helle Teil?
 *
 * Der Pfad ist ein Halbkreis plus eine Halbellipse. Der Halbkreis läuft über
 * die beleuchtete Seite: sweep=1 heißt im Uhrzeigersinn, also von oben nach
 * unten über rechts. Das ist die Angabe, die zweimal falsch war, und genau
 * die liest dieser Test aus dem erzeugten Pfad zurück.
 */
function helleSeite(anteil) {
  const d = mondPfad(50, 50, 10, anteil);
  const aussen = d.match(/A 10 10 0 0 (\d)/);
  return aussen?.[1] === "1" ? "rechts" : "links";
}

// Zunehmend (0 → 0,5): rechts hell. Abnehmend (0,5 → 1): links hell.
for (const anteil of [0.05, 0.15, 0.25, 0.35, 0.45]) {
  pruefe(`zunehmend ${anteil} ist rechts hell`, helleSeite(anteil) === "rechts", helleSeite(anteil));
}
for (const anteil of [0.55, 0.64, 0.75, 0.85, 0.95]) {
  pruefe(`abnehmend ${anteil} ist links hell`, helleSeite(anteil) === "links", helleSeite(anteil));
}

/**
 * Die Breite des Schattenrands ist |cos(2π·anteil)|·r: null beim Halbmond
 * (senkrechte Kante), voll bei Neu- und Vollmond.
 */
const randbreite = anteil => Number(mondPfad(50, 50, 10, anteil).match(/A ([\d.]+) 10 0 0 \d 50 40/)?.[1]);
pruefe("Halbmond hat eine gerade Kante", randbreite(0.25) < 0.01, String(randbreite(0.25)));
pruefe("Vollmond ist rund", Math.abs(randbreite(0.5) - 10) < 0.01, String(randbreite(0.5)));
pruefe("Neumond ist rund", Math.abs(randbreite(0) - 10) < 0.01, String(randbreite(0)));
// Die Sichel bei 0,64 (82 % hell) war der gemeldete Fall: fast voll, nicht dünn.
pruefe("0,64 ist fast voll", randbreite(0.64) > 5, String(randbreite(0.64)));

/* ── Das Wetter ──────────────────────────────────────────────────── */

/**
 * Calendarias 41 Effektvorlagen, Stand 1.4.0. Ausgelesen aus dessen
 * Wetterliste; die Namen stehen dort als `fxPreset` und landen so in der
 * Welteinstellung, aus der wir lesen.
 */
const VORLAGEN = [
  "partly-cloudy", "cloudy", "overcast", "drizzle", "rain", "fog", "mist", "windy",
  "sunshower", "snow", "sleet", "heat-wave",
  "thunderstorm", "blizzard", "hail", "tornado", "hurricane", "ice-storm", "monsoon",
  "ashfall", "sandstorm", "luminous-sky", "sakura-bloom", "autumn-leaves",
  "rolling-fog", "wildfire-smoke", "dust-devil",
  "black-sun", "ley-surge", "aether-haze", "nullfront", "permafrost-surge",
  "gravewind", "veilfall", "arcane-winds", "acid-rain", "blood-rain",
  "meteor-shower", "spore-cloud", "divine-light", "plague-miasma"
];

pruefe("41 Vorlagen erwartet", VORLAGEN.length === 41, String(VORLAGEN.length));

for (const vorlage of VORLAGEN) {
  const art = wetterArt({ fxPreset: vorlage });
  pruefe(`${vorlage} ergibt ein Bild`, !!art);
}

const BAUSTEINE = new Set([
  "regen", "flocken", "koerner", "wolken", "nebel", "fahnen", "blaetter", "funken",
  "rauch", "wirbel", "schemen", "meteore", "aurora", "strahlen", "flimmern",
  "rauschen", "dunkel", "blitz", "farbe", "langsam"
]);
for (const [name, rezept] of Object.entries(WETTER_VORLAGEN)) {
  for (const teil of Object.keys(rezept)) {
    pruefe(`${name}: ${teil} ist ein bekannter Baustein`, BAUSTEINE.has(teil));
  }
}

// Kein Wetter aus der Tabelle darf leer bleiben - sonst zeigt die Kuppel nichts.
for (const [name, rezept] of Object.entries(WETTER_VORLAGEN)) {
  const zeichnet = Object.keys(rezept).some(k => k !== "farbe" && k !== "langsam");
  pruefe(`${name} zeichnet etwas`, zeichnet);
}

// Eigenes Wetter ohne Vorlage fällt auf Niederschlag und Wind zurück.
pruefe("eigener Regen", wetterArt({ fxPreset: "wasauchimmer", precipitation: { type: "rain", intensity: 0.5 } })?.regen > 0);
pruefe("eigener Schnee", wetterArt({ fxPreset: "wasauchimmer", precipitation: { type: "snow", intensity: 0.5 } })?.flocken > 0);
pruefe("eigener Sturm", wetterArt({ fxPreset: "wasauchimmer", wind: { speed: 4 } })?.fahnen > 0);
pruefe("klarer Himmel bleibt leer", wetterArt({ fxPreset: "wasauchimmer" }) === null);
pruefe("ohne Wetter bleibt leer", wetterArt(null) === null);

// Eine Sonderfarbe aus fremden Daten darf nur eine Farbe sein.
pruefe("gültige Sonderfarbe wird genommen",
  wetterArt({ fxPreset: "rain", fxColor: "#123456" })?.farbe === "#123456");
pruefe("unsinnige Sonderfarbe wird verworfen",
  wetterArt({ fxPreset: "rain", fxColor: "\"><script>" })?.farbe === null);

console.log(fehler === 0 ? "\nalle Fälle richtig" : `\n${fehler} Fälle falsch`);
process.exit(fehler === 0 ? 0 : 1);
