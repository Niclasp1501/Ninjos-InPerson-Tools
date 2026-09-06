# Analyse: Werkzeuge, Einstellungen, Lücken

Stand 06.09.2026, Fassung 14.2611.56. Drei Fragen: Was steckt heute im
Modul und ist es noch nötig? Was gehört in den Einstellungen aufgeräumt oder
versteckt? Und was bieten andere für das Spielen am echten Tisch an, das uns
fehlt? Die rechte Spalte ist mein Vorschlag, nicht die Entscheidung.

---

## 1. Bestand: was das Modul heute ist

Sieben Werkzeuge, dazu drei Anbindungen an fremde Module. 33 Skriptdateien,
knapp 9 000 Zeilen.

| Werkzeug | Was es tut | Für wen | Zustand | Urteil |
|---|---|---|---|---|
| **Tischmodus** (Kartensperre) | Tablets laden keine Karten, optional kein Ton, Spielfeld aus; Messung; Erlaubnisliste | Spieler-Tablets | fertig, im Einsatz | **Kern.** Bleibt. Ist der Grund, warum es das Modul gibt (58,86 MB → 0). |
| **Szenen-Monitore** | Zwei Anzeigekonten: Kampfkarte folgt, Szenenmonitor lässt sich festhalten; Begleitszene; Einbrennschutz (Szenenwechsel oder schwarze Decke mit Logo) | die zwei Fernseher | fertig, im Einsatz | **Kern.** Bleibt. Niemand sonst bietet zwei Monitore mit getrennten Aufgaben. |
| **Szenendrehung** | Hochkante Karten quer, mit Lock View abgestimmt | Tisch-TV | fertig | Bleibt. Klein, gelöst, kein Pflegeaufwand. |
| **Spieler holen** | Einzelnen Spieler gezielt auf eine Szene | Spielleiter | fertig | Bleibt. Klein. |
| **Tausch** | Zwei Spieler tauschen Gegenstände/Geld über Tisch-Fenster; Ausführung beim Spielleiter; Tauschbuch | Spieler | fertig, getestet | Bleibt. **Prüfen:** ob Ninjo's Shops dasselbe Muster (Geld/Gegenstände bewegen) nicht ohnehin braucht — dann gehört die Bewegungslogik (`trade-mover.js`) geteilt, nicht doppelt. |
| **Zeit & Wetter** | Leiste mit Datum/Uhrzeit/Wetter/Jahreszeit, Kuppel mit Sonne/Mond/Dämmerung; ohne Calendaria aus dem Weltkalender | Spieler-Tablets | fertig | Bleibt. Läuft in Sheet Only *und* in der Blattansicht. |
| **Blattansicht (Beta)** | Eigener Vollbild-Modus fürs Charakterblatt: Menüleiste, Flächen (Charaktere/Chat/Notizen), Knöpfe fremder Module, Größen, Sperre, Reset durch den Spielleiter | Spieler-Tablets | Beta, am Monitor geprüft, Tablet offen | **Wird Kern**, sobald sie Sheet Only ablöst. |
| *Anbindung Sheet Only* | Leiste im Sheet-Only-Modus, Akteursauswahl ersetzen (`actorPanel`), Tauschknopf in deren Leiste, Meldungsstreifen (`notify.js`) | Übergang | fertig | **Auslaufmodell.** Solange Sheet Only am Tisch ist, bleibt es; danach raus. |
| *Anbindung Lock View* | Drehung und Ansichtsfenster folgen der Szenendrehung | Tisch-TV | fertig | Bleibt (Lock View bleibt am Tisch). |
| *Anbindung Calendaria* | Wetter, Jahreszeit, Mondphase, Sonnenzeiten | Leiste | fertig | Bleibt, optional. |
| *Bedienfenster* (Alt+T, Statuspille) | Hauptschalter, wer am Tisch sitzt, Messung | Spielleiter | fertig | Bleibt, siehe Abschnitt 2 zur Einordnung. |

**Was nicht mehr nötig ist:** heute nichts Ganzes. Was **doppelt** ist:

- `AUTO_NO_CANVAS` (Tischmodus) und `SHEETVIEW_NO_CANVAS` (Blattansicht) —
  zwei Schalter für dieselbe Maschinerie, weil ein Tablet in beiden Modi
  stecken kann. Fachlich richtig, aber erklärungsbedürftig. Vorschlag: ein
  Satz auf beiden Seiten, der auf den anderen verweist.
