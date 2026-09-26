/**
 * Welche Ebene der Battlemap-Monitor zeigt, und wie er Dächer öffnet.
 *
 * Foundry 14 kennt Ebenen: Erdgeschoss, Dach, Keller einer Karte in einer
 * Szene. Jeder Rechner zeigt genau eine davon. Der Battlemap-Monitor ist ein
 * Spielerkonto, das niemand bedient und das keine Figur besitzt, und genau das
 * lässt Foundry für ihn falsch entscheiden:
 *
 * **Foundry folgt jeder einzelnen Figur.** Verlässt eine beobachtete Figur die
 * angezeigte Ebene und besitzt das Konto dort selbst keine, schaltet der
 * Rechner auf ihr Ziel um (`TokenDocument.#handleMovementOperation`). Klettert
 * einer aufs Dach, geht der ganze Fernseher mit, und wer unten steht, ist weg.
 *
 * **Foundry öffnet beim Monitor keine Dächer.** Welche Figuren ein Dach
 * durchsichtig machen, entscheidet `TokenLayer#_getOccludableTokens`. Für
 * einen Spieler sind das die eigenen Figuren, und sobald er durch Figuren
 * sieht, stattdessen alle sichtbaren, aber nur solche, die gerade anklickbar
 * sind (`t.interactive`, `Token#isInteractable`). Anklickbar ist eine Figur
 * nur, wenn die Figurenebene aktiv und ein Werkzeug gewählt ist. Am Monitor,
 * dessen Oberfläche niemand bedient und oft ausgeblendet ist, trifft das nicht
 * zu: Die Liste ist leer, und jedes Dach bleibt zu, während es am
 * Schreibtisch über der angewählten Figur aufgeht.
 *
 * Die Einzelheiten und der Befund in der Welt stehen in KONZEPT-ebenen.md.
 *
 * ## Drei Arten, die Ebene zu wählen
 *
 *   autonom   der Monitor entscheidet selbst, nach den Regeln in ebeneWaehlen()
 *   foundry   wie Foundry es ohne dieses Modul täte
 *   manuell   die Spielleitung gibt eine Ebene vor, vorübergehend: zurück auf
 *             autonom geht es beim Anklicken einer Spielerfigur, beim
 *             Aktivieren einer anderen Karte und beim Start der Welt
 *
 * ## Wie es eingreift
 *
 * Jeder Ebenenwechsel geht durch `Scene#view`, Foundrys Automatik ebenso wie
 * unsere eigenen Befehle. Die Methode, die entscheidet, ist privat und lässt
 * sich nicht umhüllen, ihr Ergebnis schon: Auf dem Monitor ersetzt die Hülle
 * die gewünschte Ebene durch unsere. Ist das die, die ohnehin angezeigt wird,
 * zeichnet Foundry gar nicht erst neu. So wird das Springen verhindert statt
 * hinterher korrigiert, und das zählt: Jeder Ebenenwechsel zeichnet die ganze
 * Karte neu, ein Hin und Zurück sähe man auf dem Fernseher.
 *
 * Foundry ruft `scene.view()` auch beim Start auf; die Hülle wählt also schon
 * beim ersten Zeichnen die richtige Ebene.
 *
 * Alles hier wirkt nur auf dem Rechner, der als Battlemap-Monitor angemeldet
 * ist. Der Rechner der Spielleitung trägt nur eines bei: welche Spielerfigur
 * sie zuletzt angeklickt hat, denn das sieht außer ihr niemand.
 */

import { MODULE_ID, SETTINGS, SOCKET } from "./const.js";
import { isBattlemapDisplay, isMonitorUser } from "./state.js";
import { getBattlemapDisplay, DELIBERATE } from "./monitor.js";

export const MODI = ["autonom", "foundry", "manuell"];

/* ── Die Regeln ─────────────────────────────────────────────────── */

