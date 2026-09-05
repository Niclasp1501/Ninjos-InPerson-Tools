# Konzept: eine eigene Blattansicht

Stand 05.09.2026. Ausgangspunkt ist der Wunsch, uns von Sheet Only zu lösen.
Zuschnitt: **quer wie hoch gleichwertig**, und **nichts fällt weg** — die Ansicht
läuft am Ende auf Windows-Tablets, Android und iOS, und dort gibt es die
Tastenkürzel nicht, mit denen sich am Schreibtisch das eine oder andere sparen
ließe.

---

## 0. Wie dieses Papier entstanden ist

Aus zwei Quellen, und aus keiner dritten:

1. **Was auf dem Bildschirm passiert.** Über Wochen benutzt, und in dieser
   Sitzung an einem echten Client vermessen, während wir andere Fehler suchten.
2. **Was unser Tisch braucht.** Aus dem, was wir hier tatsächlich gebaut und
   benutzt haben — Tauschfenster, Zeitleiste, Meldungsstreifen.

**Nicht** aus dem Quelltext von Sheet Only. Beim Suchen nach zwei Fehlern habe
ich dort hineingesehen — das ist geschehen und lässt sich nicht ungeschehen
machen. Die Grenze, die ab hier gilt: *Tatsachen sind frei, Ausdruck nicht.*
Dass Foundry ein `#interface` hat, das man ausblenden kann, ist eine Tatsache
über Foundry. Wie jemand anders daraus ein Modul gebaut hat, ist sein Werk.
Gebaut wird gegen **Foundrys** API.

Sheet Only steht unter GPL-3.0, unser Modul unter MIT. Solange wir ihren Code
nicht übernehmen, bleibt das getrennt und unproblematisch.

---

## 1. Der Befund: was am Tisch gebraucht wird

Ursprünglich stand hier eine Liste von Knöpfen, die wegfallen sollten — mit der
Begründung, der Browser könne das schon: Vollbild auf F11, Schriftgröße auf
Strg+/Strg−, Abmelden über die Adresse.

**Diese Begründung war falsch, und zwar für genau die Geräte, um die es geht.**
Auf iPadOS und Android gibt es kein F11 und keine Strg-Taste. Wer die Ansicht
als App auf den Startbildschirm legt, hat auch keine Adressleiste mehr. Dieselben
drei Knöpfe, die am Schreibtisch überflüssig sind, sind auf einem Tablet die
einzige Möglichkeit überhaupt.

Es fällt also **nichts** weg — mit einer Ausnahme, die keine Streichung ist:
**Zielen und Figuren bewegen** kommen gar nicht erst vor. Das sind die Bezahlteile
des anderen Moduls; wir haben sie nie gehabt und brauchen sie an diesem Tisch
nicht. Sie zu bauen hätte den Umfang etwa verdoppelt.

| Was | Warum es bleiben muss |
|---|---|
| Charakterblatt formatfüllend | der Zweck der ganzen Ansicht |
| Zwischen eigenen Charakteren wechseln | ohne das ist man auf einem Blatt gefangen |
| Chat | Würfe, Tauschkarten, Ansagen |
| Journal | Notizen aufschlagen |
| Tausch | haben wir gebaut |
| Datum, Uhrzeit, Wetter | steht dauerhaft, wird nicht bedient |
| **Schriftgröße** | ohne Tastatur gibt es keinen anderen Weg |
| **Vollbild** | dito; auf iOS zusätzlich der einzige Weg zu einem ruhigen Bild |
| **Abmelden** | in einer installierten Ansicht gibt es keine Adressleiste |


---

## 1b. Drei Plattformen, drei Eigenheiten

Die Ansicht läuft am Ende auf Windows-Tablets, Android und iOS. Das sind keine
drei Größen desselben Geräts, sondern drei verschiedene Browser mit drei
verschiedenen Macken. Was wir dabei beachten müssen:

**Android:** Die Adressleiste fährt beim Scrollen ein und aus, und die
Fensterhöhe ändert sich dabei. `100vh` misst die *größte* Höhe — Inhalt am
unteren Rand verschwindet also unter der Leiste. Deshalb überall `100dvh`.

