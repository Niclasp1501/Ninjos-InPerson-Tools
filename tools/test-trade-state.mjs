/**
 * The trade state machine, driven without a browser.
 *
 * Three clients are built by importing trade.js three times over three fake
 * `game` objects, and a fake socket wires them together with Foundry's one rule
 * that matters here: a message is delivered to everyone EXCEPT its sender.
 * That rule is the whole reason the gamemaster's own "I decline" went missing.
 */

import { pathToFileURL } from "node:url";

const SRC = "F:/KI-Agenten-Workspace/Foundry-Module/Ninjos-InPerson-Tools/scripts/trade.js";

const USERS = [
  { id: "gm", name: "Dungeonmaster", isGM: true,  active: true, role: 4 },
  { id: "u1", name: "Nadylos",       isGM: false, active: true, role: 1 },
  { id: "u2", name: "Roxy",          isGM: false, active: true, role: 1 }
];

const listeners = [];        // {userId, fn}
const notes = [];            // every notification anybody saw

function makeGame(me) {
  const users = USERS.map(u => ({ ...u, character: { id: `a-${u.id}`, name: `Held ${u.name}` } }));
  const collection = users.slice();
  collection.filter = Array.prototype.filter.bind(users);
  collection.map = Array.prototype.map.bind(users);
  collection.get = id => users.find(u => u.id === id);
  Object.defineProperty(collection, "activeGM", {
    get: () => users.filter(u => u.active && u.isGM).sort((a, b) => b.role - a.role || a.id.localeCompare(b.id))[0] ?? null
  });

  return {
    user: collection.get(me),
    users: collection,
    actors: { get: id => ({ id, name: `Held ${id}` }) },
    settings: { get: (_m, key) => key !== "tradeWithGM" },      // trading on, GM not offered
    socket: {
      emit(_name, payload) {
        // Foundry never delivers a socket message back to its own sender, and
        // what it does deliver went through JSON - so no receiver ever shares
        // an object with the sender. Copying here is what makes this faithful;
        // without it a later change on the gamemaster silently rewrote what a
        // player was already looking at, and the test believed it.
        const wire = JSON.parse(JSON.stringify(payload));
        for (const l of listeners) if (l.userId !== me) l.fn(JSON.parse(JSON.stringify(wire)));
      }
    },
    i18n: {
      localize: k => k,
      format: (k, d) => `${k}(${Object.values(d).join(",")})`
    }
  };
}

async function client(id) {
  globalThis.game = makeGame(id);
  globalThis.document = { createElement: () => ({ classList: { add() {} }, appendChild() {}, remove() {} }) };
  globalThis.ui = { notifications: {
    info: m => notes.push([id, "info", m]),
    warn: m => notes.push([id, "warn", m]),
    error: m => notes.push([id, "error", m])
  } };
  globalThis.foundry = { utils: {
    randomID: () => "trade1",
    deepClone: o => JSON.parse(JSON.stringify(o))
  } };
  globalThis.CONST = { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 } };

  // Fresh module instance per client: each keeps its own `mine` and `sessions`.
  const mod = await import(`${pathToFileURL(SRC).href}?c=${id}`);
  const own = { id, game: globalThis.game, ui: globalThis.ui, mod, seen: [] };
  mod.watchTrade(trade => own.seen.push(
    trade ? `${trade.state}/${trade.side}${trade.over ? "(Endbild)" : ""}` : "zu"));
  listeners.push({ userId: id, fn: p => run(own, () => mod.onTradeSocket(p)) });
  return own;
}

/**
 * Put this client's globals in place, do something, put them back.
 *
 * The restoring is the point. Without it a nested delivery leaves the globals
 * pointing at the last client that ran, and the module that started the call
 * finishes its work reading somebody else's `game.user` - which produced three
 * convincing but entirely false results the first time this was run.
 */
function run(c, fn) {
  const g = globalThis.game, u = globalThis.ui;
  globalThis.game = c.game;
  globalThis.ui = c.ui;
  try { return fn(); }
  finally { globalThis.game = g; globalThis.ui = u; }
}

const clients = {};
for (const id of ["gm", "u1", "u2"]) clients[id] = await client(id);

/* ---- Case 1: player asks player, the second one declines -------------- */

run(clients.u1, () => clients.u1.mod.requestTrade({ userId: "u2", actorId: "a-u2" }, "a-u1"));
run(clients.u2, () => clients.u2.mod.answerRequest("trade1", false));

console.log("== Spieler fragt Spieler, Ablehnung ==");
for (const id of ["u1", "u2"]) console.log(` ${id}:`, clients[id].seen.join(" -> "));
console.log(" Meldungen:", notes.map(n => `${n[0]}:${n[2]}`).join(" | "));

/* ---- Case 2: the gamemaster is the one who declines ------------------- */

notes.length = 0;
for (const c of Object.values(clients)) c.seen.length = 0;

run(clients.u1, () => clients.u1.mod.requestTrade({ userId: "gm", actorId: "a-gm" }, "a-u1"));
run(clients.gm, () => clients.gm.mod.answerRequest("trade1", false));

console.log("\n== Spielleiter lehnt selbst ab (der Fehler von eben) ==");
for (const id of ["u1", "gm"]) console.log(` ${id}:`, clients[id].seen.join(" -> ") || "NICHTS PASSIERT");
console.log(" Meldungen:", notes.map(n => `${n[0]}:${n[2]}`).join(" | ") || "KEINE");

/* ---- Case 3: does a change really clear both acceptances? ------------- */

notes.length = 0;
for (const c of Object.values(clients)) c.seen.length = 0;

run(clients.u1, () => clients.u1.mod.requestTrade({ userId: "u2", actorId: "a-u2" }, "a-u1"));
run(clients.u2, () => clients.u2.mod.answerRequest("trade1", true));
run(clients.u2, () => clients.u2.mod.setMyAccept(true));
const beforeChange = clients.u2.mod.currentTrade();
run(clients.u1, () => clients.u1.mod.setMyOffer({ items: [{ itemId: "x", quantity: 1, name: "Seil" }], coins: {} }));
const afterChange = clients.u2.mod.currentTrade();

console.log("\n== Änderung nach Zustimmung ==");
console.log(" u2 hatte zugestimmt:", beforeChange?.b?.accepted);
console.log(" u2 nach u1s Änderung:", afterChange?.b?.accepted, afterChange?.b?.accepted === false ? "(richtig)" : "(FALSCH)");

console.log("\n-- Zwischenstand ausführlich --");
console.log(" u2 sieht:", clients.u2.seen.join(" -> "));
console.log(" u2 mine:", JSON.stringify(clients.u2.mod.currentTrade()?.b));
console.log(" u1 mine:", JSON.stringify(clients.u1.mod.currentTrade()?.b));