/**
 * Die Ebene, die der Monitor zeigen soll.
 *
 * Die erste Regel, die greift, gilt:
 *
 *   1. Im Kampf, wer dran ist. Ist eine Spielerfigur am Zug, deren Ebene. Ist
 *      ein Gegner am Zug, bleibt der Monitor, wo er ist: Er sieht nur durch die
 *      Augen der Spielerfiguren, und auf einer Ebene, auf der nur der Gegner
 *      steht, wäre der Fernseher für den ganzen Zug schwarz.
 *   2. Sonst die Spielerfigur, die die Spielleitung zuletzt angeklickt hat.
 *      Wandert sie später auf eine andere Ebene, geht der Monitor mit.
 *   3. Hat sie auf dieser Karte noch keine angeklickt, die Mehrheit der
 *      Spielerfiguren. Klettert einer von vier hoch, bleibt der Monitor unten.
 *   4. Bei Gleichstand die Ebene der Spielerfigur, die zuletzt bewegt wurde.
 *      Dann die angezeigte, dann die Anfangsebene der Szene, dann die unterste.
 *   5. Ohne Spielerfigur auf der Karte keine Meinung.
 *
 * **Das Anklicken schlägt die Mehrheit.** In der ersten Fassung (26.09.2026)
 * zählte es nur bei Gleichstand. Am Tisch hieß das: Die Spielleitung wählt
 * Amara an, zwei andere stehen oben, und der Fernseher bleibt oben. Wer eine
 * Figur gezielt anwählt, will ihre Ebene sehen. Bewegungen dagegen bleiben
 * schwach, denn sonst nähme ein einzelner Späher wie bei Foundry den ganzen
 * Fernseher mit, ohne dass jemand das wollte.
 *
 * Reine Funktion ohne Foundry, damit tools/test-ebenen.mjs sie prüfen kann.
 *
 * @param {object} lage
 * @param {{id: string, ebene: string|null, spieler: boolean, versteckt: boolean}[]} lage.figuren
 * @param {string|null} [lage.aktuell]     angezeigte Ebene, null vor dem ersten Zeichnen
 * @param {{id: string, ebene: string|null, spieler: boolean, versteckt: boolean}|null} [lage.amZug]
 * @param {string|null} [lage.angeklickt]  Figur, die die Spielleitung zuletzt angeklickt hat
 * @param {string|null} [lage.zuletzt]     Figur, die zuletzt bewegt wurde
 * @param {string|null} [lage.anfang]      Anfangsebene der Szene
 * @param {string[]} [lage.reihenfolge]    alle Ebenen, unterste zuerst
 * @returns {string|null} Ebenen-Id, oder null für „keine Meinung"
 */
export function ebeneWaehlen({ figuren = [], aktuell = null, amZug = null, angeklickt = null,
  zuletzt = null, anfang = null, reihenfolge = [] } = {}) {

  // 1. Kampf
  if (amZug) {
    if (amZug.spieler && !amZug.versteckt && amZug.ebene) return amZug.ebene;
    if (aktuell) return aktuell;
  }

  // 2. Angeklickt
  const gewaehlt = figuren.find(f => f.id === angeklickt && f.spieler && !f.versteckt && f.ebene);
  if (gewaehlt) return gewaehlt.ebene;

  // 3. Mehrheit
  const zaehlung = new Map();
  for (const figur of figuren) {
    if (!figur.spieler || figur.versteckt || !figur.ebene) continue;
    zaehlung.set(figur.ebene, (zaehlung.get(figur.ebene) ?? 0) + 1);
  }
  if (!zaehlung.size) return null;
  const hoechste = Math.max(...zaehlung.values());
  const gleichauf = [...zaehlung].filter(([, anzahl]) => anzahl === hoechste).map(([ebene]) => ebene);
  if (gleichauf.length === 1) return gleichauf[0];

  // 4. Gleichstand
  const letzte = figuren.find(f => f.id === zuletzt && f.spieler && !f.versteckt);
  if (letzte && gleichauf.includes(letzte.ebene)) return letzte.ebene;
  if (aktuell && gleichauf.includes(aktuell)) return aktuell;
  if (anfang && gleichauf.includes(anfang)) return anfang;
  return reihenfolge.find(e => gleichauf.includes(e)) ?? gleichauf[0];
}

/* ── Was die Regeln über die Welt wissen müssen ─────────────────── */

/** Auf welcher Ebene eine Figur steht. */
export function ebeneVon(token) {
  return token?._source?.level ?? token?.level ?? null;
}

/**
 * Gehört diese Figur einem Spieler?
 *
 * Nicht `actor.hasPlayerOwner`: Das zählt jedes Konto ohne Spielleiterrolle,
 * also auch einen Monitor, dem jemand eine Figur überschrieben hat. Ob der
 * Monitor die Figur beobachten darf, spielt dagegen keine Rolle, sonst würde
 * eine vergessene Berechtigung still die Wahl verfälschen.
 *
 * Gemerkt je Akteur: Die Frage kommt beim Dachöffnen bei jeder Aktualisierung
 * der Verdeckung, und die Antwort ändert sich nur, wenn sich Besitz oder Konten
 * ändern (siehe spielerVergessen).
 */
