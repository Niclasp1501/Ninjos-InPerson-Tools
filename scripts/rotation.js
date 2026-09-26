/**
 * Scene rotation.
 *
 * For maps drawn portrait that need to lie across a 16:9 screen. The rotation
 * belongs to the *scene*, not to a client: a map drawn the wrong way round is
 * wrong for everyone looking at it, and a per-client angle would mean the same
 * map stands upright on the table and tipped over in the GM window.
 *
 * Lock View had this until 2.0.0 and stored it the same way
 * (`scene.getFlag('LockView', 'rotation')`); the feature was dropped citing
 * stability. The core of it is one line:
 *
 *   canvas.stage.rotation = degrees * Math.PI / 180
 *
 * Everything below the stage - map, grid, tokens, walls, lighting, templates -
 * turns with it, and mouse input needs no correction either: Foundry reads
 * pointer positions through `event.getLocalPosition(this.stage, …)`
 * (board.mjs:2077), which inverts the full world matrix, rotation included.
 *
 * The HUD is the exception, and the reason is visible in
 * `HeadsUpDisplayContainer#align()` (applications/hud/container.mjs:87):
 *
 *   left/top  = canvas.primary.getGlobalPosition()   // screen position
 *   transform = scale(...)                           // zoom only
 *
 * Foundry passes the corner and the zoom to the HUD, but not the axes. The
 * individual HUDs are then laid out inside that frame in *scene* coordinates
 * (`placeable-hud.mjs:113` uses `object.bounds`). Rotate the canvas and those
 * axes no longer match, so a token HUD lands wherever the unrotated axes point -
 * "leaving all hud elements behind, usually off screen", as the Lock View commit
 * that fixed it put it.
 *
 * The fix uses the standalone CSS `rotate` property rather than `transform`,
 * precisely because `align()` overwrites `transform` on every pan and would wipe
 * a rotation written there. `rotate` survives untouched.
 *
 * The labels Foundry draws *on the canvas* are a third case: a token's name,
 * its resource bars, status icons, elevation and level marker are PIXI children
 * of the token, so they turn with the stage like the map does. Reported from
 * the table on 2026-09-27: "Bertram Mehlstaub" ran down the side of his token.
 * See uprightTokenLabels below.
 */

import { MODULE_ID, SETTINGS } from "./const.js";

/** Flag key on a Scene holding the rotation in degrees. */
export const ROTATION_FLAG = "rotation";

/** Offered angles. 360 is the same as 0 and is left out. */
export const ANGLES = [0, 90, 180, 270];

/**
 * Rotation of a scene in degrees.
 * @param {Scene} [scene] Defaults to the viewed scene
 * @returns {number} 0, 90, 180 or 270
 */
export function getRotation(scene = canvas?.scene) {
  const value = Number(scene?.getFlag?.(MODULE_ID, ROTATION_FLAG) ?? 0);
  return ANGLES.includes(value) ? value : 0;
}

/** Store the rotation on a scene. GM only. */
export async function setRotation(scene, degrees) {
  if (!game.user.isGM) throw new Error("Only a GM may rotate a scene.");
  const value = Number(degrees) || 0;
  if (value) await scene.setFlag(MODULE_ID, ROTATION_FLAG, value);
  else await scene.unsetFlag(MODULE_ID, ROTATION_FLAG);
}

/**
 * Apply the viewed scene's rotation to canvas and HUD.
 *
 * Safe to call repeatedly - it only writes when something actually differs, so
 * it can hang off `canvasReady`, `canvasPan` and HUD renders without churn.
 */
export function applyRotation() {
  if (!canvas?.ready || !canvas.stage) return;

  const degrees = getRotation();
  const radians = degrees * Math.PI / 180;

  if (canvas.stage.rotation !== radians) {
    canvas.stage.rotation = radians;
  }

  applyHudRotation(degrees);
}

/**
 * Turn the HUD frame with the canvas.
 *
 * Written to `style.rotate`, not into `transform`: `align()` rewrites
 * `transform` on every pan, and a rotation put there would vanish on the next
 * mouse move. The two are separate CSS properties and compose without fighting.
 * @param {number} degrees
 */
