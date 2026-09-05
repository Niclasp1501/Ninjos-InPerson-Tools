# Analyse: unsere Blattansicht gegen Sheet Only

Stand 05.09.2026, Blattansicht 14.2611.39 (Beta). Grundlage: Sheet Onlys
Einstellungsliste und Knopfleiste, wie sie am Bildschirm und in dessen
Sprachdatei stehen, und was Nadylos' Tablet heute tatsächlich zeigt. Kein
Blick in deren Quelltext für diese Liste.

Zweck: gemeinsam entscheiden, was wir davon **brauchen**, was wir **anders**
wollen und was **wegbleibt**. Die rechte Spalte ist mein Vorschlag, nicht die
Entscheidung.

---

## 1. Was Sheet Only kann — und wo wir stehen

| Sheet Only | Bei uns | Vorschlag |
|---|---|---|
| **Wer bekommt die Ansicht** — Benutzer einzeln auswählen | Alle Spieler mit zugewiesenem Charakter, Spielleiter nie | **Brauchen wir.** Wie beim Tischmodus: Liste der Konten, Häkchen. Sonst zwingt der Schalter jeden Spieler hinein, auch den am Laptop. |
| **Nur auf Mobilgeräten** anzeigen | fehlt | Dazunehmen, als zweite Bedingung neben der Auswahl. Ein Konto kann am Laptop normal und am Tablet in der Ansicht sein. |
| **Spielfeld abschalten / verstecken / lassen** | Wir verstecken nur `#interface`; das Spielfeld lebt weiter | **Brauchen wir** — Leistung auf dem Tablet. Wir haben mit `AUTO_NO_CANVAS` schon die Maschinerie im Tischmodus; die Blattansicht sollte sie mitbenutzen. |
| **Benachrichtigungen anzeigen** (Schalter, Standard aus) | Immer sichtbar | Bleibt so. Dass sie aus waren, hat uns den Meldungsstreifen gekostet. |
| **Ziehzeit** für die Leiste einstellbar (Standard 500 ms) | fest 400 ms | Einstellung nachreichen, klein. |
| **Kleine Schirme**: Leiste unten, volle Breite (< 800 px) | Leiste verschiebbar, kein Sonderfall | Für Handys prüfen; für Tablets nicht nötig. |
| **Chat als Vollbild** (Schalter) | Chat als Seitenfenster rechts | Entscheiden. Am Tablet quer ist die Spalte gut, hoch ist Vollbild besser — also eher automatisch nach Lage als per Schalter. |
| **Chat öffnet sich beim Benutzen** eines Gegenstands (dnd5e) | fehlt | **Brauchen wir.** Wer einen Trank benutzt, will das Ergebnis sehen, ohne zu tippen. |
| **Lautstärke** Playlist / Umgebung / Oberfläche | fehlt | Sinnvoll, wenn Tablets Ton haben. Bei uns läuft Audio meist über den Tisch, nicht über Tablets — nachfragen. |
| **Real Dice**: manuelles Würfeln für alle Spieler | fehlt | Nur wenn Real Dice am Tisch bleibt. |
| **Verwandeln-Knopf** (Suche über Spotlight/Quick Insert) | fehlt | Selten. Erst einmal nicht. |
| **Akteursliste** als eigene Schiebeleiste mit Bildern | Foundrys Verzeichnis als Seitenfenster | Ihre ist hübscher, unsere ist Foundry. Entscheiden nach dem Spielabend. |
| **Blatt weicht dem Seitenfenster aus** (wird schmaler) | Fenster liegt über dem Blatt, verdeckt rechts | **Entscheiden — siehe Abschnitt 3.** |
| **Knopfleiste offen für andere Module** (`#so-main-buttons`: FANG, NDRS hängen dort) | fehlt — **FANG erscheint nicht** | **Brauchen wir.** Siehe Abschnitt 2. |
| Schriftgröße + / − / Zurücksetzen | + / − über `zoom` | Zurücksetzen fehlt; ein langer Druck auf einen der beiden könnte es sein. |
| Vollbild, Abmelden | vorhanden, Abmelden mit Rückfrage | fertig |
| Spiel-Einstellungen öffnen (`#so-fvtt-settings`) | fehlt | Dazunehmen: Ein Spieler muss an Lautstärke, Sprache, seine Modul-Einstellungen kommen. Hinter dem ☰. |
| Zielen, Figuren steuern (Bezahlteil) | bewusst nicht | bleibt weg |
| Gegenstandsfenster auf kleinen Schirmen volle Breite | ungeprüft | Testen: Gegenstand vom Blatt öffnen, sehen, ob er bedienbar ist. |

