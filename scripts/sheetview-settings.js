/**
 * Die Seite der Blattansicht: der Beta-Schalter und wer sie bekommt.
 *
 * Bis hierher traf der Schalter *alle* Spieler mit Charakter - auch den am
 * Laptop, der seine Szenenliste braucht. Sheet Only wählt Konten einzeln, und
 * das ist richtig: Ob jemand nur sein Blatt sieht, hängt am Gerät in seiner
 * Hand, nicht an seiner Rolle. Das Muster ist dasselbe wie beim Tischmodus.
 *
 * Spielleiter stehen nicht in der Liste. Sie brauchen die Oberfläche, die
 * hier verschwindet; ein Spielleiter ohne Szenenliste kann den Abend nicht
 * führen.
 *
 * Nichts wird vor Speichern geschrieben, und nichts zeichnet während des
 * Ausfüllens neu - siehe displays-settings.js.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { characterOf } from "./figuren.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class SheetViewSettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-sheetview",
    tag: "form",
    window: { title: "INPERSON.SheetView.Title", icon: "fa-solid fa-tablet-screen-button", resizable: true },
    position: { width: 560, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-displays"],
    form: { handler: SheetViewSettings.#onSubmit, closeOnSubmit: true },
    actions: { reset: SheetViewSettings.#onReset }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/sheetview-settings.hbs`, scrollable: [".inperson-partner-list"] }
  };

  /** @override */
  async _prepareContext() {
    const chosen = game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_USERS) ?? {};
    const users = game.users
      .filter(u => !u.isGM)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(u => {
        const actor = characterOf(u);
        return {
          id: u.id,
          name: u.name,
          online: u.active,
          checked: chosen[u.id] === true,
          actorName: actor?.name ?? null,
          actorImg: actor?.img ?? "icons/svg/mystery-man.svg"
        };
      });
    return {
      enabled: game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW),
      noCanvas: game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_NO_CANVAS),
      chatOnUse: game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_CHAT_ON_USE),
      users,
      hasUsers: users.length > 0
    };
  }

  /**
   * Leisten eines Kontos zurücksetzen - sofort, nicht erst beim Speichern.
   *
   * Es ist eine Handlung, keine Einstellung: Der Spielleiter steht neben dem
   * Tablet, auf dem die Leiste außer Reichweite liegt, und will sie jetzt
   * zurück. Der Stempel bleibt stehen; ein Gerät, das gerade aus ist, räumt
   * beim nächsten Laden auf.
   */
  static async #onReset(event, target) {
    event.preventDefault();
    const userId = target.dataset.user;
    const user = game.users.get(userId);
    if (!user) return;
    const stempel = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_RESET) ?? {});
    stempel[userId] = Date.now();
    await game.settings.set(MODULE_ID, SETTINGS.SHEETVIEW_RESET, stempel);
    ui.notifications.info(game.i18n.format("INPERSON.SheetView.ResetDone", { name: user.name }));
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const chosen = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("user.") && value) chosen[key.slice(5)] = true;
    }
    await game.settings.set(MODULE_ID, SETTINGS.SHEETVIEW_CHAT_ON_USE, !!data.chatOnUse);
    await game.settings.set(MODULE_ID, SETTINGS.SHEETVIEW_NO_CANVAS, !!data.noCanvas);
    await game.settings.set(MODULE_ID, SETTINGS.SHEETVIEW_USERS, chosen);
    // Der Hauptschalter zuletzt: Sein onChange baut die Ansicht auf den
    // Clients, und die soll die Liste schon kennen.
    await game.settings.set(MODULE_ID, SETTINGS.SHEETVIEW, !!data.enabled);
  }
}

export function openSheetViewSettings() {
  if (!game.user.isGM) return;
  return new SheetViewSettings().render({ force: true });
}
