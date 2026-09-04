/**
 * Starting a trade: the button and the partner list.
 *
 * The button sits where the person holding the tablet already looks - in Sheet
 * Only's row of buttons, next to the ones that module puts there - and, for
 * everybody else, above the player list. Both go to the same place.
 *
 * The list offers **only people who are logged in**. An offer to somebody who
 * is not there cannot be answered and would sit on the screen until it was
 * cancelled by hand; and at a table where everyone is in the same room, the
 * question "who is online" has an obvious answer anyway.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import {
  possiblePartners, requestTrade, currentTrade, gmPresent, characterOf, whyNot
} from "./trade.js";
import { mountButtonInSheetOnly, unmountFromSheetOnly, styleAsSheetOnlyButton } from "./sheet-only.js";
import { TradeWindow } from "./trade-window.js";
import { notify } from "./notify.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const BUTTON_ID = "inperson-trade-button";

/**
 * Why somebody cannot trade, as a key.
 *
 * Written out rather than built from the reason with a template string: the
 * validator reads the source to check that every key exists in both languages,
 * and a key it cannot see is a key nobody notices is missing.
 */
const WHY = {
  none: "INPERSON.Trade.Why.none",
  many: "INPERSON.Trade.Why.many"
};

export class TradePartnerDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-trade-partner",
    tag: "div",
    window: { title: "INPERSON.Trade.Ask", icon: "fa-solid fa-right-left", resizable: true },
    position: { width: 460, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-trade-partner"],
    actions: { choose: TradePartnerDialog.#onChoose }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/trade-partner.hbs`,
      scrollable: ["", ".inperson-partner-list"]
    }
  };

  /** @override */
  async _prepareContext() {
    const all = possiblePartners()
      .map(p => ({
        ...p,
        // The reason travels as finished text. Whoever reads this window is
        // looking for what to do next, not for a code word.
        why: p.reason ? game.i18n.localize(WHY[p.reason]) : null
      }))
      .sort((a, b) => (a.actorName ?? a.userName).localeCompare(b.actorName ?? b.userName));

    const mine = characterOf(game.user);
    return {
      partners: all.filter(p => p.actorId),
      blocked: all.filter(p => !p.actorId),
      hasPartners: all.some(p => p.actorId),
      nobody: all.length === 0,
      noGM: !gmPresent(),
      myActorName: mine?.name ?? null
    };
  }

  static #onChoose(event, target) {
    const actorId = characterOf(game.user)?.id;
    if (!actorId) return notify(game.i18n.localize("INPERSON.Trade.NoCharacter"), "warn");
    requestTrade({
      userId: target.dataset.userId,
      actorId: target.dataset.actorId
    }, actorId);
    this.close();
  }
}

/**
 * Open the partner list, or bring the running trade back up.
 *
 * Two things behind one button on purpose: with a trade running, "Tauschen" can
 * only sensibly mean "show me the trade", and a second entry point that opens a
 * partner list nobody can use would be one more thing to explain.
 */
export function openTrade() {
  if (currentTrade()) return TradeWindow.refresh();
  if (!characterOf(game.user)) {
    // Two different problems, two different sentences. "No character" and
    // "several characters, none of them named as yours" need opposite fixes.
    return notify(game.i18n.localize(
      whyNot(game.user) === "many" ? "INPERSON.Trade.PickOne" : "INPERSON.Trade.NoCharacter"
    ), "warn");
  }
  if (!gmPresent()) {
    return notify(game.i18n.localize("INPERSON.Trade.NoGM"), "warn");
  }
  return new TradePartnerDialog().render({ force: true });
}

/* -------------------------------------------- */
/*  The buttons                                 */
/* -------------------------------------------- */

/**
 * The row of buttons Sheet Only puts at the top.
 *
 * Registered without checking whether that mode is on: the bar is loaded a
 * moment after everything else, so asking now would answer "no" on a client
 * that is about to have one. The registration waits by itself and costs
 * nothing on a client that never gets a bar.
 */
function installSheetOnlyButton() {
  mountButtonInSheetOnly(BUTTON_ID + "-so", () => {
    const button = document.createElement("button");
    button.type = "button";
    styleAsSheetOnlyButton(button);
    button.title = game.i18n.localize("INPERSON.Trade.Button");
    button.innerHTML = `<i class="fa-solid fa-right-left"></i> <span>${game.i18n.localize("INPERSON.Trade.Button")}</span>`;
    button.addEventListener("click", () => openTrade());
    return button;
  });
}

/**
 * A button above the player list, for everyone not in Sheet Only.
 *
 * It goes **inside `#players-active`**, not into `#players` itself. That is not
 * a matter of taste: `#ui-left` carries `pointer-events: none` (foundry2.css
 * 15378) so that the canvas stays reachable through the gaps in the interface,
 * and only `#players-active` and `#players-inactive` switch it back on (8432).
 * A button sitting one level higher renders perfectly and cannot be clicked -
 * which is exactly what happened outside Sheet Only, where the bar of that
 * module gave the button a home that had no such rule.
 *
 * Rebuilt on every render of that element rather than kept: Foundry replaces
 * the whole list whenever somebody connects, and a stored reference would point
 * at a node that is no longer in the page.
 */
function installPlayersButton(element) {
  const players = element ?? document.getElementById("players");
  const root = players?.querySelector("#players-active") ?? players;
  if (!root || root.querySelector(`#${BUTTON_ID}`)) return;

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.innerHTML = `<i class="fa-solid fa-right-left"></i> <span>${game.i18n.localize("INPERSON.Trade.Button")}</span>`;
  button.addEventListener("click", () => openTrade());
  root.prepend(button);
}

/** Put the button wherever it belongs, or take it away again. */
export function syncTradeButton(element) {
  const on = game.settings.get(MODULE_ID, SETTINGS.TRADE);
  if (!on) {
    unmountFromSheetOnly(BUTTON_ID + "-so");
    document.getElementById(BUTTON_ID + "-so")?.remove();
    document.getElementById(BUTTON_ID)?.remove();
    return;
  }
  installSheetOnlyButton();
  installPlayersButton(element);
}

export function installTradeButton() {
  syncTradeButton();
  Hooks.on("renderPlayers", (app, element) => syncTradeButton(element));
}
