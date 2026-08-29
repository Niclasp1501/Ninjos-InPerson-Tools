/**
 * The actual blocking.
 *
 * Everything Foundry draws on the canvas funnels through exactly one method:
 *   TextureLoader#loadTexture(src)   -  client/canvas/loader.mjs
 *
 * Scene changes go loadSceneTextures() -> load() -> loadTexture() per file, and
 * every later on-demand load goes through the global loadTexture() helper, which
 * checks the cache and otherwise calls TextureLoader.loader.loadTexture(). The
 * one and only network call sits inside it as `PIXI.Assets.load(src)`.
 *
 * So we intercept there and hand back a tiny black placeholder. Nothing is
 * requested, and because Scene#getDimensions() derives geometry purely from
 * width/height/grid/padding (never from the image), the scene keeps its exact
 * layout: grid, walls, lighting, token positions and targeting all stay correct.
 */

import { MODULE_ID, SETTINGS, ALWAYS_ALLOW, ALWAYS_ALLOW_AUDIO } from "./const.js";
import { isActive } from "./state.js";

/* -------------------------------------------- */
/*  Placeholder textures                        */
/* -------------------------------------------- */

/** Sources we injected a placeholder for, so we can undo it cleanly. */
const _placeholderKeys = new Set();

/** Base textures we created, kept for disposal. */
const _placeholderTextures = new Set();

/**
 * Build a small opaque black BaseTexture.
 *
 * A fresh instance per source on purpose: sharing one would mean a single
 * `destroy()` anywhere takes down every blocked sprite at once. 8x8 RGBA is
 * 256 bytes, so even a few hundred of them are irrelevant.
 * @returns {PIXI.BaseTexture}
 */
function createPlaceholder() {
  const el = document.createElement("canvas");
  el.width = el.height = 8;
  const ctx = el.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 8, 8);
  const base = new PIXI.BaseTexture(el, { resolution: 1 });
  _placeholderTextures.add(base);
  return base;
}

/**
 * Return a placeholder for `src` and seed PIXI's asset cache with it, so the
 * synchronous path (getTexture -> getCache -> PIXI.Assets.get) also resolves
 * without ever re-entering this wrapper.
 * @param {string} src
 * @returns {PIXI.BaseTexture}
 */
function placeholderFor(src) {
  const base = createPlaceholder();
  try {
    if (!PIXI.Assets.cache.has(src)) {
      PIXI.Assets.cache.set(src, new PIXI.Texture(base));
      _placeholderKeys.add(src);
    }
  } catch (err) {
    // Caching is an optimisation, not a requirement - a miss just means the
    // async path runs again and lands here once more. Never let it break a draw.
    console.warn(`${MODULE_ID} | Could not cache placeholder for ${src}`, err);
  }
  return base;
}

/**
 * Remove every placeholder we injected and free the textures.
 *
 * PIXI's Cache#set does more than fill its own map: for a PIXI.Texture value it
 * also calls Texture.addToCache and BaseTexture.addToCache under the same key.
 * Cache#remove does *not* undo those, so both global caches have to be cleared
 * by hand - otherwise a later Texture.from(src) would still hand out our black
 * placeholder long after Table Mode was switched off.
 */
export function clearPlaceholders() {
  for (const key of _placeholderKeys) {
    try {
      if (PIXI.Assets.cache.has(key)) PIXI.Assets.cache.remove(key);
      PIXI.Texture.removeFromCache(key);
      PIXI.BaseTexture.removeFromCache(key);
    } catch (err) {
      console.warn(`${MODULE_ID} | Could not evict placeholder for ${key}`, err);
    }
  }
  _placeholderKeys.clear();

  // Deliberately NOT destroy()ed. Sprites of the scene being torn down still
  // reference these textures, and destroying first made Foundry's teardown throw:
  //   TilesLayer._tearDown -> isVideo -> sourceElement -> reading 'source' of null
  // Dropping the references is enough - each placeholder is an 8x8 canvas, 256
  // bytes, and the garbage collector takes them once the sprites are gone.
  _placeholderTextures.clear();
}

/* -------------------------------------------- */
/*  Allow rules                                 */
/* -------------------------------------------- */