- Zwei Wege zum Tauschknopf (Sheet Only `#so-main-buttons` und unsere
  Leiste) — verschwindet mit Sheet Only.
- `notify.js` (eigener Meldungsstreifen) — nur für Sheet Only nötig, weil das
  `#notifications` versteckt. Verschwindet mit Sheet Only.

## 2. Einstellungen: aufräumen und verwahren

Heute stehen in Foundrys Einstellungsliste **sechs Seiten** und **drei lose
Schalter**:

| Eintrag | Art | Bewertung |
|---|---|---|
| Bedienfenster (`panel`) | Seite | Ist kein Einstellungs-, sondern ein Betriebsfenster (Alt+T). In der Liste verwirrt es neben „Tischmodus einrichten“. **Vorschlag:** aus der Liste nehmen; erreichbar über Alt+T, die Statuspille und einen Knopf auf der Tischmodus-Seite. |
| Tischmodus | Seite | bleibt |
| Tauschen | Seite | bleibt |
| Blattansicht (Beta) | Seite | bleibt; nach dem Tablet-Test ohne „Beta“ |
| Zeit & Wetter | Seite | bleibt |
| Szenen-Monitore | Seite | bleibt (ist die größte; Einbrennschutz könnte ein Unterabschnitt bleiben) |
| **Akteursauswahl von Sheet Only ersetzen** (`actorPanel`, Welt) | loser Schalter | **Verwahren.** Wirkt nur mit Sheet Only. Vorschlag: nur registrieren/anzeigen, wenn Sheet Only aktiv ist — sonst ein toter Schalter für jeden, der das Modul aus dem Katalog installiert. Langfristig raus. |
| **Tischmodus auf diesem Gerät** (`selfMode`, Client: auto/an/aus) | loser Schalter | Bleibt als Client-Schalter (jedes Gerät muss es selbst wählen können). Aber der Name muss sagen, dass es *dieses Gerät* betrifft; heute klingt es wie eine Weltregel. |
| **Statusanzeige einblenden** (`showPill`, Client) | loser Schalter | Bleibt; klein. Könnte mit `selfMode` in einen Abschnitt „Dieses Gerät“ — Foundry erlaubt keine Abschnitte, aber eine gemeinsame Namensvorsilbe („Dieses Gerät: …“) reicht. |
| `noCanvasOwned`, `migrated…`, `sizeCache`, `monitorPinned/Scene`, `sheetViewReset` | intern, `config:false` | richtig verwahrt; nichts zu tun |

**Reihenfolge in der Liste.** Foundry sortiert nach Registrierung. Sinnvoll
wäre: Tischmodus → Szenen-Monitore → Blattansicht → Zeit & Wetter → Tauschen,
dann die Geräteschalter. Heute steht das Bedienfenster zuerst.

**Sprache.** Alles in `de` und `en`, der Prüfer erzwingt Gleichstand. FANG hat
zehn Sprachen, wir zwei — für ein Modul im Katalog reicht `en` als Pflicht,
mehr ist Kür. Kein Handlungsbedarf, solange niemand danach fragt.

**Beschreibung im Katalog** (`module.json`) nennt Sheet Only als Partner und
die Blattansicht gar nicht. Muss nach dem Tablet-Test neu — die README ebenso
(sie hat Abschnitte für Kartensperre, Monitore, Drehung, Holen, Lock View,
Sheet Only; weder Tausch noch Zeit & Wetter noch Blattansicht).

## 3. Blick in den Katalog: was andere für den echten Tisch anbieten

Gesichtet: Foundry-Katalog, Foundry Hub („Using Foundry for In-Person
Gaming“) und die Seiten der genannten Module.

