/**
 * Die Begleitleiste: Begleitszenen umschalten, ohne ein Fenster zu öffnen.
 *
 * Eine kleine Leiste am Rand des Bildschirms der Spielleitung, in der Art der
 * angehefteten Paletten anderer Module. Im Ruhezustand ein einzelnes, halb
 * durchsichtiges Symbol. Fährt die Maus darüber, wird sie hell und klappt die
 * Begleitszenen der aktiven Karte als kleine Bilder auf; ein Klick schickt die
 * Szene auf den Szenen-Monitor.
 *
 * Sie ersetzt das selbsttätige Aufgehen des Fensters (begleitwahl.js). Am
 * 29.09.2026 ging das Fenster zum ersten Mal von selbst auf, und es war der
 * Spielleitung zu groß: Mitten im Spiel will man umschalten, nicht ein Fenster
 * wegräumen. Das Fenster bleibt für den Überblick, über den Knopf links in der
 * Werkzeugleiste.
 *
 * **Nur da, wenn es etwas zu wählen gibt**: auf einer aktiven Karte mit
 * mindestens zwei Begleitszenen und mit eingerichtetem Szenen-Monitor. Sonst
 * verschwindet sie ganz, statt leer herumzustehen.
 *
 * **Verschiebbar am Griff**, der Platz wird je Gerät gemerkt. Beim Laden und
 * bei jeder Größenänderung des Fensters wird er ins Bild geklemmt; eine Leiste,
 * die nach einem Wechsel auf einen kleineren Bildschirm außerhalb liegt, findet
 * niemand wieder.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import {
  getCompanionScenes, getSceneDisplay, getPinnedScene, showOnMonitor
} from "./monitor.js";
import { thumbOf, withFallback } from "./scene-field.js";

const LEISTE_ID = "inperson-begleitleiste";
const PLATZ_KEY = `${MODULE_ID}.begleitleiste.platz`;

/** Wie lange nach einem Klick die gewählte Szene als aktuell gilt, bis der Monitor sich meldet. */
const NACHLAUF_MS = 1500;

let gewaehlt = null;
let geplant = null;

/** Die Szenen, zwischen denen umgeschaltet werden kann, oder leer. */
function szenen() {
  const karte = game.scenes?.active;
  if (!karte || !getSceneDisplay()) return [];
  const liste = getCompanionScenes(karte);
  return liste.length >= 2 ? liste : [];
}

/** Welche Szene der Monitor gerade zeigt. */
function aktuelleId() {
  const display = getSceneDisplay();
  return gewaehlt ?? (display?.active ? display.viewedScene : null) ?? getPinnedScene()?.id ?? null;
}

/* ── Zeichnen ───────────────────────────────────────────────────── */

function leisteBauen() {
  const leiste = document.createElement("div");
  leiste.id = LEISTE_ID;
  leiste.className = "inperson-begleitleiste";
  leiste.setAttribute("role", "toolbar");
  const titel = game.i18n.localize("INPERSON.Begleitleiste.Label");
  leiste.setAttribute("aria-label", titel);

  const griff = document.createElement("div");
  griff.className = "inperson-begleitleiste-griff";
  griff.dataset.tooltip = game.i18n.localize("INPERSON.Begleitleiste.Move");
  griff.innerHTML = `<i class="fa-solid fa-images" aria-hidden="true"></i>`;
  leiste.appendChild(griff);

  const reihe = document.createElement("div");
  reihe.className = "inperson-begleitleiste-reihe";
  leiste.appendChild(reihe);

  document.body.appendChild(leiste);
  ziehbar(leiste, griff);
  platzAnwenden(leiste);
  return leiste;
}

/** Leiste zeigen, auffrischen oder wegnehmen. Zusammengefasst, Änderungen kommen in Schüben. */
export function begleitleisteAuffrischen() {
  clearTimeout(geplant);
  geplant = setTimeout(zeichnen, 100);
}