/**
 * Is this source the background or foreground image of any scene?
 *
 * This is the whole blocklist in the default scope, and it is deliberately a
 * blocklist rather than an allowlist: only battlemaps get stopped, everything
 * else passes untouched. Blocking something harmless is worse than letting a
 * few megabytes through.
 *
 * Every scene is checked, not just the current one - Scenes#preload can be
 * fired for any scene in the world, and that is the costly case.
 *
 * Asked live on every request, against the scene documents themselves. An
 * earlier version precomputed this into a Set - and that precomputation was
 * exactly what broke: Foundry draws the canvas during `setup`, before the
 * `ready` hook that filled the Set, so the first draw after joining saw an
 * empty list and let the battlemap through. Asking directly has no
 * initialisation order to get wrong and needs no hooks to stay current.
 *
 * Cost is a string compare per scene, only for clients in table mode, only when
 * scope is "background". A world with a hundred-odd scenes lands in the
 * microseconds - far below the cost of the download this prevents.
 *
 * @param {string} src
 * @returns {boolean}
 */
export function isSceneBackground(src) {
  for (const scene of game.scenes ?? []) {
    // v14 keeps backgrounds on Level documents, v13 had them on the Scene.
    if (scene.levels?.size) {
      for (const level of scene.levels) {
        if (level.background?.src === src) return true;
        if (level.foreground?.src === src) return true;
      }
    } else {
      if (scene.background?.src === src) return true;
      if (scene.foreground === src) return true;
    }
  }
  return false;
}

/** Token artwork of the current scene, rebuilt whenever tokens change. */
const _tokenSources = new Set();

/** Rebuild the token allowlist from the viewed scene. */
export function refreshTokenSources() {
  _tokenSources.clear();
  const scene = canvas?.scene;
  if (!scene) return;
  for (const token of scene.tokens) {
    if (token.texture?.src) _tokenSources.add(token.texture.src);
    if (token.ring?.enabled && token.ring.subject?.texture) {
      _tokenSources.add(token.ring.subject.texture);
    }
  }
  const ring = CONFIG.Token?.ring?.spritesheet;
  if (ring) _tokenSources.add(ring);
}

/** User-supplied path fragments that must never be blocked. */
function userAllowList() {
  const raw = game.settings.get(MODULE_ID, SETTINGS.ALLOW_LIST) ?? "";
  return raw.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
}

/**
 * Should this texture source still be downloaded?
 * @param {string} src
 * @returns {boolean}
 */
function isTextureAllowed(src) {
  if (!src) return true;
  if (ALWAYS_ALLOW.some(re => re.test(src))) return true;
  if (userAllowList().some(fragment => src.includes(fragment))) return true;

  // Default scope: the battlemap and nothing else. Anything we cannot positively
  // identify as a scene background is let through - tiles, effects, portraits,
  // module art. Letting a few megabytes pass costs bandwidth; blocking the wrong
  // file costs the session.
  if (game.settings.get(MODULE_ID, SETTINGS.SCOPE) === "background") {
    return !isSceneBackground(src);
  }

  // Wide scope: everything heavy, with token art kept unless disabled.
  if (game.settings.get(MODULE_ID, SETTINGS.KEEP_TOKENS) && _tokenSources.has(src)) return true;
  return false;
}

/**
 * Should this audio source still be downloaded?
 * @param {string} src
 * @returns {boolean}
 */
function isAudioAllowed(src) {
  if (!src) return true;
  if (!game.settings.get(MODULE_ID, SETTINGS.BLOCK_AUDIO)) return true;
  if (ALWAYS_ALLOW_AUDIO.some(re => re.test(src))) return true;
  return userAllowList().some(fragment => src.includes(fragment));
}

/* -------------------------------------------- */
/*  Statistics                                  */
/* -------------------------------------------- */

const _blocked = { textures: new Set(), audio: new Set() };

/** @returns {{textures: number, audio: number, sources: string[]}} */
export function getStats() {
  return {
    textures: _blocked.textures.size,
    audio: _blocked.audio.size,
    sources: [..._blocked.textures]
  };
}

/** Forget everything counted so far. */
export function resetStats() {
  _blocked.textures.clear();
  _blocked.audio.clear();
}

/* -------------------------------------------- */
/*  Wrapper installation                        */
/* -------------------------------------------- */

const TEXTURE_TARGET = "foundry.canvas.TextureLoader.prototype.loadTexture";
const AUDIO_TARGET = "foundry.audio.Sound.prototype.load";
const BATCH_TARGET = "foundry.canvas.TextureLoader.prototype.load";

/** Fallback un-patchers used when lib-wrapper is absent. */
const _manualRestore = [];

/** @this {TextureLoader} */
async function onLoadTexture(wrapped, src, ...rest) {
  if (!isActive() || isTextureAllowed(src)) return wrapped(src, ...rest);
  _blocked.textures.add(src);
  return placeholderFor(src);
}

