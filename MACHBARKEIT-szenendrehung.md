# Machbarkeitsanalyse — Szenendrehung für den Tisch-Monitor

Stand 29.08.2026. Geprüft gegen Foundry v14.367 auf `foundry-1`, gegen die
installierte Lock View 2.1.0 und gegen die Git-Historie von
`github.com/CDeenen/LockView`.

**Kurzfassung: machbar, und die eigentliche Drehung ist eine Zeile.** Der
Aufwand steckt nicht im Drehen, sondern in drei Dingen, die *nicht*
mitdrehen. Alle drei sind identifiziert und lösbar.

---

## 1. Was Lock View gemacht hat

Die Rotation war in Version 1.5.x enthalten und ist in 2.0.0 entfernt worden.
In der installierten 2.1.0 erinnert nur noch ein `unsetFlag(moduleName,
'rotation')` im Migrationscode daran.

Der Kern in `lockview.js` (v1.5.10) war genau das:

```js
if (rotation != null) canvas.stage.rotation = rotation * Math.PI / 180;
```

Der PIXI-Container, auf dem die gesamte Szene liegt, wird gedreht. Alles, was
Kind dieses Containers ist — Karte, Raster, Tokens, Wände, Beleuchtung,
Vorlagen — dreht sich mit, ohne dass man es einzeln anfassen muss.

Dazu kam eine angepasste Skalierung. Der einzige Kniff dort:

```js
if (rotation == 90 || rotation == 270) {
  // window.innerWidth/Height ändern sich durch die Canvas-Drehung nicht
  let swap = windowWidth; windowWidth = windowHeight; windowHeight = swap;
}
```

## 2. Was nicht mitdreht — die eigentliche Arbeit

### 2.1 Das HUD

Der aussagekräftigste Fund der ganzen Recherche ist die Commit-Nachricht von
`494234d` (Oktober 2023):

> The HUD is a separate DOM element (a traditional `<div>`) that isn't connected
> to the `<canvas>` that renders the scene. Before, only the canvas was rotated,
> leaving all hud elements behind, usually off screen.

Token-HUD, Tile-HUD, Zeichnungs-HUD und Sprechblasen liegen **nicht** im
PIXI-Baum, sondern als HTML darüber. In v14 ist das
`HeadsUpDisplayContainer extends ApplicationV2` mit `id: "hud"`
(`applications/hud/container.mjs:10`).

Die dortige Lösung war schlicht und funktioniert:

```js
canvas.hud._element[0].style.rotate = `${rotationRadians}rad`;
```

**Für v14 anzupassen:** `_element[0]` ist jQuery-Erbe. ApplicationV2 hat
`app.element` als reines `HTMLElement`. Also `canvas.hud.element.style.rotate`,
und der Zeitpunkt muss stimmen — beim ersten Zeichnen existiert das HUD noch
nicht, deshalb wartete Lock View mit `waitForHudToRender()`.

### 2.2 Die Skalierung

`window.innerWidth/Height` beschreiben das Browserfenster und wissen nichts von
einer gedrehten Zeichenfläche. Bei 90° und 270° müssen die beiden getauscht
werden, sonst passt die Szene nicht mehr ins Bild. Übernehmbar wie oben.

### 2.3 Der sichtbare Ausschnitt

`Canvas#pan()` (`board.mjs:1756`) setzt `stage.pivot` und `stage.scale` — beide
sind von `stage.rotation` unabhängig, PIXI wendet die Transformationen
nacheinander an. Das Verschieben funktioniert also weiter.

`_constrainView` begrenzt den Ausschnitt aber anhand von
`screenDimensions` (`board.mjs:2455`), das direkt aus
`app.renderer.screen` kommt — wieder ungedreht. Bei 90° kann das dazu führen,
dass die Grenzen an der falschen Achse greifen. **Das ist der Punkt, den ich am
wenigsten sicher einschätzen kann**, und mein erster Verdacht für das, was Lock
View mit „Stabilitätsproblemen" meinte.

## 3. Was von selbst funktioniert

Ein erfreulicher Fund: Die Maus muss **nicht** von Hand umgerechnet werden.

```js
// board.mjs:2077
event.getLocalPosition(this.stage, this.mousePosition);
```

`getLocalPosition` rechnet über die inverse Weltmatrix des Containers — und die
enthält die Rotation. Klicks, Ziehen und Zielen landen also an der richtigen
Stelle, ohne Zutun. Das entschärft die naheliegendste Sorge bei einer
gedrehten Ansicht.

