/**
 * The trade logbook.
 *
 * Item Piles writes a chat card *after* a trade. That is fine while nothing
 * goes wrong and useless when something does: if the moving stops halfway,
 * nowhere says what was supposed to happen.
 *
 * So this writes twice. Once before anything is touched - both offers in full,
 * state "offen" - and once afterwards with what actually happened. Between
 * those two writes lies the only stretch where belongings can go missing, and
 * for exactly that stretch there is now a note.
 *
 * It lives in a journal rather than in a setting: a journal can be read,
 * searched, printed and travels with the world backup. A GM looking for
 * "where did the sword go" will find it; a JSON blob in the settings database
 * they never will.
 */

import { MODULE_ID } from "./const.js";
import { COINS } from "./trade-mover.js";
import { notify } from "./notify.js";

const JOURNAL_NAME = "Tauschbuch";

/* -------------------------------------------- */
/*  The journal                                 */
/* -------------------------------------------- */

/**
 * The logbook, created on first use. GM only.
 *
 * Ownership is left at the default, which means players cannot see it. That is
 * deliberate: the book records what people handed each other, and reading it
 * is the GM's job.
 * @returns {Promise<JournalEntry|null>}
 */
async function book() {
  if (!game.user.isGM) return null;
  const existing = game.journal.getName(JOURNAL_NAME);
  if (existing) return existing;

  return JournalEntry.create({
    name: JOURNAL_NAME,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE }
  });
}

/* -------------------------------------------- */
/*  Rendering an offer                          */
/* -------------------------------------------- */

const escape = s => foundry.utils.escapeHTML?.(String(s ?? "")) ?? String(s ?? "");

/**
 * One side of the trade as a list.
 *
 * Names and amounts are written out rather than referenced by id. An id is
 * worthless once the item is gone - and gone is precisely the case this book
 * exists for.
 * @param {object} side
 * @returns {string}
 */
function renderOffer(side) {
  const rows = [];

  for (const entry of side.items ?? []) {
    const menge = entry.quantity > 1 ? ` &times;${entry.quantity}` : "";
    const inhalt = entry.contents?.length
      ? `<ul>${entry.contents.map(c => `<li>${escape(c)}</li>`).join("")}</ul>`
      : "";
    rows.push(`<li>${escape(entry.name)}${menge}${inhalt}</li>`);
  }

  const coins = COINS
    .filter(c => (side.coins?.[c] ?? 0) > 0)
    .map(c => `${side.coins[c]} ${c.toUpperCase()}`);
  if (coins.length) rows.push(`<li>${coins.join(", ")}</li>`);

  if (!rows.length) return "<p><em>nichts</em></p>";
  return `<ul>${rows.join("")}</ul>`;
}

/* -------------------------------------------- */
/*  Writing                                     */
/* -------------------------------------------- */

/**
 * Write down what is about to happen. Call this *before* moving anything.
 *
 * @param {object} trade
 * @param {{actor: Actor, offer: object}} trade.a
 * @param {{actor: Actor, offer: object}} trade.b
 * @returns {Promise<JournalEntryPage|null>} the page, to be finished later
 */
export async function noteIntent({ a, b }) {
  const journal = await book();
  if (!journal) return null;

  const when = new Date().toLocaleString("de-DE");
  const intent = {
    when,
    a: { name: a.actor.name, offer: a.offer },
    b: { name: b.actor.name, offer: b.offer }
  };

  const [page] = await journal.createEmbeddedDocuments("JournalEntryPage", [{
    name: `${when} — ${a.actor.name} ↔ ${b.actor.name}`,
    type: "text",
    text: { content: render(intent, null), format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML },
    // The same thing again as data. The page is rewritten from this when the
    // moving finishes; picking the old text apart with string replacements is
    // how the state line came to say "offen" on a trade that had failed -
    // Foundry stores `—`, the search looked for `&mdash;`, and nothing matched.
    [`flags.${MODULE_ID}.trade`]: intent
  }]);
  return page ?? null;
}

/**
 * Finish the entry once the moving is over, successfully or not.
 *
 * The reports go in verbatim. A GM reading "created at Jenn: Heiltrank;
 * deleting at Eloy failed: …" knows what to put right; "trade failed" tells
 * them to go looking.
 *
 * @param {JournalEntryPage|null} page
 * @param {object[]} reports Result of each `moveOffer` call
 */
export async function noteResult(page, reports = []) {
  if (!page) return;

  const intent = page.getFlag(MODULE_ID, "trade");
  if (!intent) return;

  await page.update({ "text.content": render(intent, reports) });

  if (reports.some(r => r?.error)) {
    notify(game.i18n.localize("INPERSON.Trade.Broken"), "error");
  }
}

/**
 * The whole page, built from data.
 *
 * Called twice with the same intent: once with `reports === null` before
 * anything moves, once with them afterwards. Rebuilding rather than editing
 * means the two versions can never drift apart.
 * @param {object} intent
 * @param {object[]|null} reports
 * @returns {string}
 */
function render(intent, reports) {
  const broken = reports?.some(r => r?.error);
  const state = reports === null
    ? "offen &mdash; noch nichts bewegt"
    : broken
      ? `<span style="color:#8B0000">abgebrochen</span>`
      : "erledigt";

  let out = `
    <p><strong>Stand:</strong> ${state}</p>
    <p><strong>Wann:</strong> ${escape(intent.when)}</p>
    <h3>${escape(intent.a.name)} gibt</h3>
    ${renderOffer(intent.a.offer)}
    <h3>${escape(intent.b.name)} gibt</h3>
    ${renderOffer(intent.b.offer)}`;

  if (reports === null) return out;

  const namen = [intent.a.name, intent.b.name];
  const detail = reports.map((r, i) => {
    const teile = [];
    if (r.created?.length) teile.push(`angelegt: ${r.created.map(escape).join(", ")}`);
    if (r.coins) teile.push("Münzen übertragen");
    if (r.deleted?.length) teile.push(`entfernt: ${r.deleted.map(escape).join(", ")}`);
    if (r.error) teile.push(`<strong>Fehler: ${escape(r.error)}</strong>`);
    return `<li>Von ${escape(namen[i] ?? `Seite ${i + 1}`)}: ${teile.join("; ") || "nichts"}</li>`;
  }).join("");

  return out + `<hr><h3>Ausgeführt</h3><ul>${detail}</ul>`;
}

/** Open the logbook. GM only. */
export async function openLog() {
  const journal = await book();
  return journal?.sheet.render(true);
}
