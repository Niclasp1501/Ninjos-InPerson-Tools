# Changelog

## 14.2611.44 — 2026-09-06

**Leistengröße vom Spieler einstellbar.** Ein Regler in der zweiten
Knopfgruppe (60–140 %), je Gerät gemerkt. Die automatischen Stufen nach
Bildschirmbreite (85 % unter 1100 px, 72 % unter 850 px) sind nur noch der
Ausgangspunkt — hochkant war die volle Größe gerade richtig, quer zu groß,
und das entscheidet besser, wer das Tablet in der Hand hat.

Behoben: Beim ersten Ziehen nach dem Laden sprang die Knopfleiste um eine
halbe Breite zur Seite (Griff nach dem Wechsel des transforms gemessen).

## 14.2611.42 — 2026-09-06

**Hochformat: Leisten unten.** Hochkant sitzen die Attribute im Kopf des
Blatts genau dort, wo die Leisten quer noch über dem Banner schweben —
gemessen: die Knopfleiste lag auf STÄ, GES und KON. Im Hochformat stehen
beide jetzt unten in der Mitte, die Zeitleiste über der Knopfleiste; beim
Drehen ordnen sie sich neu. Gezogene Plätze gewinnen weiterhin.

**Das Blatt kommt wieder, wenn es geschlossen wird.** Escape schließt in
Foundry das oberste Fenster — in dieser Ansicht das Blatt, und der Schirm
war schwarz. Jetzt öffnet es sich sofort wieder; Escape im Lautstärkefeld
bleibt beim Feld.

**Einstellungsseite entschlackt.** Drei Erklärkästen sind raus, die Texte
stecken hinter (i); die Kontenliste ist das Erste, was man sieht.

## 14.2611.41 — 2026-09-06

**Lautstärke in der Leiste.** Ein Knopf in der zweiten Gruppe öffnet drei
Regler — Musik, Umgebung, Oberfläche — unter der Leiste. Es sind Foundrys
Geräte-Einstellungen; das Tablet neben dem Fernseher kann stumm sein, ohne
dass der Tisch etwas merkt.

Entschieden: Seitenfenster bleiben **über** dem Blatt (kein Schmalermachen),
Sheet Only bleibt vorerst installiert, kein Konto bekommt beides.

## 14.2611.40 — 2026-09-05

**Die Blattansicht bekommt ihre eigene Seite — und wählt Konten einzeln.** Der
Beta-Schalter allein traf jeden Spieler mit Charakter, auch den am Laptop, der
seine Szenenliste braucht. Jetzt: Hauptschalter plus Liste der Spielerkonten
mit Häkchen, wie beim Tischmodus. Spielleiter stehen nicht in der Liste.

Dazu auf derselben Seite: **Spielfeld abschalten** (dieselbe Maschinerie wie
im Tischmodus; das Tablet fragt einmal nach einem Neuladen), **Chat beim
Würfeln aufklappen** (nur bei eigenen Nachrichten) und die **Haltezeit** zum
Verschieben der Leisten.

**Knöpfe anderer Module.** Die Leiste nimmt Knöpfe über
`game.modules.get("ninjos-inperson-tools").api.sheetView.registerButton()`
an; wer vor uns fertig ist, bekommt den Hook `ninjosInPersonTools.ready`.
Kein Element mit fremder Kennung, das jemand im DOM suchen müsste. FANG und
NDRS melden sich ab ihren nächsten Fassungen darüber an.

In der zweiten Knopfgruppe neu: **Schrift zurücksetzen** und **Einstellungen**
(Foundrys Einstellungsfenster — Lautstärke, Sprache, Moduleinstellungen, an
die ein Spieler sonst nicht mehr käme).

**Der Mond ist wieder gezeichnet.** Das Phasenbild des Kalendermoduls war auf
28 Pixel weder rund noch scharf. Jetzt eine Vektorscheibe mit echter Phase aus
dem Kalender, leichtem Verlauf und Hof.

## 14.2611.39 — 2026-09-05

**Die Kuppel steht hinter der Zeitleiste**, ihr Fuß verschwindet unter der
Pille — wie im Original. Vorn aufgelegt sah sie aus wie ein Aufkleber. Ein Kind
kann nicht hinter den Hintergrund seines Elternteils; also liegt der
Hintergrund der Pille jetzt auf einem Pseudoelement über der Kuppel, der Text
darüber. Dazu zwei Positionsfehler, die erst am Bildschirm auffielen: Die Kuppel
stand 66 Pixel über dem oberen Rand (falscher Bezug), und die Pille war nach
rechts verrutscht (geerbtes `left: 50%` als Versatz).

Neu dabei: `ANALYSE-blattansicht-vs-sheet-only.md` — was Sheet Only kann, wo
wir stehen, was fehlt, und die offene Frage, ob ein Seitenfenster das Blatt
schmaler macht oder es überdeckt.

## 14.2611.38 — 2026-09-05

**Die Kuppel sitzt mittig auf der Zeitleiste, der Text darunter** — wie im
Original. Zuvor stand sie links und der Text daneben; das war die falsche
Anordnung, nicht nur die falsche Größe. Dazu größer (152 × 78) und der Himmel
in dunklem Nachtblau statt Türkis.

## 14.2611.37 — 2026-09-05

**Die Leisten starten oben in der Mitte**, über dem Banner des Blatts: die
Zeitleiste mit Kuppel oben, die Knopfleiste direkt darunter — so, wie der Tisch
sie sich hingeschoben hatte. Die Knopfleiste setzt sich beim Start unter die
Zeitleiste, weil die mit Kuppel deutlich höher ist als ohne. Verschobene Plätze
gewinnen weiterhin.

## 14.2611.36 — 2026-09-05

**Die Kopfzeilen-Knöpfe des Blatts sind in der Blattansicht weg** — bis auf
den ⋮ mit den Blatt-Einstellungen. Bildpfad kopieren, Fenster ausklappen,
Porträt/Token, UUID kopieren: Schreibtisch-Werkzeug, auf einem Tablet ohne
Zwischenablage und zweites Fenster nur Ziele für Fehlgriffe.

## 14.2611.35 — 2026-09-05

**Das Blatt füllt den Schirm Kante an Kante, wie bei Sheet Only.** Zwei Umwege
sind wieder ausgebaut. Oben hatte ich die Fensterkopfzeile ganz entfernt und
dann zehn Pixel Luft gelassen, damit das Porträt nicht am Rand klebt — im Spalt
war der blaue Seitenhintergrund zu sehen. Sheet Only behält die Kopfzeile und
versteckt nur den Schließen-Knopf; sie gibt dem Blatt oben von selbst seinen
dunklen Rand. Genau so jetzt. Unten lag ein roter Sockel: eine `padding-bottom`
auf dem Fensterinhalt, die dessen Hintergrund freilegte. Weg damit — die Leisten
liegen einfach über dem Blatt, wie ihre Vorbilder auch.

