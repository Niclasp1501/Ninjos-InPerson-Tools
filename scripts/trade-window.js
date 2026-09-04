/**
 * The trade window.
 *
 * **The table is the window; the picking is a sheet laid over it.** A character
 * with sixty items would otherwise leave both people staring at a list and
 * nobody able to see what is actually being agreed to. So the table shows only
 * what is on it - usually four or five rows - and choosing happens in a layer
 * that covers it and goes away again.
 *
 * That layer also carries the second half of the reason: while you are picking,
 * nothing is sent. The partner sees your table change once, when you are done,
 * not once per tap. A trade where the other side's list flickers while they
 * scroll is unreadable, and every one of those changes would clear both
 * acceptances.
 *
 * **Everything is a tap.** No dragging anywhere - see KONZEPT-tausch.md: the
 * HTML5 `drop` event does not fire on a touchscreen at all, which is why Item
 * Piles' trade cannot be used on the tablet this module exists for. Rows are 44
 * pixels tall, quantities have a minus and a plus, and there is nothing that
 * needs a second hand.
 */

import { MODULE_ID } from "./const.js";
import {
  currentTrade, watchTrade, setMyOffer, setMyAccept, cancelTrade, answerRequest, dismissTrade
} from "./trade.js";
import { COINS } from "./trade-mover.js";
import { isSvg, fillIcons } from "./icon.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** German coin names, in the order dnd5e lists them. */
const COIN_LABEL = {
  pp: "INPERSON.Trade.Coin.pp",
  gp: "INPERSON.Trade.Coin.gp",
  ep: "INPERSON.Trade.Coin.ep",
  sp: "INPERSON.Trade.Coin.sp",
  cp: "INPERSON.Trade.Coin.cp"
};

