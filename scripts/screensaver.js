/**
 * Burn-in protection for the scene display.
 *
 * An OLED at the table shows the same picture for hours, and what burns in is
 * not the map - the map changes when scenes change. It is whatever stands in the
 * exact same pixels all evening at full brightness.
 *
 * Two ways of going about it, and they are alternatives rather than stages:
 *
 *   scene   the display moves through a folder of other scenes, or comes and
 *           goes between one chosen scene and its own
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
 * **The clock runs on the picture, not on the room.** What burns into an OLED
 * is whatever stands in the same pixels, the edges of a map, a frame, a title,
 * and the panel does not care whether somebody at the table moved the mouse
 * meanwhile. So the waiting time runs from the moment the display got its
 * current picture, and it is reset only when the display really gets a new
 * one: the gamemaster sends another scene, a map is activated and its
 * companion comes up. The screensaver's own switches do not count, or it would
 * keep resetting itself.
 *
 * Until 2026-09-30 it waited for quiet in the room instead: no activity from
 * anyone but the displays. Foundry reports every mouse move over the canvas as
 * activity, so at a desk where the gamemaster was working the screensaver
 * never came on, and even without that it only ever protected the panel in
 * breaks. Ninjo: "an OLED screensaver has to change the picture after the set
 * time, so that edges and the like do not burn in".
 */

import { MODULE_ID, SETTINGS, SOCKET } from "./const.js";
import { isSceneDisplay } from "./state.js";
import { applyPinnedScene } from "./monitor.js";

/** How often the state is reconsidered. A clock in minutes needs no finer tick. */
const TICK_MS = 10_000;

/**
 * One breath of the mark: it fades in somewhere, stays a moment, fades out, and
 * after a short dark pause comes up somewhere else.
 *
 * It used to glide across the screen, which looked jerky on the television: a
 * glide moves `left` and `top`, and the browser lays the page out again on every
 * frame. A breath only changes opacity, which the graphics card handles on its
 * own, and for the panel it is kinder still - no pixel carries the mark for
 * more than a few seconds, and in between everything is off. Asked for at the
 * table on 2026-09-30: "slowly breathe in, stay briefly, darken, and appear the
 * same way somewhere else".
 */
const BREATH = { fadeIn: 4000, hold: 6000, fadeOut: 4000, dark: 2000 };

let _timer = null;
/** When the display got the picture it shows now, not counting our own switches. */
let _pictureSince = Date.now();
let _announced = null;

/**
 * Set just before the screensaver moves the display itself, so the canvasReady
 * that follows is not mistaken for a new picture from the gamemaster. Cleared
 * by that canvasReady, or after a while if the move turned out not to change
 * the scene at all.
 */
let _ownMoveUntil = 0;
const OWN_MOVE_MS = 15_000;

/** Scene mode: when the last swap happened, and how far through the folder. */
let _rotatedAt = 0;
let _index = 0;

/**
 * Single-scene mode: when the screensaver scene came up (0 = not showing), and
 * when the display last went back to its own scene.
 */
let _showingSince = 0;
let _returnedAt = 0;

/** Cover mode: when the cover went up (0 = down), and when it last came down. */
let _coveredSince = 0;
let _uncoveredSince = 0;
let _breathTimer = null;

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

/** The single screensaver scene, when one is chosen and still exists. */
function screensaverScene() {
  const id = setting(SETTINGS.IDLE_SCENE);
  return id ? (game.scenes?.get(id) ?? null) : null;
}

/* -------------------------------------------- */
/*  The picture                                  */
/* -------------------------------------------- */

/**
 * Screensaver scenes are pictures, not maps: seen without token vision.
 *
 * The display is a player account with no token of its own on a screensaver
 * scene. Where the scene has token vision on - true of most scenes from map
 * packs - Foundry shows that account nothing but black. On 2026-09-30 the
 * chosen scene came up and the television went dark.
 *
 * Switched off in this client's copy of the scene only (`updateSource`, never
 * saved), and put back as soon as the screensaver lets go of it: the same
 * scene may be played on later, and then its vision has to hold again.
 */
const _visionRestore = new Map();

function asPicture(scene) {
  if (!scene?.tokenVision || _visionRestore.has(scene.id)) return;
  _visionRestore.set(scene.id, true);
  scene.updateSource({ tokenVision: false });
}

function restoreVision() {
  for (const id of _visionRestore.keys()) {
    game.scenes?.get(id)?.updateSource({ tokenVision: true });
  }
  _visionRestore.clear();
}

/** Mark the next scene change as the screensaver's own. */
function ownMove() {
  _ownMoveUntil = Date.now() + OWN_MOVE_MS;
}

