# Hinweis für den Agenten: Version eingereicht, Freigabe steht aus

*Stand 29.08.2026, 01:45 UTC. Abschnitt zur Sichtbarkeit am 30.08.2026 berichtigt.*

## Was passiert ist

Der frühere Hinweis vermutete, `PACKAGE_TOKEN` fehle. Das war die richtige Spur, aber der
Grund war ein Zeitproblem:

| | Zeit |
| --- | --- |
| Release-Lauf `v14.2609.7` | 00:15:22 UTC |
| `PACKAGE_TOKEN` hinterlegt | **00:21:46 UTC** |

Der Lauf war sechs Minuten zu früh. Im Protokoll steht `PACKAGE_TOKEN:` — leer — und der
Schritt *Publish Module to FoundryVTT Website* übersprang sich still, weil er an
`if: env.PACKAGE_TOKEN != ''` hängt.

**Ein erneuter Lauf desselben Workflows** (`gh run rerun 33222981224`) hat das behoben. Die
Einreichung lief durch:

```
{"id":"ninjos-inperson-tools","release":{"version":"14.2609.7", ...}}
Response: 200 OK
{"status": "success", "page": "https://foundryvtt.com/packages/ninjos-inperson-tools/edit/"}
```

## Was noch fehlt: die Freigabe durch Foundry

> **Berichtigt am 30.08.2026.** Der ursprüngliche Schluss hier war falsch. Er lautete,
> das Paket werde erst sichtbar, wenn im Entwicklerkonto die Beschreibung
> vervollständigt und das Paket selbst freigegeben werde. Das ist nicht so — und es
> hätte zu vergeblichem Suchen nach einem Knopf geführt, den es nicht gibt.

Nachgesehen auf `foundryvtt.com/community/niclasdm/packages/`. Die Seite nennt zu jedem
Paket einen **Status**, und der beantwortet die Frage:

| Modul | Status | Version |
| --- | --- | --- |
| Ninjo's Foundry MCP | **Pending** | 14.2608.1 |
| Ninjo's In-Person Tools | **Pending** | 14.2609.7 |
| Ninjo's DnD Reference Sheet (NDRS) | **Pending** | 14.2608.1 |
| Ninjo's FANG | Approved | 14.2608.1 |
| Ninjo's DnD5e5.5 German Translation | Approved | 14.0.30 |
| Ninjo's Player Wheel | Approved | 14.0.0 |

**Pending heißt: eingereicht und in der Warteschlange.** Die Prüfung machen Menschen bei
Foundry, und laut deren eigener Dokumentation wird jede Einreichung von Hand angesehen —
unter anderem daraufhin, ob der Autor die Rechte an allem Enthaltenen hat. Das dauert.

Es ist also **nichts zu tun**. Kein fehlendes Feld, kein Knopf, keine Freischaltung. Die
302-Weiterleitung der Katalogseite ist die normale Folge des Status, kein Symptom eines
Fehlers.

### Gegenprobe: zeigen die Manifeste richtig?

Am 30.08.2026 für alle fünf Pakete geprüft — Repo öffentlich, Manifest und Zip unter
`releases/latest/download/` abrufbar (HTTP 200), Kennung und Version passend zum
Katalogeintrag. **Kein einziger falscher Verweis.** Das Pending liegt an nichts
Technischem.

> **Auf der Forge steht bei NDRS bereits ein Katalog-Knopf**, der auf
> `foundryvtt.com/packages/ndrs` zeigt. Diese Adresse leitet auf die Paketübersicht um; der
> Knopf führt derzeit also ins Leere. Entweder NDRS ebenfalls freischalten, oder in
> `Ninjos-Forge/src/data/modules.js` beim Eintrag `ndrs` `foundryUrl` wieder auf `null`
> setzen, bis es soweit ist.

## Danach

In `F:\KI-Agenten-Workspace\Ninjos-Forge\src\data\modules.js` beim Eintrag `inperson-tools`
`foundryUrl` auf `https://foundryvtt.com/packages/ninjos-inperson-tools` setzen und in
`src/content/inperson-tools.md` den Schlusssatz des Abschnitts *Installation* streichen, der
sagt, das Modul stehe noch nicht im Katalog.

## Weiterhin offen

**Der CHANGELOG hinkt hinterher.** Getaggt ist `v14.2609.7`, der oberste Eintrag im
`CHANGELOG.md` ist `14.2608.1`. Ausgerechnet in dieser Lücke steckt laut README die
Absturzabfangung für `monks-sound-enhancements` („seit 14.2609.x").

**Drei der vier Bereiche liefen noch nie in einer Welt.** `TESTPLAN.md` sagt es selbst.
Belegt ist nur die Kartensperre (58,86 MB → 0,00 MB, gemessen). Die Forge führt das Modul
deshalb als **Beta** — erst nach dem Testplan auf `status: 'stable'` wechseln.
