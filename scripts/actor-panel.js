/**
 * Sheet Only's actor selector, replaced by a side panel.
 *
 * Moved here from FANG in 14.2609.1. It had grown there for want of a better
 * home, but it is not a relationship tool: it swaps out a button of Sheet
 * Only's and lays the actor directory along the edge of the screen. That is
 * table equipment, and this module is where the table equipment lives.
 *
 * What it does. Sheet Only ships `#so-collapse-actor-select`, which slides its
 * own actor list out from the left. This hides that button and puts one in its
 * place that opens Foundry's actor directory as a popout, pinned to the right
 * edge at 300px, with the sheet giving way for it (see inperson.css).
 *
 * **Why the machinery below is so defensive.** Foundry v13 leaves "ghost
 * shells" behind: the popout's frame stays in the DOM with an empty
 * `.window-content` after closing. Two things then break. The CSS in this
 * module narrows the sheet through `:has()`, which a ghost satisfies just as
 * well as a real panel, so the sheet would stay narrow next to nothing. And the
 * open/closed check would keep reporting "open", so the button would refuse to
 * open the panel again. Hence the sweeps, and hence they run several times:
 * once as a microtask, then at 0, 50 and 250 ms, plus five animation frames.
 * Foundry removes the shell at no fixed point.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { mountButtonInSheetOnly, styleAsSheetOnlyButton } from "./sheet-only.js";

const POPOUT_SELECTOR = ".actors-sidebar.sidebar-popout";
const BUTTON_ID = "inperson-so-actors-btn";
const BODY_CLASS = "inperson-actor-panel-open";

let sweepQueued = false;
let popoutRef = null;

/* ── The open/closed state the stylesheet reads ──────────────────── */

function setPanelOpen(isOpen) {
  document.body?.classList?.toggle(BODY_CLASS, !!isOpen);
}

/* ── Ghost shells ────────────────────────────────────────────────── */

function popoutShells() {
  return Array.from(document.querySelectorAll(POPOUT_SELECTOR));
}

function isGhostShell(shell) {
  if (!shell) return false;
  const content = shell.querySelector(".window-content");
  // A ghost reports itself: the header remains, the inner content is gone.
  if (!content) return true;
  if (content.childElementCount === 0) return true;
  if (!shell.querySelector(".directory, .directory-header, .directory-list, .directory-item")) return true;
  return false;
}

function removeShells({ onlyGhost = false } = {}) {
  const shells = popoutShells();
  for (const shell of shells) {
    if (!onlyGhost || isGhostShell(shell)) shell.remove();
  }
  return shells.length;
}

function queueShellSweep(reason = "unknown", { onlyGhost = true, force = false } = {}) {
  if (sweepQueued && !force) return;
  sweepQueued = true;

  const sweep = () => removeShells({ onlyGhost });

  queueMicrotask(() => {
    sweep();
    sweepQueued = false;
  });
  setTimeout(sweep, 0);
  setTimeout(sweep, 50);
  setTimeout(sweep, 250);

  let frames = 0;
  const frameSweep = () => {
    sweep();
    if (++frames < 5) requestAnimationFrame(frameSweep);
  };
  requestAnimationFrame(frameSweep);

  console.debug(`In-Person | actor directory shell sweep (${reason})`);
}

/* ── Finding the directory and its popout ────────────────────────── */

function resolveDirectoryApp() {
  const fromUi = ui?.actors ?? null;
  if (fromUi && typeof fromUi.renderPopout === "function") return fromUi;

  if (!game?.actors?.apps) return null;
  return Object.values(game.actors.apps).find(app => {
    if (typeof app?.renderPopout !== "function") return false;
    if (app?.constructor?.name === "ActorDirectory") return true;
    if (app?.id === "actors" || app?.tabName === "actors") return true;
    return false;
  }) ?? null;
}

function domNodeOf(popout) {
  if (!popout) return null;
  if (popout instanceof HTMLElement) return popout;
  return popout.element?.[0] ?? popout.element ?? null;
}

function isDirectoryApp(app) {
  if (!app) return false;
  if (app?.constructor?.name === "ActorDirectory") return true;
  if (app?.id === "actors" || app?.tabName === "actors") return true;
  return false;
}

export function isDirectoryPopoutApp(app) {
  if (!isDirectoryApp(app)) return false;
  if (app?.isPopout === true) return true;                                  // v14, ApplicationV2
  if (app?.popOut === true || app?.options?.popOut === true) return true;   // v13 and legacy
  return false;
}

function popoutFromUi() {
  const directory = ui?.actors ?? null;
  if (!directory) return null;
  const popout = directory?.popout ?? directory?.popOut ?? null;
  if (!popout) return null;
  return domNodeOf(popout) ? popout : null;
}

function hasLivePopout() {
  if (!popoutRef) return false;
  const element = domNodeOf(popoutRef);
  if (!element || !document.body.contains(element)) {
    popoutRef = null;
    return false;
  }
  return true;
}

function attachCloseListener(popout) {
  const element = domNodeOf(popout);
  if (!element?.addEventListener) return;
  element.addEventListener("close", () => {
    popoutRef = null;
    setPanelOpen(false);
    queueShellSweep("event:close", { onlyGhost: false, force: true });
  }, { once: true });
}

