/**
 * One-off migration from the former module id `ninjos-inperson-tools`.
 *
 * The module was renamed once it had grown from a single switch into a set of
 * tools. Everything it had stored carried the old prefix:
 *
 *   world settings   ninjos-inperson-tools.monitorSC, .monitorScene, …
 *   scene flags      flags["ninjos-inperson-tools"].companionScene / .rotation
 *
 * Seven scenes already had companion scenes and rotations set, so dropping that
 * was not an option.
 *
 * The old module does not need to be installed for this: settings live in the
 * world database under their string key and can be read through
 * `WorldSettings#getSetting` (documents/collections/world-settings.mjs:35),
 * and flags sit on the scene documents themselves. Both survive the old module
 * being removed, which is what lets the two never run at the same time - having
 * both active would mean two wrappers on the same core methods.
 */

import { MODULE_ID, SETTINGS } from "./const.js";

/** The id this module used to have. */
const OLD_ID = "ninjos-table-mode";

/**
 * Settings are stored serialised. `Setting#value` may hand back either the raw
 * string or an already-parsed value depending on the type, so handle both.
 */
function parseValue(raw) {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;   // plain string setting
  }
}

/**
 * Copy settings and scene flags over from the old id. GM only, runs once.
 * @returns {Promise<{settings: number, scenes: number}|null>}
 */
export async function migrateFromOldId() {
  if (!game.user?.isGM) return null;
  if (game.settings.get(MODULE_ID, SETTINGS.MIGRATED)) return null;

  let settingsCopied = 0;
  let scenesCopied = 0;

  // --- World settings ---
  try {
    const world = game.settings.storage.get("world");
    for (const doc of world ?? []) {
      const key = doc.key ?? "";
      if (!key.startsWith(`${OLD_ID}.`)) continue;
      const short = key.slice(OLD_ID.length + 1);

      // Only carry over what this version still knows. Keys that were dropped
      // along the way (monitorRoles, monitorName …) are deliberately left behind.
      if (!game.settings.settings.has(`${MODULE_ID}.${short}`)) continue;

      try {
        await game.settings.set(MODULE_ID, short, parseValue(doc.value));
        settingsCopied++;
      } catch (err) {
        console.warn(`${MODULE_ID} | Could not carry over setting "${short}"`, err);
      }
    }
  } catch (err) {
    console.error(`${MODULE_ID} | Reading the old settings failed`, err);
  }

  // --- Scene flags ---
  for (const scene of game.scenes ?? []) {
    const old = scene.flags?.[OLD_ID];
    if (!old || !Object.keys(old).length) continue;
    try {
      await scene.update({ [`flags.${MODULE_ID}`]: foundry.utils.deepClone(old) });
      scenesCopied++;
    } catch (err) {
      console.warn(`${MODULE_ID} | Could not carry over flags of scene "${scene.name}"`, err);
    }
  }

  await game.settings.set(MODULE_ID, SETTINGS.MIGRATED, true);

  if (settingsCopied || scenesCopied) {
    console.log(`${MODULE_ID} | Migrated ${settingsCopied} settings and ${scenesCopied} scenes from ${OLD_ID}.`);
    ui.notifications.info(game.i18n.format("INPERSON.Notify.Migrated", {
      settings: settingsCopied,
      scenes: scenesCopied
    }));
  }
  return { settings: settingsCopied, scenes: scenesCopied };
}