**Kein Gold an den Leisten.** Das ist HUD über dem Blatt, nicht das
D&D-Fensterdesign; dort war der Goldrand viel zu laut. Beide Leisten tragen
jetzt denselben leisen Rand wie die Zeitleiste von Anfang an, der Saum der
Kuppel ist auf die Hälfte gedämpft.

## 14.2611.34 — 2026-09-05

**Die Knopfleiste ist deckend, dunkel und passt zur Zeitleiste.** Vorher war
sie eine halbdurchsichtige helle Pille mit Weichzeichner — auf einfarbigem
Grund hübsch, hier aber über der Kante zwischen dem roten Sockel des Blatts
und dem dunkelblauen Seitenhintergrund, und beides schimmerte durch: oben rot,
unten blau, dazwischen Matsch. Dazu eckige Knöpfe in einer runden Form, die sie
an den Enden anschnitt.

Jetzt undurchsichtig, damit der Untergrund keine Rolle spielt; dunkel mit
Goldrand wie die Zeitleiste daneben, damit die beiden als Paar lesbar sind; und
abgerundete Quadrate in einer nur wenig runderen Leiste, damit nichts
anschneidet. Die Zeitleiste hat denselben Goldrand bekommen.

## 14.2611.33 — 2026-09-05

**Die Himmelskuppel sitzt jetzt auf der Zeitleiste, nicht in ihr.** Dreimal
hatte ich den Bogen in die Leiste gesetzt und sie damit auf 86 Pixel
aufgeblasen. Im Original ist die Leiste dünn und die Kuppel steht oben darauf
wie ein Uhrglas. Genau so ist es jetzt: eine 34 Pixel flache Pille, links eine
Halbkuppel mit Goldrand, die darüber hinausragt, der Mond darin gut erkennbar.

**Das Blatt hat oben Luft.** Bei `inset: 0` saß das Porträt auf dem ersten
Pixel und die Kopfzeile wirkte abgeschnitten. Zehn Pixel Rand, wie Sheet Only
ihn aus demselben Grund lässt.

**Was Sheet Only am Blatt für den Finger ändert, gilt hier ebenso:** dünne
Rollbalken, kein Größengriff, engere Reiter-Ränder bei Tidy5e, und unten Platz
für die beiden Leisten, damit die letzte Zeile nicht darunter verschwindet.

**Das Aufblitzen beim Schließen ist weg — gemessen, nicht vermutet.** `close()`
ist asynchron; bis es fertig war, stand der Rahmen ein, zwei Bilder lang da.
Das Verstecken passiert jetzt synchron im Klick selbst, das Schließen danach.
Alle 16 Millisekunden nachgesehen, 700 Millisekunden lang, drei Flächen: null
Proben, in denen noch ein Rahmen zu sehen war. Vorher zeigte ihn schon die
erste. Ein Seitenleisten-Fenster ist in der Blattansicht überhaupt nur dann
sichtbar, wenn wir es geöffnet haben — alles andere, Geister eingeschlossen,
bleibt unsichtbar. Der Akteure-Knopf im Sheet-Only-Modus versteckt den Rahmen
ebenfalls, bevor er ihn schließt.

## 14.2611.32 — 2026-09-05

**Beim Ziehen flog alles mit.** Wer die Knopfleiste anfasste, verschob auch die
Zeitleiste. Der Grund war ein Anfängerfehler von mir: Die Funktion, die eine
Leiste verschiebbar macht, läuft **zweimal** — einmal je Leiste —, aber
Griffpunkt und gegriffenes Element lagen als gemeinsame Variablen daneben. Also
las die eine, was die andere gerade gesetzt hatte, und beide bewegten sich.

Jede Leiste hat jetzt ihren eigenen Zustand. Geteilt bleibt nur die eine Angabe,
die geteilt gehört: ob gerade gezogen wurde, damit der Klick danach nicht auch
noch einen Knopf auslöst.

## 14.2611.31 — 2026-09-05

**Die Phantomseite ist weg — es waren drei Fehler, nicht einer.** Gefunden, weil
diesmal alle Wege durchprobiert wurden statt nur der eine, der schon
funktionierte.

*Ein Wettlauf.* Öffnen und Schließen sind beide asynchron und dauern
unterschiedlich lang; wer zweimal kurz hintereinander tippt, startet das zweite,
bevor das erste fertig ist. Gemessen: zwölf Runden schnelles Auf und Zu ließen
**zwei Fenster offen**. Die Umschaltungen laufen jetzt der Reihe nach.

*Ein Rahmen ohne Anwendung.* Foundry meldete für das Notiz-Verzeichnis
`rendered: false` und ließ sein Element trotzdem im Dokument stehen. Meine
Prüfung suchte nach *leeren* Rahmen — dieser hatte Inhalt und rutschte durch.
Jetzt wird gefragt, was die Anwendung selbst über sich sagt; das ist die
verlässlichere Auskunft.

*Und ein hausgemachter.* Das Akteursverzeichnis bauen wir selbst, weil Monks
Little Details `renderPopout` abfängt — es hängt deshalb **nicht** an
`app.popout`, und genau dort habe ich es zu schließen versucht. Es blieb offen
und meldete dabei fröhlich `rendered: true`. Wir merken uns jetzt, was wir
aufgeklappt haben.

Geprüft: einzeln auf und zu, zwölf Runden im 450-Millisekunden-Takt, fünfzehn im
60er, fünfundzwanzig im 30er. Danach jedes Mal null offene Fenster.

## 14.2611.30 — 2026-09-05

Drei Fehler in der Blattansicht, die ich hätte sehen müssen, statt Zahlen aus
dem DOM zu lesen.

**Die Schriftknöpfe taten nichts.** Sie setzten eine Schriftgröße, und Tidy5e
setzt seine Maße selbst — unsere Variable erreichte keines davon. Gemessen: eine
Schaltfläche blieb bei 140 × 28 Pixeln, egal wie oft man drückte. Jetzt über
`zoom`, damit werden daraus 196 × 39. Und weil `zoom` auch den Kasten skaliert
— aus `100vw` wurden bei Faktor 1,4 dreitausend Pixel auf einem
zweitausend-Pixel-Schirm —, wird die Größe des Blattes gegen den Zoom gerechnet.
Es füllt jetzt bei jedem Faktor genau das Fenster.

