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
 * partner display should show. When that battlemap is activated, the scene
 * display moves to the companion - even while pinned, because a pairing made by
 * hand is a more precise instruction than a general "stay put".
 *
 * A default companion covers the battlemaps that name none. Without it an
 * unpinned display simply mirrors the battlemap, which is the one thing a
 * second screen need not do. `resolveDisplayTarget` holds the whole order of
 * precedence in one place.
 *
 * Storing the scene rather than firing a one-off push matters: `pullUsers` moves
 * a display on click but forgets. After a reload nothing re-fires and it comes
 * back on the active scene, looking exactly like the bug returned.
 *
 * That stored scene is kept true by exactly one thing - `onUserActivity` below,
 * which watches where the display actually is. Earlier versions bookkept per
 * route instead, one for our own push, one for companion jumps, and each new
 * route needed remembering. The GM is behind every move anyway, whichever way it
 * came about, so one watcher on the GM covers all of them and cannot fall behind
 * a route nobody thought of.
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

/**
 * Marks a pull as aimed at this display on purpose.
 *
 * Core's "pull all players" and our own targeted push both end up in
 * `Scene#pullUsers`, and by the time the socket message reaches the display the
 * two are indistinguishable. So the caller says which it is, and anything
 * without the mark is treated as a blanket pull.
 */
export const DELIBERATE = "inpersonDeliberate";

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

/* -------------------------------------------- */
/*  Following the display for real               */
/* -------------------------------------------- */

/**
 * Keep the stored scene honest, whatever moved the display.
 *
 * The stored value drives the gold badge and decides where a release starts
 * from, so it going stale is not cosmetic: the badge sticks to a scene the
 * display left long ago, and releasing then appears to fling it somewhere at
 * random. That was reported from the table on 2026-08-29.
 *
 * Every route we knew about was covered one at a time - our own push, a
 * companion jump - which left every route we did *not* think of uncovered,
 * moving the display by hand among them.
 *
 * Foundry keeps `user.viewedScene` current from a `userActivity` broadcast
 * (`Users.#handleUserActivity` sets it from `activityData.sceneId`) but fires no
 * hook, and the method is private and static, so there is nothing to wrap. What
 * we can do is listen to the same broadcast: several handlers may sit on one
 * socket event, and reading `sceneId` straight from the payload makes us
 * independent of whether Foundry's handler ran first.
 *
 * Only while pinned. Unpinned the value steers nothing, and every write is a
 * database round trip plus a broadcast to every client.
 * @param {string} userId
 * @param {object} activity
 */
/** Displays that told us they are showing a screensaver rather than their scene. */
const _screensaving = new Set();

/**
 * Remember whether a display is currently entertaining itself.
 *
 * Its wandering is not a move to be recorded - taking it at face value would
 * store a screensaver scene as the display's home and lose the pin target the
 * first time the table took a break.
 * @param {string} userId
 * @param {boolean} active
 */
export function setScreensaverState(userId, active) {
  if (active) _screensaving.add(userId);
  else _screensaving.delete(userId);
}

async function onUserActivity(userId, activity = {}) {
  if (!game.user?.isGM || !isPinned()) return;
  if (!("sceneId" in activity)) return;         // cursor, ruler, targets - not a move
  if (_screensaving.has(userId)) return;        // wandering, not moving house

  const display = getSceneDisplay();
  if (!display || userId !== display.id) return;

  const sceneId = activity.sceneId ?? "";
  if (game.settings.get(MODULE_ID, SETTINGS.MONITOR_SCENE) === sceneId) return;

  console.debug(`${MODULE_ID} | Scene display moved to "${game.scenes?.get(sceneId)?.name ?? "nothing"}" - noting it.`);
  await rememberScene(sceneId);
}

/** Start listening. GM only; called once the game is ready. */
export function installActivityListener() {
  if (!game.user?.isGM) return;
  game.socket.on("userActivity", onUserActivity);
}

