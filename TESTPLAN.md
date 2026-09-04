# Testplan — Ninjo's In-Person Tools

Stand: noch nie in einer Welt gelaufen. Alles unten ist aus dem v14-Quellcode
abgeleitet, nichts davon ist gemessen.

Ziel des Plans: in dieser Reihenfolge testen, damit ein Fehler früh auffällt und
nicht erst, wenn schon fünf Dinge gleichzeitig neu sind.

**Abbruchregel:** Jede Stufe hat ein Ergebnis. Stimmt es nicht, hier stoppen und
den Fehler klären, statt zur nächsten Stufe zu gehen.

---

## Vorbereitung

Server: `foundry-testv14` (198 Module, `test`-Welt, lib-wrapper vorhanden).
Produktion bleibt außen vor, bis Stufe 6 durch ist.

```powershell
cd "F:\KI-Agenten-Workspace\Foundry-Module\Ninjos-InPerson-Tools"
.\tools\deploy-inperson.ps1 -Target testv14 -DryRun
.\tools\deploy-inperson.ps1 -Target testv14
```

Zwei Browserfenster brauchst du:

| Fenster | Konto | Zweck |
|---|---|---|
| A — normal | Spielleiter | Steuerung, Vorladung auslösen |
| B — privates Fenster | ein Spieler | das Testobjekt |

Getrennte Fenster sind nötig, weil `core.noCanvas` und die Selbst-Einstellung
im localStorage pro Browserprofil liegen.

In der Testwelt sollte eine Szene mit einer **großen** Karte aktiv sein — sonst
misst du nichts Aussagekräftiges. Auf dem Server liegen 417 Dateien über 15 MB,
die größte ist `BirdiesCommunityPack20/Battlemaps/GiantVillageBaseVTT.png` (35 MB).

---

## Stufe 1 — Lädt das Modul überhaupt?

Nur Fenster A, Modul aktivieren, Welt neu laden.

- [ ] Modul erscheint in der Modulliste als „Ninjo's In-Person Tools"
- [ ] Konsole (F12) zeigt keine roten Fehler beim Start
- [ ] Konsole zeigt `ninjos-inperson-tools | Wrappers installed via lib-wrapper.`

**Wenn das fehlschlägt:** wahrscheinlich der Settings-Menu-Shim
(`main.js`, `InPersonPanelShim`) oder ein Pfad in `module.json`. Die
Fehlermeldung in der Konsole sagt welches.

**Risikostelle:** Der Shim ist ein Kunstgriff — Foundry verlangt für
`registerMenu` eine ApplicationV2-Unterklasse, die Prüfung sitzt in
`client-settings.mjs:189`. Die besteht er; ob Foundry danach noch etwas mit der
Instanz macht, ist ungetestet.

---

## Stufe 2 — Öffnet sich die Steuerung?

- [ ] Einstellungen → Moduleinstellungen → „Steuerung öffnen" öffnet das Panel
- [ ] Alle Spieler sind gelistet, mit Farbpunkt und Zustand
- [ ] Dein Monitor-Konto trägt das grüne Schild-Abzeichen
- [ ] Knopf „Vermessen" liefert eine plausible Größe für die aktive Szene

Das Vermessen ist der billigste Realitätsabgleich: Zeigt es 30 MB, stimmen die
HEAD-Anfragen und die Szenen-Quellen wurden richtig eingesammelt. Zeigt es 0 B
oder „unvermessen", stimmt `collectSceneSources` nicht (v14 nutzt
`scene.levels[].background.src`, v13 `scene.background.src` — beide sind
implementiert, aber nur eine Variante ist je real getestet).

---

## Stufe 3 — Der Kernbeweis: geht wirklich nichts raus?

Das ist der Test, um den es eigentlich geht. Alles davor war Vorgeplänkel.

**Vorher** in Fenster A: Hauptschalter an, den Testspieler auf „Immer" stellen.
**In Fenster B:** F12 → Netzwerk → Filter `.webp`, dann Liste leeren.

Jetzt in Fenster A: Rechtsklick auf eine Szene in der Navigation →
**„Szene vorladen"**.

