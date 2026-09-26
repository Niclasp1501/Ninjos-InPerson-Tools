# Konzept: Ebenen auf dem Battlemap-Monitor

Stand 26.09.2026. **Gebaut in 14.2611.79** (`scripts/ebenen.js`, `scripts/ebenen-fenster.js`,
`tools/test-ebenen.mjs`); am Tisch geprüft wird es am 27.09.2026. Die Entscheidungen stehen
unten, alle getroffen.

## Worum es geht

Foundry 14 kennt Ebenen: Erdgeschoss, Dach, Keller derselben Karte in einer Szene. Jeder
Rechner zeigt davon genau eine. Am Spielleiter-Schreibtisch wählt man sie selbst. Der
Battlemap-Monitor dagegen ist ein Spielerkonto, das niemand bedient, und zeigt die Ebene,
die Foundry für ihn aussucht. Das ist oft nicht die, auf der die Gruppe steht.

Gewünscht ist: Der Monitor zeigt die Ebene, auf der die Figuren der Spieler sind, unabhängig
davon, welche Figur die Spielleitung gerade am Schreibtisch ausgewählt hat. Die Spielleitung
kann ihm eine Ebene von Hand vorgeben und zwischen den Arten in einem Steuerungsfenster
wechseln. Und Dächer sollen sich auf dem Monitor öffnen wie am Schreibtisch.

## Was Foundry heute tut

Nachgelesen im Client-Quellcode auf dem Produktivserver (Foundry 14.368).

**Beim Laden einer Szene** (`Canvas._determineInitialLevel`, `canvas/board.mjs:1418`): erst
fragt Foundry einen `SceneManager`, falls einer für die Szene eingetragen ist. Sonst nimmt es
die Ebene, die dieser Rechner in dieser Szene zuletzt gesehen hat, dann die Anfangsebene der
Szene, dann die ihr nächstgelegene, die das Konto sehen darf. Wo die Gruppe steht, spielt
keine Rolle.

**Im Spiel** (`TokenDocument.#handleMovementOperation`, `documents/token.mjs:2903`): Verlässt
eine Figur, die das Konto beobachten darf, die angezeigte Ebene, schaltet der Rechner auf deren
Ziel um, sofern das Konto selbst keine Figur auf der alten Ebene besitzt. Der Monitor besitzt
keine. Er folgt also **jeder einzelnen** beobachteten Figur, die die Ebene wechselt. Klettert
einer aufs Dach, springt der Monitor aufs Dach, und die drei, die unten geblieben sind,
verschwinden vom Bildschirm.

**Figuren, die der Monitor nicht beobachtet, zählen nicht.** Sie lösen keinen Wechsel aus.

**Ein Ebenenwechsel zeichnet die ganze Leinwand neu** (`Scene#view` ruft `canvas.draw`). Auf
dem Fernseher ist das ein sichtbarer Wechsel von ein bis zwei Sekunden. Kommt der Wunsch,
während noch geladen wird, verwirft Foundry ihn mit einer Warnung.

**`view()` prüft nicht, ob das Konto auf der Ebene etwas sieht.** Mit Token-Sicht und ohne
beobachtete Figur auf der Zielebene bleibt das Bild schwarz.

**Lock View kennt keine Ebenen.** Es fixiert Ausschnitt und Zoom, die Ebene überlässt es
Foundry.

**Dächer öffnen sich beim Monitor nie.** Über welchen Figuren eine Dachfläche durchsichtig
wird, entscheidet `TokenLayer#_getOccludableTokens` (`canvas/layers/tokens.mjs:555`). Die
Spielleitung hat die Arten „angewählt", „sichtbar" und „hervorgehoben", ein Spieler „besitzt"
und „sichtbar". Sobald ein Spieler durch Figuren sieht, nimmt Foundry alle sichtbaren, aber nur
solche, die gerade anklickbar sind (`t.interactive`). Anklickbar ist eine Figur nur, wenn die
Figurenebene aktiv und ein Werkzeug gewählt ist (`Token#isInteractable`). Am Monitor bedient
niemand die Oberfläche, die Liste ist leer, das Dach bleibt zu. Am Schreibtisch geht es über
der angewählten Figur auf.

### Befund in faerun3

- **25 Szenen mit mehreren Ebenen**, alle aus dem gekauften Kartenpaket (12. Big Top bis
  60. Magic Bureau). 24 davon haben Token-Sicht an, nur „53. Pirate Ship" nicht.
