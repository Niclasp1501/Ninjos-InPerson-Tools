# Ninjo's In-Person Tools

Foundry VTT for groups who play in the same room: the map stays on the TV, tablets show the
character sheet, and a second screen can show something of its own.

*(Scroll down for the German version / Weiter unten auf Deutsch)*

---

## 🇬🇧 English

If you play Foundry around a real table, you know the picture: the map is already up on the TV,
your players really only need their character sheets on their laptops and tablets, and yet every
single device downloads the same huge battlemap on every scene change. The Wi-Fi groans, the
batteries drain, and the tablet ends up showing a tiny corner of the map anyway.

In-Person Tools are built for exactly these games. They make sure every device only gets what it
actually needs, and they let two screens in the room show two different things. Every part works
on its own, so you only switch on what you need.

### The map stays on the TV

Map blocking stops the background map of a scene from being downloaded to your players' devices
at all. Everything else arrives as usual: tokens, tiles, effects, portraits and handouts. The
canvas stays fully usable too, so your players can still move their token, target and measure.
The only thing missing is the map itself, which stays black.

I measured what this saves on a real server, with one player and a single click on "Preload
Scene":

| | Blocking off | Blocking on |
| --- | --- | --- |
| Transferred | **58.86 MB** | **0.00 MB** |
| Files | 71 | 0 |

With six players, that is roughly 500 MB that no longer has to cross your Wi-Fi on every scene
change.

Press `Shift+T` to open the controls. That is where you choose which players the blocking applies
to, and where **Measure** tells you how much a scene would cost each device without it. To find
out, the module only asks the server for the file sizes, which is a few hundred bytes even for a
35 MB map.

One detail Foundry's own "Disable Game Canvas" setting does not cover: it only prevents drawing,
not preloading. When you click "Preload Scene", every device still pulls the full scene, even one
without a canvas. Map blocking closes exactly that gap.

Music and ambient sound can be blocked the same way. That setting is off by default, because it
does not get along with *Monk's Sound Enhancements*.

### Two screens, two jobs

If you have a second screen next to the TV with the map, it can show something else entirely: the
tavern you are sitting in, the villain's portrait, or a mood scene while the fight goes on next
door. Set up two accounts in the module settings. The **battlemap display** follows every scene
you activate, as usual. The **scene display** can be pinned to a scene, and then it stays there
whatever else you do.

Right-click a scene to send it to the scene display, or hold Shift or Ctrl for the quick way. A
gold icon in the navigation bar always shows what is running there, and after a reload the display
returns to its own scene.

**Companion scenes** make it really comfortable. Decide once which scene the scene display should
show with a particular battlemap, and from then on it switches along by itself whenever you
activate that map. For every map without a companion of its own, you can set a default.

Both displays are automatically exempt from map blocking, by the way. A black TV is the last
thing you want on game night.

If your second screen is an OLED, **burn-in protection** helps. When nobody has done anything for
a while, a black cover with a slowly drifting dot settles over the picture. Black pixels on an
OLED are genuinely off and do not wear. As soon as someone moves again, the scene is right back.
Instead of the cover, the display can wander through a folder of other scenes during the quiet
time, and the drifting dot can be an image of your own.

### Portrait maps across a wide screen

Plenty of maps are drawn in portrait, but your TV is wide. Set a rotation of 90, 180 or 270
degrees in the scene configuration and the map fills the screen. The rotation belongs to the
scene, so it applies to everyone. Mouse clicks, token menus, ruler labels and chat bubbles still
land exactly where they belong, and the text stays upright and readable.

### Bring just the people you need

Out of the box, Foundry only knows "pull all players here". That drags the displays along too and
yanks players out of their character sheets while they were just reading up on a spell. Right-
click a scene and choose **Bring players here** to pick who comes along instead. Next to every
name you see where that person is right now. The scene display is left where it is, and Foundry's
own "pull everyone" leaves a pinned scene display alone as well.

### The tablet belongs to the character sheet

