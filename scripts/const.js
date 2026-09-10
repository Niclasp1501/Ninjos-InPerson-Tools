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
  ACTOR_PANEL: "actorPanel",
  /**
   * Show the strip inside the sheet-only view (world).
   *
   * It was client-scoped, on the reasoning that a player should own what their
   * own screen shows. The table decided otherwise: what the strip carries is a
   * presentation choice for the whole group, like the scene everyone is looking
   * at, not a personal preference - so it and the four below are the
   * gamemaster's, on a page only they can open.
   */
  CLOCK_STRIP: "clockStrip",
  /**
   * Show the weather with its temperature (world).
   *
   * The oldest of these five and still the one that gates the weather. A second
   * switch was briefly added beside it during the rework; two switches for one
   * thing is worse than none, so this one kept the job it always had.
   */
  CLOCK_WEATHER: "clockWeather",
  /** Which parts of the strip are drawn (all world - see CLOCK_STRIP). */
  CLOCK_DATE: "clockDate",
  CLOCK_TIME: "clockTime",
  CLOCK_SHOW_SEASON: "clockShowSeason",
  /** Sonnen- und Mondbogen statt oder neben der Uhrzeit (world). */
  CLOCK_SKY: "clockSky",
  /**
   * Wer die Kuppel zeichnet: "eigen" oder "calendaria" (world).
   *
   * Zwei Maltechniken für dasselbe Bild. Unsere kommt mit ein paar Dutzend
   * SVG-Formen aus, die das CSS bewegt; Calendaria fährt eine PixiJS-Szene
   * auf einer WebGL-Fläche auf. Die sieht besser aus und kostet mehr - auf
   * einem Tablet, dem wir gerade das Spielfeld abgeschaltet haben, ist das
   * kein kleiner Unterschied. Also entscheidet der Tisch, nicht wir.
   */
  CLOCK_SKY_SOURCE: "clockSkySource",
  /**
   * Sonnenauf- und -untergang im Erklärkasten der Kuppel (world).
   *
   * Nicht jeder Tisch will, dass die Spieler die Minute ablesen können, zu
   * der es hell wird - manchmal ist "es dämmert bald" die bessere Auskunft
   * als "04:41". Die Mondphase bleibt davon unberührt; sie steht am Himmel
   * und ist kein Geheimnis.
   */
  CLOCK_SKY_TIMES: "clockSkyTimes",
  /**
   * Bewegung in der Kuppel: "auto" | "immer" | "nie" (world).
   *
   * `auto` folgt dem Gerät - wer in den Bedienungshilfen oder im
   * Energiesparmodus Animationen abgeschaltet hat, bekommt ein stilles Bild.
   * Das ist grundsätzlich richtig, war am Tisch aber die falsche Antwort:
   * Auf einem Android-Tablet blieb die Kuppel stumm, und niemand ahnte, dass
   * die Ursache im Betriebssystem lag und nicht im Modul. Deshalb kann der
   * Spielleiter es überstimmen - in beide Richtungen.
   */
  CLOCK_SKY_MOTION: "clockSkyMotion",
  /**
   * Eigene Blattansicht statt Foundrys Oberfläche (world, Beta).
   *
   * Die einzige Funktion des Moduls, die einem Spieler den ganzen Bildschirm
   * nimmt. Standardmäßig aus, und solange sie aus ist, wird nichts davon
   * geladen — eine abgeschaltete Beta darf nicht messbar sein.
   */
  SHEETVIEW: "sheetView",
  /**
   * Wer sie bekommt: `{ [userId]: true }` (world).
   *
   * Der Schalter allein traf jeden Spieler mit Charakter — auch den am Laptop,
   * der seine Szenenliste braucht. Ob jemand nur sein Blatt sieht, hängt am
   * Gerät in seiner Hand, nicht an seiner Rolle.
   */
  SHEETVIEW_USERS: "sheetViewUsers",
  /** Spielfeld auf diesen Geräten abschalten — dieselbe Maschinerie wie im Tischmodus (world). */
  SHEETVIEW_NO_CANVAS: "sheetViewNoCanvas",
  /** Chat aufklappen, sobald der Spieler selbst etwas würfelt oder benutzt (world). */
  SHEETVIEW_CHAT_ON_USE: "sheetViewChatOnUse",
  SHEETVIEW_EDIT_PEN: "sheetViewEditPen",
  /**
   * Zeitstempel je Konto: `{ [userId]: ms }` (world). Der Spielleiter kommt an
   * den Gerätespeicher eines Tablets nicht heran; ein neuerer Stempel als der
   * gemerkte lässt das Gerät seine Leistenplätze und -größen wegwerfen.
   */
  SHEETVIEW_RESET: "sheetViewReset",
  /**
   * Offer the way into the trade at all (world).
   *
   * The trade itself moved to Ninjo's DnD Shops & Trade on 2026-09-08; the two
   * switches that used to sit here - whether the gamemaster joins in, and
   * whether trades are written down - went with it.
   */
  TRADE: "trade"
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
  SCREENSAVER: "screensaver",
  /**
   * Everything belonging to a trade - request, offer, accept, cancel, and the
   * gamemaster's answer with the whole session.
   *
   * One type for all of it, with an `action` inside. The alternative, six socket
   * types, would spread one conversation over six places in the dispatcher.
   */
  TRADE: "trade"
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
