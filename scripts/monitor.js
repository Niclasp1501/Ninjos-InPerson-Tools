/**
 * Scene management for the two display clients.
 *
 * The problem: activating a scene pulls *every* connected client along.
 * `Scene#_onActivate` (documents/scene.mjs:1412) runs locally on each client and
 * calls `view()` - no hook in front of it, no core setting against it. So a
 * display follows every switch the GM makes for their own reasons, even when the
 * table should keep looking at what it was looking at.
 *
 * Two displays with different jobs, named explicitly in the settings:
 *
 *   battlemap display   always follows - the map on the TV
 *   scene display       can be pinned  - the view that must stay put
 *
 * Only the scene display is ever frozen. The battlemap display needs no special
 * handling at all; it behaves the way Foundry always did.
 *
 * Companion scenes tie the two together: a battlemap can name the scene its
 * partner display should show. When that battlemap is activated, the pinned
 * scene display moves to the companion instead of staying frozen - a deliberate
 * exception to the pin, because the pairing is exactly what the GM asked for.
 *
 * Storing the scene rather than firing a one-off push matters: `pullUsers` moves
 * a display on click but forgets. After a reload nothing re-fires and it comes
 * back on the active scene, looking exactly like the bug returned.
 *
 * Both directions of the freeze must be suppressed: activating B fires
 * `_onActivate(true)` on B *and* `_onActivate(false)` on the previously active
 * A, and the second calls `unview()`. Catching only the first leaves the pinned
 * display showing nothing at all.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { isSceneDisplay } from "./state.js";

/** Flag key on a Scene naming the companion scene for the scene display. */
export const COMPANION_FLAG = "companionScene";

/* -------------------------------------------- */
/*  Accounts                                    */
/* -------------------------------------------- */

/** The scene display account, or null when unset or unknown. */
export function getSceneDisplay() {
  const id = game.settings.get(MODULE_ID, SETTINGS.MONITOR_SC);
  return id ? (game.users?.get(id) ?? null) : null;
}

/** The battlemap display account, or null. */
export function getBattlemapDisplay() {
  const id = game.settings.get(MODULE_ID, SETTINGS.MONITOR_BM);
  return id ? (game.users?.get(id) ?? null) : null;
}

/** Both displays that are actually configured. @returns {User[]} */
export function getMonitorUsers() {
  return [getBattlemapDisplay(), getSceneDisplay()].filter(Boolean);
}

/* -------------------------------------------- */
/*  Pin state                                   */
/* -------------------------------------------- */

/** Is the scene display pinned right now? */
export function isPinned() {
  return !!game.settings.get(MODULE_ID, SETTINGS.MONITOR_PINNED);
}

/** Is *this* client the pinned scene display? */
export function isPinnedMonitor() {
  return isPinned() && isSceneDisplay(game.user);
}

/** Which scene should the scene display show? @returns {Scene|null} */
export function getPinnedScene() {
  const id = game.settings.get(MODULE_ID, SETTINGS.MONITOR_SCENE);
  return id ? (game.scenes?.get(id) ?? null) : null;
}

/** Remember the scene the scene display is on. */
async function rememberScene(sceneId) {
  await game.settings.set(MODULE_ID, SETTINGS.MONITOR_SCENE, sceneId ?? "");
}

/**
 * Pin or release the scene display. GM only.
 *
 * Releasing is not simply "stop ignoring activations" - the display would sit on
 * the pinned scene until the next activation happens along, which can be a
 * while. Two configured outcomes instead: rejoin the active scene, or fall back
 * to a chosen idle scene.
 * @param {boolean} [pinned] Omit to toggle
 */
export async function setPinned(pinned) {
  if (!game.user.isGM) throw new Error("Only a GM may pin the scene display.");
  const next = pinned ?? !isPinned();

  const display = getSceneDisplay();
  if (!display) {
    return ui.notifications.warn("INPERSON.Notify.NoSceneDisplay", { localize: true });
  }

  await game.settings.set(MODULE_ID, SETTINGS.MONITOR_PINNED, next);

  if (next) {
    // Pinning with no target would freeze the display wherever it happens to
    // be, which the GM cannot see. Adopt what it is currently looking at.
    if (!game.settings.get(MODULE_ID, SETTINGS.MONITOR_SCENE)) {
      const current = display.viewedScene ?? game.scenes?.active?.id;
      if (current) await rememberScene(current);
    }
    ui.notifications.info("INPERSON.Notify.PinOn", { localize: true });
    return;
  }

  await sendReleasedDisplay(display);
  ui.notifications.info("INPERSON.Notify.PinOff", { localize: true });
}

