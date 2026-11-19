/**
 * Prüfung der Ebenenwahl für den Ersatzknopf „Vorschaubild erzeugen“
 * (scripts/vorschaubild.js), ohne Foundry.
 *
 *   node tools/test-vorschaubild.mjs
 */

let fehler = 0;
function pruefe(name, ist, soll) {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${name}${gut ? "" : `\n    ist:  ${JSON.stringify(ist)}\n    soll: ${JSON.stringify(soll)}`}`);
}

// vorschaubild.js holt const.js und stille.js; beide brauchen Foundry erst beim Aufruf.
const { ebeneWaehlen, istVideo } = await import("../scripts/vorschaubild.js");

const leer = { id: "a", hatBild: false };
const keller = { id: "k", hatBild: true };
const oben = { id: "o", hatBild: true };

pruefe("Bevorzugte Ebene mit Bild bleibt", ebeneWaehlen([keller, oben], "o"), "o");
pruefe("Leere Startebene: erste Ebene mit Bild von unten", ebeneWaehlen([leer, keller, oben], "a"), "k");
pruefe("Unbekannte bevorzugte Ebene: erste mit Bild", ebeneWaehlen([leer, oben], "x"), "o");
pruefe("Keine bevorzugte Ebene: erste mit Bild", ebeneWaehlen([leer, oben], null), "o");
pruefe("Nirgends etwas: null", ebeneWaehlen([leer, { id: "b", hatBild: false }], "a"), null);
pruefe("Keine Ebenen: null", ebeneWaehlen([], "a"), null);
pruefe("Unsinnige Eingabe: null", ebeneWaehlen(undefined, "a"), null);

// Wie CONST.VIDEO_FILE_EXTENSIONS in Foundry 14.
const endungen = ["m4v", "mp4", "ogv", "webm"];
pruefe("webm ist Video", istVideo("Intros/gda.webm", endungen), true);
pruefe("MP4 in Großbuchstaben ist Video", istVideo("a/B.MP4", endungen), true);
pruefe("Abfrageteil stört nicht", istVideo("a/b.webm?1234", endungen), true);
pruefe("webp ist kein Video", istVideo("a/b.webp", endungen), false);
pruefe("webm nur im Ordnernamen zählt nicht", istVideo("webm/b.png", endungen), false);
pruefe("Leere Quelle", istVideo("", endungen), false);
pruefe("Ohne Endungsliste", istVideo("a.webm", []), false);

console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
process.exit(fehler ? 1 : 0);