function zeichnen() {
  if (!game.user?.isGM) return;
  const liste = szenen();
  let leiste = document.getElementById(LEISTE_ID);
  if (!liste.length) {
    leiste?.remove();
    return;
  }
  leiste ??= leisteBauen();

  const jetzt = aktuelleId();
  const reihe = leiste.querySelector(".inperson-begleitleiste-reihe");
  reihe.replaceChildren(...liste.map(szene => {
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "inperson-begleitleiste-szene";
    knopf.classList.toggle("is-current", szene.id === jetzt);
    knopf.setAttribute("aria-pressed", String(szene.id === jetzt));
    knopf.setAttribute("aria-label", szene.name);
    knopf.dataset.tooltip = szene.name;
    const bild = withFallback(document.createElement("img"));
    bild.src = thumbOf(szene);
    bild.alt = "";
    knopf.appendChild(bild);
    knopf.addEventListener("click", async () => {
      await showOnMonitor(szene);
      gewaehlt = szene.id;
      zeichnen();
      setTimeout(() => { gewaehlt = null; begleitleisteAuffrischen(); }, NACHLAUF_MS);
    });
    return knopf;
  }));
}

/* ── Platz ──────────────────────────────────────────────────────── */

function platzLesen() {
  try {
    return JSON.parse(localStorage.getItem(PLATZ_KEY) ?? "null");
  } catch {
    return null;
  }
}

/** Den gemerkten Platz setzen, ins Bild geklemmt. Ohne gemerkten Platz bleibt die Vorgabe aus dem CSS. */
function platzAnwenden(leiste) {
  const platz = platzLesen();
  if (!platz) return;
  setzen(leiste, platz.x, platz.y);
}

function setzen(leiste, x, y) {
  const r = leiste.getBoundingClientRect();
  const breite = window.visualViewport?.width ?? window.innerWidth;
  const hoehe = window.visualViewport?.height ?? window.innerHeight;
  const rand = 4;
  leiste.style.left = `${Math.round(Math.min(Math.max(rand, x), breite - Math.max(r.width, 40) - rand))}px`;
  leiste.style.top = `${Math.round(Math.min(Math.max(rand, y), hoehe - Math.max(r.height, 40) - rand))}px`;
}

function ziehbar(leiste, griff) {
  let versatz = null;
  griff.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    const r = leiste.getBoundingClientRect();
    versatz = { x: event.clientX - r.left, y: event.clientY - r.top };
    griff.setPointerCapture(event.pointerId);
    leiste.classList.add("wird-gezogen");
    event.preventDefault();
  });
  griff.addEventListener("pointermove", event => {
    if (!versatz) return;
    setzen(leiste, event.clientX - versatz.x, event.clientY - versatz.y);
  });
  const ende = () => {
    if (!versatz) return;
    versatz = null;
    leiste.classList.remove("wird-gezogen");
    const r = leiste.getBoundingClientRect();
    try {
      localStorage.setItem(PLATZ_KEY, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) }));
    } catch { /* ohne Speicher eben ohne Gedächtnis */ }
  };
  griff.addEventListener("pointerup", ende);
  griff.addEventListener("pointercancel", ende);
}

/* ── Einrichten ─────────────────────────────────────────────────── */

/** Bei `ready`, nur bei der Spielleitung. */
export function installBegleitleiste() {
  if (!game.user.isGM) return;
  Hooks.on("updateScene", (szene, changes) => {
    if ("active" in changes || changes.flags?.[MODULE_ID] !== undefined || "thumb" in changes || "name" in changes) {
      begleitleisteAuffrischen();
    }
  });
  for (const hook of ["createScene", "deleteScene", "canvasReady"]) Hooks.on(hook, begleitleisteAuffrischen);
  Hooks.on("updateSetting", setting => {
    const key = setting.key;
    if (key === `${MODULE_ID}.${SETTINGS.MONITOR_SCENE}` || key === `${MODULE_ID}.${SETTINGS.MONITOR_SC}`) {
      begleitleisteAuffrischen();
    }
  });
  // Welche Szene der Monitor zeigt, meldet er ohne Hook über userActivity.
  game.socket.on("userActivity", (userId, daten) => {
    if (userId === getSceneDisplay()?.id && daten && "sceneId" in daten) begleitleisteAuffrischen();
  });
  const klemmen = () => {
    const leiste = document.getElementById(LEISTE_ID);
    if (leiste) platzAnwenden(leiste);
  };
  window.addEventListener("resize", klemmen);
  window.visualViewport?.addEventListener("resize", klemmen);
  begleitleisteAuffrischen();
}
