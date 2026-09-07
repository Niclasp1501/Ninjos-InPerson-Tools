/**
 * A trade between two people at the table.
 *
 * **The GM holds the truth.** Every change goes to the gamemaster's client,
 * which keeps the one real copy of the trade and broadcasts it back to both
 * sides. Players never talk to each other directly.
 *
 * That sounds like a detour and buys three things at once. The two offers can
 * never drift apart, because there is only ever one of them. Nobody can claim
 * their partner agreed to something else. And the rule "no gamemaster, no
 * trade" - which holds anyway, since only a GM may create and delete items on
 * another player's actor - stops being a special case and becomes simply how
 * it works.
 *
 * **An offer describes itself.** A player cannot read the other player's
 * actor, so the offer carries names, pictures and amounts rather than ids to
 * look up. The ids are in there too, but only the GM ever resolves them.
 *
 * **Any change clears both acceptances.** Without that, one side could accept,
 * wait for the other, and quietly take something off the table at the last
 * moment. This is the rule every trading system in every game needs, and it is
 * one line.
 */

import { MODULE_ID, SOCKET, SETTINGS } from "./const.js";
import { moveOffer } from "./trade-mover.js";
import { noteIntent, noteResult } from "./trade-log.js";
import { notify } from "./notify.js";

/** Trades the GM is currently keeping. id -> session. Only ever filled on a GM. */
const sessions = new Map();

/** What this client is currently showing, if anything. */
let mine = null;

/** Called whenever `mine` changes, so the window can repaint. */
let onChange = () => {};

export function watchTrade(fn) { onChange = fn ?? (() => {}); }
export function currentTrade() { return mine; }

/** An empty offer. */
const emptyOffer = () => ({ items: [], coins: {} });

/* -------------------------------------------- */
/*  Who can trade with whom                     */
/* -------------------------------------------- */

/**
 * Which character does this account trade with?
 *
 * Not simply `user.character`. That field is the character *assigned* in the
 * account settings, and plenty of tables never fill it in - the players own
 * their sheet, open it from the sidebar and never notice the field exists. On
 * this world that left the partner list empty with two players sitting right
 * there.
 *
 * So: the assigned one if there is one, otherwise the single character this
 * account owns. Two or more owned and none assigned is genuinely ambiguous -
 * nobody but the player can say which of them is trading - and that case is
 * reported rather than guessed at.
 *
 * @param {User} user
 * @returns {Actor|null}
 */
export function characterOf(user) {
  if (user.character) return user.character;
  const owned = ownedCharacters(user);
  return owned.length === 1 ? owned[0] : null;
}

/** Player characters this account owns outright. */
export function ownedCharacters(user) {
  return game.actors.filter(a => a.type === "character" && a.testUserPermission(user, "OWNER"));
}

/** Why this account cannot trade, or null when it can. */
export function whyNot(user) {
  if (characterOf(user)) return null;
  return ownedCharacters(user).length > 1 ? "many" : "none";
}

/**
 * Everybody who is here, with their character or the reason they have none.
 *
 * Only those actually logged in: a trade with somebody who is not there is not
 * a trade, and an offer nobody can answer would just sit on the screen. The
 * gamemaster is included only if the setting says so - most tables hand things
 * out rather than trade with the GM.
 *
 * People without a character are returned too, carrying their reason. Leaving
 * them out is what produced "there is nobody here" while two players were
 * sitting at the table - a list that quietly omits the answer is worse than one
 * that shows it greyed out.
 *
 * @returns {{userId: string, userName: string, actorId: string|null, actorName: string|null, reason: string|null}[]}
 */
export function possiblePartners() {
  const withGM = game.settings.get(MODULE_ID, SETTINGS.TRADE_WITH_GM);
  return game.users
    .filter(u => u.active && u.id !== game.user.id && (withGM || !u.isGM))
    .map(u => {
      const actor = characterOf(u);
      return {
        userId: u.id,
        userName: u.name,
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? null,
        actorImg: actor?.img ?? null,
        reason: actor ? null : whyNot(u)
      };
    });
}

/** Is a gamemaster there to carry it out? */
export function gmPresent() {
  return !!game.users.activeGM;
}

/* -------------------------------------------- */
/*  Sending                                     */
/* -------------------------------------------- */

/**
 * Exactly one client carries out trades: the first active gamemaster.
 *
 * Not "any gamemaster". This world has two gamemaster accounts, and with both
 * logged in every one of them would have run the same trade - each item created
 * twice, each coin moved twice. `game.users.activeGM` answers the same way on
 * every client, so all of them agree on who is in charge without asking.
 */
