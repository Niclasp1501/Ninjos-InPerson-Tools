# Konzept: die Ambiente-Seiten im Modul

Stand 31.08.2026. Grundlage sind die vier vorhandenen Versuche im Workspace und
gemessenes Verhalten des Foundry-Servers, nicht Annahmen.

---

## 1. Was da liegt

Vier Seiten, und sie sind sich bemerkenswert einig in der Bauweise:

| | Datei | Bild | Schleife | Zugang |
|---|---|---|---|---|
| Alchemistenlabor | 17 KB | 3,1 MB | 120 s | `window.LABOR` |
| Schmiede | 17 KB | 3,2 MB | 120 s | `window.SCHMIEDE` |
| Taverne | 15 KB | 3,0 MB | 120 s | `window.TAVERNE` |
| Zauberbuch | 26 KB | 5,1 MB | 180 s | `window.BUCH` |

Gemeinsam haben alle vier:

- **eine einzige HTML-Datei** plus ein Hintergrundbild, sonst nichts
- **keine externen Verweise** — nichts wird nachgeladen
- **kein Ton**
- ein `<canvas>`, das den ganzen Bildschirm füllt und auf Größenänderung reagiert
- `devicePixelRatio` auf 2 gedeckelt, also auch auf einem 4K-Fernseher bezahlbar
- eine **geschlossene Schleife**: Das Bild ist eine reine Funktion der Zeit,
  `setzeZeit(t)` springt an jede Stelle
- Tastatur: Leertaste, Pfeile, `R`, `H`

Das ist eine ungewöhnlich gute Ausgangslage. Vier Dinge, die sich gleich
verhalten, brauchen einen Einbau, nicht vier.

## 2. Die Feststellung, die alles entscheidet

**Foundry liefert `.html` als `text/plain` aus — überall.** Gemessen:

```
/Kampagnen-Import/pota-kap2-de.html          → text/plain
/modules/item-delete-check/templates/…html   → text/plain
```

Auch aus einem Modul heraus. Das ist kein Versehen, sondern Absicht: Ein Server,
der beliebiges HTML aus dem Datenverzeichnis ausliefert, ist ein Einfallstor.

Damit ist der naheliegende Weg tot: `<iframe src="…/taverne/index.html">` zeigt
den **Quelltext**, nicht die Seite.

### Der Ausweg, und er ist geprüft

Die Datei lässt sich holen und selbst als HTML verpacken:

```js
const text = await (await fetch(pfad)).text();
const url  = URL.createObjectURL(new Blob([text], { type: "text/html" }));
rahmen.src = url;
```

Am 31.08.2026 auf dem laufenden Server nachgestellt: Der Rahmen enthielt danach
**7 geparste Elemente**, keinen Quelltext. Die Bilder daneben (`.jpg`) liefert
Foundry ohnehin richtig aus.

Ein Haken bleibt: Die Seite lädt `bilder/labor.jpg` **relativ**, und relativ zu
einer `blob:`-Adresse führt das ins Nichts. Lösung ist ein `<base>` im Kopf, das
vor dem Verpacken eingesetzt wird und auf den echten Ordner zeigt. Standardsache,
aber noch nicht mit einer der vier Seiten erprobt.

## 3. Vier Wege hinein

### A — Rahmen über der Blende *(Empfehlung)*

Die Blende gibt es schon: ein `<div>` über allem, das kommt und geht. Statt
Schwarz mit Marke liegt darin ein Rahmen mit der Seite.

| | |
|---|---|
| Aufwand | ~120 Zeilen, die Blende trägt die halbe Arbeit schon |
| Die Versuche bleiben | unverändert, sie werden nur eingebunden |
| Wo die Dateien liegen | irgendwo unter Foundrys Datenverzeichnis, egal wo |

Dass der Weg über `text/plain` und Blob führt, ist ein Umweg — aber ein
geprüfter, und er hält die vier Seiten als das, was sie sind: eigenständige
Arbeiten, die man auch ohne Foundry ansehen kann.

**Was dagegen spricht:** Wir führen eine Datei aus, die auf dem Server liegt.
Einstellen darf das nur der Spielleiter, und es ist seine eigene Datei auf seinem
eigenen Server — aber es bleibt ein Unterschied zu „wir zeigen ein Bild".

### B — Den Zeichencode ins Modul holen

Die Seiten sind 15–26 KB JavaScript auf einem `<canvas>`. Man könnte den Code
übernehmen und das Bild als Modul-Beigabe mitliefern.

Sauber, ohne Rahmen und ohne Umweg. Aber: Jede Seite läge dann **zweimal** vor —
einmal als Versuch, einmal im Modul — und beide müssten von Hand gleich gehalten
werden. Bei vier Seiten mit je eigenem Takt ist das die teurere Wette.

### C — Als Video, ganz ohne Modulcode

Die Schleife schließt und `setzeZeit(t)` zeichnet jedes Einzelbild. Damit ist der
Weg zur MP4 offen — die README des Zauberbuchs beschreibt ihn bereits.

