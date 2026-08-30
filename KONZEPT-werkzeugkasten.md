# Konzept: das Modul als Werkzeugkasten

Stand 29.08.2026. Grundlage sind die 28 tatsächlich vorhandenen Einstellungen,
nicht eine Wunschliste.

---

## 1. Der Befund

Das Modul ist keine Funktion mit Zubehör, sondern **mehrere Werkzeuge, die sich
ein Modul teilen**. Sie haben nichts miteinander zu tun außer dem Anlass:
Spielen am selben Tisch.

| Werkzeug | Wofür | Einstellungen |
|---|---|---|
| **Tischmodus** | Tablets und Laptops am Tisch laden die Battlemap nicht mehr | 13 |
| **Szenen-Monitore** | digitale Spieltische mit stehendem und liegendem Bildschirm | 14 |
| **Szenendrehung** | hochkante Karten quer legen, verträglich mit Lock View | 0 |

Die Null bei der Drehung ist kein Fehler: Sie wird je Szene eingestellt, und die
Lock-View-Anpassung läuft von selbst. Sie *wird* Einstellungen bekommen, sobald
mehr dazukommt — aber heute hat sie keine.

**Und die Hauptliste enthält zurzeit ausschließlich Einstellungen des
Tischmodus.** Neun Stück, die aussehen wie „die Einstellungen des Moduls",
obwohl sie einem von drei Werkzeugen gehören. Wer die Monitore sucht, findet
Ausnahmepfade für Downloads.

## 2. Zwei Achsen, nicht eine

Beim Sortieren fiel auf, dass zwei Fragen durcheinandergehen. Sie sind
unabhängig:

**Welches Werkzeug?** — Kartensperre, Monitore, Drehung.

**Wer stellt es ein?** — Der Spielleiter einmal für die Welt, oder jeder für sein
eigenes Gerät.

Die zweite Achse ist leicht zu übersehen und entscheidet trotzdem mit. Drei
Einstellungen gehören dem einzelnen Gerät:

```
Für diesen Client        automatisch / immer / nie
Statusanzeige einblenden
(Spielfeld-Besitzmarke)  intern
```

Das sind **die einzigen Einstellungen, die ein Spieler je anfasst.** Wandern sie
in ein Fenster, das nur der Spielleiter öffnen darf, sind sie für Spieler weg.

## 3. Der Aufbau

Drei Ebenen, jede mit einer klaren Frage.

### Ebene 1 — Foundrys Moduleinstellungen

Nur zwei Sorten Einträge, und beide sind kurz:

```
Für diesen Client              [automatisch ▾]     ← je Gerät, Spieler sehen es
Statusanzeige einblenden       [✓]                 ← je Gerät

Tischmodus                     [Einrichten…]
Szenen-Monitore                [Einrichten…]
Szenendrehung                  [Einrichten…]
```

Damit ist die Liste **immer gleich lang**, egal wie viele Werkzeuge dazukommen —
ein neues Werkzeug ist eine Zeile, nicht fünfzehn.

### Ebene 2 — ein Fenster je Werkzeug

Alles, was der Spielleiter einmal einstellt, in Gruppen und mit Erklärung. Genau
wie die Monitor-Seite es heute schon macht, samt gestufter Anzeige: Was von einer
Vorentscheidung abhängt, erscheint erst danach.

| Fenster | Inhalt |
|---|---|
| **Tischmodus** | wen es standardmäßig trifft, was blockiert wird, Token-Bilder, Audio, Ladebalken, Spielfeld abschalten, Ausnahmen |
| **Szenen-Monitore** | die zwei Konten, Begleitszenen, Verhalten beim Lösen, Bildschirmschoner |
| **Szenendrehung** | heute: nur der Lock-View-Zustand als Anzeige. Später der Ort für alles Weitere |

### Ebene 3 — Bedienung während des Spiels

Bleibt wie in 14.2610.4 festgelegt und ist von den Einstellungen sauber
getrennt:

| Ort | Was |
|---|---|
| `Alt+T` | Zustand und Handlung *jetzt* |
| Rechtsklick auf eine Szene | alles zu *dieser einen* Szene |

## 4. Kein „Werkzeug verwenden"-Schalter

Naheliegend wäre je Werkzeug ein An/Aus in der Hauptliste. Ich rate ab: **Jedes
Werkzeug hat bereits ein natürliches Zeichen dafür, ob es im Einsatz ist.**

| Werkzeug | Woran man sieht, dass es läuft |
|---|---|
| Tischmodus | der Hauptschalter im Bedienfenster, der auch sagt, wie viele Spieler betroffen sind |
| Szenen-Monitore | sind die beiden Konten benannt? Ohne Konten tut das Werkzeug nichts |
| Szenendrehung | trägt irgendeine Szene eine Drehung? |

Ein zusätzlicher Schalter wäre ein zweiter Weg zu derselben Aussage — und der
schlechtere, weil er nur ein Häkchen zeigt statt eines Zustands. Genau der
Fehler, der beim Hauptschalter in 14.2610.5 behoben wurde.

Ein ungenutztes Werkzeug kostet in diesem Aufbau **eine Zeile**. Das ist wenig
genug.

## 5. Was konkret umzieht

Aus der Hauptliste in das Fenster „Tischmodus":

```
Spieler standardmäßig einbeziehen
Was blockiert wird
Token-Bilder weiter laden
Audio blockieren
Ladebalken bei Spielern ausblenden
Spielfeld im Tischmodus ganz abschalten
Ausnahmen
```

Sieben Einträge. In der Liste bleiben die zwei Geräte-Einstellungen und drei
Knöpfe — von neun Zeilen auf fünf, und die fünf bleiben es auch dann noch, wenn
drei Werkzeuge dazukommen.

## 6. Aufwand

| | |
|---|---|
| Fenster „Tischmodus" | ~200 Zeilen, nach dem Muster der Monitor-Seite |
| Fenster „Szenendrehung" | ~80 Zeilen, heute noch dünn |
| Sieben Einstellungen umhängen | `config: false` plus Felder im neuen Fenster |
| Sprachschlüssel | vorhanden, nur neue Überschriften |

Rund **300 Zeilen**, keine Verhaltensänderung — die Werte bleiben dieselben, nur
der Ort ändert sich. Nichts davon fasst laufende Sitzungen an.

## 7. Was ich nicht machen würde

**Ein Fenster mit Reitern für alle drei.** Reiter verstecken, dass es
verschiedene Werkzeuge sind, statt es zu zeigen. Drei Knöpfe sagen deutlicher,
dass man drei verschiedene Dinge einrichtet.

**Die Drehung schon jetzt aufwendig ausbauen.** Sie hat null Einstellungen. Ein
Fenster mit einer Statusanzeige darin ist ehrlich; eines mit erfundenen Optionen
wäre es nicht.

**Die Geräte-Einstellungen mitnehmen.** Sie müssen dort bleiben, wo ein Spieler
sie findet.

---

## Nachtrag, 29.08.2026 — zwei Korrekturen

**Das Werkzeug heißt Tischmodus.** Im ersten Entwurf stand „Kartensperre" — ein
zweiter Name für dieselbe Sache. Nachgezählt: 21 Stellen im Modul sagen
„Tischmodus", eine sagte „Kartensperre". Letztere ist mit angeglichen.

**Kein Fenster für die Szenendrehung.** Der Entwurf sah eines vor, obwohl er
selbst feststellte, dass es null Einstellungen gibt. Ein Fenster, in dem nur
steht, ob Lock View erkannt wurde, ist ein Fenster ohne Inhalt. Die Drehung wird
je Szene eingestellt und die Lock-View-Anpassung läuft von selbst — dabei bleibt
es, bis es wirklich etwas einzustellen gibt.

Es bleiben also **zwei** Werkzeugfenster, nicht drei.
