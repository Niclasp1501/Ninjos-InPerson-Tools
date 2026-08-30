/**
 * Resolves *whether* the current client should be blacked out, and lets the GM
 * change that for anyone. Assignment lives in a world setting, so Foundry
 * propagates every change to all connected clients on its own - no socket needed
 * for the state itself.
 */

import { MODULE_ID, SETTINGS } from "./const.js";

/** Cached result so the hot path (texture loading) never re-reads settings. */
let _active = null;

/**
 * The GM's explicit decision for a user, if any.
 * @param {string} userId
 * @returns {boolean|null} true = forced on, false = forced off, null = no decision
 */
export function getForcedState(userId) {
  const map = game.settings.get(MODULE_ID, SETTINGS.FORCED) ?? {};
  const value = map[userId];
  return typeof value === "boolean" ? value : null;
}

/**
 * The two display accounts, chosen explicitly in the settings.
 *
 * Earlier versions matched a name fragment ("Monitor"), which could not tell
 * MonitorBM from MonitorSC and forced every display into the same handling.
 * Naming them outright also frees the accounts to be called anything.
 * @returns {{bm: string, sc: string}} user ids, empty string when unset
 */
function getDisplayIds() {
  return {
    bm: game.settings.get(MODULE_ID, SETTINGS.MONITOR_BM) || "",
    sc: game.settings.get(MODULE_ID, SETTINGS.MONITOR_SC) || ""
  };
}

/**
 * Is this account one of the two displays? Both are exempt from table mode -
 * blacking out the screen everyone is looking at is the one failure that ruins
 * the session outright.
 * @param {User} user
 * @returns {boolean}
 */
export function isMonitorUser(user) {
  if (!user?.id) return false;
  const { bm, sc } = getDisplayIds();
  return user.id === bm || user.id === sc;
}

/** Is this the scene display - the one that can be pinned? */
export function isSceneDisplay(user) {
  const sc = game.settings.get(MODULE_ID, SETTINGS.MONITOR_SC) || "";
  return !!sc && user?.id === sc;
}

/** Is this the battlemap display - the one that always follows? */
export function isBattlemapDisplay(user) {
  const bm = game.settings.get(MODULE_ID, SETTINGS.MONITOR_BM) || "";
  return !!bm && user?.id === bm;
}

/**
 * Resolve table mode state for an arbitrary user. Used by the GM panel to show
 * what every player is currently getting.
 *
 * Precedence, most specific first: an explicit decision always beats a rule.
 *   1. master switch off
 *   2. GM assigned this user explicitly
 *   3. the user chose for their own client
 *   4. monitor/display account  -> protected
 *   5. gamemaster              -> never automatic
 *   6. the default for players
 * @param {User} user
 * @returns {{active: boolean, reason: string}}
 */
export function resolveFor(user) {
  if (!game.settings.get(MODULE_ID, SETTINGS.ENABLED)) {
    return { active: false, reason: "disabled" };
  }
  const forced = getForcedState(user.id);
  if (forced === true) return { active: true, reason: "forcedOn" };
  if (forced === false) {
    // A display is exempt in any case. Reporting a redundant "excluded by the
    // GM" would send someone hunting for an override that changes nothing -
    // the display protection is the real reason, so name that.
    return { active: false, reason: isMonitorUser(user) ? "monitor" : "forcedOff" };
  }

  // A client's own choice is only visible on that client. From the GM's seat we
  // can only report the default, which is what an "auto" client resolves to.
  if (user.id === game.user.id) {
    const self = game.settings.get(MODULE_ID, SETTINGS.SELF);
    if (self === "on") return { active: true, reason: "selfOn" };
    if (self === "off") return { active: false, reason: "selfOff" };
  }

  if (isMonitorUser(user)) return { active: false, reason: "monitor" };
  if (user.isGM) return { active: false, reason: "isGM" };
  const byDefault = game.settings.get(MODULE_ID, SETTINGS.DEFAULT_PLAYERS);
  return { active: !!byDefault, reason: byDefault ? "default" : "defaultOff" };
}

/**
 * Is the local client currently blacked out?
 * @returns {boolean}
 */
export function isActive() {
  // The wrapper is installed during `init`, before `game.user` exists. Nothing
  // loads textures that early, but a stray early call must not throw inside a
  // draw call, so fail open (= do not block).
  if (!game.user || !game.settings.settings.has(`${MODULE_ID}.${SETTINGS.ENABLED}`)) return false;
  if (_active === null) _active = resolveFor(game.user).active;
  return _active;
}

/**
 * Drop the cached answer. Call whenever any relevant setting changed.
 * @returns {boolean} true when the effective state actually flipped
 */
export function invalidate() {
  const previous = _active;
  _active = null;
  const next = isActive();
  return previous !== null && previous !== next;
}

/**
 * GM action: force a user on, off, or back to automatic.
 * @param {string} userId
 * @param {boolean|null} value
 */
export async function setForcedState(userId, value) {
  if (!game.user.isGM) throw new Error("Only a GM may change table mode assignment.");
  const map = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTINGS.FORCED) ?? {});
  if (value === null) delete map[userId];
  else map[userId] = !!value;
  await game.settings.set(MODULE_ID, SETTINGS.FORCED, map);
}