| Modul | Was es tut | Haben wir das? | Lücke? |
|---|---|---|---|
| **Sheet Only** | Tablet zeigt nur das Blatt; Leiste mit Knöpfen; Benutzerwahl; Chat, Journal, Zielen, Figuren | Blattansicht (Beta) — bis auf Zielen/Figuren, bewusst | nein |
| **Foundry Tabletop Helpers** (neu, v13+) | Touch-Blätter für Tablet/Handy in eigenem Design, **druckbare Papierblätter** (Charakter, NSC, Gruppe, Begegnung), Fensterdrehung | Blatt: ja (Tidy). Druck: **nein**. Drehung: ja (Szene) | **Druckblatt** — am Tisch echt nützlich (Spieler ohne Tablet, Backup bei Akku leer). Mittelgroß. |
| **Swipe – Mobile VTT** | Handy-Oberfläche, Touch-Gesten, Avatar-Karussell, Chat-Schublade, eigene 5e-Handyblätter (bezahlt) | Tablet ja, **Handy nein** | Handyformat ist bei uns ungeprüft. Kleine Lücke, solange am Tisch Tablets liegen. |
| **MobiVTT** | Charakterblatt im Browser auf jedem Gerät | wie oben | nein |
| **Monk's Common Display** | Ein Spielerkonto als Fernseher: Oberfläche weg, Auswahl, was bleibt (Chat, Kampfverfolgung); geteilte Bilder nach Zeit wieder schließen; Fokus auf Szene/Token | Monitore: ja, zwei statt einem. **Oberfläche ausblenden auf dem TV** und **geteilte Bilder automatisch schließen**: bei uns nicht — das erledigt heute Lock View / Display Mode | **Prüfen:** Was zeigt unser Fernseher-Konto heute an Oberfläche? Wenn Lock View das abdeckt, keine Lücke. „Geteilte Bilder nach 30 s schließen“ wäre klein und passt zu den Monitoren. |
| **Display Mode** | Ein Knopf blendet Seitenleiste, Navigation, Werkzeuge aus | siehe oben | wie oben |
| **TouchVTT** | Touch am Tisch-TV: Figuren ziehen, Zoom, Lineal, lange drücken | nein — anderes Thema (Eingabe am TV) | keine Lücke *für uns*; bleibt ein eigenes Modul, das man daneben installiert |
| **Lock View / Gaming Table Player / Always Centred / Hot Seat** | Ansicht des TV steuern, Zoom auf Miniaturmaß, während des Zugs nicht schwenken | Lock-View-Anbindung ja | nein |
| **Material Deck / Material Plane** | Stream-Deck-Knöpfe; Sensor verfolgt echte Miniaturen | nein — Hardware-Thema | nein |
| **Physical Dice Rolls / Real Dice; Foundry-Kern V12+ „Manual Rolls“; Joe's Real Rolls (Kamera)** | Ergebnis echter Würfel eintippen statt würfeln | **Kern kann es** (je Client unter Würfel-Konfiguration). In der Blattansicht erreichbar über den Einstellungen-Knopf | **Kleine Lücke:** ein Schalter „Ich würfle mit echten Würfeln“ direkt in unserer Menüleiste — Sheet Only hatte genau das („Real Dice für alle“). Klein. |
| **PopOut!** | Blatt in eigenes Browserfenster | nicht nötig (Tablet = Blatt) | nein |
| **Simple Fog / Shared Vision / Shared Token Visibility** | Sicht am gemeinsamen TV | nein — Sichtregeln sind Tisch-TV-Thema, Lock View + Kern | nein |
| **Close Player Art** | Geteilte Bilder bei Spielern schließen | wie bei Monk's | siehe oben |
| **Party Sheet / GM Screen** | Gruppenübersicht, Spielleiterschirm | nein | Nicht unser Thema; FANG/NDRS decken Übersichten ab |

**Was uns wirklich fehlt** — nach Nutzen am Tisch sortiert:

1. **„Wer ist dran“ auf dem Tablet.** Kein gesichtetes Modul zeigt einem
   Spieler auf seinem Blatt, dass er in der Initiative dran ist. Am Tisch ruft
   es der Spielleiter — aber ein Streifen „Du bist dran“ auf dem Tablet (und
   „Nächster: …“) wäre genau das, was ein Tisch-TV nicht leisten kann. Klein
   bis mittel; Kampfverfolgung liefert die Hooks.
2. **Geteilte Bilder auf den Fernsehern nach Zeit schließen** (Monk's Common
   Display, Close Player Art). Klein, passt zu den Szenen-Monitoren.
3. **Echte Würfel** als Schalter in der Menüleiste (Kern-Funktion, nur der
   Zugang fehlt). Klein.
4. **Druckbares Charakterblatt** (Foundry Tabletop Helpers). Mittel; als
   Backup für Tablets ohne Akku. Erst, wenn jemand es vermisst.
5. **Handyformat** der Blattansicht. Ungeprüft. Erst, wenn ein Handy am Tisch
   liegt.