## 4. Vorschlag zur Umsetzung

**Standalone im eigenen Modul, nicht an Lock View angedockt.** Gründe:

- Der Code ist dort entfernt, ein Hook hätte nichts zum Einhängen.
- Lock View 2.1.0 kann durch Updates weiter wegwandern.
- Die Drehung braucht Lock View nicht — es sind drei überschaubare Eingriffe.
- Das Modul soll standalone laufen; eine Abhängigkeit widerspräche dem.

### Ansatzpunkte

| Was | Wo |
|---|---|
| Drehung setzen | `canvas.stage.rotation` nach `canvasReady` |
| HUD nachziehen | `canvas.hud.element.style.rotate`, nach `renderHeadsUpDisplayContainer` |
| Einpassen | eigener `scaleToFit` auf `canvasPan`, mit Maßtausch bei 90/270 |
| Speicherung | Flag an der Szene, Feld im Szenen-Einstellungsfenster |

### Die Drehung gehört an die Szene, nicht an den Client

Der Anwendungsfall ist eine **hochkant gezeichnete Karte, die quer gedreht die
16:9-Fläche ausnutzt**. Das ist eine Eigenschaft der Karte: Sie ist falschherum
gezeichnet, und zwar für jeden, der sie ansieht. Ein Drehwinkel je Client würde
bedeuten, dass dieselbe Karte auf dem Tisch richtig und im GM-Fenster gekippt
steht — man müsste ihn an jedem Gerät einzeln nachziehen.

Lock View hat es genauso gehalten:

```js
rotation = canvas.scene.getFlag('LockView', 'rotation');
```

Der zugehörige Commit heißt „Add initial rotation to scene configuration"
(`2a189b3`).

Das fügt sich in das, was schon steht: Die Begleitszene ist bereits ein Flag an
der Szene mit einem Feld im Reiter *Verschiedenes*. Der Drehwinkel kommt in
dasselbe Feldbündel — zwei Szeneneigenschaften an einer Stelle.

### Umfang

Rund 100 Zeilen in einer neuen `rotation.js`, plus ein Auswahlfeld im
Szenen-Einstellungsfenster (0/90/180/270). 360° ist identisch mit 0° und
entfällt.

Weil die Drehung weltweit gilt, entfällt jede Client-Unterscheidung — kein
Socket, keine Rollenprüfung, keine Synchronisierung. Das Szenen-Flag erreicht
ohnehin jeden Client, und `canvasReady` feuert dort von selbst.

## 5. Risiken, ehrlich sortiert

| Risiko | Einschätzung |
|---|---|
| `_constrainView` an der falschen Achse | **Offen.** Der wahrscheinlichste Grund für den Ausbau bei Lock View. Notfalls Begrenzung für gedrehte Clients aussetzen. |
| Weitere DOM-Elemente über dem Canvas | Sprechblasen hängen am selben Container, drehen also mit. Fremdmodule mit eigenen Overlays: ungeprüft. |
| Vorlagen und Lineal | Liegen im PIXI-Baum, sollten mitdrehen. Ungemessen. |
| Sichtbarkeit / Nebel | Rechnen in Szenenkoordinaten, nicht Bildschirmkoordinaten. Sollte unberührt bleiben. |
| Leistung | Keine. Eine Rotation ist Teil der Transformationsmatrix, die PIXI ohnehin berechnet. |

## 6. Empfehlung

In zwei Schritten, wie beim Tischmodus:

1. **Drehung plus HUD** — ein Auswahlfeld an der Szene, `stage.rotation` setzen,
   HUD nachziehen. Reicht, um zu sehen, ob es am Tisch taugt.
2. **Einpassen und Begrenzung** — erst wenn Schritt 1 steht und man weiß, wo es
   tatsächlich hakt. Das automatische Einpassen ist bei hochkanten Karten der
   halbe Zweck der Übung, aber es hängt an `_constrainView`, dem unsichersten
   Punkt der Analyse.

Diese Reihenfolge hat beim Tischmodus fünf Fehler gefunden, die beim Lesen
unsichtbar waren. Gerade hier lohnt sie: Dass Lock View die Funktion wegen
Instabilität aufgegeben hat, heißt nicht, dass sie instabil sein *muss* — aber
es heißt, dass Probleme existieren, die ich im Quellcode nicht sehe.

**Nichts davon ist gemessen.** Die Analyse beruht auf Codelektüre und der
Git-Historie eines fremden Moduls.
