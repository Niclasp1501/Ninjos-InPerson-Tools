# Konzept: Tausch am Tablet

Stand 31.08.2026, zweite Fassung — **ohne Item Piles**. Grundlage: der
Quelltext von dnd5e 5.3.3 und Sheet Only 2.3.3 auf `foundry-1`, gelesen, nicht
vermutet.

> Die erste Fassung wollte Item Piles' Beweger mitbenutzen. Das ist gestrichen:
> Item Piles funktioniert am Tablet nicht, bringt vieles mit, das niemand
> braucht, und eine Abhängigkeit auf ein Modul, das man eigentlich loswerden
> will, ist keine. Der Tausch wird vollständig selbst gebaut.

---

## 1. Woran das Vorhandene scheitert

Der Knopf „Tausch anfragen" unter der Spielerliste gehört zu Item Piles. Dessen
Fenster nimmt Gegenstände **ausschließlich** über das HTML5-Ereignis `drop`
entgegen — und das feuert auf Touch-Geräten nicht. Ein Finger kann dort nichts
hineinziehen. HTML5-Drag und Touch sind zwei getrennte Welten.

dnd5e selbst hat keinen Spieler-an-Spieler-Tausch; `transferCurrency` gehört
zum Belohnungsdialog des Spielleiters.

Sheet Only versteckt nur Spielfeld und Chat, bietet `getCurrentActor()` und
`isSheetOnly()` an und hat eine eigene Knopfleiste (`#so-main-buttons`).

## 2. Die eine Entscheidung

**Nicht ziehen. Tippen.**

Die eigenen Gegenstände stehen als Liste, ein Tipp legt einen ins Angebot, ein
zweiter nimmt ihn zurück. Menge über Plus und Minus. Münzen über Plus und Minus
je Sorte. Jede Fläche mindestens 44 Pixel hoch — ab da trifft ein Finger
zuverlässig.

Das funktioniert mit der Maus genauso. **Eine Bedienung, nicht zwei.**

## 3. Der Ablauf und das Fenster

```
A tippt „Tausch"  →  wählt B  →  B bekommt die Frage  →  beide sehen den Tisch
```

**Nur wer da ist, kann gefragt werden.** Die Partnerwahl zeigt ausschließlich
angemeldete Spieler mit einer Figur. Ein Tausch mit jemandem, der nicht da ist,
ist keiner.

### Der Tisch ist das Fenster, die Auswahl nur ein Untermenü

Bei zwanzig Gegenständen im Rucksack darf das Tauschfenster nicht zwanzig Zeilen
zeigen, von denen zwei gemeint sind. Deshalb zwei Ansichten, klar getrennt:

```
        DER TISCH  (Hauptansicht, beide sehen dasselbe)
        ┌──────────────────────┬──────────────────────┐
        │ Ich gebe             │ Ich bekomme          │
        │  Heiltrank      ×2   │  Langschwert    ×1   │
        │  15 GM               │  3 SM                │
        │                      │                      │
        │ [+ Hinzufügen]       │                      │
        ├──────────────────────┴──────────────────────┤
        │        [ Annehmen ]          [ Abbrechen ]  │
        └─────────────────────────────────────────────┘

        DIE AUSWAHL  (klappt über den Tisch, nur für mich)
        ┌─────────────────────────────────────────────┐
        │ [Suchen…]                                   │
        │  ● Heiltrank ×2       ← angetippt, liegt    │
        │  ○ Seil                                     │
        │  ○ Fackel ×5                                │
        │  Münzen  GM [−] 15 [+]   SM [−] 0 [+]       │
        │                                  [ Fertig ] │
        └─────────────────────────────────────────────┘
```

Auf dem Tisch liegt **nur, was angeboten ist** — und genau das ist es, wozu
beide am Ende Ja sagen. Die Auswahl sieht nur, wer sie gerade offen hat.

**Jede Änderung auf dem Tisch hebt beide „Annehmen" wieder auf.** Niemand kann
im letzten Moment etwas herausnehmen, nachdem der andere schon zugesagt hat.

**Groß, und im Aussehen des Moduls.** Pergamentgrund, Dunkelrot, Gold — dieselbe
Palette wie Bedienfenster und Einstellungsseiten. In Sheet Only füllt der Tisch
den Bildschirm; am Rechner ist er ein großes Fenster, nicht ein Dialog. Jede
Zeile mindestens 44 Pixel, jede Zahl groß genug, um sie vom anderen Ende des
Tischs zu lesen.