**Die beiden Leisten lagen aufeinander.** Ein gespeicherter Platz aus früheren
Fassungen legte die Knöpfe mitten auf die Uhr. Ein gemerkter Platz wird jetzt
verworfen, wenn er die andere Leiste überdeckt.

**Und sie schnitten das Blatt oben ab.** Dort steht bei jedem Charakterblatt die
Kopfzeile mit Name, Bild und Werten. Beide sind an den unteren Rand gezogen —
links die Knöpfe, rechts die Zeit. Das ist der leerste Teil jedes Blattes, und
auf einem Tablet der, den der Daumen erreicht.

## 14.2611.29 — 2026-09-05

**Symbole statt Wörter** in der Leiste der Blattansicht. Wörter machen sie breit
und sind in jeder Sprache anders lang; das Symbol bleibt gleich groß, der Name
steht im Tooltip und in der Bedienhilfe. Dazu ein runder, durchscheinender
Rahmen und ein abgesetzter Umschalter in Modulrot.

**Die Leiste klebt nicht mehr an der Zeitleiste.** Sie stand mittig oben, die
Zeit direkt darunter — zwei Dinge, die wie ein Block aussahen. Jetzt links oben
und rechts oben, mit Abstand.

**Das Geisterfenster ist weg.** Wer eine Fläche öffnete und schloss, ließ einen
leeren Rahmen zurück — dasselbe Problem, das das Akteurspanel schon einmal
hatte. Dessen Lösung lag dort vergraben; sie steht jetzt in `shells.js`, und
beide benutzen sie. Foundry räumt die Hülle zu keinem festen Zeitpunkt weg,
deshalb wird mehrfach nachgesehen.

**Und ein Fehler beim Verschieben:** Wer `left` setzt, ohne `right` zu löschen,
hat beides gesetzt — das Element wird gedehnt statt verschoben. Gemessen: 107
Pixel hingen über den rechten Rand hinaus, obwohl der Code klemmt.

## 14.2611.28 — 2026-09-05

**Zeitleiste und Knopfleiste sind getrennt.** Mit dem Himmelsbogen darin wurde
die Knopfleiste 833 Pixel breit und 96 hoch — alles andere als klein. Es sind
auch zwei verschiedene Dinge: die eine wird bedient, die andere angeschaut.
Jetzt 277 × 54 für die Knöpfe, die Zeit steht daneben, beide für sich
verschiebbar mit eigenem gemerktem Platz.

## 14.2611.27 — 2026-09-05

**Die Leiste der Blattansicht ist jetzt klein, durchscheinend und
verschiebbar.** Meine erste Fassung stellte neun Knöpfe nebeneinander und klebte
oben in der Mitte fest — falsch in allen drei Punkten.

*Klein, weil sie umschaltet:* Sie zeigt eine Gruppe zur Zeit, und ein ☰ wechselt.
Vorn steht, was man dauernd braucht (Wer, Chat, Notiz, Tausch), dahinter das,
was man einmal am Abend tut (Schriftgröße, Vollbild, Abmelden). Es fällt nichts
weg, es steht nur nicht alles gleichzeitig da.

*Verschiebbar per langem Druck:* Auf einem Touchscreen ist jede Berührung erst
einmal ein Tipp. Zöge die Leiste sofort, wäre kein Knopf mehr zu treffen. Also
kurz halten, dann folgt sie — und wer gezogen hat, löst beim Loslassen keinen
Knopf aus. Der Platz wird je Gerät gemerkt, aber nur zurückgeholt, wenn er auf
diesem Schirm auch liegt: Wer die Leiste am großen Monitor nach außen schiebt,
soll sie auf dem Tablet wiederfinden.

*Durchscheinend*, weil sie auf dem Blatt liegt und nicht verdecken soll, was
darunter steht.

## 14.2611.26 — 2026-09-05

**Der Himmelsbogen nimmt jetzt Calendarias eigene Mondbilder.** Zuerst hatte ich
die Sichel selbst gezeichnet, um nicht an fremden Dateien zu hängen — am Tisch
sah das schlechter aus als das Vorbild, und das Vorbild *ist* das Bild, dessen
Pfad ohnehin in den Phasendaten steht. Also wird es genommen, wenn es da ist,
und selbst gezeichnet, wenn nicht.

Außerdem ist der Bogen eine **Kuppel** statt eines flachen Streifens und wird
eins zu eins dargestellt: 190 × 76 Pixel. Zweimal war er zu klein geraten, beide
Male aus demselben Denkfehler — ich hatte ihn als Teil der Leiste gedacht und
auf deren Höhe gestaucht. Er ist aber ein Bild und bestimmt seine eigene Größe.

## 14.2611.25 — 2026-09-05

**Erste Fassung der eigenen Blattansicht — als Beta, standardmäßig aus.**
Sie gibt Spielern den ganzen Bildschirm für ihr Charakterblatt und ersetzt
Foundrys Oberfläche durch eine schwebende Leiste: Wer, Chat, Notiz, Tausch,
Schrift kleiner und größer, Vollbild, Abmelden — dazu die Zeitleiste. Entwurf
und Begründungen in `KONZEPT-blattansicht.md`.

**Verdecken statt umbauen.** Foundrys Oberfläche bleibt vollständig da und
funktionsfähig; sie wird nur nicht gezeigt. Module, die Teile davon
voraussetzen, laufen weiter, und der Weg zurück ist eine Klasse am `body`.

**Die Meldungen bleiben sichtbar** — der eine Punkt, an dem wir es bewusst
anders machen. Wer `#notifications` mit ausblendet, nimmt sich die Möglichkeit,
dem Spieler überhaupt noch etwas zu sagen; genau dafür brauchte es im
Sheet-Only-Modus einen eigenen Streifen.

Spielleiter sind nie betroffen: Sie brauchen die Oberfläche, die hier
verschwindet.

## 14.2611.24 — 2026-09-05

**Ein Sonnen- und Mondbogen in der Zeitleiste.** Er zeigt, wo Sonne oder Mond
gerade stehen, mit der Phase des Mondes — ein Blick sagt „die Sonne ist seit
einer Stunde weg", wofür man sonst rechnen müsste. Einzuschalten unter
„Zeit & Wetter"; standardmäßig aus.