**Was wir haben und sonst niemand:** zwei Monitore mit getrennten Aufgaben,
Einbrennschutz, Kartensperre mit Messung, Tausch zwischen Spielern am Tisch,
Zeitleiste mit Kuppel ohne Zwang zu einem Kalendermodul, Knöpfe fremder Module
über eine Schnittstelle statt DOM-Suche.

## 4. Optimierungen allgemein

**Code.** `sheetview.js` ist mit rund 1 100 Zeilen die größte Datei und trägt
fünf Themen: Leisten bauen, Ziehen/Plätze, Flächen (Popouts), Felder
(Lautstärke/Größe), Anbindung fremder Knöpfe. Ein Schnitt in `sheetview-bars.js`
(Leisten, Ziehen, Größen) und `sheetview-panels.js` (Flächen, Geister) würde
das nächste Suchen halbieren. Kein Muss vor dem Tablet-Test.

**Laufzeit.** Die Leiste sieht alle zehn Sekunden nach der Zeit (`installClock`),
die Blattansicht räumt Hüllen mehrfach nach (`queueSweep`); beides gemessen
harmlos. Der eine echte Posten auf dem Tablet ist das Spielfeld — und das
schalten beide Modi ab. Kein Handlungsbedarf.

**Prüfungen.** `tools/validate.mjs` (Struktur, Sprache, CSS-Klassen),
`test-trade-state.mjs`, `test-clock-seasons.mjs`. Es fehlt eine Prüfung für
die Mondphase (die Bogenrichtung war zwei Fassungen lang falsch, ohne dass es
etwas gemerkt hat) und für die Dämmerung. Klein, lohnt.

**Dokumentation.** README und Katalogbeschreibung hinken drei Werkzeuge
hinterher (Abschnitt 2). CHANGELOG hat 50 Einträge auf `14.2611.x` — für den
Release reicht eine Zusammenfassung oben.

**Sheet Only.** Sobald die Blattansicht am Tablet besteht: Sheet Only vom
Tisch, dann `sheet-only.js`, `notify.js`, `actor-panel.js` und den Schalter
`actorPanel` entfernen — rund 900 Zeilen und drei Einstellungen weniger, und
kein GPL-Modul mehr im Gespräch.

**Beta-Ausgang.** Bedingungen, ab denen „(Beta)“ vom Namen kann: ein
Spielabend am echten Tablet hoch und quer ohne Geist, ohne Flackern, mit FANG/
NDRS-Knöpfen; Gegenstands- und Zauberfenster vom Blatt aus bedienbar; kein
Konto in beiden Modi.

## 5. Vorschlag für die Reihenfolge

1. Tablet-Test der Blattansicht (du) — alles Weitere hängt daran.
2. Einstellungen aufräumen: Bedienfenster aus der Liste, `actorPanel` nur mit
   Sheet Only, Gerätschalter benennen, Reihenfolge. Eine Stunde.
3. „Du bist dran“-Streifen in der Blattansicht. Ein Nachmittag.
4. Echte-Würfel-Schalter in der Menüleiste. Eine Stunde.
5. Geteilte Bilder auf den Monitoren nach Zeit schließen. Eine Stunde.
6. README und Katalogtext neu, Mond-/Dämmerungsprüfung. Ein Nachmittag.
7. Nach dem Sheet-Only-Abschied: Anbindung entfernen, „Beta“ streichen.

Quellen: [Sheet Only](https://foundryvtt.com/packages/sheet-only),
[Foundry Tabletop Helpers](https://foundryvtt.com/packages/foundry-tabletop-helpers),
[Swipe – Mobile VTT](https://foundryvtt.com/packages/swipe-vtt),
[MobiVTT](https://foundryvtt.com/packages/mobivtt),
[Monk's Common Display](https://foundryvtt.com/packages/monks-common-display),
[TouchVTT](https://foundryvtt.com/packages/touch-vtt),
[Display Mode](https://foundryvtt.com/packages/displaymode),
[Gaming Table](https://foundryvtt.com/packages/gaming-table),
[Physical Dice Rolls](https://foundryvtt.com/packages/physical-dice-rolls),
[Real Dice](https://foundryvtt.com/packages/real-dice),
[Joe's Real Rolls](https://www.joesrealrolls.com/foundry/),
[Foundry Hub: Using Foundry for In-Person Gaming](https://www.foundryvtt-hub.com/guide/using-foundry-for-in-person-gaming/).
