/**
 * GM control panel: who is blacked out, and what does the current scene cost.
 */

import { MODULE_ID, SETTINGS, SOCKET } from "./const.js";
import { isSceneBackground } from "./blocker.js";
import { openPullDialog } from "./pull.js";
import {
  isPinned, setPinned, getSceneDisplay, getBattlemapDisplay, getPinnedScene
} from "./monitor.js";
import { resolveFor, getForcedState, setForcedState, isMonitorUser } from "./state.js";
import { measureScene, collectSceneSources, sumKnown, formatBytes } from "./measure.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Latest numbers players reported about themselves, keyed by userId. */
export const playerReports = new Map();

export class InPersonPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-panel",
    tag: "div",
    window: {
      title: "INPERSON.Panel.Title",
      icon: "fa-solid fa-eye-slash",
      resizable: true
    },
    position: { width: 520, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel"],
    actions: {
      toggleMaster: InPersonPanel.#onToggleMaster,
      setUser: InPersonPanel.#onSetUser,
      measure: InPersonPanel.#onMeasure,
      refreshAll: InPersonPanel.#onRefreshAll,
      togglePin: InPersonPanel.#onTogglePin,
      pullPlayers: InPersonPanel.#onPullPlayers
    }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/panel.hbs`,
      // Foundry restores these scroll offsets across re-renders (see
      // HandlebarsApplicationMixin#_preSyncPartState). Without the declaration
      // every button click threw the user back to the top of the player list.
      // "" is the part element itself, the second entry the scrolling list.
      scrollable: ["", ".inperson-users"]
    }
  };

  /** @override */
  async _prepareContext() {
    const enabled = game.settings.get(MODULE_ID, SETTINGS.ENABLED);
    const scene = canvas?.scene ?? game.scenes?.current ?? null;

    const users = game.users
      .filter(u => u.active || !u.isGM)
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
      .map(user => {
        const state = resolveFor(user);
        const report = playerReports.get(user.id);
        const forced = getForcedState(user.id);
        return {
          id: user.id,
          name: user.name,
          color: user.color?.css ?? user.color ?? "#888888",
          active: user.active,
          isGM: user.isGM,
          blackedOut: state.active,
          reason: game.i18n.localize(`INPERSON.Reason.${state.reason}`),
          isMonitor: isMonitorUser(user),
          isAuto: forced === null,
          isOn: forced === true,
          isOff: forced === false,
          savedLabel: report ? formatBytes(report.bytes) : null,
          blockedCount: report?.textures ?? null
        };
      });

    const sources = scene ? [...collectSceneSources(scene)] : [];
    const { bytes, unknown } = sumKnown(sources);

    // Split the scene into what Table Mode stops and what it lets through.
    // Showing only the total was ambiguous: next to "Table Mode is running" a
    // lone "83 MB" reads as "it is still downloading that much".
    const wideScope = game.settings.get(MODULE_ID, SETTINGS.SCOPE) !== "background";
    const blockedSources = wideScope ? sources : sources.filter(s => isSceneBackground(s));
    const blockedBytes = sumKnown(blockedSources).bytes;

    // Displays get their own block: their state changes independently of the
    // download blocking and needs to be visible at a glance.
    const bm = getBattlemapDisplay();
    const sc = getSceneDisplay();
    const pinnedScene = getPinnedScene();

    return {
      enabled,
      users,
      bmName: bm?.name ?? null,
      bmActive: !!bm?.active,
      scName: sc?.name ?? null,
      scActive: !!sc?.active,
      hasMonitors: !!(bm || sc),
      pinned: isPinned(),
      pinnedSceneName: pinnedScene?.name ?? null,
      pinLabel: isPinned()
        ? (pinnedScene
            ? game.i18n.format("INPERSON.Panel.RolePinned", { scene: pinnedScene.name })
            : game.i18n.localize("INPERSON.Panel.RolePinnedNoScene"))
        : game.i18n.localize("INPERSON.Panel.RoleFollow"),
      sceneName: scene?.name ?? game.i18n.localize("INPERSON.Panel.NoScene"),
      sceneFileCount: game.i18n.format(
        sources.length === 1 ? "INPERSON.Panel.FileOne" : "INPERSON.Panel.FileMany",
        { count: sources.length }
      ),
      sceneCost: formatBytes(bytes),
      sceneBlocked: formatBytes(blockedBytes),
      scenePassing: formatBytes(Math.max(0, bytes - blockedBytes)),

      // Two different statements, not one with a switched label:
      //   running -> what is blocked and what still arrives
      //   off     -> what switching on would save
      // The earlier version showed "still loaded: 0 B" even while switched off,
      // which was plainly wrong - with table mode off, everything is loaded.
      showSplit: enabled && bytes > 0,
      showSaving: !enabled && blockedBytes > 0,
      sceneSaving: formatBytes(blockedBytes),
      sceneUnmeasured: unknown,
      affectedCount: users.filter(u => u.blackedOut).length
    };
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static async #onToggleMaster() {
    const next = !game.settings.get(MODULE_ID, SETTINGS.ENABLED);
    await game.settings.set(MODULE_ID, SETTINGS.ENABLED, next);
    this.render();
  }

  static async #onSetUser(event, target) {
    const { userId, value } = target.dataset;
    const parsed = value === "auto" ? null : value === "on";
    await setForcedState(userId, parsed);
    this.render();
  }

  static async #onMeasure() {
    const scene = canvas?.scene ?? game.scenes?.current;
    if (!scene) return ui.notifications.warn("INPERSON.Notify.NoScene", { localize: true });

    const button = this.element?.querySelector('[data-action="measure"]');
    if (button) button.disabled = true;
    try {
      const { total, measured, missing } = await measureScene(scene);
      ui.notifications.info(game.i18n.format("INPERSON.Notify.Measured", {
        size: formatBytes(total),
        measured,
        missing
      }));
    } catch (err) {
      console.error(`${MODULE_ID} | Measuring failed`, err);
      ui.notifications.error("INPERSON.Notify.MeasureFailed", { localize: true });
    } finally {
      if (button) button.disabled = false;
      this.render();
    }
  }

  /** Pin or release the scene display. */
  static async #onTogglePin() {
    await setPinned();
    this.render();
  }

  /** Open the picker for bringing players to the viewed scene. */
  static #onPullPlayers() {
    openPullDialog();
  }

  static #onRefreshAll() {
    game.socket.emit(SOCKET.NAME, { type: SOCKET.REFRESH });
    ui.notifications.info("INPERSON.Notify.RefreshSent", { localize: true });
  }
}

/** Singleton accessor. */
let _panel = null;

export function openPanel() {
  _panel ??= new InPersonPanel();
  return _panel.render({ force: true });
}

/** Re-render the panel if it happens to be open. */
export function refreshPanel() {
  if (_panel?.rendered) _panel.render();
}
