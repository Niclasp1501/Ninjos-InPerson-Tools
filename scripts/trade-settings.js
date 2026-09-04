/**
 * A page of its own for trading.
 *
 * Same reasoning as the other pages (see tablemode-settings.js): the module is
 * a box of tools that happen to share a manifest, and a flat list makes
 * whichever tool has the most switches look like "the settings of the module".
 * Trading had three of them sitting among the table mode's.
 *
 * The page carries one thing the settings alone cannot: a way into the logbook.
 * The journal is there in the sidebar, but a gamemaster looking for "where did
 * the sword go" is looking at these settings, not at a list of journals - so
 * the door is where the question is asked.
 *
 * Nothing is written until Save, and nothing re-renders while the form is being
 * filled in - a render rebuilds every field from stored values and throws away
 * whatever was ticked. See the note in displays-settings.js.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { syncTradeButton } from "./trade-start.js";
import { openLog } from "./trade-log.js";

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
    form: { handler: TradeSettings.#onSubmit, closeOnSubmit: true },
    actions: { openLog: TradeSettings.#onOpenLog }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/trade-settings.hbs` }
  };

  /** @override */
  async _prepareContext() {
    const get = key => game.settings.get(MODULE_ID, key);
    return {
      trade: get(SETTINGS.TRADE),
      withGM: get(SETTINGS.TRADE_WITH_GM),
      log: get(SETTINGS.TRADE_LOG),
      // Said here rather than left to be discovered at the table: a trade needs
      // a gamemaster on the line, because only a gamemaster may create and
      // delete items on somebody else's actor.
      hasLog: !!game.journal.getName("Tauschbuch"),
      // Two trade buttons side by side is the one collision worth naming.
      itemPiles: !!game.modules.get("item-piles")?.active
    };
  }

  static #onOpenLog() {
    openLog();
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const set = (key, value) => game.settings.set(MODULE_ID, key, value);

    await set(SETTINGS.TRADE, !!data.trade);
    await set(SETTINGS.TRADE_WITH_GM, !!data.withGM);
    await set(SETTINGS.TRADE_LOG, !!data.log);

    syncTradeButton();
  }
}

export function openTradeSettings() {
  if (!game.user.isGM) return;
  return new TradeSettings().render({ force: true });
}