**Gerechnet, nicht abgeschrieben.** Alles kommt aus dem Weltkalender, den jeder
Client hat: `daylight` liefert längsten und kürzesten Tag samt Sonnenwenden,
daraus die Taglänge für heute; `moons` liefert Zykluslänge, Bezugsdatum und die
acht Phasen. Geprüft gegen die Werte dieser Welt — Tag 171 ergibt 16 Stunden,
Tag 354 genau 8. Die Mondsicheln zeichnen wir selbst, statt die Bilddateien
eines anderen Moduls zu laden; sonst hinge die Leiste an dessen Vorhandensein.
Ohne Kalenderangaben fällt der Bogen auf 06:00/18:00 zurück und lässt den Mond
weg, statt zu verschwinden.

Der Rechentest fand dabei gleich einen Fehler: Aus 19,99993 Stunden wurde
„19:60", weil die Minuten für sich gerundet auf 60 kamen. Jetzt wird erst auf
Minuten gerundet und dann geteilt.

## 14.2611.23 — 2026-09-05

**Der Akteure-Knopf öffnete das Verzeichnis nicht mehr.** Die Ursache liegt
nicht bei uns, landet aber auf unserem Knopf: Monks Little Details umwickelt
`ActorDirectory.prototype.renderPopout` und öffnet bei eingeschalteter Option
„open-actor" stattdessen das eigene Charakterblatt — ohne das Original
aufzurufen und ohne etwas zurückzugeben (dessen Zeile 293). Für einen Spieler
mit zugewiesenem Charakter im Sheet-Only-Modus ist dieses Blatt ohnehin das
Einzige auf dem Schirm. Also passierte sichtbar nichts.

Für deren Seitenleisten-Reiter ist das eine vertretbare Idee — ein Klick auf
„Akteure" heißt dort plausibel „mein Charakter". Für unseren Knopf nicht: Er
heißt Akteure und muss das Verzeichnis zeigen. Kommt der höfliche Weg leer
zurück, bauen wir das Fenster jetzt selbst, genau wie Foundrys eigener Code es
tut — und lassen deren Einstellung in Ruhe.

## 14.2611.22 — 2026-09-05

**Sheet Onlys Journal-Knopf sah aus, als täte er nichts.** Er tut etwas: Er
klappt Foundrys Notiz-Verzeichnis als schmale Spalte am rechten Rand auf. Nur
war die **201 Pixel hoch** — ein kleiner Kasten in der oberen rechten Ecke, den
man auf einem Tablet schlicht übersieht.

Der Grund liegt bei uns: Wir heften in diesem Modus das Akteursverzeichnis
selbst an den rechten Rand, weil Foundry die Lage einer ausgeklappten
Seitenleiste aus der Position ihres Reiters berechnet — und der steckt in Sheet
Only im versteckten `#interface`. Für unser eigenes Verzeichnis hatten wir das
gelöst, für die der Nachbarn nicht. Das war die falsche Hälfte einer Reparatur.

Jetzt gilt dieselbe Verankerung für **jedes** ausgeklappte Seitenleisten-Fenster,
solange Sheet Only läuft: rechter Rand, volle Höhe. Außerhalb dieses Modus
ändert sich nichts — dort stimmt Foundrys eigene Platzierung.

## 14.2611.21 — 2026-09-05

**Der Tausch hat jetzt seine eigene Seite**, wie Tischmodus, Monitore und
Zeitleiste. Seine drei Schalter standen als einzige noch flach in der
Einstellungsliste und ließen diese aussehen wie die Einstellungen des
Tischmodus mit Fremden darin.

Auf der Seite steht außerdem der Weg ins **Tauschbuch**. Das Journal liegt zwar
in der Seitenleiste, aber wer „wo ist das Schwert hin" nachschlägt, schaut in
diese Einstellungen und nicht in eine Liste von Journalen — also ist die Tür
dort, wo die Frage gestellt wird. Ist Item Piles aktiv, weist die Seite darauf
hin, dass dessen Tauschknopf besser abgeschaltet wird.

## 14.2611.20 — 2026-09-05

**Die Leiste ist eine Spielleiter-Sache, keine Geräte-Sache.** Die vier
Schalter waren pro Gerät gedacht — der Gedanke war, jeder solle über seinen
eigenen Bildschirm bestimmen. Der Tisch hat anders entschieden, und das ist
richtig: Was die Leiste trägt, ist eine Darstellungsfrage für die ganze Runde,
wie die Szene, auf die alle schauen. Alle fünf gelten jetzt weltweit, die Seite
öffnet nur der Spielleiter, und ein Spieler muss mitten im Spiel durch keine
Einstellungsseite geführt werden. Der doppelte Wetterschalter ist wieder weg —
der alte behält die Aufgabe, die er immer hatte.

**Der Wind steht jetzt mit Calendarias eigenem Wort und Zahlenband da**:
„Wind aus S · Stark, 41–60 km/h". Die *eine* Zahl aus dessen HUD („58 km/h")
wird bewusst nicht übernommen, und der Grund steht in dessen Quelltext:
`getWindSpeedKph` würfelt sie bei jedem Aufruf neu zwischen den Grenzen der
Stufe und speichert sie nirgends. Sie ändert sich, wenn man den Zeiger wegnimmt
und wieder hinbewegt, und zwei Leute am selben Wind bekommen zwei verschiedene
Werte. Das Band ist dieselbe Auskunft, nur ohne Würfel — und alle sehen
dasselbe. Ist bei Calendaria Meilen eingestellt, rechnet die Leiste mit.

## 14.2611.19 — 2026-09-05

**Jeder Teil der Leiste lässt sich einzeln ein- und ausblenden.** Datum,
Uhrzeit, Wetter, Jahreszeit — auf einer eigenen Seite „Zeit & Wetter", nicht als
fünf weitere Zeilen in der Einstellungsliste. Zwei Gruppen, weil es zwei Arten
von Schalter sind: vier gehören dem Gerät in deiner Hand, einer der ganzen
Runde. Nebeneinander als gleich aussehende Häkchen hätte nichts verraten, dass
einer davon den Abend für alle ändert. Die Weltzeile sieht nur der Spielleiter —
und wird beim Speichern nicht angefasst, wenn sie gar nicht im Formular stand,
sonst könnte jeder Spieler das Wetter stillschweigend für den Tisch abschalten.

**Die Chips zeigen jetzt, was das Kalendermodul wirklich weiß.** Auf der Leiste
ist Platz für ein Wort; im Tooltip stehen die lange Beschreibung, die Temperatur
und der Wind: „Windig / Starke Winde / 11 °C / Wind aus S · Stärke 3". Die
Windrichtung wird aus Grad in eine Himmelsrichtung gerechnet — das ist stabile
Arithmetik. Die Windstärke bleibt eine Stufe und wird nicht in km/h umgerechnet:
dafür müsste man eine Tabelle abschreiben, die einem anderen Modul gehört.