- [ ] In Fenster B erscheint **keine einzige** Zeile im Netzwerk-Tab
- [ ] Kein Ladebalken in Fenster B
- [ ] Die Statusanzeige unten in Fenster B zählt hoch

**Gegenprobe — unbedingt machen:** Testspieler auf „Nie" stellen, Netzwerkliste
leeren, Vorladung wiederholen. Jetzt *müssen* die Megabytes kommen. Ohne diese
Gegenprobe weißt du nicht, ob du gerade Wirkung siehst oder nur einen
Browser-Cache.

Danach dasselbe mit einem echten Szenenwechsel statt Vorladung.

---

## Stufe 4 — Ist etwas kaputt?

Das ist die Frage, die im Zweifel schwerer wiegt als die Ersparnis. Weiter in
Fenster B, Tischmodus aktiv:

- [ ] Actor-Sheet öffnet sich, Portrait ist sichtbar
- [ ] Item-Sheets, Kompendien öffnen normal
- [ ] Journal öffnet sich, eingebettete Bilder sind da
- [ ] Chat funktioniert, Würfelwurf inklusive Würfelgeräusch
- [ ] Token lassen sich bewegen, Zielen und Messen geht
- [ ] Raster, Wände und Licht sitzen an der richtigen Stelle
- [ ] Konsole bleibt frei von roten Fehlern

Erwartung aus dem Quellcode: `loadTexture`/`getTexture` kommen im ganzen
`applications/`-Verzeichnis nur in `scene-config.mjs` und `grid-config.mjs` vor,
also in GM-Werkzeugen. Sheets und Journale rendern über DOM-`<img>` und fassen
den TextureLoader nie an. Wenn hier trotzdem etwas fehlt, ist meine Annahme
falsch — dann bitte melden, welches Bild fehlt.

**Bewusst zu erwarten:** Dice-So-Nice-Würfelgeräusche schweigen, weil sie unter
`modules/` liegen statt unter `sounds/`. Falls sie bleiben sollen:
`dice-so-nice` ins Feld *Ausnahmen*.

---

## Stufe 5 — Zusammenspiel mit Sheet-Only

Der heikelste Punkt, weil beide Module dieselbe Core-Option anfassen.

- [ ] Einstellung „Spielfeld im Tischmodus ganz abschalten" einschalten
- [ ] Fenster B bekommt den Reload-Dialog, nach Reload ist kein Spielfeld da
- [ ] Sheet-Only funktioniert weiter wie gewohnt
- [ ] Tischmodus wieder aus → Fenster B bekommt das Spielfeld zurück
- [ ] Sheet-Only allein aktiviert → Tischmodus fasst dessen `noCanvas` **nicht** an

Der letzte Punkt ist der wichtige: Table Mode merkt sich in
`noCanvasOwned`, ob es das Flag selbst gesetzt hat, und gibt nur ein selbst
gesetztes wieder frei. Wenn Sheet-Only nach dem Abschalten des Tischmodus sein
Spielfeld verliert, ist genau diese Buchführung kaputt.

---

## Stufe 6 — Erst dann Produktion

Nicht während einer laufenden Sitzung. Produktion hat verbundene Spieler.

```powershell
.\tools\deploy-inperson.ps1 -Target prod -DryRun
.\tools\deploy-inperson.ps1 -Target prod
```

Danach Welt neu laden (macht der Mensch, nicht der Agent), Hauptschalter
zunächst **aus** lassen und erst in einer ruhigen Minute einschalten.

Der ehrliche Test ist ohnehin die nächste echte Sitzung: Läuft das WLAN
spürbar ruhiger, halten die Akkus länger.

---

## Was nach den Tests noch fehlt

Kein Testthema, aber offen:

- **GitHub-Repo existiert nicht.** `module.json` verweist auf
  `Niclasp1501/Ninjos-InPerson-Tools` samt Release-Manifest. Solange es das Repo
  nicht gibt, ist das Modul nicht über die Manifest-URL installierbar — per
  Deploy-Skript funktioniert es trotzdem.
