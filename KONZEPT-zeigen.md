# Konzept: Zeigen am Tisch

Stand 11.09.2026, erste Fassung. Grundlage: der Quelltext von Foundry v14
(Build 365) und dnd5e 5.3.3 auf `foundry-1`, gelesen, nicht vermutet. Die
Fundstellen stehen am Ende.

> Anlass: Ein Spieler bekommt ein Buch, einen Brief oder einen Gegenstand. Darin
> steht ein Text oder ist ein Bild. Er soll es den anderen am Tisch zeigen
> können, so wie man einen echten Zettel über den Tisch hält. Der Spielleiter
> kann das heute schon; der Spieler nicht.

---

## 1. Was Foundry heute kann, und warum es am Tisch nicht ankommt

Die Maschinerie ist vollständig da. Es fehlen nur die Knöpfe.

| | Wer darf es heute | Wo steht die Grenze |
|---|---|---|
| **Journalseite zeigen** | wer die Seite **besitzt**, also auch ein Spieler | Der Knopf im Fensterkopf ist nur für den Spielleiter sichtbar. Für Besitzer gibt es ihn nur im Rechtsklickmenü der Seitenliste. Am Tablet ist das ein langer Druck auf eine Liste, die in der Blattansicht selten offen ist. Niemand findet ihn. |
| **Bild zeigen** | nur der Spielleiter | Der Knopf am Bildfenster hat `visible: () => game.user.isGM`. |
| **Gegenstand zeigen** | niemand | Dafür gibt es in Foundry keinen Weg. dnd5e kann eine Gegenstandskarte in den Chat legen, aber das ist ein Daumennagel im Chat, und der ist in der Blattansicht zugeklappt. |

Zwei Befunde aus dem Quelltext, die das Konzept tragen:

**Der Server prüft nichts.** Die beiden Nachrichten `showEntry` und
`shareImage` reicht er an alle oder an die genannten Konten weiter, ohne
nachzusehen, wer sie schickt. Die einzige Grenze ist der Knopf im Browser.
Daraus folgt zweierlei: Es gibt kein technisches Hindernis, und genau deshalb
muss **unser Modul** die Grenze ziehen, die Foundry nicht zieht. Ein neues Loch
entsteht nicht; wer die Konsole bedienen kann, kann `shareImage` heute schon
selbst schicken. Wir bauen einen Knopf mit Leitplanken, keinen neuen Weg.

**Beim Empfänger entstehen nur vorübergehende Rechte.** Wer eine Journalseite
gezeigt bekommt, erhält für diesen Augenblick Beobachterrechte auf seinem
eigenen Rechner (`entry.ownership[game.userId] = OBSERVER`). Gespeichert wird
nichts. Nach dem Neuladen ist die Seite für ihn wieder zu.

---

## 2. Die eine Entscheidung

**Zeigen ist nicht Geben.**

Wer etwas zeigt, behält es. Der andere sieht es, solange das Fenster offen ist,
und hat danach nichts in der Hand: keinen Eintrag im Inventar, keine Rechte an
der Seite, keine Kopie. Genau so funktioniert ein Zettel, den man über den
Tisch hält.

Geben ist etwas anderes und hat seinen Ort schon: den Tausch in Ninjo's DnD
Shops & Trade. Beides zu vermischen, etwa „zeigen und dabei Leserechte
vergeben", machte aus einem Blick eine Rechteverwaltung, die der Spielleiter
später aufräumen müsste.

---

## 3. Drei Dinge, drei Wege

Für zwei davon benutzen wir Foundrys eigene Maschinerie. Nur für den dritten
braucht es eine eigene Nachricht, weil es in Foundry schlicht keinen Weg gibt.

### Journalseite

Über `Journal.show(seite, { users })`, Foundrys eigene Funktion. Sie verlangt,
dass der Zeigende die Seite besitzt, und sie öffnet beim Empfänger die echte
Journalansicht mit allen Bildern, Verweisen und der Formatierung. Das ist der
beste Fall: nichts nachgebaut, alles wie gewohnt.