**Und die Greifhand ist weg.** Die Leiste hatte `pointer-events: none` — das
klang richtig, sie ist ja eine Beschriftung. Nur reicht das den Zeiger an das
weiter, was darunter liegt, und das ist Sheet Onlys ziehbare Knopfleiste: eine
Greifhand, die nichts greifen konnte, und Tooltips, die nie auslösen konnten.

## 14.2611.18 — 2026-09-05

**Die Leiste läuft auch ohne Calendaria** — geprüft, nicht angenommen. Foundrys
eigener Kalender „Simplified Gregorian" schreibt seine Jahreszeiten
ausschließlich über `monthStart`/`monthEnd` auf, 1-basiert, und sein Winter läuft
von Monat 12 bis Monat 2, also über den Jahreswechsel. Neun Fälle gegen beide
Kalender laufen jetzt als `tools/test-clock-seasons.mjs` durch, beide
Jahreswechsel eingeschlossen. Ohne Kalendermodul fehlt nur das Wetter; Datum,
Uhrzeit und Jahreszeit stehen weiterhin da. Der Einstellungstext behauptete das
Gegenteil und ist berichtigt.

**Beim Laden steht nicht mehr zehn Sekunden lang das falsche Datum.** Die
Nachschau läuft in der ersten Viertelminute im Sekundentakt und danach langsam —
ein Zeichenkettenvergleich, gebaut wird weiterhin nur bei echtem Minutenwechsel.

## 14.2611.17 — 2026-09-05

**Die Zeitleiste war da, nur nicht zu sehen.** Sheet Only hängt in seinen
Container ausschließlich die Akteursliste und die eigene Knopfleiste; das
Charakterblatt ist eine gewöhnliche Foundry-Anwendung am `body` und wird darüber
gemalt. Eine Leiste, die im Flex-Fluss dieses Containers bleibt, landet, wo Flex
sie hinlegt — auf einem echten Client gemessen: links 1001, oben 538 eines
2333×1104-Fensters. Mitten auf dem Schirm und hinter dem Blatt. Vorhanden, 34
Pixel hoch, in jeder Hinsicht richtig, außer dass niemand sie sehen konnte.

Sie steht jetzt oben in der Mitte, auf derselben Ebene wie Sheet Onlys eigene
Knöpfe, und nimmt keine Fingertipps an — sie ist eine Beschriftung, kein
Bedienelement, und darf dem Blatt darunter nichts wegnehmen.

## 14.2611.16 — 2026-09-05

**Die Zeitleiste zeigte den ganzen Abend ein falsches Datum.** Auf dem ersten
echten Sheet-Only-Client stand dort „31 Juli, -9", während die Welt auf
„1 Eleasis, 1492" stand. Calendaria setzt seinen Harptos-Kalender ein, *nachdem*
unser `ready` gelaufen ist — die erste Zeichnung benutzte also noch Foundrys
voreingestellten gregorianischen Kalender. Korrigiert hat sich das nie: die
Leiste zeichnet bei `updateWorldTime` neu, und das Spiel war pausiert.

Ein Datum, das falsch ist und sich nicht bewegt, ist schlimmer als gar keins —
eine Anzeige, die aussieht wie eine Uhr, zieht niemand in Zweifel. Jetzt schaut
die Leiste alle zehn Sekunden noch einmal hin. Das ist nur ein Vergleich; gebaut
wird weiterhin nur, wenn sich die angezeigte Minute wirklich geändert hat.

## 14.2611.15 — 2026-09-04

**Meldungen erreichten die Spieler nie, für die dieses Modul gebaut ist.**
Sheet Only blendet die Oberfläche nicht teilweise aus, sondern ganz — Foundrys
`#notifications` eingeschlossen (dessen index.js:902). Jedes „Roxy hat
abgelehnt", jedes „kein Spielleiter angemeldet", jedes „Tausch abgeschlossen"
wurde erzeugt, protokolliert und von niemandem gesehen.

**Der Tausch endet jetzt mit einem Bild statt mit einer Meldung.** Das Fenster
verschwindet nicht mehr wortlos, sondern wird zur Antwort: Porträt des anderen,
ein Satz, ein Knopf. Wer selbst abgelehnt hat, liest, was er getan hat; die
andere Seite liest, was ihr geschehen ist — „Roxy hat abgelehnt" ist für Roxy
der falsche Satz. Nach zwölf Sekunden schließt es sich von selbst, außer wenn
etwas schiefging: das ist die eine Nachricht, die gelesen worden sein muss.

**Warnungen vor dem Tausch** — kein Charakter zugewiesen, kein Spielleiter da,
schon in einem Tausch — erscheinen im Sheet-Only-Modus jetzt als Streifen in
dessen eigenem Behälter, dem einzigen Teil der Seite, der dort noch sichtbar
ist. Außerhalb bleibt es bei Foundrys Meldungen.

## 14.2611.14 — 2026-09-04

**Das Tauschfenster ließ sich nicht zurückholen.** Wer im Sheet-Only-Modus
danebentippte, schob es in den Hintergrund — und dort gibt es keine Leiste,
keine Fensterliste, überhaupt keine sichtbare Oberfläche, mit der man es wieder
nach vorn holen könnte. Eine Sackgasse, kein Schönheitsfehler. Sheet Only kennt
das Problem selbst und löst es mit einem festen `z-index` (dessen style.css 65
und 173); sein Behälter setzt Kinder auf 1000 und die Akteursliste auf 1001,
genau das lag über uns. Das Tauschfenster steht jetzt auf 9000 — über allem
davon, aber unter dem Würfelauflöser, der einen Wurf blockiert und gewinnen
muss. Zusätzlich holt der Tauschknopf ein laufendes Fenster wieder nach vorn.

**Auf dem Tablet hing es unten heraus.** 640 Pixel Höhe, darüber die
Browserleiste — und ganz unten die zwei Knöpfe, die den Tausch beenden. Die
waren schlicht nicht da. Die Größe ist jetzt ein Wunsch, der auf den
tatsächlichen Bildschirm heruntergerechnet wird, auch beim Drehen des Geräts.

Unter 620 Pixeln Breite stehen die beiden Seiten des Tischs übereinander statt
nebeneinander.

## 14.2611.13 — 2026-09-04

