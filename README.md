# Ninjo's In-Person Tools

**Current Version / Aktuelle Version:** `14.2611.1`

Tools for running Foundry VTT at a physical table: the map is on a TV, the
players only need their character sheet, dice and token — and yet every laptop
pulls the same megabytes over Wi-Fi on each scene change.

*(Scroll down for German version / Scrolle weiter runter für die deutsche Version)*

---

## 🇬🇧 English

Five areas, each usable on its own:

| | |
|---|---|
| [Map blocking](#map-blocking) | player clients stop downloading the battlemap |
| [Scene displays](#scene-displays) | two screens with separate jobs |
| [Scene rotation](#scene-rotation) | portrait maps laid across a 16:9 screen |
| [Bring players](#bring-players) | pull individual players to a scene |
| [Alongside Lock View](#alongside-lock-view) | rotation-aware fitting and viewbox |

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
display"*; **Shift+click** or **Ctrl+click** does the former faster. Pinning
from a scene row pins the display **to that scene** — it is sent there and held.
Releasing needs no scene. The panel and `Alt+T` toggle instead mean "stay where
you are" and take whatever the display is looking at.

A gold monitor badge in the navigation bar marks the scene currently on the
display, and it follows the display wherever it goes — an activation, a
companion jump, a manual move, anything. The assignment survives a reload: the
display comes back to its scene, not to the active one.

**Companion scenes:** a battlemap can name the scene the display should show
alongside it. Activating that battlemap moves the display there — even while
pinned, because a pairing made by hand is a more precise instruction than a
general "stay put". Set under *Scene configuration → Miscellaneous → Scene
display*.

A **default companion scene** covers the battlemaps that name none of their own.
Without it an unpinned display simply mirrors the battlemap — the one thing a
second screen need not do. Set it on the displays page, or by right-clicking a
scene. The order of precedence, most specific first:

| | |
|---|---|
| 1 | a companion named on the battlemap itself |
| 2 | pinned — hold still |
| 3 | the default companion |
| 4 | follow the activation, as Foundry would |

**On release** the display either returns to the active scene or moves to a
chosen idle scene, depending on the setting.

**Burn-in protection**, for displays on an OLED. Off until you say otherwise;
everything below appears only once you do. Then pick one of two ways — they are
alternatives, not stages:

| | |
|---|---|
| **Black cover** (default) | a black sheet lays itself over the scene that is showing, with one mark drifting across, and the scene stays where it is underneath |
| **Scene swap** | the display moves through a folder of other scenes |

The cover is much the stronger of the two: on an OLED a black pixel is genuinely
*off* and does not age at all, while another bright scene wears the panel exactly
as the first one did. Movement only saves you from a burnt-in pattern, never from
the wear itself. The scene swap is for tables that would rather look at something.

**The cover comes and goes.** It is not a way of switching the television off:
the aim is only that no picture stands still for hours, so after its time is up
it lifts, the scene is there to be looked at, and once the room has been quiet
for the waiting time again it returns. Three minutes by default.

The drifting mark can be an image of your own instead of the plain dot, and
**Show the cover** puts it on your own screen for a few seconds so you can judge
it — the mark is sized against the screen, so it looks the same there as it will
on the television.

Quiet means nobody except the displays themselves is doing anything. Cursors,
scene changes, rulers, rolls and chat all reset the clock, and the first sign of
life brings the display straight back where it belongs.

All of this lives under *Module Settings → Set up displays*, together with the
accounts and the companion scenes.

### Scene rotation

For maps drawn portrait that should lie across a 16:9 screen. Set under *Scene
configuration → Miscellaneous → Scene rotation*: 0°, 90°, 180° or 270°.

The rotation belongs to the **scene**, not to a client — a map drawn the wrong
way round is wrong for everyone. Mouse input needs no correction; Foundry
inverts the full world matrix, rotation included.

The token HUD lives outside the canvas as HTML and does not turn by itself.
The module turns its frame so the HUDs land on their tokens, and turns the
labels back so the text stays upright.

The same frame holds the **ruler labels** and chat bubbles. Those are not pinned
boxes but sit in full-size overlay containers, so they are turned one by one
rather than by the container — turning the container throws its contents right
across the map.

Where **Lock View** is installed, its fitting and its viewbox are turned along
with the scene — see [Alongside Lock View](#alongside-lock-view). The scene
configuration says so on the spot whenever a rotation is set.

### Bring players

Core only offers "pull everyone", which drags the displays along and yanks a
player out of a character sheet. Right-click a scene → *"Bring players here"*,
or the button in the controls. From the context menu it targets the scene you
clicked, so you can send people somewhere without going there yourself.

Everyone connected is ticked to start with; only the **scene display** is left
out, because staying put is its job. Tick it anyway and it comes along — that
counts as a deliberate choice and overrides the pin. Next to each name you see
where that person currently is.

A pinned scene display is also kept out of core's own "pull all players here".
It stays where it was and a notice says so.

### Alongside Lock View

Lock View steers *what* the displays look at; this module decides what they
download and which way round they stand. The two are made to run together, and
the module corrects the one place where its own rotation would otherwise leave
Lock View working from wrong numbers.

At 90° and 270° the screen's width maps onto the world's **height**. Two Lock
View values depend on that:

| | Without the correction |
|---|---|
| **Fitting** | `horizontal` measures the scene's width against the window's width. Rotated, the axis filling the screen horizontally is the scene's *height*. |
| **Viewbox** | A display reports its visible extent with the sides exchanged, so the GM sees a frame that cannot be right. |

Measured on a 3360 × 4340 map in a 2290 px window: the fitting came out at scale
0.6815 instead of 0.5276 — the map ran 29 % past the screen and lost its bow and
stern. Corrected, it fills the width exactly. `autoInside` and `autoOutside` are
corrected the same way.

**`physical` scaling needs no correction** and is passed through untouched: it
returns nothing but a scale, and rotation never changes the scale. The same goes
for `off`.

Lock View itself is not modified — the correction sits on our side, on the client
that produces the value. Everything is behind a presence check, so without Lock
View installed none of it runs and the module stays standalone. If a future Lock
View release renames what we hook into, the correction quietly drops out and the
display goes back to its old behaviour; nothing breaks.

> **After updating this module, reload the display clients too.** The viewbox
> correction runs on the client that *sends* the value, not on the one that draws
> it. Reloading only the GM window leaves the displays on the old code, and the
> frame stays crooked with no hint as to why.

### Installation

Install through the Foundry package browser, or by manifest URL:

```
https://github.com/Niclasp1501/Ninjos-InPerson-Tools/releases/latest/download/module.json
```

**libWrapper** is recommended but not required — without it the module falls
back to its own patch.

---

## 🇩🇪 Deutsch

Fünf Bereiche, unabhängig voneinander nutzbar:

| | |
|---|---|
| [Kartensperre](#kartensperre) | Spieler-Clients laden die Battlemap nicht mehr |
| [Szenen-Monitore](#szenen-monitore) | zwei Bildschirme mit getrennten Aufgaben |
| [Szenendrehung](#szenendrehung) | hochkante Karten quer auf 16:9 |
| [Spieler holen](#spieler-holen) | gezielt einzelne Spieler auf eine Szene ziehen |
| [Zusammen mit Lock View](#zusammen-mit-lock-view) | Einpassung und Ansichtsrahmen folgen der Drehung |

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
Ersteres schneller. Fixieren aus einer Szenenzeile heraus fixiert den Monitor
**auf genau diese Szene** — er wird dorthin geschickt und dort gehalten. Lösen
braucht keine Szene. Der Schalter in der Steuerung und `Alt+T` bedeuten dagegen
„bleib, wo du bist" und übernehmen, worauf der Monitor gerade steht.

Ein goldenes Monitor-Symbol in der Navigationsleiste zeigt, welche Szene gerade
dort läuft — und es folgt dem Monitor, wohin er auch wandert: Aktivierung,
Begleitszene, Verschieben von Hand, gleich wodurch. Die Zuordnung überlebt einen
Reload: Der Monitor kommt auf seine Szene zurück, nicht auf die aktive.

**Begleitszenen:** Eine Battlemap kann die Szene benennen, die der Monitor dazu
zeigen soll. Wird sie aktiviert, wechselt er dorthin — auch wenn er fixiert ist,
denn eine von Hand gelegte Verknüpfung ist die genauere Anweisung als ein
allgemeines „bleib stehen". Einzustellen unter *Szenen-Konfiguration →
Verschiedenes → Szenen-Monitor*.

Eine **Standard-Begleitszene** fängt die Battlemaps ab, die selbst keine
benennen. Ohne sie zeigt ein nicht fixierter Monitor dieselbe Karte wie der
Battlemap-Monitor — also genau das, wofür man den zweiten Bildschirm nicht
braucht. Einzustellen auf der Monitor-Seite oder per Rechtsklick auf eine Szene. Die
Rangfolge, vom Genauesten zum Allgemeinsten:

| | |
|---|---|
| 1 | eine an der Battlemap benannte Begleitszene |
| 2 | fixiert — stehen bleiben |
| 3 | die Standard-Begleitszene |
| 4 | der Aktivierung folgen, wie Foundry es täte |

**Schutz gegen Einbrennen**, für Monitore an einem OLED. Standardmäßig aus;
alles Weitere erscheint erst, wenn du zusagst. Dann eine von zwei Arten — es sind
Alternativen, keine Stufen:

| | |
|---|---|
| **Schwarze Blende** (Vorgabe) | legt sich über die laufende Szene, mit einer wandernden Marke darauf; die Szene bleibt darunter stehen |
| **Szenenwechsel** | der Monitor wandert durch einen Ordner anderer Szenen |

Die Blende ist die deutlich wirksamere: Ein schwarzes Pixel ist bei OLED
tatsächlich *aus* und altert überhaupt nicht, während eine andere helle Szene das
Panel genauso weiter verschleißt wie die erste. Bewegung bewahrt nur vor einem
eingebrannten *Muster*, nie vor dem Verschleiß selbst. Der Szenenwechsel ist für
Tische, die lieber etwas ansehen.

**Die Blende kommt und geht.** Es geht nicht darum, den Fernseher abzuschalten,
sondern nur darum, dass kein Bild stundenlang stillsteht — nach ihrer Zeit hebt
sie sich, die Szene ist zu sehen, und sobald wieder die Wartezeit lang Ruhe
herrschte, legt sie sich erneut darüber. Vorgabe drei Minuten.

Statt des Punktes lässt sich ein eigenes Bild darüber wandern lassen, und
**„Blende ansehen"** zeigt sie für ein paar Sekunden auf dem eigenen Bildschirm.
Die Marke wird am Bildschirmanteil bemessen, sieht dort also aus wie später am
Fernseher.

Als Ruhe zählt, dass niemand außer den Monitoren selbst etwas tut. Mauszeiger,
Szenenwechsel, Lineal, Würfe und Chat setzen die Uhr zurück, und beim ersten
Lebenszeichen ist der Monitor sofort wieder da, wo er hingehört.

Das alles steht unter *Moduleinstellungen → Monitore einrichten*.

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

Im selben Rahmen liegen die **Linealbeschriftungen** und die Sprechblasen. Die
sind keine angehefteten Kästchen, sondern sitzen in bildschirmfüllenden
Containern — sie werden deshalb einzeln gedreht statt über den Container. Dreht
man den Container, fliegt sein Inhalt quer über die Karte.

Ist **Lock View** installiert, werden dessen Einpassung und Ansichtsrahmen
mitgedreht — siehe [Zusammen mit Lock View](#zusammen-mit-lock-view). Die
Szenen-Konfiguration weist bei gesetzter Drehung an Ort und Stelle darauf hin.

### Spieler holen

Foundrys Bordmittel kennt nur „alle herholen" — das reißt die Monitore mit und
holt Spieler aus einem Charakterbogen, in dem sie gerade lesen. Rechtsklick auf
eine Szene → *„Spieler hierher holen"*, oder der Knopf in der Steuerung. Aus dem
Kontextmenü zielt es auf die angeklickte Szene, man kann Leute also irgendwohin
holen, ohne selbst dorthin zu wechseln.

Alle Angemeldeten sind vorausgewählt; ausgenommen ist nur der
**Szenen-Monitor**, weil Stehenbleiben seine Aufgabe ist. Hakt man ihn trotzdem
an, kommt er mit — das gilt als bewusste Entscheidung und setzt sich über die
Fixierung hinweg. Neben jedem Namen steht, wo derjenige sich gerade befindet.

Ein fixierter Szenen-Monitor wird außerdem aus Foundrys eigenem „alle Spieler
hierher ziehen" herausgehalten. Er bleibt stehen, und ein Hinweis sagt das.

### Zusammen mit Lock View

Lock View steuert, *worauf* die Monitore schauen; dieses Modul entscheidet, was
sie herunterladen und wie herum sie stehen. Beide sind auf ein Nebeneinander
ausgelegt, und das Modul korrigiert die eine Stelle, an der seine eigene Drehung
Lock View sonst mit falschen Zahlen rechnen ließe.

Bei 90° und 270° bildet die Bildschirmbreite auf die Welt**höhe** ab. Zwei Werte
von Lock View hängen daran:

| | Ohne die Korrektur |
|---|---|
| **Einpassung** | `horizontal` misst die Szenenbreite gegen die Fensterbreite. Gedreht füllt aber die Szenen*höhe* den Bildschirm der Breite nach. |
| **Ansichtsrahmen** | Ein Monitor meldet seinen sichtbaren Ausschnitt mit vertauschten Seiten — der Spielleiter sieht einen Rahmen, der nicht stimmen kann. |

Gemessen an einer 3360 × 4340-Karte in einem 2290 px breiten Fenster: Die
Einpassung ergab Maßstab 0,6815 statt 0,5276 — die Karte lief 29 % über den Rand
hinaus, Bug und Heck fielen weg. Korrigiert füllt sie die Breite exakt.
`autoInside` und `autoOutside` werden genauso mitgezogen.

**`physical` braucht keine Korrektur** und wird unverändert durchgereicht: Es
liefert nichts als einen Maßstab, und die Drehung fasst den Maßstab nie an. Für
`off` gilt dasselbe.

Lock View selbst wird nicht verändert — die Korrektur sitzt auf unserer Seite,
auf dem Client, der den Wert erzeugt. Alles steckt hinter einer Merkmalsprüfung:
Ohne Lock View läuft davon nichts, das Modul bleibt eigenständig. Sollte eine
künftige Lock-View-Fassung umbenennen, woran wir hängen, fällt die Korrektur
still weg und der Monitor verhält sich wie zuvor; kaputt geht dabei nichts.

> **Nach einer Aktualisierung dieses Moduls auch die Monitore neu laden.** Die
> Rahmen-Korrektur läuft auf dem Client, der den Wert *sendet*, nicht auf dem,
> der ihn zeichnet. Lädt man nur das Spielleiter-Fenster neu, bleiben die
> Monitore auf dem alten Stand — der Rahmen steht weiter schief, ohne dass
> ersichtlich wäre, warum.

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