## 2. Was uns fehlt — nach Gewicht

**Stand 14.2611.40:** 1, 2, 3, 4 und 5 sind gebaut, dazu Ziehzeit und
Schrift-Zurücksetzen. Offen aus 6: Nur-Mobil und Lautstärke — Entscheidung
steht aus. Der Seitenfenster-Punkt (Abschnitt 3) ebenfalls.

1. **Benutzerauswahl.** Ohne sie ist der Beta-Schalter ein Alles-oder-nichts.
   Aufwand klein, Muster im Tischmodus vorhanden.
2. **Knöpfe fremder Module.** FANG und NDRS suchen `#so-main-buttons`. Zwei
   Wege: ein Element mit genau dieser ID in unserer Leiste (sofort wirksam,
   ohne FANG anzufassen) oder eine eigene Anmeldung `Hooks.call("inperson…")`,
   die FANG dann lernen muss. Ich würde beides tun — die ID für heute, den Hook
   für morgen. Fallstrick: Unser eigener Tauschknopf meldet sich ebenfalls an
   `#so-main-buttons` und stünde dann doppelt da.
3. **Spielfeld abschalten.** Leistung. Maschinerie vorhanden.
4. **Chat beim Benutzen öffnen.**
5. **Einstellungen-Knopf** für Spieler.
6. Ziehzeit, Zurücksetzen der Schriftgröße, Nur-Mobil, Lautstärke: klein,
   aber jedes einzeln zu entscheiden.

## 3. Das Seitenfenster: über dem Blatt oder daneben?

Heute: Charaktere, Chat, Notizen legen sich **über** das Blatt am rechten
Rand. Das Blatt bleibt volle Breite; was rechts steht (Rettungswürfe,
Merkmale-Knöpfe, Erfahrung), ist verdeckt, solange das Fenster offen ist.

Sheet Only macht das Blatt **schmaler** — das Fenster steht daneben, nichts
ist verdeckt, aber das Blatt bricht auf 1500 statt 2000 Pixeln um.

Drei Möglichkeiten:

- **Daneben, immer.** Wie Sheet Only. Sauber, aber im Hochformat bleibt dem
  Blatt kaum Breite.
- **Darüber, immer.** Wie jetzt. Kein Umbruch, dafür verdeckt.
- **Nach Lage.** Quer: daneben, das Blatt gibt 340 px ab. Hoch: darüber, weil
  daneben nicht geht. Das ist die Regel aus dem Konzept („wo Platz ist, darf
  es stehen bleiben") — nur hatte ich sie bisher nicht gebaut.

Mein Vorschlag ist die dritte. Das Muster für das Schmalermachen steht schon
in `actor-panel.js` (`calc(100vw - 300px)`), und die Lage kennt eine
Medienabfrage.

## 4. Was wir besser machen als Sheet Only

Damit die Liste oben nicht wie ein Rückstand liest:

- **Meldungen bleiben sichtbar.** Bei Sheet Only sind sie aus, es sei denn,
  man schaltet sie ein — und dann sieht man sie an einer Stelle, die dafür
  nicht gemacht ist.
- **Keine Geisterfenster**, gemessen über alle Wege und Tipp-Geschwindigkeiten.
- **Zeitleiste mit Kuppel**, aus dem Weltkalender gerechnet, ohne Abhängigkeit.
- **Tausch** als Knopf in der Leiste.
- **Monks Little Details** blockiert das Akteursverzeichnis nicht mehr.
- Läuft **ohne Sheet Only** — das war der Zweck.

## 5. Offen und ungeprüft

- Ein Spielabend am echten Tablet, hoch und quer. Alles oben ist am Monitor
  geprüft, in Nadylos' Fenster, bei 2075 Pixeln Breite.
- iPad: Vollbild, Sicherheitsabstände, Gummiband-Scrollen (Konzept, Abschnitt
  1b) — nie gesehen.
- Gegenstands- und Zauberfenster, die vom Blatt aus aufgehen.
- Sheet Only und unsere Ansicht gleichzeitig aktiv: Was passiert? Vermutlich
  Streit um dieselben Elemente. Bis zur Entscheidung sollte pro Benutzer nur
  eines von beiden laufen.