const spieler = new Map();
export function istSpielerfigur(token) {
  const actor = token?.actor;
  if (!actor) return false;
  if (!spieler.has(actor.id)) {
    spieler.set(actor.id, game.users.some(u =>
      !u.isGM && !isMonitorUser(u) && actor.testUserPermission(u, "OWNER")));
  }
  return spieler.get(actor.id);
}
function spielerVergessen() {
  spieler.clear();
}

function figurAlsLage(token, verstecktZusaetzlich = false) {
  return {
    id: token.id,
    ebene: ebeneVon(token),
    spieler: istSpielerfigur(token),
    versteckt: !!token.hidden || verstecktZusaetzlich
  };
}

/** Wer im Kampf auf dieser Szene gerade am Zug ist, oder null. */
function amZugAuf(scene) {
  for (const kampf of game.combats ?? []) {
    if (!kampf.started) continue;
    const combatant = kampf.combatant;
    const token = combatant?.token;
    if (token?.parent?.id !== scene.id) continue;
    return figurAlsLage(token, !!combatant.hidden);
  }
  return null;
}

/** Zuletzt bewegte Spielerfigur, je Szene. Nur auf dem Monitor gefüllt. */
const zuletzt = new Map();

/** Zuletzt von der Spielleitung angeklickte Spielerfigur, je Szene. Nur auf dem Monitor. */
const angeklickt = new Map();

/* ── Die Einstellungen ──────────────────────────────────────────── */

export function modus() {
  try {
    const wert = game.settings.get(MODULE_ID, SETTINGS.MONITOR_LEVEL_MODE);
    return MODI.includes(wert) ? wert : "autonom";
  } catch {
    return "autonom";
  }
}

/** Die Vorgabe der Spielleitung: `{sceneId, levelId}` oder leer. */
export function vorgabe() {
  try {
    return game.settings.get(MODULE_ID, SETTINGS.MONITOR_LEVEL_FIXED) ?? {};
  } catch {
    return {};
  }
}

export function dachOffen() {
  try {
    return game.settings.get(MODULE_ID, SETTINGS.MONITOR_ROOF_OPEN) !== false;
  } catch {
    return true;
  }
}

/**
 * Wohin der Monitor auf dieser Szene soll.
 *
 * @returns {string|null|undefined} Ebenen-Id; null heißt „keine Meinung, bleib";
 *   undefined heißt „Foundry entscheidet" (Art foundry, oder die Szene hat nur
 *   eine Ebene und es gibt nichts zu wählen).
 */
export function zielEbene(scene, aktuell = null) {
  if (!scene || (scene.levels?.size ?? 0) < 2) return undefined;
  const art = modus();
  if (art === "foundry") return undefined;

  if (art === "manuell") {
    const { sceneId, levelId } = vorgabe();
    // Eine Vorgabe für eine andere Karte gilt hier nicht, und eine Ebene, auf
    // der der Monitor nichts sieht, auch nicht: Dann wie autonom.
    if (sceneId === scene.id && scene.levels.has(levelId) && siehtAuf(scene, levelId)) return levelId;
  }

  const reihenfolge = scene.levels.sorted?.map(l => l.id) ?? [];
  const wahl = ebeneWaehlen({
    figuren: scene.tokens.map(t => figurAlsLage(t)),
    aktuell,
    amZug: amZugAuf(scene),
    angeklickt: angeklickt.get(scene.id) ?? null,
    zuletzt: zuletzt.get(scene.id) ?? null,
    anfang: scene.initialLevel?.id ?? null,
    reihenfolge
  });

  // Die letzte Sicherung, für jede Wahl: Nie auf einer Ebene bleiben oder auf
  // eine gehen, auf der der Monitor nichts sieht, solange es eine andere gibt,
  // auf der er etwas sieht. Ein schwarzer Fernseher ist immer die schlechteste
  // Antwort, auch wenn die Regeln sie für richtig halten, etwa weil dem
  // Monitor das Beobachterrecht an einer Figur fehlt.
  const ergebnis = wahl ?? aktuell;
  if (ergebnis && !siehtAuf(scene, ergebnis)) return besteSicht(scene, reihenfolge) ?? wahl;
  return wahl;
}