**Die Gegenstandssymbole sind jetzt wirklich da.** Der letzte Versuch — den SVG
als CSS-Maske zu verwenden — hat nicht getragen. dnd5e löst dasselbe Problem für
sich, indem es die Datei holt und den SVG in die Seite einsetzt, wo `--icon-fill`
greift (`dnd5e.mjs:64044`, sein `<dnd5e-icon>`). Genau diesen Weg gehen wir
jetzt auch: einmal je Pfad geholt, Skripte herausgeworfen, in unserem Rot
gezeichnet. Das braucht dnd5e nicht — es funktioniert für jedes System.

**Bilder der Beteiligten.** Wessen Spalte welche ist, war eine graue Zeile mit
einem Namen darin. Jetzt steht das Porträt des Charakters darüber, in der
Partnerliste, und groß auf der Anfrage — quer über den Tisch erkennbar, ohne zu
lesen. Name und Konto stehen untereinander, damit zwei ähnliche Namen
unterscheidbar bleiben.

**Zustimmung sieht man an der ganzen Spalte**, nicht an einem Wort in der
Kopfzeile: goldener Rahmen, warmer Grund. Es ist die eine Angabe auf diesem
Bildschirm, die darüber entscheidet, ob der nächste Fingertipp fremdes Eigentum
bewegt.

## 14.2611.12 — 2026-09-04

Drei Fehler, zwei davon hätten Sachen verschieben können, ohne dass jemand
zugestimmt hat.

**Ein Spielleiter konnte nichts beantworten.** Alle Nachrichten laufen über den
Spielleiter-Client — aber ein Socket liefert nie an den eigenen Absender zurück.
War der Spielleiter selbst einer der beiden Tauschenden, redete er also ins
Leere: sein „Ablehnen" wurde nie verarbeitet, kein Fenster schloss sich, niemand
bekam eine Meldung. Betraf genauso Zustimmen, Ändern und Abbrechen.

**Zwei angemeldete Spielleiter hätten jeden Tausch doppelt ausgeführt.** Jeder
Gegenstand zweimal angelegt, jede Münze zweimal verschoben. Diese Welt hat zwei
Spielleiterkonten, es hätte also nur beider Anwesenheit bedurft. Jetzt ist genau
einer zuständig: `game.users.activeGM` — den bestimmt jeder Client gleich, ohne
Absprache.

**Geld in Behältern stand nicht auf dem Tisch.** Es wanderte mit dem Behälter
mit, was richtig ist, aber angezeigt wurde nur der Inhalt an Gegenständen. Damit
wechselte Geld den Besitzer, das keiner der beiden je gesehen hatte — genau das,
was dieses Fenster verhindern soll. Steht jetzt in der Zeile unter dem Behälter,
verschachtelte Behälter eingerechnet.

Dazu: Eine Ablehnung nennt jetzt den Namen dessen, der abgelehnt hat.

Der Zustandsautomat wird ab jetzt ohne Browser geprüft — drei Foundry-Clients
werden nachgebaut, samt der Regel, dass ein Socket nicht an den Absender
zurückliefert. Genau diese Regel war der Fehler oben, und ein Test, der sie nicht
nachbildet, hätte ihn nie gefunden.

## 14.2611.11 — 2026-09-04

Vier Dinge am Tausch, nachdem er das erste Mal am Tisch lief.

**Die Gegenstandssymbole waren unsichtbar, nicht abwesend.** dnd5e zeichnet sie
als SVG mit `fill: var(--icon-fill, #fff)`. Ein `<img>` ist ein eigenes
Dokument, unsere Variablen kommen dort nicht an, also gewinnt der Rückfallwert:
weiß auf Pergament. SVGs werden jetzt als Maske verwendet statt als Bild
geladen, die Farbe kommt von uns. Das gilt für jedes System und färbt die
Symbole nebenbei in unser Rot statt in das, was das System zufällig mitbringt.

**Mengen bei Gegenständen wie beim Geld.** Vorher hatten Münzen 0/−10/−/+/+10/alles
und Gegenstände nur Minus und Plus. Acht von zwanzig Pfeilen zu übergeben ist
derselbe Vorgang wie acht von zwanzig Goldmünzen; jetzt sind es dieselben Knöpfe.
Bei Dingen, die es nur einmal gibt, bleibt es beim Antippen.

**Der Fensterrahmen ist jetzt auch D&D.** Bisher war nur das Innere unserer
Fenster gestaltet, der Rahmen darum blieb Foundrys Dunkelgrau — ein
Pergamentblatt in einer schwarzen Kiste. Kopfzeile dunkelrot mit goldener Linie,
Gold um das ganze Fenster, wie FANG es macht. Gilt für **alle** Fenster des
Moduls, nicht nur die des Tauschs; zwei Aussehen in einem Modul war genau das
Problem.

**Ziehen und Ablegen** kommt später. Auf dem Tablet kann es ohnehin nicht der
Hauptweg sein — dass `drop` dort nicht feuert, war der Anlass für die ganze
Funktion —, aber am Rechner wäre es bequem.

## 14.2611.10 — 2026-09-04

**Spieler können jetzt untereinander tauschen** — mit dem Finger, im
Sheet-Only-Modus, ohne ein weiteres Modul. Zwei Leute legen Gegenstände und Geld
auf einen Tisch, und erst wenn beide zustimmen, wird etwas bewegt.

Der Anlass ist, dass es dafür bereits eine Lösung gibt, die am echten Tisch nicht
funktioniert. Item Piles zieht Gegenstände per Maus von einer Liste in die
andere, und **das HTML5-Ereignis `drop` feuert auf einem Touchscreen überhaupt
nicht.** Auf dem Tablet, für das dieses Modul existiert, ist dieser Tausch also
nicht bedienbar — unabhängig davon, wie er eingestellt ist.

Hier ist deshalb alles ein Tippen. Zeilen sind 44 Pixel hoch, Mengen haben ein
Minus und ein Plus, und nichts braucht eine zweite Hand.

**Der Tisch ist das Fenster, die Auswahl legt sich darüber.** Ein Charakter mit
sechzig Gegenständen würde beide Seiten sonst auf eine Liste starren lassen, in
der niemand mehr sieht, worauf man sich eigentlich einigt. Der Tisch zeigt darum
nur, was daraufliegt; das Aussuchen passiert in einer Fläche, die ihn verdeckt
und wieder verschwindet. Solange ausgesucht wird, geht nichts über die Leitung —
der Partner sieht die Änderung einmal, am Ende, und nicht bei jedem Tippen.

