/**
 * Ninjo's In-Person Tools - bootstrap and wiring.
 *
 * See blocker.js for why a single wrapper on TextureLoader#loadTexture catches
 * every download path, and why the default scope stops at scene backgrounds.
 */

import { MODULE_ID, SETTINGS, SOCKET } from "./const.js";
import { isActive, invalidate } from "./state.js";
import {
  installWrappers, refreshTokenSources, clearPlaceholders, getStats, resetStats
} from "./blocker.js";
import { collectSceneSources, sumKnown, formatBytes } from "./measure.js";
import { openPanel, refreshPanel, playerReports } from "./panel.js";
import { syncNoCanvas } from "./nocanvas.js";
import { applyRotation, getRotation, ROTATION_FLAG, ANGLES } from "./rotation.js";
import { openPullDialog } from "./pull.js";
import { migrateFromOldId } from "./migrate.js";
import { installLockViewInterop, onRotationChanged, describeInterop } from "./lockview.js";
import { installScreensaver } from "./screensaver.js";
import { openDisplaySettings } from "./displays-settings.js";
import { openTableModeSettings } from "./tablemode-settings.js";
import {
  installMonitorWrapper, installActivityListener, applyPinnedScene, showOnMonitor, setPinned, isPinned,
  getSceneDisplay, getPinnedScene, getCompanionScene, setCompanionScene,
  setDefaultCompanionScene, setScreensaverState,
  COMPANION_FLAG
} from "./monitor.js";

/* -------------------------------------------- */
/*  Settings                                    */
/* -------------------------------------------- */

/** Re-evaluate state and repaint whenever anything relevant changed. */
function onRelevantSettingChanged() {
  applyStateChange();
  refreshPanel();
}

