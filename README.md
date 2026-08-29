# Ninjo's In-Person Tools

Werkzeuge für Foundry VTT beim Spielen am echten Tisch: Die Karte hängt am
Fernseher, die Spieler haben Foundry nur für Charakterbogen, Würfel und ihr
Token offen — und trotzdem zieht sich jeder Laptop bei jedem Szenenwechsel
dieselben Megabyte über WLAN.

Vier Bereiche, unabhängig voneinander nutzbar:

| | |
|---|---|
| [Kartensperre](#kartensperre) | Spieler-Clients laden die Battlemap nicht mehr |
| [Szenen-Monitore](#szenen-monitore) | zwei Bildschirme mit getrennten Aufgaben |
| [Szenendrehung](#szenendrehung) | hochkante Karten quer auf 16:9 |
| [Spieler holen](#spieler-holen) | gezielt einzelne Spieler auf eine Szene ziehen |

Getestet gegen **Foundry v14**, Mindestversion v13. Läuft eigenständig; wo
andere Module vorhanden sind, fügt es sich ein, braucht sie aber nicht.

---

## Kartensperre

### Was sie tut

Auf zugewiesenen Clients wird die **Hintergrundkarte** der Szene nicht mehr
heruntergeladen. Alles andere — Tokens, Tiles, Effekte, Portraits, Handouts —
läuft normal durch. Der Canvas bleibt voll bedienbar: Raster, Wände, Licht,
Zielen und Messen funktionieren weiter, nur die Karte bleibt schwarz.

### Gemessen

Auf einem Produktionsserver, Spieler-Client, ein Klick des Spielleiters auf
„Szene vorladen":

| | Tischmodus aus | an |
|---|---|---|
| Übertragen | **58,86 MB** | **0,00 MB** |
| Dateien | 71 | 0 |

Bei sechs Spielern sind das rund 500 MB pro Szenenwechsel, die nicht mehr durch
das WLAN gehen.

### Bedienung

`Alt+T` öffnet die Steuerung, ebenso *Einstellungen → Moduleinstellungen →
Steuerung öffnen*. Dort:

- **Hauptschalter** — ohne ihn passiert gar nichts
- **Dreifachschalter je Spieler** — Automatisch / Immer / Nie
- **Vermessen** — fragt beim Server die Dateigrößen der Szene ab (nur
  Kopfzeilen, ein paar hundert Byte auch bei einer 35-MB-Karte) und zeigt
  darunter, wie viel davon blockiert wird und wie viel trotzdem ankommt

### Einstellungen

| Einstellung | Standard | Bedeutung |
|---|---|---|
| Spieler standardmäßig einbeziehen | an | Spieler ohne eigene Zuweisung laufen im Tischmodus |
| Was blockiert wird | nur Hintergrundkarte | „Alles Schwere" nimmt zusätzlich Tiles und Effekte |
| Token-Bilder weiter laden | an | nur bei „Alles Schwere" relevant |
| Audio blockieren | **aus** | siehe Warnung unten |
| Ladebalken bei Spielern ausblenden | an | Foundry zeigt ihn auch für Cache-Treffer |
| Spielfeld im Tischmodus ganz abschalten | aus | setzt zusätzlich `core.noCanvas`, verlangt einen Reload |
| Ausnahmen | leer | Pfadschnipsel, die nie blockiert werden |

> **Audio blockieren birgt eine Kollision.** Gemessen am 28.08.2026: Bei
> laufender Playlist bringt es `monks-sound-enhancements` zum Absturz, die
> Konsole füllt sich im Sekundentakt. Der Fehler liegt in jenem Modul, ausgelöst
> wird er hier. Deshalb standardmäßig aus.

### Warum es auch mit abgeschaltetem Spielfeld nötig ist

Foundrys eigenes „Spielfeld deaktivieren" (`core.noCanvas`) blockt **nur** das
Zeichnen, nicht das Vorladen:

```
Canvas#draw     → loadSceneTextures     von noCanvas geblockt
Scenes#preload  → loadSceneTextures     NICHT geblockt
```

`Scenes#preload` hängt am Socket `preloadScene`. Ein Klick auf „Szene vorladen"
lässt daher **jeden** Client die volle Szene ziehen — auch die ohne Spielfeld.
Genau diese Lücke schließt die Kartensperre.

---

## Szenen-Monitore

Für Aufbauten mit zwei Bildschirmen. Beide Konten werden in den
Moduleinstellungen benannt — die Namen sind frei wählbar.

| Rolle | Verhalten |
|---|---|
| **Battlemap-Monitor** | folgt jedem Szenenwechsel, wie gewohnt |
| **Szenen-Monitor** | lässt sich fixieren und bleibt dann stehen |

Beide sind automatisch von der Kartensperre ausgenommen — ein schwarzer
Fernseher wäre der eine Fehler, der den Abend ruiniert.

### Fixieren

Aktivierst du eine Szene, zieht Foundry normalerweise **alle** Clients mit.
Ist der Szenen-Monitor fixiert, bleibt er stehen, bis du ihn ausdrücklich
woanders hin schickst.

- **Rechtsklick auf eine Szene → „Szenen-Monitor fixieren / lösen"**
- **Rechtsklick → „Auf Szenen-Monitor anzeigen"** schickt ihn gezielt hin
- **Umschalt+Klick** oder **Strg+Klick** auf eine Szene tut dasselbe schneller
- Ein **goldenes Monitor-Symbol** in der Navigationsleiste zeigt, welche Szene
  gerade dort läuft

Die Zuordnung überlebt einen Reload des Monitors: Er kommt auf seine Szene
zurück, nicht auf die aktive.

### Beim Lösen

Einstellung **„Wenn ein Monitor gelöst wird"**:

- *Zur aktiven Szene wechseln und wieder folgen* (Standard)
- *Auf die Ruhebild-Szene wechseln* — die wählst du in der Steuerung oder per
  Rechtsklick auf eine Szene → „Als Ruhebild festlegen"

### Begleitszenen

Eine Battlemap kann sich merken, welche Szene der Szenen-Monitor dazu zeigen
soll. Wird die Battlemap aktiviert, wechselt er dorthin — **auch wenn er
fixiert ist**, denn genau dafür legst du die Verknüpfung an.

Einzustellen im Szenenfenster unter *Verschiedenes → Szenen-Monitor →
Begleitszene*. Eine Übersicht aller Paare steht in der Steuerung, jedes mit
einem ✕ zum Auflösen. Die Zuordnung hängt als Flag an der Szene und wandert
beim Kopieren mit.

---

## Szenendrehung

Für hochkant gezeichnete Karten, die quer die Breite eines 16:9-Bildschirms
ausnutzen sollen.

Einzustellen im Szenenfenster unter *Verschiedenes → Szenen-Monitor →
Drehung der Szene*: 0°, 90°, 180° oder 270°.

Die Drehung gehört zur **Szene**, nicht zum Client: Eine falschherum gezeichnete
Karte ist für jeden falschherum. Alle sehen sie gleich gedreht.

Mausklicks, Ziehen und Zielen funktionieren ohne Zutun weiter — Foundry rechnet
Zeigerpositionen über die inverse Weltmatrix zurück, Drehung eingeschlossen.

### Das Token-Menü

Das Token-Menü liegt als HTML über dem Spielfeld und dreht nicht von selbst mit.
Ohne Korrektur landet es neben dem Token, oft außerhalb des Bilds. Das Modul
dreht seinen Rahmen mit — dadurch stimmt die Position, aber die Beschriftung
läge quer. Deshalb dreht es die Beschriftungen wieder zurück.

Einstellung **„Token-Menü gerade halten"** (Standard an). Sollte das Menü damit
neben dem Token landen, schalte sie aus: dann steht es schief, aber richtig.

---

## Spieler holen

Foundrys Bordmittel kennt nur „alle herholen" — das reißt auch die Monitore mit
und holt Spieler aus einem Charakterbogen, in dem sie gerade lesen.

**Rechtsklick auf eine Szene → „Spieler hierher holen"**, oder der Knopf unten
in der Steuerung. Es öffnet sich eine Liste aller angemeldeten Spieler mit:

- **Häkchen je Spieler**, vorausgewählt sind die, die noch nicht dort sind
- **Monitor-Konten sind nicht vorausgewählt** — die steuerst du getrennt
- daneben steht, wo jeder gerade ist
- **Alle / Keine** zum schnellen Umschalten

---

## Installation

Das Modul liegt unter `Data/modules/ninjos-inperson-tools`. Deploy aus dem
Projektordner:

```powershell
.\tools\deploy-inperson.ps1 -Target testv14 -DryRun
.\tools\deploy-inperson.ps1 -Target testv14
```

`-Target prod` geht auf den Produktionsserver. Danach die Welt in Foundry neu
laden — nicht nur F5, sondern verlassen und neu öffnen, sonst werden neue
Einstellungen und Tastenkürzel nicht registriert.

**libWrapper** ist empfohlen, aber nicht Pflicht — ohne fällt das Modul auf
einen eigenen Patch zurück.

---

## Technische Notizen

Für alle, die im Code nachsehen wollen, warum etwas so gebaut ist wie es ist.

### Ein Trichter für alle Downloads

`PIXI.Assets.load` kommt im gesamten Foundry-Client **genau einmal** vor:
`client/canvas/loader.mjs:357`, innerhalb von `TextureLoader#loadTexture`.
Jeder Pfad — Zeichnen, Vorladen, Nachladen — führt dorthin. Der Wrapper kehrt
**vor** dieser Zeile um: Es wird keine Anfrage abgebrochen, sie wird nie
gestellt.

Die Szenengeometrie bleibt unberührt, weil `Scene#getDimensions()`
(`documents/scene.mjs:480`) ausschließlich aus `width`, `height`, `grid` und
`padding` rechnet — nie aus der Bilddatei.

### Bewusste Ausnahmen

- **Spritesheets (`.json`)** werden nie ersetzt: `loadTexture` kann dafür eine
  `PIXI.Spritesheet` zurückgeben, und Aufrufer verzweigen auf `instanceof`.
- **SVG und `icons/`-Verzeichnisse** bleiben — dort liegen die Token-Statusmarker
  von System und Modulen, ein bis zwei Kilobyte je Datei.
- **`ParticleEffect#lookupTexture`** (`particle-generator.mjs:2986`) umgeht den
  Wrapper über `PIXI.Texture.from`. Betrifft Wetter- und Partikelbilder unter
  `ui/particles/` — zusammen 68 KB, gecacht und lokal. Nicht behebbar ohne einen
  zweiten Wrapper, den die Größe nicht rechtfertigt.

### Der Freeze sitzt auf `_onActivate`, nicht auf `view()`

`Scene#_onActivate` (`documents/scene.mjs:1412`) ist ausschließlich der
automatische Pull. `view()` ist auch der Weg, auf dem der Monitor absichtlich
bewegt wird — dort zu blocken würde ihn dauerhaft festsetzen.

Beide Richtungen müssen geschluckt werden: Aktivieren von B feuert
`_onActivate(true)` auf B **und** `_onActivate(false)` auf das vorher aktive A,
und letzteres ruft `unview()`. Fängt man nur die erste ab, zeigt der Monitor gar
nichts mehr.

### Was das Zustands-Modell erklärt

Die Szene des Monitors liegt als Wert in einer Welt-Einstellung, nicht als
einmaliges Ereignis. `pullUsers` bewegt den Client zwar sofort, vergisst es aber
— nach einem Reload käme er auf der aktiven Szene hoch, und es sähe aus, als sei
der Fehler zurück.

### Drehung

`canvas.stage.rotation` dreht den gesamten PIXI-Baum. Das HUD liegt außerhalb:
`HeadsUpDisplayContainer#align()` (`applications/hud/container.mjs:87`) überträgt
nur Position und Zoom auf den HTML-Rahmen, nicht die Achsen — deshalb muss er
per CSS mitgedreht werden. Geschrieben wird in `style.rotate`, nicht in
`transform`: Letzteres überschreibt `align()` bei jedem Schwenk.