**Der Spielleiter hält die Wahrheit.** Jede Änderung geht an seinen Client, der
die eine echte Fassung des Tauschs führt und sie an beide zurückschickt. Das
klingt nach einem Umweg und bringt dreierlei auf einmal: Die beiden Angebote
können nicht auseinanderlaufen, weil es nur eines gibt; niemand kann behaupten,
der andere habe etwas anderes zugesagt; und die Regel „ohne Spielleiter kein
Tausch" — die ohnehin gilt, weil nur er auf einem fremden Charakter Gegenstände
anlegen und löschen darf — ist keine Sonderbehandlung mehr, sondern einfach die
Funktionsweise.

**Jede Änderung setzt beide Zustimmungen zurück.** Ohne das könnte eine Seite
zustimmen, auf die andere warten und im letzten Moment etwas vom Tisch nehmen.

Beim Verschieben selbst gelten drei Regeln, und sie sind der Grund, warum das
Ganze ein eigenes Modul-Kapitel bekommen hat: **erst aufschreiben, dann
anfassen** — der Eintrag im Tagebuch „Tauschbuch" entsteht, solange beide
Inventare noch unberührt sind, und sagt deshalb immer, was *gemeint* war, auch
wenn das Verschieben auf halber Strecke umfällt. **Erst anlegen, dann löschen** —
bricht es dazwischen ab, existiert der Gegenstand zweimal statt gar nicht.
**Nichts anfassen, was nicht auf dem Tisch lag** — insbesondere wird nichts in
vorhandene Stapel des Empfängers einsortiert; ein Stapel, der mit dem Tausch
nichts zu tun hat, wird nicht verändert.

**Behälter wandern ganz.** Ein Beutel nimmt seinen Inhalt mit, samt der
verschachtelten Behälter darin und samt des Geldes, das im Beutel liegt. Was
darin ist, steht auf dem Tisch als Zeile unter dem Beutel — „Beutel" allein sagt
nicht, was übergeben wird.

Angeboten werden kann nur **Mitspielern, die gerade angemeldet sind.** Ein
Angebot an jemanden, der nicht da ist, kann niemand beantworten.

Drei Einstellungen: ob getauscht werden darf, ob der Spielleiter als Partner
erscheint (aus), und ob das Tauschbuch geführt wird (an).

*Wer Item Piles ebenfalls einsetzt, schaltet dessen `showTradeButton` besser ab —
sonst stehen zwei Tauschknöpfe nebeneinander.*

## 14.2611.9 — 2026-09-01

**Im Sheet-Only-Modus stehen jetzt Datum und Uhrzeit über dem Charakterblatt** —
und auf Wunsch Wetter und Jahreszeit dazu. Der Anlass ist eine Lücke, die man
erst am Tisch bemerkt: Sheet Only blendet die Oberfläche nicht teilweise aus,
sondern ganz. Damit ist auch die Uhr eines Kalendermoduls weg, und keine
Einstellung holt sie zurück, weil es nichts mehr gibt, worin sie erscheinen
könnte. Ausgerechnet am echten Tisch, wo die Leute sitzen, die nach der Uhrzeit
fragen.

Die Werte werden **gelesen, nicht geliehen.** `game.time` erreicht jeden Client,
ob er ein Spielfeld hat oder nicht; das Wetter steht in einer Welteinstellung von
Calendaria. Dessen HUD bleibt unangetastet — es umzuhängen hieße, sich bei jedem
Zeitschritt mit seinem Neuzeichnen anzulegen, und es erscheint alle ein bis drei
Wochen neu.

Das hat einen zweiten Nutzen, mit dem ich nicht gerechnet hatte: **Die Worte sind
unsere.** Calendarias Harptos-Kalender nennt seine Wochentage „Onesday" bis
„Tenday" als feste Zeichenketten, ohne Übersetzungsschlüssel dahinter — keine
Sprachdatei käme da heran. Die Leiste formatiert selbst und zeigt Deutsch.

Neu gezeichnet wird nur bei einem Wechsel der **angezeigten Minute**. Läuft die
Uhr in Echtzeit mit einem Vielfachen — bei mir zwei Spielsekunden je echter
Sekunde —, feuert `updateWorldTime` im Sekundentakt. Sechzig Neuaufbauten für
eine sichtbare Änderung, ausgerechnet auf den Tablets, die am wenigsten übrig
haben.

Ob die Leiste erscheint, entscheidet **jedes Gerät für sich**; ob Wetter und
Jahreszeit mitlaufen, die Spielleitung. So steht es auch im Werkzeugkasten-
Konzept: Was ein Spieler je anfasst, gehört in die einfache Liste, nicht in ein
Fenster, das nur die Spielleitung öffnen kann.

Aussehen und Maße sind an einer laufenden Calendaria-Leiste abgenommen — Text
`rgb(224 224 224)`, Signika, die Uhr in Monospace, damit die Minuten den Streifen
nicht seitlich verschieben. Die Regeln sind trotzdem eigene: Calendarias
Stilvorlage sind 253 KB, die an ATLAS-Farbvariablen hängen, welche nicht einmal
auf `:root` liegen. Wo es diese Variablen gibt, folgt die Leiste ihnen; wo nicht,
greifen eigene Werte.

Manifest und README sagen das jetzt auch: `sheet-only` und `calendaria` stehen
als empfohlene Module drin, mit Begründung, und beide Sprachfassungen der README
haben einen Abschnitt dazu.

## 14.2611.8 — 2026-09-01

**Die Akteursauswahl von Sheet Only lässt sich jetzt durch ein Seitenpanel
ersetzen** — eine Funktion, die bisher in FANG steckte. Dort war sie am falschen
Ort: Sie räumt die Oberfläche eines fremden Moduls um, damit man bequemer am
Tisch spielt. Das ist die Aufgabe dieses Moduls, nicht die eines Werkzeugs für
Beziehungsgeflechte.

Eingeschaltet blendet sie den Auswahlknopf von Sheet Only aus und setzt einen an
seine Stelle, der Foundrys Akteursverzeichnis rechts am Rand aufklappt; das
Charakterblatt gibt dafür 300 Pixel her und holt sie sich danach zurück.
**Standardmäßig aus** — ein Modul, das ungefragt in der Oberfläche eines anderen
umräumt, ist ein schlechter Gast.

Die Abwehr gegen Foundrys leere Fensterhüllen ist unverändert mitgezogen. Sie
ist der Grund, warum der Code so misstrauisch aussieht: Nach dem Schließen bleibt
in v13 der Rahmen ohne Inhalt stehen. Dann hält die CSS-Bedingung das Blatt
schmal neben nichts, und der Knopf weigert sich, noch einmal zu öffnen. Deshalb
wird mehrfach nachgeräumt — als Mikrotask, nach 0, 50 und 250 Millisekunden und
über fünf Bildwechsel, weil Foundry die Hülle zu keinem festen Zeitpunkt entfernt.