function amAuthority() {
  return game.user.isGM && game.users.activeGM?.id === game.user.id;
}

/**
 * Send something to whoever is in charge.
 *
 * The short circuit is not an optimisation. A socket message is never delivered
 * back to the client that sent it, so a gamemaster who is also one of the two
 * traders would be talking into the void: their own "I decline" would never be
 * processed, no window would close and nobody would be told anything. That is
 * exactly what happened.
 */
function toGM(message) {
  const payload = { type: SOCKET.TRADE, ...message, from: game.user.id };
  if (amAuthority()) return void onGMMessage(payload);
  game.socket.emit(SOCKET.NAME, payload);
}

/** Ask somebody for a trade. */
export function requestTrade(partner, myActorId) {
  if (!gmPresent()) {
    return notify(game.i18n.localize("INPERSON.Trade.NoGM"), "warn");
  }
  toGM({ action: "request", partner, myActorId });
}

/** Put my side of the table together anew. */
export function setMyOffer(offer) {
  if (!mine || mine.over) return;
  toGM({ action: "offer", id: mine.id, offer });
}

/** Say yes, or take it back. */
export function setMyAccept(accept) {
  if (!mine || mine.over) return;
  toGM({ action: "accept", id: mine.id, accept: !!accept });
}

/** Walk away. Meaningless once it is over, and must not be sent then. */
export function cancelTrade() {
  if (!mine || mine.over) return;
  toGM({ action: "cancel", id: mine.id });
}

/** Answer an incoming request. */
export function answerRequest(id, yes) {
  toGM({ action: "respond", id, accept: !!yes });
}

/* -------------------------------------------- */
/*  Receiving                                   */
/* -------------------------------------------- */

/** Is this user already in a trade? */
function busy(userId) {
  for (const session of sessions.values()) if (sideOf(session, userId)) return true;
  return false;
}

/** Which side of a session is this user? */
function sideOf(session, userId) {
  if (session.a.userId === userId) return "a";
  if (session.b.userId === userId) return "b";
  return null;
}

/** Send the session to both participants. */
function broadcast(session) {
  game.socket.emit(SOCKET.NAME, { type: SOCKET.TRADE, action: "state", session });
  // The GM may be one of the two, and a socket message never comes back to its
  // own sender - so this client is updated by hand.
  //
  // With a copy, not with the session itself. Everyone else receives this over
  // the socket, which serialises it; handing the live object to our own window
  // would make that one window the only place where a later change to the
  // session appears before it was broadcast.
  applyState(foundry.utils.deepClone(session));
}

/** Handle everything a player sent us. Runs on the one gamemaster in charge. */
async function onGMMessage(payload) {
  if (!amAuthority()) return;
  if (!game.settings.get(MODULE_ID, SETTINGS.TRADE)) return;
  const { action, from } = payload;

  if (action === "request") {
    const asker = game.users.get(from);
    const partner = game.users.get(payload.partner?.userId);
    if (!asker || !partner) return;

    // One trade per person. Each client keeps a single trade, so a second one
    // would quietly replace the first on somebody's screen - and the first
    // would go on living here with nobody able to answer it.
    if (busy(asker.id) || busy(partner.id)) {
      return game.socket.emit(SOCKET.NAME, {
        type: SOCKET.TRADE, action: "busy", to: asker.id
      });
    }

    // Name and portrait are written into the session here, on the one client
    // that can read every actor. A player cannot look up their partner's
    // character, so the session has to describe both people the same way an
    // offer describes itself.
    const side = (user, actorId) => {
      const actor = game.actors.get(actorId);
      return {
        userId: user.id,
        userName: user.name,
        actorId,
        actorName: actor?.name ?? user.name,
        actorImg: actor?.img ?? "icons/svg/mystery-man.svg",
        offer: emptyOffer(),
        accepted: false
      };
    };

    const session = {
      id: foundry.utils.randomID(),
      state: "asked",
      a: side(asker, payload.myActorId),
      b: side(partner, payload.partner.actorId)
    };
    sessions.set(session.id, session);
    broadcast(session);
    return;
  }

  const session = sessions.get(payload.id);
  if (!session) return;
  const side = sideOf(session, from);
  if (!side) return;

  if (action === "cancel") {
    // Not while the items are moving. Between the two `createEmbeddedDocuments`
    // calls there is nothing left to call off, and letting the state be
    // overwritten there would hide a half-finished move behind "cancelled".
    if (!["asked", "open"].includes(session.state)) return;
    session.state = "cancelled";
    session.endedBy = from;
    sessions.delete(session.id);
    broadcast(session);
    return;
  }

  if (action === "respond") {
    if (side !== "b" || session.state !== "asked") return;
    if (!payload.accept) {
      session.state = "declined";
      session.endedBy = from;
      sessions.delete(session.id);
    } else {
      session.state = "open";
    }
    broadcast(session);
    return;
  }

  if (session.state !== "open") return;

  if (action === "offer") {
    session[side].offer = payload.offer ?? emptyOffer();
    // The heart of it: a changed table is a new proposal, so neither previous
    // yes counts any more.
    session.a.accepted = false;
    session.b.accepted = false;
    broadcast(session);
    return;
  }

  if (action === "accept") {
    session[side].accepted = !!payload.accept;
    if (session.a.accepted && session.b.accepted) return execute(session);
    broadcast(session);
  }
}