Das trifft genau den Anlass. Ein persönlicher Brief oder ein Buch, das der
Spielleiter einem Spieler als eigene Journalseite gegeben hat, gehört diesem
Spieler, also darf er sie zeigen.

### Bild

Über `Journal.showImage(bild, { users, title, caption })`, ebenfalls Foundrys
eigene Funktion. Beim Empfänger öffnet sich das gewohnte Bildfenster.

Der Einstieg ist schon da: Wer in einer Journalseite oder einer
Gegenstandsbeschreibung auf ein Bild tippt, bekommt heute bereits Foundrys
Bildfenster. Dort fehlt nur der Knopf zum Zeigen, weil Foundry ihn für Spieler
ausblendet. Wir setzen ihn für Spieler wieder hin, aber nur, wenn das Bild aus
etwas stammt, das der Spieler besitzt.

### Gegenstand

Hier baut Foundry nichts, also eine eigene Nachricht über den Modulkanal
(`socket: true` steht schon in unserer `module.json`).

**Geschickt wird eine Momentaufnahme, keine Kennung.** Name, Bild und
Beschreibung, so wie der Besitzer sie sieht. Dafür gibt es zwei Gründe, und der
zweite ist der wichtigere:

1. Der Empfänger hat meist keine Rechte am Charakter des anderen. Eine
   Kennung, die er nicht öffnen darf, nützt ihm nichts.
2. **Ein unidentifizierter Gegenstand bleibt unidentifiziert.** dnd5e führt
   dafür `system.identified` und daneben `system.unidentified.name` und
   `.description`. Der Besitzer eines unbekannten Tranks sieht „Seltsamer
   Trank" und einen vagen Text. Genau das wird gezeigt, nie der echte Name.
   Wer eine Kennung schickte, ließe den Empfänger womöglich mehr sehen als den
   Besitzer selbst.

**Der Text wird beim Empfänger gesäubert.** Er kommt vom Rechner eines anderen
Spielers und geht dort als HTML in ein Fenster. Foundry bringt dafür
`cleanHTML` mit (`client/utils/helpers.mjs`); jede Beschreibung läuft vor der
Anzeige hindurch. Am eigenen Tisch mag das übervorsichtig wirken, es kostet aber
eine Zeile, und die In-Person Tools sind öffentlich.

Beim Empfänger erscheint eine kleine Karte: Bild groß, Name darüber, der Text
darunter, oben die Zeile **„Gezeigt von Nadylos"**.

---

## 4. An wen

Ein kleines Auswahlfenster, gebaut wie die Partnerliste im Tausch: eine Zeile
je Person mit Bild, 44 Pixel hoch, antippen reicht.

- **Alle am Tisch.** Die übliche Wahl, deshalb oben.
- **Einzelne Spieler.** Für das Flüstern hinter vorgehaltener Hand.
- **Der Fernseher.** Das ist der Teil, den nur ein Tischmodul bieten kann.

Der Fernseher ist kein Sonderfall, sondern ein Konto wie jedes andere: Unsere
Monitore sind die Konten `MonitorBM` und `MonitorSC`, und beide Wege aus
Abschnitt 3 nehmen eine Liste von Konten an. „Auf dem Fernseher zeigen" heißt
also nur, das Monitorkonto mit in die Liste zu nehmen. Der Szenen-Monitor ist
der richtige Empfänger; der Battlemap-Monitor folgt der Karte, und dort soll
kein Brief über dem Kampf hängen.

Das Fenster merkt sich die letzte Wahl je Gerät. Wer im Kampf zweimal hinter
einander dem Magier etwas zeigt, tippt nicht zweimal dieselbe Liste durch.

---

## 5. Was beim Empfänger passiert

**Gefragt wird zuerst.** Die erste gebaute Fassung schickte die Seite sofort,
und das war am Tablet falsch: In der Blattansicht füllt ein Journal den ganzen
Schirm, und wer gerade seine Zauber sortiert, verliert ihn ohne Vorwarnung.
Also kommt erst ein kleines Angebot mit zwei Knöpfen: „Ansehen" oder „Nein
danke".

