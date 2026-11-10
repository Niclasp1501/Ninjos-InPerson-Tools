/**
 * „In-Person einrichten“: ein Fenster für alles, was man einmal für einen
 * Tisch einstellt, in der Reihenfolge, in der man es tut.
 *
 * Ninjo, 11.11.2026: „die Einstellungsmenüs sind teilweise sehr
 * unübersichtlich, wenn man den Tischmodus einrichten will.“ Bis 14.2611.81
 * gab es dafür fünf Fenster, und die Rolle eines Kontos stand an drei Stellen:
 * Monitore unter „Szenen-Monitore“, der Tischmodus je Spieler in der
 * Steuerung, die Blattansicht in ihrem eigenen Fenster. Dazu hängte Premium
 * sieben Abschnitte an die Monitorseite, auch Blende und Bühnen, die mit den
 * Monitoren nichts zu tun haben.
 *
 * Reiter:  Konten und Geräte · Monitore · Tablets · Ton · Bühnen und Blende ·
 *          Feinheiten. Ton und Bühnen erscheinen nur, wenn ein Zusatzmodul
 *          dort etwas einträgt (erweiterung.js, Seiten "ton" und "buehne").
 *
 * **Keine Einstellung hat ihren Schlüssel gewechselt.** Was eine Welt
 * gespeichert hat, gilt weiter. Die alten Menüeinträge öffnen den passenden
 * Reiter.
 *
 * Wie vorher: Nichts wird vor „Speichern“ geschrieben, und nichts zeichnet
 * während des Ausfüllens neu, weil ein Neuzeichnen jedes Feld aus den
 * gespeicherten Werten neu baut und Eingetipptes verwirft.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { still } from "./stille.js";
import { openPanel } from "./panel.js";
import { characterOf } from "./figuren.js";
import { listCompanionPairs, setCompanionScenes, addCompanionScene } from "./monitor.js";
import { buildSceneField } from "./scene-field.js";
import { previewCover } from "./screensaver.js";
import { einstellungsTeile, hatEinstellungsTeile } from "./erweiterung.js";
import { syncClock, refreshClock } from "./clock.js";
import { syncTradeButton } from "./trade-start.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Die Reiter, in Einrichtungsreihenfolge. */
export const REITER = ["konten", "monitore", "tablets", "ton", "buehne", "feinheiten"];
const SYMBOLE = {
  konten: "fa-solid fa-users", monitore: "fa-solid fa-display", tablets: "fa-solid fa-tablet-screen-button",
  ton: "fa-solid fa-volume-high", buehne: "fa-solid fa-masks-theater", feinheiten: "fa-solid fa-sliders"
};
/** Reiter, die nur zeigen, was Zusatzmodule eintragen. */
const NUR_ZUSATZ = ["ton", "buehne"];

/* -------------------------------------------- */
/*  Konten und Geräte: die Regel                 */
/* -------------------------------------------- */

/**
 * Aus den Zeilen der Kontentabelle die Werte der bisherigen Einstellungen.
 *
 * Für sich, damit der Test sie ohne Foundry prüfen kann. Monitore bekommen
 * weder Tischmodus noch Blattansicht: Ihre Felder sind gesperrt und kommen
 * nicht mit, und eine gespeicherte Wahl für sie bleibt, wie sie war.
 * Spielleiter stehen nicht in der Tabelle; ihre Einträge bleiben unberührt.
 * @param {object} daten Formulardaten
 * @param {string[]} kontoIds Die Konten der Tabelle
 * @param {object} bisher `{ forced, sheetUsers }` wie gespeichert
 * @returns {{sc: string, bm: string, forced: object, sheetUsers: object}}
 */
