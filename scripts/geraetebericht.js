/**
 * Fehlerbericht der Spielergeräte.
 *
 * Ein Tablet am Tisch hat keine Konsole, die jemand lesen könnte. Geht dort
 * etwas schief, sieht der Spieler eine leere Fläche, und die Spielleitung
 * erfährt nur „geht nicht". So am 04.10.2026 mit der Bogenansicht auf
 * Nadylos' iPad mit iPadOS 17: Foundry 14 verlangt eigentlich Safari 18.4 und
 * läuft dort nur mit einer Nachrüstung, und welcher Schritt scheiterte, war
 * von außen nicht zu sehen.
 *
 * Jedes Spielergerät sammelt deshalb die ersten Fehler seiner Sitzung und
 * legt sie zusammen mit Browser und Zustand der Bogenansicht als Markierung
 * am eigenen Benutzerkonto ab (`flags.ninjos-inperson-tools.geraetebericht`).
 * Das darf jeder Spieler bei sich selbst, es braucht keinen Rechner der
 * Spielleitung, der gerade mitläuft und den neuesten Stand hat, und es liegt
 * danach in der Datenbank der Welt. Die erste Fassung schickte den Bericht
 * über den Rechner der Spielleitung; der war nicht neu geladen, und der
 * Bericht ging verloren.
 *
 * **Der erste Import in main.js**, damit er schon mitschreibt, während die
 * übrigen Dateien ausgewertet werden. Diese Datei braucht nur const.js und
 * keine neueren Sprachmittel. Was er nicht abdeckt: Kann ein Browser eine
 * unserer Dateien nicht einmal lesen, lädt keine davon, auch diese nicht.
 *
 * **Von Haus aus aus.** Die Spielleitung schaltet es in den Einstellungen der
 * Bogenansicht unter „Ältere Tablets" ein, wenn sie einen Fehler sucht.
 *
 * Gesammelt wird nur, was ohnehin in der Konsole stünde, dazu Browserkennung
 * und Bildschirmgröße. Keine Eingaben, keine Inhalte.
 */

import { MODULE_ID, SETTINGS } from "./const.js";

const FLAG = "geraetebericht";
const HOECHSTENS = 30;
const TEXT_LAENGE = 600;
/** So lange nach dem Laden werden neue Fehler noch nachgemeldet. */
const NACHMELDEN_MS = 10 * 60_000;

const _fehler = [];
const _geladen = Date.now();
let _geplant = null;
let _bereit = false;

function kuerzen(text) {
  const s = String(text ?? "");
  return s.length > TEXT_LAENGE ? `${s.slice(0, TEXT_LAENGE)} …` : s;
}

function beschreiben(wert) {
  if (wert instanceof Error) return `${wert.name}: ${wert.message}\n${wert.stack ?? ""}`;
  if (typeof wert === "string") return wert;
  try {
    return JSON.stringify(wert);
  } catch {
    return String(wert);
  }
}

function merken(art, text) {
  if (_fehler.length >= HOECHSTENS) return;
  _fehler.push({ art, nach: Math.round((Date.now() - _geladen) / 1000), text: kuerzen(text) });
  planen();
}

/* ── Sammeln, so früh wie möglich ───────────────────────────────── */

window.addEventListener("error", event => {
  const ort = event.filename ? ` (${event.filename}:${event.lineno}:${event.colno})` : "";
  merken("error", `${event.message ?? beschreiben(event.error)}${ort}${event.error?.stack ? `\n${event.error.stack}` : ""}`);
});

window.addEventListener("unhandledrejection", event => {
  merken("promise", beschreiben(event.reason));
});

// Foundry und die Module fangen viele Fehler selbst und schreiben sie nur in
// die Konsole, unsere eigenen Startschritte ebenso. Mitlesen, nicht ersetzen.
const _consoleError = console.error.bind(console);
console.error = (...args) => {
  try {
    merken("console", args.map(beschreiben).join(" "));
  } catch { /* der Bericht darf nie selbst stören */ }
  return _consoleError(...args);
};

/* ── Senden ──────────────────────────────────────────────────────── */

function zustand() {
  const body = document.body?.classList;
  let bogen = null;
  try {
    bogen = {
      eingeschaltet: game.settings.get(MODULE_ID, "sheetView"),
      fuerMich: game.settings.get(MODULE_ID, "sheetViewUsers")?.[game.user.id] === true,
      laeuft: !!body?.contains("inperson-sheetview")
    };
  } catch (fehler) {
    bogen = { lesefehler: String(fehler) };
  }
  return {
    browser: navigator.userAgent,
    bildschirm: `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}`,
    beruehrung: navigator.maxTouchPoints ?? 0,
    foundry: game.version ?? game.release?.version ?? "",
    modulGeladen: !!game.modules.get(MODULE_ID)?.api,
    figur: game.user.character?.name ?? null,
    keinSpielfeld: !!game.settings.get("core", "noCanvas"),
    bogen
  };
}

/** Nur wenn die Spielleitung es eingeschaltet hat; gesammelt wird trotzdem, das kostet nichts. */
function erlaubt() {
  try {
    return !!game.settings.get(MODULE_ID, SETTINGS.DEVICE_REPORT);
  } catch {
    return false;
  }
}

function senden() {
  if (!_bereit || game.user.isGM || !erlaubt()) return;
  game.user.setFlag(MODULE_ID, FLAG, {
    zeit: Date.now(),
    zustand: zustand(),
    fehler: _fehler
  }).catch(fehler => _consoleError(`${MODULE_ID} | Gerätebericht nicht abgelegt`, fehler));
}

function planen() {
  if (!_bereit || Date.now() - _geladen > NACHMELDEN_MS) return;
  clearTimeout(_geplant);
  _geplant = setTimeout(senden, 3000);
}

/* ── Einrichten ─────────────────────────────────────────────────── */

Hooks.once("ready", () => {
  _bereit = true;
  if (game.user.isGM) return;
  // Einmal kurz nach dem Start, wenn die Bogenansicht hochgefahren sein müsste,
  // und einmal später, falls sie erst nachgezogen hat.
  setTimeout(senden, 8000);
  setTimeout(senden, 60_000);
});