The **sheet view** is made for your players' tablets and is still marked as beta. Pick the
accounts, and on those devices Foundry's interface disappears. What remains is the character
sheet across the whole screen and a small menu bar with everything a player needs during the
evening: their characters, the chat, the journal, the trade table, and the buttons of other
modules such as FANG and the DnD Reference Sheet. Text size, volume and fullscreen sit in a
second bar next to it.

Both bars can be moved with a long press and resized. Each tablet remembers its layout separately
for portrait and landscape. In combat, **"You're up next"** appears in good time, followed by
**"Your turn!"**, so nobody misses their move.

Everything about the sheet view is built for fingers. When the on-screen keyboard comes up, the
page slides up so the field you are typing in stays visible. Windows can be dragged with a finger
and never open larger than the screen.

When a player finds a letter or a map, they can **show** that page from their journal to the
others. Everyone else gets a small request first and decides whether to look, so nobody loses
their screen in the middle of reading. The TV gets the page straight away. You can end any showing
for everyone with one click.

Above the sheet there can also be a slim bar with the **date, time and weather**, together with a
little sky dome: the sun by day, and the moon in its real phase by night. Rain, snow, fog and
thunderstorms appear in it as soon as a calendar module such as *Calendaria* reports them.
Without a calendar module the bar shows Foundry's own time.

### Working with other modules

In-Person Tools need no other module, but they work well with a few.

- **Lock View** decides what your displays look at. For rotated maps, this module converts Lock
  View's fitting and view frame correctly, so a map fills the screen exactly instead of being cut
  off at the edges.
- **Sheet Only** gets the date and weather bar too, and if you like, the actor directory can dock
  beside it as a side panel.
- **Ninjo's DnD Shops & Trade** provides the trade table the sheet view opens. Without it, the
  button tells you where to find the feature.

### Installation

The module is in the official Foundry package catalogue. In Foundry, open the **Add-on Modules**
tab, click **Install Module** and search for *Ninjo's In-Person Tools*. Then enable it in your
world's module settings.

You can also use this manifest URL:
`https://github.com/Niclasp1501/Ninjos-InPerson-Tools/releases/latest/download/module.json`

You need Foundry VTT v13 or v14, and the module works with any game system. **libWrapper** is
recommended but not required.

### For the curious: why nothing is downloaded at all

Map blocking does not just hide the map. The request to the server is never made in the first
place. That works because every image Foundry puts on the canvas passes through one single place
in its code, whether it is drawn, preloaded or loaded later. That is where the module steps in and
hands back a tiny black texture for blocked maps. The scene keeps its exact dimensions, because
Foundry works out the size from the scene settings and never from the image. So tokens, walls and
lights all stay precisely where they were.

### Status

The sheet view is still marked as beta while I keep testing it on tablets. It is best to switch it
on first for players sitting next to you, so you notice straight away if something catches.

The quickest way to report a problem is an issue on GitHub.

---

## 🇩🇪 Deutsch

Wer mit Foundry am echten Tisch spielt, kennt das: Die Karte hängt längst am Fernseher, die
Spieler brauchen auf ihren Laptops und Tablets eigentlich nur noch ihr Charakterblatt, und
trotzdem lädt bei jedem Szenenwechsel jedes Gerät dieselbe riesige Battlemap herunter. Das WLAN
ächzt, die Akkus leeren sich, und das Tablet zeigt am Ende doch nur ein winziges Stück Karte.

Die In-Person Tools sind genau für diese Runden gebaut. Sie sorgen dafür, dass jedes Gerät nur
das bekommt, was es wirklich braucht, und dass zwei Bildschirme im Raum zwei verschiedene Dinge
zeigen können. Jeder Bereich funktioniert für sich, du schaltest also nur ein, was du brauchst.

### Die Karte bleibt auf dem Fernseher

Die Kartensperre verhindert, dass die Hintergrundkarte einer Szene auf den Geräten deiner
Spieler überhaupt heruntergeladen wird. Alles andere kommt ganz normal an: Token, Kacheln,
Effekte, Porträts und Handzettel. Auch das Spielfeld selbst bleibt voll bedienbar, deine Spieler
können also weiter ihre Figur bewegen, zielen und messen. Nur dort, wo sonst die Karte liegt,
bleibt es schwarz.

