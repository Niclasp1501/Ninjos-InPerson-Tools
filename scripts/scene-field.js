/**
 * A field for choosing one scene.
 *
 * It replaces a `<select>` with 125 entries, which is the wrong shape twice
 * over: finding a name in it means scrolling a list sorted by something other
 * than what you remember, and once chosen, the field shows a name and nothing
 * else - no picture of the scene you just picked, no way to tell "53. Pirate
 * Ship" from "53. Pirate Ship (Night)".
 *
 * Three ways in, because people arrive at this differently:
 *
 *   drag     pull a scene out of the sidebar onto the field - the fastest way
 *            when the scene is already in front of you
 *   choose   opens a list you can type into, for the other 120
 *   clear    for taking it back out
 *
 * The chosen scene is shown with its own thumbnail. That is the part a dropdown
 * cannot do at all, and the reason a wrong pick used to survive until someone
 * activated the battlemap and the second screen showed the wrong room.
 *
 * The value travels in a hidden input under the name the caller gives it, so the
 * surrounding form submits it exactly as the `<select>` did. Hidden inputs are
 * submitted; disabled ones are not - which is why this uses the former.
 */

import { MODULE_ID } from "./const.js";

const { DialogV2 } = foundry.applications.api;

/** Shown when a scene has no usable picture of its own. */
const NO_THUMB = "icons/svg/dice-target.svg";

/** Thumbnail for a scene, as far as the document knows. */
function thumbOf(scene) {
  return scene?.thumb || scene?.background?.src || NO_THUMB;
}

/**
 * Fall back to the placeholder when the picture does not actually load.
 *
 * A scene can carry a thumbnail path whose file is long gone - measured in this
 * world on 2026-08-29, "53. Pirate Ship" pointed at a thumbnail the server
 * answers with 404. The document cannot know that, so the check has to happen
 * where it shows: on the element itself. Guarded against looping, in case the
 * placeholder is missing too.
 */
function withFallback(img) {
  img.addEventListener("error", () => {
    if (img.dataset.fellBack) return;
    img.dataset.fellBack = "1";
    img.src = NO_THUMB;
  });
  return img;
}

/**
 * Build the field.
 *
 * @param {object} options
 * @param {string} options.name       Form field name, e.g. `flags.mod.companionScene`
 * @param {string} [options.value]    Currently chosen scene id
 * @param {string} [options.exclude]  Scene id to leave out (a scene is no companion of itself)
 * @param {string} [options.emptyLabel] What to say when nothing is chosen
 * @returns {HTMLElement}
 */
