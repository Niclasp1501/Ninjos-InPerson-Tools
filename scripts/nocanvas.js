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
import { isActive } from "./state.js";

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
  ui.notifications.info("INPERSON.Notify.CanvasRestored", { localize: true });
  await offerReload();
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

  if (!game.settings.get(MODULE_ID, SETTINGS.AUTO_NO_CANVAS)) {
    if (owned && game.settings.get("core", "noCanvas")) await release();
    return;
  }

  const wanted = isActive();
  const current = game.settings.get("core", "noCanvas");

  if (wanted && !current) {
    await game.settings.set("core", "noCanvas", true);
    await game.settings.set(MODULE_ID, SETTINGS.NO_CANVAS_OWNED, true);
    ui.notifications.info("INPERSON.Notify.CanvasDisabled", { localize: true });
    await offerReload();
    return;
  }

  if (!wanted && current && owned) await release();
}