/** Die Ebene, auf der der Monitor durch die meisten Figuren sieht, oder null. */
function besteSicht(scene, reihenfolge) {
  const monitor = getBattlemapDisplay();
  if (!monitor) return null;
  const zaehlung = new Map();
  for (const t of scene.tokens) {
    if (t.hidden || !t.sight?.enabled || !t.actor?.testUserPermission(monitor, "OBSERVER")) continue;
    const ebene = ebeneVon(t);
    if (ebene) zaehlung.set(ebene, (zaehlung.get(ebene) ?? 0) + 1);
  }
  if (!zaehlung.size) return null;
  const hoechste = Math.max(...zaehlung.values());
  const beste = [...zaehlung].filter(([, n]) => n === hoechste).map(([e]) => e);
  return reihenfolge.find(e => beste.includes(e)) ?? beste[0];
}

/**
 * Sieht der Battlemap-Monitor auf dieser Ebene überhaupt etwas?
 *
 * Mit Token-Sicht nur durch Figuren, die dort stehen, sehen können und die er
 * beobachten darf. Am 27.09.2026 stand der Monitor auf „Manuell, Main Deck",
 * die Gruppe ging die Treppe hoch, unten blieb nur eine Figur ohne Sicht, die
 * er nicht beobachten darf, und der Fernseher war mitten im Spiel schwarz.
 * Eine Vorgabe, die zu einem schwarzen Bild führt, ist nie gemeint.
 */
export function siehtAuf(scene, levelId) {
  if (!scene?.tokenVision) return true;
  const monitor = getBattlemapDisplay();
  if (!monitor) return true;
  return scene.tokens.some(t => ebeneVon(t) === levelId && !t.hidden && t.sight?.enabled
    && t.actor?.testUserPermission(monitor, "OBSERVER"));
}

/* ── Auf dem Monitor ────────────────────────────────────────────── */

function istMonitor() {
  try {
    return isBattlemapDisplay(game.user);
  } catch {
    return false;
  }
}

/**
 * Die Hülle um `Scene#view`.
 *
 * Unsere eigenen Aufrufe tragen DELIBERATE und gehen unverändert durch; sie
 * haben die Entscheidung schon getroffen.
 * @this {Scene}
 */
function onView(wrapped, options = {}) {
  if (!istMonitor() || options?.[DELIBERATE]) return wrapped(options);

  const aktuell = canvas?.scene?.id === this.id ? (canvas.level?.id ?? null) : null;
  const ziel = zielEbene(this, aktuell);
  if (ziel === undefined) return wrapped(options);

  const ebene = ziel ?? aktuell;
  if (!ebene) return wrapped(options);
  if (options?.level && options.level !== ebene) {
    console.debug(`${MODULE_ID} | Battlemap-Monitor bleibt auf Ebene ${ebene} statt ${options.level}.`);
  }
  return wrapped({ ...options, level: ebene });
}

/**
 * Die Hülle um `TokenLayer#_getOccludableTokens`.
 *
 * Wir bilden Foundrys Regel für Beobachter nach, ohne die Bedingung, dass eine
 * Figur anklickbar sein muss: alle sichtbaren Figuren auf der angezeigten
 * Ebene, die nicht geheim sind. Dazu kommen die Spielerfiguren, auch wenn der
 * Monitor sie gerade nicht sieht, etwa weil ihm das Beobachterrecht fehlt; wo
 * eine Spielerfigur steht, weiß der Tisch ohnehin. Versteckte bleiben immer
 * draußen: Ein Loch im Dach an einer Stelle, an der scheinbar niemand steht,
 * verriete sie.
 * @this {TokenLayer}
 */
function onOccludable(wrapped, ...args) {
  const figuren = wrapped(...args);
  if (!istMonitor() || !dachOffen() || !canvas?.level) return figuren;
  const sieht = canvas.effects?.visionSources?.some(s => s.active) ?? false;
  const menge = new Set(figuren);
  for (const token of this.placeables) {
    const doc = token.document;
    if (doc.hidden || ebeneVon(doc) !== canvas.level.id) continue;
    if (istSpielerfigur(doc) || (sieht && token.visible && !doc.isSecret)) menge.add(token);
  }
  return [...menge];
}

let geplant = null;

