/**
 * First-run window: what this module is for, and where the rest of them live.
 *
 * Two buttons and one stored boolean, and that is the whole state machine.
 * "Don't show again" sets it and the window never returns. "Later" only
 * closes; it comes back next time. Clicking away or pressing Escape counts as
 * "Later" - never as consent.
 *
 * **Gamemasters only.** Every tool in here is set up by the GM: blocking map
 * downloads, steering the two displays, rotating scenes. A player can act on
 * none of it, so for them the window would be a dialog in the way and nothing
 * else.
 *
 * The switch is client-scoped, so each GM dismisses it for their own machine
 * rather than for the world. It is deliberately not in the settings list - the
 * button inside the window is the place for that, and a setting nobody needs
 * to find twice does not belong in a list that is meant to stay short
 * (KONZEPT-werkzeugkasten.md).
 *
 * The file is meant to be copied into the other Ninjo modules unchanged apart
 * from the MODUL block. Copied rather than shared: each module stands on its
 * own in the package listing, and thirty duplicated lines are cheaper than a
 * dependency between two separately published packages - the same reasoning as
 * in sheet-only.js.
 */

import { MODULE_ID } from "./const.js";

/* ── The only part that differs per module ────────────────────────── */

const MODUL = {
  name: "Ninjo's In-Person Tools",
  icon: "fa-solid fa-tv",
  slug: "inperson-tools",                 // https://<forge>/modules/<slug>
  untertitel: "INPERSON.Willkommen.Untertitel",
  einleitung: "INPERSON.Willkommen.Einleitung",
  punkte: [
    "INPERSON.Willkommen.Punkt1",
    "INPERSON.Willkommen.Punkt2",
    "INPERSON.Willkommen.Punkt3"
  ],
  start: "INPERSON.Willkommen.Start"
};

const FORGE = "https://ninjos-forge.web.app";
const EINSTELLUNG = "willkommenGesehen";

/* ── Identical in every module from here on ───────────────────────── */

/** Localise when it looks like a translation key, otherwise pass through. */
function text(wert) {
  return /^[A-Z0-9]+\.[A-Za-z0-9.]+$/.test(wert) ? game.i18n.localize(wert) : wert;
}

export function willkommenEinrichten() {
  game.settings.register(MODULE_ID, EINSTELLUNG, {
    name: "INPERSON.Willkommen.Setting",
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });
}

/** A little CSS, injected once, so no stylesheet is needed per module. */
function stilEinhaengen() {
  if (document.getElementById("ninjo-willkommen-stil")) return;
  const s = document.createElement("style");
  s.id = "ninjo-willkommen-stil";
  s.textContent = `
    .ninjo-willkommen { font-size: 0.95rem; line-height: 1.5; color: inherit; }

    /* Markenkopf: das Einzige, was das Fenster von einem beliebigen
       Foundry-Dialog unterscheidet. Dunkelrot mit Goldkante, wie FANG und
       NDRS - so sieht man an jedem Fenster, von wem es kommt. */
    .ninjo-willkommen-kopf {
      display: flex; gap: 0.9rem; align-items: center;
      margin: -0.5rem -0.5rem 0.9rem; padding: 0.7rem 0.9rem;
      border-bottom: 2px solid #D4AF37;
      background: linear-gradient(180deg, #8B0000 0%, #5e0000 100%);
      color: #fff;
    }
    .ninjo-willkommen-kopf img {
      flex: 0 0 auto; width: 60px; height: 60px;
      object-fit: contain;
      filter: drop-shadow(0 2px 3px rgb(0 0 0 / 45%));
    }
    .ninjo-willkommen-kopf h2 {
      margin: 0; border: none; padding: 0;
      color: #D4AF37; font-size: 1.05rem; font-weight: 700; line-height: 1.2;
    }
    .ninjo-willkommen-kopf p {
      margin: 0.15rem 0 0; color: rgb(255 255 255 / 85%); font-size: 0.82rem;
    }

    .ninjo-willkommen p { margin: 0 0 0.7rem; }
    .ninjo-willkommen ul { margin: 0 0 0.9rem; padding-left: 1.2rem; }
    .ninjo-willkommen li { margin: 0.25rem 0; }
    .ninjo-willkommen-start {
      margin: 0 0 0.9rem; padding: 0.5rem 0.7rem;
      border-left: 3px solid #D4AF37;
      background: rgb(212 175 55 / 10%); color: inherit;
    }
    .ninjo-willkommen-forge {
      display: flex; gap: 0.6rem; align-items: center;
      margin-top: 0.4rem; padding-top: 0.7rem;
      border-top: 1px solid rgb(212 175 55 / 35%);
      font-size: 0.85rem; color: inherit;
    }
    .ninjo-willkommen-forge i { color: #D4AF37; }
    .ninjo-willkommen-forge a { font-weight: 600; }
  `;
  document.head.appendChild(s);
}

export async function willkommenZeigen() {
  if (!game.user.isGM) return;
  if (game.settings.get(MODULE_ID, EINSTELLUNG)) return;
  stilEinhaengen();

  const punkte = MODUL.punkte.map(p => `<li>${text(p)}</li>`).join("");
  const logo = `modules/${MODULE_ID}/assets/ninjo.png`;
  const inhalt = `
    <div class="ninjo-willkommen">
      <div class="ninjo-willkommen-kopf">
        <img src="${logo}" alt="">
        <div>
          <h2>${MODUL.name}</h2>
          <p>${text(MODUL.untertitel)}</p>
        </div>
      </div>
      <p>${text(MODUL.einleitung)}</p>
      <ul>${punkte}</ul>
      <p class="ninjo-willkommen-start">${text(MODUL.start)}</p>
      <div class="ninjo-willkommen-forge">
        <i class="fa-solid fa-hammer"></i>
        <span>${game.i18n.localize("INPERSON.Willkommen.Forge")}
          <a href="${FORGE}/modules/${MODUL.slug}" target="_blank" rel="noopener">Ninjo's Forge</a>
        </span>
      </div>
    </div>`;

  const antwort = await foundry.applications.api.DialogV2.wait({
    window: { title: MODUL.name, icon: MODUL.icon },
    position: { width: 480 },
    content: inhalt,
    buttons: [
      {
        action: "nie",
        label: "INPERSON.Willkommen.Nie",
        icon: "fa-solid fa-check",
        default: true
      },
      {
        action: "spaeter",
        label: "INPERSON.Willkommen.Spaeter",
        icon: "fa-solid fa-xmark"
      }
    ],
    rejectClose: false
  });

  if (antwort === "nie") await game.settings.set(MODULE_ID, EINSTELLUNG, true);
}
