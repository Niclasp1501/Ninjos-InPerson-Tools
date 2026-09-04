/**
 * Moving what two people agreed on, and writing down what was meant.
 *
 * This is the dangerous half of the trade. Everything else can go wrong and
 * costs a moment; here a mistake makes somebody's belongings disappear. Three
 * rules follow from that, and they shape the whole file.
 *
 * **Write it down before touching anything.** The logbook entry is made while
 * both inventories are still untouched, so it always says what was *meant*,
 * even when the moving falls over halfway. Afterwards it says what happened.
 * A GM who finds "created at Jenn, deleting at Eloy failed" can fix that by
 * hand in a minute; a bare exception tells them nothing.
 *
 * **Create before deleting.** If it breaks in between, the item exists twice
 * rather than not at all. Duplicates are a nuisance; a vanished item is a
 * lost evening.
 *
 * **Touch nothing that was not on the table.** In particular no merging into
 * stacks the recipient already owned - dnd5e could do it for consumables, but
 * it would mean editing an item that has nothing to do with this trade. The
 * mover only ever creates what was offered and deletes what was given.
 *
 * What dnd5e 5.3.3 needs, read out of its source and checked against the world
 * on 2026-08-31:
 *
 *   - `_id` and `ownership` must be stripped from a copy, or the item arrives
 *     carrying the giver's permissions
 *   - `system.equipped` and `system.attuned` must be cleared; the system does
 *     not do it on an owner change, and the recipient's attunement counter
 *     would be wrong
 *   - a container's contents hang off it by `system.container === <its id>`,
 *     and the copy gets a *new* id, so every child has to be re-pointed
 *   - a container carries coins of its own in `system.currency`
 */

import { MODULE_ID } from "./const.js";

/** Coin denominations, in the order dnd5e lists them. */
export const COINS = ["pp", "gp", "ep", "sp", "cp"];

/* -------------------------------------------- */
/*  Preparing a copy                            */
/* -------------------------------------------- */

/**
 * Turn an item into data that can be created on somebody else.
 *
 * @param {Item} item
 * @param {number} [quantity] Amount to hand over; omit for all of it
 * @returns {object}
 */
function copyOf(item, quantity) {
  const data = item.toObject();

  // Both would otherwise travel with the copy: the id collides with nothing but
  // is meaningless on another actor, and the ownership map would hand the
  // recipient's item to whoever owned the giver.
  delete data._id;
  delete data.ownership;

  if (data.system) {
    if ("equipped" in data.system) data.system.equipped = false;
    if ("attuned" in data.system) data.system.attuned = false;
    if (quantity !== undefined) data.system.quantity = quantity;
  }
  return data;
}

/**
 * Everything that has to be created for one offered item, in order.
 *
 * A plain item is one entry. A container is the shell plus every item inside
 * it, however deep - and the children have to be created *after* the shell,
 * because they need its new id.
 *
 * @param {Item} item
 * @param {number} [quantity]
 * @returns {{shell: object, children: object[]}}
 */
function planFor(item, quantity) {
  const shell = copyOf(item, quantity);

  if (item.type !== "container") return { shell, children: [] };

  // `allContainedItems` walks nested containers as well. Their own
  // `system.container` still points at ids on the giver's side; those are
  // repaired after creation, when the new ids are known.
  // Every descendant, however deep, as a flat list. Each remembers where it
  // used to sit; the ids are repaired after creation, when the new ones exist.
  const children = [...contained(item)].map(child => ({
    data: copyOf(child),
    oldId: child.id,
    oldContainer: child.system.container
  }));

  return { shell, children };
}

/* -------------------------------------------- */
/*  Moving                                      */
/* -------------------------------------------- */

/**
 * Hand a list of items and coins from one actor to another.
 *
 * Returns a report rather than throwing: the caller writes it into the
 * logbook, and a half-finished move has to be *described*, not swallowed.
 *
 * @param {Actor} from
 * @param {Actor} to
 * @param {{itemId: string, quantity: number}[]} items
 * @param {Record<string, number>} coins
 * @returns {Promise<{created: string[], deleted: string[], coins: boolean, error: string|null}>}
 */
export async function moveOffer(from, to, items = [], coins = {}) {
  const report = { created: [], deleted: [], coins: false, error: null };

  try {
    /* --- 1. Create everything on the recipient ------------------------- */

    const createdRoots = [];      // one entry per offered item

    for (const { itemId, quantity } of items) {
      const item = from.items.get(itemId);
      if (!item) throw new Error(`Gegenstand ${itemId} liegt nicht mehr bei ${from.name}`);

      const whole = quantity === undefined || quantity >= (item.system.quantity ?? 1);
      const { shell, children } = planFor(item, whole ? undefined : quantity);

      const [newShell] = await to.createEmbeddedDocuments("Item", [shell]);
      report.created.push(newShell.name);
      createdRoots.push({ item, newShell, whole, quantity });

      if (!children.length) continue;

      const created = await to.createEmbeddedDocuments("Item", children.map(c => c.data));
      created.forEach(c => report.created.push(c.name));

      // Old id -> new id, for the shell and for every descendant. Built
      // completely before anything is repaired, because a nested container's
      // children may point at an id that appears later in the list.
      const newIdOf = new Map([[item.id, newShell.id]]);
      children.forEach((child, i) => newIdOf.set(child.oldId, created[i].id));

      // Anything whose old parent is somehow not in the map falls back to the
      // shell. That keeps the item inside the container the player can see,
      // rather than loose in the pack under a name nobody recognises.
      await to.updateEmbeddedDocuments("Item", children.map((child, i) => ({
        _id: created[i].id,
        "system.container": newIdOf.get(child.oldContainer) ?? newShell.id
      })));
    }

    /* --- 2. Coins ------------------------------------------------------ */

    const wanted = COINS.filter(c => (coins[c] ?? 0) > 0);
    if (wanted.length) {
      const giver = {}, taker = {};
      for (const c of wanted) {
        const have = from.system.currency?.[c] ?? 0;
        if (have < coins[c]) throw new Error(`${from.name} hat nur noch ${have} ${c.toUpperCase()}`);
        giver[`system.currency.${c}`] = have - coins[c];
        taker[`system.currency.${c}`] = (to.system.currency?.[c] ?? 0) + coins[c];
      }
      await to.update(taker);
      await from.update(giver);
      report.coins = true;
    }

    /* --- 3. Only now remove from the giver ----------------------------- */

    const toDelete = [];
    const toReduce = [];
    for (const { item, whole, quantity } of createdRoots) {
      if (whole) {
        const inside = [...contained(item)];
        toDelete.push(item.id, ...inside.map(c => c.id));
        // The contents are named too. If the deleting is what breaks, the
        // logbook has to say that a bag *and four things in it* are still
        // sitting with the giver - "Beutel" alone would send the GM looking
        // for one item instead of five.
        report.deleted.push(item.name, ...inside.map(c => c.name));
      } else {
        toReduce.push({ _id: item.id, "system.quantity": (item.system.quantity ?? 1) - quantity });
        report.deleted.push(`${item.name} (${quantity})`);
      }
    }
    if (toReduce.length) await from.updateEmbeddedDocuments("Item", toReduce);
    if (toDelete.length) await from.deleteEmbeddedDocuments("Item", [...new Set(toDelete)]);
  } catch (error) {
    report.error = error?.message ?? String(error);
    console.error(`${MODULE_ID} | Tausch abgebrochen`, error);
  }

  return report;
}

/** Contents of a container, or nothing for a plain item. */
function contained(item) {
  return item.type === "container" ? (item.system.allContainedItems ?? []) : [];
}
