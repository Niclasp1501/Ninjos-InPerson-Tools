/**
 * Shared constants for Ninjo's In-Person Tools.
 */

export const MODULE_ID = "ninjos-inperson-tools";

export const SETTINGS = {
  /** Master switch (world). Nothing happens at all while this is off. */
  ENABLED: "enabled",
  /** Explicit per-user overrides set by the GM (world): { [userId]: true|false } */
  FORCED: "forcedUsers",
  /** Players with no explicit entry are blacked out by default (world). */
  DEFAULT_PLAYERS: "defaultForPlayers",
  /** "background" = only scene backgrounds (default), "everything" = all heavy media (world). */
  SCOPE: "blockScope",
  /** Keep loading token artwork so players can still tell their tokens apart (world). */
  KEEP_TOKENS: "keepTokens",
  /** Block Sound#load as well - playlists, ambient audio, music (world). */
  BLOCK_AUDIO: "blockAudio",
  /** User id of the battlemap display - always follows activations (world). */
  MONITOR_BM: "monitorBM",
  /** User id of the scene display - the one that can be pinned (world). */
  MONITOR_SC: "monitorSC",
  /** Is the scene display currently pinned? (world) */
  MONITOR_PINNED: "monitorPinned",
  /** Scene the pinned scene display shows. Survives reloads (world). */
  MONITOR_SCENE: "monitorScene",
  /** What a pinned display does when released: "follow" or "idle" (world). */
  MONITOR_RELEASE: "monitorRelease",
  /** Scene shown as the idle screen when a display is released (world). */
  MONITOR_IDLE_SCENE: "monitorIdleScene",
  /** Keep token HUD text upright while a scene is rotated (world). */
  HUD_UPRIGHT: "hudUpright",
  /** Suppress Foundry's scene loading bar on affected clients (world). */
  HIDE_PROGRESS: "hideProgress",
  /** Newline/comma separated path fragments that are never blocked (world). */
  ALLOW_LIST: "allowList",
  /** Has the one-off migration from the old module id run? (world) */
  MIGRATED: "migratedFromTableMode",
  /** Measured byte sizes per source, filled by the GM's "measure scene" action (world). */
  SIZE_CACHE: "sizeCache",
  /** Also switch core.noCanvas on for blacked-out clients (world). */
  AUTO_NO_CANVAS: "autoNoCanvas",
  /** Did *we* set core.noCanvas? Never clear a flag another module owns (client). */
  NO_CANVAS_OWNED: "noCanvasOwned",
  /** Per-client choice: "auto" | "on" | "off" */
  SELF: "selfMode",
  /** Show the small status pill in the UI (client). */
  SHOW_PILL: "showPill"
};

/** Socket message types. */
export const SOCKET = {
  NAME: `module.${MODULE_ID}`,
  REPORT: "report",
  REFRESH: "refresh"
};

/**
 * Sources matching these never get blocked.
 *
 * Spritesheets are the important one: `TextureLoader#loadTexture` may return a
 * PIXI.Spritesheet for those, and callers branch on `instanceof PIXI.Spritesheet`.
 * Handing back a BaseTexture placeholder instead would break token rings.
 */
export const ALWAYS_ALLOW = [
  /\.(json|jsonc)(\?.*)?$/i,   // spritesheets (token rings, tile sheets)
  /\.svg(\?.*)?$/i,            // see note below
  /\/icons\//i,                // icon folders of core, systems and modules
  /^ui\//i,                    // core UI chrome
  /^data:/i,                   // inline data URIs - already downloaded
  /^#/                         // virtual textures from canvas.sceneTextures
];

/*
 * On SVG: measured during the first live test, blocking swallowed the token
 * status markers - systems/dnd5e/icons/svg/statuses/concentrating.svg and the
 * like. Those are one to two kilobytes each and carry real information: who is
 * concentrating, invisible or unconscious. Battlemaps are never SVG, so the
 * format is a reliable signal for "small and functional" and costs us nothing.
 */

/** Core UI sounds (dice, notifications) stay - they are tiny and cached. */
export const ALWAYS_ALLOW_AUDIO = [
  /^sounds\//i,
  /^data:/i
];
