/**
 * Zeigen am Tisch, erster Teil: die Journalseite.
 *
 * Ein Spieler bekommt einen Brief, ein Buch, eine Karte. Er soll sie den
 * anderen zeigen können, so wie man einen Zettel über den Tisch hält.
 *
 * **Foundry kann das längst, es fehlt nur der Knopf.** `Journal.show()`
 * verlangt, dass der Zeigende die Seite besitzt, und genau das trifft hier zu:
 * Eine persönliche Seite gehört dem Spieler. Der Knopf im Fensterkopf ist
 * trotzdem nur für die Spielleitung sichtbar, und für Besitzer steht er
 * ausschließlich im Rechtsklickmenü der Seitenliste. Am Tablet ist das ein
 * langer Druck auf eine Liste, die in der Blattansicht selten offen ist.
 * Niemand findet ihn dort.
 *
 * **Was beim Empfänger passiert, macht Foundry selbst**: Es setzt ihm für
 * diesen Augenblick Beobachterrechte auf seinem eigenen Rechner und öffnet das
 * echte Journal mit Bildern, Verweisen und Formatierung. Gespeichert wird
 * nichts. Nach dem Neuladen ist die Seite wieder zu. Deshalb gilt:
 *
 *   **Zeigen ist nicht Geben.**
 *
 * Wer etwas zeigt, behält es; der andere hat danach nichts in der Hand. Geben
 * läuft über den Tausch in Ninjo's DnD Shops & Trade.
 *
 * **Die Grenze zieht dieses Modul, weil Foundry sie nicht zieht.** Der Server
 * reicht `showEntry` weiter, ohne zu prüfen, wer es schickt. Ein neues Loch
 * entsteht dadurch nicht, wer die Konsole bedienen kann, konnte das vorher
 * auch. Wir bauen einen Knopf mit Leitplanken: nur Eigenes, höchstens alle
 * fünf Sekunden, und die Spielleitung liest mit.
 *
 * Das Konzept mit den übrigen zwei Teilen (Bild, Gegenstand) steht in
 * KONZEPT-zeigen.md.
 */

import { MODULE_ID, SETTINGS } from "./const.js";
import { getSceneDisplay } from "./monitor.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Kein Dauerfeuer: höchstens einmal alle fünf Sekunden je Gerät. */
const TAKT_MS = 5000;

let zuletzt = 0;

/** Ist der Takt frei? Ausgelagert, damit die Prüfung ihn messen kann. */
export function taktFrei(jetzt = Date.now()) {
  return jetzt - zuletzt >= TAKT_MS;
}

export function taktMerken(jetzt = Date.now()) {
  zuletzt = jetzt;
}

/* ── Was der Spielleiter erlaubt ─────────────────────────────────── */

function schalter(schluessel, wennUnbekannt = true) {
  try { return game.settings.get(MODULE_ID, schluessel) !== false; }
  catch { return wennUnbekannt; }
}

export const zeigenErlaubt = () => schalter(SETTINGS.SHOW_ALLOW);
export const fernseherErlaubt = () => schalter(SETTINGS.SHOW_TV);
export const mitlesenErlaubt = () => schalter(SETTINGS.SHOW_GM_COPY);

/* ── Wer etwas zu sehen bekommen kann ────────────────────────────── */

/**
 * Die möglichen Empfänger.
 *
 * Menschen zuerst, der Fernseher zuletzt. Die Monitorkonten stehen nie in der
 * Personenliste: Sie sind Bildschirme, keine Mitspieler, und ein Monitor
 * zwischen den Namen der Freunde wäre nur verwirrend.
 */