function findPopoutApp() {
  const fromUi = popoutFromUi();
  if (fromUi) return fromUi;

  const windows = Object.values(ui?.windows ?? {});
  const byElement = windows.find(app => domNodeOf(app)?.matches?.(POPOUT_SELECTOR));
  if (byElement) return byElement;
  return windows.find(app => isDirectoryPopoutApp(app)) ?? null;
}

/* ── Opening and closing ─────────────────────────────────────────── */

async function openPanel({ reason = "unknown" } = {}) {
  removeShells({ onlyGhost: true });

  if (hasLivePopout()) {
    try {
      popoutRef.bringToFront?.();
    } catch {
      // no-op
    }
    return;
  }

  const directory = resolveDirectoryApp();
  if (!directory) return;

  try {
    const popout = typeof directory.renderPopout === "function"
      ? await directory.renderPopout()
      : await directory.render(true, { popOut: true, isPopout: true });

    if (popout) {
      popoutRef = popout;
      attachCloseListener(popout);
      setPanelOpen(true);
      console.debug(`In-Person | actor directory popout opened (${reason})`);
      return;
    }
  } catch (err) {
    console.error("In-Person | actor directory open failed", err);
  }

  // Last resort: track whatever is visible.
  const app = findPopoutApp();
  if (app) {
    popoutRef = app;
    attachCloseListener(app);
  } else {
    console.warn("In-Person | actor directory popout did not open", { reason });
  }
}

async function closePanel({ reason = "unknown" } = {}) {
  // Collapse the layout at once; the technical cleanup may take its time.
  setPanelOpen(false);

  if (hasLivePopout() && typeof popoutRef?.close === "function") {
    try {
      await popoutRef.close();
    } catch {
      try {
        await popoutRef.close({ force: true });
      } catch {
        // ignore
      }
    }
  }
  popoutRef = null;

  const app = findPopoutApp();
  if (app?.close) {
    try {
      await app.close();
    } catch {
      try {
        await app.close({ force: true });
      } catch {
        // ignore
      }
    }
  }

  // Hard-remove leftovers so the stylesheet's :has() cannot stick on a ghost.
  queueShellSweep(reason, { onlyGhost: false, force: true });
  console.debug(`In-Person | actor directory popout cleanup (${reason})`);
}

function isPanelOpen() {
  if (hasLivePopout()) return true;
  return !!document.querySelector(POPOUT_SELECTOR);
}

/** Lay a freshly rendered popout along the right edge. */
export function applySidebarStyle(app) {
  const element = domNodeOf(app);
  if (!element) return;
  Object.assign(element.style, {
    position: "fixed",
    right: "0px",
    top: "0px",
    left: "auto",
    width: "300px",
    height: "100vh",
    maxHeight: "100vh",
    margin: "0",
    borderRadius: "0",
    zIndex: "9999",
    background: "rgba(11, 10, 19, 0.95)",
    border: "1px solid rgb(48, 40, 49)",
    boxShadow: "-4px 0 16px rgba(0,0,0,0.6)"
  });
}

/** Adopt a popout that Foundry opened on its own. */
export function markPopout(popout) {
  if (!popout) return;
  popoutRef = popout;
  setPanelOpen(true);
  attachCloseListener(popout);
}

/* ── Wiring ──────────────────────────────────────────────────────── */

function buildButton() {
  const button = document.createElement("button");
  button.title = game.i18n.localize("INPERSON.ActorPanel.Button");
  styleAsSheetOnlyButton(button);
  button.innerHTML = '<i class="fa-solid fa-user"></i>';
  button.addEventListener("click", async event => {
    event.preventDefault();
    // Clear empty shells first, so the state cannot desync.
    removeShells({ onlyGhost: true });
    if (isPanelOpen()) await closePanel({ reason: "toggle:close" });
    else await openPanel({ reason: "toggle:open" });
  });
  return button;
}

/** Show or hide Sheet Only's own actor button, according to our setting. */
function setOwnButtonHidden(hidden) {
  const own = document.getElementById("so-collapse-actor-select");
  if (own) own.style.display = hidden ? "none" : "";
}

export function installActorPanel() {
  if (!game.settings.get(MODULE_ID, SETTINGS.ACTOR_PANEL)) return;

  mountButtonInSheetOnly(BUTTON_ID, () => {
    setOwnButtonHidden(true);
    return buildButton();
  }, { first: true });

  // Ghost shells outlive the app that made them, so the sweep hangs off the
  // close hooks rather than off our own button alone.
  Hooks.on("closeActorDirectory", () => queueShellSweep("hook:closeActorDirectory", { onlyGhost: true, force: true }));
  Hooks.on("closeApplicationV2", app => {
    if (isDirectoryApp(app)) queueShellSweep("hook:closeApplicationV2", { onlyGhost: true, force: true });
  });
}

/** Undo the takeover without a reload, for when the setting is switched off. */
export function removeActorPanel() {
  document.getElementById(BUTTON_ID)?.remove();
  setOwnButtonHidden(false);
  setPanelOpen(false);
}
