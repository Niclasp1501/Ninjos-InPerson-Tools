/**
 * Date, time and weather for players who have no interface left.
 *
 * The problem this solves is described in sheet-only.js: a player in the
 * sheet-only view has no `#interface`, so a calendar module's HUD is not hidden
 * by a setting - it is simply not there. At an in-person table that is exactly
 * the wrong way round. The people around the table are the ones who ask what
 * time it is.
 *
 * We read the values rather than borrow the display:
 *
 *   game.time.components                              core, synced to every client
 *   game.time.calendar                                month names, seasons, yearZero
 *   game.settings.get("calendaria", "currentWeather") world setting, so players see it
 *
 * All three reach a player without a canvas. Reading them costs us nothing and
 * leaves the other module's markup alone - re-parenting its HUD would mean
 * fighting its re-render on every tick, and it ships every one to three weeks.
 *
 * It also means we choose the words. The bundled Harptos calendar names its
 * weekdays "Onesday" to "Tenday" as literal strings, with no translation keys
 * behind them, so nothing but our own formatting can put German in front of a
 * player.
 *
 * **Redrawing is tied to the displayed minute, not to the event.** With a
 * real-time clock running at a multiplier, `updateWorldTime` fires every second;
 * the strip would rebuild sixty times for one visible change, on the very
 * clients that have the least to spare.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { mountInSheetOnly, unmountFromSheetOnly } from "./sheet-only.js";

const MOUNT_ID = "clock";

/** The calendar module we read weather from. Absent is a normal state. */
const WEATHER_SOURCE = { module: "calendaria", setting: "currentWeather" };

/** Last rendered stamp, so an unchanged minute costs nothing. */
let lastStamp = null;

/* ── Reading ─────────────────────────────────────────────────────── */

/**
 * Day of the year for the current date.
 *
 * Month and day components are zero-based, so the day counts from one and the
 * months before the current one are summed.
 */
function dayOfYear(calendar, components) {
  const months = calendar.months?.values ?? [];
  let day = components.dayOfMonth + 1;
  for (let i = 0; i < components.month && i < months.length; i++) day += months[i].days ?? 0;
  return day;
}

/** Does `value` fall inside `from`..`to`, where a range may wrap past the year end? */
function inRange(value, from, to) {
  return from <= to ? (value >= from && value <= to) : (value >= from || value <= to);
}

/**
 * The season the current date falls in, or null when none can be determined.
 *
 * Three shapes have to be handled, because calendars disagree about how a
 * season is written down - found the hard way, by a strip that showed the
 * season under Calendaria and nothing at all under Foundry's own calendar:
 *
 *   components.season          core calendars hand the index over directly
 *   dayStart / dayEnd          Calendaria counts days of the *year* (79..170)
 *   monthStart / monthEnd      CalendarData5e names months, 1-based, days null
 *
 * The index is preferred where it exists: it is the calendar's own answer
 * rather than our reconstruction of it.
 */
function currentSeason(calendar, components) {
  const seasons = calendar.seasons?.values ?? [];
  if (!seasons.length) return null;

  const benannt = s => ({ name: game.i18n.localize(s.name), icon: s.icon });

  if (Number.isInteger(components.season) && seasons[components.season]) {
    return benannt(seasons[components.season]);
  }

  const tag = dayOfYear(calendar, components);
  const monat = components.month + 1;   // season bounds are 1-based
  const treffer = seasons.find(s => {
    if (s.dayStart != null && s.dayEnd != null) return inRange(tag, s.dayStart, s.dayEnd);
    if (s.monthStart != null && s.monthEnd != null) return inRange(monat, s.monthStart, s.monthEnd);
    return false;
  });
  return treffer ? benannt(treffer) : null;
}

/**
 * Current weather, or null.
 *
 * The setting holds one entry per climate zone. Which zone is the right one is
 * the calendar module's business, not ours, so the first entry is taken unless
 * the temperate zone is present - that is what its own HUD shows by default.
 */
