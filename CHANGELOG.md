# Changelog

## 14.2611.1 — 2026-08-29

**Ein Fenster je Werkzeug.** Das Modul ist ein Werkzeugkasten: Downloads am Tisch
sperren, zwei Bildschirme steuern, Karten drehen. Die drei haben nichts
miteinander zu tun außer dem Anlass. In einer flachen Liste sahen die
Einstellungen desjenigen Werkzeugs, das die meisten hat, aus wie „die
Einstellungen des Moduls" — und genau das war eingetreten: **alle neun sichtbaren
Einträge gehörten dem Tischmodus.**

Neu unter *Moduleinstellungen*:

```
Für diesen Client          [automatisch ▾]   ← je Gerät, Spieler sehen es
Statusanzeige einblenden   [✓]               ← je Gerät
Steuerung öffnen           [Bedienfenster]
Tischmodus                 [Einrichten…]
Szenen-Monitore            [Einrichten…]
```

Fünf Zeilen — und fünf bleiben es auch, wenn Werkzeuge dazukommen. Ein neues
Werkzeug ist eine Zeile, nicht fünfzehn.

Beim Sortieren fiel eine zweite Achse auf, die leicht zu übersehen ist: **wer
etwas einstellt.** Drei Einstellungen gehören dem einzelnen Gerät, und es sind
die einzigen, die ein Spieler je anfasst. Wandern sie in ein Fenster, das nur der
Spielleiter öffnen darf, sind sie für Spieler weg — sie bleiben deshalb in der
Liste.

Im Fenster „Tischmodus" erscheint „Token-Bilder weiter laden" jetzt nur noch,
wenn „Alles Schwere" blockiert wird. Bei der Vorgabe wird ohnehin nur die
Hintergrundkarte gesperrt — dann gibt es für die Einstellung nichts zu tun, und
die Frage zu stellen lädt dazu ein, ihr eine Wirkung zu unterstellen.

**Kein Fenster für die Szenendrehung**, obwohl das Konzept zunächst eines vorsah.
Sie hat null Einstellungen: Die Drehung steht je Szene, die Lock-View-Anpassung
läuft von selbst. Ein Fenster, in dem nur steht, ob Lock View erkannt wurde, ist
ein Fenster ohne Inhalt.

**Ein Name statt zwei.** Im Konzept stand „Kartensperre" für das, was das Modul
an 21 Stellen „Tischmodus" nennt. Angeglichen.

## 14.2610.8 — 2026-08-29

**Ein Bild auszuwählen warf das halbe Formular weg.** Der Haken bei
„Bildschirmschoner verwenden" verschwand, und Speichern schrieb danach den
gelöschten Zustand zurück.

Ursache war eine Zeile in der Dateiauswahl: Nach der Wahl rief sie `render()`
auf, um die Vorschau zu zeigen — und ein Rendern baut das Formular **aus den
gespeicherten Werten** neu auf. Alles, was eingestellt und noch nicht gespeichert
war, fiel dabei zurück auf den alten Stand. Das gewählte Bild übrigens mit; es
sah nur nicht so aus, weil das Feld kurz davor beschrieben wurde.

Während des Bearbeitens wird jetzt **nirgends** mehr gerendert. Vorschau und
Löschknopf stehen dauerhaft im Formular und werden nur ein- und ausgeblendet,
und dasselbe galt für das Auflösen einer Begleitszene — auch das hätte deine
Eingaben verworfen. Ein Pfad, der von Hand eingetippt wird, erscheint jetzt
ebenfalls in der Vorschau.

## 14.2610.7 — 2026-08-29

**Zurückgenommen: drei der vier Einstellungen aus 14.2610.6 sind wieder da.**
Bemängelt waren zwei, entfernt hatte ich vier. „Ladebalken ausblenden" war nie
erwähnt, und bei der Statusanzeige stand eine Frage — eine Frage ist kein
Auftrag. Zurück sind „Token-Bilder weiter laden", „Ladebalken bei Spielern
ausblenden" und „Statusanzeige einblenden". Draußen bleibt nur „Token-Menü
gerade halten". „Audio blockieren" war nie betroffen.