- **Kein `AGENTS.md`** im Projekt, wie FANG es hat.
- **Keine Release-Workflows**, FANG hat dafür `.github/workflows/`.
- **`ParticleEffect#lookupTexture`** bleibt eine bewusst offene Lücke
  (`particle-generator.mjs:2986`, ~68 KB Partikelbilder). Nicht behebbar ohne
  einen zweiten Wrapper, und die Größe rechtfertigt ihn nicht.

---

## Tausch — der Durchlauf zum Nachspielen

Stand 14.2611.10. Der Beweger (`trade-mover.js`) und das Tauschbuch sind an
Wegwerf-Akteuren in `farun4` gemessen; alles darüber — Anfrage, Tisch, Zustimmen
— ist bisher nur statisch geprüft: alle Skripte parsen, alle Vorlagen
übersetzen und rendern in allen sechs Zuständen, beide Sprachen vollständig.
**Im Spiel gelaufen ist es noch nicht.**

Gebraucht werden drei Fenster: Spielleiter, Spieler A, Spieler B. Beide Spieler
brauchen einen zugewiesenen Charakter.

| # | Handlung | Erwartung |
|---|---|---|
| 1 | Spieler A: Knopf **Tauschen** über der Spielerliste (im Sheet-Only-Modus in dessen Knopfleiste) | Liste der angemeldeten Mitspieler, jeder Eintrag eine große Zeile |
| 2 | Spielleiter abmelden, dann Schritt 1 | Hinweis „Ein Tausch braucht einen angemeldeten Spielleiter"; keine Liste |
| 3 | A wählt B | Bei A „Warte auf Antwort", bei B „A möchte mit dir tauschen" |
| 4 | B lehnt ab | Beide Fenster schließen, beide sehen „Der Tausch wurde abgelehnt" |
| 5 | Neu anfragen, B stimmt zu | Bei beiden der Tisch: links der eigene Name mit Goldlinie, rechts der andere |
| 6 | A: **Gegenstände**, einen Stapel auf 3 stellen, **Auf den Tisch legen** | Auswahlfläche verschwindet, Zeile „Name ×3" steht bei beiden auf A's Seite |
| 7 | A: **Geld**, 12 Gold, auf den Tisch | Zweite Zeile mit Münzsymbol, ebenfalls bei beiden |
| 8 | A einen Behälter mit Inhalt auf den Tisch legen | Unter dem Behälter steht klein „darin: …" mit allen Sachen, auch verschachtelten |
| 9 | Beide **Einverstanden** … | … aber vorher: B stimmt zu, dann ändert A das Angebot |
| 10 | ↑ nach der Änderung | B's Häkchen „einverstanden" ist weg — **das ist die wichtigste Zeile in dieser Tabelle** |
| 11 | Beide stimmen zu | Kurz „Der Tausch wird ausgeführt", dann schließen beide Fenster, Meldung „abgeschlossen", Chatkarte im Chat |
| 12 | Inventare prüfen | Stapel bei A um 3 kleiner, bei B ein neuer Eintrag mit 3; Gold verschoben; Behälter samt Inhalt **und samt des Geldes im Behälter** bei B, verschachtelte Ebenen erhalten |
| 13 | Ausrüstung prüfen | Nichts ist bei B als angelegt oder eingestimmt markiert |
| 14 | Stapel prüfen | Hatte B den Gegenstand schon, liegt er jetzt **zweimal** da. Das ist Absicht: nichts wird in einen Stapel einsortiert, der mit dem Tausch nichts zu tun hat |
| 15 | Spielleiter: Journal **Tauschbuch** | Eine Seite je Tausch, Stand „erledigt", beide Angebote vollständig, darunter was angelegt und entfernt wurde |
| 16 | Während eines laufenden Tauschs das Fenster mit dem X schließen | Der Tausch wird abgebrochen, der andere bekommt „… hat den Tausch abgebrochen" |
| 17 | Zweite Anfrage an jemanden, der schon tauscht | Hinweis „Einer von euch beiden ist bereits in einem Tausch"; der laufende bleibt unberührt |

Fällt Schritt 11 auf halber Strecke um, ist genau dafür das Tauschbuch da: die
Seite steht schon da, bevor irgendetwas bewegt wurde, und sagt danach, was
tatsächlich passiert ist.