- **Der Battlemap-Monitor besitzt keine Figur** und beobachtet fünf: Amara Avariel, Eric Knilf,
  Fippo Kupferbart, Gruppe-Token, Tepok.
- **Nyra Nordwind, Nataschas Figur, beobachtet er nicht.** Ihre Sicht fehlt heute schon auf dem
  Fernseher, mit oder ohne Ebenen. Anduin und Riesenschädel ebenso; ob die noch gespielt
  werden, ist offen.

## Vorschlag

### Drei Arten, wie der Monitor seine Ebene wählt

**Der Gruppe folgen** (Voreinstellung). Der Monitor entscheidet in dieser Reihenfolge, die
erste Regel, die greift, gilt:

1. **Im Kampf: wer dran ist.** Läuft auf dieser Szene ein Kampf und ist eine Spielerfigur am
   Zug, zeigt der Monitor deren Ebene. Ist ein Gegner am Zug, bleibt er, wo er ist: Steht der
   Gegner auf einer Ebene ohne Spielerfigur, sähe der Monitor dort nichts, weil er nur durch
   die Augen der Spielerfiguren sieht, und der Fernseher wäre für einen ganzen Zug schwarz.
2. **Sonst die Mehrheit.** Die Ebene, auf der die meisten Spielerfiguren stehen. Klettert einer
   von vier aufs Dach, bleibt der Monitor unten; folgen ihm zwei weitere, geht er mit.
3. **Bei Gleichstand: wo zuletzt etwas passiert ist.** Die Ebene der Spielerfigur, die zuletzt
   bewegt oder von der Spielleitung angeklickt wurde. Zwei oben, zwei unten, und die
   Spielleitung wählt eine Figur auf dem Dach an: Der Monitor geht aufs Dach.
4. **Weiß er nichts davon**, bleibt er, wo er ist.

Gewechselt wird erst, wenn eine Bewegung zu Ende ist, nie mittendrin. Die Mehrheit allein
würde bei Gleichstand stehen bleiben, auch wenn das Geschehen längst oben ist; die letzte
Bewegung allein wäre genau das heutige Verhalten, bei dem ein einzelner Späher den ganzen
Fernseher mitnimmt. Erst zusammen ergeben sie, was man am Tisch erwartet.

Als Spielerfigur zählt, was einem Spieler gehört (`actor.hasPlayerOwner`), auf dieser Szene
steht und nicht versteckt ist. Monitorkonten zählen nicht mit. Ob der Monitor die Figur
beobachten darf, ist dafür egal: Sonst würde eine vergessene Berechtigung, wie heute bei Nyra,
still die Wahl verfälschen.

**Manuell.** Die Spielleitung gibt eine Ebene vor, und der Monitor bleibt dort, egal wer wohin
geht. Gedacht für den Moment, in dem sie allen etwas auf dem Dach zeigen will, bevor jemand
dort ist. Gilt bis zur nächsten Karte, danach folgt der Monitor wieder der Gruppe.

**Foundry-Standard.** Das heutige Verhalten, für alle, die es so wollen.

Im Fenster heißen die drei **Autonom**, **Foundry-Standard** und **Manuell**. „Der Gruppe
folgen" oben ist Autonom.

### Wie die Spielleitung eingreift

- **Das Steuerungsfenster** (Shift+E, oder der Ebenen-Knopf in der Zeile des
  Battlemap-Monitors im Bedienfeld). Oben die drei Arten als große Knöpfe mit je einem Satz
  Erklärung. Darunter die Ebenen der aktiven Karte, das Dach zuerst, jede mit der Zahl der
  Spielerfiguren darauf; die angezeigte ist markiert. Ein Tipp auf eine Ebene gibt sie vor und
  schaltet auf Manuell. Der Knopf „Manuell" allein hält die Ebene fest, die gerade läuft.
- **Rechtsklick auf eine Ebene in Foundrys Navigationsleiste**: „Auf dem Battlemap-Monitor
  zeigen". Das ist Foundrys eigenes Menü, erweitert über den Hook `getSceneContextOptions`;
  Ebenen stehen dort schon als eigene Einträge.

Shift+E, weil es jetzt genau ein Fenster dazu gibt (Regel 8). Das blanke E belegt Foundry.

### Technischer Weg

