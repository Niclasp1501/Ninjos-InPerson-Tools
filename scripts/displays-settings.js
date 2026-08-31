/**
 * A page of its own for everything about the scene displays.
 *
 * These settings had been sitting in the module's main list next to the map
 * blocking, and they do not belong there: blocking downloads and steering two
 * televisions are separate jobs that happen to live in one module. Mixed
 * together the list read as a heap of unrelated switches.
 *
 * Built by hand rather than left to Foundry's own rendering for two reasons.
 * The settings want grouping and running commentary - which display is which,
 * what happens on release, how the two burn-in modes differ - which a flat list
 * cannot carry. And they want to appear in order: the burn-in questions only
 * make sense once someone has said they want a screensaver at all, and the
 * folder of scenes only once they have chosen the mode that uses it.
 *
 * Nothing is written until Save, so a half-finished thought can be abandoned by
 * closing the window.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { listCompanionPairs, setCompanionScene } from "./monitor.js";
import { buildSceneField } from "./scene-field.js";
import { previewCover } from "./screensaver.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** The settings this page owns, in the order they appear. */
const FIELDS = [
  SETTINGS.MONITOR_BM,
  SETTINGS.MONITOR_SC,
  SETTINGS.MONITOR_RELEASE,
  SETTINGS.MONITOR_IDLE_SCENE,
  SETTINGS.DEFAULT_COMPANION,
  SETTINGS.IDLE_ENABLED,
  SETTINGS.IDLE_AFTER,
  SETTINGS.IDLE_MODE,
  SETTINGS.IDLE_FOLDER,
  SETTINGS.IDLE_ROTATE_EVERY,
  SETTINGS.IDLE_BLANK_FOR,
  SETTINGS.IDLE_LOGO
];