**Auf dem Tablet gesondert prüfen:** dass die Auswahlfläche mit dem Finger
bedienbar ist und nichts gezogen werden muss. Das war der Anlass für die ganze
Funktion.

**Wer Item Piles einsetzt:** dessen `showTradeButton` abschalten, sonst stehen
zwei Tauschknöpfe nebeneinander.

---

## Zeitleiste und Akteurspanel — der Durchlauf am Sheet-Only-Client

Stand 14.2611.15. Beides ist bisher nur an einem **künstlich erzeugten**
Container geprüft worden: Datenquelle, Einhängen, Wiederkehr nach Neuaufbau,
keine Doppelung, Minutenbremse. Auf einem Client, der wirklich im
Sheet-Only-Modus läuft, hat es **noch nie jemand gesehen.** Genau darum geht es
hier.

Gebraucht wird ein Fenster, das tatsächlich in diesem Modus ist — ein zweites
Browserfenster mit einem Spielerkonto oder das Tablet.

### Die Leiste

| # | Handlung | Erwartung |
|---|---|---|
| 1 | Sheet-Only-Client öffnen | Über dem Charakterblatt eine schmale Leiste mit Datum und Uhrzeit |
| 2 | Höhe ansehen | Etwa 33 Pixel. **Nicht** über die ganze Fensterhöhe gezogen — siehe unten |
| 3 | Ein paar Minuten Spielzeit weiterdrehen | Die Zeit ändert sich; die Leiste wird nicht bei jedem Tick neu gezeichnet, sondern erst beim Minutenwechsel |
| 4 | Wetter und Jahreszeit | Zwei Chips rechts. Der Jahreszeit-Chip muss auch dann gefüllt sein, wenn Calendaria **aus** ist und Foundrys eigener Kalender läuft |
| 5 | Charakter wechseln (Sheet Onlys Akteursliste) | Leiste ist danach wieder da, **genau einmal** |
| 6 | Einstellung „Datum und Uhrzeit im Charakterblatt" aus | Leiste verschwindet, ohne Neuladen |

Schritt 2 ist der wichtige. Sheet Only baut seinen Behälter als Flex-Zeile über
die volle Fensterhöhe, und ein Flex-Kind wird darin standardmäßig auf diese Höhe
gestreckt: gemessen **1103 statt 33 Pixel**, ein dunkler Balken über das ganze
Blatt. Keine Regel — weder unsere noch Sheet Onlys — nennt dabei unsere Klasse;
es ist reines Flex-Verhalten. Behoben mit `flex: 0 0 auto` und
`align-self: center`. Wenn der Balken je wiederkommt, ist das die Stelle.

Schritt 4 ebenso: Kalender schreiben Jahreszeiten in drei verschiedenen Formen
auf (`components.season` als fertiger Index, `dayStart`/`dayEnd` als Tag im Jahr
bei Calendaria, `monthStart`/`monthEnd` bei `CalendarData5e`). Vorher war nur die
mittlere behandelt, und unter Foundrys eigenem Kalender blieb der Chip leer.

### Das Akteurspanel

Dafür muss die Welteinstellung **„Akteursauswahl als Seitenpanel"** einmal
eingeschaltet werden; sie ist bewusst aus, weil sie einen Knopf eines fremden
Moduls übernimmt.

| # | Handlung | Erwartung |
|---|---|---|
| 7 | Einstellung an, Sheet-Only-Client neu laden | Statt Sheet Onlys eigener Akteursliste ein angedocktes Verzeichnis |
| 8 | Anderen Charakter wählen | Blatt wechselt, Panel bleibt stehen |
| 9 | Einstellung wieder aus | Sheet Onlys eigene Liste ist zurück, ohne Reste von uns |

### Wenn etwas nicht erscheint

Sheet Only blendet die Oberfläche **nicht teilweise, sondern ganz** aus —
Foundrys Meldungsbereich eingeschlossen (`$("#notifications").addClass(
"sheet-only-hide")`, dessen `index.js:902`). Eine Fehlermeldung siehst du auf so
einem Client also nicht. Für die Konsole ist das egal: `F12` zeigt sie weiterhin.
