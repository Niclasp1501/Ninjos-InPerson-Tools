/**
 * Everything this module knows about Sheet Only's DOM, in one file.
 *
 * Sheet Only does not hide parts of the interface, it hides all of it:
 *
 *   $("#interface").addClass("sheet-only-hide");     // index.js:902
 *   $("#pause").addClass("sheet-only-hide");
 *   $("#tooltip").addClass("sheet-only-hide");
 *   $("#notifications").addClass("sheet-only-hide");
 *
 * and then builds its own `.sheet-only-container` holding the sheet and a
 * draggable button bar. So anything of ours that has to reach a player in that
 * mode must live *inside that container*. Nothing under `#interface` is visible
 * any more - which is why a calendar module's HUD simply vanishes for those
 * players, however it is configured. There is no setting against that.
 *
 * Why one file rather than the mounting code sitting next to each feature: the
 * container appears late, is rebuilt when the player switches actor, and Sheet
 * Only is registered for Foundry 13.351 while we run 14. When its markup moves,
 * one selector here is wrong instead of one per feature.
 *
 * Registration is therefore declarative. Hand in a builder, and it is re-run
 * whenever the container comes back; callers never watch the DOM themselves.
 */

/** Sheet Only's own container, or null when this client is not in that mode. */
export function sheetOnlyContainer() {
  return document.querySelector(".sheet-only-container");
}

/** Is this client showing the sheet-only view right now? */
export function inSheetOnly() {
  return !!sheetOnlyContainer();
}

/**
 * Registered mounts, kept so a rebuilt container can be filled again.
 * @type {Map<string, () => HTMLElement|null>}
 */
const mounts = new Map();

let observer = null;

/** Put one registered element into the container, replacing an older copy. */
function place(id, build) {
  const container = sheetOnlyContainer();
  if (!container) return;
  if (container.querySelector(`:scope > [data-inperson-mount="${id}"]`)) return;

  const element = build();
  if (!element) return;
  element.dataset.inpersonMount = id;
  container.appendChild(element);
}

/** Fill the container with everything registered so far. */
function placeAll() {
  for (const [id, build] of mounts) place(id, build);
}

/**
 * Mount an element into the sheet-only view and keep it mounted.
 *
 * `build` may return null when the feature has nothing to show; it is called
 * again on the next rebuild, so a temporary "not yet" is not permanent.
 *
 * @param {string} id                       stable identifier, one per feature
 * @param {() => HTMLElement|null} build    creates the element
 */
export function mountInSheetOnly(id, build) {
  mounts.set(id, build);
  place(id, build);

  // One observer for all mounts. Sheet Only replaces the container wholesale
  // when the player picks another actor, so watching the container itself is
  // not enough - the node we would be watching is the one that goes away.
  if (observer) return;
  observer = new MutationObserver(() => placeAll());
  observer.observe(document.body, { childList: true, subtree: true });
}

/** Drop a mount again, both from the DOM and from the registry. */
export function unmountFromSheetOnly(id) {
  mounts.delete(id);
  document.querySelector(`[data-inperson-mount="${id}"]`)?.remove();
}

/* ── The button bar ──────────────────────────────────────────────── */

/**
 * Put a button into Sheet Only's own bar, next to its journal and chat buttons.
 *
 * Separate from `mountInSheetOnly` because the bar is not the container: it is
 * `#so-main-buttons`, loaded asynchronously by Sheet Only itself
 * (`buttonContainer.load(...)`, index.js:678), so it appears a moment after the
 * container does. Both are covered by the same observer.
 *
 * @param {string} id                     element id the button will carry
 * @param {() => HTMLElement|null} build  creates the button
 * @param {{first?: boolean}} [options]   place it before Sheet Only's own buttons
 */
export function mountButtonInSheetOnly(id, build, { first = false } = {}) {
  mounts.set(id, () => null);   // registered so placeAll() keeps trying

  const put = () => {
    const bar = document.getElementById("so-main-buttons");
    if (!bar || document.getElementById(id)) return;
    const button = build();
    if (!button) return;
    button.id = id;
    if (first) bar.insertBefore(button, bar.firstChild);
    else bar.appendChild(button);
  };

  mounts.set(id, () => { put(); return null; });
  put();

  if (observer) return;
  observer = new MutationObserver(() => placeAll());
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Give a button the look of Sheet Only's own.
 *
 * It styles `.button` inside its bar, so wearing that class is enough - and
 * inline styles are cleared in case the element carried some from elsewhere.
 */
export function styleAsSheetOnlyButton(button) {
  button.className = "button";
  for (const property of ["background", "border", "color", "padding", "borderRadius"]) {
    button.style[property] = "";
  }
  button.style.cursor = "pointer";
}
