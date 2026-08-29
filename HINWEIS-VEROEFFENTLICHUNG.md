# Hinweis für den Agenten: Table Mode ist nirgends veröffentlicht

*Angelegt am 28.08.2026 beim Aufbau von Ninjo's Forge.*

Das Modul ist auf [ninjos-forge.web.app/modules/table-mode](https://ninjos-forge.web.app/modules/table-mode)
verlinkt, aber **niemand kann es installieren**. Die Detailseite sagt das ehrlich („noch keine
Veröffentlichung") — das ist eine Zwischenlösung, kein Zielzustand.

Von allen eigenen Modulen ist das hier das einzige, das noch **gar keine Infrastruktur** hat.

## Was fehlt

| | Zustand |
| --- | --- |
| Lokales Git-Repository | fehlt — kein `.git` im Ordner |
| GitHub-Repository `Niclasp1501/Ninjos-InPerson-Tools` | **existiert nicht** (API: 404) |
| LICENSE | fehlt |
| Release-Workflow unter `.github/` | fehlt |
| GitHub-Release mit `module.json` + `module.zip` | fehlt |
| Eintrag im Foundry-Paketkatalog | fehlt |
| README | **vorhanden und gut** — 144 Zeilen, deutsch, ehrlich über die eine Lücke |

`module.json` verweist bereits auf `github.com/Niclasp1501/Ninjos-InPerson-Tools` und die
`releases/latest/download/`-URLs. Beide Adressen laufen derzeit ins Leere.

## Vorzubereiten

1. **Repository anlegen und veröffentlichen.**
   `git init`, erster Commit, Repo auf GitHub anlegen, pushen. Der Name muss exakt
   `Ninjos-InPerson-Tools` sein, sonst passen die URLs in `module.json` nicht mehr.

2. **LICENSE ergänzen.** FANG, NDRS, Player Wheel und die Übersetzung haben je eine — hier
   dieselbe nehmen, damit der Bestand einheitlich bleibt.

3. **Release-Workflow übernehmen.** Bei FANG liegt unter `.github/` bereits ein Workflow, der
   auf einen Tag hin `module.json` und `module.zip` an ein Release hängt. Genau diese beiden
   Dateien erwartet die Manifest-URL. Den Workflow von dort kopieren und die Modul-ID anpassen.

4. **Erstes Release ziehen.** Tag `v14.2607.1` passend zur Version in `module.json`. Danach
   prüfen, dass
   `https://github.com/Niclasp1501/Ninjos-InPerson-Tools/releases/latest/download/module.json`
   wirklich antwortet — erst dann stimmt die Angabe auf der Forge.

5. **Beim Foundry-Paketkatalog einreichen.** FANG, Player Wheel und die Übersetzung stehen
   bereits drin, der Weg ist also bekannt. Danach in
   `F:\KI-Agenten-Workspace\Ninjos-Forge\src\data\modules.js` beim Eintrag `table-mode`
   `foundryUrl` setzen — dann erscheint der Katalog-Knopf auf der Detailseite.

6. **`unreleased: true` entfernen**, sobald Schritt 4 steht. Erst dann zeigt die Forge die
   Manifest-URL zum Kopieren an, statt den Hinweis.

## Was ausdrücklich *nicht* zu tun ist

Die README nicht kürzen. Der Abschnitt „Geht wirklich nichts raus?" mit der offen benannten
`ParticleEffect`-Lücke ist der Grund, warum man dem Modul glaubt. Der Text auf der Forge baut
darauf auf.
