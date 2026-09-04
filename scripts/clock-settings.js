/**
 * A page of its own for the strip: "Zeit & Wetter".
 *
 * Two reasons it is a page rather than more rows in the settings list.
 *
 * The obvious one: five switches for one strip would have made the flat list
 * read as "the settings of the module" again - the exact fault that gave the
 * table mode and the displays their own pages (see tablemode-settings.js).
 *
 * The one that matters more: **these switches are not all the same kind.** Four
 * of them are per-device and every player owns theirs - what my tablet shows.
 * One is per-world and only a gamemaster may touch it - whether weather is on
 * offer at this table at all. A flat list shows both as identical checkboxes
 * and gives no hint that ticking one changes the evening for everybody. Here
 * they are two labelled groups, and the world one says so.
 *
 * The master switch stays out in the list. It is the one a player reaches for,
 * and a page is a poor place for the thing you use most.
 *
 * Nothing is written until Save, and nothing re-renders while the form is being
 * filled in - a render rebuilds every field from stored values and throws away
 * whatever was ticked. That mistake cost an evening once; see the note in
 * displays-settings.js.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { syncClock, refreshClock } from "./clock.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ClockSettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-clock",
    tag: "form",
    window: {
      title: "INPERSON.Clock.Title",
      icon: "fa-solid fa-clock",
      resizable: true
    },
    position: { width: 560, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-displays"],
    form: { handler: ClockSettings.#onSubmit, closeOnSubmit: true }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/clock-settings.hbs` }
  };

  /** @override */
  async _prepareContext() {
    const get = key => game.settings.get(MODULE_ID, key);
    return {
      strip: get(SETTINGS.CLOCK_STRIP),
      date: get(SETTINGS.CLOCK_DATE),
      time: get(SETTINGS.CLOCK_TIME),
      weather: get(SETTINGS.CLOCK_SHOW_WEATHER),
      season: get(SETTINGS.CLOCK_SHOW_SEASON),
      allowed: get(SETTINGS.CLOCK_WEATHER),
      isGM: game.user.isGM,
      // Said plainly rather than left to be discovered: without a weather
      // module the two weather rows do nothing, while the season keeps working
      // out of the world calendar.
      hasWeatherSource: !!game.modules.get("calendaria")?.active
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const set = (key, value) => game.settings.set(MODULE_ID, key, value);

    await set(SETTINGS.CLOCK_STRIP, !!data.strip);
    await set(SETTINGS.CLOCK_DATE, !!data.date);
    await set(SETTINGS.CLOCK_TIME, !!data.time);
    await set(SETTINGS.CLOCK_SHOW_WEATHER, !!data.weather);
    await set(SETTINGS.CLOCK_SHOW_SEASON, !!data.season);

    // The world switch is not in the form for a player, and a missing field
    // must not be read as "off" - that would let any player silently turn the
    // weather off for the whole table by opening this page and saving.
    if (game.user.isGM) await set(SETTINGS.CLOCK_WEATHER, !!data.allowed);

    syncClock();
    refreshClock({ force: true });
  }
}

export function openClockSettings() {
  return new ClockSettings().render({ force: true });
}
