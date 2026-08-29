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
cd "F:\KI-Agenten-Workspace\Ninjos-InPerson-Tools"
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
