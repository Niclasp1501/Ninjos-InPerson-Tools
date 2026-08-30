# Agent Notes

## Versioning

`<foundry-major>.<YYMM>.<patch>` — e.g. `14.2609.1` for the first September 2026
release targeting Foundry v14. Tags carry a `v` prefix. Never decrease.

The first number is the **Foundry** major version, not ours. It was briefly set
to 15 by mistake; the validator now rejects a mismatch with
`compatibility.verified`.

## Before every release

```bash
node tools/validate.mjs
```

Checks JS syntax, JSON validity, i18n key coverage, locale parity, CSS classes
and manifest paths. Each check exists because something slipped through during
development.

## What the module hooks into, and why exactly there

| Target | Reason |
|---|---|
| `TextureLoader#loadTexture` | The only place `PIXI.Assets.load` appears in the entire client (`canvas/loader.mjs:357`). Every download path funnels through it. |
| `TextureLoader#load` | Hides the progress bar. Foundry shows it even for cache hits. |
| `Sound#load` | Audio. Sets `STATES.FAILED`, which is what a real load failure leaves behind. |
| `Scene#_onActivate` | The automatic pull, and only that. **Not** `view()` — that is also how a display gets moved deliberately. |
| `PlaylistDirectory#updateTimestamps` | Swallows a core crash that blocked audio provokes (missing null check at `playlist-directory.mjs:782`). |

## Traps that cost time here

**Hook order.** Foundry draws the canvas during `setup`, *before* `ready`. A
lookup table filled in `ready` is empty for the first draw. Prefer asking the
documents directly over precomputing.

**Two elements share `data-tab`.** The tab button
(`<a data-action="tab" data-tab="misc">`) comes before the content pane
(`<div class="tab" data-tab="misc">`). Always select `.tab[data-tab=…]`.

**Context menu items are built once per render** (`application.mjs:2233`), not
per right-click. A label naming the current state freezes. Use neutral wording
and read the state inside the callback.

**`data-action` on a `<select>` fires on click**, i.e. when the list opens. Bind
`change` by hand in `_onRender` instead.

**Do not `destroy()` placeholder textures.** Sprites of the scene being torn
down still hold references; destroying first makes Foundry's teardown throw.

**Scroll positions** need `PARTS[…].scrollable` declared, otherwise every button
click jumps the list back to the top.

**A removed flag arrives as `-=name`.** `updateScene` reports an unset flag under
the deletion key, not the plain one. `setRotation` unsets for 0 degrees, so
checking only `changed.flags[MODULE_ID].rotation` misses exactly the case of
straightening a scene back up. Test both keys.

**The viewbox correction runs on the sending client.** After deploying, reload
the *display* clients, not just a GM window: the display computes and emits the
extent, the GM only draws what arrives. Cost an investigation on 2026-08-29 -
the frame stayed crooked on a GM window that was already running the new code.

**Lock View interop is patched on instances, not prototypes** (`lockview.js`).
`lockView.socket` and `lockView.sceneHandler` are singletons built during its
own startup, so the patch has to wait for the global to exist - hence the
attempt from both `ready` and `canvasReady`. Everything there is guarded: without
Lock View the file does nothing at all.

## Measured, not assumed

Blocking was verified on a live server: one "preload scene" click transferred
**58.86 MB** with the module off and **0.00 MB** with it on, measured through
`performance.getEntriesByType("resource")` in the player's console.
`transferSize` is real network traffic; `decodedBodySize` reveals cache hits.
Use that method for any future claim about bandwidth.

## Known and accepted

`ParticleEffect#lookupTexture` (`particle-generator.mjs:2986`) bypasses the
wrapper via `PIXI.Texture.from`. Affects weather and particle art under
`ui/particles/` — 68 KB in total, cached and local. Not worth a second wrapper.