/**
 * The display drew a scene. From the gamemaster, it is a new picture and the
 * clock starts over, with whatever the screensaver was doing dropped where it
 * stands: sending the display back to "its" scene now would undo what the
 * gamemaster just sent. From the screensaver itself, nothing changes.
 */
function onCanvasReady() {
  if (Date.now() < _ownMoveUntil) {
    _ownMoveUntil = 0;
    return;
  }
  _pictureSince = Date.now();
  restoreVision();
  setCovered(false);
  announce(false);
  _index = 0;
  _rotatedAt = 0;
  _uncoveredSince = 0;
  _showingSince = 0;
  _returnedAt = 0;
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
  // Monk's Common Display hides every direct child of <body> that is not on
  // its list (`body.hide-ui > *:not(#logo):not(#interface)...`, with
  // !important) on exactly the accounts that are displays. The cover was
  // switched on correctly and never seen - found on 2026-09-30. No stylesheet
  // rule can win against that selector, whose thirty-odd :not(#id) each count
  // as an id; a declaration on the element itself can. Showing and hiding
  // still happens through opacity and visibility in the stylesheet.
  el.style.setProperty("display", "block", "important");
  document.body.appendChild(el);
  return el;
}

/**
 * Build the drifting mark: the chosen image, or a plain dot when there is none.
 *
 * Rebuilt whenever the cover goes up rather than cached, so a logo picked in the
 * settings takes effect at the next cover instead of after a reload.
 */
function buildMark(el, logoOverride) {
  const logo = logoOverride ?? setting(SETTINGS.IDLE_LOGO);
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
 * Let the mark breathe until stopped: new place while it is invisible, then in,
 * hold, out, dark, and again.
 *
 * The place is changed with the transition switched off and only while the mark
 * is fully faded out, so it never visibly jumps. The two animation frames before
 * fading in let the browser take the new place first; without them it would
 * fade in where it faded out.
 * @param {HTMLElement} mark
 * @param {typeof BREATH} [breath] Shorter for the preview, where nobody wants to wait
 */
function breathe(mark, breath = BREATH) {
  stopBreathing();
  const cycle = () => {
    if (!mark.isConnected) return;
    mark.style.transitionDuration = "0ms";
    mark.classList.remove("is-shown");
    // Kept well inside the edges, so it never ends up half off-screen at any
    // screen shape.
    mark.style.left = `${10 + Math.random() * 70}%`;
    mark.style.top = `${10 + Math.random() * 70}%`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      mark.style.transitionDuration = `${breath.fadeIn}ms`;
      mark.classList.add("is-shown");
    }));
    _breathTimer = setTimeout(() => {
      mark.style.transitionDuration = `${breath.fadeOut}ms`;
      mark.classList.remove("is-shown");
      _breathTimer = setTimeout(cycle, breath.fadeOut + breath.dark);
    }, breath.fadeIn + breath.hold);
  };
  cycle();
}

function stopBreathing() {
  clearTimeout(_breathTimer);
  _breathTimer = null;
}

function isCovered() {
  return _coveredSince > 0;
}

