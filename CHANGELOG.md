# Changelog

## 14.2608.1 — 2026-08-28

Vier UI-Anpassungen.

**Tastenkürzel.** `Alt+T` öffnet die Steuerung direkt. Alt-Kombinationen sind in
Foundry praktisch unbelegt — Alt allein ist „Objekte hervorheben", Alt plus
Buchstabe ist frei. Das Kürzel ist über Foundrys eigene Tastatur-Einstellungen
änderbar und nur für Spielleiter aktiv.

**Scrollposition bleibt stehen.** Bisher sprang die Liste bei jedem Klick nach
oben. Ursache war kein Foundry-Fehler, sondern eine fehlende Angabe: Der
Handlebars-Mixin sichert Scrollpositionen über `PARTS[…].scrollable`, und genau
die war nicht deklariert. Jetzt sind Panel und Spielerliste eingetragen.

**„Vermessen" ist erklärt.** Drei Tooltips und ein Hinweistext: was der Knopf
tut (nur Kopfzeilen abfragen, ein paar hundert Byte statt 35 MB), was die
Summe bedeutet (was ein Spieler ohne Tischmodus laden würde) und was
„unvermessen" heißt (fehlt in der Summe).

**Design auf das D&D-Aussehen umgestellt.** Layout unverändert, nur die Optik:
Pergamentgrund `#fdfbf7`, Dunkelrot `#8B0000`, Gold `#D4AF37`, Segoe UI, 2 px
Radien und die Schaltflächenform aus `fang.css`. Die Werte stehen bewusst fest
im Modul statt als `var(--fang-...)` geerbt — sonst würde das Panel FANGs
Cyberpunk-Variante mitmachen, sobald die eingeschaltet ist.

## 14.2607.6 — 2026-08-28

Zwei Ergebnisse aus der Live-Messreihe.

**Ladebalken.** Neue Einstellung „Ladebalken bei Spielern ausblenden" (Standard: an).
Foundry zeigt seinen Szenen-Ladebalken auch dann, wenn jede Datei aus dem
Browser-Cache kommt oder blockiert wurde — gemessen: 52 Dateien angezeigt,
0,01 MB tatsächlich übertragen. Er meldet Verarbeitung, nicht Bandbreite, und ist
in dieser Rolle irreführend. Umgesetzt über `displayProgress: false`, eine
dokumentierte Option von `TextureLoader#load`. Blendet nur die Anzeige aus, am
Ladeverhalten ändert sich nichts.

**Audio-Blockade kollidiert mit monks-sound-enhancements.** Gemessen: mit
eingeschalteter Audio-Blockade und laufender Playlist füllte sich die Konsole mit
4476 Ausnahmen im Sekundentakt (`Cannot read properties of null (reading
'classList')` in `MSE_PlaylistDirectory.updateTimestamps`). Nach dem Abschalten:
keine einzige in zehn Sekunden. Ursache ist, dass ein auf „fehlgeschlagen"
gesetzter Sound von Foundry weiter als spielend geführt wird und MSE dafür kein
DOM-Element findet. Der Fehler steckt in MSE, ausgelöst hat ihn Table Mode. Die
Einstellung steht ohnehin standardmäßig auf aus; der Hinweistext nennt die
Kollision jetzt beim Namen.

## 14.2607.5 — 2026-08-28

Die vorberechnete Sperrliste ist raus. Bei jeder Anfrage wird jetzt direkt an den
Szenen-Dokumenten geprüft, ob die Datei ein Szenenhintergrund ist.

Die Vorberechnung war die Ursache des Fehlers aus 14.2607.4 und nicht dessen
Lösung: Eine Liste, die zum richtigen Zeitpunkt gefüllt sein muss, kann zum
falschen Zeitpunkt leer sein. Die Direktabfrage hat keine Initialisierungs-
reihenfolge, keine Hooks und ist immer aktuell — auch für Szenen, die während
der Sitzung entstehen.

- `isSceneBackground()` ersetzt Set, Lazy-Aufbau und vier Hooks.
- Kosten: ein Stringvergleich je Szene, nur für Clients im Tischmodus.

## 14.2607.4 — 2026-08-28

Fehler behoben, gefunden bei der zweiten Live-Messung: Beim **ersten** Zeichnen
nach dem Beitreten wurde der Hintergrund nicht blockiert.