export function buildSceneField({ name, value = "", exclude = "", emptyLabel } = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "inperson-scenefield";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value ?? "";
  wrapper.appendChild(input);

  const drop = document.createElement("div");
  drop.className = "inperson-scenefield-drop";
  wrapper.appendChild(drop);

  const buttons = document.createElement("div");
  buttons.className = "inperson-scenefield-buttons";
  buttons.innerHTML = `
    <button type="button" class="inperson-mini inperson-scenefield-pick">
      <i class="fa-solid fa-magnifying-glass"></i> ${game.i18n.localize("INPERSON.SceneField.Choose")}
    </button>
    <button type="button" class="inperson-mini inperson-scenefield-clear">
      <i class="fa-solid fa-xmark"></i>
    </button>`;
  wrapper.appendChild(buttons);

  const empty = emptyLabel ?? game.i18n.localize("INPERSON.SceneField.Empty");

  /** Repaint from whatever the hidden input says. Never re-renders the form. */
  const paint = () => {
    const scene = input.value ? game.scenes?.get(input.value) : null;
    wrapper.classList.toggle("is-empty", !scene);
    buttons.querySelector(".inperson-scenefield-clear").toggleAttribute("hidden", !scene);

    if (!scene) {
      drop.innerHTML = `<span class="inperson-scenefield-hint">${empty}</span>`;
      return;
    }
    const img = withFallback(document.createElement("img"));
    img.src = thumbOf(scene);
    img.alt = "";
    const label = document.createElement("span");
    label.className = "inperson-scenefield-name";
    label.textContent = scene.name;
    drop.replaceChildren(img, label);
  };

  const set = id => {
    input.value = id ?? "";
    paint();
    // Tell the surrounding form, so anything watching the field reacts the same
    // way it would to a person typing in it.
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  /* -------------------------------------------- */
  /*  Dragging a scene in                         */
  /* -------------------------------------------- */

  drop.addEventListener("dragover", event => {
    event.preventDefault();
    drop.classList.add("is-over");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("is-over"));

  drop.addEventListener("drop", async event => {
    event.preventDefault();
    drop.classList.remove("is-over");

    let data;
    try {
      data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    } catch {
      return;
    }
    if (data?.type !== "Scene") {
      return ui.notifications.warn("INPERSON.SceneField.NotAScene", { localize: true });
    }

    const scene = await fromUuid(data.uuid);
    if (!scene) return;
    if (scene.id === exclude) {
      return ui.notifications.warn("INPERSON.SceneField.NotItself", { localize: true });
    }
    set(scene.id);
  });

  /* -------------------------------------------- */
  /*  Choosing from a list                        */
  /* -------------------------------------------- */

  buttons.querySelector(".inperson-scenefield-pick").addEventListener("click", async () => {
    const picked = await pickScene({ exclude, current: input.value });
    if (picked !== undefined) set(picked);
  });

  buttons.querySelector(".inperson-scenefield-clear").addEventListener("click", () => set(""));

  paint();

  // A way in for callers that need to change the field from outside - the pair
  // editor empties both of its fields after making a pairing. Reaching for the
  // hidden input directly would set the value without repainting, and clicking
  // the clear button only works while that button happens to be visible.
  wrapper.setScene = set;

  return wrapper;
}

/**
 * A list of scenes you can type into.
 *
 * Filtered live rather than through a search button: with 125 scenes the point
 * is to narrow the list while remembering the name, not to run a query.
 * @returns {Promise<string|undefined>} chosen id, "" for none, undefined on cancel
 */
export async function pickScene({ exclude = "", current = "" } = {}) {
  const scenes = game.scenes
    .filter(s => s.id !== exclude)
    .sort((a, b) => a.name.localeCompare(b.name));

  const escape = s => foundry.utils.escapeHTML?.(s) ?? s;
  const rows = scenes.map(s => `
    <button type="button" class="inperson-pick-row${s.id === current ? " is-current" : ""}"
            data-scene-id="${s.id}" data-name="${escape(s.name.toLowerCase())}">
      <img src="${thumbOf(s)}" alt="">
      <span>${escape(s.name)}</span>
    </button>`).join("");

  const content = `
    <div class="inperson-pick">
      <input type="search" class="inperson-pick-filter"
             placeholder="${game.i18n.localize("INPERSON.SceneField.Filter")}" autofocus>
      <div class="inperson-pick-list">${rows}</div>
    </div>`;

  return new Promise(resolve => {
    let settled = false;
    const done = value => { if (!settled) { settled = true; resolve(value); } };

    const dialog = new DialogV2({
      window: { title: "INPERSON.SceneField.Choose", icon: "fa-solid fa-map" },
      position: { width: 460, height: 520 },
      classes: ["ninjos-inperson-tools", "inperson-panel"],
      content,
      buttons: [{
        action: "none",
        label: "INPERSON.SceneField.Empty",
        icon: "fa-solid fa-ban",
        callback: () => done("")
      }],
      // Cancel must be distinguishable from "none": one leaves the field alone,
      // the other empties it. Resolving undefined says "nothing was decided".
      close: () => done(undefined)
    });

    dialog.render({ force: true }).then(() => {
      const el = dialog.element;
      const filter = el.querySelector(".inperson-pick-filter");
      const list = [...el.querySelectorAll(".inperson-pick-row")];
      // The rows are built as markup, so their images get the fallback here.
      el.querySelectorAll(".inperson-pick-row img").forEach(withFallback);

      filter?.addEventListener("input", () => {
        const needle = filter.value.trim().toLowerCase();
        for (const row of list) {
          row.toggleAttribute("hidden", !!needle && !row.dataset.name.includes(needle));
        }
      });

      for (const row of list) {
        row.addEventListener("click", () => {
          done(row.dataset.sceneId);
          dialog.close();
        });
      }

      el.querySelector(".is-current")?.scrollIntoView({ block: "center" });
    });
  });
}
