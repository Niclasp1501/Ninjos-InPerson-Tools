# Lock View: ablösen oder ergänzen?

Stand 29.08.2026, zweite Fassung. Geprüft gegen die installierte Lock View 2.1.0
und die tatsächliche Konfiguration der Welt `faerun3`.

> **Diese Fassung ersetzt die erste vom selben Tag.** Die enthielt drei Fehler:
> Sie bezifferte Lock View auf 1967 Zeilen (es sind 3494), nannte es einen
> „Restposten" (es trägt den gesamten Monitor-Betrieb) und schätzte den Nachbau
> auf 250–300 Zeilen (realistisch sind 900–1200). Vor allem fehlte das Steuern
> fremder Ansichten vollständig.

**Kurzfassung: nicht ablösen.** Lock View macht in dieser Welt genau das, was
unser Modul auch macht — aber es macht es fertig, und der einzige echte Konflikt
betrifft **eine einzige Szene von 125**. Der Weg ist ein kleiner
Verträglichkeits-Anbau von rund 80 Zeilen, nicht ein Nachbau.

---

## 1. Was Lock View in dieser Welt tatsächlich tut

Die Konfiguration liest sich eindeutig:

| Konto | Lock-View-Rechte |
|---|---|
| Dungeonmaster | `control` — steuert |
| SL-Assistent | `control` — steuert |
| MonitorBM | `enable`, `viewbox` — wird gesteuert, meldet zurück |
| MonitorSC | `enable`, `viewbox` — wird gesteuert, meldet zurück |
| **alle Spieler** | **nichts** |

**Kein einziger Spieler hat ein Lock-View-Recht.** Das Modul ist hier kein
Werkzeug gegen Spieler, sondern die Fernsteuerung der beiden Tischmonitore. Das
ist dieselbe Aufgabe wie unsere — nicht ein Nachbargebiet.

Und es steckt tief in den Daten: **alle 125 Szenen** tragen Lock-View-Flags.

| Einpassung je Szene | Szenen |
|---|---|
| `horizontal` | 80 |
| `autoOutside` | 18 |
| `autoInside` | 14 |
| `off` | 9 |
| **`physical`** | **4** |

Voreinstellung für jede neue Szene: Schwenk **und** Zoom gesperrt, horizontal
eingepasst.

## 2. Das Steuern fremder Ansichten — in der ersten Fassung übersehen

Das ist kein Nebenfeature, sondern ein ausgebautes System aus zwei Dialogen und
einer Socket-Schicht.

**Clone View** (`src/apps/cloneView.js`, 173 Zeilen) nimmt die Ansicht des
Spielleiters und schiebt sie auf ausgewählte Konten — mit Auswahlkästchen je
Nutzer, so wie unser „Spieler holen", nur für den Bildausschnitt statt für die
Szene. Eingestellt steht sie bei dir auf `autoInner`.

**Set View** (`src/apps/setViewDialog.js`, 146 Zeilen) kann mehr als „dahin
schauen". Aus `src/socket.js`:

| Schwenk | Wirkung |
|---|---|
| `initialView` | auf die konfigurierte Startansicht der Szene |
| `moveGridSpaces` | um N Rasterfelder versetzen |
| `moveByCoords` | um einen Betrag versetzen |
| `moveToCoords` | auf feste Koordinaten |
| `cloneView` | die Ansicht des Spielleiters übernehmen |

| Zoom | Wirkung |
|---|---|
| `visibleH` / `visibleV` | so, dass der andere **dasselbe sieht** — auf seine Fenstergröße umgerechnet |
| `autoInner` / `autoOuter` | einpassen, innen oder außen |
| `physical` | auf den physischen Maßstab |

`visibleH` ist der Punkt, den man beim Lesen leicht übersieht: Es überträgt nicht
den Zoomfaktor, sondern den *sichtbaren Ausschnitt*, und rechnet ihn auf das
Fenster des Empfängers um. Ein 15-Zoll-Laptop und ein 55-Zoll-Fernseher zeigen
danach denselben Kartenausschnitt. Das ist genau die Rechnung, die ein Tisch mit
gemischten Geräten braucht.

Dazu die **Viewbox**: Jeder Monitor meldet laufend seinen Ausschnitt, beide
Spielleiter sehen ihn als farbigen Rahmen. Bei dir eingeschaltet, für beide
Monitore.

## 3. Der physische Maßstab

```js
// sceneHandler.js:152
this.physicalGridSize = gridSize * screen.width / screenSize;
```

Bei dir: Bildschirmbreite 930, Rastergröße 25. Vier Szenen nutzen ihn direkt als
Einpassung, über den Set-View-Dialog ist er überall erreichbar. Ein 25-mm-Sockel
deckt damit genau ein Feld.

**Gute Nachricht: unsere Drehung stört ihn nicht.** `getAutoscale('physical')`
gibt ausschließlich `{scale: …}` zurück, keine Position — und die Drehung ändert
nur `stage.rotation`, nie den Maßstab. Die beiden Funktionen liegen sauber
nebeneinander.

## 4. Wo es wirklich klemmt