export function kontenAuswerten(daten, kontoIds, bisher = {}) {
  let sc = "", bm = "";
  const forced = { ...(bisher.forced ?? {}) };
  const sheetUsers = {};
  for (const [id, an] of Object.entries(bisher.sheetUsers ?? {})) if (an && !kontoIds.includes(id)) sheetUsers[id] = true;

  for (const id of kontoIds) {
    const rolle = daten[`rolle.${id}`];
    if (rolle === "sc" && !sc) { sc = id; continue; }
    if (rolle === "bm" && !bm) { bm = id; continue; }
    if (rolle === "sc" || rolle === "bm") continue;   // ein zweiter Monitor derselben Art zählt nicht
    const tisch = daten[`tisch.${id}`];
    if (tisch === "an") forced[id] = true;
    else if (tisch === "aus") forced[id] = false;
    else delete forced[id];
    if (daten[`blatt.${id}`]) sheetUsers[id] = true;
  }
  return { sc, bm, forced, sheetUsers };
}

/* -------------------------------------------- */
/*  Das Fenster                                  */
/* -------------------------------------------- */

export class InPersonEinrichten extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-einrichten",
    tag: "form",
    window: { title: "INPERSON.Setup.Title", icon: "fa-solid fa-gears", resizable: true },
    position: { width: 820, height: 760 },
    classes: ["ninjos-inperson-tools", "inperson-panel", "themed", "theme-light", "inperson-displays", "inperson-einrichten"],
    form: { handler: InPersonEinrichten.#speichern, closeOnSubmit: true },
    actions: {
      openControls: InPersonEinrichten.#steuerung,
      zuKonten: InPersonEinrichten.#zuKonten,
      resetBar: InPersonEinrichten.#leisteZuruecksetzen,
      pickLogo: InPersonEinrichten.#logoWaehlen,
      clearLogo: InPersonEinrichten.#logoLeeren,
      unpair: InPersonEinrichten.#paarLoesen,
      testCover: InPersonEinrichten.#abdeckungZeigen,
      addPair: InPersonEinrichten.#paarAnlegen
    }
  };

  static TABS = {
    einrichten: {
      tabs: REITER.map(id => ({ id, icon: SYMBOLE[id], label: `INPERSON.Setup.Tab.${id}` })),
      initial: "konten"
    }
  };

  static PARTS = {
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    konten: { template: `modules/${MODULE_ID}/templates/einrichten-konten.hbs`, scrollable: [""] },
    monitore: { template: `modules/${MODULE_ID}/templates/einrichten-monitore.hbs`, scrollable: [""] },
    tablets: { template: `modules/${MODULE_ID}/templates/einrichten-tablets.hbs`, scrollable: [""] },
    ton: { template: `modules/${MODULE_ID}/templates/einrichten-ton.hbs`, scrollable: [""] },
    buehne: { template: `modules/${MODULE_ID}/templates/einrichten-buehne.hbs`, scrollable: [""] },
    feinheiten: { template: `modules/${MODULE_ID}/templates/einrichten-feinheiten.hbs`, scrollable: [""] },
    fuss: { template: `modules/${MODULE_ID}/templates/einrichten-fuss.hbs` }
  };

  /** Mit welchem Reiter das Fenster aufgeht. */
  constructor(options = {}) {
    super(options);
    if (REITER.includes(options.reiter)) this.tabGroups.einrichten = options.reiter;
  }

  /** Die Abschnitte der Zusatzmodule, wie beim letzten Zeichnen gebaut. */
  #fremde = [];

  /** @override */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    // Ton und Bühnen nur, wenn ein Zusatzmodul dort etwas einträgt.
    for (const id of NUR_ZUSATZ) if (!hatEinstellungsTeile(id)) delete tabs[id];
    if (!tabs[this.tabGroups[group]]) {
      this.tabGroups[group] = "konten";
      return this._prepareTabs(group);
    }
    return tabs;
  }

  /** @override */
  async _prepareContext(options) {
    const kontext = await super._prepareContext(options);
    const get = key => game.settings.get(MODULE_ID, key);
    const mark = (list, current) => list.map(o => ({ ...o, selected: o.id === current }));
    const sc = get(SETTINGS.MONITOR_SC) || "", bm = get(SETTINGS.MONITOR_BM) || "";
    const forced = get(SETTINGS.FORCED) ?? {};
    const sheetUsers = get(SETTINGS.SHEETVIEW_USERS) ?? {};
    const logo = get(SETTINGS.IDLE_LOGO);

    const konten = game.users
      .filter(u => !u.isGM)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(u => ({
        id: u.id, name: u.name, online: u.active, figur: characterOf(u)?.name ?? "",
        istSc: u.id === sc, istBm: u.id === bm, istSpieler: u.id !== sc && u.id !== bm,
        tischVorgabe: typeof forced[u.id] !== "boolean", tischAn: forced[u.id] === true, tischAus: forced[u.id] === false,
        blatt: sheetUsers[u.id] === true
      }));

    return {
      ...kontext,
      // Konten und Geräte
      konten,
      hatMonitor: !!(sc || bm),
      defaultPlayers: get(SETTINGS.DEFAULT_PLAYERS),
      // Monitore
      releaseFollow: get(SETTINGS.MONITOR_RELEASE) === "follow",
      idleScenes: mark(this.#szenen("INPERSON.Panel.IdleSceneNone"), get(SETTINGS.MONITOR_IDLE_SCENE)),
      companions: mark(this.#szenen("INPERSON.Panel.DefaultCompanionNone"), get(SETTINGS.DEFAULT_COMPANION)),
      folders: mark(this.#ordner(), get(SETTINGS.IDLE_FOLDER)),
      idleAfter: get(SETTINGS.IDLE_AFTER),
      scCombat: !!get(SETTINGS.MONITOR_SC_COMBAT),
      companionRedirect: get(SETTINGS.COMPANION_REDIRECT) !== false,
      idleEnabled: !!get(SETTINGS.IDLE_ENABLED),
      modeIsCover: get(SETTINGS.IDLE_MODE) !== "scene",
      rotateEvery: get(SETTINGS.IDLE_ROTATE_EVERY),
      blankFor: get(SETTINGS.IDLE_BLANK_FOR),
      logo,
      hasLogo: !!logo,
      // Tablets
      running: get(SETTINGS.ENABLED),
      scopeBackground: get(SETTINGS.SCOPE) !== "everything",
      keepTokens: get(SETTINGS.KEEP_TOKENS),
      blockAudio: get(SETTINGS.BLOCK_AUDIO),
      allowList: get(SETTINGS.ALLOW_LIST),
      autoNoCanvas: get(SETTINGS.AUTO_NO_CANVAS),
      noCanvas: get(SETTINGS.SHEETVIEW_NO_CANVAS),
      oldIpad: get(SETTINGS.OLD_IPAD),
      sheetviewEnabled: get(SETTINGS.SHEETVIEW),
      editPen: get(SETTINGS.SHEETVIEW_EDIT_PEN),
      chatOnUse: get(SETTINGS.SHEETVIEW_CHAT_ON_USE),
      showAllow: get(SETTINGS.SHOW_ALLOW),
      showTv: get(SETTINGS.SHOW_TV),
      showGmCopy: get(SETTINGS.SHOW_GM_COPY),
      strip: get(SETTINGS.CLOCK_STRIP),
      date: get(SETTINGS.CLOCK_DATE),
      time: get(SETTINGS.CLOCK_TIME),
      weather: get(SETTINGS.CLOCK_WEATHER),
      season: get(SETTINGS.CLOCK_SHOW_SEASON),
      sky: get(SETTINGS.CLOCK_SKY),
      skyTimes: get(SETTINGS.CLOCK_SKY_TIMES),
      skySourceOptions: [
        { value: "eigen", label: "INPERSON.Clock.SkySource.Own" },
        { value: "calendaria", label: "INPERSON.Clock.SkySource.Calendaria" }
      ].map(o => ({ ...o, selected: get(SETTINGS.CLOCK_SKY_SOURCE) === o.value })),
      motionOptions: [
        { value: "auto", label: "INPERSON.Clock.Motion.Auto" },
        { value: "immer", label: "INPERSON.Clock.Motion.Always" },
        { value: "nie", label: "INPERSON.Clock.Motion.Never" }
      ].map(o => ({ ...o, selected: get(SETTINGS.CLOCK_SKY_MOTION) === o.value })),
      hasCalendaria: !!game.modules.get("calendaria")?.active,
      hasWeatherSource: !!game.modules.get("calendaria")?.active,
      trade: get(SETTINGS.TRADE),
      shops: !!game.modules.get("ninjos-shops")?.active,
      itemPiles: !!game.modules.get("item-piles")?.active,
      // Feinheiten
      hideProgress: get(SETTINGS.HIDE_PROGRESS),
      deviceReport: get(SETTINGS.DEVICE_REPORT)
    };
  }

  #szenen(leer) {
    const liste = [{ id: "", name: game.i18n.localize(leer) }];
    for (const s of game.scenes.contents.sort((a, b) => a.name.localeCompare(b.name))) liste.push({ id: s.id, name: s.name });
    return liste;
  }

  #ordner() {
    const liste = [{ id: "", name: game.i18n.localize("INPERSON.Settings.IdleFolder.None") }];
    for (const f of game.folders.filter(f => f.type === "Scene")) {
      liste.push({ id: f.id, name: `${f.name} (${game.scenes.filter(s => s.folder?.id === f.id).length})` });
    }
    return liste;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender?.(context, options);
    const el = this.element;

    // Abschnitte von Zusatzmodulen in ihre Reiter.
    this.#fremde = [];
    for (const ziel of el.querySelectorAll(".inperson-fremde-teile[data-seite]")) {
      const teile = einstellungsTeile(ziel.dataset.seite);
      ziel.replaceChildren(...teile.map(t => t.element));
      this.#fremde.push(...teile);
    }

    // Konten: ein Monitor bekommt weder Tischmodus noch Blattansicht, und
    // jeder Monitor nur einmal. Wählt man ihn für ein zweites Konto, wird das
    // erste wieder Spieler.
    const zeilen = [...el.querySelectorAll(".inperson-konten-zeile[data-user]")];
    const kontenAbgleichen = geaendert => {
      const rolle = z => z.querySelector('select[name^="rolle."]');
      if (geaendert && geaendert.value !== "spieler") {
        for (const z of zeilen) {
          const r = rolle(z);
          if (r !== geaendert && r.value === geaendert.value) r.value = "spieler";
        }
      }
      for (const z of zeilen) {
        const monitor = rolle(z).value !== "spieler";
        z.classList.toggle("ist-monitor", monitor);
        for (const feld of z.querySelectorAll(".inperson-nur-spieler")) feld.disabled = monitor;
      }
    };
    for (const z of zeilen) z.querySelector('select[name^="rolle."]')?.addEventListener("change", e => kontenAbgleichen(e.target));
    kontenAbgleichen();

    // Tablets: Token-Bilder nur, wenn mehr als der Hintergrund gesperrt ist.
    const breit = () => el.querySelector(".inperson-when-wide")
      ?.toggleAttribute("hidden", el.querySelector('select[name="blockScope"]')?.value !== "everything");
    el.querySelector('select[name="blockScope"]')?.addEventListener("change", breit);
    breit();

    // Jede Funktion ist ein Block mit Schalter. Ist sie aus, klappt ihr Inhalt
    // zu: Es steht nur da, was gilt. Die Felder bleiben im Formular und werden
    // mitgespeichert, beim Wiedereinschalten ist nichts verloren.
    for (const block of el.querySelectorAll(".inperson-funktion")) {
      const schalter = block.querySelector("[data-funktionsschalter]");
      if (!schalter) continue;
      const klappen = () => {
        block.classList.toggle("ist-aus", !schalter.checked);
        block.querySelector(".inperson-funktion-inhalt")?.toggleAttribute("hidden", !schalter.checked);
      };
      schalter.addEventListener("change", klappen);
      klappen();
    }

    // Monitore: nur zeigen, was die Antworten darüber gerade wichtig machen.
    const zeigen = (wahl, an) => el.querySelector(wahl)?.toggleAttribute("hidden", !an);
    const schoner = () => {
      const an = el.querySelector('input[name="idleEnabled"]')?.checked;
      const abdeckung = el.querySelector('select[name="idleMode"]')?.value !== "scene";
      zeigen(".inperson-when-cover", an && abdeckung);
      zeigen(".inperson-when-scene", an && !abdeckung);
    };
    el.querySelector('input[name="idleEnabled"]')?.addEventListener("change", schoner);
    el.querySelector('select[name="idleMode"]')?.addEventListener("change", schoner);
    el.querySelector('input[name="idleLogo"]')?.addEventListener("input", () => this.#logoAbgleichen());
    schoner();

    el.querySelector(".inperson-idle-scene")?.replaceChildren(buildSceneField({
      name: "idleScene",
      value: game.settings.get(MODULE_ID, SETTINGS.IDLE_SCENE) ?? "",
      emptyLabel: game.i18n.localize("INPERSON.Settings.IdleScene.None")
    }));
    // Felder mit __ am Anfang speichert das Formular nicht: Ein Paar gehört der Karte.
    el.querySelector(".inperson-pair-add-from")?.replaceChildren(buildSceneField({
      name: "__pairFrom", emptyLabel: game.i18n.localize("INPERSON.Displays.PairFrom")
    }));
    el.querySelector(".inperson-pair-add-to")?.replaceChildren(buildSceneField({
      name: "__pairTo", emptyLabel: game.i18n.localize("INPERSON.Displays.PairTo")
    }));
    this.#paareZeichnen();
  }

  #logoAbgleichen() {
    const el = this.element;
    const pfad = el.querySelector('input[name="idleLogo"]')?.value?.trim() ?? "";
    const vorschau = el.querySelector(".inperson-logo-preview");
    el.querySelector(".inperson-logo-clear")?.toggleAttribute("hidden", !pfad);
    vorschau?.toggleAttribute("hidden", !pfad);
    const bild = vorschau?.querySelector("img");
    if (bild) bild.src = pfad;
  }

  /** Die Liste der Begleitszenen, von Hand gebaut: Sie ändert sich, während das Fenster offen ist. */
  #paareZeichnen() {
    const liste = this.element.querySelector(".inperson-pair-list");
    if (!liste) return;
    liste.replaceChildren();
    const paare = listCompanionPairs();
    if (!paare.length) {
      const leer = document.createElement("p");
      leer.className = "hint";
      leer.textContent = game.i18n.localize("INPERSON.Displays.PairsNone");
      liste.appendChild(leer);
      return;
    }
    for (const { scene, companions } of paare) {
      const zeile = document.createElement("div");
      zeile.className = "inperson-pair-row";
      const von = document.createElement("span");
      von.className = "inperson-pair-from";
      von.textContent = scene.name;
      const pfeil = document.createElement("i");
      pfeil.className = "fa-solid fa-arrow-right";
      pfeil.setAttribute("aria-hidden", "true");
      const zu = document.createElement("span");
      zu.className = "inperson-pair-to";
      companions.forEach((c, i) => {
        if (i) zu.append(", ");
        const name = document.createElement(i ? "span" : "strong");
        name.textContent = c.name;
        zu.appendChild(name);
      });
      const weg = document.createElement("button");
      weg.type = "button";
      weg.className = "inperson-pair-remove";
      weg.dataset.action = "unpair";
      weg.dataset.sceneId = scene.id;
      weg.dataset.tooltip = game.i18n.localize("INPERSON.Panel.UnpairTip");
      weg.setAttribute("aria-label", `${game.i18n.localize("INPERSON.Panel.UnpairTip")}: ${scene.name}`);
      weg.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      zeile.append(von, pfeil, zu, weg);
      liste.appendChild(zeile);
    }
  }

  static #zuKonten() {
    this.changeTab("konten", "einrichten");
  }

  static #steuerung() {
    this.close();
    openPanel();
  }

  /** Leisten eines Kontos sofort zurücksetzen: eine Handlung, keine Einstellung. */
  static async #leisteZuruecksetzen(event, ziel) {
    event.preventDefault();
    const user = game.users.get(ziel.dataset.user);
    if (!user) return;
    const stempel = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_RESET) ?? {});
    stempel[user.id] = Date.now();
    await game.settings.set(MODULE_ID, SETTINGS.SHEETVIEW_RESET, stempel);
    still(game.i18n.format("INPERSON.SheetView.ResetDone", { name: user.name }));
  }

  static async #logoWaehlen() {
    const feld = this.element.querySelector('input[name="idleLogo"]');
    return new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: feld?.value ?? "",
      callback: pfad => {
        if (feld) feld.value = pfad;
        this.#logoAbgleichen();
      }
    }).render(true);
  }

  static #logoLeeren() {
    const feld = this.element.querySelector('input[name="idleLogo"]');
    if (feld) feld.value = "";
    this.#logoAbgleichen();
  }

  static async #paarAnlegen() {
    const el = this.element;
    const von = el.querySelector(".inperson-pair-add-from input[type=hidden]")?.value;
    const zu = el.querySelector(".inperson-pair-add-to input[type=hidden]")?.value;
    if (!von || !zu) return ui.notifications.warn("INPERSON.Displays.PairNeedsBoth", { localize: true });
    if (von === zu) return ui.notifications.warn("INPERSON.SceneField.NotItself", { localize: true });
    const karte = game.scenes.get(von);
    if (!karte) return;
    await addCompanionScene(karte, zu);
    for (const wahl of [".inperson-pair-add-from", ".inperson-pair-add-to"]) {
      el.querySelector(`${wahl} .inperson-scenefield`)?.setScene?.("");
    }
    this.#paareZeichnen();
    still(game.i18n.format("INPERSON.Displays.PairMade", { scene: karte.name, companion: game.scenes.get(zu)?.name ?? "?" }));
  }

  static async #paarLoesen(event, ziel) {
    const szene = game.scenes.get(ziel.dataset.sceneId);
    if (szene) await setCompanionScenes(szene, []);
    this.#paareZeichnen();
  }

  static #abdeckungZeigen() {
    previewCover(8, this.element.querySelector('input[name="idleLogo"]')?.value?.trim() || "");
  }

  /** Alles speichern. Jedes Feld wird geschrieben; das Formular ist die eine Quelle. */
  static async #speichern(event, form, formData) {
    const d = formData.object;
    const set = (key, wert) => game.settings.set(MODULE_ID, key, wert);
    const zahl = v => Number(v) || 0;

    // Konten und Geräte
    const kontoIds = game.users.filter(u => !u.isGM).map(u => u.id);
    const konten = kontenAuswerten(d, kontoIds, {
      forced: game.settings.get(MODULE_ID, SETTINGS.FORCED) ?? {},
      sheetUsers: game.settings.get(MODULE_ID, SETTINGS.SHEETVIEW_USERS) ?? {}
    });
    await set(SETTINGS.MONITOR_BM, konten.bm);
    await set(SETTINGS.MONITOR_SC, konten.sc);
    await set(SETTINGS.FORCED, konten.forced);
    await set(SETTINGS.DEFAULT_PLAYERS, !!d.defaultForPlayers);

    // Monitore
    await set(SETTINGS.MONITOR_RELEASE, d.monitorRelease ?? "follow");
    await set(SETTINGS.MONITOR_IDLE_SCENE, d.monitorIdleScene ?? "");
    await set(SETTINGS.DEFAULT_COMPANION, d.defaultCompanionScene ?? "");
    await set(SETTINGS.MONITOR_SC_COMBAT, !!d.scCombat);
    await set(SETTINGS.COMPANION_REDIRECT, !!d.companionRedirect);
    await set(SETTINGS.IDLE_ENABLED, !!d.idleEnabled);
    await set(SETTINGS.IDLE_AFTER, Math.max(1, zahl(d.idleAfter)));
    await set(SETTINGS.IDLE_MODE, d.idleMode === "scene" ? "scene" : "cover");
    await set(SETTINGS.IDLE_FOLDER, d.idleFolder ?? "");
    await set(SETTINGS.IDLE_SCENE, d.idleScene ?? "");
    await set(SETTINGS.IDLE_ROTATE_EVERY, Math.max(1, zahl(d.idleRotateEvery)));
    await set(SETTINGS.IDLE_BLANK_FOR, Math.max(1, zahl(d.idleBlankFor)));
    await set(SETTINGS.IDLE_LOGO, d.idleLogo ?? "");

    // Tablets
    await set(SETTINGS.SCOPE, d.blockScope === "everything" ? "everything" : "background");
    await set(SETTINGS.KEEP_TOKENS, !!d.keepTokens);
    await set(SETTINGS.BLOCK_AUDIO, !!d.blockAudio);
    await set(SETTINGS.ALLOW_LIST, d.allowList ?? "");
    await set(SETTINGS.AUTO_NO_CANVAS, !!d.autoNoCanvas);
    await set(SETTINGS.SHEETVIEW_NO_CANVAS, !!d.noCanvas);
    await set(SETTINGS.OLD_IPAD, !!d.oldIpad);
    await set(SETTINGS.SHEETVIEW_EDIT_PEN, !!d.editPen);
    await set(SETTINGS.SHEETVIEW_CHAT_ON_USE, !!d.chatOnUse);
    await set(SETTINGS.SHOW_ALLOW, !!d.showAllow);
    await set(SETTINGS.SHOW_TV, !!d.showTv);
    await set(SETTINGS.SHOW_GM_COPY, !!d.showGmCopy);
    await set(SETTINGS.SHEETVIEW_USERS, konten.sheetUsers);
    // Der Hauptschalter der Blattansicht nach der Liste: Sein onChange baut die
    // Ansicht auf den Geräten, und die soll die Liste schon kennen.
    await set(SETTINGS.SHEETVIEW, !!d.sheetviewEnabled);
    await set(SETTINGS.CLOCK_STRIP, !!d.strip);
    await set(SETTINGS.CLOCK_DATE, !!d.date);
    await set(SETTINGS.CLOCK_TIME, !!d.time);
    await set(SETTINGS.CLOCK_WEATHER, !!d.weather);
    await set(SETTINGS.CLOCK_SHOW_SEASON, !!d.season);
    await set(SETTINGS.CLOCK_SKY, !!d.sky);
    if (d.skySource) await set(SETTINGS.CLOCK_SKY_SOURCE, String(d.skySource));
    await set(SETTINGS.CLOCK_SKY_TIMES, !!d.skyTimes);
    if (d.skyMotion) await set(SETTINGS.CLOCK_SKY_MOTION, String(d.skyMotion));
    await set(SETTINGS.TRADE, !!d.trade);
    // Der Hauptschalter des Tischmodus zuletzt: Sein onChange wendet an, was darüber steht.
    await set(SETTINGS.ENABLED, !!d.tischmodusAn);

    // Feinheiten
    await set(SETTINGS.HIDE_PROGRESS, !!d.hideProgress);
    await set(SETTINGS.DEVICE_REPORT, !!d.deviceReport);

    // Zusatzmodule
    for (const teil of this.#fremde) {
      try {
        await teil.speichern?.(d);
      } catch (fehler) {
        console.error(`${MODULE_ID} | Zusatzmodul: Einstellungen ließen sich nicht speichern`, fehler);
      }
    }

    syncClock();
    refreshClock({ force: true });
    syncTradeButton();
    still("INPERSON.Displays.Saved", { localize: true });
  }
}

let _fenster = null;

/**
 * Das Fenster öffnen, auf einem Reiter. Ein schon offenes Fenster springt
 * dorthin, ohne neu zu zeichnen; Eingetipptes bleibt.
 * @param {string} [reiter]
 */
export function openEinrichten(reiter) {
  if (!game.user.isGM) return;
  if (_fenster?.rendered) {
    if (REITER.includes(reiter)) _fenster.changeTab(reiter, "einrichten");
    return _fenster.bringToFront();
  }
  _fenster = new InPersonEinrichten({ reiter });
  return _fenster.render({ force: true });
}
