/**
 * Showing an item icon that is actually visible.
 *
 * Item icons come in two kinds and only one of them can be put in an `<img>`.
 *
 * Raster pictures - the `.webp` files under `icons/` - are fine. dnd5e's own
 * icons are SVG files that say `fill: var(--icon-fill, #fff)`, and an `<img>`
 * is a document of its own: nothing on our page reaches inside it, the fallback
 * wins, and the icon is drawn in white. On parchment that is indistinguishable
 * from a picture that failed to load.
 *
 * dnd5e solves this for itself by fetching the file and putting the SVG into
 * the page (`dnd5e.mjs:64044`, its `<dnd5e-icon>` element), where the variable
 * does apply. This does the same, for two reasons: the module has to work
 * without dnd5e, and doing it ourselves means the icons come out in our own ink
 * rather than whatever the system happened to pick.
 *
 * Fetched once per path and kept - a character sheet shows the same handful of
 * icons over and over, and the picking list re-renders on every tap.
 */

import { MODULE_ID } from "./const.js";

/** path -> SVGElement, or the promise fetching it. */
const cache = new Map();

/** Is this path an SVG, and therefore in need of the treatment above? */
export function isSvg(path) {
  return /\.svg(\?|$)/i.test(path ?? "");
}

/**
 * Strip anything that is not picture.
 *
 * These files come from the world's own data directory, so this is not the
 * front line of anything - but an SVG can carry a script, and an icon has no
 * business running one. Same list dnd5e removes.
 * @param {SVGElement} svg
 */
function clean(svg) {
  svg.querySelectorAll("script, foreignObject").forEach(node => node.remove());
  for (const node of svg.querySelectorAll("*")) {
    for (const attribute of [...node.attributes]) {
      if (attribute.name.startsWith("on")) node.removeAttribute(attribute.name);
      if (attribute.value?.trim().toLowerCase().startsWith("javascript:")) {
        node.removeAttribute(attribute.name);
      }
    }
  }
}

/**
 * The SVG at this path, ready to be put into the page.
 * @param {string} path
 * @returns {Promise<SVGElement|null>}
 */
async function load(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(foundry.utils.getRoute(path))
      .then(response => response.ok ? response.text() : Promise.reject(response.status))
      .then(text => {
        const holder = document.createElement("div");
        holder.innerHTML = text;
        const svg = holder.querySelector("svg");
        if (svg) clean(svg);
        cache.set(path, svg);
        return svg;
      })
      .catch(error => {
        console.warn(`${MODULE_ID} | Symbol ${path} nicht ladbar`, error);
        cache.set(path, null);
        return null;
      }));
  }
  return cache.get(path);
}

/**
 * Fill in every `<span class="inperson-icon" data-icon="...">` under a root.
 *
 * The path travels in a data attribute rather than in an inline `style`:
 * Handlebars escapes an apostrophe in a filename to `&#x27;`, which would turn
 * a perfectly good url() into nothing at all.
 *
 * @param {HTMLElement} root
 */
export async function fillIcons(root) {
  for (const node of root.querySelectorAll("span.inperson-icon[data-icon]")) {
    if (node.firstElementChild) continue;              // already filled
    const svg = await load(node.dataset.icon);
    if (!svg || node.firstElementChild) continue;
    node.appendChild(svg.cloneNode(true));
  }
}
