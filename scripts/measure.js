/**
 * Works out what a scene actually costs a player client, in bytes.
 *
 * Only the GM runs this, and only on demand. It issues HEAD requests (response
 * headers only, no body) and reads Content-Length, so measuring a 35 MB map
 * transfers a few hundred bytes. Results land in a world setting so players can
 * be shown a truthful "saved" figure instead of a guess.
 */

import { MODULE_ID, SETTINGS } from "./const.js";

/**
 * Collect every heavy texture source a scene would pull.
 *
 * v14 moved the background onto Level documents (`scene.levels[].background.src`);
 * v13 still had `scene.background.src` and a flat `scene.foreground` path.
 * @param {Scene} scene
 * @returns {Set<string>}
 */
export function collectSceneSources(scene) {
  const sources = new Set();
  if (!scene) return sources;

  if (scene.levels?.size) {
    for (const level of scene.levels) {
      if (level.background?.src) sources.add(level.background.src);
      if (level.foreground?.src) sources.add(level.foreground.src);
    }
  } else {
    if (scene.background?.src) sources.add(scene.background.src);
    if (typeof scene.foreground === "string" && scene.foreground) sources.add(scene.foreground);
  }

  for (const tile of scene.tiles ?? []) {
    if (tile.texture?.src) sources.add(tile.texture.src);
  }
  for (const drawing of scene.drawings ?? []) {
    if (drawing.texture) sources.add(drawing.texture);
  }
  for (const wall of scene.walls ?? []) {
    if (wall.animation?.texture) sources.add(wall.animation.texture);
  }
  return sources;
}

/**
 * HEAD a single source and return its size in bytes.
 * @param {string} src
 * @returns {Promise<number|null>} null when the server gave no Content-Length
 */
async function probe(src) {
  try {
    const response = await fetch(foundry.utils.getRoute(src), { method: "HEAD" });
    if (!response.ok) return null;
    const length = response.headers.get("content-length");
    return length ? Number(length) : null;
  } catch (err) {
    console.warn(`${MODULE_ID} | HEAD failed for ${src}`, err);
    return null;
  }
}

/**
 * Measure a scene and persist the sizes. GM only.
 * @param {Scene} scene
 * @returns {Promise<{total: number, measured: number, missing: number}>}
 */
export async function measureScene(scene) {
  if (!game.user.isGM) throw new Error("Only a GM may measure scenes.");

  const sources = collectSceneSources(scene);
  const cache = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTINGS.SIZE_CACHE) ?? {});

  const unknown = [...sources].filter(src => !(src in cache));
  const sizes = await Promise.all(unknown.map(probe));
  unknown.forEach((src, i) => {
    if (sizes[i] !== null) cache[src] = sizes[i];
  });
  await game.settings.set(MODULE_ID, SETTINGS.SIZE_CACHE, cache);

  let total = 0;
  let measured = 0;
  let missing = 0;
  for (const src of sources) {
    if (typeof cache[src] === "number") {
      total += cache[src];
      measured++;
    } else missing++;
  }
  return { total, measured, missing };
}

/**
 * Sum the known sizes of a list of sources.
 * @param {string[]} sources
 * @returns {{bytes: number, known: number, unknown: number}}
 */
export function sumKnown(sources) {
  const cache = game.settings.get(MODULE_ID, SETTINGS.SIZE_CACHE) ?? {};
  let bytes = 0;
  let known = 0;
  let unknown = 0;
  for (const src of sources) {
    if (typeof cache[src] === "number") {
      bytes += cache[src];
      known++;
    } else unknown++;
  }
  return { bytes, known, unknown };
}

/**
 * Human readable byte count.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}