function currentWeather() {
  if (!game.modules.get(WEATHER_SOURCE.module)?.active) return null;
  let raw;
  try {
    raw = game.settings.get(WEATHER_SOURCE.module, WEATHER_SOURCE.setting);
  } catch {
    return null;   // setting gone after an update - not worth an error
  }
  const zone = raw?.temperate ?? Object.values(raw ?? {})[0];
  if (!zone) return null;
  return {
    label: game.i18n.localize(String(zone.label ?? "")),
    // The long form, for the tooltip. Calendaria's own HUD shows it as
    // "Windig - Starke Winde", and the strip has room for the first half only.
    description: zone.description ? game.i18n.localize(String(zone.description)) : null,
    icon: zone.icon ?? "fa-cloud",
    temperature: Number.isFinite(zone.temperature) ? zone.temperature : null,
    // Direction is degrees, speed a step on Calendaria's own scale. The degrees
    // are turned into a compass point because that is stable arithmetic; the
    // step is shown as a step, because converting it to km/h would mean copying
    // a table that belongs to another module and rots when they change it.
    wind: zone.wind ? { direction: zone.wind.direction, speed: zone.wind.speed } : null,
    precipitation: zone.precipitation?.type ? zone.precipitation : null
  };
}

/**
 * Everything the strip shows, or null when no world calendar is available.
 *
 * @returns {{stamp: string, date: string, time: string, weather: object|null, season: object|null}|null}
 */
export function readClock() {
  const calendar = game.time?.calendar;
  const components = game.time?.components;
  if (!calendar || !components) return null;

  const month = calendar.months?.values?.[components.month];
  const monthName = month ? game.i18n.localize(month.name) : "";

  // yearZero is the year at worldTime 0; components.year counts from there.
  // Measured against the calendar module's own HUD: 1437 + 1501 = 2938.
  const year = components.year + (calendar.years?.yearZero ?? 0);

  const date = `${components.dayOfMonth + 1} ${monthName}, ${year}`;
  const time = `${String(components.hour).padStart(2, "0")}:${String(components.minute).padStart(2, "0")}`;

  return {
    stamp: `${date}|${time}`,
    date,
    time,
    weather: currentWeather(),
    season: currentSeason(calendar, components)
  };
}

/* ── Drawing ─────────────────────────────────────────────────────── */

/**
 * One chip: an icon and a label, used for weather and season alike.
 *
 * `tooltip` is HTML and goes in as `data-tooltip-html`, which is the attribute
 * Foundry's tooltip manager reads first (tooltip-manager.mjs:138).
 */
function chip(className, icon, text, extra = "", tooltip = "") {
  const hint = tooltip ? ` data-tooltip-html="${foundry.utils.escapeHTML(tooltip)}"` : "";
  return `<span class="${className}"${hint}><i class="fa-solid ${icon}"></i>`
    + `<span>${escape(text)}</span>${extra}</span>`;
}

/** Build the strip, or null when there is nothing to show. */
function buildStrip() {
  const now = readClock();
  if (!now) return null;

  const element = document.createElement("div");
  element.className = "inperson-clock";
  fillStrip(element, now);
  return element;
}

/** The compass point for a bearing in degrees. */
function compass(degrees) {
  if (!Number.isFinite(degrees)) return null;
  const punkte = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
  return punkte[Math.round(((degrees % 360) + 360) % 360 / 45) % 8];
}

const escape = s => foundry.utils.escapeHTML?.(String(s ?? "")) ?? String(s ?? "");

/**
 * What the weather chip says when you rest on it.
 *
 * The strip has room for one word. Everything the calendar module actually
 * knows - the long description, the wind, what is falling out of the sky - fits
 * here instead of being thrown away.
 */
function weatherTooltip(weather) {
  const zeilen = [`<strong>${escape(weather.label)}</strong>`];
  if (weather.description) zeilen.push(escape(weather.description));
  if (weather.temperature !== null) zeilen.push(`${weather.temperature}&nbsp;&deg;C`);
  if (weather.wind) {
    const richtung = compass(weather.wind.direction);
    const teile = [];
    if (richtung) teile.push(game.i18n.format("INPERSON.Clock.WindFrom", { where: richtung }));
    if (Number.isFinite(weather.wind.speed)) {
      teile.push(game.i18n.format("INPERSON.Clock.WindForce", { n: weather.wind.speed }));
    }
    if (teile.length) zeilen.push(teile.join(" &middot; "));
  }
  return zeilen.join("<br>");
}