/* -------------------------------------------- */
/*  Carrying it out                             */
/* -------------------------------------------- */

/**
 * Both said yes. Write it down, move it, write down what happened.
 *
 * Runs on the gamemaster's client because only a GM may create and delete
 * items on somebody else's actor.
 */
async function execute(session) {
  session.state = "running";
  broadcast(session);

  const actorA = game.actors.get(session.a.actorId);
  const actorB = game.actors.get(session.b.actorId);
  if (!actorA || !actorB) {
    session.state = "cancelled";
    session.error = "Ein Akteur ist nicht mehr da.";
    sessions.delete(session.id);
    return broadcast(session);
  }

  // The logbook can be switched off, and then this is null - `noteResult`
  // takes that and does nothing, so the moving does not care either way.
  const page = game.settings.get(MODULE_ID, SETTINGS.TRADE_LOG)
    ? await noteIntent({
        a: { actor: actorA, offer: session.a.offer },
        b: { actor: actorB, offer: session.b.offer }
      })
    : null;

  const reports = [
    await moveOffer(actorA, actorB, session.a.offer.items, session.a.offer.coins),
    await moveOffer(actorB, actorA, session.b.offer.items, session.b.offer.coins)
  ];
  await noteResult(page, reports);

  session.state = reports.some(r => r.error) ? "broken" : "done";
  sessions.delete(session.id);
  broadcast(session);
  await announce(session, actorA, actorB);
}

/** A chat card, so the table sees what happened. */
async function announce(session, actorA, actorB) {
  const list = offer => {
    const rows = (offer.items ?? []).map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`);
    const coins = Object.entries(offer.coins ?? {}).filter(([, n]) => n > 0)
      .map(([c, n]) => `${n} ${c.toUpperCase()}`);
    return [...rows, ...coins].join(", ")
      || game.i18n.localize("INPERSON.Trade.Card.Nothing");
  };
  const gives = (actor, offer) =>
    `<p>${game.i18n.format("INPERSON.Trade.Card.Gives", { who: actor.name })} ${list(offer)}</p>`;

  await ChatMessage.create({
    content: `<div class="inperson-trade-card">
      <p><strong>${actorA.name}</strong> &harr; <strong>${actorB.name}</strong></p>
      ${gives(actorA, session.a.offer)}
      ${gives(actorB, session.b.offer)}
      ${session.state === "broken"
        ? `<p><strong>${game.i18n.localize("INPERSON.Trade.Card.Broken")}</strong></p>`
        : ""}
    </div>`
  });
}

/* -------------------------------------------- */
/*  What every client does with a state         */
/* -------------------------------------------- */

/**
 * The states in which nothing more will happen.
 *
 * The window does not vanish when one of these arrives - it turns into the
 * answer and waits to be closed. Foundry's own notifications cannot be used for
 * this: Sheet Only hides them outright (`$("#notifications").addClass(
 * "sheet-only-hide")`, its index.js:902), so on the very devices this module
 * exists for, "Roxy declined" was announced to nobody.
 */
const OVER = ["declined", "cancelled", "done", "broken"];

function applyState(session) {
  const side = sideOf(session, game.user.id);
  if (!side) return;               // not ours

  const over = OVER.includes(session.state);

  // Nothing to show if this client was never in it, or has already closed it.
  if (over && !mine) return;

  mine = { ...session, side, other: side === "a" ? "b" : "a", over };
  onChange(mine, session);
}

/** Close the finished trade for good. */
export function dismissTrade() {
  mine = null;
  onChange(null, null);
}

/** Entry point from main.js's socket handler. */
export function onTradeSocket(payload) {
  if (payload.action === "state") return applyState(payload.session);
  if (payload.action === "busy") {
    if (payload.to !== game.user.id) return;
    return notify(game.i18n.localize("INPERSON.Trade.Busy"), "warn");
  }
  // A second gamemaster receives this too and must keep its hands off it.
  if (amAuthority()) return onGMMessage(payload);
}