**Auf dem Monitor wird `Scene#view` umhüllt.** Jeder Ebenenwechsel läuft dort durch, Foundrys
Automatik ebenso wie unsere Befehle; die Methode, die entscheidet (`#handleMovementOperation`),
ist privat und lässt sich nicht umhüllen, ihr Ergebnis aber schon. Im Modus „Gruppe" oder
„Fest" ersetzt die Hülle die gewünschte Ebene durch unsere. Ist das die, die ohnehin angezeigt
wird, entfällt das Neuzeichnen ganz. So wird das Springen **verhindert**, statt es hinterher
zu korrigieren; eine Korrektur hieße zweimal Neuzeichnen, sichtbar auf dem Fernseher.

Das ist dasselbe Muster, mit dem das Modul heute schon das Szenenfolgen des Szenen-Monitors
abfängt (`installMonitorWrapper` in `monitor.js`), und es läuft wie dort nur auf dem
Monitor-Rechner. Unsere eigenen Aufrufe tragen eine Kennzeichnung, damit die Hülle sie
durchlässt.

**Beim Laden einer Szene** greift dieselbe Hülle, bevor zum ersten Mal gezeichnet wird: Sie
gibt die richtige Ebene gleich mit. Kein Umweg über die Anfangsebene.

**„Fest" kommt über Foundrys eigenen Weg** zum Monitor: `scene.pullUsers([monitor], {level})`.
Foundry reicht die Optionen unverändert an `scene.view()` beim Empfänger durch
(`documents/collections/scenes.mjs:111`). Zusätzlich wird die Vorgabe als Welteinstellung
gemerkt (Szene und Ebene), damit ein Neuladen des Monitors sie nicht vergisst. Genau daran ist
beim Szenen-Monitor am 29.08.2026 ein Fehler entstanden: Ein Befehl ohne gespeicherten Stand
war nach dem Neuladen weg.

**„Gruppe" rechnet der Monitor selbst**, aus den Figuren der Szene, die jeder Rechner ohnehin
kennt. Neu gerechnet wird, wenn eine Figur die Ebene wechselt, dazukommt oder verschwindet,
jeweils nach dem Ende der Bewegung, und im Kampf beim Zugwechsel (`updateCombat`). Läuft
gerade ein Ladevorgang, wartet er, statt den Wunsch an Foundrys Warnung zu verlieren.

Zwei der Signale kennt der Monitor von selbst, eines nicht:

- **Bewegungen** sieht jeder Rechner (`updateToken`), der Monitor merkt sich die zuletzt
  bewegte Spielerfigur.
- **Wer dran ist**, steht im Kampf, den ebenfalls jeder Rechner hat.
- **Das Anklicken** geschieht nur am Rechner der Spielleitung (`controlToken`). Der schickt es
  über den Socket des Moduls an den Monitor, nur für Spielerfiguren und nur, wenn sie auf
  einer anderen Ebene stehen als der angezeigten. Am Tisch mit Tablets in der Blattansicht
  bewegt ohnehin fast nur die Spielleitung Figuren; das Anklicken deckt den Fall ab, dass sie
  eine Figur auswählt, ohne sie zu bewegen.

### Die Sicht ist der eigentliche Stolperstein

Mit Token-Sicht sieht der Monitor nur, was die Figuren sehen, die er beobachtet. Folgt er der
Gruppe auf eine Ebene, auf der er keine davon beobachtet, bleibt der Fernseher schwarz. Das
passiert genau dann, wenn Berechtigungen fehlen, und das tun sie heute (Nyra).

Deshalb steht im Steuerungsfenster eine **Prüfung**: „Der Monitor darf diese Spielerfiguren
nicht beobachten: Nyra Nordwind, …", mit einem Knopf „Beobachterrecht geben". Geprüft werden
alle Spielerfiguren der Welt, nicht nur die der aktiven Karte; die nächste Karte hat dieselbe
Gruppe. Das hilft auch ohne Ebenen sofort.

Ebenen, auf denen der Monitor durch keine Figur sehen darf, tragen im Fenster den Vermerk
„keine Sicht", bevor man sie antippt und einen schwarzen Fernseher bekommt.

### Dächer