/** Write the current values into an existing strip. */
function fillStrip(element, now) {
  const get = key => game.settings.get(MODULE_ID, key);
  // The world gate first: what a table has switched off is not a matter of
  // taste on any one device.
  const erlaubt = get(SETTINGS.CLOCK_WEATHER);
  const parts = [];

  if (get(SETTINGS.CLOCK_DATE)) {
    parts.push(`<span class="inperson-clock-date">${escape(now.date)}</span>`);
  }
  if (get(SETTINGS.CLOCK_TIME)) {
    parts.push(`<span class="inperson-clock-time">${escape(now.time)}</span>`);
  }

  if (erlaubt && get(SETTINGS.CLOCK_SHOW_WEATHER) && now.weather) {
    const degrees = now.weather.temperature === null
      ? ""
      : `<span class="inperson-clock-temp">${now.weather.temperature}&deg;C</span>`;
    parts.push(chip("inperson-clock-chip", now.weather.icon, now.weather.label, degrees,
      weatherTooltip(now.weather)));
  }
  if (erlaubt && get(SETTINGS.CLOCK_SHOW_SEASON) && now.season) {
    parts.push(chip("inperson-clock-season", (now.season.icon ?? "fa-leaf").replace(/^fas /, ""),
      now.season.name, "", escape(now.season.name)));
  }

  element.innerHTML = parts.join("");
  // Everything switched off is not an empty box in the corner of the screen.
  element.toggleAttribute("hidden", parts.length === 0);
}

/** Redraw the mounted strip if - and only if - the displayed minute moved. */
export function refreshClock({ force = false } = {}) {
  const element = document.querySelector(".inperson-clock");
  if (!element) return;
  const now = readClock();
  if (!now) return;
  if (!force && now.stamp === lastStamp) return;
  lastStamp = now.stamp;
  fillStrip(element, now);
}

/* ── Wiring ──────────────────────────────────────────────────────── */

/** Show or hide the strip according to this client's own setting. */
export function syncClock() {
  if (game.settings.get(MODULE_ID, SETTINGS.CLOCK_STRIP)) {
    lastStamp = null;
    mountInSheetOnly(MOUNT_ID, buildStrip);
  } else {
    unmountFromSheetOnly(MOUNT_ID);
  }
}

export function installClock() {
  syncClock();

  Hooks.on("updateWorldTime", () => refreshClock());

  // A slow second look, because the first one can be too early.
  //
  // Measured on a real sheet-only client: the strip read "31 Juli, -9" all
  // evening while the world stood at "1 Eleasis, 1492". Calendaria installs its
  // Harptos calendar after our `ready` runs, so the first draw used Foundry's
  // default Gregorian one - and nothing ever corrected it, because the strip
  // redraws on `updateWorldTime` and the game was paused. A date that is wrong
  // and never moves is worse than no date at all: nobody doubts a clock that
  // looks like a clock.
  //
  // Ten seconds, and only a comparison - `refreshClock` builds nothing unless
  // the displayed minute actually changed. That is far below the per-second
  // redraw this file was written to avoid, and it repairs every late arrival,
  // not only this one.
  // Quickly at first, slowly afterwards. Ten seconds of a wrong date is worst
  // exactly when it happens: the screen has just loaded and somebody is looking
  // straight at it. A once-a-second check for the first quarter minute costs a
  // string comparison and closes that window; after that the slow watch is
  // enough, because by then only a real change can move the display.
  let schnell = 0;
  const aufwaermen = setInterval(() => {
    refreshClock();
    if (++schnell >= 15) clearInterval(aufwaermen);
  }, 1000);

  setInterval(() => refreshClock(), 10_000);

  // The weather lives in another module's world setting, so its change arrives
  // as a generic setting update rather than a hook of its own.
  Hooks.on("updateSetting", setting => {
    if (setting?.key === `${WEATHER_SOURCE.module}.${WEATHER_SOURCE.setting}`) refreshClock({ force: true });
  });
}