Was das bringt, habe ich auf einem echten Server nachgemessen, mit einem Spieler und einem
einzigen Klick auf „Szene vorladen":

| | Sperre aus | Sperre an |
| --- | --- | --- |
| Übertragen | **58,86 MB** | **0,00 MB** |
| Dateien | 71 | 0 |

Bei sechs Spielern sind das rund 500 MB, die bei jedem Szenenwechsel nicht mehr durch dein WLAN
müssen.

Mit `Shift+T` öffnest du die Steuerung. Dort legst du fest, für welche Spieler die Sperre gilt,
und kannst mit **Vermessen** nachsehen, wie viel eine Szene jedes Gerät ohne Sperre kosten würde.
Dafür fragt das Modul beim Server nur die Dateigrößen ab, das sind selbst bei einer 35 MB großen
Karte nur ein paar hundert Byte.

Ein Detail, das Foundrys eigene Einstellung „Spielfeld deaktivieren" nicht abdeckt: Sie
verhindert nur das Zeichnen, nicht das Vorladen. Klickst du auf „Szene vorladen", zieht sich
deshalb trotzdem jedes Gerät die volle Szene, auch eines ganz ohne Spielfeld. Die Kartensperre
schließt genau diese Lücke.

Auch Musik und Geräusche lassen sich auf diese Weise sperren. Diese Einstellung ist ab Werk
ausgeschaltet, weil sie sich mit dem Modul *Monk's Sound Enhancements* nicht verträgt.

### Zwei Bildschirme, zwei Aufgaben

Hast du neben dem Fernseher für die Karte noch einen zweiten Bildschirm, kann der etwas ganz
anderes zeigen: die Taverne, in der ihr gerade sitzt, das Porträt des Schurken oder eine
Stimmungsszene, während auf dem ersten Bildschirm gekämpft wird. Dafür legst du in den
Moduleinstellungen zwei Konten an. Der **Battlemap-Monitor** folgt wie gewohnt jeder Szene, die du
aktivierst. Den **Szenen-Monitor** kannst du auf einer Szene festhalten, und dann bleibt er dort,
egal was du sonst tust.

Per Rechtsklick auf eine Szene schickst du sie auf den Szenen-Monitor, mit gedrückter Umschalt-
oder Strg-Taste geht es noch schneller. Ein goldenes Symbol in der Navigationsleiste zeigt dir
jederzeit, was gerade dort läuft, und nach einem Neuladen kehrt der Monitor zu seiner Szene
zurück.

Besonders bequem wird es mit **Begleitszenen**. Du legst einmal fest, welche Szene der
Szenen-Monitor zu einer bestimmten Battlemap zeigen soll, und ab dann wechselt er beim
Aktivieren der Karte von selbst mit. Für alle Karten ohne eigene Begleitszene kannst du eine
Standardszene bestimmen.

Beide Monitore sind übrigens automatisch von der Kartensperre ausgenommen. Ein schwarzer
Fernseher wäre schließlich das Letzte, was du an einem Spielabend brauchst.

Läuft dein zweiter Bildschirm mit OLED, hilft der **Schutz gegen Einbrennen**. Wenn eine Weile
niemand etwas tut, legt sich eine schwarze Blende mit einem langsam wandernden Punkt über das
Bild. Schwarze Pixel sind auf einem OLED tatsächlich aus und nutzen sich nicht ab. Sobald sich am
Tisch wieder etwas regt, ist die Szene sofort zurück. Statt der Blende kann der Monitor in der
Ruhezeit auch durch einen Ordner mit anderen Szenen wandern, und statt des Punktes darf ein
eigenes Bild über den Schirm ziehen.

### Hochkante Karten quer auf den Bildschirm

Viele Karten sind hochkant gezeichnet, dein Fernseher ist aber breit. Stell in der
Szenenkonfiguration eine Drehung um 90, 180 oder 270 Grad ein, und die Karte füllt den
Bildschirm. Die Drehung gilt für die Szene und damit für alle am Tisch. Mausklicks, Token-Menüs,
Linealbeschriftungen und Sprechblasen landen trotzdem genau dort, wo sie hingehören, und die
Schrift bleibt lesbar aufrecht.

### Nur die holen, die du brauchst