function applyHudRotation(degrees) {
  const hud = canvas.hud?.element;
  if (!hud) return;                       // not rendered yet - a later call catches it

  const wanted = degrees ? `${degrees}deg` : "";
  if (hud.style.rotate !== wanted) hud.style.rotate = wanted;

  // Turning the frame puts the HUDs in the right place but leaves their text
  // lying on its side. This variable drives the counter-rotation that puts the
  // writing back upright while the frame keeps doing the positioning.
  //
  // *Which* elements it applies to is decided in the stylesheet, and the
  // distinction matters: small HUDs pinned to a placeable turn about their
  // centre, while ruler labels and chat bubbles turn individually inside their
  // full-size containers. Turning those containers instead throws their
  // contents across the screen - see the note in inperson.css.
  // Always counter-rotated. This was switchable while it was unclear whether a
  // HUD would end up beside its token instead of on it - an escape hatch for a
  // doubt, not a preference. Since then it has been measured: turned about the
  // anchor Foundry already sets, a label stays as close to its token as with no
  // rotation at all, 6 px either way. Sideways writing on the table screen is
  // nobody's choice.
  hud.classList.toggle("inperson-hud-upright", !!degrees);
  const value = degrees ? `${-degrees}deg` : "";
  if (hud.style.getPropertyValue("--tm-hud-counter") !== value) {
    hud.style.setProperty("--tm-hud-counter", value);
  }
}

/**
 * Foundry's own labels on a token, in the order Foundry adds them
 * (placeables/token.mjs `_draw`). Border, target markers and the turn marker
 * stay out: they are square or round around the token and look the same at any
 * quarter turn, and turning them would gain nothing.
 */
const UPRIGHT_PARTS = ["bars", "tooltip", "levelIndicator", "effects", "nameplate"];

/** Property on a Token holding the frame the labels hang in. */
const UPRIGHT_FRAME = "inpersonUprightFrame";

/**
 * Keep a token's name, bars and icons readable on a rotated scene.
 *
 * The parts are moved into one container that turns back against the stage,
 * about the centre of the token. Foundry keeps placing each part itself - the
 * nameplate below the token, the bars along its bottom edge, the icons in the
 * top left corner - in the token's own coordinates, and the container carries
 * that whole layout round to where "below" and "top left" are on the screen.
 *
 * Moving the parts rather than turning each one: Foundry reads positions back
 * from its own parts (the level marker is placed from `tooltip.y`), so changing
 * those positions would feed our rotation into its arithmetic. Inside the frame
 * every part keeps the coordinates Foundry gave it, and nothing it reads back
 * is ever different from what it wrote.
 *
 * Only Foundry's own parts, never children other modules added: a module that
 * finds its overlay by looking through `token.children` would no longer find it
 * and draw a new one on every refresh.
 *
 * Runs on every token refresh, which also covers a full redraw: that destroys
 * the frame with the other children, and the next refresh builds a new one.
 * @param {Token} token
 */
export function uprightTokenLabels(token) {
  if (!token || token.destroyed || !token.document) return;
  const onViewed = token.document.parent?.id === canvas?.scene?.id;
  const degrees = onViewed ? getRotation() : 0;

  let frame = token[UPRIGHT_FRAME];
  if (frame?.destroyed) frame = null;
  if (!degrees && !frame) return;          // an unrotated scene needs nothing

  if (!frame) {
    frame = token[UPRIGHT_FRAME] = token.addChild(new PIXI.Container());
    frame.eventMode = "none";
  }
  for (const name of UPRIGHT_PARTS) {
    const part = token[name];
    if (part && !part.destroyed && part.parent !== frame) frame.addChild(part);
  }

  const { width, height } = token.document.getSize();
  frame.pivot.set(width / 2, height / 2);
  frame.position.set(width / 2, height / 2);
  frame.rotation = -degrees * Math.PI / 180;
}

/** All tokens of the viewed scene, after its rotation changed. */
export function uprightAllTokens() {
  for (const token of canvas?.tokens?.placeables ?? []) uprightTokenLabels(token);
}

/**
 * Undo the rotation. Used when a scene without one is drawn, so nothing is
 * carried over from the previous scene.
 */
export function clearRotation() {
  if (canvas?.stage && canvas.stage.rotation !== 0) canvas.stage.rotation = 0;
  const hud = canvas?.hud?.element;
  if (!hud) return;
  if (hud.style.rotate) hud.style.rotate = "";
  hud.classList.remove("inperson-hud-upright");
  hud.style.removeProperty("--tm-hud-counter");
}