**Der Bildschirmschoner ist neu gegliedert — als Fragefolge statt als Formular.**
Vorher standen alle Zeiten nebeneinander, und Szenenwechsel und Blende liefen
als zwei Stufen *gleichzeitig*. Das war falsch gedacht: Es sind Alternativen.

```
Bildschirmschoner verwenden?          ← ohne Ja bleibt der Rest verborgen
  └ nach wie vielen Minuten Ruhe
  └ auf welche Art?
      ├ Schwarze Blende über die laufende Szene   (Vorgabe)
      │   └ wie lange sie liegt · Bild darauf · [Blende ansehen]
      └ Auf andere Szenen wechseln
          └ Ordner · Wechselintervall
```

Die Blende bleibt jetzt **auf derselben Szene** liegen, statt dass daneben noch
Szenen gewechselt werden. Sie kommt und geht weiterhin: liegen für ihre Zeit,
dann heben, dann nach der Wartezeit wieder darüber.

**Knopf „Blende ansehen".** Zeigt sie auf dem eigenen Bildschirm für acht
Sekunden, Klick oder Taste blendet sofort aus. Auf dem eigenen und nicht auf dem
Monitor, weil die Frage „ist mein Bild zu groß" eine Darstellungsfrage ist — die
Marke wird am Bildschirmanteil bemessen, sieht hier also aus wie später am
Fernseher.

Verborgene Felder bleiben im Formular und werden mitgespeichert: Zwischen den
Betriebsarten hin und her zu wechseln verliert nichts.

## 14.2610.6 — 2026-08-29

**Vier Schalter entfernt, die nie Entscheidungen waren.** Der Maßstab dahinter:

> Gibt es einen Fall, in dem ein vernünftiger Mensch den anderen Wert wählt?
> Wenn nein, ist das keine Einstellung, sondern eine Entscheidung, die nicht
> getroffen wurde.

Alle vier waren bei Vorgabe — verstellt hatte sie nie jemand. Die Funktionen
bleiben, festgenagelt auf den Wert, der immer richtig ist:

| Weg | Verhalten jetzt | Warum es nie eine Wahl war |
|---|---|---|
| Token-Bilder weiter laden | laden immer | Ein Token-Bild ist ein paar Kilobyte, und es zu blocken kostet den Spieler das Erkennen der eigenen Figur — das Einzige, wofür er seinen Bildschirm überhaupt noch braucht |
| Token-Menü gerade halten | immer gerade | War ein Notausgang für einen Zweifel, kein Wunsch. Inzwischen gemessen: um Foundrys eigenen Ankerpunkt gedreht bleibt die Beschriftung 6 px von ihrem Token — genauso nah wie ohne Drehung |
| Ladebalken ausblenden | immer aus | Der Balken meldet Verarbeitung, nicht Bandbreite. Auf einem Client, dessen Dateien alle geblockt sind, zählt er munter auf 100 %, während nichts durchs Netz geht. Ihn zu zeigen ist keine Vorliebe, sondern eine falsche Aussage |
| Statusanzeige einblenden | immer an | Sie ist das Einzige auf dem Spieler-Bildschirm, das die schwarze Karte erklärt. Ausblenden macht aus einer gewollten Ersparnis einen scheinbaren Defekt |

Die Liste steht damit bei sechs Einträgen. Was übrig ist, sind echte
Abwägungen: wen es standardmäßig trifft, wie viel geblockt wird, ob Audio mit
dazu gehört (bricht `monks-sound-enhancements`), ob das Spielfeld ganz aus geht
(spart mehr, verlangt einen Reload), Ausnahmepfade und die Wahl je Gerät.

## 14.2610.5 — 2026-08-29

**Die Monitor-Seite lief über und ließ sich nicht scrollen.** Das Fenster wächst
mit seinem Inhalt, und bei elf Feldern in drei Gruppen wuchs es über den unteren
Bildschirmrand hinaus. Ein als scrollbar erklärter Bereich braucht aber eine
*begrenzte* Höhe — sonst gibt es keinen Überhang, den er scrollen könnte.

