/**
 * Saying something to a player who has no interface.
 *
 * Sheet Only does not hide parts of the interface, it hides all of it -
 * `$("#notifications").addClass("sheet-only-hide")` (its index.js:902) among
 * the rest. So `ui.notifications.warn(...)` on such a client is a message to
 * nobody: it is created, it is logged, and it is never seen. Every warning this
 * module raised for a player in that mode went that way.
 *
 * Outside Sheet Only, Foundry's own notifications are the right thing and are
 * used. Inside it, this puts the same sentence into Sheet Only's own container,
 * which is the only part of the page that is still visible.
 */

import { MODULE_ID } from "./const.js";
import { sheetOnlyContainer } from "./sheet-only.js";

/** How long a message stays. Long enough to read twice. */
const SECONDS = 6;

/**
 * Tell the player something.
 * @param {string} message                     already localised
 * @param {"info"|"warn"|"error"} [kind]
 */
export function notify(message, kind = "info") {
  const container = sheetOnlyContainer();
  if (!container) {
    ui.notifications?.[kind === "warn" ? "warn" : kind](message);
    return;
  }

  const note = document.createElement("div");
  note.className = `inperson-note ${kind}`;
  note.dataset.inpersonMount = `${MODULE_ID}-note`;
  note.innerHTML = `<i class="fa-solid ${icon(kind)}"></i><span></span>`;
  note.querySelector("span").textContent = message;

  // Tapping it away is faster than waiting, and on a tablet somebody will try.
  note.addEventListener("click", () => note.remove());
  container.appendChild(note);
  setTimeout(() => note.remove(), SECONDS * 1000);
}

function icon(kind) {
  if (kind === "error") return "fa-circle-exclamation";
  if (kind === "warn") return "fa-triangle-exclamation";
  return "fa-circle-info";
}
