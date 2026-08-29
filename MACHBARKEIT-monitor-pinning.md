# Machbarkeitsanalyse — Szenen-Monitor entkoppeln

Stand 28.08.2026, geprüft gegen Foundry v14.367 auf `foundry-1`. Alle
Fundstellen stammen aus dem mitgelieferten Client-Quellcode, nicht aus der Doku.

**Kurzfazit: machbar, ohne Klimmzüge.** Foundry bringt für drei der vier
Anforderungen bereits die passende Schnittstelle mit. Es braucht einen einzigen
Wrapper und etwa 150 Zeilen UI-Anbindung. Ein Fall ist dabei, den die
Aufgabenstellung nicht nennt und der sonst still danebengeht — siehe „Der
übersehene Fall".

---

## 1. Wie Foundry heute zieht

Beim Aktivieren einer Szene läuft auf **jedem** Client:

```js
// documents/scene.mjs:1412
_onActivate(active, operation) {
  if ( active ) this.view(operation.viewOptions);
  else this.unview();
}
```

Ausgelöst wird das aus `_onUpdateOperation` (`scene.mjs:1230`), sobald sich
`active` ändert. Es gibt keinen Hook davor und keine Einstellung dagegen — der
Pull ist fest verdrahtet.

Genau deshalb ist die Stelle aber auch ideal: Ein libWrapper auf
`Scene#_onActivate` fängt **alle** Aktivierungen ab, egal wodurch ausgelöst
(Kontextmenü, Makro, Modul, API). Und weil `_onActivate` lokal auf jedem Client
läuft, wirkt der Eingriff nur dort, wo das Modul ihn will — der Spielleiter
bemerkt nichts.

## 2. Der übersehene Fall

Die Aufgabenstellung beschreibt, dass der Monitor nicht **mitgezogen** werden
soll. Der Code zeigt eine zweite Bewegung, die genauso stört:

```
Szene A ist aktiv, Monitor zeigt A
GM aktiviert Szene B
  → B bekommt _onActivate(true)  → view()    Monitor wird zu B gezogen
  → A bekommt _onActivate(false) → unview()  Monitor verliert A
```

