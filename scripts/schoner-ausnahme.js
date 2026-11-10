/**
 * Scenes that are exempt from the scene display's screensaver.
 *
 * Asked for on 2026-11-11: an intro or a scene with a film of its own should
 * stay on the television however long it runs, without the black cover or a
 * screensaver scene coming in between. A switch on the scene, in the
 * "In-Person" tab of its configuration.
 *
 * Different from the map's own screensaver ("No screensaver" in the map
 * setting): that one applies while a map is active and the display shows it
 * or one of its companions. This one applies to the scene itself, wherever
 * it came from, as long as the display shows it.
 *
 * Kept in a file of its own so the rule can be tested without Foundry.
 */

import { MODULE_ID } from "./const.js";

/** Scene flag: `flags.ninjos-inperson-tools.noScreensaver`. */
export const NO_SCREENSAVER_FLAG = "noScreensaver";

/** Is this scene exempt from the screensaver? */
export function exemptFromScreensaver(scene) {
  return !!scene?.getFlag?.(MODULE_ID, NO_SCREENSAVER_FLAG);
}

/** The screensaver's own scenes, without the exempt ones. */
export function screensaverCandidates(scenes) {
  return (scenes ?? []).filter(s => !exemptFromScreensaver(s));
}
