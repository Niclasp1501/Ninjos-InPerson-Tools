/**
 * Optional interop with Lock View.
 *
 * Lock View and this module do the same job at a physical table: it steers the
 * view of the display clients, we decide what they download and which way round
 * they stand. The two only collide where our rotation changes what "width" and
 * "height" mean on screen, and Lock View - which dropped its own rotation in
 * 2.0.0 - has no way of knowing about it.
 *
 * Two places are affected, both only at 90 and 270 degrees:
 *
 *   viewbox    the display reports its visible extent as
 *              `window.innerWidth / scale` wide. At 90 degrees the screen's
 *              *width* maps onto the world's *height*, so the reported
 *              rectangle has its sides swapped and the GM sees a frame that
 *              cannot be right.
 *
 *   autoscale  `getAutoscale('horizontal')` computes `windowWidth /
 *              scene.width`. Rotated, the axis that fills the screen
 *              horizontally is `scene.height`.
 *
 * Neither is a Lock View bug: both values are correct until we turn the stage.
 * So the correction belongs here, on our side, and it is deliberately narrow -
 * everything else about Lock View is left exactly as it is.
 *
 * At exactly 90 and 270 degrees a rectangle on screen is still an
 * axis-aligned rectangle in the world, only with its sides exchanged. That is
 * why swapping two numbers makes the viewbox *exactly* right rather than
 * approximately right, and why we offer no angles in between.
 *
 * `physical` scaling needs no correction at all: `getAutoscale('physical')`
 * returns nothing but a scale, and rotation never touches the scale.
 *
 * Everything here is guarded by a presence check. Without Lock View installed
 * this file does nothing, and the module stays standalone.
 */

import { MODULE_ID } from "./const.js";
import { getRotation } from "./rotation.js";

const LOCKVIEW_ID = "LockView";

/** Modes whose scale depends on which way round the screen is. */
const AXIS_DEPENDENT = ["horizontal", "vertical", "autoInside", "autoOutside"];

/** Installed already? Both `ready` and `canvasReady` try, whichever wins. */
let _installed = false;

/* -------------------------------------------- */
/*  Detection                                   */
/* -------------------------------------------- */

/**
 * Is Lock View present and initialised?
 *
 * `game.modules.get(...).active` alone is not enough: the module can be enabled
 * while its global is not built yet, and we patch instance methods on that
 * global.
 * @returns {boolean}
 */
export function hasLockView() {
  return game.modules?.get(LOCKVIEW_ID)?.active === true && !!globalThis.lockView;
}

/** Does the scene's rotation exchange the screen axes? */
function axesSwapped(scene = canvas?.scene) {
  const degrees = getRotation(scene);
  return degrees === 90 || degrees === 270;
}

/**
 * Lock View's autoscale mode for a scene, for display purposes.
 * @returns {string|null}
 */
export function getLockViewAutoscale(scene) {
  if (!game.modules?.get(LOCKVIEW_ID)?.active) return null;
  return scene?.getFlag?.(LOCKVIEW_ID, "autoscale") ?? null;
}

/* -------------------------------------------- */
/*  1. The viewbox                              */
/* -------------------------------------------- */

/**
 * Correct the reported viewport extent before it goes out on the wire.
 *
 * Patched at the socket boundary rather than on `emitViewbox` itself: that
 * method builds the payload and emits it in one go, so there is no object to
 * correct afterwards, and reimplementing it would mean copying its sidebar and
 * scale handling.
 * @param {object} socket Lock View's socket instance
 */
function patchViewbox(socket) {
  if (typeof socket?.emit !== "function") {
    console.warn(`${MODULE_ID} | Lock View socket has no emit() - viewbox left uncorrected.`);
    return;
  }

  const original = socket.emit.bind(socket);

  socket.emit = function (messageType, target = "all", data) {
    if (messageType === "updateViewbox" && data && axesSwapped()) {
      data = { ...data, width: data.height, height: data.width };
    }
    return original(messageType, target, data);
  };
}

/**
 * Does Lock View shift the reported position for a hidden sidebar or AV dock?
 *
 * Those offsets are computed in screen pixels and applied to the world x axis.
 * Rotated, a screen-horizontal shift is no longer a world-horizontal one, and
 * getting the sign wrong would move the frame rather than leave it be. Both are
 * off by default, so the honest answer is to skip the correction and say so
 * instead of guessing.
 * @returns {boolean}
 */