**Das Angebot verfällt nach zehn Sekunden.** Wer nicht reagiert, bekommt
nichts. Ohne diese Frist stünden am Ende eines Abends fünf Fenster offen, die
jemand einzeln wegtippen muss, und genau das soll das Angebot ja verhindern.
Wegtippen zählt wie Ablehnen, nie als Zustimmung.

**Der Fernseher wird nicht gefragt.** Dort sitzt niemand, der antworten könnte,
also bekommt er die Seite sofort.

- **Am Tablet** liegt das Fenster über dem Blatt, passt in den Schirm (dafür
  sorgt `fensterpassen.js`) und geht mit dem Kreuz wieder zu.
- **Der Zeigende sieht, wer mitliest.** Das Auswahlfenster bleibt nach dem
  Abschicken stehen und wird zur Anzeige des Vorgangs: eine Zeile je Person mit
  ihrem Stand (gefragt, sieht zu, abgelehnt, keine Antwort).

**Beenden gilt für alle.** Ein Knopf im selben Fenster schließt die Seite bei
allen, auch am Fernseher. Das Fenster zu machen beendet das Zeigen ebenfalls,
denn sonst bliebe bei den anderen etwas offen, das niemand mehr beenden kann.

**Die Spielleitung kann dasselbe.** In ihrer geflüsterten Zeile im Chat steht
ein Knopf „Bei allen schließen". Sie führt den Abend und muss den Tisch
zurückholen können, ohne jemanden darum zu bitten. Ein anderer Mitspieler kann
es nicht: Die Kennung des Vorgangs steht in jedem Angebot, ist also kein
Geheimnis, und ohne diese Prüfung könnte jeder jedem das Fenster vor der Nase
zuziehen.

## 6. Die Leitplanken

- **Nur, was man besitzt.** Eine Seite, die dem Spieler nicht gehört, ein Bild
  aus einem fremden Journal, ein Gegenstand eines anderen Charakters: kein
  Knopf. Die Prüfung steht im Knopf und noch einmal beim Absenden.
- **Unidentifiziertes bleibt unidentifiziert** (Abschnitt 3).
- **Der Spielleiter liest mit.** Jedes Zeigen erzeugt eine geflüsterte Zeile an
  ihn im Chat: „Nadylos zeigt Aria und dem Fernseher: Brief des Barons". Er
  sitzt am Schreibtisch, dort ist der Chat offen, und er soll wissen, was am
  Tisch gerade herumgereicht wird, ohne ein Fenster aufgedrängt zu bekommen.
- **Kein Dauerfeuer.** Höchstens einmal alle fünf Sekunden je Spieler. Wer
  zehnmal auf den Knopf tippt, weil der Empfänger nicht reagiert, erzeugt nicht
  zehn Fenster.

---

## 7. Wo es am Tablet liegt

Kein neuer Knopf in der Menüleiste. Zeigen ist eine Handlung **an** einer
Sache, also steht der Knopf an der Sache, als Auge im Fensterkopf:

| Wo | Knopf |
|---|---|
| Gegenstandsblatt | Auge im Kopf, wenn der Spieler den Gegenstand besitzt |
| Journal | Auge im Kopf, wenn der Spieler die aktuelle Seite besitzt (Foundry zeigt es heute nur dem Spielleiter) |
| Bildfenster | Auge im Kopf, wenn das Bild aus etwas Eigenem stammt |

Alle drei hängen am selben Haken, den Foundry für Fensterköpfe anbietet
(`getHeaderControls…` je Fensterklasse). Er greift für Foundrys eigene Blätter
genauso wie für Tidy5e, ohne dass wir in fremde Fenster schreiben.

---

## 8. Einstellungen

Alle drei für die Welt, also für den Spielleiter. Sie stehen als Abschnitt
„Zeigen" auf der Seite der Blattansicht, weil es dort um die Tablets geht.

| Einstellung | Ab Werk | Wozu |
|---|---|---|
| Spieler dürfen zeigen | an | der Hauptschalter |
| Auch auf dem Fernseher | an | nimmt den Szenen-Monitor in die Auswahl auf |
| Spielleiter liest mit | an | die geflüsterte Zeile aus Abschnitt 6 |