Und dann braucht es **gar nichts Neues**: Foundry-Szenen nehmen Video als
Hintergrund, und unser Bildschirmschoner kann seit 14.2610.7 durch einen Ordner
voller Szenen wandern. Vier Videos, ein Ordner, fertig.

| Dafür | Dagegen |
|---|---|
| null Zeilen Modulcode | Dateigröße, und die Bewegung ist eingefroren statt errechnet |
| funktioniert auf jedem Client | eine Auflösung, kein Anpassen an den Bildschirm |
| kein Ausführen fremder Dateien | jede Änderung verlangt neues Rendern |

**Das ist der Weg mit dem besten Verhältnis**, wenn es nur ums Ansehen geht.

### D — Woanders hosten und von dort holen

Ihr betreibt ohnehin Firebase Hosting. Liegt die Seite dort, entfällt der
`text/plain`-Umweg — ein Rahmen zeigt sie direkt.

Braucht aber eine Internetverbindung am Spieltisch, und genau die zu entlasten
ist der Grund, warum es dieses Modul gibt.

## 4. Wozu man es benutzt — fünf Fälle

Der Einbau ist eine Frage; wann man es sieht, eine andere. Diese fünf sind
verschieden genug, dass sie verschiedene Auslöser brauchen:

| Fall | Auslöser | Deckt schon vorhandenes ab? |
|---|---|---|
| **Pause** | Ruhe, wie der Bildschirmschoner heute | ja, dritte Betriebsart |
| **Vor der Sitzung** | Ruhe, solange niemand da ist | derselbe Mechanismus |
| **Begleitszene** | Battlemap „Taverne" wird aktiviert → Ambiente auf dem zweiten Schirm | Begleitszenen gibt es, sie zeigen bisher nur Szenen |
| **Auf Zuruf** | „Ihr betretet die Schmiede" — Rechtsklick, zeigen | neu, aber klein |
| **Ruhebild** | nach dem Lösen einer Fixierung | Ruhebild gibt es, zeigt bisher nur Szenen |

Drei der fünf sind Stellen, an denen heute **eine Szene** steht. Wenn eine
Ambiente-Seite überall dort stehen darf, wo heute eine Szene steht, sind vier
Fälle mit einem Handgriff erschlagen.

Das spricht für einen gemeinsamen Begriff: **ein Ziel ist entweder eine Szene
oder eine Ambiente-Seite.** Das Szenenfeld aus 14.2611.2 könnte beides
aufnehmen, und alles Weitere folgt.

## 5. Was das mit dem Einbrennen zu tun hat — nämlich wenig

Wichtig, weil es sonst durcheinandergeht: **Diese Seiten sind kein
Einbrennschutz.** Sie sind hell, bildschirmfüllend und laufen stundenlang. Genau
das, wogegen die schwarze Blende gebaut wurde.

Sie lösen ein *anderes* Problem: dass ein Bildschirm in einer Pause nicht tot
aussehen soll.

Wer beides will, braucht eine Reihenfolge — Ambiente in der kurzen Pause, Schwarz
nach der langen. Das ist eine dritte Betriebsart mehr, und ich würde damit warten,
bis die zwei vorhandenen sich im Spiel bewährt haben.

## 6. Empfehlung

**Erst C, dann A.**

Ein Video aus dem Zauberbuch rendern und in den Bildschirmschoner-Ordner legen
kostet keinen Modulcode und beantwortet die eigentliche Frage: Sieht das am
Fernseher gut aus, und will man es überhaupt? Falls ja, lohnt A — dann bewegt es
sich errechnet statt abgespielt, passt sich dem Bildschirm an und bleibt
änderbar, ohne neu zu rendern.

Falls nein, hat es nichts gekostet.

## 7. Was ich nicht täte

**Alle vier gleichzeitig einbauen.** Sie sind sich in der Bauweise einig, aber
ob sie am Fernseher wirken, muss sich an einer zeigen.

**Ton dazuerfinden.** Keine der vier hat welchen, und am Tisch kommt der Ton aus
den Lautsprechern des Spielleiters.

**Die Tastatursteuerung durchreichen.** Leertaste und Pfeile sind für das
Ansehen am Rechner gebaut. Auf einem Monitor ohne Tastatur ist das nichts, und
im Foundry-Fenster kollidiert es mit dessen eigenen Tasten.

---

## Offen, weil nicht geprüft

- Das `<base>`-Einsetzen ist Standard, aber **nicht mit einer der vier Seiten
  erprobt** — die liegen nicht auf dem Server.
- Wie die Seiten am Fernseher aussehen, habe ich **nicht gesehen**. Der
  Browser-Zugang kommt an `file://` nicht heran, und ohne Server ließ sich keine
  von ihnen öffnen.
- Ob vier gleichzeitig laufende Zeichenschleifen einen Monitor-Client mit
  Foundry daneben ins Schwitzen bringen: ungemessen. Bei einer Seite sicher
  nicht, aber gemessen ist es nicht.