/** Move a just-released display where the settings say it belongs. */
async function sendReleasedDisplay(display) {
  if (!display?.active) return;

  if (game.settings.get(MODULE_ID, SETTINGS.MONITOR_RELEASE) === "idle") {
    const idleId = game.settings.get(MODULE_ID, SETTINGS.MONITOR_IDLE_SCENE);
    const idle = idleId ? game.scenes?.get(idleId) : null;
    if (idle) {
      await rememberScene(idle.id);
      idle.pullUsers([display]);
      return;
    }
    ui.notifications.warn("INPERSON.Notify.NoIdleScene", { localize: true });
  }

  const active = game.scenes?.active;
  if (active) {
    await rememberScene(active.id);
    active.pullUsers([display]);
  }
}

/**
 * Send the scene display to a scene. GM only.
 * @param {Scene} scene
 * @param {object} [viewOptions]
 */
export async function showOnMonitor(scene, viewOptions = {}) {
  if (!game.user.isGM) throw new Error("Only a GM may steer the display.");
  if (!scene) return;

  const display = getSceneDisplay();
  if (!display) {
    return ui.notifications.warn("INPERSON.Notify.NoSceneDisplay", { localize: true });
  }

  await rememberScene(scene.id);
  if (display.active) scene.pullUsers([display], viewOptions);

  ui.notifications.info(game.i18n.format("INPERSON.Notify.SentToMonitor", {
    scene: scene.name,
    who: display.name
  }));
}

/* -------------------------------------------- */
/*  Companion scenes                            */
/* -------------------------------------------- */

/** The scene paired with this battlemap, if any. @returns {Scene|null} */
export function getCompanionScene(scene) {
  const id = scene?.getFlag?.(MODULE_ID, COMPANION_FLAG);
  return id ? (game.scenes?.get(id) ?? null) : null;
}

/** Pair a battlemap with the scene its partner display should show. GM only. */
export async function setCompanionScene(scene, companionId) {
  if (!game.user.isGM) throw new Error("Only a GM may pair scenes.");
  if (companionId) await scene.setFlag(MODULE_ID, COMPANION_FLAG, companionId);
  else await scene.unsetFlag(MODULE_ID, COMPANION_FLAG);
}

/** Every battlemap that has a companion. @returns {{scene: Scene, companion: Scene}[]} */
export function listCompanionPairs() {
  const pairs = [];
  for (const scene of game.scenes ?? []) {
    const companion = getCompanionScene(scene);
    if (companion) pairs.push({ scene, companion });
  }
  return pairs;
}

/* -------------------------------------------- */
/*  The freeze                                  */
/* -------------------------------------------- */

const ACTIVATE_TARGET = "foundry.documents.Scene.prototype._onActivate";

/** Undo handle for the fallback patch. */
let _restore = null;

/**
 * Handle scene activation on the scene display.
 *
 * Wrapped here rather than on `Scene#view()` on purpose: view() is also how the
 * display is moved deliberately - through pullToScene or the GM's push.
 * Blocking that would pin the display for good. `_onActivate` is only ever the
 * automatic follow, so it is the precise cut.
 * @this {Scene}
 */
function onActivate(wrapped, active, operation) {
  if (!isPinnedMonitor()) return wrapped(active, operation);

  // A paired battlemap overrules the pin: following it is what the pairing is
  // for. Only on activation - the matching deactivation must stay swallowed,
  // or the display goes blank between the two events.
  if (active) {
    const companion = getCompanionScene(this);
    if (companion) {
      console.debug(`${MODULE_ID} | Companion scene "${companion.name}" for "${this.name}".`);
      companion.view();
      return;
    }
  }

  console.debug(`${MODULE_ID} | Scene display pinned - ignoring ${active ? "activation" : "deactivation"}.`);
  return;
}

/** Install the wrapper. Called during `init`, before any scene can activate. */
export function installMonitorWrapper() {
  const lw = globalThis.libWrapper;
  if (lw?.register) {
    lw.register(MODULE_ID, ACTIVATE_TARGET, onActivate, "MIXED");
    return;
  }
  const proto = foundry.documents?.Scene?.prototype;
  if (typeof proto?._onActivate !== "function") {
    console.error(`${MODULE_ID} | Cannot patch Scene#_onActivate - not found.`);
    return;
  }
  const original = proto._onActivate;
  proto._onActivate = function (...args) {
    return onActivate.call(this, original.bind(this), ...args);
  };
  _restore = () => { proto._onActivate = original; };
}

/** Remove the fallback patch. Dev teardown only. */
export function removeMonitorWrapper() {
  _restore?.();
  _restore = null;
}

/* -------------------------------------------- */
/*  Applying the assigned scene                 */
/* -------------------------------------------- */

/**
 * Bring this client to its assigned scene, if it is the pinned scene display.
 *
 * Covers what the freeze cannot: after a reload nothing activates, so no wrapper
 * fires and the display would come up on whatever scene is active.
 */
export async function applyPinnedScene() {
  if (!isPinnedMonitor()) return;
  const scene = getPinnedScene();
  if (!scene) return;
  if (canvas?.scene?.id === scene.id) return;
  await scene.view();
}
