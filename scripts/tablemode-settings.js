/**
 * A page of its own for the table mode.
 *
 * The module is a box of tools that happen to share a manifest: stopping map
 * downloads, steering two televisions, turning maps sideways. They have nothing
 * to do with one another beyond the occasion. Left in one flat list, the
 * settings of whichever tool had the most of them looked like "the settings of
 * the module" - which is what had happened: all nine visible entries belonged
 * to this one.
 *
 * So each tool gets a page and the list keeps one row per tool. A new tool costs
 * a row rather than fifteen.
 *
 * What stays out of here: the three settings each person makes for their own
 * device. Those are the only ones a player ever touches, and a page only a
 * gamemaster may open is no place for them.
 *
 * Nothing is written until Save, and nothing re-renders while the form is being
 * filled in - a render rebuilds every field from the stored values and throws
 * away whatever has been typed. See the note in displays-settings.js.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { openPanel } from "./panel.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TableModeSettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-tablemode",
    tag: "form",
    window: {
      title: "INPERSON.TableMode.Title",
      icon: "fa-solid fa-eye-slash",
      resizable: true
    },
    position: { width: 620, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-displays"],
    form: {
      handler: TableModeSettings.#onSubmit,
      closeOnSubmit: true
    },
    actions: {
      openControls: TableModeSettings.#onOpenControls
    }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/tablemode.hbs`,
      scrollable: [".inperson-scroll"]
    }
  };

  /** @override */
  async _prepareContext() {
    const get = key => game.settings.get(MODULE_ID, key);
    const scope = get(SETTINGS.SCOPE);

    return {
      running: get(SETTINGS.ENABLED),
      defaultPlayers: get(SETTINGS.DEFAULT_PLAYERS),
      scopeBackground: scope !== "everything",
      keepTokens: get(SETTINGS.KEEP_TOKENS),
      blockAudio: get(SETTINGS.BLOCK_AUDIO),
      hideProgress: get(SETTINGS.HIDE_PROGRESS),
      autoNoCanvas: get(SETTINGS.AUTO_NO_CANVAS),
      allowList: get(SETTINGS.ALLOW_LIST)
    };
  }

  /**
   * Show only what the answer above has made relevant.
   *
   * "Keep loading token artwork" has no effect at all while the scope stops at
   * the background map - nothing but the map is being blocked, so there is
   * nothing for it to keep. Asking the question anyway invites the reader to
   * believe it does something.
   * @override
   */
  _onRender(context, options) {
    super._onRender?.(context, options);
    const el = this.element;
    const sync = () => {
      const wide = el.querySelector('select[name="blockScope"]')?.value === "everything";
      el.querySelector(".inperson-when-wide")?.toggleAttribute("hidden", !wide);
    };
    el.querySelector('select[name="blockScope"]')?.addEventListener("change", sync);
    sync();
  }

  /** The master switch and the per-player choices live in the controls. */
  static #onOpenControls() {
    this.close();
    openPanel();
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;

    await game.settings.set(MODULE_ID, SETTINGS.DEFAULT_PLAYERS, !!data.defaultForPlayers);
    await game.settings.set(MODULE_ID, SETTINGS.SCOPE,
      data.blockScope === "everything" ? "everything" : "background");
    await game.settings.set(MODULE_ID, SETTINGS.KEEP_TOKENS, !!data.keepTokens);
    await game.settings.set(MODULE_ID, SETTINGS.BLOCK_AUDIO, !!data.blockAudio);
    await game.settings.set(MODULE_ID, SETTINGS.HIDE_PROGRESS, !!data.hideProgress);
    await game.settings.set(MODULE_ID, SETTINGS.AUTO_NO_CANVAS, !!data.autoNoCanvas);
    await game.settings.set(MODULE_ID, SETTINGS.ALLOW_LIST, data.allowList ?? "");

    ui.notifications.info("INPERSON.TableMode.Saved", { localize: true });
  }
}

export function openTableModeSettings() {
  if (!game.user.isGM) return;
  return new TableModeSettings().render({ force: true });
}