/**
 * Die Ebene jetzt prüfen und, wenn nötig, wechseln. Nur auf dem Monitor.
 *
 * Verzögert und zusammengefasst: Nach einer Bewegung kommen mehrere Meldungen
 * kurz hintereinander, und jede davon wäre ein Neuzeichnen.
 */
export function ebeneAnwenden(verzoegerung = 0) {
  if (!istMonitor()) return;
  clearTimeout(geplant);
  geplant = setTimeout(jetztAnwenden, verzoegerung);
}

function jetztAnwenden() {
  const scene = canvas?.scene;
  if (!canvas?.ready || !scene) return;
  // Während Foundry lädt, verwirft es jeden Wechsel mit einer Warnung.
  if (canvas.loading) {
    Hooks.once("canvasReady", () => ebeneAnwenden(0));
    return;
  }
  const aktuell = canvas.level?.id ?? null;
  const ziel = zielEbene(scene, aktuell);
  if (!ziel || ziel === aktuell) return;
  scene.view({ level: ziel, [DELIBERATE]: true });
}

/** Die Spielleitung hat eine Spielerfigur angeklickt (über den Socket). */
export function ebenenFokus({ sceneId, tokenId } = {}) {
  if (!istMonitor() || !sceneId || !tokenId) return;
  angeklickt.set(sceneId, tokenId);
  if (sceneId === canvas?.scene?.id) ebeneAnwenden(150);
}

/* ── Die Spielleitung ───────────────────────────────────────────── */

/** Eine Ebene vorgeben: Art manuell, für diese Szene. */
export async function ebeneVorgeben(sceneId, levelId) {
  if (!game.user.isGM) return;
  await game.settings.set(MODULE_ID, SETTINGS.MONITOR_LEVEL_FIXED, { sceneId, levelId });
  if (modus() !== "manuell") await game.settings.set(MODULE_ID, SETTINGS.MONITOR_LEVEL_MODE, "manuell");
}

export async function modusSetzen(art) {
  if (!game.user.isGM || !MODI.includes(art)) return;
  await game.settings.set(MODULE_ID, SETTINGS.MONITOR_LEVEL_MODE, art);
}

/** Nur eine Spielleitung soll schreiben, wenn mehrere angemeldet sind. */
function binZustaendig() {
  return game.user.isGM && (game.users.activeGM?.id ?? game.user.id) === game.user.id;
}

/* ── Einrichten ─────────────────────────────────────────────────── */

let _loesen = [];

/**
 * Die beiden Hüllen. Bei `init`, auf jedem Rechner; ob sie etwas tun,
 * entscheidet jeder Aufruf selbst, denn wer der Monitor ist, steht erst später
 * fest und kann sich während des Abends ändern.
 */
export function ebenenHuellenEinrichten() {
  const ziele = [
    ["foundry.documents.Scene.prototype.view", () => foundry.documents?.Scene?.prototype, "view", onView],
    ["foundry.canvas.layers.TokenLayer.prototype._getOccludableTokens",
      () => foundry.canvas?.layers?.TokenLayer?.prototype, "_getOccludableTokens", onOccludable]
  ];
  const lw = globalThis.libWrapper;
  for (const [pfad, proto, name, huelle] of ziele) {
    try {
      if (lw?.register) {
        lw.register(MODULE_ID, pfad, huelle, "WRAPPER");
        continue;
      }
      const p = proto();
      if (typeof p?.[name] !== "function") {
        console.error(`${MODULE_ID} | ${pfad} nicht gefunden, Ebenen des Monitors bleiben bei Foundry.`);
        continue;
      }
      const original = p[name];
      p[name] = function (...args) {
        return huelle.call(this, original.bind(this), ...args);
      };
      _loesen.push(() => { p[name] = original; });
    } catch (fehler) {
      console.error(`${MODULE_ID} | ${pfad} ließ sich nicht umhüllen`, fehler);
    }
  }
}

/**
 * Die Beobachter. Bei `ready`.
 *
 * Auf dem Monitor: alles, was die Wahl ändern kann. Beim Rechner der
 * Spielleitung: das Anklicken, das Zurücksetzen der Vorgabe bei einer neuen
 * Karte und der Eintrag im Rechtsklickmenü der Ebenen.
 */
