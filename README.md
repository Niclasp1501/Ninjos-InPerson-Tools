# Ninjo's In-Person Tools

**Current Version / Aktuelle Version:** `14.2609.7`

Tools for running Foundry VTT at a physical table: the map is on a TV, the
players only need their character sheet, dice and token — and yet every laptop
pulls the same megabytes over Wi-Fi on each scene change.

*(Scroll down for German version / Scrolle weiter runter für die deutsche Version)*

---

## 🇬🇧 English

Four areas, each usable on its own:

| | |
|---|---|
| [Map blocking](#map-blocking) | player clients stop downloading the battlemap |
| [Scene displays](#scene-displays) | two screens with separate jobs |
| [Scene rotation](#scene-rotation) | portrait maps laid across a 16:9 screen |
| [Bring players](#bring-players) | pull individual players to a scene |

Tested against **Foundry v14**, minimum v13. Runs standalone; it fits in where
other modules are present but needs none of them.

### Map blocking

On assigned clients the **background map** of a scene is no longer downloaded.
Everything else — tokens, tiles, effects, portraits, handouts — still loads. The
canvas stays fully usable: grid, walls, lighting, targeting and measuring all
work, only the map stays black.

**Measured** on a production server, player client, one GM click on "preload
scene":

| | blocking off | on |
|---|---|---|
| Transferred | **58.86 MB** | **0.00 MB** |
| Files | 71 | 0 |

With six players that is roughly 500 MB per scene change that no longer crosses
the Wi-Fi.

`Alt+T` opens the controls, as does *Settings → Module Settings → Open
controls*. There you find the master switch, a three-way toggle per player
(automatic / always / never), and **Measure**, which asks the server for the
file sizes of the scene — headers only, a few hundred bytes even for a 35 MB map
— and then shows how much of it gets blocked and how much still arrives.

> **A warning about blocking audio.** Measured on 2026-08-28: with a playlist
> running it crashes `monks-sound-enhancements` once a second. The missing null
> check is Foundry's own (`playlist-directory.mjs:782`); this module provokes it
> and, since 14.2609.x, swallows exactly that error while it is the cause.
> The setting is off by default.

**Why this is needed even with the canvas disabled.** Foundry's own "Disable
Game Canvas" only blocks drawing, not preloading:

```
Canvas#draw     → loadSceneTextures     blocked by noCanvas
Scenes#preload  → loadSceneTextures     NOT blocked
```

`Scenes#preload` is driven by a socket broadcast. One click on "preload scene"
therefore makes **every** client pull the full scene — including those without
a canvas. That is the gap this closes.

### Scene displays

For setups with two screens. Both accounts are named in the module settings;
their names can be anything.

| Role | Behaviour |
|---|---|
| **Battlemap display** | follows every scene activation, as usual |
| **Scene display** | can be pinned and then stays put |

Both are automatically exempt from map blocking — a black TV is the one failure
that ruins the evening.

Right-click a scene for *"Show on scene display"* and *"Pin / release scene
display"*; **Shift+click** or **Ctrl+click** does the former faster. A gold
monitor badge in the navigation bar marks the scene currently on the display.
The assignment survives a reload: the display comes back to its scene, not to
the active one.

**Companion scenes:** a battlemap can name the scene the display should show
alongside it. Activating that battlemap moves the display there — even while
pinned, because that is exactly what the pairing is for. Set under *Scene
configuration → Miscellaneous → Scene display*.

**On release** the display either returns to the active scene or moves to a
chosen idle scene, depending on the setting.

### Scene rotation

For maps drawn portrait that should lie across a 16:9 screen. Set under *Scene
configuration → Miscellaneous → Scene rotation*: 0°, 90°, 180° or 270°.

The rotation belongs to the **scene**, not to a client — a map drawn the wrong
way round is wrong for everyone. Mouse input needs no correction; Foundry
inverts the full world matrix, rotation included.

The token HUD lives outside the canvas as HTML and does not turn by itself.
The module turns its frame so the HUDs land on their tokens, and turns the
labels back so the text stays upright. Switchable, in case a HUD ends up beside
its token instead.

### Bring players

Core only offers "pull everyone", which drags the displays along and yanks a
player out of a character sheet. Right-click a scene → *"Bring players here"*,
or the button in the controls. Players already on the scene and the display
accounts are left unticked; next to each name you see where they currently are.

### Installation

Install through the Foundry package browser, or by manifest URL:

```
https://github.com/Niclasp1501/Ninjos-InPerson-Tools/releases/latest/download/module.json
```

**libWrapper** is recommended but not required — without it the module falls
back to its own patch.

---

## 🇩🇪 Deutsch

Vier Bereiche, unabhängig voneinander nutzbar:

| | |
|---|---|
| [Kartensperre](#kartensperre) | Spieler-Clients laden die Battlemap nicht mehr |
| [Szenen-Monitore](#szenen-monitore) | zwei Bildschirme mit getrennten Aufgaben |
| [Szenendrehung](#szenendrehung) | hochkante Karten quer auf 16:9 |
| [Spieler holen](#spieler-holen) | gezielt einzelne Spieler auf eine Szene ziehen |

Getestet gegen **Foundry v14**, Mindestversion v13. Läuft eigenständig; wo
andere Module vorhanden sind, fügt es sich ein, braucht sie aber nicht.

### Kartensperre

Auf zugewiesenen Clients wird die **Hintergrundkarte** der Szene nicht mehr
heruntergeladen. Alles andere — Tokens, Tiles, Effekte, Portraits, Handouts —
läuft normal durch. Der Canvas bleibt voll bedienbar: Raster, Wände, Licht,
Zielen und Messen funktionieren weiter, nur die Karte bleibt schwarz.

**Gemessen** auf einem Produktionsserver, Spieler-Client, ein Klick des
Spielleiters auf „Szene vorladen":

| | Sperre aus | an |
|---|---|---|
| Übertragen | **58,86 MB** | **0,00 MB** |
| Dateien | 71 | 0 |

Bei sechs Spielern sind das rund 500 MB pro Szenenwechsel, die nicht mehr durch
das WLAN gehen.

`Alt+T` öffnet die Steuerung, ebenso *Einstellungen → Moduleinstellungen →
Steuerung öffnen*. Dort finden sich der Hauptschalter, ein Dreifachschalter je
Spieler (automatisch / immer / nie) und **Vermessen** — das fragt beim Server
die Dateigrößen der Szene ab (nur Kopfzeilen, ein paar hundert Byte auch bei
einer 35-MB-Karte) und zeigt darunter, wie viel davon blockiert wird und wie
viel trotzdem ankommt.

> **Warnung zur Audio-Sperre.** Gemessen am 28.08.2026: Bei laufender Playlist
> bringt sie `monks-sound-enhancements` im Sekundentakt zum Absturz. Die
> fehlende Null-Prüfung ist Foundrys eigene (`playlist-directory.mjs:782`);
> dieses Modul löst sie aus und fängt sie seit 14.2609.x ab, solange es die
> Ursache ist. Die Einstellung steht standardmäßig auf aus.

**Warum das auch bei abgeschaltetem Spielfeld nötig ist.** Foundrys eigenes
„Spielfeld deaktivieren" blockt nur das Zeichnen, nicht das Vorladen:

```
Canvas#draw     → loadSceneTextures     von noCanvas geblockt
Scenes#preload  → loadSceneTextures     NICHT geblockt
```

Die Vorladung hängt an einem Rundruf über den Socket. Ein Klick auf „Szene
vorladen" lässt daher **jeden** Client die volle Szene ziehen — auch die ohne
Spielfeld. Genau diese Lücke wird geschlossen.

### Szenen-Monitore

Für Aufbauten mit zwei Bildschirmen. Beide Konten werden in den
Moduleinstellungen benannt, die Namen sind frei wählbar.

| Rolle | Verhalten |
|---|---|
| **Battlemap-Monitor** | folgt jedem Szenenwechsel, wie gewohnt |
| **Szenen-Monitor** | lässt sich fixieren und bleibt dann stehen |

Beide sind automatisch von der Kartensperre ausgenommen — ein schwarzer
Fernseher wäre der eine Fehler, der den Abend ruiniert.

Rechtsklick auf eine Szene bietet *„Auf Szenen-Monitor anzeigen"* und
*„Szenen-Monitor fixieren / lösen"*; **Umschalt+Klick** oder **Strg+Klick** tut
Ersteres schneller. Ein goldenes Monitor-Symbol in der Navigationsleiste zeigt,
welche Szene gerade dort läuft. Die Zuordnung überlebt einen Reload: Der Monitor
kommt auf seine Szene zurück, nicht auf die aktive.

**Begleitszenen:** Eine Battlemap kann die Szene benennen, die der Monitor dazu
zeigen soll. Wird sie aktiviert, wechselt er dorthin — auch wenn er fixiert ist,
denn genau dafür legt man die Verknüpfung an. Einzustellen unter
*Szenen-Konfiguration → Verschiedenes → Szenen-Monitor*.

**Beim Lösen** wechselt der Monitor je nach Einstellung zur aktiven Szene oder
auf ein gewähltes Ruhebild.

### Szenendrehung

Für hochkant gezeichnete Karten, die quer die Breite eines 16:9-Bildschirms
ausnutzen sollen. Einzustellen unter *Szenen-Konfiguration → Verschiedenes →
Drehung der Szene*: 0°, 90°, 180° oder 270°.

Die Drehung gehört zur **Szene**, nicht zum Client — eine falschherum
gezeichnete Karte ist für jeden falschherum. Mausklicks brauchen keine
Korrektur, Foundry rechnet die vollständige Weltmatrix zurück, Drehung
eingeschlossen.

Das Token-Menü liegt als HTML außerhalb des Spielfelds und dreht nicht von
selbst mit. Das Modul dreht seinen Rahmen, damit die Menüs auf ihren Tokens
landen, und dreht die Beschriftung zurück, damit die Schrift gerade steht.
Abschaltbar, falls ein Menü dadurch neben seinem Token landet.

### Spieler holen

Foundrys Bordmittel kennt nur „alle herholen" — das reißt die Monitore mit und
holt Spieler aus einem Charakterbogen, in dem sie gerade lesen. Rechtsklick auf
eine Szene → *„Spieler hierher holen"*, oder der Knopf in der Steuerung. Wer
schon dort ist und die Monitor-Konten sind nicht vorausgewählt; neben jedem
Namen steht, wo er sich gerade befindet.

### Installation

Über den Paket-Browser in Foundry, oder per Manifest-URL:

```
https://github.com/Niclasp1501/Ninjos-InPerson-Tools/releases/latest/download/module.json
```

**libWrapper** ist empfohlen, aber nicht Pflicht — ohne fällt das Modul auf
einen eigenen Patch zurück.

---

## Technical notes / Technische Notizen

`PIXI.Assets.load` appears exactly **once** in the entire Foundry client
(`canvas/loader.mjs:357`), inside `TextureLoader#loadTexture`. Every path —
drawing, preloading, on-demand loading — funnels through it, so the wrapper sits
there and turns back **before** that line: no request is aborted, none is ever
made. Scene geometry is unaffected because `Scene#getDimensions()` derives
everything from `width`, `height`, `grid` and `padding`, never from the image.

The freeze for a pinned display wraps `Scene#_onActivate`, not `view()` — the
latter is also how a display gets moved deliberately. Both directions have to be
suppressed: activating B fires `_onActivate(true)` on B **and**
`_onActivate(false)` on the previously active A, and the second one calls
`unview()`.

Deliberate exceptions: spritesheets (`.json`) are never replaced, SVG files and
`icons/` directories pass through (token status markers), and
`ParticleEffect#lookupTexture` bypasses the wrapper via `PIXI.Texture.from` —
that affects weather art under `ui/particles/`, 68 KB in total, cached and
local.

See `AGENTS.md` for the full set of notes.

## License / Lizenz

MIT — see [LICENSE](LICENSE).
