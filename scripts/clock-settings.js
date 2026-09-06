/**
 * A page of its own for the strip: "Zeit & Wetter".
 *
 * Five switches for one strip would have made the flat settings list read as
 * "the settings of the module" again - the exact fault that gave the table mode
 * and the displays their own pages (see tablemode-settings.js).
 *
 * All of them are the gamemaster's and all of them are world-scoped. That was
 * not the first arrangement: four were per-device, on the reasoning that a
 * player should own what their own screen shows. The table decided otherwise,
 * and on reflection that is right - what the strip carries is a presentation
 * choice for the whole group, like the scene everyone is looking at. One answer
 * for the table also means nobody has to be talked through a settings page
 * mid-session.
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
      weather: get(SETTINGS.CLOCK_WEATHER),
      season: get(SETTINGS.CLOCK_SHOW_SEASON),
      sky: get(SETTINGS.CLOCK_SKY),
      // Ausgerechnet statt im Template verglichen: Ein `eq`-Helfer ist nicht
      // in jeder Foundry-Fassung da, und ein fehlender Helfer wirft beim
      // Zeichnen, statt nur falsch auszusehen.
      skySourceOptions: [
        { value: "eigen", label: "INPERSON.Clock.SkySource.Own" },
        { value: "calendaria", label: "INPERSON.Clock.SkySource.Calendaria" }
      ].map(o => ({ ...o, selected: get(SETTINGS.CLOCK_SKY_SOURCE) === o.value })),
      skyTimes: get(SETTINGS.CLOCK_SKY_TIMES),
      motionOptions: [
        { value: "auto", label: "INPERSON.Clock.Motion.Auto" },
        { value: "immer", label: "INPERSON.Clock.Motion.Always" },
        { value: "nie", label: "INPERSON.Clock.Motion.Never" }
      ].map(o => ({ ...o, selected: get(SETTINGS.CLOCK_SKY_MOTION) === o.value })),
      // Ohne Calendaria hat die Wahl keinen zweiten Posten - dann steht sie
      // gar nicht erst da, statt eine Möglichkeit vorzugaukeln.
      hasCalendaria: !!game.modules.get("calendaria")?.active,
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
    await set(SETTINGS.CLOCK_WEATHER, !!data.weather);
    await set(SETTINGS.CLOCK_SHOW_SEASON, !!data.season);
    await set(SETTINGS.CLOCK_SKY, !!data.sky);
    if (data.skySource) await set(SETTINGS.CLOCK_SKY_SOURCE, String(data.skySource));
    await set(SETTINGS.CLOCK_SKY_TIMES, !!data.skyTimes);
    if (data.skyMotion) await set(SETTINGS.CLOCK_SKY_MOTION, String(data.skyMotion));

    syncClock();
    refreshClock({ force: true });
  }
}

export function openClockSettings() {
  if (!game.user.isGM) return;
  return new ClockSettings().render({ force: true });
}