export function ebenenEinrichten() {
  /* Monitor */

  Hooks.on("moveToken", (doc, movement) => {
    if (!istMonitor() || doc.parent?.id !== canvas?.scene?.id) return;
    if (istSpielerfigur(doc)) zuletzt.set(doc.parent.id, doc.id);
    // Erst nach dem Ende der Bewegung: Ein Neuzeichnen mittendrin schneidet
    // die Bewegung ab, und Foundry setzt die Ebene selbst erst am Ende um.
    Promise.resolve(movement?.animation?.ended).catch(() => {}).finally(() => ebeneAnwenden(300));
  });
  Hooks.on("updateToken", (doc, changes) => {
    if (!istMonitor() || doc.parent?.id !== canvas?.scene?.id) return;
    if ("hidden" in changes) ebeneAnwenden(300);
  });
  for (const hook of ["createToken", "deleteToken"]) {
    Hooks.on(hook, doc => {
      if (istMonitor() && doc.parent?.id === canvas?.scene?.id) ebeneAnwenden(500);
    });
  }
  Hooks.on("updateCombat", (kampf, changes) => {
    if (istMonitor() && ("turn" in changes || "round" in changes)) ebeneAnwenden(300);
  });
  Hooks.on("deleteCombat", () => { if (istMonitor()) ebeneAnwenden(300); });
  Hooks.on("canvasReady", () => {
    if (!istMonitor()) return;
    ebeneAnwenden(0);
    // Die Liste der Figuren, die Dächer öffnen, sofort neu, nicht erst bei
    // der nächsten Bewegung.
    canvas.perception?.update({ refreshOcclusion: true });
  });

  // Wer eine Spielerfigur ist, ändert sich mit Besitz und Konten.
  Hooks.on("updateActor", (actor, changes) => { if ("ownership" in changes) spielerVergessen(); });
  for (const hook of ["createUser", "updateUser", "deleteUser"]) Hooks.on(hook, spielerVergessen);

  /* Spielleitung */

  /*
   * Autonom ist der Normalfall, Manuell nur ein Moment. Am 27.09.2026 stand
   * der Monitor auf Manuell, weil im Fenster eine Ebene angetippt worden war;
   * die Spielleitung hielt ihn für automatisch, klickte Amara an, und nichts
   * geschah. Deshalb führen drei Wege zurück: das Anklicken einer Spielerfigur
   * (wer eine Figur anwählt, will ihr folgen), eine andere Karte und der Start
   * der Welt. Foundry-Standard bleibt dagegen stehen; das ist eine bewusste
   * Entscheidung für den ganzen Abend, keine Momentaufnahme.
   */
  if (binZustaendig() && modus() === "manuell") modusSetzen("autonom");

  Hooks.on("controlToken", async (token, gewaehlt) => {
    if (!gewaehlt || !game.user.isGM || modus() === "foundry") return;
    const doc = token?.document;
    if (!doc?.parent || !istSpielerfigur(doc)) return;
    if (modus() === "manuell") await modusSetzen("autonom");
    const monitor = getBattlemapDisplay();
    if (!monitor?.active) return;
    game.socket.emit(SOCKET.NAME, { type: SOCKET.LEVEL_FOCUS, sceneId: doc.parent.id, tokenId: doc.id });
  });

  // Eine Vorgabe gilt für ihre Karte. Wird eine andere aktiv, zurück auf autonom.
  Hooks.on("updateScene", (scene, changes) => {
    if (changes.active !== true || !binZustaendig() || modus() !== "manuell") return;
    if (vorgabe().sceneId !== scene.id) modusSetzen("autonom");
  });

  // Rechtsklick auf eine Ebene in Foundrys Navigationsleiste.
  Hooks.on("getSceneContextOptions", (_app, eintraege) => {
    if (!Array.isArray(eintraege)) return;
    eintraege.push({
      label: "INPERSON.Ebenen.ContextShow",
      icon: "fa-solid fa-tv",   // Klassen, kein HTML: so wie Foundrys eigene Einträge daneben
      visible: li => {
        if (!game.user.isGM || !li?.dataset?.levelId || !getBattlemapDisplay()) return false;
        return li.dataset.sceneId === game.scenes.active?.id;
      },
      onClick: (_event, li) => ebeneVorgeben(li.dataset.sceneId, li.dataset.levelId)
    });
  });
}

/** Eine Einstellung dieses Bereichs hat sich geändert. */
export function ebenenEinstellungGeaendert() {
  if (!istMonitor()) return;
  ebeneAnwenden(0);
  canvas?.perception?.update({ refreshOcclusion: true });
}