Der Inhalt ist jetzt gegen die Fensterhöhe gedeckelt und zweigeteilt: Die Felder
scrollen, der Speichern-Knopf bleibt stehen. Ihn bei einem Formular, dessen
ganzer Zweck das Speichern ist, aus der Reichweite zu scrollen, wäre eine eigene
kleine Grausamkeit.

**Der Hauptschalter ist aus der Einstellungsliste raus.** Er war doppelt: als
nacktes Häkchen in der Liste und als Knopf im Bedienfenster, der zusätzlich sagt,
was er bewirkt („Tischmodus läuft — 6 Spieler laden gerade keine Karten mehr").
Zwei Wege zum selben Schalter, einer davon schlechter. Die Steuerung ist über den
Knopf direkt darüber erreichbar.

Nachgezählt: In der Liste standen elf Einstellungen, genau eine davon war
wirklich doppelt. Die übrigen zehn sind Werte, die es im Bedienfenster nicht
gibt.

**„Begleitszenen" war praktisch unsichtbar.** Die Überschrift setzte Schriftart
und -größe, aber keine Farbe, und erbte damit Foundrys helle Themenfarbe auf
unserem weißen Grund — gemessen 0,09 Helligkeitsunterschied. Der Fehler steckte
schon vorher im Bedienfenster und ist beim Umzug mitgekommen.

## 14.2610.4 — 2026-08-29

**Aufräumen nach einem Maßstab statt nach Gefühl.** Im Bedienfenster (`Alt+T`)
standen Ruhebild, Standard-Begleitszene und die Begleitszenen-Übersicht — alles
Dinge, die man einmal einstellt und beim Spielen nie anfasst. Der Maßstab, an
dem das jetzt hängt:

> Würde ich das mitten in der Sitzung anfassen, während sechs Leute warten?

Daraus fallen drei Orte:

| Ort | Was |
|---|---|
| Einstellungsseite | Werte, die einmal gesetzt werden — Konten, Zeiten, Ruhebild, Standard-Begleitszene, Bild, Übersicht der Begleitszenen |
| Rechtsklick auf eine Szene | alles zu *dieser einen* Szene — anzeigen, hier fixieren, Spieler holen, als Ruhebild, als Standard-Begleitszene |
| Bedienfenster `Alt+T` | Zustand und Handlung *jetzt* — Hauptschalter, Spieler-Schalter, Fixierung, Auffrischen, Kosten der Szene |

Die beiden Auswahlfelder waren im Bedienfenster ohnehin doppelt: Beide gibt es
seit Längerem als Rechtsklick-Eintrag auf der Szene, und dort sind sie schneller
erreichbar, weil man die Szene ohnehin vor sich hat.

Das Bedienfenster ist damit 40 Zeilen kürzer und enthält nur noch Dinge, die
während einer Sitzung gebraucht werden.

## 14.2610.3 — 2026-08-29

**Eigene Seite für die Szenen-Monitore.** Alles zu den beiden Bildschirmen sitzt
jetzt unter *Moduleinstellungen → Monitore einrichten* statt verstreut zwischen
den Schaltern der Kartensperre. Downloads blocken und zwei Fernseher steuern sind
verschiedene Aufgaben, die sich nur ein Modul teilen; in einer flachen Liste las
sich das als Haufen zusammenhangloser Schalter.

Die Seite ist von Hand gebaut, nicht Foundrys Standardliste: Die Einstellungen
wollen Gruppen und laufende Erklärung — welcher Monitor welcher ist, was beim
Lösen passiert, wie die zwei Stufen des Einbrennschutzes zusammenspielen. Das
trägt eine flache Liste nicht. Gespeichert wird erst beim Klick, ein halber
Gedanke lässt sich also durch Schließen verwerfen.

**Die Blende pulsiert jetzt, statt liegen zu bleiben.** Das war der eigentliche
Denkfehler in 14.2610.2: Sie ging hoch und blieb oben. Es ging aber nie darum,
den Fernseher abzuschalten, sondern nur darum, dass kein Bild stundenlang
stillsteht. Jetzt hebt sie sich nach der eingestellten Zeit wieder, die Szene ist
zu sehen, und nach der Wartezeit legt sie sich erneut darüber. Neue Einstellung
„Blende bleibt ... Minuten liegen", Vorgabe 3.

Der Szenenwechsel läuft dabei **weiter, während die Blende liegt** — es ist der
einzige Moment, in dem ein Wechsel niemanden stört, und jedes Aufdecken zeigt so
etwas anderes.

**Bild auf der Blende.** Statt des goldenen Punktes lässt sich eine eigene Datei
wählen, die langsam über das Schwarz wandert. Größe nach Bildschirmanteil statt
in Pixeln, damit dieselbe Datei am 24-Zoll-Monitor und am 75-Zoll-Fernseher passt.

**Schrittweite auf 1 Minute** bei allen Ruhezeiten — zum Ausprobieren muss man
nicht mehr fünf Minuten warten.

## 14.2610.2 — 2026-08-29

**Schutz gegen Einbrennen auf dem Szenen-Monitor.** Zwei Stufen, jede einzeln
abschaltbar: nach N Minuten Ruhe wechselt der Monitor durch einen Szenen-Ordner,
nach weiteren M Minuten wird er schwarz mit einer kleinen wandernden Marke.

Die Schwarzblende ist die eigentliche Maßnahme, nicht der Szenenwechsel. Ein
schwarzes Pixel ist bei OLED aus und altert überhaupt nicht; eine helle Szene
verschleißt das Panel weiter, auch wenn sich etwas darin bewegt. Bewegung
bewahrt vor einem eingebrannten *Muster*, nicht vor dem Verschleiß. Der
Szenenwechsel bleibt trotzdem drin — für die kurze Pause, in der jemand
hinschaut.

Liegt nur eine Szene im Ordner, geht der Monitor einfach dorthin und bleibt.
Damit ist der Fall „eine Szene mit Bewegung darin" ohne eigene Einstellung
abgedeckt.

Als Ruhe zählt, dass niemand außer den Monitoren etwas tut. Der
`userActivity`-Rundruf trägt das ohnehin — Mauszeiger, Lineal, Ziele,
Szenenwechsel. Ausgewertet wird der *Absender*, nicht die Nachricht: Die
Monitore senden beim Wechseln selbst mit, und die eigene Bewegung als Aktivität
zu zählen hieße, dass der Bildschirmschoner sich im Kreis selbst aufweckt.

Der Monitor meldet dem Spielleiter über den Socket, wenn er sich selbst
beschäftigt. Ohne das würde die Buchführung aus 14.2609.14 die Bildschirmschoner-
Szene pflichtbewusst als „da gehört er hin" ablegen — und das Fixierziel wäre
nach der ersten Pause weg.

## 14.2610.1 — 2026-08-29

**Standard-Begleitszene.** Bisher zeigte ein nicht fixierter Szenen-Monitor
schlicht dieselbe Karte wie der Battlemap-Monitor — also genau das, wofür man
den zweiten Bildschirm nicht braucht. Jetzt lässt sich eine Szene hinterlegen,
auf die er fällt, wenn die aktivierte Battlemap selbst keine Begleitszene
benennt. Einzustellen in der Steuerung oder per Rechtsklick auf eine Szene.

Die gesamte Rangfolge steht jetzt an einer Stelle (`resolveDisplayTarget`), vom
Genauesten zum Allgemeinsten:

| | |
|---|---|
| 1 | eine an der Battlemap benannte Begleitszene |
| 2 | fixiert — stehen bleiben |
| 3 | die Standard-Begleitszene |
| 4 | der Aktivierung folgen |

Dass 1 über 2 steht, ist Absicht und war schon so: Eine von Hand gelegte
Verknüpfung ist die genauere Anweisung als ein allgemeines „bleib stehen".

**Nebenwirkung, bewusst:** Begleitszenen wirken jetzt auch bei gelöster
Fixierung. Vorher griffen sie nur im fixierten Zustand, was mit der
Standard-Begleitszene nicht mehr zusammengepasst hätte.

Außerdem wird die Deaktivierung der abgehenden Szene auf dem Szenen-Monitor
jetzt ausnahmslos verschluckt. Sie lässt sich für sich genommen nicht
beurteilen — die Entscheidung hängt an der Szene, die *aktiviert* wird, und die
steht zu diesem Zeitpunkt nicht verlässlich fest. Nebenbei entfällt damit das
kurze Schwarz zwischen zwei Szenen.

## 14.2609.14 — 2026-08-29

Drei Meldungen vom Tisch, eine gemeinsame Ursache.

**Fixieren aus dem Kontextmenü nimmt jetzt die angeklickte Szene.** Vorher
fixierte es den Monitor dort, wo er zufällig stand — die Szene, auf die man
ausdrücklich rechtsgeklickt hatte, wurde übergangen. Der Schalter in der
Steuerung und `Alt+T` bedeuten weiterhin „bleib, wo du bist"; dort steht ja keine
Szene in der Frage.

**Das Abzeichen klebte an der alten Szene,** wenn der Monitor von Hand
verschoben wurde, und beim Lösen sprang die Ansicht dann scheinbar wahllos
irgendwohin. Beides derselbe Grund: Der gespeicherte Wert steuert Abzeichen und
Lösen, und er veraltete.

Bisher wurde jeder Weg einzeln nachgehalten — unser eigenes Schieben, der
Begleitszenen-Sprung — womit jeder Weg unabgedeckt blieb, an den niemand gedacht
hatte. Jetzt gibt es **eine** Stelle, die mitbekommt, dass der Monitor sich
bewegt hat, gleich wodurch.

Foundry hält `user.viewedScene` aus einem `userActivity`-Rundruf aktuell, feuert
dabei aber keinen Hook, und die zuständige Methode ist privat und statisch, also
nicht überschreibbar. Wir hören deshalb denselben Rundruf mit: Auf einem
Socket-Ereignis dürfen mehrere Empfänger sitzen, und weil wir `sceneId` direkt
aus der Nachricht lesen, ist die Reihenfolge egal. Nur bei gesetzter Fixierung —
sonst steuert der Wert nichts und jede Schreibung wäre ein Rundruf an alle.

`noteCompanionJump` aus 14.2609.9 entfällt damit; der Sprung ist eine Bewegung
wie jede andere und wird mit erfasst.

## 14.2609.13 — 2026-08-29

**Ein fixierter Szenen-Monitor wird nicht mehr mitgerissen.** Foundrys „alle
Spieler hierher ziehen" holte ihn mit — also genau das, wogegen die Fixierung
gedacht ist. Die Sperre auf `_onActivate` deckt nur die Szenen*aktivierung* ab;
ein Zug läuft über `Scene#pullUsers` und ging bisher ungehindert durch.

Gefiltert wird auf der Seite des Spielleiters, nicht auf dem Monitor: Die
Socket-Nachricht eines pauschalen Zugs ist Byte für Byte dieselbe wie die
unseres gezielten — der Monitor kann sie nicht auseinanderhalten, der
Spielleiter schon, weil er den Aufruf macht. Gezielte Züge tragen deshalb eine
Kennzeichnung und kommen weiterhin durch. Der Battlemap-Monitor bleibt
unberührt, er folgt weiterhin allem.

**„Spieler hierher holen" wählt jetzt alle vor,** außer dem Szenen-Monitor. Wer
schon auf der Szene steht, wird nicht mehr ausgelassen: Das Fenster ist trotzdem
irgendwo anders hingescrollt, und der Sinn des Knopfes ist, dass danach alle
dasselbe sehen.

## 14.2609.12 — 2026-08-29

**„Spieler hierher holen" steht jetzt auch im Szenen-Kontextmenü.** Der Dialog
war fertig und über die Steuerung erreichbar, aber der Eintrag im Kontextmenü
fehlte — obwohl die Anleitung ihn beschrieb. Der Import in `main.js` lag
ungenutzt herum, was genau das verriet.

Aus dem Kontextmenü heraus zielt der Dialog auf die **angeklickte** Szene, nicht
auf die gerade betrachtete. Das ist der eigentliche Gewinn gegenüber dem Knopf in
der Steuerung: Leute irgendwohin holen, ohne selbst erst dorthin zu wechseln.

## 14.2609.11 — 2026-08-29

**Linealbeschriftungen bleiben am Lineal.** Bei gedrehten Szenen flogen sie in
eine Ecke der Karte — die „25 ft" stand weit weg von der Strecke, zu der sie
gehörte. Der Fehler war unserer: Die Gegendrehung, die die Schrift aufrecht
hält, traf *jedes* direkte Kind von `#hud`.

Das ist für ein Token-Menü richtig — 45 × 45 Pixel, am Token hängend, um die
eigene Mitte gedreht bleibt es dort und steht gerade. Für `#measurement` ist es
falsch: Der Container ist bildschirmfüllend (gemessen 2121 × 1624), und seine
Kinder tragen ihre eigene Position. Dreht man ihn um seine Mitte, wandert alles
darin quer über den Bildschirm.

Jetzt wird unterschieden: Angeheftete Menüs drehen um ihre Mitte, Lineal-
beschriftungen und Sprechblasen einzeln um den Ankerpunkt, den Foundry ihnen
ohnehin schon gibt. Gemessen: Um diesen Anker gedreht bleibt eine Beschriftung
genauso nah an ihrem Wegpunkt wie ganz ohne Drehung (6 px), um die Mitte gedreht
dreimal so weit.

Sprechblasen waren vom selben Fehler betroffen und sind mit erledigt.

## 14.2609.10 — 2026-08-29

Verträglichkeit mit Lock View bei gedrehten Szenen.

Lock View steuert bei vielen Tischen die Monitore, weiß aber seit 2.0.0 nichts
mehr von Drehung. Sobald eine Szene bei uns auf 90° oder 270° steht, meint sein
„Breite" etwas anderes als der Bildschirm — zwei Werte stimmen dann nicht mehr.
Beides wird jetzt auf unserer Seite korrigiert, ohne Lock View zu verändern.

**Einpassung.** `horizontal` rechnete die Szenenbreite gegen die Fensterbreite.
Gedreht füllt aber die Szenen*höhe* den Bildschirm der Breite nach. Gemessen auf
einer 3360 × 4340-Karte bei 2290 px Fensterbreite: Maßstab 0,6815 statt 0,5276 —
die Karte war 29 % zu groß, Bug und Heck fielen weg. Betrifft ebenso
`autoInside` und `autoOutside`; `physical` und `off` bleiben unberührt.

**Ansichtsrahmen.** Der Monitor meldete seinen sichtbaren Ausschnitt mit
vertauschten Seiten, der Spielleiter sah einen Rahmen, der nicht stimmen konnte.
Bei genau 90° und 270° bleibt ein Bildschirmrechteck in der Welt achsenparallel,
nur mit getauschten Maßen — zwei Zahlen zu tauschen macht den Rahmen deshalb
*exakt* richtig, nicht bloß ungefähr.

**Hinweis im Szenen-Fenster,** wenn Lock View erkannt wurde und die Szene quer
steht. Sonst sucht man den Zusammenhang später vergeblich.

Alles über Merkmalsprüfung abgesichert: Ohne Lock View passiert nichts, das Modul
bleibt eigenständig. Schlägt eine der beiden Korrekturen fehl — etwa weil ein
Lock-View-Update die Methode umbaut — bleibt es beim bisherigen Verhalten statt
bei einem Absturz.

Dazu zwei Fehler aus dem Testbetrieb: Beim Fixieren wird jetzt immer die Szene
übernommen, auf der der Monitor gerade steht (vorher konnte ein alter Wert ihn
im Moment des Fixierens woandershin reißen), und ein Sprung auf eine
Begleitszene wird vom Spielleiter mitgeschrieben — der Monitor selbst darf keine
Welt-Einstellung ändern, wodurch der gespeicherte Stand veraltete.

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