Foundry zeichnet den Canvas während `setup`, also **vor** dem `ready`-Hook. Die
Sperrliste wurde aber erst in `ready` gefüllt und war beim ersten Draw noch leer.
Betroffen war ausgerechnet der häufigste Fall: ein Spieler, der die Sitzung
betritt. Beim Vorladen fiel es nicht auf, weil das lange nach `ready` passiert.

- Die Liste wird jetzt träge beim ersten Zugriff aufgebaut, unabhängig von der
  Hook-Reihenfolge, und zusätzlich schon in `setup`.
- Neu in der API: `backgroundCount()` und `rebuild()` zur Diagnose.

## 14.2607.3 — 2026-08-28

Umfang deutlich verengt. Neue Einstellung "Was blockiert wird", Standard:
**nur die Hintergrundkarte**. Tiles, Effekte, Portraits, Handouts und Modul-Grafiken
laufen wieder durch.

Der Grund ist eine Abwägung, keine technische Notwendigkeit: Ein paar Megabyte zu
viel kosten Bandbreite, eine fälschlich blockierte Datei kostet den Spielabend.
Deshalb ist die Liste jetzt eine Sperrliste statt einer Freigabeliste — blockiert
wird nur, was sich positiv als Szenenhintergrund identifizieren lässt.

- Hintergründe und Vordergründe **aller** Szenen werden gesammelt, nicht nur die
  der aktuellen. Die Vorladung kann jede Szene der Welt betreffen.
- Die Liste folgt Szenen- und Level-Änderungen über Hooks.
- Audio blockieren steht jetzt standardmäßig auf **aus**.
- Wer den alten Umfang will, wählt "Alles Schwere (Karte, Tiles, Effekte)".

## 14.2607.2 — 2026-08-28

Erste Messung im Live-Betrieb auf foundry-1 (v14.367), Spieler-Client mit
abgeschaltetem Spielfeld. Ein Klick auf "Szene vorladen" beim Spielleiter:

| | Tischmodus aus | Tischmodus an |
|---|---|---|
| Übertragen | 58,86 MB | 0,00 MB |
| Geladene Dateien | 71 | 0 |

Damit ist belegt, dass `core.noCanvas` die Vorladung nicht abfängt — die
58,86 MB flossen auf einen Client, der gar kein Spielfeld hatte.

- SVG-Dateien und alle `icons/`-Verzeichnisse stehen jetzt auf der Ausnahmeliste.
  Die Messung zeigte, dass sonst die Token-Statusmarker von System und Modulen
  mitblockiert werden (`systems/dnd5e/icons/svg/statuses/*`, ein bis zwei KB je
  Datei, aber sie tragen echte Information). Battlemaps sind nie SVG, die Regel
  kostet also nichts.

## 14.2607.1 — 2026-07-23

Erste Fassung.

- Blockiert Karten-, Tile-, Effekt- und Audio-Downloads auf zugewiesenen Clients
  über einen Wrapper auf `TextureLoader#loadTexture` und `Sound#load`.
- Schwarze Ersatztextur statt Netzwerkanfrage. Szenengeometrie, Raster, Wände,
  Licht und Tokenpositionen bleiben unangetastet.
- Token-Grafiken werden standardmäßig weiter geladen, abschaltbar.
- Spritesheets, virtuelle Texturen und Core-Icons sind von der Blockade ausgenommen.
- GM-Panel mit Dreifachschalter pro Spieler (Automatisch / Immer / Nie).
- Monitor-Konten sind geschützt und laufen nie automatisch im Tischmodus. Erkennung
  über `monitorDisplayName` aus FANG, sonst über die eigene Einstellung
  (Standard `Monitor`). Nur ein ausdrückliches „Immer" hebt den Schutz auf.
- Szenen-Vermessung per HEAD-Anfrage: zeigt die echten Bytes pro Client statt einer
  Schätzung.
- Statusanzeige auf betroffenen Clients, Rückmeldung der Zahlen ans GM-Panel.
- Optionale Stufe „Spielfeld im Tischmodus ganz abschalten": setzt zusätzlich
  `core.noCanvas` und bietet den Reload an. Table Mode gibt das Flag nur frei, wenn es
  das selbst gesetzt hat, damit es sich nicht mit Sheet-Only darum streitet.
- Deutsch und Englisch vollständig.
- libWrapper wird genutzt wenn vorhanden, sonst eigener Fallback-Patch.