function setCovered(on) {
  if (isCovered() === on) return;
  const el = overlay();
  const now = Date.now();

  if (on) {
    breathe(buildMark(el));
    _coveredSince = now;
  } else {
    stopBreathing();
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
function announce(active, force = false) {
  if (_announced === active && !force) return;
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
  _showingSince = 0;
  _returnedAt = 0;
  ownMove();
  await applyPinnedScene();
  restoreVision();
}

/**
 * Single-scene mode, coming and going like the cover.
 *
 * A folder with one scene in it stays on that scene for as long as it is quiet,
 * which is right for a picture with movement in it. Asked for on 2026-09-30 was
 * the other thing: one chosen scene that takes turns with the real one, the way
 * the black cover does. Shown for the rotation minutes, then back to the scene
 * the display belongs on, and after the waiting time again.
 *
 * The first switch happens as soon as quiet is established, the same as the
 * folder mode's first scene; after that the waiting time runs from the return.
 * @param {number} now
 * @param {Scene} scene
 */
async function alternateScene(now, scene) {
  if (_showingSince) {
    const forMs = Math.max(1, minutes(SETTINGS.IDLE_ROTATE_EVERY)) * 60_000;
    if (now - _showingSince < forMs) return;
    _showingSince = 0;
    _returnedAt = now;
    console.debug(`${MODULE_ID} | Screensaver hands back to the display's own scene.`);
    ownMove();
    await applyPinnedScene();
    restoreVision();
    return;
  }

  const wait = Math.max(1, minutes(SETTINGS.IDLE_AFTER)) * 60_000;
  if (_returnedAt && now - _returnedAt < wait) return;
  _showingSince = now;
  if (canvas?.scene?.id !== scene.id) {
    console.debug(`${MODULE_ID} | Screensaver shows "${scene.name}".`);
    asPicture(scene);
    ownMove();
    await scene.view();
  }
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
    asPicture(next);
    ownMove();
    await next.view();
  }
}

/**
 * The cover, coming and going: up for its time, down for the waiting time, up
 * again for as long as the room stays quiet.
 * @param {number} now
 * @param {number} quietSince When the waiting time for the current picture ran out
 */
function updateCover(now, quietSince) {
  if (isCovered()) {
    const forMs = Math.max(1, minutes(SETTINGS.IDLE_BLANK_FOR)) * 60_000;
    if (now - _coveredSince >= forMs) return setCovered(false);
    return;
  }

  // Down. The first time round the waiting time is already over - that is why
  // we are here at all. Measuring it once more from `quietSince` put the first
  // cover at twice the set time. After that, the wait runs from the last
  // uncovering.
  if (!_uncoveredSince) return setCovered(true);
  const wait = Math.max(1, minutes(SETTINGS.IDLE_AFTER)) * 60_000;
  if (now - _uncoveredSince >= wait) setCovered(true);
}

async function tick() {
  if (!isSceneDisplay(game.user)) return;
  if (!game.settings.get(MODULE_ID, SETTINGS.IDLE_ENABLED)) return await wakeUp();

  const idleAfter = Math.max(1, minutes(SETTINGS.IDLE_AFTER));
  const now = Date.now();
  const quietSince = _pictureSince + idleAfter * 60_000;
  if (now < quietSince) return;

  announce(true);

  // One or the other, never both. Running the scene swap underneath a cover
  // would load maps nobody is looking at and, worse, quietly move the display
  // somewhere it was not sent.
  if (game.settings.get(MODULE_ID, SETTINGS.IDLE_MODE) === "scene") {
    setCovered(false);
    const single = screensaverScene();
    if (single) await alternateScene(now, single);
    else await rotateScenes(now);
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
 * The image is passed in rather than read from the settings, because at this
 * moment it usually is not in the settings yet: someone has just picked a file
 * and wants to see it before saving. Reading the stored value would show them
 * the old mark and leave them thinking their choice did not take.
 * @param {number} [seconds]
 * @param {string} [logo] Path to show instead of the saved one
 */
export function previewCover(seconds = 8, logo) {
  const el = overlay();
  const mark = buildMark(el, logo);
  el.classList.add("inperson-screensaver-on", "inperson-screensaver-preview");

  // Quicker breaths than in real use: eight seconds would not even hold one
  // full breath, and the point here is to see the whole movement.
  breathe(mark, { fadeIn: 1500, hold: 1500, fadeOut: 1500, dark: 500 });
  const stop = () => {
    if (!isCovered()) stopBreathing();
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
/*  By hand                                      */
/* -------------------------------------------- */

/**
 * The gamemaster starts or ends the screensaver from the companion bar.
 *
 * Starting pretends the picture has stood long enough and runs the clock at
 * once, so the same path decides what comes: cover, single scene or folder.
 * Ending counts as a new picture: the clock starts over, the cover drops, and
 * a screensaver scene hands back to the display's own. A starting request is
 * ignored while the screensaver is switched off in the settings; the clock
 * would end it again on its next tick.
 * @param {{action: string, userId: string}} payload
 */
export async function screensaverControl({ action, userId } = {}) {
  if (!isSceneDisplay(game.user)) return;
  if (!game.users?.get(userId)?.isGM) return;

  if (action === "query") return announce(!!_announced, true);

  if (action === "start") {
    if (!setting(SETTINGS.IDLE_ENABLED)) return;
    // Also clear the pause between two rounds, or a start pressed in that
    // pause would sit out the rest of it first.
    _pictureSince = 0;
    _uncoveredSince = 0;
    _returnedAt = 0;
    _rotatedAt = 0;
    return tick();
  }

  if (action === "stop") {
    const onOwnScene = !_showingSince && !_rotatedAt;
    _pictureSince = Date.now();
    setCovered(false);
    announce(false);
    _index = 0;
    _rotatedAt = 0;
    _uncoveredSince = 0;
    _showingSince = 0;
    _returnedAt = 0;
    if (!onOwnScene) {
      ownMove();
      await applyPinnedScene();
    }
    restoreVision();
  }
}

/* -------------------------------------------- */
/*  Wiring                                       */
/* -------------------------------------------- */

/** Start the clock. Only the scene display ever runs one. */
export function installScreensaver() {
  if (!isSceneDisplay(game.user)) return;

  Hooks.on("canvasReady", onCanvasReady);
  _pictureSince = Date.now();
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