function hasScreenSpaceOffset(scene = canvas?.scene) {
  return !!(scene?.getFlag?.(LOCKVIEW_ID, "sidebar")?.exclude
         || scene?.getFlag?.(LOCKVIEW_ID, "avDock")?.exclude);
}

/* -------------------------------------------- */
/*  2. Autoscale                                */
/* -------------------------------------------- */

/**
 * Make Lock View's fitting account for the rotation.
 *
 * The trick is to let Lock View do all the work twice. Its formulas read
 * `scene.width` and `scene.height`; handing it a stand-in with those two
 * exchanged yields exactly the scale a rotated scene needs, with its sidebar,
 * AV dock and physical handling intact.
 *
 * The position must come from the real scene, though - `sceneX + width/2` is
 * the centre of the map in world coordinates, and the centre does not move when
 * the stage turns. Hence two calls: position from one, scale from the other.
 * @param {object} sceneHandler Lock View's scene handler instance
 */
function patchAutoscale(sceneHandler) {
  if (typeof sceneHandler?.getAutoscale !== "function") {
    console.warn(`${MODULE_ID} | Lock View has no getAutoscale() - fitting left uncorrected.`);
    return;
  }

  const original = sceneHandler.getAutoscale.bind(sceneHandler);

  sceneHandler.getAutoscale = function (mode, scene = canvas.scene) {
    const real = original(mode, scene);
    if (!AXIS_DEPENDENT.includes(mode) || !axesSwapped(scene)) return real;

    try {
      // Only these three fields of the scene are read by getAutoscale. A plain
      // stand-in keeps the intent visible; should Lock View reach for a fourth,
      // the catch below returns its own uncorrected answer rather than throwing
      // inside a canvas draw.
      const transposed = { width: scene.height, height: scene.width, grid: scene.grid };
      const swapped = original(mode, transposed);
      if (!Number.isFinite(swapped?.scale)) return real;
      return { ...real, scale: swapped.scale };
    } catch (error) {
      console.warn(`${MODULE_ID} | Could not correct Lock View fitting for the rotation.`, error);
      return real;
    }
  };
}

/**
 * Re-run the fitting after the rotation of the current scene changed.
 *
 * Lock View applies autoscale when a scene loads. Changing the angle while
 * standing on the scene would otherwise leave the old fit in place until the
 * next reload.
 *
 * Deliberately hung off the flag change, not off `applyRotation`: that one also
 * runs on every pan, and calling `setAutoscale` from there would pan the canvas
 * and trigger itself.
 * @param {Scene} scene
 */
export function onRotationChanged(scene) {
  if (!hasLockView() || scene?.id !== canvas?.scene?.id) return;
  const mode = scene.getFlag(LOCKVIEW_ID, "autoscale");
  if (!mode || mode === "off") return;
  globalThis.lockView.sceneHandler?.setAutoscale?.(scene);
}

/* -------------------------------------------- */
/*  Installation                                */
/* -------------------------------------------- */

/**
 * Install both corrections. Idempotent, and a no-op without Lock View.
 * @returns {boolean} true when the patches are in place
 */
export function installLockViewInterop() {
  if (_installed) return true;
  if (!hasLockView()) return false;

  const lv = globalThis.lockView;
  patchViewbox(lv.socket);
  patchAutoscale(lv.sceneHandler);
  _installed = true;

  console.log(`${MODULE_ID} | Lock View detected - viewbox and fitting follow the scene rotation.`);
  return true;
}

/**
 * What to tell the GM in the scene configuration.
 *
 * Returns null when there is nothing worth saying - no Lock View, no rotation,
 * or a fitting the rotation does not touch.
 * @param {Scene} scene
 * @returns {string|null} localised sentence
 */
export function describeInterop(scene) {
  if (!game.modules?.get(LOCKVIEW_ID)?.active) return null;
  if (!axesSwapped(scene)) return null;

  if (hasScreenSpaceOffset(scene)) {
    return game.i18n.localize("INPERSON.SceneConfig.LockViewOffset");
  }

  const mode = scene?.getFlag?.(LOCKVIEW_ID, "autoscale");
  if (!mode || mode === "off" || mode === "physical") {
    return game.i18n.localize("INPERSON.SceneConfig.LockViewViewboxOnly");
  }
  return game.i18n.format("INPERSON.SceneConfig.LockViewCorrected", { mode });
}
