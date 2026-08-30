/**
 * Bring players to a scene.
 *
 * Foundry has the mechanism built in - `Scene#pullUsers(users, viewOptions)`
 * (documents/scene.mjs:222) sends `pullToScene` over the socket to exactly the
 * accounts passed in. What core lacks is a way to choose *which* accounts: the
 * scene context menu only offers "pull everyone", which drags the display
 * clients along and yanks a player out of a character sheet they were reading.
 *
 * So this is a picker, not a mechanism. Everyone connected is ticked to begin
 * with - the usual case is "all of you, look at this" - with one exception: the
 * scene display, whose entire job is to stay where it is. Ticking it anyway is
 * allowed and counts as a deliberate choice, which is what lets it override the
 * pin.
 *
 * Nothing is remembered between calls; each one is its own decision.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { isMonitorUser, isSceneDisplay } from "./state.js";
import { DELIBERATE } from "./monitor.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PullPlayersDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-pull",
    tag: "div",
    window: {
      title: "INPERSON.Pull.Title",
      icon: "fa-solid fa-people-arrows",
      resizable: true
    },
    position: { width: 420, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-pull"],
    actions: {
      pull: PullPlayersDialog.#onPull,
      all: PullPlayersDialog.#onAll,
      none: PullPlayersDialog.#onNone
    }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/pull.hbs`,
      scrollable: ["", ".inperson-pull-list"]
    }
  };

  /** The scene players are pulled to. Defaults to the viewed one. */
  #scene = null;

  constructor(scene, options = {}) {
    super(options);
    this.#scene = scene ?? canvas?.scene ?? game.scenes?.active ?? null;
  }

  /** @override */
  async _prepareContext() {
    const scene = this.#scene;
    const users = game.users
      .filter(u => u.active && u.id !== game.user.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(user => {
        const here = user.viewedScene === scene?.id;
        const monitor = isMonitorUser(user);
        return {
          id: user.id,
          name: user.name,
          color: user.color?.css ?? user.color ?? "#888888",
          isGM: user.isGM,
          isMonitor: monitor,
          here,
          // Everyone is ticked, bar the scene display. Being on the scene
          // already is no reason to leave someone out: a player who wandered
          // off and came back still has the window scrolled somewhere else, and
          // the point of the button is that afterwards everybody is looking at
          // the same thing.
          //
          // The scene display is the one exception, because staying put is its
          // whole job. It can still be ticked by hand - doing so counts as a
          // deliberate choice and overrides the pin.
          checked: !isSceneDisplay(user),
          note: here
            ? game.i18n.localize("INPERSON.Pull.AlreadyHere")
            : (user.viewedScene
                ? game.i18n.format("INPERSON.Pull.CurrentlyOn", {
                    scene: game.scenes.get(user.viewedScene)?.name ?? "?"
                  })
                : game.i18n.localize("INPERSON.Pull.Nowhere"))
        };
      });

    return {
      sceneName: scene?.name ?? game.i18n.localize("INPERSON.Panel.NoScene"),
      users,
      hasUsers: users.length > 0
    };
  }

  /* -------------------------------------------- */

  /** Which boxes are ticked right now? @returns {User[]} */
  #selected() {
    const boxes = this.element?.querySelectorAll(".inperson-pull-list input:checked") ?? [];
    return Array.from(boxes)
      .map(box => game.users.get(box.dataset.userId))
      .filter(Boolean);
  }

  static async #onPull() {
    const users = this.#selected();
    if (!users.length) {
      return ui.notifications.warn("INPERSON.Pull.NobodySelected", { localize: true });
    }
    // Marked deliberate: whoever is ticked here was ticked by hand, a pinned
    // display included. The pin guards against blanket pulls, not against an
    // explicit choice.
    this.#scene.pullUsers(users, { [DELIBERATE]: true });
    ui.notifications.info(game.i18n.format("INPERSON.Pull.Done", {
      count: users.length,
      scene: this.#scene.name
    }));
    this.close();
  }

  static #onAll() {
    for (const box of this.element.querySelectorAll(".inperson-pull-list input")) box.checked = true;
  }

  static #onNone() {
    for (const box of this.element.querySelectorAll(".inperson-pull-list input")) box.checked = false;
  }
}

/**
 * Open the picker for a scene. GM only.
 * @param {Scene} [scene] Defaults to the viewed scene
 */
export function openPullDialog(scene) {
  if (!game.user.isGM) return;
  const target = scene ?? canvas?.scene ?? game.scenes?.active;
  if (!target) return ui.notifications.warn("INPERSON.Notify.NoScene", { localize: true });
  return new PullPlayersDialog(target).render({ force: true });
}