function registerSettings() {
  const S = (key, data) => game.settings.register(MODULE_ID, key, data);

  // Not in the settings list on purpose. It is the same switch as the big
  // button at the top of the controls, and there it says what it is doing -
  // "table mode is running, 6 players have stopped downloading maps" - where a
  // checkbox in a list can only show a tick. Two ways to the same switch, one
  // of them worse, and the controls are one click away right above it.
  S(SETTINGS.ENABLED, {
    name: "INPERSON.Settings.Enabled.Name",
    hint: "INPERSON.Settings.Enabled.Hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.DEFAULT_PLAYERS, {
    name: "INPERSON.Settings.DefaultPlayers.Name",
    hint: "INPERSON.Settings.DefaultPlayers.Hint",
    scope: "world",
    config: false,   // lives on the table-mode page
    type: Boolean,
    default: true,
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.SCOPE, {
    name: "INPERSON.Settings.Scope.Name",
    hint: "INPERSON.Settings.Scope.Hint",
    scope: "world",
    config: false,   // lives on the table-mode page
    type: String,
    choices: {
      background: "INPERSON.Settings.Scope.Background",
      everything: "INPERSON.Settings.Scope.Everything"
    },
    default: "background",
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.KEEP_TOKENS, {
    name: "INPERSON.Settings.KeepTokens.Name",
    hint: "INPERSON.Settings.KeepTokens.Hint",
    scope: "world",
    config: false,   // lives on the table-mode page
    type: Boolean,
    default: true,
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.BLOCK_AUDIO, {
    name: "INPERSON.Settings.BlockAudio.Name",
    hint: "INPERSON.Settings.BlockAudio.Hint",
    scope: "world",
    config: false,   // lives on the table-mode page
    type: Boolean,
    default: false
  });

  S(SETTINGS.MONITOR_BM, {
    name: "INPERSON.Settings.MonitorBM.Name",
    hint: "INPERSON.Settings.MonitorBM.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: String,
    choices: {},          // filled in during setup, see fillAccountChoices()
    default: "",
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.MONITOR_SC, {
    name: "INPERSON.Settings.MonitorSC.Name",
    hint: "INPERSON.Settings.MonitorSC.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: String,
    choices: {},
    default: "",
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.MONITOR_PINNED, {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    onChange: () => { applyPinnedScene(); refreshPanel(); markMonitorScenes(); }
  });

  S(SETTINGS.MONITOR_SCENE, {
    scope: "world",
    config: false,
    type: String,
    default: "",
    onChange: () => { applyPinnedScene(); refreshPanel(); markMonitorScenes(); }
  });

  S(SETTINGS.MONITOR_RELEASE, {
    name: "INPERSON.Settings.MonitorRelease.Name",
    hint: "INPERSON.Settings.MonitorRelease.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: String,
    choices: {
      follow: "INPERSON.Settings.MonitorRelease.Follow",
      idle: "INPERSON.Settings.MonitorRelease.Idle"
    },
    default: "follow"
  });

  S(SETTINGS.MONITOR_IDLE_SCENE, {
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  S(SETTINGS.DEFAULT_COMPANION, {
    scope: "world",
    config: false,
    type: String,
    default: "",
    onChange: () => refreshPanel()
  });

  S(SETTINGS.IDLE_ENABLED, {
    name: "INPERSON.Settings.IdleEnabled.Name",
    hint: "INPERSON.Settings.IdleEnabled.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: Boolean,
    default: false
  });

  S(SETTINGS.IDLE_MODE, {
    name: "INPERSON.Settings.IdleMode.Name",
    hint: "INPERSON.Settings.IdleMode.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: String,
    choices: {
      cover: "INPERSON.Settings.IdleMode.Cover",
      scene: "INPERSON.Settings.IdleMode.Scene"
    },
    default: "cover"
  });

  S(SETTINGS.IDLE_AFTER, {
    name: "INPERSON.Settings.IdleAfter.Name",
    hint: "INPERSON.Settings.IdleAfter.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: Number,
    range: { min: 1, max: 120, step: 1 },
    default: 5
  });

  S(SETTINGS.IDLE_FOLDER, {
    name: "INPERSON.Settings.IdleFolder.Name",
    hint: "INPERSON.Settings.IdleFolder.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: String,
    choices: {},          // filled in `setup`, once the folders exist
    default: ""
  });

  S(SETTINGS.IDLE_ROTATE_EVERY, {
    name: "INPERSON.Settings.IdleRotate.Name",
    hint: "INPERSON.Settings.IdleRotate.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: Number,
    range: { min: 1, max: 60, step: 1 },
    default: 5
  });


  S(SETTINGS.IDLE_BLANK_FOR, {
    name: "INPERSON.Settings.IdleBlankFor.Name",
    hint: "INPERSON.Settings.IdleBlankFor.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: Number,
    range: { min: 1, max: 60, step: 1 },
    default: 3
  });

  S(SETTINGS.IDLE_LOGO, {
    name: "INPERSON.Settings.IdleLogo.Name",
    hint: "INPERSON.Settings.IdleLogo.Hint",
    scope: "world",
    config: false,   // lives on the scene-display page
    type: String,
    filePicker: "image",
    default: ""
  });

  S(SETTINGS.HIDE_PROGRESS, {
    name: "INPERSON.Settings.HideProgress.Name",
    hint: "INPERSON.Settings.HideProgress.Hint",
    scope: "world",
    config: false,   // lives on the table-mode page
    type: Boolean,
    default: true
  });

  S(SETTINGS.AUTO_NO_CANVAS, {
    name: "INPERSON.Settings.AutoNoCanvas.Name",
    hint: "INPERSON.Settings.AutoNoCanvas.Hint",
    scope: "world",
    config: false,   // lives on the table-mode page
    type: Boolean,
    default: false,
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.NO_CANVAS_OWNED, {
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  S(SETTINGS.ALLOW_LIST, {
    name: "INPERSON.Settings.AllowList.Name",
    hint: "INPERSON.Settings.AllowList.Hint",
    scope: "world",
    config: false,   // lives on the table-mode page
    type: String,
    default: "",
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.FORCED, {
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.MIGRATED, {
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  S(SETTINGS.SIZE_CACHE, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  S(SETTINGS.SELF, {
    name: "INPERSON.Settings.Self.Name",
    hint: "INPERSON.Settings.Self.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      auto: "INPERSON.Settings.Self.Auto",
      on: "INPERSON.Settings.Self.On",
      off: "INPERSON.Settings.Self.Off"
    },
    default: "auto",
    onChange: onRelevantSettingChanged
  });

  S(SETTINGS.SHOW_PILL, {
    name: "INPERSON.Settings.ShowPill.Name",
    hint: "INPERSON.Settings.ShowPill.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => updatePill()
  });

  game.settings.registerMenu(MODULE_ID, "panel", {
    name: "INPERSON.Menu.Name",
    label: "INPERSON.Menu.Label",
    hint: "INPERSON.Menu.Hint",
    icon: "fa-solid fa-eye-slash",
    type: InPersonPanelShim,
    restricted: true
  });

  // One page per tool. Blocking downloads and steering two televisions have
  // nothing to do with one another beyond the occasion, and a flat list made
  // whichever tool had the most settings look like "the settings of the module".
  game.settings.registerMenu(MODULE_ID, "tablemode", {
    name: "INPERSON.TableMode.MenuName",
    label: "INPERSON.TableMode.MenuLabel",
    hint: "INPERSON.TableMode.MenuHint",
    icon: "fa-solid fa-eye-slash",
    type: TableModeSettingsShim,
    restricted: true
  });

  // Everything about the two televisions has its own page. Steering displays and
  // stopping downloads are separate jobs that merely share a module, and one
  // flat list made them read as a heap of unrelated switches.
  game.settings.registerMenu(MODULE_ID, "displays", {
    name: "INPERSON.Displays.MenuName",
    label: "INPERSON.Displays.MenuLabel",
    hint: "INPERSON.Displays.MenuHint",
    icon: "fa-solid fa-display",
    type: DisplaySettingsShim,
    restricted: true
  });
}

/** Same shim trick as below - the menu wants a class, we want our own window. */
class TableModeSettingsShim extends foundry.applications.api.ApplicationV2 {
  constructor(...args) {
    super(...args);
    openTableModeSettings();
  }
  async render() { return this; }
}

class DisplaySettingsShim extends foundry.applications.api.ApplicationV2 {
  constructor(...args) {
    super(...args);
    openDisplaySettings();
  }
  async render() { return this; }
}

/** Settings menus want a FormApplication-shaped class; we just open our panel. */
class InPersonPanelShim extends foundry.applications.api.ApplicationV2 {
  constructor(...args) {
    super(...args);
    openPanel();
  }
  async render() { return this; }
}

/* -------------------------------------------- */
/*  State application                           */
/* -------------------------------------------- */

/**
 * Drop cached heavy textures for the viewed scene so a mid-session switch takes
 * effect visually instead of silently reusing what is already in memory.
 */
function evictSceneTextures() {
  const scene = canvas?.scene;
  if (!scene) return;
  for (const src of collectSceneSources(scene)) {
    try {
      // Guarded: PIXI's Cache#remove logs a warning for unknown keys, and most
      // of a scene's sources will not be cached on any given client.
      if (PIXI.Assets.cache.has(src)) PIXI.Assets.cache.remove(src);
      PIXI.Texture.removeFromCache(src);
      PIXI.BaseTexture.removeFromCache(src);
    } catch (err) {
      /* not cached - nothing to do */
    }
  }
}

/** Apply a (possibly) changed table mode state to the running client. */
async function applyStateChange() {
  const flipped = invalidate();

  // Runs even when the state did not flip: the GM may have toggled the
  // no-canvas option itself, which changes what this client should do.
  await syncNoCanvas();

  if (!flipped) {
    updatePill();
    return;
  }

  if (isActive()) evictSceneTextures();
  else clearPlaceholders();

  if (canvas?.ready) await canvas.draw();
  updatePill();
  reportToGM();
}

/* -------------------------------------------- */
/*  Status pill                                 */
/* -------------------------------------------- */

let _pill = null;

function updatePill() {
  const wanted = isActive() && game.settings.get(MODULE_ID, SETTINGS.SHOW_PILL);
  if (!wanted) {
    _pill?.remove();
    _pill = null;
    return;
  }

  if (!_pill) {
    _pill = document.createElement("div");
    _pill.id = "ninjos-inperson-tools-pill";
    _pill.innerHTML = `<i class="fa-solid fa-eye-slash"></i><span></span>`;
    _pill.addEventListener("click", () => {
      if (game.user.isGM) openPanel();
    });
    document.body.appendChild(_pill);
  }

  const stats = getStats();
  const { bytes } = sumKnown(stats.sources);
  const label = bytes
    ? game.i18n.format("INPERSON.Pill.WithSize", { count: stats.textures, size: formatBytes(bytes) })
    : game.i18n.format("INPERSON.Pill.Plain", { count: stats.textures });
  _pill.querySelector("span").textContent = label;
  _pill.classList.toggle("is-gm", game.user.isGM);
}

/* -------------------------------------------- */
/*  Socket                                      */
/* -------------------------------------------- */

/** Tell the GM what we blocked, so the panel can show real numbers. */
function reportToGM() {
  if (game.user.isGM) return;
  const stats = getStats();
  const { bytes } = sumKnown(stats.sources);
  game.socket.emit(SOCKET.NAME, {
    type: SOCKET.REPORT,
    userId: game.user.id,
    textures: stats.textures,
    audio: stats.audio,
    bytes
  });
}

function onSocket(payload) {
  if (payload?.type === SOCKET.REPORT) {
    if (!game.user.isGM) return;
    playerReports.set(payload.userId, payload);
    refreshPanel();
    return;
  }
  if (payload?.type === SOCKET.REFRESH) {
    applyStateChange();
    return;
  }
  if (payload?.type === SOCKET.SCREENSAVER) {
    if (!game.user.isGM) return;
    setScreensaverState(payload.userId, !!payload.active);
  }
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

/**
 * Alt+T opens the controls.
 *
 * Picked by measuring, not by assuming: a live world with 276 modules had 98
 * bindings taken, 14 of them Alt combinations. Ctrl+T is out twice over - the
 * browser claims it for a new tab before the page ever sees it, and Rideable
 * uses it too. Alt+T is shared with monks-little-details.release-targets in
 * this world - both fire. Chosen anyway because T for "Tisch" is what people
 * reach for; the collision is resolved by rebinding the other module. Editable.
 */
function registerKeybindings() {
  game.keybindings.register(MODULE_ID, "openPanel", {
    name: "INPERSON.Keybind.OpenPanel.Name",
    hint: "INPERSON.Keybind.OpenPanel.Hint",
    editable: [{ key: "KeyT", modifiers: ["Alt"] }],
    restricted: true,               // GM only - the panel manages other users
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
    onDown: () => {
      openPanel();
      return true;                  // consume the event
    }
  });
}

Hooks.once("init", () => {
  registerSettings();
  registerKeybindings();
  // Must happen before the first canvas draw, otherwise the opening scene is
  // already on the wire before we get a say.
  installWrappers();
  installMonitorWrapper();
});

Hooks.once("ready", async () => {
  // First thing: carry over what the previous module id had stored.
  await migrateFromOldId();

  game.socket.on(SOCKET.NAME, onSocket);

  game.modules.get(MODULE_ID).api = {
    openPanel,
    isActive,
    getStats,
    resetStats,
    refresh: applyStateChange
  };

  refreshTokenSources();
  updatePill();
  reportToGM();
  syncNoCanvas();
  applyPinnedScene();
  // One place that notices the display moving, whatever moved it. Replaces the
  // earlier per-route bookkeeping, which could only ever cover the routes we
  // had thought of.
  installActivityListener();
  installScreensaver();
  // Lock View may not have built its global yet when our `ready` runs; the
  // canvasReady attempt below is the second chance. Both are no-ops without it.
  installLockViewInterop();

  if (isActive()) {
    console.log(`${MODULE_ID} | Table Mode active - scene backgrounds are blocked for this client.`);
  }
});

Hooks.on("canvasReady", () => {
  refreshTokenSources();
  updatePill();
  reportToGM();
  applyRotation();
  installLockViewInterop();
});

// The HUD frame is re-aligned on every pan and rebuilt whenever a HUD opens, so
// the rotation has to be re-asserted afterwards. applyRotation only writes when
// something actually differs, which keeps this cheap enough for frequent hooks.
for (const hook of ["renderHeadsUpDisplayContainer", "canvasPan", "updateScene"]) {
  Hooks.on(hook, () => applyRotation());
}

Hooks.on("updateScene", (scene, changed) => {
  // Lock View fits a scene when it loads, so a rotation changed while standing
  // on the scene needs the fitting run again. Tied to the flag rather than to
  // applyRotation, which also fires on every pan and would pan itself in a loop.
  // `-=rotation` is how a removed flag arrives - setRotation unsets it for 0
  // degrees, so leaving it out would skip exactly the case of straightening a
  // scene back up.
  const rotationChange = changed?.flags?.[MODULE_ID];
  if (rotationChange && (ROTATION_FLAG in rotationChange || `-=${ROTATION_FLAG}` in rotationChange)) {
    onRotationChanged(scene);
  }
});

for (const hook of ["createToken", "updateToken", "deleteToken"]) {
  Hooks.on(hook, () => refreshTokenSources());
}

Hooks.on("renderPlayers", () => updatePill());

/* -------------------------------------------- */
/* -------------------------------------------- */
/*  Scene navigation integration                */
/* -------------------------------------------- */

/** Read the scene id from a context-menu row, whichever list it came from. */
function sceneFromRow(li) {
  const id = li?.dataset?.sceneId ?? li?.dataset?.entryId;
  return id ? game.scenes.get(id) : null;
}

/**
 * Context menu entries: one "show on X" per display that needs steering.
 *
 * No role toggle here, on purpose. `_createContextMenu` builds its items *once*
 * when the navigation renders (`application.mjs:2233`) and hands them to the
 * menu - the hook does not fire again per right-click. A label that reads
 * "pin" or "unpin" would therefore freeze in whatever state it had at render
 * time, and the entry stopped being able to release. Roles live in the panel,
 * which re-renders on every change.
 *
 * Only pinned displays are offered by default: an account that follows
 * activations gets there by itself, so the entry would be noise. The
 * "monitorMenuAll" setting brings the rest back.
 */
function onSceneContextOptions(app, options) {
  const gm = () => game.user.isGM;
  const withScene = fn => (a, b) => {
    const li = b ?? a;                       // v14 passes (li), v13 (event, li)
    const scene = sceneFromRow(li);
    if (scene) fn(scene, li);
  };

  options.push({
    label: "INPERSON.Context.ShowOnSceneDisplay",
    icon: '<i class="fa-solid fa-display"></i>',
    condition: gm, visible: gm,
    callback: withScene((scene, li) => showOnMonitor(scene, { level: li?.dataset?.levelId })),
    onClick: withScene((scene, li) => showOnMonitor(scene, { level: li?.dataset?.levelId }))
  });

  // Neutral label: _createContextMenu builds its items once per navigation
  // render (application.mjs:2233) and the hook does not fire again per
  // right-click, so wording that names the current state would freeze. The
  // state is on the gold badge anyway; reading it inside the callback keeps
  // the toggle correct at click time.
  // Pinning from a scene row means "pin it *here*" - the display is sent to the
  // scene that was right-clicked and held there. Releasing needs no scene.
  const togglePinHere = withScene(scene => setPinned(isPinned() ? false : true, scene));
  options.push({
    label: "INPERSON.Context.TogglePin",
    icon: '<i class="fa-solid fa-thumbtack"></i>',
    condition: gm, visible: gm,
    callback: togglePinHere,
    onClick: togglePinHere
  });

  // Takes the scene that was right-clicked, not the one being viewed. That is
  // the whole point of having it here rather than only in the controls: bring
  // people somewhere without going there yourself first.
  options.push({
    label: "INPERSON.Context.BringPlayers",
    icon: '<i class="fa-solid fa-people-arrows"></i>',
    condition: gm, visible: gm,
    callback: withScene(scene => openPullDialog(scene)),
    onClick: withScene(scene => openPullDialog(scene))
  });

  options.push({
    label: "INPERSON.Context.SetDefaultCompanion",
    icon: '<i class="fa-solid fa-clone"></i>',
    condition: gm, visible: gm,
    callback: withScene(async scene => {
      await setDefaultCompanionScene(scene.id);
      ui.notifications.info(game.i18n.format("INPERSON.Notify.DefaultCompanionSet", { scene: scene.name }));
    }),
    onClick: withScene(async scene => {
      await setDefaultCompanionScene(scene.id);
      ui.notifications.info(game.i18n.format("INPERSON.Notify.DefaultCompanionSet", { scene: scene.name }));
    })
  });

  options.push({
    label: "INPERSON.Context.SetIdleScene",
    icon: '<i class="fa-solid fa-mug-hot"></i>',
    condition: gm, visible: gm,
    callback: withScene(async scene => {
      await game.settings.set(MODULE_ID, SETTINGS.MONITOR_IDLE_SCENE, scene.id);
      ui.notifications.info(game.i18n.format("INPERSON.Notify.IdleSceneSet", { scene: scene.name }));
      refreshPanel();
    }),
    onClick: withScene(async scene => {
      await game.settings.set(MODULE_ID, SETTINGS.MONITOR_IDLE_SCENE, scene.id);
      ui.notifications.info(game.i18n.format("INPERSON.Notify.IdleSceneSet", { scene: scene.name }));
      refreshPanel();
    })
  });
}

Hooks.on("getSceneContextOptions", onSceneContextOptions);
Hooks.on("getSceneNavigationContext", onSceneContextOptions);   // v13 name

/**
 * Mark the scenes the displays are showing.
 *
 * A sweep over the rendered navigation rather than a render hook: no dedicated
 * hook for the scene navigation exists in the v14 source, and the delegated
 * approach also survives partial re-renders. Same pattern FANG uses for its
 * journal buttons.
 */
function markMonitorScenes() {
  const pinnedId = isPinned() ? (getPinnedScene()?.id ?? null) : null;
  const who = getSceneDisplay()?.name ?? "";
  for (const el of document.querySelectorAll("#scene-navigation .scene, #navigation .scene")) {
    const isPinnedHere = !!pinnedId && el.dataset?.sceneId === pinnedId;
    el.classList.toggle("inperson-on-monitor", isPinnedHere);
    let badge = el.querySelector(".inperson-monitor-badge");
    if (isPinnedHere) {
      if (!badge) {
        badge = document.createElement("i");
        badge.className = "fa-solid fa-display inperson-monitor-badge";
        el.appendChild(badge);
      }
      badge.dataset.tooltip = game.i18n.format("INPERSON.Context.OnMonitorTooltip", { who });
    } else badge?.remove();
  }
}

/**
 * Shift+click or Ctrl+click on a scene sends it to the pinned displays.
 *
 * Capture phase, because Foundry's own handler would otherwise view or activate
 * the scene first. Both modifiers were checked against the v14 source before
 * being used: neither `shiftKey` nor `ctrlKey` appears in scene-navigation.mjs,
 * and scene rows are <li> elements, so Ctrl+click opens no browser tab.
 */
function onNavigationClick(event) {
  if (!(event.shiftKey || event.ctrlKey || event.metaKey)) return;
  if (!game.user?.isGM) return;
  const el = event.target?.closest?.("#scene-navigation .scene, #navigation .scene");
  const scene = el?.dataset?.sceneId ? game.scenes.get(el.dataset.sceneId) : null;
  if (!scene) return;
  event.preventDefault();
  event.stopPropagation();
  showOnMonitor(scene, { level: el.dataset.levelId });
}

Hooks.once("ready", () => {
  if (!game.user.isGM) return;
  document.addEventListener("click", onNavigationClick, true);
  markMonitorScenes();
  for (const hook of ["renderSceneNavigation", "canvasReady", "updateScene", "userConnected"]) {
    Hooks.on(hook, () => markMonitorScenes());
  }
});

/* -------------------------------------------- */
/*  Scene configuration: companion scene        */
/* -------------------------------------------- */

/**
 * Fill the two account dropdowns.
 *
 * Settings are registered during `init`, when `game.users` does not exist yet,
 * so `choices` starts empty and is completed here. Foundry reads `choices` when
 * it renders the settings form, which happens long after `setup`.
 */
function fillAccountChoices() {
  const options = { "": game.i18n.localize("INPERSON.Settings.NoAccount") };
  for (const user of game.users) options[user.id] = user.name;
  for (const key of [SETTINGS.MONITOR_BM, SETTINGS.MONITOR_SC]) {
    const setting = game.settings.settings.get(`${MODULE_ID}.${key}`);
    if (setting) setting.choices = options;
  }

  // Scene folders for the screensaver. Filled here rather than at registration
  // because `init` runs before the world's documents exist.
  const folders = { "": game.i18n.localize("INPERSON.Settings.IdleFolder.None") };
  for (const folder of game.folders?.filter(f => f.type === "Scene") ?? []) {
    folders[folder.id] = folder.name;
  }
  const idleFolder = game.settings.settings.get(`${MODULE_ID}.${SETTINGS.IDLE_FOLDER}`);
  if (idleFolder) idleFolder.choices = folders;
}

/**
 * Add a companion-scene picker to the scene configuration window.
 *
 * The field is named `flags.<module>.companionScene`, which is all Foundry needs
 * to store it on the scene when the form is submitted - no submit handler of our
 * own. Injected into the "misc" tab rather than as a tab of its own: one select
 * does not warrant its own tab, and adding to `PARTS` would mean reaching into
 * SceneConfig's own structure.
 */
function onRenderSceneConfig(app, element) {
  if (!game.user.isGM) return;
  const html = element instanceof HTMLElement ? element : element?.[0];
  // `.tab` is essential here. Two elements carry data-tab="misc": the button in
  // the tab bar (<a data-action="tab" data-tab="misc">, templates/generic/
  // tab-navigation.hbs:4) and the content pane (<div class="tab" data-tab="misc">,
  // templates/scene/config/misc.hbs:1). The button comes first in the document,
  // so a bare [data-tab="misc"] appends the fields into the tab bar, where they
  // sit on top of everything.
  const tab = html?.querySelector('.tab[data-tab="misc"]');
  if (!tab || tab.querySelector(".inperson-companion")) return;

  const scene = app.document;
  const current = scene?.getFlag?.(MODULE_ID, COMPANION_FLAG) ?? "";
  const currentRotation = getRotation(scene);
  // Only says anything when Lock View is installed *and* this scene is turned
  // sideways - otherwise there is no interaction to explain.
  const interop = describeInterop(scene);
  const others = game.scenes
    .filter(s => s.id !== scene?.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Own fieldset with a legend, the way Foundry groups this tab itself
  // ("Details", "Audio", "Transition"). A bare form-group appended at the end
  // would sit outside every group and read as an afterthought.
  const escape = s => foundry.utils.escapeHTML?.(s) ?? s;
  const fieldset = document.createElement("fieldset");
  fieldset.className = "inperson-companion";
  fieldset.innerHTML = `
    <legend>${game.i18n.localize("INPERSON.SceneConfig.Legend")}</legend>
    <div class="form-group">
      <label>${game.i18n.localize("INPERSON.SceneConfig.Companion")}</label>
      <div class="form-fields">
        <select name="flags.${MODULE_ID}.${COMPANION_FLAG}">
          <option value="">${game.i18n.localize("INPERSON.SceneConfig.CompanionNone")}</option>
          ${others.map(s => `<option value="${s.id}"${s.id === current ? " selected" : ""}>${escape(s.name)}</option>`).join("")}
        </select>
      </div>
      <p class="hint">${game.i18n.localize("INPERSON.SceneConfig.CompanionHint")}</p>
    </div>
    <div class="form-group">
      <label>${game.i18n.localize("INPERSON.SceneConfig.Rotation")}</label>
      <div class="form-fields">
        <select name="flags.${MODULE_ID}.${ROTATION_FLAG}">
          ${ANGLES.map(a => `<option value="${a}"${a === currentRotation ? " selected" : ""}>${a}&deg;</option>`).join("")}
        </select>
      </div>
      <p class="hint">${game.i18n.localize("INPERSON.SceneConfig.RotationHint")}</p>
      ${interop ? `<p class="notification info inperson-interop">${interop}</p>` : ""}
    </div>`;
  tab.appendChild(fieldset);
}

Hooks.once("setup", () => fillAccountChoices());
Hooks.on("renderSceneConfig", onRenderSceneConfig);
