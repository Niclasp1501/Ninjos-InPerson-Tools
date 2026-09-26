/**
 * Prüft, welche Ebene der Battlemap-Monitor wählt.
 *
 * Die Regeln stehen in ebenen.js bei ebeneWaehlen(). Geprüft wird jede davon,
 * und die Fälle, die am Tisch auffallen würden:
 *
 *   - Ein einzelner Späher auf dem Dach nimmt den Fernseher nicht mit.
 *   - Bei Gleichstand gewinnt die letzte Bewegung, auch gegen die angezeigte.
 *   - Im Kampf zählt, wer dran ist; ein Gegnerzug lässt den Monitor stehen.
 *   - Versteckte Figuren und Figuren ohne Spieler zählen nicht.
 *   - Ohne Spielerfigur gibt es keine Meinung.
 *
 * Dazu die Einstellungen: Foundry-Standard und Szenen mit einer Ebene lassen
 * Foundry entscheiden, eine Vorgabe gilt nur ihrer eigenen Karte.
 *
 * node tools/test-ebenen.mjs
 */

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const a = JSON.stringify(ist), b = JSON.stringify(soll);
  const gut = a === b;
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${a}\n    soll: ${b}`}`);
};

/* ── Ein Foundry, so klein wie es sein darf ──────────────────────── */

const einstellungen = { monitorLevelMode: "autonom", monitorLevelFixed: {}, monitorBM: "u-bm", monitorSC: "u-sc" };
globalThis.game = {
  settings: { get: (_m, k) => einstellungen[k] },
  users: [],
  combats: [],
  user: { id: "u-bm", isGM: false }
};
globalThis.foundry = { applications: { api: {} } };

const E = await import("../scripts/ebenen.js");

const f = (id, ebene, spieler = true, versteckt = false) => ({ id, ebene, spieler, versteckt });
const reihenfolge = ["erd", "dach", "keller"];

/* ── 1. Mehrheit ────────────────────────────────────────────────── */

pruefe("ein Späher auf dem Dach nimmt den Fernseher nicht mit",
  E.ebeneWaehlen({ figuren: [f("a", "erd"), f("b", "erd"), f("c", "erd"), f("d", "dach")], aktuell: "erd", zuletzt: "d", reihenfolge }),
  "erd");
pruefe("drei oben, einer unten: hoch",
  E.ebeneWaehlen({ figuren: [f("a", "dach"), f("b", "dach"), f("c", "dach"), f("d", "erd")], aktuell: "erd", reihenfolge }),
  "dach");
pruefe("versteckte zählen nicht",
  E.ebeneWaehlen({ figuren: [f("a", "erd"), f("b", "dach", true, true), f("c", "dach", true, true)], aktuell: "dach", reihenfolge }),
  "erd");
pruefe("Figuren ohne Spieler zählen nicht",
  E.ebeneWaehlen({ figuren: [f("a", "erd"), f("g1", "dach", false), f("g2", "dach", false)], aktuell: "dach", reihenfolge }),
  "erd");
pruefe("ohne Spielerfigur keine Meinung",
  E.ebeneWaehlen({ figuren: [f("g1", "dach", false)], aktuell: "erd", reihenfolge }),
  null);

/* ── 2. Gleichstand ─────────────────────────────────────────────── */

const zweiZwei = [f("a", "erd"), f("b", "erd"), f("c", "dach"), f("d", "dach")];
pruefe("Gleichstand: zuletzt bewegt oder angeklickt gewinnt, auch gegen die angezeigte",
  E.ebeneWaehlen({ figuren: zweiZwei, aktuell: "erd", zuletzt: "c", reihenfolge }), "dach");
pruefe("Gleichstand ohne letzte Bewegung: bleiben",
  E.ebeneWaehlen({ figuren: zweiZwei, aktuell: "dach", reihenfolge }), "dach");
pruefe("Gleichstand, letzte Figur steht woanders: bleiben",
  E.ebeneWaehlen({ figuren: [...zweiZwei, f("e", "keller")], aktuell: "erd", zuletzt: "e", reihenfolge }), "erd");
pruefe("Gleichstand vor dem ersten Zeichnen: Anfangsebene",
  E.ebeneWaehlen({ figuren: zweiZwei, aktuell: null, anfang: "dach", reihenfolge }), "dach");
pruefe("Gleichstand, nichts bekannt: unterste",
  E.ebeneWaehlen({ figuren: zweiZwei, aktuell: "keller", reihenfolge }), "erd");

/* ── 3. Kampf ───────────────────────────────────────────────────── */

pruefe("Spielerfigur am Zug: deren Ebene, auch gegen die Mehrheit",
  E.ebeneWaehlen({ figuren: [f("a", "erd"), f("b", "erd"), f("c", "dach")], aktuell: "erd", amZug: f("c", "dach"), reihenfolge }),
  "dach");
pruefe("Gegner am Zug: bleiben",
  E.ebeneWaehlen({ figuren: [f("a", "erd"), f("b", "erd"), f("c", "dach")], aktuell: "dach", amZug: f("g", "keller", false), reihenfolge }),
  "dach");
pruefe("versteckte Figur am Zug zählt wie ein Gegner",
  E.ebeneWaehlen({ figuren: [f("a", "erd")], aktuell: "erd", amZug: f("x", "keller", true, true), reihenfolge }),
  "erd");
pruefe("Gegner am Zug vor dem ersten Zeichnen: Mehrheit",
  E.ebeneWaehlen({ figuren: [f("a", "dach"), f("b", "dach"), f("c", "erd")], aktuell: null, amZug: f("g", "keller", false), reihenfolge }),
  "dach");

/* ── 4. Einstellungen und Szenen ───────────────────────────────── */

function szene(id, ebenen, tokens = []) {
  const levels = new Map(ebenen.map((e, i) => [e, { id: e, index: i }]));
  levels.sorted = [...levels.values()];
  return {
    id, tokens, levels,
    initialLevel: levels.get(ebenen[0]) ?? null
  };
}
const turm = szene("turm", ["erd", "dach"], [
  { id: "a", _source: { level: "dach" }, hidden: false, actor: null },
  { id: "b", _source: { level: "dach" }, hidden: false, actor: null }
]);

pruefe("eine einzige Ebene: Foundry entscheidet", E.zielEbene(szene("wiese", ["erd"]), "erd"), undefined);

einstellungen.monitorLevelMode = "foundry";
pruefe("Foundry-Standard: Foundry entscheidet", E.zielEbene(turm, "erd"), undefined);

einstellungen.monitorLevelMode = "manuell";
einstellungen.monitorLevelFixed = { sceneId: "turm", levelId: "erd" };
pruefe("manuell: die Vorgabe", E.zielEbene(turm, "dach"), "erd");

einstellungen.monitorLevelFixed = { sceneId: "anderswo", levelId: "erd" };
pruefe("manuell für eine andere Karte: wie autonom (ohne Spieler keine Meinung)", E.zielEbene(turm, "dach"), null);

einstellungen.monitorLevelFixed = { sceneId: "turm", levelId: "geloescht" };
pruefe("Vorgabe einer Ebene, die es nicht mehr gibt: wie autonom", E.zielEbene(turm, "dach"), null);

einstellungen.monitorLevelMode = "Unsinn";
pruefe("unbekannte Art gilt als autonom", E.modus(), "autonom");

console.log(`\n${fehler ? `${fehler} Fehler` : "alles gut"}`);
process.exit(fehler ? 1 : 0);