Foundry kennt von Haus aus nur „alle Spieler hierher holen". Das reißt auch die Monitore mit
und holt Spieler aus ihrem Charakterblatt, obwohl sie gerade nur ihre Zauber nachlesen wollten.
Mit einem Rechtsklick auf eine Szene und **Spieler hierher holen** wählst du stattdessen aus,
wer mitkommen soll. Neben jedem Namen siehst du, wo derjenige gerade ist. Den Szenen-Monitor
lässt das Modul von sich aus stehen, und auch Foundrys eigenes „alle holen" lässt einen
festgehaltenen Szenen-Monitor in Ruhe.

### Das Tablet gehört dem Charakterblatt

Die **Blattansicht** ist für die Tablets deiner Spieler gedacht und noch als Beta gekennzeichnet.
Du wählst die Konten aus, und auf diesen Geräten verschwindet Foundrys Oberfläche. Übrig bleibt
das Charakterblatt über den ganzen Bildschirm und eine kleine Menüleiste mit allem, was ein
Spieler am Abend braucht: seine Charaktere, der Chat, die Notizen, der Tauschtisch und die Knöpfe
anderer Module wie FANG und dem DnD Reference Sheet. Schriftgröße, Lautstärke und Vollbild
liegen in einer zweiten Leiste daneben.

Beide Leisten lassen sich mit einem langen Druck verschieben und in der Größe anpassen. Jedes
Tablet merkt sich die Einstellung getrennt für hochkant und quer. Im Kampf erscheint rechtzeitig
**„Gleich bist du dran"** und dann **„Du bist dran!"**, damit niemand den eigenen Zug verpasst.

Alles an der Blattansicht ist für Finger gebaut. Wenn die Bildschirmtastatur aufgeht, rutscht
die Seite nach oben, damit das Eingabefeld sichtbar bleibt. Fenster lassen sich mit dem Finger
verschieben und öffnen nie größer als der Bildschirm.

Findet ein Spieler einen Brief oder eine Karte, kann er die Seite aus seinen Notizen den anderen
**zeigen**. Die bekommen zuerst eine kleine Anfrage und entscheiden selbst, ob sie hinschauen
wollen, damit niemandem mitten beim Nachlesen der Bildschirm weggenommen wird. Der Fernseher
bekommt die Seite dagegen sofort. Du kannst jedes Zeigen mit einem Klick für alle beenden.

Über dem Blatt kann außerdem eine schmale Leiste mit **Datum, Uhrzeit und Wetter** stehen, dazu
eine kleine Himmelskuppel mit Sonne am Tag und dem Mond in seiner echten Phase bei Nacht. Regen,
Schnee, Nebel und Gewitter tauchen darin auf, sobald ein Kalendermodul wie *Calendaria* sie
meldet. Ohne Kalendermodul zeigt die Leiste Foundrys eigene Zeit.

### Zusammen mit anderen Modulen

Die In-Person Tools brauchen kein anderes Modul, sie arbeiten aber gut mit einigen zusammen.

- **Lock View** bestimmt, was deine Monitore zeigen. Bei gedrehten Karten rechnet das Modul die
  Einpassung und den Ansichtsrahmen von Lock View richtig um, damit eine Karte den Bildschirm
  genau ausfüllt, statt an den Rändern abgeschnitten zu werden.
- **Sheet Only** bekommt ebenfalls die Leiste mit Datum und Wetter, und auf Wunsch lässt sich
  das Akteursverzeichnis als Seitenleiste daneben einblenden.
- **Ninjo's DnD Shops & Trade** stellt den Tauschtisch, den die Blattansicht öffnet. Ohne das
  Modul sagt der Knopf, wo es die Funktion gibt.

### Installation

Das Modul steht im offiziellen Foundry-Paketkatalog. Öffne in Foundry den Reiter
**Add-on-Module**, klicke auf **Modul installieren** und suche nach *Ninjo's In-Person Tools*.
Danach aktivierst du es in den Moduleinstellungen deiner Welt.

Du kannst auch diese Manifest-Adresse verwenden:
`https://github.com/Niclasp1501/Ninjos-InPerson-Tools/releases/latest/download/module.json`

