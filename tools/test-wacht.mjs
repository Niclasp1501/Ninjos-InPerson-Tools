/** Prueft, dass genau ein Modul die fremden Fenster uebernimmt. */
const faelle = [
  { an: ["ninjos-inperson-tools", "ninjos-shops"], soll: "ninjos-inperson-tools", was: "beide installiert" },
  { an: ["ninjos-shops"],                          soll: "ninjos-shops",          was: "nur Shops" },
  { an: ["ninjos-inperson-tools"],                 soll: "ninjos-inperson-tools", was: "nur In-Person" },
  { an: ["fang"],                                  soll: null,                    was: "keines von beiden" }
];
let fehler = 0;
for (const f of faelle) {
  globalThis.game = { modules: { get: id => (f.an.includes(id) ? { active: true } : null) } };
  const wacht = [];
  for (const [name, pfad] of [
    ["ninjos-inperson-tools", "F:/KI-Agenten-Workspace/Foundry-Module/Ninjos-InPerson-Tools/scripts/fensterpassen.js"],
    ["ninjos-shops",          "F:/KI-Agenten-Workspace/Foundry-Module/Ninjos-Shops/scripts/fensterpassen.js"]
  ]) {
    if (!f.an.includes(name)) continue;
    const m = await import(`file:///${pfad}?fall=${encodeURIComponent(f.was)}`);
    if (m.ichBinDieWacht()) wacht.push(name);
  }
  const ist = wacht.length === 1 ? wacht[0] : (wacht.length ? wacht.join("+") : null);
  const gut = ist === f.soll;
  if (!gut) fehler++;
  console.log(`${gut ? "✓" : "✗"} ${f.was}: Wacht = ${ist ?? "keine"}${gut ? "" : `  (erwartet ${f.soll})`}`);
}
console.log(fehler ? `\n${fehler} Fälle falsch` : "\nalle Fälle richtig");
process.exit(fehler ? 1 : 0);