**Der Spielleiter sieht zu und kann abbrechen.** Und er muss da sein — siehe 5.

## 4. Der Beweger — was dnd5e wirklich verlangt

Das ist der Teil, der bei Item Piles fertig gewesen wäre und jetzt unserer ist.
Aus dem Quelltext von dnd5e 5.3.3, Punkt für Punkt:

| Fall | Was zu tun ist | Woher |
|---|---|---|
| **Gegenstand ganz** | Kopie beim Empfänger anlegen, Original beim Geber löschen | — |
| **Teilmenge** | beim Geber `system.quantity` senken, beim Empfänger Kopie mit der Teilmenge | — |
| **Stapel** | **werden nicht zusammengelegt.** Was ankommt, kommt als eigener Eintrag an | Entscheidung, siehe unten |
| **Angelegt / eingestimmt** | auf der Kopie `system.equipped = false` und `system.attuned = false` setzen — **dnd5e tut das nicht selbst**; sonst zählt der Einstimmungszähler des Empfängers falsch | geprüft: keine Stelle im System setzt das beim Besitzerwechsel zurück |
| **Behälter** | Hülle anlegen, dann jeden Inhalt anlegen und dessen `system.container` auf die **neue** ID der Hülle zeigen lassen — der Behälter bekommt beim Empfänger eine andere ID. **Und `system.currency` der Hülle mitnehmen**, ein Behälter trägt eigene Münzen | `allContainedItems` rekursiv; Feldliste am „Tonkrug" nachgesehen |
| **Münzen** | fünf Sorten `pp gp ep sp cp`, bei beiden Akteuren `system.currency` anpassen; keine Umrechnung, was angeboten wurde, wird bewegt | `CONFIG.DND5E.currencies` |

Nichts davon ist schwer. Aber jede Zeile davon ist eine, die bei einem Fehler
einen Gegenstand verschwinden lässt — deshalb Punkt 6.

**Reihenfolge beim Bewegen:** erst alles beim Empfänger **anlegen**, dann beim
Geber **löschen**. Bricht es dazwischen ab, gibt es den Gegenstand doppelt, nicht
gar nicht. Doppelt lässt sich in einer Minute richten; weg ist weg.

**Keine Stapel zusammenlegen.** dnd5e kann das für Verbrauchsgüter, und es wäre
naheliegend. Der Tausch tut es trotzdem nicht: Zusammenlegen heißt, einen
Gegenstand zu ändern, **der schon dem Empfänger gehörte** und mit dem Tausch
nichts zu tun hat. Damit wäre der Beweger nicht mehr auf das beschränkt, was auf
dem Tisch lag — und genau diese Beschränkung ist es, die ihn sicher macht. Wer
zwei Stapel Fackeln nebeneinander stehen hat, legt sie in einer Sekunde selbst
zusammen; ein falsch geänderter fremder Stapel kostet eine Suche.

## 5. Wer bewegt — und warum es der Spielleiter sein muss

Ein Spieler darf auf dem Akteur des anderen nichts anlegen und nichts löschen.
Das ist richtig so. Also **führt der Client des Spielleiters aus**: Sobald beide
angenommen haben, geht eine Socket-Nachricht an ihn, und er bewegt beide Seiten.

Folge: **Ohne angemeldeten Spielleiter kein Tausch.** Das Fenster sagt das, statt
hängenzubleiben. Am Tisch sitzt er ohnehin daneben.

## 6. Das Tauschbuch — damit nichts verloren geht

**Zwei Schritte statt einem:**

1. **Vor dem ersten Bewegen** wird der Tausch niedergeschrieben: wer, wann,
   beide Angebote vollständig — Name, Menge, Behälterinhalt, Münzen — Stand
   `offen`.
2. Dann wird bewegt, Gegenstand für Gegenstand, in der Reihenfolge aus Punkt 4.
   Am Ende Stand `erledigt`. Bricht etwas ab: Stand `abgebrochen bei …`, mit
   dem Fehler und dem, was bis dahin schon geschehen war.

Was der Spielleiter dann in der Hand hat, ist kein Fehler, sondern ein Zettel:
*„Eloy sollte 2× Heiltrank an Jenn geben, Jenn 15 GM an Eloy. Die Tränke sind
bei Jenn angelegt, das Löschen bei Eloy schlug fehl."* Das richtet man von Hand
in einer Minute.

