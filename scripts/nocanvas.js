/**
 * Optional second stage: switch the canvas off entirely on blacked-out clients.
 *
 * Why both stages exist, rather than just one:
 *
 *   Canvas#draw     -> loadSceneTextures   core.noCanvas stops this
 *   Scenes#preload  -> loadSceneTextures   core.noCanvas does NOT stop this
 *
 * `Scenes#preload` (documents/collections/scenes.mjs:90) never checks noCanvas and
 * is driven by the `preloadScene` socket, so one GM click makes every client pull
 * the full scene - including clients that have no canvas at all. The wrapper in
 * blocker.js closes that hole; noCanvas removes the WebGL context and render loop
 * on top. Neither alone gets to zero, together they do.
 *
 * `core.noCanvas` is a client-scoped setting, so each client sets it for itself.
 * It is `requiresReload: true`, so a reload has to be offered rather than forced.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { still } from "./stille.js";
import { isActive } from "./state.js";
import { sheetViewWanted } from "./sheetview.js";

/** Ask the user to reload, using Foundry's own localised prompt when available. */
async function offerReload() {
  const SettingsConfig = foundry.applications?.settings?.SettingsConfig;
  if (typeof SettingsConfig?.reloadConfirm === "function") {
    return SettingsConfig.reloadConfirm({ world: false });
  }
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    modal: true,
    window: { title: "SETTINGS.ReloadPromptTitle" },
    content: `<p>${game.i18n.localize("SETTINGS.ReloadPromptBody")}</p>`
  });
  if (confirmed) foundry.utils.debouncedReload();
}

/** Give `core.noCanvas` back, but only if we were the ones who took it. */
async function release() {
  await game.settings.set("core", "noCanvas", false);
  await game.settings.set(MODULE_ID, SETTINGS.NO_CANVAS_OWNED, false);
  still("INPERSON.Notify.CanvasRestored", { localize: true });
  await offerReload();
}

/**
 * Switch the canvas off before Foundry draws it for the first time.
 *
 * Called at `setup`, which Foundry runs before `initializeCanvas` (game.mjs,
 * setupGame). Until 2026-10-04 the decision fell only at `ready`, after the
 * first draw, followed by an offer to reload. On an old iPad that first draw
 * never finished: the active scene had a video background, iOS does not load
 * a video before the screen is touched, and Foundry waited for it without an
 * error. `ready` never came, so neither did this module, the reload offer or
 * the sheet view, and the player looked at an empty screen.
 *
 * `game.settings.set` writes a client setting to localStorage synchronously
 * before its first await, so the canvas initialisation that follows already
 * reads the new value. No reload is needed: nothing was drawn yet.
 */
export function noCanvasBeforeFirstDraw() {
  if (game.user?.isGM) return;
  const tisch = game.settings.get(MODULE_ID, SETTINGS.AUTO_NO_CANVAS) && isActive();
  const blatt = game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_NO_CANVAS) && sheetViewWanted();
  if (!(tisch || blatt) || game.settings.get("core", "noCanvas")) return;
  game.settings.set("core", "noCanvas", true);
  game.settings.set(MODULE_ID, SETTINGS.NO_CANVAS_OWNED, true);
  console.log(`${MODULE_ID} | Canvas switched off before the first draw.`);
}

/**
 * Bring `core.noCanvas` in line with this client's table mode state.
 *
 * Ownership is tracked deliberately: Sheet-Only manages the same core setting for
 * its tablet mode. Table Mode only ever clears a flag it set itself, so the two
 * modules cannot end up fighting over it.
 */
export async function syncNoCanvas() {
  const owned = game.settings.get(MODULE_ID, SETTINGS.NO_CANVAS_OWNED);

  // Zwei Gründe, das Spielfeld abzuschalten: der Tischmodus und die
  // Blattansicht. Ein Tablet, das nur das Charakterblatt zeigt, rechnet sonst
  // trotzdem jede Szene durch - das war der spürbarste Unterschied zu Sheet Only.
  const tisch = game.settings.get(MODULE_ID, SETTINGS.AUTO_NO_CANVAS) && isActive();
  const blatt = game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_NO_CANVAS) && sheetViewWanted();
  const wanted = tisch || blatt;
  const current = game.settings.get("core", "noCanvas");

  if (wanted && !current) {
    await game.settings.set("core", "noCanvas", true);
    await game.settings.set(MODULE_ID, SETTINGS.NO_CANVAS_OWNED, true);
    still("INPERSON.Notify.CanvasDisabled", { localize: true });
    await offerReload();
    return;
  }

  if (!wanted && current && owned) await release();
}