Ein Freeze, der nur `view()` abfängt, lässt den Monitor also trotzdem leer
laufen — er landet nicht bei B, aber auch nicht mehr bei A. **Beide Richtungen
müssen abgefangen werden.** Das ist der Grund, warum ein naiver Ansatz
(„einfach den Szenenwechsel überspringen") in der Praxis scheitert.

## 3. Bausteine, die bereits existieren

| Anforderung | Vorhandene Schnittstelle | Fundstelle |
|---|---|---|
| Gezielt **einen** Client schieben | `Scene#pullUsers(users, viewOptions)` | `scene.mjs:222` |
| Kontextmenü erweitern | Hook `getSceneContextOptions` | `scene-navigation.mjs:155` |
| Wissen, was der Monitor zeigt | `User#viewedScene` / `viewedLevel` | `user.mjs:51`, `users.mjs:143` |

Das ist der angenehme Teil: `pullUsers` sendet über den Socket `pullToScene` an
genau die übergebenen Konten und ist bereits GM-beschränkt. Für „Auf
Szenen-Monitor anzeigen" ist damit **keine eigene Socket-Logik nötig** — ein
Aufruf genügt:

```js
scene.pullUsers([monitorUser], { level: levelId });
```

`User#viewedScene` wird über die laufende `userActivity`-Meldung synchronisiert
(`users.mjs:141-143`), steht also auf dem Spielleiter-Client aktuell zur
Verfügung. Foundry nutzt es selbst, um im Kontextmenü zu entscheiden, ob
„Alle herholen" überhaupt sichtbar ist.

## 4. Umsetzung je Anforderung

### 4.1 Freeze (Kern)

Ein Wrapper, der auf dem Monitor-Client beide Richtungen unterdrückt:

```js
libWrapper.register(MODULE_ID, "foundry.documents.Scene.prototype._onActivate",
  function (wrapped, active, operation) {
    if (!isFrozenMonitor()) return wrapped(active, operation);
    return;   // weder view() noch unview()
  }, "MIXED");
```

`isFrozenMonitor()` kombiniert die schon vorhandene Monitor-Erkennung aus
`state.js` mit einem neuen Umschalter. Der Rest der Sitzung bleibt unberührt:
Tokens, Chat und Beleuchtung laufen weiter, nur der Szenenwechsel entfällt.

**Bewusst nicht** über `Scene#view()` gewrappt: Das würde auch manuelle
Wechsel und `pullToScene` blockieren — dann käme der Monitor gar nicht mehr
weg. `_onActivate` trifft ausschließlich den automatischen Pull.

### 4.2 Kontextmenü

Über den Hook, zwei Einträge:

```js
Hooks.on("getSceneContextOptions", (app, options) => {
  options.push({
    label: "Auf Szenen-Monitor anzeigen",
    icon: '<i class="fa-solid fa-display"></i>',
    visible: li => game.user.isGM && !!getMonitorUser()?.active,
    onClick: (event, li) => {
      const scene = game.scenes.get(li.dataset.sceneId);
      scene?.pullUsers([getMonitorUser()], { level: li.dataset.levelId });
    }
  });
  // zweiter Eintrag: Fixieren / Lösen
});
```

Der Hook-Name ist im Code als `hookName: "getSceneContextOptions"` deklariert
und wird laut Kommentar dort ausdrücklich gefeuert. Die Struktur der Einträge
(`label`, `icon`, `visible`, `onClick`) habe ich aus Foundrys eigenen Einträgen
übernommen, damit sie sich einfügen.

### 4.3 Status-Icon in der Navigation

Machbar über `getMonitorUser().viewedScene`. Zwei Wege:

- **Sauber:** Ein Render-Hook auf die Szenen-Navigation, der das Symbol setzt.
  Einen dedizierten Hook dafür habe ich **nicht** gefunden — hier ist noch
  Klärung nötig (siehe offene Punkte).
- **Robust:** Ein delegierter Beobachter, der bei Änderungen an
  `viewedScene` das Symbol nachträgt. Entspricht dem Muster, das in FANGs
  `AGENTS.md` für Journal-Schaltflächen beschrieben ist und dort seit Längerem
  hält.

Aufwand gering, aber es ist der einzige Punkt, an dem ich noch nicht sagen kann,
welcher Weg der richtige ist.

### 4.4 Shift+Klick

Ein delegierter Klick-Listener in der Capture-Phase auf `.scene`-Elemente, der
bei gedrückter Shift-Taste `preventDefault()` ruft und stattdessen den Push
auslöst. Dasselbe bewährte Muster wie oben.

**Vorbehalt:** Shift ist in Foundry häufig belegt. Ob es in der
Szenen-Navigation kollisionsfrei ist, sollte vor der Umsetzung genauso gemessen
werden wie beim Tastenkürzel — dort hatte die Annahme „Alt ist frei" nicht
gestimmt, in der Welt waren 14 Alt-Kombinationen vergeben. Falls Shift belegt
ist, wäre `Strg+Klick` oder `Alt+Klick` die Ausweichlösung.

## 5. Risiken und offene Punkte

| Punkt | Einschätzung |
|---|---|
| **Monitor lädt neu, während fixiert** | Nach dem Neuladen greift `_onActivate` nicht, weil kein Wechsel stattfindet — der Monitor landet auf der **aktiven** Szene, nicht auf der fixierten. Braucht ein Merken der letzten Szene und ein gezieltes `view()` beim Start. **Muss eingeplant werden.** |
| Render-Hook für das Symbol | Noch offen, siehe 4.3 |
| Shift+Klick belegt? | Vor Umsetzung messen |
| Monitor ohne das Modul | Freeze greift nicht. Unvermeidlich — die Logik läuft clientseitig. |
| Zusammenspiel mit dem Tischmodus | Keines. Der Wrapper sitzt auf einer anderen Methode, die Monitor-Erkennung ist bereits geteilt. |

Kein Punkt davon stellt das Vorhaben infrage.

## 6. Aufwand

| Teil | Schätzung |
|---|---|
| Freeze inklusive Neulade-Fall | ~60 Zeilen |
| Kontextmenü, zwei Einträge | ~40 Zeilen |
| Status-Symbol | ~30 Zeilen |
| Shift+Klick | ~20 Zeilen |
| Einstellungen und Übersetzungen | ~40 Zeilen |

Rund 200 Zeilen, verteilt auf eine neue Datei `monitor.js` plus Anbindung.

## 7. Empfehlung

Umsetzen, aber in zwei Schritten:

1. **Freeze und Push** — das löst das eigentliche Problem und lässt sich
   sofort messen: Szene aktivieren, prüfen, ob der Monitor stehen bleibt.
2. **Symbol und Shift+Klick** — Bequemlichkeit, danach.

Diese Reihenfolge hat sich beim Tischmodus bewährt: Erst der Kern, dann
messen, dann die Oberfläche. Beide Fehler, die dort auftraten, wären bei
umgekehrter Reihenfolge unentdeckt geblieben.

Ein Vorbehalt zum Schluss: Die Analyse beruht auf Quellcode-Lektüre, nicht auf
einem Versuch. Beim Tischmodus stimmte die Analyse — bis auf die
Hook-Reihenfolge, die erst die Messung offenlegte. Der Neulade-Fall aus
Abschnitt 5 ist der Kandidat für genau so eine Überraschung.