**Ort:** ein Tagebuch „Tauschbuch", eine Seite je Tausch, nur für den
Spielleiter sichtbar. Ein Tagebuch lässt sich lesen, durchsuchen und mit der Welt
sichern. Dazu eine Chat-Karte für alle, damit der Tisch sieht, was geschah.

## 7. Wo es am Tablet liegt

Ein Knopf **in Sheet Onlys Leiste** (`#so-main-buttons`), neben Chat und
Tagebuch. `getCurrentActor()` sagt, wer tauscht — mehrere Figuren auf einem
Tablet sind damit abgedeckt. Am Rechner derselbe Knopf in der Spielerliste.

Das Fenster füllt in Sheet Only den Bildschirm, am Rechner ist es ein normales
Fenster. Derselbe Inhalt, zwei Rahmen.

**Item Piles' eigener Knopf muss weg**, sonst stehen zwei da. Item Piles hat
dafür die Einstellung `showTradeButton`; das Modul weist beim ersten Start darauf
hin. Ob Item Piles danach überhaupt noch gebraucht wird, ist eine Frage für sich.

## 8. Einstellungen

Nach dem Werkzeugkasten-Konzept: eine Zeile in der Hauptliste, ein eigenes
Fenster. Darin wenig:

| | |
|---|---|
| Tausch verwenden | an / aus |
| Wer darf | nur Spieler untereinander, oder auch mit dem Spielleiter |

Mehr nicht. Ein Tausch hat keine Vorlieben.

## 9. Aufwand

| Teil | Zeilen |
|---|---|
| Fenster mit Tipp-Bedienung, zwei Rahmen | ~350 |
| Anfrage, Zustand, Socket, beidseitiges Annehmen | ~150 |
| Beweger nach Punkt 4 | ~180 |
| Tauschbuch und Chat-Karte | ~100 |
| Sheet-Only-Knopf, Einstellungen, Sprache | ~80 |

Rund **850 Zeilen** — das größte Werkzeug im Kasten. Der Beweger allein ist
größer als in der ersten Fassung, weil Behälter und Stapel jetzt unsere Sache
sind. Zwei Tage Bau, ein Abend Test mit zwei Tablets.

## 10. Was ich nicht täte

**Touch-Ziehen nachbauen.** Sieht aus wie das Original und funktioniert
schlechter.

**Erst löschen, dann anlegen.** Die Reihenfolge entscheidet, ob ein Fehler einen
Gegenstand verdoppelt oder vernichtet.

**Ohne Spielleiter bewegen.** Die Alternative wäre, Spielern Rechte auf fremde
Akteure zu geben. Dann verliert man nicht nur beim Tausch etwas.

**Münzen umrechnen.** Wer 15 Silber anbietet, gibt 15 Silber, nicht 1,5 Gold.
Umrechnen ist eine Entscheidung des Spielers, nicht des Moduls.

---

## Nachgeprüft an der laufenden Welt, 31.08.2026

| Frage | Antwort |
|---|---|
| Was trägt `toObject()`? | `name type img system effects _id folder sort ownership flags _stats` — beim Anlegen müssen **`_id` und `ownership`** weg, sonst erbt der Empfänger die Rechte des Gebers |
| Tragen Behälter Münzen? | **Ja.** Der „Tonkrug" hat `system.currency` neben `container`, `quantity`, `attuned`, `equipped` |
| Haben Gegenstände immer eine Quellangabe? | **Nein.** Die Kerze aus `dnd5e.items` hat weder `_stats.compendiumSource` noch `flags.core.sourceId`. Ohne die legt dnd5e nichts zusammen — das Zusammenlegen ist eine Zugabe, kein Verlass |
| Tagebuchseite für das Tauschbuch? | `text` ist vorhanden, neben 22 weiteren aus Fremdmodulen |
| Angemeldeter Spielleiter? | `game.users.activeGM` liefert ihn — die Prüfung aus Punkt 5 ist eine Zeile |
| Foundry | 14.367 |

Die ersten drei Zeilen sind je eine Falle, die stumm Daten verliert: geerbte
Rechte, vergessene Münzen im Beutel, ein Stapel, der sich nicht findet und
deshalb doppelt liegt. Alle drei sind billig zu behandeln, wenn man sie kennt.

## Offen

- Wie Sheet Only auf ein zusätzliches Fenster reagiert (es zwingt Bögen in den
  Vollbildmodus) — nur am Tablet messbar.
- In dieser Welt liegt **kein Behälter auf einem Akteur**; die Behälterregeln
  sind am Kompendium-Behälter geprüft, nicht am echten Fall.