Genau zwei Stellen, und beide nur bei gedrehten Szenen. Gedreht ist derzeit:

```
53. Pirate Ship = 90°   (LockView-autoscale: horizontal)
```

**Eine Szene von 125.**

### 4a. Die Viewbox zeigt ein falsch herum stehendes Rechteck

Der Monitor meldet seinen Ausschnitt als

```js
width:  window.innerWidth  / scale
height: window.innerHeight / scale
```

Bei 90° bildet die Bildschirm**breite** aber auf die Welt**höhe** ab. Breite und
Höhe sind vertauscht.

**Der Fix ist klein und exakt:** Bei 90° und 270° bleibt ein Rechteck auf dem
Bildschirm in der Welt ein achsenparalleles Rechteck — nur mit getauschten Maßen.
Tauscht der meldende Client die beiden Werte vor dem Senden, stimmt der Rahmen
**genau**, nicht bloß ungefähr. Bei 0° und 180° ist ohnehin nichts zu tun, und
Zwischenwinkel bieten wir nicht an.

Das ist kein Eingriff in Lock View: Es korrigiert auf **unserem** Client Daten,
die durch **unsere** Drehung falsch geworden sind.

### 4b. `horizontal` passt bei 90° die falsche Kante ein

```js
// sceneHandler.js:120
if (mode === 'horizontal') pos.scale = windowWidth / scene.width;
```

Bei 90° gehört die Szenenbreite an die Fensterhöhe. Dasselbe gilt für
`autoInside` und `autoOutside`, die beide Fenstermaße verrechnen. `physical` und
`off` sind nicht betroffen — zusammen 13 der 125 Szenen ohnehin außen vor.

**Fix:** Für gedrehte Szenen die Fenstermaße vertauscht in die Rechnung geben.

## 5. Was ein Nachbau wirklich kosten würde

Lock View hat **3494 Zeilen**. Nicht gebraucht wird die Migration von
Altfassungen und die Kompatibilitätsschicht — geschätzt ein Drittel. Der Rest ist
im Einsatz:

| Teil | Zeilen |
|---|---|
| `libWrapper/overrides.js` | 478 |
| `viewbox.js` | 404 |
| `sceneHandler.js` | 395 |
| `settings.js` | 331 |
| `initialViewConfig.js` | 253 |
| `socket.js` | 208 |
| `cloneView.js` | 173 |
| `sceneConfigurator.js` | 172 |
| `controlButtons.js` | 153 |
| `setViewDialog.js` | 146 |
| `userConfig.js`, `locks.js`, … | ~190 |

Realistisch **900–1200 Zeilen** für das, was benutzt wird. Zum Vergleich: unser
gesamtes Modul liegt heute bei rund 1400.

Dazu käme, was keine Zeilenzahl abbildet: **125 Szenen tragen Lock-View-Flags.**
Entweder liest ein Nachbau sie ein, oder du stellst 125 Szenen von Hand neu ein.

Und der eine Punkt, an dem Lock View selbst gescheitert ist — die Drehung hängt
an `_constrainView` und den ungedrehten Fenstermaßen — wäre damit nicht gelöst,
sondern nur umgezogen.

## 6. Empfehlung

**Nicht ablösen. Verträglich machen.**

Das Verhältnis entscheidet: 900–1200 Zeilen Nachbau plus eine Datenmigration über
125 Szenen, um eine Störung zu beseitigen, die **eine** Szene betrifft.

Drei Schritte, alle klein, alle über Merkmalsprüfung abgesichert — ohne Lock View
passiert schlicht nichts, das Modul bleibt eigenständig:

1. **Viewbox korrigieren** (~15 Zeilen). Bei 90°/270° Breite und Höhe vor dem
   Senden tauschen. Danach steht der Rahmen exakt richtig statt gar nicht.

2. **Einpassung korrigieren** (~25 Zeilen). Bei gedrehten Szenen die Fenstermaße
   getauscht in `getAutoscale` geben. Betrifft `horizontal`, `autoInside`,
   `autoOutside`; `physical` und `off` bleiben unberührt.

3. **Im Drehungs-Feld vermerken** (~10 Zeilen), dass Lock View erkannt wurde und
   die Einpassung mitgedreht wird. Sonst sucht man den Zusammenhang später
   vergeblich.

Zusammen rund 80 Zeilen statt 1000.

**Was offen bleibt:** Punkt 1 hängt an `lockView.socket.emitViewbox` — einer
fremden Methode. Bricht ein Lock-View-Update sie, fällt die Korrektur weg und die
Viewbox steht wieder schief; kaputt geht dabei nichts. Punkt 2 greift in
`getAutoscale` ein und ist damit dieselbe Wette. Beides ist bewusst so gewählt:
Der Schaden bei einem Fehlschlag ist eine schiefe Anzeige, kein kaputter Abend.

**Nicht gemessen** ist der Nachbau-Aufwand — die Zeilenzahlen sind gezählt, die
Schätzung daraus bleibt eine Schätzung. Gemessen sind die Konfigurationszahlen:
125 Szenen, 4 Konten, eine gedrehte Szene.