Du brauchst Foundry VTT v13 oder v14, das Modul funktioniert mit jedem Spielsystem.
**libWrapper** wird empfohlen, ist aber nicht nötig.

### Für Neugierige: warum wirklich nichts heruntergeladen wird

Die Kartensperre blendet die Karte nicht bloß aus. Die Anfrage an den Server wird gar nicht erst
gestellt. Das funktioniert, weil in Foundry jedes Bild für das Spielfeld durch eine einzige Stelle
im Code läuft, ganz gleich, ob es gezeichnet, vorgeladen oder nachgeladen wird. Genau dort setzt
das Modul an und gibt für gesperrte Karten eine winzige schwarze Fläche zurück. Die Szene behält
dabei ihre exakten Maße, weil Foundry die Größe aus den Szeneneinstellungen berechnet und nie aus
dem Bild. Deshalb stehen Token, Wände und Lichter weiterhin genau an ihrem Platz.

### Stand

Die Blattansicht trägt noch die Kennzeichnung Beta, weil ich sie auf Tablets weiter teste.
Schalte sie am besten zuerst für Spieler ein, neben denen du sitzt, dann siehst du sofort, wenn
etwas hakt.

Fehler meldest du am schnellsten über ein Issue auf GitHub.

---

## Support / Unterstützen

The modules are free and stay free. If they help your group, you can support my work on [Patreon](https://www.patreon.com/ninjosforge) and get premium add-ons in return. What you get there is on the [premium page of Ninjo's Forge](https://ninjos-forge.web.app/en/premium).

Die Module sind kostenlos und bleiben es. Wenn sie deiner Runde helfen, kannst du meine Arbeit auf [Patreon](https://www.patreon.com/ninjosforge) unterstützen und bekommst Premium-Erweiterungen dazu. Was es dort gibt, steht auf der [Premium-Seite der Forge](https://ninjos-forge.web.app/premium).

---

## Technical notes

`PIXI.Assets.load` appears exactly once in the entire Foundry client (`canvas/loader.mjs`),
inside `TextureLoader#loadTexture`. Drawing, preloading and on-demand loading all funnel through
it, so the wrapper sits there and returns a placeholder before that line: no request is aborted,
none is ever made. Scene geometry is unaffected because `Scene#getDimensions()` derives everything
from `width`, `height`, `grid` and `padding`, never from the image.

Pinning a display wraps `Scene#_onActivate` rather than `view()`, because `view()` is also how a
display is moved on purpose. Both directions are suppressed: activating scene B fires
`_onActivate(true)` on B and `_onActivate(false)` on the previously active scene A, and the second
call runs `unview()`.

Deliberate exceptions: spritesheets (`.json`) are never replaced, SVG files and `icons/` pass
through for token status markers, and `ParticleEffect#lookupTexture` bypasses the wrapper through
`PIXI.Texture.from`. That only affects the weather art under `ui/particles/`, 68 KB in total,
cached and served locally.

Other modules can add buttons to the sheet view bar through
`game.modules.get("ninjos-inperson-tools").api.sheetView.registerButton()`. The full notes are in
`AGENTS.md`.

## License / Lizenz

In-Person Tools is free to install and use, including for paid games, but it is **not open source**. For every version after 14.2611.74, all rights are reserved except those granted in [LICENSE](LICENSE): you may use it and modify it for your own table, but not redistribute, rebundle or sell it. Versions up to and including 14.2611.74 were released under the MIT License and stay under it. The Ninjo logo (`assets/ninjo.png`) is not covered by any licence.

Die In-Person Tools sind kostenlos und dürfen auch für bezahlte Runden benutzt werden, sind aber **nicht Open Source**. Für jede Version nach 14.2611.74 sind alle Rechte vorbehalten, außer denen in der [LICENSE](LICENSE): Nutzen und für den eigenen Tisch anpassen ja, weitergeben, in andere Pakete packen oder verkaufen nein. Die Versionen bis einschließlich 14.2611.74 sind unter der MIT-Lizenz erschienen und bleiben es. Das Ninjo-Logo (`assets/ninjo.png`) fällt unter keine Lizenz.
