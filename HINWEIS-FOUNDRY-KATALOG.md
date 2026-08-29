# Hinweis für den Agenten: Release steht, Katalogeintrag fehlt

*Angelegt am 29.08.2026. Ersetzt den früheren Hinweis „Table Mode ist nirgends veröffentlicht" —
der ist vollständig erledigt.*

## Was inzwischen erledigt ist

Der alte Hinweis listete sechs fehlende Dinge. Fünf davon stehen:

| | Zustand |
| --- | --- |
| Lokales Git-Repository | ✅ vorhanden |
| GitHub `Niclasp1501/Ninjos-InPerson-Tools` | ✅ öffentlich (HTTP 200) |
| LICENSE | ✅ MIT |
| Release-Workflows | ✅ vorhanden |
| Release `v14.2609.7` mit `module.json` + `module.zip` | ✅ kein Entwurf, keine Vorabversion |
| Manifest-URL | ✅ antwortet mit HTTP 200 |
| **Eintrag im Foundry-Paketkatalog** | ❌ **fehlt** |

Auf [ninjos-forge.web.app/modules/inperson-tools](https://ninjos-forge.web.app/modules/inperson-tools)
steht das Modul jetzt mit allen vier Bereichen und einer funktionierenden Manifest-URL.
Die alte Adresse `/modules/table-mode` leitet dorthin weiter.

## Punkt 1: Der Foundry-Katalog

`foundryvtt.com/packages/ninjos-inperson-tools` leitet auf die Paketübersicht um — Foundrys
Art, „gibt es nicht" zu sagen. FANG, NDRS, Player Wheel und die DnD5e-Übersetzung sind alle
drin, der Weg ist also bekannt.

Zwei Dinge prüfen, in dieser Reihenfolge:

1. **Ist das Paket auf foundryvtt.com überhaupt angelegt?** Die Schnittstelle reicht nur
   *neue Versionen zu einem bestehenden Paket* ein. Den allerersten Eintrag muss man von
   Hand über das Entwicklerkonto anlegen — solange der fehlt, läuft jeder automatische
   Publish-Schritt ins Leere, auch mit gültigem Token.
2. **Ist `PACKAGE_TOKEN` in den Repository-Geheimnissen hinterlegt?** Bei NDRS hängt der
   Publish-Schritt an `if: env.PACKAGE_TOKEN != ''` und überspringt sich sonst still. Hier
   die Workflows gegenprüfen, ob dieselbe Bedingung greift.

Danach in `F:\KI-Agenten-Workspace\Ninjos-Forge\src\data\modules.js` beim Eintrag
`inperson-tools` `foundryUrl` setzen — dann erscheint der Katalog-Knopf. Außerdem in
`src/content/inperson-tools.md` den Schlusssatz des Abschnitts *Installation* streichen, der
sagt, dass das Modul noch nicht im Katalog steht.

## Punkt 2: Der CHANGELOG hinkt der Version hinterher

Veröffentlicht und getaggt ist **v14.2609.7**. Der oberste Eintrag im `CHANGELOG.md` ist aber
**14.2608.1**. Was zwischen `.2608.1` und `.2609.7` passiert ist, steht nirgends — und das ist
gerade der Bereich, in dem laut README die Absturzabfangung für
`monks-sound-enhancements` dazugekommen ist („seit 14.2609.x").

Die fehlenden Einträge nachtragen. Bei der DnD5e-Übersetzung wurde am 28.08.2026 genau das
schon einmal gemacht (Commit „CHANGELOG-Luecken 14.0.20 bis 14.0.23 nachgetragen") — dieselbe
Sorgfalt hier.

## Punkt 3: Drei der vier Bereiche liefen noch nie in einer Welt

`TESTPLAN.md` sagt es selbst: *„Stand: noch nie in einer Welt gelaufen. Alles unten ist aus dem
v14-Quellcode abgeleitet, nichts davon ist gemessen."*

Belegt ist nur die **Kartensperre** (58,86 MB → 0,00 MB, auf einem Produktionsserver gemessen).
Szenen-Monitore, Szenendrehung und Spieler holen sind aus dem Quellcode abgeleitet.

Die Forge sagt das im Abschnitt *Status* ausdrücklich und führt das Modul deshalb als **Beta**.
Sobald der Testplan durchlaufen ist, dort auf `status: 'stable'` wechseln und den Statusabsatz
in `inperson-tools.md` anpassen.

**Nicht vorher.** Der Wert der Kartensperre steht und fällt damit, dass die Messungen ehrlich
beziffert sind — dieselbe Haltung gehört auf die übrigen drei Bereiche.