**iOS:** Safari kennt keine echte Vollbild-Anzeige auf dem iPhone und nur eine
eingeschränkte auf dem iPad; der zuverlässige Weg ist, die Seite als App auf den
Startbildschirm zu legen. Dazu kommen die Sicherheitsabstände oben und unten
(Kerbe, Streifen) — die Leiste braucht `env(safe-area-inset-*)`, sonst liegt
sie unter der Uhr des Geräts. Und das Gummiband-Scrollen muss unterbunden
werden, sonst wackelt das ganze Blatt beim Wischen.

**Windows:** Maus und Finger gleichzeitig. Nichts darf ausschließlich auf
Hover liegen, und die Bildschirmtastatur verkleinert das Fenster statt darüber
zu liegen — ein Eingabefeld darf also nicht von ihr verdeckt werden.

Gemeinsamer Nenner: **eine Bedienung, die mit dem Finger vollständig ist.**
Was nur mit Tastatur oder nur mit Maus geht, gibt es für diese Ansicht nicht.

## 2. Die eine Entscheidung, die alles andere bestimmt

**Hoch und quer sind gleichwertig.** Das klingt nach einer Kleinigkeit und ist
die teuerste Vorgabe in diesem Papier, denn sie verbietet den bequemen Entwurf.

Quer ist einfach: Blatt in der Mitte, links eine Liste, rechts ein Panel, alles
nebeneinander. Hoch ist das unmöglich — 800 Pixel Breite tragen keine drei
Spalten. Wer quer entwirft und hoch nachreicht, quetscht.

Also andersherum: **Der Entwurf ist hoch. Quer ist der Fall, in dem daneben noch
Platz ist.**

Daraus folgt eine Regel, die sich durch alles zieht:

> Alles außer dem Blatt ist eine Fläche, die sich darüberlegt und wieder
> verschwindet. Wo Platz ist, darf sie stattdessen daneben stehen bleiben.

Genau dieses Muster haben wir beim Tauschfenster schon gebaut und am Tablet
bestätigt: der Tisch ist das Fenster, die Auswahl legt sich darüber. Es
funktioniert, weil man auf einem Tablet ohnehin eine Sache zur Zeit tut.

---

## 3. Der Aufbau

Drei Teile, mehr nicht.

### 3.1 Die Bühne

Der Bildschirm gehört dem Charakterblatt. Foundrys Oberfläche wird nicht
umgebaut, sondern **verdeckt** — sie bleibt vorhanden und funktionsfähig, sie
ist nur nicht zu sehen. Das ist wichtig für die Verträglichkeit: Module, die
Teile der Oberfläche voraussetzen, laufen weiter.

Wir wissen aus dieser Sitzung, was dabei kaputtgeht, wenn man es falsch macht:

- **Meldungen verschwinden mit.** Wir haben das gelöst (`notify.js`) und würden
  es von Anfang an mitdenken statt hinterher.
- **Ausgeklappte Seitenleisten-Fenster landen im Nirgendwo**, weil Foundry ihre
  Lage aus der Position eines versteckten Reiters rechnet. Auch gelöst; gehört
  hier in den Kern statt in eine Sonderregel.
- **Fremde Module laufen auf Grund**, wenn ihr Bezugselement fehlt — gemessen:
  339 Ausnahmen in einer Sitzung aus einem Playlist-Zeitgeber. Nicht unsere
  Schuld, aber unser Problem, weil es unsere Fehler zuschüttet.

### 3.2 Die Leiste

Eine Reihe am oberen Rand — und sie trägt jetzt mehr, als in eine Zeile passt.
Gerechnet: neun Knöpfe zu 52 Pixeln plus Abstände sind rund 530 Pixel, die
Zeitleiste kommt auf gut 330. Auf 800 Pixeln Breite geht das nicht nebeneinander.

