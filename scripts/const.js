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
  /** Block Sound#load as well - playlists, ambient audio, music (world). */
  BLOCK_AUDIO: "blockAudio",
  /** Keep loading token artwork so players can still tell their tokens apart (world). */
  KEEP_TOKENS: "keepTokens",
  /** Suppress Foundry's scene loading bar on affected clients (world). */
  HIDE_PROGRESS: "hideProgress",
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
  /**
   * Scene the display falls back to when an activated battlemap names none of
   * its own (world). Without it an unpinned display simply mirrors the
   * battlemap, which is the one thing a second screen need not do.
   */
  DEFAULT_COMPANION: "defaultCompanionScene",
  /** Is the screensaver wanted at all? Everything else hangs off this (world). */
  IDLE_ENABLED: "idleEnabled",
  /**
   * Which kind (world): "scene" swaps to other scenes, "cover" lays a black
   * sheet over the one that is showing. They are alternatives, not stages - the
   * first changes what is displayed, the second hides it and leaves it be.
   */
  IDLE_MODE: "idleMode",
  /** Minutes of quiet before it starts (world). */
  IDLE_AFTER: "idleAfter",
  /** Scene folder the screensaver cycles through. One scene in it = just that one (world). */
  IDLE_FOLDER: "idleFolder",
  /** Minutes between two scenes of that folder (world). */
  IDLE_ROTATE_EVERY: "idleRotateEvery",
  /**
   * How long the black cover stays before lifting again (world).
   *
   * It lifts on purpose. The point was never to switch the television off, only
   * to stop one picture standing in the same pixels for hours - so the cover
   * comes and goes, and in between the scene is there to be looked at.
   */
  IDLE_BLANK_FOR: "idleBlankFor",
  /** Image drifting across the black cover. Empty = a plain dot (world). */
  IDLE_LOGO: "idleLogo",
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
  SHOW_PILL: "showPill",
  /**
   * Replace Sheet Only's actor selector with a side panel (world).
   *
   * Off by default: it takes over a button of another module's, and a module
   * that rearranges someone else's interface unasked is a bad guest.
   */
  ACTOR_PANEL: "actorPanel"
};

/** Socket message types. */
export const SOCKET = {
  NAME: `module.${MODULE_ID}`,
  REPORT: "report",
  REFRESH: "refresh",
  /**
   * The display announcing that it went into or came out of its screensaver.
   *
   * Without this the GM would record the screensaver scene as "where the
   * display belongs" and the pin target would be lost the first time the table
   * took a break.
   */
  SCREENSAVER: "screensaver"
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
