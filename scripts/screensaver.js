/**
 * Burn-in protection for the scene display.
 *
 * An OLED at the table shows the same picture for hours, and what burns in is
 * not the map - the map changes when scenes change. It is whatever stands in the
 * exact same pixels all evening at full brightness.
 *
 * Two ways of going about it, and they are alternatives rather than stages:
 *
 *   scene   the display moves through a folder of other scenes
 *   cover   a black sheet lays itself over the scene that is showing, with one
 *           mark drifting across, and the scene stays where it is underneath
 *
 * The cover is the stronger of the two by a wide margin, which is why it is the
 * default: on an OLED a black pixel is genuinely *off* and does not age at all,
 * while another bright scene keeps wearing the panel just as the first one did.
 * Movement saves you from a burnt-in pattern, never from the wear itself. The
 * scene mode is there for tables that would rather look at something.
 *
 * **The cover comes and goes.** It is not a way of switching the television off:
 * the aim is only that no picture stands still for hours, so after its time is
 * up the cover lifts, the scene is there to be looked at, and once the room has
 * been quiet for the waiting time again it returns.
 *
 * What counts as quiet: nothing heard from anybody who is not a display account.
 * `userActivity` carries that for free - Foundry broadcasts it for cursors,
 * scene changes, rulers and targets alike.
 */

import { MODULE_ID, SETTINGS, SOCKET } from "./const.js";
import { isSceneDisplay, isMonitorUser } from "./state.js";
import { applyPinnedScene } from "./monitor.js";

/** How often the state is reconsidered. A clock in minutes needs no finer tick. */
const TICK_MS = 10_000;

/** How often the drifting mark moves while the cover is up. */
const DRIFT_MS = 25_000;

let _timer = null;
let _lastActivity = Date.now();
let _announced = null;

/** Scene mode: when the last swap happened, and how far through the folder. */
let _rotatedAt = 0;
let _index = 0;

/** Cover mode: when the cover went up (0 = down), and when it last came down. */
let _coveredSince = 0;
let _uncoveredSince = 0;
let _driftedAt = 0;

/* -------------------------------------------- */
/*  Configuration                                */
/* -------------------------------------------- */

const setting = key => game.settings.get(MODULE_ID, key);
const minutes = key => Number(setting(key)) || 0;

/** Scenes the screensaver may show, in folder order. @returns {Scene[]} */
function screensaverScenes() {
  const folderId = setting(SETTINGS.IDLE_FOLDER);
  if (!folderId) return [];
  return game.scenes
    .filter(s => s.folder?.id === folderId)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
}

/* -------------------------------------------- */
/*  Activity                                     */
/* -------------------------------------------- */

function noteActivity() {
  _lastActivity = Date.now();
}

/**
 * Activity from anyone who is not a display.
 *
 * Reading the sender rather than trusting the message matters: the displays
 * broadcast too - every scene the screensaver switches to sends one - and
 * counting our own chatter would mean it keeps waking itself up.
 * @param {string} userId
 */
function onUserActivity(userId) {
  const user = game.users?.get(userId);
  if (!user || isMonitorUser(user)) return;
  noteActivity();
}

/* -------------------------------------------- */
/*  The cover                                    */
/* -------------------------------------------- */

/** The overlay, built on first use and kept afterwards. */
function overlay() {
  let el = document.getElementById("inperson-screensaver");
  if (el) return el;
  el = document.createElement("div");
  el.id = "inperson-screensaver";
  document.body.appendChild(el);
  return el;
}

/**
 * Build the drifting mark: the chosen image, or a plain dot when there is none.
 *
 * Rebuilt whenever the cover goes up rather than cached, so a logo picked in the
 * settings takes effect at the next cover instead of after a reload.
 */
function buildMark(el) {
  const logo = setting(SETTINGS.IDLE_LOGO);
  const mark = document.createElement("div");
  mark.className = "inperson-screensaver-mark";
  if (logo) {
    const img = document.createElement("img");
    img.src = logo;
    img.alt = "";
    mark.appendChild(img);
    mark.classList.add("has-logo");
  }
  el.replaceChildren(mark);
  return mark;
}

/**
 * Move the mark somewhere else.
 *
 * By whole steps, not smoothly: a slow glide would light every pixel along the
 * path, which is the opposite of the point. Kept well inside the edges so it
 * never ends up half off-screen at any screen shape.
 */
function driftMark() {
  const mark = overlay().querySelector(".inperson-screensaver-mark");
  if (!mark) return;
  mark.style.left = `${10 + Math.random() * 80}%`;
  mark.style.top = `${10 + Math.random() * 80}%`;
}

function isCovered() {
  return _coveredSince > 0;
}

function setCovered(on) {
  if (isCovered() === on) return;
  const el = overlay();
  const now = Date.now();

  if (on) {
    buildMark(el);
    driftMark();
    _driftedAt = now;
    _coveredSince = now;
  } else {
    _coveredSince = 0;
    _uncoveredSince = now;
  }

  el.classList.toggle("inperson-screensaver-on", on);
  console.debug(`${MODULE_ID} | Cover ${on ? "up" : "down"}.`);
}

/* -------------------------------------------- */
/*  Telling the GM                               */
/* -------------------------------------------- */