**Also zwei Zeilen im Hochformat, eine im Querformat.** Oben die Knöpfe, darunter
die Zeitleiste; quer ist Platz für beides nebeneinander. Es fällt nichts weg und
nichts wandert in ein Untermenü — auf einem Tablet ist ein zweiter Griff teurer
als eine zweite Zeile.

**Sie schwebt über dem Blatt** und bekommt kein eigenes Band (entschieden am
05.09.2026). Das Blatt beginnt ganz oben und behält die volle Höhe; die Leiste
liegt als abgesetzte Fläche darauf — mit Rand, Schatten und leicht durchscheinend,
damit sie sich vom Banner darunter abhebt statt darin unterzugehen.

Über **unseren eigenen Flächen** liegt sie dagegen nicht: Charaktere, Chat,
Notizen und Tausch beginnen unter ihr. Der Grund ist der Rückweg — läge die
Leiste über einer geöffneten Fläche, wäre sie zwar sichtbar, aber die Fläche
verdeckte, wohin man zurückwill. Die Regel lautet: **die Leiste liegt über dem,
was Foundry zeigt, und unter dem, was wir zeigen.**

Sie ist außerdem **erweiterbar von außen**, denn FANG und NDRS hängen heute schon
Knöpfe dort hinein. Diese Schnittstelle müssen wir anbieten, sonst verlieren wir beim
Wechsel zwei eigene Module.

Zwei Regeln, beide teuer gelernt:

- **44 Pixel Mindestgröße.** Ein Finger ist kein Mauszeiger.
- **Die Leiste liegt über allem und nimmt Tipps an.** Wir haben in dieser
  Sitzung beides falsch gehabt: erst eine Leiste, die man nicht sah, weil sie
  hinter dem Blatt lag; dann eine, die keine Tipps annahm und deshalb eine
  Greifhand zeigte, die nichts greifen konnte.

### 3.3 Die Flächen

Vier Stück, alle nach demselben Muster: von einem Knopf gerufen, über dem Blatt,
mit einem großen Weg zurück.

| Fläche | Inhalt | Quer |
|---|---|---|
| **Charaktere** | die eigenen Akteure, groß, mit Bild | darf links stehen bleiben |
| **Chat** | Würfe, Tauschkarten, Text | darf rechts stehen bleiben |
| **Journal** | Notizen, die man aufschlägt | immer darüber |
| **Tausch** | haben wir schon | immer darüber |

Die Zeitleiste ist keine Fläche, sondern steht dauerhaft in der Leiste.

Drei Knöpfe rufen überhaupt keine Fläche, sondern tun sofort etwas: **Schrift
größer**, **Schrift kleiner**, **Vollbild**. Beim Abmelden ist eine Rückfrage
angebracht — versehentlich am Spielabend hinausgeworfen zu werden ist ärgerlich,
und ein 52 Pixel breiter Knopf wird versehentlich getroffen.

---

## 4. Was wir schon haben

Der Grund, warum das kein Neuanfang wäre. Alles Folgende ist bereits gebaut,
läuft in Produktion und ist für genau diesen Modus entworfen:

| Vorhanden | Wird im Eigenbau zu |
|---|---|
| `notify.js` | Meldungen, ohne Änderung |
| `clock.js` + `clock-settings.js` | Zeitleiste, ohne Änderung |
| `trade*.js` (8 Dateien) | Tauschfläche, ohne Änderung |
| `actor-panel.js` | Charakterfläche, entkernt |
| `sheet-only.js` | die Anmelde-Registrierung für fremde Knöpfe |

`sheet-only.js` ist dabei der interessante Fall: Diese Datei ist heute nichts
als **unser Wissen über fremdes DOM**. Im Eigenbau wird daraus das Gegenteil —
die Stelle, an der *wir* anderen etwas anbieten. Der Zweck bleibt, die
Blickrichtung dreht sich.

---

## 5. Aufwand

Grob, und bewusst als Spanne.

