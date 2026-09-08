/**
 * A page of its own for trading.
 *
 * Same reasoning as the other pages (see tablemode-settings.js): the module is
 * a box of tools that happen to share a manifest, and a flat list makes
 * whichever tool has the most switches look like "the settings of the module".
 * Trading had three of them sitting among the table mode's.
 *
 * **Since 2026-09-08 there is one switch left.** The trade moved to Ninjo's
 * DnD Shops & Trade; whether the gamemaster joins in, and whether trades are
 * written down, are settings of that module now. What stays here is whether
 * this module offers a way in at all - the button above the player list and in
 * the Sheet Only bar - and the sentence saying where the rest went.
 *
 * Nothing is written until Save, and nothing re-renders while the form is being
 * filled in - a render rebuilds every field from stored values and throws away
 * whatever was ticked. See the note in displays-settings.js.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { syncTradeButton } from "./trade-start.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TradeSettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-trade-settings",
    tag: "form",
    window: {
      title: "INPERSON.TradeSettings.Title",
      icon: "fa-solid fa-right-left",
      resizable: true
    },
    position: { width: 580, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-displays"],
    form: { handler: TradeSettings.#onSubmit, closeOnSubmit: true }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/trade-settings.hbs` }
  };

  /** @override */
  async _prepareContext() {
    const get = key => game.settings.get(MODULE_ID, key);
    return {
      trade: get(SETTINGS.TRADE),
      // Is the module the trade moved to actually installed? If not, the button
      // can only say where it went, and the page had better admit that.
      shops: !!game.modules.get("ninjos-shops")?.active,
      // Two trade buttons side by side is the one collision worth naming.
      itemPiles: !!game.modules.get("item-piles")?.active
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const set = (key, value) => game.settings.set(MODULE_ID, key, value);

    await set(SETTINGS.TRADE, !!data.trade);

    syncTradeButton();
  }
}

export function openTradeSettings() {
  if (!game.user.isGM) return;
  return new TradeSettings().render({ force: true });
}