---

## 9. Aufwand

Geschätzt, nicht gemessen, in Zeilen und nach dem Muster der vorhandenen
Dateien:

| Teil | Zeilen |
|---|---|
| Auswahlfenster „An wen" samt Vorlage | 150 |
| Nachricht, Empfangskarte, Fernseher-Zeitablauf | 200 |
| Die drei Augen in den Fensterköpfen samt Besitzprüfung | 120 |
| Einstellungen, Sprachdateien, CSS | 140 |
| Prüfungen (Besitz, Unidentifiziertes, Säubern, Taktung) | 100 |
| **zusammen** | **etwa 700** |

Etwa ein bis zwei Abende. Der teuerste Teil ist die Gegenstandskarte; die
anderen beiden benutzen, was Foundry schon hat.

---

## 10. Was ich nicht täte

- **Nicht über den Chat.** Die dnd5e-Karte gibt es schon, und sie ist für
  diesen Zweck zu klein: Das Bild ist ein Daumennagel, der Text wird
  abgeschnitten, und in der Blattansicht ist der Chat zu.
- **Keine Rechte vergeben.** Kein Ändern der Besitzrechte, auch nicht „nur
  lesend". Das wäre Geben (Abschnitt 2).
- **Das Tablet des anderen nicht übernehmen.** Das gezeigte Fenster liegt über
  dem Blatt, es ersetzt es nicht, und es geht zu, wann der Empfänger will. Am
  Fernseher ist das anders, weil dort niemand sitzt.
- **Nicht in Shops oder FANG.** Zeigen ist ein Vorgang am Tisch zwischen
  Menschen, die zusammensitzen. Das ist das Thema dieses Moduls.

---

## Nachgeprüft am Quelltext, 11.09.2026

| Befund | Fundstelle |
|---|---|
| Journal zeigen verlangt Besitz | `client/documents/collections/journal.mjs`, `show()`: `if (!doc.isOwner) throw` |
| Kopfknopf „Zeigen" nur für den Spielleiter | `client/applications/sheets/journal/journal-entry-sheet.mjs:422`: `visible: game.user.isGM` |
| Rechtsklick „Zeigen" für Besitzer | ebenda `:376`: `visible: li => getPage(li)?.isOwner` |
| Bildfenster „Zeigen" nur für den Spielleiter | `client/applications/apps/image-popout.mjs:85`: `visible: () => game.user.isGM` |
| Server reicht ohne Prüfung weiter | `dist/database/documents/journal.mjs`, Handler für `showEntry` und `shareImage` |
| Empfänger bekommt vorübergehend Beobachterrechte | `journal.mjs`, `_showEntry()`: `entry.ownership[game.userId] = OBSERVER` |
| Säubern von fremdem HTML | `client/utils/helpers.mjs:15`: `export function cleanHTML(raw)` |
| Unidentifizierte Gegenstände | dnd5e 5.3.3: `system.identified`, `system.unidentified.name` und `.description` |
| Haken für Fensterköpfe | `client/applications/api/application.mjs:765`: `hookName: "getHeaderControls"` |

## Offen

Vier Entscheidungen, die beim Spielleiter liegen:

1. **Ab Werk an oder aus?** Vorschlag: an. Am eigenen Tisch ist Zeigen etwas,
   das man erwartet; wer es nicht will, schaltet es ab.
2. **Liest der Spielleiter mit?** Vorschlag: ja, als geflüsterte Chatzeile.
   Alternative: gar nicht, weil er ohnehin mit am Tisch sitzt.
3. **Welcher Monitor bekommt es?** Vorschlag: der Szenen-Monitor. Der
   Battlemap-Monitor gehört dem Kampf.
4. **Nachzuprüfen vor dem Bau:** ob dnd5e 5.3.3 für unidentifizierte
   Gegenstände ein eigenes Platzhalterbild führt. Wenn nicht, wird bei einem
   unidentifizierten Gegenstand kein Bild gezeigt, sondern nur der
   unidentifizierte Name und Text. Ein Bild kann verraten, was ein Name
   verschweigt.
