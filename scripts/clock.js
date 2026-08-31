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
 * Seasons carry `dayStart`/`dayEnd` as days of the year, so the month lengths
 * have to be summed. Month and day components are zero-based.
 */
function dayOfYear(calendar, components) {
  const months = calendar.months?.values ?? [];
  let day = components.dayOfMonth + 1;
  for (let i = 0; i < components.month && i < months.length; i++) day += months[i].days ?? 0;
  return day;
}

/** The season the current date falls in, or null when the calendar names none. */
function currentSeason(calendar, components) {
  const seasons = calendar.seasons?.values ?? [];
  if (!seasons.length) return null;
  const day = dayOfYear(calendar, components);
  const hit = seasons.find(s => {
    const from = s.dayStart, to = s.dayEnd;
    if (from == null || to == null) return false;
    // Winter wraps around the turn of the year, so from > to is not an error.
    return from <= to ? (day >= from && day <= to) : (day >= from || day <= to);
  });
  return hit ? { name: game.i18n.localize(hit.name), icon: hit.icon } : null;
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
    label: game.i18n.localize(zone.label ?? ""),
    icon: zone.icon ?? "fa-cloud",
    temperature: Number.isFinite(zone.temperature) ? zone.temperature : null
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

/** One chip: an icon and a label, used for weather and season alike. */
function chip(className, icon, text, extra = "") {
  return `<span class="${className}"><i class="fa-solid ${icon}"></i><span>${text}</span>${extra}</span>`;
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

/** Write the current values into an existing strip. */
function fillStrip(element, now) {
  const withWeather = game.settings.get(MODULE_ID, SETTINGS.CLOCK_WEATHER);
  const parts = [
    `<span class="inperson-clock-date">${now.date}</span>`,
    `<span class="inperson-clock-time">${now.time}</span>`
  ];

  if (withWeather && now.weather) {
    const degrees = now.weather.temperature === null
      ? ""
      : `<span class="inperson-clock-temp">${now.weather.temperature}&deg;C</span>`;
    parts.push(chip("inperson-clock-chip", now.weather.icon, now.weather.label, degrees));
  }
  if (withWeather && now.season) {
    parts.push(chip("inperson-clock-season", (now.season.icon ?? "fa-leaf").replace(/^fas /, ""), now.season.name));
  }

  element.innerHTML = parts.join("");
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

  // The weather lives in another module's world setting, so its change arrives
  // as a generic setting update rather than a hook of its own.
  Hooks.on("updateSetting", setting => {
    if (setting?.key === `${WEATHER_SOURCE.module}.${WEATHER_SOURCE.setting}`) refreshClock({ force: true });
  });
}