/**
 * Pin or release the scene display. GM only.
 *
 * Releasing is not simply "stop ignoring activations" - the display would sit on
 * the pinned scene until the next activation happens along, which can be a
 * while. Two configured outcomes instead: rejoin the active scene, or fall back
 * to a chosen idle scene.
 * @param {boolean} [pinned] Omit to toggle
 * @param {Scene} [scene] Pin *here*, sending the display over first. Omit to pin
 *   the display wherever it already is.
 */
export async function setPinned(pinned, scene) {
  if (!game.user.isGM) throw new Error("Only a GM may pin the scene display.");
  const next = pinned ?? !isPinned();

  const display = getSceneDisplay();
  if (!display) {
    return ui.notifications.warn("INPERSON.Notify.NoSceneDisplay", { localize: true });
  }

  await game.settings.set(MODULE_ID, SETTINGS.MONITOR_PINNED, next);

  if (next) {
    // Two ways in, and they mean different things. From a scene's context menu
    // the answer is "pin it *here*" - anything else ignores the scene the GM
    // deliberately right-clicked. From the panel or the keybinding there is no
    // scene in the question, so it means "stay where you are" and we adopt what
    // the display is looking at now.
    const target = scene
      ?? (display.viewedScene ? game.scenes?.get(display.viewedScene) : null)
      ?? game.scenes?.active;

    if (!target) {
      return ui.notifications.warn("INPERSON.Notify.NoScene", { localize: true });
    }

    await rememberScene(target.id);
    // Marked deliberate so the freshly set pin does not block this very move.
    if (display.active && display.viewedScene !== target.id) {
      target.pullUsers([display], { [DELIBERATE]: true });
    }

    ui.notifications.info(game.i18n.format("INPERSON.Notify.PinOnScene", {
      who: display.name,
      scene: target.name
    }));
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
      idle.pullUsers([display], { [DELIBERATE]: true });
      return;
    }
    ui.notifications.warn("INPERSON.Notify.NoIdleScene", { localize: true });
  }

  const active = game.scenes?.active;
  if (active) {
    await rememberScene(active.id);
    active.pullUsers([display], { [DELIBERATE]: true });
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
  // Marked deliberate: this *is* the GM steering the display, so the pin must
  // not stand in the way of it.
  if (display.active) scene.pullUsers([display], { ...viewOptions, [DELIBERATE]: true });

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

/**
 * The fallback for battlemaps that name no companion of their own.
 * @returns {Scene|null}
 */
export function getDefaultCompanionScene() {
  const id = game.settings.get(MODULE_ID, SETTINGS.DEFAULT_COMPANION);
  return id ? (game.scenes?.get(id) ?? null) : null;
}

/** Store the fallback companion. GM only. */
export async function setDefaultCompanionScene(sceneId) {
  if (!game.user.isGM) throw new Error("Only a GM may set the default companion.");
  await game.settings.set(MODULE_ID, SETTINGS.DEFAULT_COMPANION, sceneId ?? "");
}

/** "Hold still" - distinct from "no answer", which means follow along. */
const STAY = Symbol("stay");
/** "Do what Foundry would have done." */
const FOLLOW = Symbol("follow");

/**
 * Where the scene display belongs once `scene` has been activated.
 *
 * The order is from most specific to least, which is also the order of how
 * deliberately each was chosen:
 *
 *   1. a companion named on this very battlemap - the GM paired these two
 *   2. pinned - the GM said "hold still" and nothing more specific overrides it
 *   3. the default companion - a standing answer for battlemaps without one
 *   4. otherwise follow, exactly as Foundry would
 *
 * Note that 1 beats 2: an explicit pairing is a more precise instruction than a
 * general "stay put", which is why a companion jump happens even while pinned.
 * @param {Scene} scene The scene being activated
 * @returns {Scene|symbol}
 */
function resolveDisplayTarget(scene) {
  const companion = getCompanionScene(scene);
  if (companion) return companion;
  if (isPinned()) return STAY;
  return getDefaultCompanionScene() ?? FOLLOW;
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
const PULL_TARGET = "foundry.documents.Scene.prototype.pullUsers";

/** Undo handles for the fallback patches. */
let _restore = null;
let _restorePull = null;

/**
 * Keep a pinned scene display out of blanket pulls.
 *
 * The freeze on `_onActivate` only covers scene *activation*. Core's "pull all
 * players here" goes through `Scene#pullUsers` instead, so it dragged the
 * pinned display along - the one thing pinning is supposed to prevent.
 *
 * Filtered here on the sending side rather than ignored on the display: the
 * socket message core sends is byte for byte the same one our own push sends,
 * so the display cannot tell them apart. The GM can, because the GM is the one
 * making the call.
 *
 * The battlemap display is deliberately left alone - it follows everything, and
 * that is its job.
 * @this {Scene}
 */
function onPullUsers(wrapped, users, options = {}) {
  if (options?.[DELIBERATE] || !isPinned()) return wrapped(users, options);

  const display = getSceneDisplay();
  if (!display || !users?.some(u => u.id === display.id)) return wrapped(users, options);

  const kept = users.filter(u => u.id !== display.id);
  console.debug(`${MODULE_ID} | Scene display pinned - left out of a blanket pull to "${this.name}".`);
  ui.notifications.info(game.i18n.format("INPERSON.Notify.DisplayKeptBack", {
    who: display.name
  }));
  if (!kept.length) return;
  return wrapped(kept, options);
}

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
  if (!isSceneDisplay(game.user)) return wrapped(active, operation);

  if (active) {
    const target = resolveDisplayTarget(this);
    if (target === FOLLOW) return wrapped(active, operation);
    if (target === STAY) {
      console.debug(`${MODULE_ID} | Scene display pinned - staying put.`);
      return;
    }
    console.debug(`${MODULE_ID} | Scene display goes to "${target.name}" for "${this.name}".`);
    target.view();
    return;
  }

  // The deactivation of the outgoing scene calls `unview()`, and it is swallowed
  // for the scene display without exception.
  //
  // It cannot be judged on its own merits: the decision above depends on the
  // scene being *activated*, and at this point there is no telling reliably
  // which that is. Swallowing is safe either way - whatever the activation
  // decides moments later ends in a `view()`, and going straight from one scene
  // to the next skips the black flash an `unview()` puts in between.
  //
  // The one case this changes: deactivating a scene with nothing to follow
  // leaves the display showing it rather than going blank. On a television in
  // the middle of a room that is the better of the two.
  return;
}

/** Install both wrappers. Called during `init`, before any scene can activate. */
export function installMonitorWrapper() {
  const lw = globalThis.libWrapper;
  if (lw?.register) {
    lw.register(MODULE_ID, ACTIVATE_TARGET, onActivate, "MIXED");
    lw.register(MODULE_ID, PULL_TARGET, onPullUsers, "MIXED");
    return;
  }

  const proto = foundry.documents?.Scene?.prototype;
  if (typeof proto?._onActivate === "function") {
    const original = proto._onActivate;
    proto._onActivate = function (...args) {
      return onActivate.call(this, original.bind(this), ...args);
    };
    _restore = () => { proto._onActivate = original; };
  } else {
    console.error(`${MODULE_ID} | Cannot patch Scene#_onActivate - not found.`);
  }

  if (typeof proto?.pullUsers === "function") {
    const originalPull = proto.pullUsers;
    proto.pullUsers = function (...args) {
      return onPullUsers.call(this, originalPull.bind(this), ...args);
    };
    _restorePull = () => { proto.pullUsers = originalPull; };
  } else {
    console.error(`${MODULE_ID} | Cannot patch Scene#pullUsers - not found.`);
  }
}

/** Remove the fallback patches. Dev teardown only. */
export function removeMonitorWrapper() {
  _restore?.();
  _restorePull?.();
  _restore = null;
  _restorePull = null;
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
  if (!isSceneDisplay(game.user)) return;

  if (isPinned()) {
    const scene = getPinnedScene();
    if (!scene || canvas?.scene?.id === scene.id) return;
    return scene.view();
  }

  // Unpinned there is nothing stored to return to, so the standing rules decide
  // again - which matters once a default companion exists, or the display would
  // sit on the battlemap until the next activation happened along.
  const active = game.scenes?.active;
  if (!active) return;
  const target = resolveDisplayTarget(active);
  if (typeof target === "symbol" || canvas?.scene?.id === target.id) return;
  await target.view();
}
