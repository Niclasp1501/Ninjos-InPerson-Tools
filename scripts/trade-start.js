/**
 * The trade button - which now opens somebody else's window.
 *
 * **The trade moved out on 2026-09-08.** It lives in Ninjo's DnD Shops & Trade
 * now, on the same table its shop trading uses. Two trade windows in two
 * modules, side by side, looking different and behaving differently, were
 * exactly the inconsistency that table was built against.
 *
 * What stayed here is the way in. The button sits where the person holding the
 * tablet already looks - in Sheet Only's row of buttons - and, for everybody
 * else, above the player list. Both now call over to Shops.
 *
 * **And the note.** Somebody who looks for the trade here and silently does not
 * find it concludes the module is broken. This module has users who have never
 * heard of the other one, so when Shops is not installed the button says where
 * the function went rather than doing nothing.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { mountButtonInSheetOnly, unmountFromSheetOnly, styleAsSheetOnlyButton } from "./sheet-only.js";
import { notify } from "./notify.js";

const BUTTON_ID = "inperson-trade-button";

/** The module the trade moved to. */
const SHOPS = "ninjos-shops";

/**
 * Hand over, or say where it went.
 *
 * The call is deliberately narrow: one named function on the other module's
 * `api`. Anything wider would be this module reaching into the internals of
 * another one, and the dependency is optional in both directions - neither
 * module needs the other to work.
 */
export function openTrade() {
  const shops = game.modules.get(SHOPS);
  const start = shops?.active ? shops.api?.tauschStarten : null;
  if (typeof start === "function") return void start();

  // Not a toast: Sheet Only hides Foundry's notifications along with the rest
  // of the interface, and this sentence is the whole point of the button.
  foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize("INPERSON.Trade.Moved.Title") },
    content: `<p>${game.i18n.localize("INPERSON.Trade.Moved.Text")}</p>`,
    ok: { label: game.i18n.localize("INPERSON.Trade.Moved.Ok") }
  }).catch(() => {});
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
 * A button sitting one level higher renders perfectly and cannot be clicked.
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