| Teil | Zeilen | Bemerkung |
|---|---|---|
| Bühne (verdecken, aufräumen, Verträglichkeit) | 250–350 | der heikle Teil |
| Leiste samt Anmeldung für fremde Knöpfe | 200 | zwei Zeilen hoch, eine quer |
| Schriftgröße, Vollbild, Abmelden | 120 | klein, aber drei Plattformen |
| Charakterfläche | 150 | aus `actor-panel.js` |
| Chatfläche | 100 | Foundrys Chat, angedockt |
| Journalfläche | 50 | Verankerung haben wir |
| Gestaltung hoch und quer, drei Plattformen | 400–500 | die Vorgabe aus Abschnitt 2 |
| **Summe** | **1270–1470** | ohne das, was schon läuft |

Zum Vergleich: Das Tauschsystem war rund 1700 Zeilen. Das hier ist kleiner, aber
riskanter, weil es einer fremden Sache im Weg steht statt neben ihr zu stehen.

---

## 5b. Erst in die Beta

Die Blattansicht geht **nicht** einfach mit dem nächsten Release an alle. Sie
hängt hinter einer Welteinstellung **„Beta-Funktionen"**, standardmäßig aus.

Der Grund ist nicht Vorsicht um ihrer selbst willen. Diese Ansicht ist die
einzige Funktion des Moduls, die einem Spieler den *ganzen Bildschirm* wegnimmt.
Geht sie schief, kann derjenige nicht mehr auf die Einstellungen zugreifen, um
sie abzuschalten — anders als beim Tischmodus, wo im schlimmsten Fall eine Karte
fehlt. Ein Schalter, den der Spielleiter jederzeit umlegen kann, ist die einzige
ehrliche Antwort darauf.

Was daraus folgt:

- Der Schalter ist **weltweit** und gehört dem Spielleiter, wie die übrigen
  Einstellungen der Ansicht.
- Solange er aus ist, wird **nichts** davon geladen — keine CSS-Regel, kein
  Ereignis, kein Fenster. Eine abgeschaltete Beta darf nicht messbar sein.
- Sheet Only bleibt daneben installiert, bis unsere Ansicht einen Spielabend
  getragen hat.

---

## 6. Was ich nicht machen würde

**Keinen Umschalter „unsere oder deren Ansicht".** Zwei Ansichten, die
dasselbe tun, verdoppeln jede Fehlersuche. Entweder wir lösen ab oder wir
lassen es.

**Nicht mit dem Blatt anfangen.** Das Blatt ist Foundrys und Tidy5es Sache; wir
zeigen es nur formatfüllend. Wer anfängt, ein Charakterblatt zu bauen, baut ein
Jahr.

**Kein Zielen, keine Figurensteuerung.** Entschieden am 05.09.2026: Wir
brauchen sie an diesem Tisch nicht. Sie hätten den Umfang etwa verdoppelt und
wären als Einzige etwas, das wir noch nie gebaut haben.

**Nicht ohne Rückweg ausliefern.** Solange unsere Ansicht nicht durch einen
Spielabend getragen hat, bleibt Sheet Only installiert und abschaltbar.

---

## 7. Der nächste Schritt

Das Mockup (`mockup-blattansicht.html`) zeigt beide Lagen mit der vollständigen
Leiste. Es ist ein Bild, kein Prototyp: keine Foundry-Anbindung, keine echten
Daten.

Was daran zu entscheiden ist, bevor eine Zeile Modulcode entsteht:

1. **Trägt die zweizeilige Leiste im Hochformat?** Neun Knöpfe und die Zeitleiste
   passen dort nicht nebeneinander. Die Alternative wäre, die selteneren Knöpfe
   hinter ein Untermenü zu legen — ein Griff mehr, dafür eine Zeile weniger.
2. **Verdeckt die schwebende Leiste etwas, das man oft braucht?** Bei Tidy5e
   liegt darunter das Banner mit Namen und Werten. Am Tisch nachsehen — auf dem
   Papier lässt sich das nicht entscheiden.
3. **Wann schalten wir Sheet Only ab?** Vorschlag: erst nach einem
   vollständigen Spielabend mit eingeschalteter Beta, an dem nichts fehlte.
