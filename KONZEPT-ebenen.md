# Konzept: Ebenen auf dem Battlemap-Monitor

Stand 26.09.2026. Noch nicht gebaut; unten stehen drei Entscheidungen, die vorher fallen müssen.

## Worum es geht

Foundry 14 kennt Ebenen: Erdgeschoss, Dach, Keller derselben Karte in einer Szene. Jeder
Rechner zeigt davon genau eine. Am Spielleiter-Schreibtisch wählt man sie selbst. Der
Battlemap-Monitor dagegen ist ein Spielerkonto, das niemand bedient, und zeigt die Ebene,
die Foundry für ihn aussucht. Das ist oft nicht die, auf der die Gruppe steht.

Gewünscht ist: Der Monitor zeigt die Ebene, auf der die Figuren der Spieler sind, unabhängig
davon, welche Figur die Spielleitung gerade am Schreibtisch ausgewählt hat. Und die
Spielleitung kann ihm eine Ebene von Hand vorgeben.

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

**Der Gruppe folgen** (Vorschlag für die Voreinstellung). Der Monitor zeigt die Ebene, auf der
die meisten Spielerfiguren stehen. Er wechselt erst, wenn eine andere Ebene **mehr** Figuren
hat als die angezeigte, nicht schon bei Gleichstand, und erst, wenn die Bewegung zu Ende ist.
Klettert einer von vier aufs Dach, bleibt der Monitor unten. Folgen ihm zwei weitere, geht er
mit hoch.

Als Spielerfigur zählt, was einem Spieler gehört (`actor.hasPlayerOwner`), auf dieser Szene
steht und nicht versteckt ist. Monitorkonten zählen nicht mit. Ob der Monitor die Figur
beobachten darf, ist dafür egal: Sonst würde eine vergessene Berechtigung, wie heute bei Nyra,
still die Wahl verfälschen.

**Fest.** Die Spielleitung gibt eine Ebene vor, und der Monitor bleibt dort, egal wer wohin
geht. Gedacht für den Moment, in dem sie allen etwas auf dem Dach zeigen will, bevor jemand
dort ist. Gilt bis zur nächsten Karte, danach folgt der Monitor wieder der Gruppe.

**Wie Foundry.** Das heutige Verhalten, für alle, die es so wollen.

### Wie die Spielleitung eingreift

- **Im Bedienfeld**, in der Zeile des Battlemap-Monitors: ein Knopf je Ebene der aktiven
  Karte und ein Knopf „Automatisch". Die angezeigte Ebene ist markiert. Die Knöpfe erscheinen
  nur, wenn die Karte mehrere Ebenen hat.
- **Rechtsklick auf eine Ebene in Foundrys Navigationsleiste**: „Auf dem Battlemap-Monitor
  zeigen". Das ist Foundrys eigenes Menü, erweitert über den Hook `getSceneContextOptions`;
  Ebenen stehen dort schon als eigene Einträge.

Kein eigenes Tastenkürzel: Es gäbe kein offensichtliches Fenster dazu (Regel 8), und die
beiden Wege oben sind schneller als eine Tastenkombination, die man sich merken muss.

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
jeweils nach dem Ende der Bewegung. Läuft gerade ein Ladevorgang, wartet er, statt den
Wunsch an Foundrys Warnung zu verlieren.

### Die Sicht ist der eigentliche Stolperstein

Mit Token-Sicht sieht der Monitor nur, was die Figuren sehen, die er beobachtet. Folgt er der
Gruppe auf eine Ebene, auf der er keine davon beobachtet, bleibt der Fernseher schwarz. Das
passiert genau dann, wenn Berechtigungen fehlen, und das tun sie heute (Nyra).

Deshalb gehört zum Bau eine **Prüfung in den Monitor-Einstellungen**: „Diese Spielerfiguren
beobachtet der Battlemap-Monitor nicht: Nyra Nordwind, …", mit einem Knopf „Beobachterrecht
geben". Das hilft auch ohne Ebenen sofort.

Gibt die Spielleitung „Fest" eine Ebene vor, auf der der Monitor nichts beobachtet, sagt das
Bedienfeld es dazu, statt einen schwarzen Fernseher zu erzeugen, ohne dass jemand weiß warum.

### Der Szenen-Monitor

Derselbe Mechanismus passt auf den Szenen-Monitor. Dort spielt er heute kaum eine Rolle, weil
Begleitszenen selten Figuren tragen. Eine Verbindung gibt es aber: Die Stockwerke eines Turms
können künftig Ebenen einer einzigen Szene sein statt mehrerer Begleitszenen, und das
Umschalt-Fenster (Shift+B) könnte dann auch Ebenen anbieten. Das ist ein späterer Schritt.

### Bewusst nicht

- **Mehrere Ebenen gleichzeitig.** Foundry zeichnet auf einem Rechner genau eine. Zwei Ebenen
  nebeneinander ginge nur mit zwei Monitoren.
- **Die Tablets.** In der Blattansicht gibt es keine Leinwand, dort ist nichts zu wählen.

## Offene Entscheidungen

1. **Voreinstellung**: „Der Gruppe folgen" oder „Wie Foundry"? Empfehlung: Gruppe folgen. Das
   heutige Verhalten ist genau das, was stört.
2. **Wie lange gilt „Fest"?** Bis zur nächsten Karte, oder bis jemand „Automatisch" drückt?
   Empfehlung: bis zur nächsten Karte. Eine vergessene Vorgabe, die in die nächste Sitzung
   mitwandert, wäre der nächste unerklärliche Fehler.
3. **Gleichstand**, zwei oben, zwei unten: bleibt der Monitor, wo er ist? Empfehlung: ja. Jede
   andere Regel lässt ihn bei jedem Schritt hin- und herspringen, und jeder Sprung ist ein
   Neuzeichnen.

## Aufwand

Etwa so groß wie die Begleitszenen:

- Hülle um `Scene#view` auf dem Monitor, mit Gruppenrechnung und Trägheit
- Einstellung für die Art, gemerkte Vorgabe je Szene
- Knöpfe im Bedienfeld, Eintrag im Navigationsmenü
- Prüfung der Beobachterrechte mit Knopf in den Monitor-Einstellungen
- Test der Gruppenrechnung: Mehrheit, Gleichstand, versteckte Figuren, Monitorkonten,
  Szenen ohne Ebenen

Geprüft werden kann es nur mit laufendem Monitor, also an einem Abend oder mit einem zweiten
angemeldeten Rechner als Battlemap-Monitor.