/**
 * Hide Foundry's scene loading bar.
 *
 * `TextureLoader#load` puts up a progress notification whenever it processes a
 * batch, and it does that even when every file is a cache hit - so a player in
 * table mode still saw a loading bar for downloads that never happened. The bar
 * reports processing, not bandwidth, which makes it actively misleading here.
 * `displayProgress: false` is a documented option of that method, so this only
 * changes what is shown, never what is loaded.
 * @this {TextureLoader}
 */
async function onLoadBatch(wrapped, sources, options = {}) {
  if (!isActive() || !game.settings.get(MODULE_ID, SETTINGS.HIDE_PROGRESS)) {
    return wrapped(sources, options);
  }
  return wrapped(sources, { ...options, displayProgress: false });
}

/** @this {foundry.audio.Sound} */
async function onLoadSound(wrapped, options = {}) {
  if (!isActive() || isAudioAllowed(this.src)) return wrapped(options);
  _blocked.audio.add(this.src);

  // Mirror exactly what a real load failure leaves behind. Every caller -
  // PlaylistSound, AmbientSound, AudioHelper.preload - already branches on
  // `sound.failed`, so nothing downstream needs to know we made this happen.
  if (!this.loaded) this._state = foundry.audio.Sound.STATES.FAILED;
  return this;
}

/**
 * Patch a prototype method by dotted path without lib-wrapper.
 * @param {string} path
 * @param {Function} handler  Receives (wrapped, ...args)
 */
function manualPatch(path, handler) {
  const parts = path.split(".");
  const method = parts.pop();
  const target = parts.reduce((obj, key) => obj?.[key], globalThis);
  if (!target || typeof target[method] !== "function") {
    console.error(`${MODULE_ID} | Cannot patch ${path} - not found.`);
    return;
  }
  const original = target[method];
  target[method] = function (...args) {
    return handler.call(this, original.bind(this), ...args);
  };
  _manualRestore.push(() => { target[method] = original; });
}

/** Install both wrappers. Called once during `init`. */
export function installWrappers() {
  const lw = globalThis.libWrapper;
  if (lw?.register) {
    lw.register(MODULE_ID, TEXTURE_TARGET, onLoadTexture, "MIXED");
    lw.register(MODULE_ID, AUDIO_TARGET, onLoadSound, "MIXED");
    lw.register(MODULE_ID, BATCH_TARGET, onLoadBatch, "MIXED");
    lw.register(MODULE_ID, TIMESTAMP_TARGET, onUpdateTimestamps, "MIXED");
    console.log(`${MODULE_ID} | Wrappers installed via lib-wrapper.`);
    return;
  }
  manualPatch(TEXTURE_TARGET, onLoadTexture);
  manualPatch(AUDIO_TARGET, onLoadSound);
  manualPatch(BATCH_TARGET, onLoadBatch);
  manualPatch(TIMESTAMP_TARGET, onUpdateTimestamps);
  console.warn(`${MODULE_ID} | lib-wrapper not found - using fallback patches.`);
}

/** Remove fallback patches. Only relevant for teardown in dev. */
export function removeWrappers() {
  while (_manualRestore.length) _manualRestore.pop()();
}

/* -------------------------------------------- */
/*  Fallout from blocked audio                  */
/* -------------------------------------------- */

const TIMESTAMP_TARGET = "foundry.applications.sidebar.tabs.PlaylistDirectory.prototype.updateTimestamps";

/**
 * Swallow a core crash that blocked audio provokes.
 *
 * `PlaylistDirectory#updateTimestamps` (playlist-directory.mjs:781) null-checks
 * the `.current` and `.duration` elements but not `.pause`:
 *
 *   const play = li.querySelector(".pause");
 *   if ( play.classList.contains("fa-spinner") )      // throws when null
 *
 * A sound we refused never finishes loading, so its spinner button is missing
 * and this runs once a second on a timer - measured at 4476 exceptions in a
 * single session. Monk's Sound Enhancements only calls `super`, which is why
 * the stack trace points there; the missing check is Foundry's.
 *
 * Only swallowed while blocked audio is actually the cause. Any other error,
 * and any error at all when we are not blocking, is re-thrown untouched -
 * hiding somebody else's bug would be worse than the noise.
 */
function onUpdateTimestamps(wrapped, ...args) {
  try {
    return wrapped(...args);
  } catch (err) {
    const weCaused = isActive() && game.settings.get(MODULE_ID, SETTINGS.BLOCK_AUDIO);
    if (!weCaused || !(err instanceof TypeError)) throw err;
    return;
  }
}