Eine zweite Hülle um `TokenLayer#_getOccludableTokens`, ebenfalls nur auf dem Monitor. Sie
bildet Foundrys Regel für Beobachter nach, ohne die Bedingung der Anklickbarkeit: alle
sichtbaren, nicht geheimen Figuren auf der angezeigten Ebene, dazu die Spielerfiguren, auch
wenn der Monitor sie gerade nicht sieht. Versteckte nie, ein Loch im Dach an einer leeren
Stelle verriete sie. Abschaltbar im Steuerungsfenster („Dächer über Spielerfiguren öffnen"),
für den Moment, in dem ein Gebäude von außen geschlossen wirken soll.

### Der Szenen-Monitor

Derselbe Mechanismus passt auf den Szenen-Monitor. Dort spielt er heute kaum eine Rolle, weil
Begleitszenen selten Figuren tragen. Eine Verbindung gibt es aber: Die Stockwerke eines Turms
können künftig Ebenen einer einzigen Szene sein statt mehrerer Begleitszenen, und das
Umschalt-Fenster (Shift+B) könnte dann auch Ebenen anbieten. Das ist ein späterer Schritt.

### Bewusst nicht

- **Mehrere Ebenen gleichzeitig.** Foundry zeichnet auf einem Rechner genau eine. Zwei Ebenen
  nebeneinander ginge nur mit zwei Monitoren.
- **Die Tablets.** In der Blattansicht gibt es keine Leinwand, dort ist nichts zu wählen.

## Entscheidungen

1. **Voreinstellung**: Autonom (26.09.2026). Das heutige Verhalten ist genau das, was stört.
2. **Manuell gilt bis zur nächsten Karte** (26.09.2026). Eine vergessene Vorgabe, die in die
   nächste Sitzung mitwandert, wäre der nächste unerklärliche Fehler.
3. ~~Gleichstand~~ **entschieden 26.09.2026**: Der Monitor geht dorthin, wo zuletzt eine
   Spielerfigur bewegt oder angeklickt wurde; im Kampf dorthin, wo eine Spielerfigur am Zug
   ist. Ergänzt um die Ausnahme für Züge von Gegnern (siehe Regel 1).

## Was gebaut wurde

- `scripts/ebenen.js`: die Regeln (`ebeneWaehlen`, ohne Foundry prüfbar), die Hüllen um
  `Scene#view` und `TokenLayer#_getOccludableTokens`, die Beobachter auf dem Monitor, das
  Anklicken vom Rechner der Spielleitung über den Socket, das Zurücksetzen von Manuell bei
  einer neuen Karte, der Eintrag im Rechtsklickmenü der Navigationsleiste
- `scripts/ebenen-fenster.js` und `templates/ebenen.hbs`: das Steuerungsfenster mit Arten,
  Ebenen, Dach-Schalter und Prüfung der Beobachterrechte
- drei Welteinstellungen ohne Eintrag in der Einstellungsliste: Art, Vorgabe, Dach
- Shift+E und ein Knopf in der Zeile des Battlemap-Monitors im Bedienfeld
- `tools/test-ebenen.mjs`, 20 Fälle: Kampf mit Spieler- und Gegnerzug, Mehrheit,
  Gleichstand mit letzter Bewegung, versteckte Figuren, Figuren ohne Spieler, Foundry-Standard,
  Vorgabe für diese und für eine andere Karte, Szenen mit einer Ebene

Geprüft werden kann es nur mit laufendem Monitor, also an einem Abend oder mit einem zweiten
angemeldeten Rechner als Battlemap-Monitor.

### Was am Tisch zu prüfen ist

1. Eine Karte mit Ebenen aktivieren (etwa „24. Warehouse - Large"). Startet der Monitor auf
   der Ebene, auf der die Gruppe steht?
2. Eine Figur allein aufs Dach ziehen: Der Monitor bleibt unten. Zwei weitere hinterher: Er
   geht mit, ohne Zwischenstopp.
3. Zwei oben, zwei unten, dann eine Figur oben anklicken: Der Monitor geht aufs Dach.
4. Kampf beginnen. Spielerzug auf dem Dach: Dach. Gegnerzug im Keller: Der Monitor bleibt.
5. Dächer: Steht eine Figur unter einem Dach, ist es auf dem Monitor über ihr offen?
6. Shift+E, Manuell, eine Ebene antippen: Der Monitor wechselt und bleibt. Andere Karte
   aktivieren: Das Fenster steht wieder auf Autonom.
7. Nyra: Steht sie im Fenster unter den fehlenden Rechten, und verschwindet sie nach dem Knopf?
