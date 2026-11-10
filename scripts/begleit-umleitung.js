/**
 * Activating a companion scene activates its map instead.
 *
 * Asked for on 2026-11-11: Ninjo ties music to companion scenes and wants to
 * start a moment from the scene list, by activating the companion. The table
 * should then get what belongs together: the map on the battlemap display,
 * this companion on the scene display, and the companion's music.
 *
 *   1. A scene that is the companion of exactly one map: that map is activated
 *      instead, and the scene display goes to this companion, not the map's
 *      first one. Several maps: the game master picks one, or nothing happens.
 *   2. The companion is stored as the scene display's scene, the same as a
 *      choice by hand, so a reload keeps it.
 *   3. Music: a companion with a playlist or a track of its own plays that
 *      instead of the map's. Without one, the map's music stays.
 *   4. The map already active: only the display and the music change.
 *   5. Maps themselves, and scenes nobody pairs, activate as before.
 *
 * The rule itself (which maps, what to do) is pure and tested in
 * tools/test-begleit-umleitung.mjs; the wiring into Foundry is below it.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { getCompanionScenes, showOnMonitor, rememberDisplayScene, COMPANION_OPTION } from "./monitor.js";

/* -------------------------------------------- */
/*  The rule                                     */
/* -------------------------------------------- */

/**
 * What to do when `scene` is about to be activated.
 * @param {object} scene
 * @param {object} context
 * @param {Iterable<object>} context.scenes Every scene of the world
 * @param {(s: object) => string[]} context.companionsOf Companion ids of a scene
 * @returns {{art: "normal"} | {art: "karte", karte: object} | {art: "wahl", karten: object[]}}
 */
export function redirectFor(scene, { scenes, companionsOf }) {
  if (!scene) return { art: "normal" };
  // A map stays a map, even if another map also names it as a companion.
  if (companionsOf(scene).length) return { art: "normal" };
  const karten = [...(scenes ?? [])].filter(s => s.id !== scene.id && companionsOf(s).includes(scene.id));
  if (!karten.length) return { art: "normal" };
  if (karten.length === 1) return { art: "karte", karte: karten[0] };
  return { art: "wahl", karten };
}

/** Has this scene music of its own? */
export function hasOwnMusic(scene) {
  return !!(scene?.playlist || scene?.playlistSound);
}

/* -------------------------------------------- */
/*  In Foundry                                   */
/* -------------------------------------------- */

/**
 * Music swap for the next activation of one map, on this client.
 *
 * Foundry starts the scene music in `Playlists#_onChangeScene`, and only on
 * the client that activated the scene. It reads `playlist` and `playlistSound`
 * of the scene it is given and stops what played before. Handing it the
 * companion instead of the map, for this one call, starts the companion's
 * music straight away; the map's never begins.
 */
let _musicSwap = null;

function wrapChangeScene() {
  const proto = foundry.documents?.collections?.Playlists?.prototype ?? game.playlists?.constructor?.prototype;
  if (typeof proto?._onChangeScene !== "function" || proto._inpersonCompanionMusic) return;
  const original = proto._onChangeScene;
  proto._onChangeScene = function (scene, ...rest) {
    const swap = _musicSwap;
    if (swap && scene?.id === swap.mapId) {
      _musicSwap = null;
      return original.call(this, swap.source, ...rest);
    }
    return original.call(this, scene, ...rest);
  };
  proto._inpersonCompanionMusic = true;
}

function enabled() {
  try {
    return game.settings.get(MODULE_ID, SETTINGS.COMPANION_REDIRECT) !== false;
  } catch {
    return false;
  }
}

/** Which map? A small dialog; closing it means nothing happens. */
async function pickMap(scene, karten) {
  const { DialogV2 } = foundry.applications.api;
  const t = key => game.i18n.localize(key);
  const choice = await DialogV2.wait({
    window: { title: t("INPERSON.Redirect.ChooseTitle"), icon: "fa-solid fa-map" },
    classes: ["inperson-panel"],
    position: { width: 380 },
    content: `<p>${game.i18n.format("INPERSON.Redirect.ChooseText", { scene: foundry.utils.escapeHTML(scene.name) })}</p>`,
    buttons: [
      ...karten.map(k => ({ action: k.id, label: k.name, icon: "fa-solid fa-map" })),
      { action: "cancel", label: t("INPERSON.Redirect.Cancel"), default: true }
    ],
    rejectClose: false,
    render: (_event, dialog) => {
      for (const b of dialog.element.querySelectorAll("button[data-action]")) b.setAttribute("aria-label", b.textContent.trim());
    }
  });
  return karten.find(k => k.id === choice) ?? null;
}

/** Carry out the redirect for `companion`, activated by this game master. */
export async function redirectToMap(companion, karte) {
  if (karte.active) {
    // Nothing to load: the companion goes up and its music starts, if it has any.
    await showOnMonitor(companion);
    if (hasOwnMusic(companion)) await game.playlists._onChangeScene(companion);
    return;
  }
  _musicSwap = hasOwnMusic(companion) ? { mapId: karte.id, source: companion } : null;
  try {
    // The option tells the scene display which companion to show, instead of
    // the map's first one (monitor.js, onActivate).
    await karte.update({ active: true }, { [COMPANION_OPTION]: companion.id });
  } finally {
    _musicSwap = null;
  }
  await rememberDisplayScene(companion.id);
}

/**
 * Before Foundry activates a scene: a companion is redirected, everything else
 * goes through. Returning false stops this activation; the redirect then
 * activates the map with an option of its own, which passes here untouched.
 */
function onPreUpdateScene(scene, changes, options, userId) {
  if (changes?.active !== true || options?.[COMPANION_OPTION]) return;
  if (userId !== game.user?.id || !game.user?.isGM || !enabled()) return;
  const plan = redirectFor(scene, {
    scenes: game.scenes ?? [],
    companionsOf: s => getCompanionScenes(s).map(c => c.id)
  });
  if (plan.art === "normal") return;
  (async () => {
    const karte = plan.art === "karte" ? plan.karte : await pickMap(scene, plan.karten);
    if (karte) await redirectToMap(scene, karte);
  })().catch(error => console.error(`${MODULE_ID} | Companion redirect failed.`, error));
  return false;
}

export function installCompanionRedirect() {
  wrapChangeScene();
  Hooks.on("preUpdateScene", onPreUpdateScene);
}