export class DisplaySettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-displays",
    tag: "form",
    window: {
      title: "INPERSON.Displays.Title",
      icon: "fa-solid fa-display",
      resizable: true
    },
    position: { width: 620, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-displays"],
    form: {
      handler: DisplaySettings.#onSubmit,
      closeOnSubmit: true
    },
    actions: {
      pickLogo: DisplaySettings.#onPickLogo,
      clearLogo: DisplaySettings.#onClearLogo,
      unpair: DisplaySettings.#onUnpair,
      testCover: DisplaySettings.#onTestCover,
      addPair: DisplaySettings.#onAddPair
    }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/displays.hbs`,
      // The inner box is the scroller, not the part root - the root also holds
      // the footer, which deliberately does not scroll.
      scrollable: [".inperson-scroll"]
    }
  };

  /** Accounts to choose from, plus the "not set" entry. */
  #accounts() {
    const list = [{ id: "", name: game.i18n.localize("INPERSON.Settings.NoAccount") }];
    for (const user of game.users) list.push({ id: user.id, name: user.name });
    return list;
  }

  /** Every scene, for the two scene pickers. */
  #scenes(noneLabel) {
    const list = [{ id: "", name: game.i18n.localize(noneLabel) }];
    for (const scene of game.scenes.contents.sort((a, b) => a.name.localeCompare(b.name))) {
      list.push({ id: scene.id, name: scene.name });
    }
    return list;
  }

  /** Scene folders, with a count so an empty one is visible before it is chosen. */
  #folders() {
    const list = [{ id: "", name: game.i18n.localize("INPERSON.Settings.IdleFolder.None") }];
    for (const folder of game.folders.filter(f => f.type === "Scene")) {
      const count = game.scenes.filter(s => s.folder?.id === folder.id).length;
      list.push({
        id: folder.id,
        name: `${folder.name} (${count})`
      });
    }
    return list;
  }

  /** @override */
  async _prepareContext() {
    const get = key => game.settings.get(MODULE_ID, key);
    const mark = (list, current) =>
      list.map(o => ({ ...o, selected: o.id === current }));

    const idleAfter = get(SETTINGS.IDLE_AFTER);
    const logo = get(SETTINGS.IDLE_LOGO);
    return {
      accountsBM: mark(this.#accounts(), get(SETTINGS.MONITOR_BM)),
      accountsSC: mark(this.#accounts(), get(SETTINGS.MONITOR_SC)),
      releaseFollow: get(SETTINGS.MONITOR_RELEASE) === "follow",
      idleScenes: mark(this.#scenes("INPERSON.Panel.IdleSceneNone"), get(SETTINGS.MONITOR_IDLE_SCENE)),
      companions: mark(this.#scenes("INPERSON.Panel.DefaultCompanionNone"), get(SETTINGS.DEFAULT_COMPANION)),
      folders: mark(this.#folders(), get(SETTINGS.IDLE_FOLDER)),
      idleAfter,
      idleEnabled: !!get(SETTINGS.IDLE_ENABLED),
      modeIsCover: get(SETTINGS.IDLE_MODE) !== "scene",
      rotateEvery: get(SETTINGS.IDLE_ROTATE_EVERY),
      blankFor: get(SETTINGS.IDLE_BLANK_FOR),
      logo,
      hasLogo: !!logo
    };
  }

  /**
   * Bring the preview and the clear button in line with the path in the field.
   *
   * Done by hand rather than by re-rendering, and that is the whole point: a
   * render rebuilds the form from the *stored* settings, so every unsaved answer
   * above would be thrown away. Picking an image used to clear the "use a
   * screensaver" tick for exactly that reason, and then save wrote the cleared
   * value back. Nothing here re-renders while the form is being filled in.
   */
  #syncLogo() {
    const el = this.element;
    const path = el.querySelector('input[name="idleLogo"]')?.value?.trim() ?? "";
    const preview = el.querySelector(".inperson-logo-preview");
    const image = preview?.querySelector("img");

    el.querySelector(".inperson-logo-clear")?.toggleAttribute("hidden", !path);
    preview?.toggleAttribute("hidden", !path);
    if (image) image.src = path;
  }

  /**
   * The file picker for the drifting image.
   *
   * Opened by hand instead of through a `filePicker` setting, because that only
   * works for settings Foundry itself renders - and this page renders its own.
   */
  static async #onPickLogo() {
    const field = this.element.querySelector('input[name="idleLogo"]');
    const picker = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: field?.value ?? "",
      callback: path => {
        if (field) field.value = path;
        this.#syncLogo();
      }
    });
    return picker.render(true);
  }

  static #onClearLogo() {
    const field = this.element.querySelector('input[name="idleLogo"]');
    if (field) field.value = "";
    this.#syncLogo();
  }

  /**
   * Draw the list of pairings.
   *
   * Built here rather than in the template because it changes while the window
   * stays open, and re-rendering would throw away everything else that has been
   * filled in but not saved. Same reason as the logo preview above.
   */
  #paintPairs() {
    const list = this.element.querySelector(".inperson-pair-list");
    if (!list) return;
    list.replaceChildren();

    const pairs = listCompanionPairs();
    if (!pairs.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = game.i18n.localize("INPERSON.Displays.PairsNone");
      list.appendChild(empty);
      return;
    }

    for (const { scene, companion } of pairs) {
      const row = document.createElement("div");
      row.className = "inperson-pair-row";

      const from = document.createElement("span");
      from.className = "inperson-pair-from";
      from.textContent = scene.name;

      const arrow = document.createElement("i");
      arrow.className = "fa-solid fa-arrow-right";

      const to = document.createElement("span");
      to.className = "inperson-pair-to";
      to.textContent = companion.name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "inperson-pair-remove";
      remove.dataset.action = "unpair";
      remove.dataset.sceneId = scene.id;
      remove.dataset.tooltip = game.i18n.localize("INPERSON.Panel.UnpairTip");
      remove.innerHTML = '<i class="fa-solid fa-xmark"></i>';

      row.append(from, arrow, to, remove);
      list.appendChild(row);
    }
  }

  /**
   * Make a new pairing from the two fields at the bottom of the list.
   *
   * Written through at once, like removing one: a pairing is a flag on the
   * battlemap, not a value of this form, so holding it until Save would mean a
   * Cancel that undoes some things and not others.
   */
  static async #onAddPair() {
    const el = this.element;
    const fromId = el.querySelector('.inperson-pair-add-from input[type=hidden]')?.value;
    const toId = el.querySelector('.inperson-pair-add-to input[type=hidden]')?.value;

    if (!fromId || !toId) {
      return ui.notifications.warn("INPERSON.Displays.PairNeedsBoth", { localize: true });
    }
    if (fromId === toId) {
      return ui.notifications.warn("INPERSON.SceneField.NotItself", { localize: true });
    }

    const battlemap = game.scenes.get(fromId);
    if (!battlemap) return;
    await setCompanionScene(battlemap, toId);

    // Clear the two fields so the next pairing starts empty, then redraw the
    // list above them.
    for (const sel of ['.inperson-pair-add-from', '.inperson-pair-add-to']) {
      el.querySelector(`${sel} .inperson-scenefield`)?.setScene?.("");
    }
    this.#paintPairs();
    ui.notifications.info(game.i18n.format("INPERSON.Displays.PairMade", {
      scene: battlemap.name,
      companion: game.scenes.get(toId)?.name ?? "?"
    }));
  }

  /**
   * Remove a battlemap-to-scene pairing.
   *
   * Written through at once rather than held until Save, because a pairing does
   * not live in this form - it is a flag on the scene, and the list here is a
   * view of it. Waiting would mean a Cancel that undoes some things and not
   * others.
   */
  static async #onUnpair(event, target) {
    const scene = game.scenes.get(target.dataset.sceneId);
    if (scene) await setCompanionScene(scene, null);

    this.#paintPairs();
  }

  /** Show the cover for a few seconds so it can be judged. */
  static #onTestCover() {
    // The path as it stands in the form, not as it stands in the settings - the
    // whole point is to look at a choice before committing to it.
    previewCover(8, this.element.querySelector('input[name="idleLogo"]')?.value?.trim() || "");
  }

  /**
   * Show only what the answers above have made relevant.
   *
   * Everything below "do you want a screensaver" is hidden until that is
   * answered yes, and the two modes show only their own fields - a page that
   * asks about a folder of scenes while the black cover is chosen is asking
   * about something that will not happen.
   *
   * Hidden fields stay in the form and still submit, so switching modes back
   * and forth loses nothing that was typed.
   * @override
   */
  _onRender(context, options) {
    super._onRender?.(context, options);
    const el = this.element;

    const show = (selector, on) => el.querySelector(selector)?.toggleAttribute("hidden", !on);
    const sync = () => {
      const on = el.querySelector('input[name="idleEnabled"]')?.checked;
      const cover = el.querySelector('select[name="idleMode"]')?.value !== "scene";
      show(".inperson-when-idle", on);
      show(".inperson-when-cover", on && cover);
      show(".inperson-when-scene", on && !cover);
    };

    // `change` by hand, not `data-action`: ApplicationV2 dispatches those on
    // click, which on a <select> fires as the list opens.
    el.querySelector('input[name="idleEnabled"]')?.addEventListener("change", sync);
    el.querySelector('select[name="idleMode"]')?.addEventListener("change", sync);
    // A path typed or pasted straight into the field should show up in the
    // preview too, not only one chosen through the picker.
    el.querySelector('input[name="idleLogo"]')?.addEventListener("input", () => this.#syncLogo());
    sync();

    // The pair editor: two scene fields and the list above them. The field
    // names start with __ so the save handler ignores them - a pairing does not
    // belong to this form, it belongs to the battlemap.
    el.querySelector(".inperson-pair-add-from")?.replaceChildren(buildSceneField({
      name: "__pairFrom",
      emptyLabel: game.i18n.localize("INPERSON.Displays.PairFrom")
    }));
    el.querySelector(".inperson-pair-add-to")?.replaceChildren(buildSceneField({
      name: "__pairTo",
      emptyLabel: game.i18n.localize("INPERSON.Displays.PairTo")
    }));
    this.#paintPairs();
  }

  /** Save. Every field is written, so the form is the single source of truth. */
  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const number = v => Number(v) || 0;

    await game.settings.set(MODULE_ID, SETTINGS.MONITOR_BM, data.monitorBM ?? "");
    await game.settings.set(MODULE_ID, SETTINGS.MONITOR_SC, data.monitorSC ?? "");
    await game.settings.set(MODULE_ID, SETTINGS.MONITOR_RELEASE, data.monitorRelease ?? "follow");
    await game.settings.set(MODULE_ID, SETTINGS.MONITOR_IDLE_SCENE, data.monitorIdleScene ?? "");
    await game.settings.set(MODULE_ID, SETTINGS.DEFAULT_COMPANION, data.defaultCompanionScene ?? "");
    await game.settings.set(MODULE_ID, SETTINGS.IDLE_ENABLED, !!data.idleEnabled);
    await game.settings.set(MODULE_ID, SETTINGS.IDLE_AFTER, Math.max(1, number(data.idleAfter)));
    await game.settings.set(MODULE_ID, SETTINGS.IDLE_MODE, data.idleMode === "scene" ? "scene" : "cover");
    await game.settings.set(MODULE_ID, SETTINGS.IDLE_FOLDER, data.idleFolder ?? "");
    await game.settings.set(MODULE_ID, SETTINGS.IDLE_ROTATE_EVERY, Math.max(1, number(data.idleRotateEvery)));
    await game.settings.set(MODULE_ID, SETTINGS.IDLE_BLANK_FOR, Math.max(1, number(data.idleBlankFor)));
    await game.settings.set(MODULE_ID, SETTINGS.IDLE_LOGO, data.idleLogo ?? "");

    ui.notifications.info("INPERSON.Displays.Saved", { localize: true });
  }
}

/** Which settings this page owns. Used by nothing yet; kept next to the list. */
export const OWNED_SETTINGS = FIELDS;

export function openDisplaySettings() {
  if (!game.user.isGM) return;
  return new DisplaySettings().render({ force: true });
}