export class TradeWindow extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-trade",
    tag: "div",
    window: {
      title: "INPERSON.Trade.Title",
      icon: "fa-solid fa-right-left",
      resizable: true
    },
    // A wish, not a promise: #fit() cuts it down to whatever the screen has.
    // Large because this is read across a table, sometimes by somebody holding
    // the tablet at arm's length, and the whole point of the window is that
    // both offers are legible at a glance.
    position: { width: 760, height: 640 },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-trade"],
    actions: {
      pickItems: TradeWindow.#onPickItems,
      pickCoins: TradeWindow.#onPickCoins,
      backToTable: TradeWindow.#onBack,
      applyPick: TradeWindow.#onApplyPick,
      toggleItem: TradeWindow.#onToggleItem,
      less: TradeWindow.#onLess,
      more: TradeWindow.#onMore,
      itemAll: TradeWindow.#onItemAll,
      itemNone: TradeWindow.#onItemNone,
      coinLess: TradeWindow.#onCoinLess,
      coinMore: TradeWindow.#onCoinMore,
      coinAll: TradeWindow.#onCoinAll,
      coinNone: TradeWindow.#onCoinNone,
      accept: TradeWindow.#onAccept,
      withdraw: TradeWindow.#onWithdraw,
      cancel: TradeWindow.#onCancel,
      answerYes: TradeWindow.#onAnswerYes,
      answerNo: TradeWindow.#onAnswerNo,
      dismiss: TradeWindow.#onDismiss
    }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/trade.hbs`,
      scrollable: ["", ".inperson-trade-side", ".inperson-pick-list"]
    }
  };

  /** "table" | "items" | "coins" */
  #mode = "table";

  /**
   * The picking in progress. Item id -> amount, and coin -> amount.
   *
   * Filled from the offer already on the table when the sheet opens, so
   * reopening it shows what is there rather than an empty slate.
   */
  #draftItems = new Map();
  #draftCoins = {};

  /* -------------------------------------------- */
  /*  Context                                     */
  /* -------------------------------------------- */

  /** My own actor in this trade. */
  #actor() {
    const trade = currentTrade();
    if (!trade) return null;
    return game.actors.get(trade[trade.side].actorId) ?? null;
  }

  /** @override */
  async _prepareContext() {
    const trade = currentTrade();
    if (!trade) return { gone: true };

    const me = trade[trade.side];
    const them = trade[trade.other];

    if (trade.over) return { ...this.#outcome(trade), over: true };

    const base = {
      waiting: trade.state === "asked" && trade.side === "a",
      asked: trade.state === "asked" && trade.side === "b",
      running: trade.state === "running",
      open: trade.state === "open",
      id: trade.id,
      meName: me.actorName ?? me.userName,
      themName: them.actorName ?? them.userName,
      meImg: me.actorImg,
      themImg: them.actorImg,
      meUser: me.userName,
      themUser: them.userName,
      meOffer: describe(me.offer),
      themOffer: describe(them.offer),
      meAccepted: me.accepted,
      themAccepted: them.accepted
    };

    if (this.#mode === "items") return { ...base, mode: "items", ...this.#itemContext() };
    if (this.#mode === "coins") return { ...base, mode: "coins", ...this.#coinContext() };
    return { ...base, mode: "table" };
  }

  /**
   * How it ended, as a sentence and a picture.
   *
   * The window says it rather than a notification, because in Sheet Only there
   * are no notifications - Sheet Only hides Foundry's whole interface, that one
   * included. A player who declined an offer was telling the other side
   * something that never arrived anywhere.
   */
  #outcome(trade) {
    const them = trade[trade.other];
    const who = them.actorName ?? them.userName;

    // "Roxy declined your request" is the wrong sentence for Roxy. Whoever
    // ended it reads what they did; the other side reads what happened to them.
    const byMe = trade.endedBy === game.user.id;

    const text = {
      declined:  [byMe ? "INPERSON.Trade.Over.IDeclined"  : "INPERSON.Trade.Over.Declined",  "fa-circle-xmark", "no"],
      cancelled: [byMe ? "INPERSON.Trade.Over.ICancelled" : "INPERSON.Trade.Over.Cancelled", "fa-circle-xmark", "no"],
      done:      ["INPERSON.Trade.Over.Done",   "fa-circle-check",         "yes"],
      broken:    ["INPERSON.Trade.Over.Broken", "fa-triangle-exclamation", "bad"]
    }[trade.state] ?? ["INPERSON.Trade.Over.Cancelled", "fa-circle-xmark", "no"];

    return {
      outcome: game.i18n.format(text[0], { who }),
      outcomeIcon: text[1],
      outcomeKind: text[2],
      themImg: them.actorImg,
      themName: who
    };
  }

  /**
   * Every item that can be offered.
   *
   * Contents of a container are *not* listed separately. A bag travels whole,
   * with everything in it and the coins in it - so offering the bag and its rope
   * as two rows would be a lie about what happens. The contents appear as a
   * note under the bag instead.
   */
  #itemContext() {
    const actor = this.#actor();
    const rows = (actor?.items ?? [])
      .filter(item => item.system?.quantity !== undefined || item.type === "container")
      .filter(item => !item.system?.container)          // inside a bag: travels with it
      .filter(item => item.system?.quantity !== 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(item => {
        const max = item.type === "container" ? 1 : (item.system?.quantity ?? 1);
        const picked = this.#draftItems.get(item.id) ?? 0;
        return {
          id: item.id,
          name: item.name,
          img: item.img,
          svg: isSvg(item.img),
          max,
          picked,
          on: picked > 0,
          stack: max > 1,
          contents: item.type === "container" ? contentNames(item) : []
        };
      });
    return { rows, hasRows: rows.length > 0 };
  }

  #coinContext() {
    const actor = this.#actor();
    const rows = COINS.map(c => ({
      key: c,
      label: game.i18n.localize(COIN_LABEL[c]),
      have: actor?.system?.currency?.[c] ?? 0,
      picked: this.#draftCoins[c] ?? 0
    })).filter(r => r.have > 0 || r.picked > 0);
    return { coinRows: rows, hasCoins: rows.length > 0 };
  }

  /**
   * Put the real SVG into every icon frame once the markup is there.
   *
   * See icon.js for why an `<img>` cannot do this job.
   * @override
   */
  async _onRender(context, options) {
    await super._onRender?.(context, options);
    await fillIcons(this.element);
  }

  /**
   * Fit the window to the screen and keep it fitting.
   *
   * A 640-pixel-tall window on a tablet in landscape, under a browser toolbar,
   * hangs off the bottom - and the two buttons that end the trade are the last
   * thing on it. They were simply not there. The wish above is therefore cut
   * down to what the screen actually has, on every turn of the device as well.
   * @override
   */
  async _onFirstRender(context, options) {
    await super._onFirstRender?.(context, options);
    this.#fit();
    this.#onResize = () => this.#fit();
    window.addEventListener("resize", this.#onResize);
    window.addEventListener("orientationchange", this.#onResize);
  }

  #onResize = null;

  #fit() {
    const width = Math.min(760, window.innerWidth - 16);
    const height = Math.min(640, window.innerHeight - 16);
    this.setPosition({
      width,
      height,
      left: Math.max(8, Math.round((window.innerWidth - width) / 2)),
      top: Math.max(8, Math.round((window.innerHeight - height) / 2))
    });
  }

  /* -------------------------------------------- */
  /*  Switching between table and sheet           */
  /* -------------------------------------------- */

  /** Take the offer on the table back into the draft, so picking continues it. */
  #loadDraft() {
    const trade = currentTrade();
    const offer = trade?.[trade.side]?.offer ?? { items: [], coins: {} };
    this.#draftItems = new Map(offer.items.map(i => [i.itemId, i.quantity]));
    this.#draftCoins = { ...offer.coins };
  }

  static #onPickItems() { this.#loadDraft(); this.#mode = "items"; this.render(); }
  static #onPickCoins() { this.#loadDraft(); this.#mode = "coins"; this.render(); }
  static #onBack() { this.#mode = "table"; this.render(); }

  /**
   * Hand the picked things to the table.
   *
   * Only here does anything leave this client. Both halves of the offer are
   * sent every time - the items sheet also carries the coins from the draft,
   * untouched - so switching between the two sheets cannot drop one of them.
   */
  static #onApplyPick() {
    const actor = this.#actor();
    const items = [...this.#draftItems.entries()]
      .filter(([, n]) => n > 0)
      .map(([itemId, quantity]) => {
        const item = actor?.items.get(itemId);
        return {
          itemId,
          quantity,
          name: item?.name ?? "?",
          img: item?.img ?? "icons/svg/item-bag.svg",
          // Written out for the other side and for the logbook: they cannot
          // read this actor, and after the trade the ids mean nothing.
          contents: item?.type === "container" ? contentNames(item) : []
        };
      });

    const coins = {};
    for (const c of COINS) if ((this.#draftCoins[c] ?? 0) > 0) coins[c] = this.#draftCoins[c];

    setMyOffer({ items, coins });
    this.#mode = "table";
    this.render();
  }

  /* -------------------------------------------- */
  /*  Picking                                     */
  /* -------------------------------------------- */

  /** Tapping a row puts it on or takes it off. Whole row, not a small box. */
  static #onToggleItem(event, target) {
    const id = target.dataset.itemId;
    if (this.#draftItems.get(id)) this.#draftItems.delete(id);
    else this.#draftItems.set(id, 1);
    this.render();
  }

  /**
   * Move an item's amount, the same way the coins move.
   *
   * The two used to work differently - coins had 0/-10/-/+/+10/all, items only
   * a minus and a plus - and there is no reason for that. Handing over eight of
   * twenty arrows is the same act as handing over eight of twenty gold pieces.
   */
  #itemStep(target, delta) {
    const id = target.dataset.itemId;
    const max = Number(target.dataset.max) || 1;
    const next = Math.max(0, Math.min(max, (this.#draftItems.get(id) ?? 0) + delta));
    if (next === 0) this.#draftItems.delete(id);
    else this.#draftItems.set(id, next);
    this.render();
  }

  static #onLess(event, target) { this.#itemStep(target, -stepOf(target)); }
  static #onMore(event, target) { this.#itemStep(target, stepOf(target)); }

  static #onItemAll(event, target) {
    this.#draftItems.set(target.dataset.itemId, Number(target.dataset.max) || 1);
    this.render();
  }

  static #onItemNone(event, target) {
    this.#draftItems.delete(target.dataset.itemId);
    this.render();
  }

  #coinStep(key, delta) {
    const have = this.#actor()?.system?.currency?.[key] ?? 0;
    const next = Math.max(0, Math.min(have, (this.#draftCoins[key] ?? 0) + delta));
    this.#draftCoins[key] = next;
    this.render();
  }

  static #onCoinLess(event, target) { this.#coinStep(target.dataset.coin, -stepOf(target)); }
  static #onCoinMore(event, target) { this.#coinStep(target.dataset.coin, stepOf(target)); }

  static #onCoinAll(event, target) {
    const key = target.dataset.coin;
    this.#draftCoins[key] = this.#actor()?.system?.currency?.[key] ?? 0;
    this.render();
  }

  static #onCoinNone(event, target) {
    this.#draftCoins[target.dataset.coin] = 0;
    this.render();
  }

  /* -------------------------------------------- */
  /*  The four buttons that matter                */
  /* -------------------------------------------- */

  static #onAccept() { setMyAccept(true); }
  static #onWithdraw() { setMyAccept(false); }
  static #onCancel() { cancelTrade(); }

  static #onAnswerYes() { answerRequest(currentTrade()?.id, true); }
  static #onAnswerNo() { answerRequest(currentTrade()?.id, false); }
  static #onDismiss() { dismissTrade(); }

  /* -------------------------------------------- */
  /*  Opening and closing                         */
  /* -------------------------------------------- */

  /** @override */
  async close(options) {
    // Closing the window is walking away - but only while there is something to
    // walk away from. A finished trade is simply let go of.
    if (currentTrade()?.over) dismissTrade();
    if (this.#onResize) {
      window.removeEventListener("resize", this.#onResize);
      window.removeEventListener("orientationchange", this.#onResize);
      this.#onResize = null;
    }
    // Closing the window is walking away. Leaving a trade running that nobody
    // can see would leave the other side waiting on a window that is gone.
    if (currentTrade()) cancelTrade();
    TradeWindow.#open = null;
    return super.close(options);
  }

  static #open = null;
  static #timer = null;

  /** Show the window, or bring it up to date if it is already there. */
  static refresh() {
    const trade = currentTrade();

    if (!trade) {
      // Closing here cannot call the trade off by accident: the session is
      // already cleared before this runs, so `close()` finds nothing to cancel.
      TradeWindow.#open?.close();
      return;
    }

    if (!TradeWindow.#open) {
      TradeWindow.#open = new TradeWindow();
      TradeWindow.#open.render({ force: true });
      return;
    }

    TradeWindow.#open.bringToFront?.();

    // A finished trade clears itself after a moment. Not a broken one: that is
    // the one message somebody has to have read.
    if (trade.over && trade.state !== "broken") {
      clearTimeout(TradeWindow.#timer);
      TradeWindow.#timer = setTimeout(() => {
        if (currentTrade()?.over) dismissTrade();
      }, 12000);
    }

    // Deliberately not switching back to the table. The partner changing their
    // offer while somebody is halfway through choosing would otherwise throw
    // away what they had picked - and they cannot see the table anyway, the
    // sheet is covering it.
    TradeWindow.#open.render();
  }
}

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

/** How far one tap moves the number. */
function stepOf(target) {
  return Number(target.dataset.step) || 1;
}

/**
 * Everything in a container, however deep - **including the money in it.**
 *
 * The mover carries a bag's `system.currency` across with the bag, and rightly
 * so: coins in a purse belong to the purse. But the table only listed the
 * items, so that money changed hands without ever having been shown to either
 * side. Moving something nobody agreed to is the one thing this window exists
 * to prevent, and it was doing it.
 *
 * Nested containers are counted in as well, for the same reason: they travel
 * too, and so does what is in them.
 */
function contentNames(container) {
  const inside = [...(container.system?.allContainedItems ?? [])];
  const names = inside.map(c =>
    c.system?.quantity > 1 ? `${c.name} ×${c.system.quantity}` : c.name
  );
  const money = coinsIn([container, ...inside]);
  return money ? [...names, money] : names;
}

/** The coins lying in these containers, added up, as finished text. */
function coinsIn(items) {
  const total = {};
  for (const item of items) {
    for (const coin of COINS) {
      const amount = item.system?.currency?.[coin] ?? 0;
      if (amount > 0) total[coin] = (total[coin] ?? 0) + amount;
    }
  }
  const parts = COINS
    .filter(coin => total[coin])
    .map(coin => `${total[coin]} ${game.i18n.localize(COIN_LABEL[coin])}`);
  return parts.length ? parts.join(", ") : null;
}

/** One side of the table, ready for the template. */
function describe(offer = {}) {
  const items = (offer.items ?? []).map(i => ({
    name: i.name,
    img: i.img,
    svg: isSvg(i.img),
    quantity: i.quantity,
    stack: i.quantity > 1,
    contents: i.contents ?? []
  }));
  const coins = COINS
    .filter(c => (offer.coins?.[c] ?? 0) > 0)
    .map(c => ({ label: game.i18n.localize(COIN_LABEL[c]), amount: offer.coins[c] }));
  return { items, coins, empty: !items.length && !coins.length };
}

/** Bring the running trade back to the front, if there is one. */
export function raiseTrade() {
  TradeWindow.refresh();
}

/** Called by trade.js whenever the session changes. */
export function installTradeWindow() {
  watchTrade(() => TradeWindow.refresh());
}