/**
 * Announce that the display is entertaining itself rather than showing its scene.
 *
 * The GM keeps the stored scene in step with wherever the display actually is.
 * Left alone it would faithfully record a screensaver scene as the display's
 * home, and the pin target would be gone after the first break.
 * @param {boolean} active
 */
function announce(active) {
  if (_announced === active) return;
  _announced = active;
  game.socket.emit(SOCKET.NAME, { type: SOCKET.SCREENSAVER, userId: game.user.id, active });
}

/* -------------------------------------------- */
/*  The clock                                    */
/* -------------------------------------------- */

/** Back to normal: cover down, scene restored, counters cleared. */
async function wakeUp() {
  if (!_announced && !isCovered()) return;
  setCovered(false);
  announce(false);
  _index = 0;
  _rotatedAt = 0;
  _uncoveredSince = 0;
  await applyPinnedScene();
}

/** Scene mode: step to the next scene of the folder when its time is up. */
async function rotateScenes(now) {
  const scenes = screensaverScenes();
  if (!scenes.length) return;

  const every = Math.max(1, minutes(SETTINGS.IDLE_ROTATE_EVERY)) * 60_000;
  if (_rotatedAt && now - _rotatedAt < every) return;

  const next = scenes[_index % scenes.length];
  _index += 1;
  _rotatedAt = now;
  if (canvas?.scene?.id !== next.id) {
    console.debug(`${MODULE_ID} | Screensaver shows "${next.name}".`);
    await next.view();
  }
}

/**
 * The cover, coming and going: up for its time, down for the waiting time, up
 * again for as long as the room stays quiet.
 * @param {number} now
 * @param {number} quietSince Timestamp at which quiet was first established
 */
function updateCover(now, quietSince) {
  if (isCovered()) {
    const forMs = Math.max(1, minutes(SETTINGS.IDLE_BLANK_FOR)) * 60_000;
    if (now - _coveredSince >= forMs) return setCovered(false);
    if (now - _driftedAt >= DRIFT_MS) {
      driftMark();
      _driftedAt = now;
    }
    return;
  }

  // Down. The wait runs from the last uncovering, or from the moment quiet
  // began if the cover has not been up yet this time round.
  const wait = Math.max(1, minutes(SETTINGS.IDLE_AFTER)) * 60_000;
  const since = _uncoveredSince || quietSince;
  if (now - since >= wait) setCovered(true);
}

async function tick() {
  if (!isSceneDisplay(game.user)) return;
  if (!game.settings.get(MODULE_ID, SETTINGS.IDLE_ENABLED)) return await wakeUp();

  const idleAfter = Math.max(1, minutes(SETTINGS.IDLE_AFTER));
  const now = Date.now();
  const quietSince = _lastActivity + idleAfter * 60_000;
  if (now < quietSince) return await wakeUp();

  announce(true);

  // One or the other, never both. Running the scene swap underneath a cover
  // would load maps nobody is looking at and, worse, quietly move the display
  // somewhere it was not sent.
  if (game.settings.get(MODULE_ID, SETTINGS.IDLE_MODE) === "scene") {
    setCovered(false);
    await rotateScenes(now);
    return;
  }
  updateCover(now, quietSince);
}

/**
 * Show the cover for a moment so it can be looked at.
 *
 * On this client, not the display: what one checks here is whether the chosen
 * image reads well against black and sits at a sensible size, and since the mark
 * is sized against the viewport rather than in pixels, it looks the same on a
 * 24-inch monitor as on the television.
 * @param {number} [seconds]
 */
export function previewCover(seconds = 8) {
  const el = overlay();
  buildMark(el);
  driftMark();
  el.classList.add("inperson-screensaver-on", "inperson-screensaver-preview");

  const drift = setInterval(driftMark, 2000);
  const stop = () => {
    clearInterval(drift);
    clearTimeout(timer);
    el.classList.remove("inperson-screensaver-on", "inperson-screensaver-preview");
    document.removeEventListener("pointerdown", stop, true);
    document.removeEventListener("keydown", stop, true);
  };
  const timer = setTimeout(stop, seconds * 1000);
  document.addEventListener("pointerdown", stop, true);
  document.addEventListener("keydown", stop, true);
}

/* -------------------------------------------- */
/*  Wiring                                       */
/* -------------------------------------------- */

/** Start the clock. Only the scene display ever runs one. */
export function installScreensaver() {
  if (!isSceneDisplay(game.user)) return;

  game.socket.on("userActivity", onUserActivity);
  for (const hook of ["updateScene", "createChatMessage", "updateToken", "updateCombat"]) {
    Hooks.on(hook, () => noteActivity());
  }

  _lastActivity = Date.now();
  _timer = setInterval(() => tick().catch(error => {
    console.error(`${MODULE_ID} | Screensaver tick failed.`, error);
  }), TICK_MS);

  console.log(`${MODULE_ID} | Screensaver watching this display.`);
}

/** Stop and clean up. Dev teardown only. */
export function removeScreensaver() {
  if (_timer) clearInterval(_timer);
  _timer = null;
  setCovered(false);
  document.getElementById("inperson-screensaver")?.remove();
}