Neu dazu kommt `sheet-only.js`: alles, was dieses Modul über Sheet Onlys Aufbau
weiß, an einer Stelle. Sheet Only ist für Foundry 13.351 eingetragen, während wir
auf 14 laufen — wenn dort etwas wandert, ist künftig ein Selektor falsch statt
vieler.

## 14.2611.6 — 2026-08-29

**Die Marke gleitet jetzt, statt zu springen** — und mein Grund dagegen war
falsch herum gedacht. Ich hatte geschrieben, ein Gleiten würde „jeden Pixel auf
dem Weg beleuchten". Das stimmt und ist genau das Argument *dafür*: Einbrennen
entsteht durch anhaltende Last auf demselben Pixel. Eine Marke über eine Bahn zu
verteilen ist schonender, als sie eine halbe Minute lang auf einen Fleck zu
setzen. Ruhiger anzusehen ist es obendrein.

Fünfundzwanzig Sekunden je Wegstrecke, weich ein- und ausklingend. Die erste
Platzierung bleibt sprunghaft — sonst würde die Marke jedes Mal aus der Ecke
hereinfahren, wenn die Blende hochgeht. In der Vorschau sind die Wege kürzer,
sonst sieht man in acht Sekunden keine Bewegung.

**Das gewählte Bild wird nicht mehr abgedunkelt.** Ich hatte es auf 45 % gesetzt,
mit Verweis auf den Einbrennschutz. Das war übervorsichtig: Die Marke ist klein,
bewegt sich ständig, und ringsum ist alles schwarz. Wer ein Bild aussucht, will
sein Bild sehen.

## 14.2611.5 — 2026-08-29

**Die Begleitszenen sind jetzt ein Editor, keine Liste.** Bisher konnte man dort
nur ansehen und auflösen — angelegt wurde eine Verknüpfung ausschließlich in der
Szenen-Konfiguration der jeweiligen Battlemap. Das ist der halbe Weg: Wer einen
Überblick über alle Paare hat, will von dort aus auch eines hinzufügen können.

Unter der Liste stehen jetzt zwei Szenenfelder und ein Knopf. Beide nehmen eine
gezogene Szene aus der Seitenleiste oder öffnen die Suchliste — dasselbe Feld
wie in der Szenen-Konfiguration.

Angelegt und aufgelöst wird sofort, nicht erst beim Speichern: Eine Verknüpfung
ist ein Merkmal der Battlemap, kein Wert dieses Formulars. Sie bis zum Speichern
zurückzuhalten hieße, dass ein Abbrechen die eine Hälfte rückgängig macht und
die andere nicht.

**„Blende ansehen" zeigte den Punkt statt des gewählten Bildes.** Der Knopf las
die *gespeicherte* Einstellung — und die ist in genau dem Moment noch leer, in
dem man ihn braucht: Man hat eben eine Datei gewählt und will sie sehen, bevor
man speichert. Wer das tat, sah den Punkt und musste annehmen, seine Wahl sei
nicht angekommen.

Die Vorschau nimmt jetzt den Pfad, wie er im Formular steht.

Dazu aus dem Test: Die Schriftfarbe im Szenenfeld steht auf `inherit` statt auf
unserer eigenen. Das Feld erscheint an zwei Orten mit entgegengesetztem Grund —
Foundrys dunklem Szenenfenster und unseren hellen Seiten — und `inherit` ist in
beiden richtig. Vorher stimmte es nur zufällig: `--tm-text` ist außerhalb unserer
Fenster nicht definiert, die Regel griff ins Leere und erbte dasselbe.

## 14.2611.3 — 2026-08-29

Zwei Fehler, im Betrieb gefunden.

**Die Suchliste war kaum lesbar.** Ich hatte den Zeilen Grund und Ausrichtung
gegeben, aber keine Schriftfarbe — also erbten sie Foundrys helle Themenfarbe auf
unserem Pergamentgrund. Gemessen: 0,16 Helligkeitsunterschied. Derselbe Fehler
wie bei „Begleitszenen" in 14.2610.5, diesmal an vier Stellen auf einmal. Steht
jetzt als Regel in `AGENTS.md`: Wer Schrift oder Grund setzt, setzt auch die
Farbe.

**Fehlende Vorschaubilder brechen die Anzeige.** Eine Szene trägt einen Pfad zu
einem Vorschaubild, dessen Datei es nicht mehr gibt — „53. Pirate Ship" zeigt auf
eines, das der Server mit 404 beantwortet. Das Dokument weiß davon nichts, also
muss die Prüfung dort passieren, wo es sich zeigt: am Bildelement. Schlägt das
Laden fehl, tritt jetzt das Ersatzbild an die Stelle.

## 14.2611.2 — 2026-08-29

**Die Begleitszene wird nicht mehr aus einer Liste mit 125 Einträgen gewählt.**
Ein Auswahlfeld ist dafür in zwei Hinsichten die falsche Form: Einen Namen darin
zu finden heißt, eine Liste zu durchsuchen, die anders sortiert ist als die
Erinnerung — und ist er gewählt, steht dort ein Name und sonst nichts. Kein Bild
der Szene, und „53. Pirate Ship" ist von „53. Pirate Ship (Nacht)" nicht zu
unterscheiden.

Stattdessen ein Feld mit drei Wegen hinein, weil Leute unterschiedlich ankommen:

| | |
|---|---|
| **Ziehen** | eine Szene aus der Seitenleiste auf das Feld — der schnellste Weg, wenn sie ohnehin vor einem liegt |
| **Wählen** | öffnet eine Liste, in die man tippen kann, für die übrigen 120 |
| **Leeren** | nimmt sie wieder heraus |

Die gewählte Szene steht mit **ihrem eigenen Vorschaubild** da. Genau das kann
ein Auswahlfeld nicht, und es ist der Grund, warum ein Fehlgriff bisher erst
auffiel, wenn die Battlemap aktiviert wurde und der zweite Bildschirm den
falschen Raum zeigte.

Das Feld liegt als eigenes Stück (`scene-field.js`) vor, denn dieselbe
125-Einträge-Liste steht auf der Monitor-Seite noch zweimal — Ruhebild und
Standard-Begleitszene. Die ziehen als Nächstes nach.

Nebenbei: Eine Szene lässt sich nicht mehr als ihre eigene Begleitszene setzen.
Das Auswahlfeld hatte sie ausgeschlossen, ein Ziehen hätte es zugelassen.

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
