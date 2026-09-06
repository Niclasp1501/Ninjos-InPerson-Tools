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

import { mondPfad, wetterArt, WETTER_VORLAGEN, mondphasen } from "../scripts/sky.js";

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

/* ── Die Monde ───────────────────────────────────────────────────── */

/**
 * Ein Kalender mit zwei Monden, wie ihn eine erfundene Welt hätte.
 *
 * Die Prüfung braucht Foundrys Globale nicht wirklich - nur die paar Stellen,
 * die `mondphasen` anfasst. Sie werden hier gestellt und danach wieder
 * weggeräumt, damit die Datei allein mit node läuft.
 */
function mitWelt(calendaria, tun) {
  const vorherGame = globalThis.game;
  const vorherCal = globalThis.CALENDARIA;
  globalThis.game = {
    i18n: { localize: s => s },
    time: { components: { year: 0, month: 0, dayOfMonth: 10, hour: 22, minute: 0 } }
  };
  globalThis.CALENDARIA = calendaria;
  try { return tun(); } finally {
    globalThis.game = vorherGame;
    globalThis.CALENDARIA = vorherCal;
  }
}

const ZWEI_MONDE = {
  months: { values: [{ days: 30 }, { days: 30 }] },
  moons: {
    selune: { name: "Selûne", color: "#C0C0C0", cycleLength: 30.4375, phases: { a: { name: "Vollmond", start: 0, end: 1 } } },
    tears:  { name: "Tränen", color: "#8899AA", cycleLength: 12,      phases: { a: { name: "Neumond", start: 0, end: 1 } } }
  }
};

// Ohne Calendaria: beide Monde selbst gerechnet.
mitWelt(undefined, () => {
  const monde = mondphasen(ZWEI_MONDE);
  pruefe("zwei Monde ohne Calendaria", monde.length === 2, `${monde.length}`);
  pruefe("beide tragen einen Namen", monde.every(m => m.mondname), JSON.stringify(monde.map(m => m.mondname)));
  pruefe("beide haben eine eigene Farbe", monde[0].farbe !== monde[1].farbe, `${monde[0].farbe} / ${monde[1].farbe}`);
});

// Versteckte Monde bleiben weg, auch ohne Calendaria.
mitWelt(undefined, () => {
  const versteckt = { ...ZWEI_MONDE, moons: { ...ZWEI_MONDE.moons, tears: { ...ZWEI_MONDE.moons.tears, visibility: "hidden" } } };
  pruefe("versteckter Mond fehlt", mondphasen(versteckt).length === 1);
});

// Mit Calendaria: dessen Antwort gilt, die Farbe kommt über den Index dazu.
mitWelt({
  permissions: { canViewMoons: () => true },
  api: { getAllMoonPhases: () => [
    { moonIndex: 0, moonName: "Selûne", name: "Letztes Viertel", position: 0.8 },
    { moonIndex: 1, moonName: "Tränen", name: "Neumond", position: 0.02 }
  ] }
}, () => {
  const monde = mondphasen(ZWEI_MONDE);
  pruefe("Calendaria liefert beide", monde.length === 2);
  pruefe("Anteil von Calendaria", Math.abs(monde[0].anteil - 0.8) < 1e-9, String(monde[0].anteil));
  pruefe("Farbe aus dem Kalender nachgeholt", monde[1].farbe && monde[1].farbe !== monde[0].farbe);
});

// Und der wichtige Fall: Der Spielleiter verbirgt die Monde vor den Spielern.
mitWelt({
  permissions: { canViewMoons: () => false },
  api: { getAllMoonPhases: () => [{ moonIndex: 0, moonName: "Selûne", name: "Vollmond", position: 0.5 }] }
}, () => {
  pruefe("verborgene Monde werden nicht gezeichnet", mondphasen(ZWEI_MONDE).length === 0);
});

console.log(fehler === 0 ? "\nalle Fälle richtig" : `\n${fehler} Fälle falsch`);
process.exit(fehler === 0 ? 0 : 1);