export function empfaengerListe() {
  const fernseher = fernseherErlaubt() ? getSceneDisplay() : null;
  const monitore = new Set([
    game.settings.get(MODULE_ID, SETTINGS.MONITOR_SC),
    game.settings.get(MODULE_ID, SETTINGS.MONITOR_BM)
  ].filter(Boolean));

  const leute = game.users
    .filter(u => !u.isGM && u.id !== game.user.id && !monitore.has(u.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(u => ({
      id: u.id,
      name: u.name,
      img: u.avatar || u.character?.img || "icons/svg/mystery-man.svg",
      aktiv: u.active,
      fernseher: false
    }));

  if (fernseher) {
    leute.push({
      id: fernseher.id,
      name: game.i18n.localize("INPERSON.Show.Tv"),
      img: "icons/svg/video.svg",
      aktiv: fernseher.active,
      fernseher: true
    });
  }
  return leute;
}

/* ── Die letzte Wahl, je Gerät ───────────────────────────────────── */

function merkKey() {
  return `${MODULE_ID}.zeigen.${game.user.id}`;
}

function letzteWahl() {
  try { return new Set(JSON.parse(localStorage.getItem(merkKey()) ?? "[]")); }
  catch { return new Set(); }
}

function wahlMerken(ids) {
  try { localStorage.setItem(merkKey(), JSON.stringify([...ids])); } catch { }
}

/* ── Zeigen ──────────────────────────────────────────────────────── */

/**
 * Die Seite an die gewählten Konten schicken.
 *
 * Der Besitz wird hier noch einmal geprüft, obwohl der Knopf ohne ihn gar
 * nicht erscheint. Der Knopf ist Oberfläche; diese Funktion ist die Stelle,
 * an der es wirklich passiert.
 */
export async function seiteZeigen(seite, ids) {
  if (!seite?.isOwner || !ids?.length) return false;
  if (!zeigenErlaubt() && !game.user.isGM) return false;
  if (!taktFrei()) return false;
  taktMerken();

  await foundry.documents.collections.Journal.show(seite, { users: [...ids] });

  if (mitlesenErlaubt() && !game.user.isGM) {
    const namen = ids.map(id => game.users.get(id)?.name).filter(Boolean).join(", ");
    ChatMessage.create({
      content: game.i18n.format("INPERSON.Show.GmLine", { was: seite.name, wem: namen }),
      whisper: ChatMessage.getWhisperRecipients("GM"),
      speaker: { alias: game.user.name }
    });
  }
  return true;
}

/* ── Das Auswahlfenster ──────────────────────────────────────────── */

/**
 * An wen?
 *
 * Bewusst dieselbe Bauart wie die Partnerliste im Tausch: eine Zeile je
 * Person, 44 Pixel hoch, antippen reicht. Am Tisch wird das mit einem Finger
 * bedient, während die anderen warten.
 */
export class ZeigenAuswahl extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-zeigen",
    tag: "form",
    window: { title: "INPERSON.Show.Title", icon: "fa-solid fa-eye" },
    position: { width: 420, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "inperson-zeigen"],
    actions: { senden: ZeigenAuswahl.#onSenden, alle: ZeigenAuswahl.#onAlle }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/zeigen.hbs`, scrollable: [".inperson-zeigen-liste"] }
  };

  constructor(seite, optionen = {}) {
    super(optionen);
    this.seite = seite;
    this.gewaehlt = letzteWahl();
  }

  get title() {
    return game.i18n.format("INPERSON.Show.TitleFor", { was: this.seite?.name ?? "" });
  }

  /** @override */
  async _prepareContext() {
    const leute = empfaengerListe().map(e => ({ ...e, an: this.gewaehlt.has(e.id) }));
    return {
      was: this.seite?.name ?? "",
      leute,
      hatLeute: leute.length > 0,
      alleAn: leute.length > 0 && leute.every(e => e.an)
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    for (const kasten of this.element.querySelectorAll("input[type=checkbox][data-user]")) {
      kasten.addEventListener("change", () => {
        if (kasten.checked) this.gewaehlt.add(kasten.dataset.user);
        else this.gewaehlt.delete(kasten.dataset.user);
        kasten.closest(".inperson-pick-row")?.classList.toggle("on", kasten.checked);
      });
    }
  }

  static #onAlle() {
    const leute = empfaengerListe();
    const allesAn = leute.every(e => this.gewaehlt.has(e.id));
    this.gewaehlt = allesAn ? new Set() : new Set(leute.map(e => e.id));
    this.render();
  }

  /**
   * Abschicken.
   *
   * Die Rückmeldung steht **im Fenster**, nicht als Meldung am Bildschirmrand:
   * In der Blattansicht blendet Sheet Only Foundrys Meldungen aus, und wer am
   * Tablet sitzt, sähe sie nie (Regel 5 der Oberflächengrundsätze).
   */
  static async #onSenden(event) {
    event?.preventDefault();
    const knopf = this.element.querySelector("[data-action=senden]");
    if (!this.gewaehlt.size) {
      knopf?.classList.add("inperson-zeigen-fehlt");
      setTimeout(() => knopf?.classList.remove("inperson-zeigen-fehlt"), 900);
      return;
    }
    wahlMerken(this.gewaehlt);
    const gut = await seiteZeigen(this.seite, [...this.gewaehlt]);
    if (!gut) {
      knopf.textContent = game.i18n.localize("INPERSON.Show.TooFast");
      setTimeout(() => this.close(), 1400);
      return;
    }
    const namen = [...this.gewaehlt].map(id => game.users.get(id)?.name).filter(Boolean);
    knopf.textContent = game.i18n.format("INPERSON.Show.Done", { wem: namen.join(", ") });
    knopf.disabled = true;
    setTimeout(() => this.close(), 1200);
  }
}

/* ── Der Knopf im Fensterkopf ────────────────────────────────────── */

/**
 * Welche Seite schaut der Mensch gerade an?
 *
 * `pagesInView` sind die Seiten, die im Blatt wirklich sichtbar sind. Die
 * erste davon ist die gemeinte. Zeigt das Blatt gar nichts (frisch geöffnet,
 * noch im Aufbau), nehmen wir die Seite am aktuellen Index.
 */
function sichtbareSeite(app) {
  const eintrag = app?.entry ?? app?.document;
  if (!eintrag?.pages) return null;
  const id = app.pagesInView?.[0]?.dataset?.pageId;
  if (id) return eintrag.pages.get(id) ?? null;
  return eintrag.pages.contents[app.pageIndex ?? 0] ?? null;
}

export function installZeigen() {
  /*
   * Am allgemeinen Haken statt am Journal-eigenen: `parentClassHooks` steht in
   * Foundry auf `true`, also feuert dieser auch fuer Journalblaetter, und zwar
   * selbst dann, wenn ein fremdes Modul die Klasse ableitet. Monk's Enhanced
   * Journal tut genau das.
   */
  Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
    if (app?.document?.documentName !== "JournalEntry") return;
    if (!Array.isArray(controls)) return;
    controls.push({
      icon: "fa-solid fa-eye",
      label: "INPERSON.Show.Button",
      action: "inpersonZeigen",
      visible: function () {
        if (!zeigenErlaubt() && !game.user.isGM) return false;
        if (!game.users.some(u => !u.isGM && u.id !== game.user.id)) return false;
        return !!sichtbareSeite(this)?.isOwner;
      }
    });
    // Die Handlung dazu. Sie steht am Fenster selbst, weil Foundry den Knopf
    // ueber `options.actions` aufloest und unsere Kennung dort sonst fehlt.
    app.options.actions ??= {};
    app.options.actions.inpersonZeigen ??= function () {
      const seite = sichtbareSeite(this);
      if (seite) new ZeigenAuswahl(seite).render({ force: true });
    };
  });
}
