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
 *
 * **Gefragt wird zuerst.** Die erste Fassung schickte die Seite sofort. Das
 * ist am Schreibtisch harmlos und am Tablet ein Übergriff: In der Blattansicht
 * füllt ein Journal den ganzen Schirm, und wer gerade seine Zauber sortiert,
 * verliert ihn ohne Vorwarnung. Also bekommt jeder erst ein Angebot mit zwei
 * Knöpfen. Wer nicht reagiert, bekommt nichts; das Angebot verfällt nach zehn
 * Sekunden von selbst, damit niemand hinterher fünf Fenster wegtippen muss.
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
 * **Beenden gilt für alle.** Der Zeigende sieht, wer mitliest, und beendet es
 * mit einem Knopf; dann geht das Fenster bei allen zu, auch am Fernseher, wo
 * niemand sitzt, der es könnte. Die Spielleitung kann dasselbe, aus der
 * geflüsterten Zeile im Chat heraus: Sie führt den Abend und muss den Tisch
 * zurückholen können, ohne jemanden zu bitten.
 *
 * **Die Grenze zieht dieses Modul, weil Foundry sie nicht zieht.** Der Server
 * reicht `showEntry` weiter, ohne zu prüfen, wer es schickt. Ein neues Loch
 * entsteht dadurch nicht, wer die Konsole bedienen kann, konnte das vorher
 * auch. Wir bauen einen Knopf mit Leitplanken: nur Eigenes, höchstens alle
 * fünf Sekunden, und die Spielleitung liest mit.
 *
 * **Zweiter Teil, seit 21.11.2026: das Bild.** Foundrys Bildfenster hat seinen
 * Knopf „Zeigen" im Drei-Punkte-Menü, und er schickt das Bild sofort an alle.
 * Die Spielleitung bekommt daneben ein sichtbares Auge, das dasselbe
 * Auswahlfenster öffnet wie bei Journalseiten: Empfänger wählen, erst fragen,
 * für alle wieder schließen. Nur für die Spielleitung, weil ein Bild kein
 * Dokument ist, an dem sich Besitz prüfen ließe.
 *
 * Das Konzept mit dem übrigen Teil (Gegenstand) steht in KONZEPT-zeigen.md.
 */

import { MODULE_ID, SETTINGS, SOCKET } from "./const.js";
import { getSceneDisplay } from "./monitor.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Kein Dauerfeuer: höchstens einmal alle fünf Sekunden je Gerät. */
const TAKT_MS = 5000;

/** So lange steht das Angebot. Lang genug zum Hinsehen, kurz genug zum Vergessen. */
export const ANGEBOT_MS = 10000;

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

/** Die Kennung des Fernsehers, oder nichts. */
export function fernseherId() {
  if (!fernseherErlaubt()) return null;
  return getSceneDisplay()?.id ?? null;
}

/**
 * Die möglichen Empfänger.
 *
 * Menschen zuerst, der Fernseher zuletzt. Die Monitorkonten stehen nie in der
 * Personenliste: Sie sind Bildschirme, keine Mitspieler, und ein Monitor
 * zwischen den Namen der Freunde wäre nur verwirrend.
 */
export function empfaengerListe() {
  const tv = fernseherId();
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

  if (tv) {
    leute.push({
      id: tv,
      name: game.i18n.localize("INPERSON.Show.Tv"),
      img: "icons/svg/video.svg",
      aktiv: game.users.get(tv)?.active ?? false,
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

/* ── Der laufende Vorgang ────────────────────────────────────────── */

/** Was gerade gezeigt wird: beim Zeigenden der ganze Vorgang, beim Empfänger seiner. */
let laufend = null;

export function laufenderVorgang() {
  return laufend;
}

/**
 * Darf dieses „Schließen" hier etwas zumachen?
 *
 * Nur der, der zeigt, und die Spielleitung. Sonst könnte ein beliebiger
 * Mitspieler anderen das Fenster vor der Nase zuziehen, und die Kennung des
 * Vorgangs steht in jedem Angebot, ist also kein Geheimnis.
 */
export function darfSchliessen(nachricht, vorgang) {
  if (!vorgang || nachricht?.token !== vorgang.token) return false;
  return nachricht.gm === true || nachricht.von === vorgang.von;
}

/* ── Was gezeigt wird: Seite oder Bild ───────────────────────────── */

/**
 * Ein Bild zum Zeigen, aus einem offenen Bildfenster.
 *
 * Ein Bild ist kein Dokument. Damit Auswahlfenster und Ablauf es genauso
 * behandeln können wie eine Seite, bekommt es eine kleine Beschreibung mit
 * `name`. Titel, Verweis und `showTitle` reisen mit, damit Foundry beim
 * Empfänger wie gewohnt entscheidet, ob er den Titel sehen darf.
 */
export function bildAusFenster(app) {
  const o = app?.options ?? {};
  if (!o.src) return null;
  const titel = o.window?.title || "";
  return {
    art: "bild",
    src: o.src,
    name: titel || o.src.split("/").pop(),
    titel,
    caption: o.caption || "",
    uuid: o.uuid ?? null,
    showTitle: o.showTitle
  };
}

const istBild = ding => ding?.art === "bild";

/** Darf dieser Mensch das zeigen? Seiten nur mit Besitz, Bilder nur die Spielleitung. */
export function darfZeigen(ding) {
  if (istBild(ding)) return game.user.isGM && !!ding.src;
  return !!ding?.isOwner;
}

/**
 * Wie das Bild im Angebot heißt.
 *
 * Foundry blendet den Titel eines Bildes aus, wenn der Betrachter das Dokument
 * dahinter nicht kennen darf. Das Angebot darf ihn nicht vorher verraten: Nur
 * wenn jeder Gefragte den Titel ohnehin sähe, steht er darin, sonst „ein Bild".
 */
export function bildNameFuer(bild, ids) {
  if (!bild.titel || bild.showTitle === false) return null;
  if (bild.showTitle === true || !bild.uuid) return bild.titel;
  const doc = foundry.utils.fromUuidSync?.(bild.uuid);
  if (!doc) return null;
  const alle = ids.every(id => {
    const u = game.users.get(id);
    return !!u && !!doc.testUserPermission?.(u, "LIMITED");
  });
  return alle ? bild.titel : null;
}

/**
 * Wirklich schicken. Nie mit leerer Liste: Foundry schickte sonst an alle.
 *
 * Seiten gehen mit `force`. Ohne öffnet Foundry die Seite beim Empfänger nur,
 * wenn er sie ohnehin sehen darf (`_showEntry`), und ein Brief, der einem
 * Spieler gehört, käme bei den anderen nie an. Mit `force` bekommt der
 * Empfänger für diesen Augenblick Beobachterrechte an genau dieser Seite,
 * nur auf seinem Rechner und ohne etwas zu speichern. Am 21.11.2026 beim
 * Test bemerkt: Das Angebot kam an, nach dem Ja blieb der Schirm leer.
 */
async function schicken(vorgang, users) {
  if (!users?.length) return;
  if (vorgang.bild) {
    const b = vorgang.bild;
    foundry.documents.collections.Journal.showImage(b.src, {
      users, title: b.titel, caption: b.caption, uuid: b.uuid ?? undefined, showTitle: b.showTitle
    });
    return;
  }
  const seite = await foundry.utils.fromUuid(vorgang.seiteUuid).catch(() => null);
  if (seite?.isOwner) await foundry.documents.collections.Journal.show(seite, { users, force: true });
}

/* ── Zeigen: der Ablauf beim Zeigenden ───────────────────────────── */

/**
 * Den Vorgang beginnen.
 *
 * Der Fernseher bekommt die Seite sofort: Dort sitzt niemand, der ein Angebot
 * annehmen könnte. Menschen bekommen ein Angebot.
 */
export async function zeigenStarten(seite, ids) {
  if (!darfZeigen(seite) || !ids?.length) return null;
  if (!zeigenErlaubt() && !game.user.isGM) return null;
  if (!taktFrei()) return null;
  taktMerken();

  const tv = fernseherId();
  const sofort = ids.filter(id => id === tv);
  const gefragt = ids.filter(id => id !== tv);
  const token = foundry.utils.randomID();
  const bild = istBild(seite)
    ? { src: seite.src, titel: seite.titel, caption: seite.caption, uuid: seite.uuid, showTitle: seite.showTitle }
    : null;

  laufend = {
    token,
    von: game.user.id,
    seiteUuid: bild ? null : seite.uuid,
    bild,
    name: seite.name,
    stand: new Map([
      ...sofort.map(id => [id, "sieht"]),
      ...gefragt.map(id => [id, "gefragt"])
    ])
  };

  if (sofort.length) {
    if (bild) await schicken(laufend, sofort);
    else await foundry.documents.collections.Journal.show(seite, { users: sofort, force: true });
  }
  if (gefragt.length) {
    game.socket.emit(SOCKET.NAME, {
      type: SOCKET.SHOW_OFFER,
      token,
      von: game.user.id,
      vonName: game.user.name,
      seiteUuid: laufend.seiteUuid,
      bildSrc: bild?.src ?? null,
      name: bild ? bildNameFuer(bild, gefragt) : seite.name,
      an: gefragt
    });
  }

  if (mitlesenErlaubt() && !game.user.isGM) {
    const namen = ids.map(id => game.users.get(id)?.name).filter(Boolean).join(", ");
    ChatMessage.create({
      content: `${game.i18n.format("INPERSON.Show.GmLine", { was: seite.name, wem: namen })}
        <button type="button" class="inperson-zeigen-stop" data-inperson-schliessen="${token}">
          <i class="fa-solid fa-eye-slash"></i> ${game.i18n.localize("INPERSON.Show.StopAll")}
        </button>`,
      whisper: ChatMessage.getWhisperRecipients("GM"),
      speaker: { alias: game.user.name }
    });
  }
  return laufend;
}

/** Den Vorgang beenden: bei allen, auch am Fernseher. */
export function zeigenBeenden() {
  if (!laufend) return false;
  game.socket.emit(SOCKET.NAME, {
    type: SOCKET.SHOW_CLOSE,
    token: laufend.token,
    von: laufend.von,
    gm: game.user.isGM
  });
  laufend = null;
  return true;
}

/* ── Empfangen ───────────────────────────────────────────────────── */

/** Das gezeigte Bild wieder zumachen: jedes Bildfenster mit genau dieser Datei. */
function bildSchliessen(src) {
  const ImagePopout = foundry.applications.apps?.ImagePopout;
  for (const app of foundry.applications.instances.values()) {
    if (ImagePopout && !(app instanceof ImagePopout)) continue;
    if (app?.options?.src !== src) continue;
    try { app.close(); } catch { /* schon zu */ }
  }
}

/**
 * Das Journal wieder zumachen.
 *
 * Gesucht wird über die Seite, nicht über eine gemerkte Fensterkennung: Foundry
 * öffnet beim Zeigen den Eintrag, nicht die Seite, und welches Fenster das am
 * Ende ist, entscheidet es selbst.
 */
async function journalSchliessen(seiteUuid) {
  const seite = await foundry.utils.fromUuid(seiteUuid).catch(() => null);
  const eintragId = seite?.parent?.id;
  for (const app of foundry.applications.instances.values()) {
    const doc = app?.document;
    if (doc?.documentName !== "JournalEntry") continue;
    if (eintragId && doc.id !== eintragId) continue;
    try { app.close(); } catch { /* schon zu */ }
  }
}

export function installZeigenSocket() {
  /*
   * Der Knopf in der geflüsterten Chatzeile. Als Zuhörer am Dokument statt an
   * einem Render-Haken: Die Haken der Chatnachricht heissen je nach Fassung
   * anders, ein Klick auf ein Attribut nicht.
   */
  document.addEventListener("click", event => {
    const knopf = event.target?.closest?.("[data-inperson-schliessen]");
    if (!knopf) return;
    event.preventDefault();
    game.socket.emit(SOCKET.NAME, {
      type: SOCKET.SHOW_CLOSE,
      token: knopf.dataset.inpersonSchliessen,
      von: game.user.id,
      gm: game.user.isGM
    });
    knopf.disabled = true;
  });
}

/** Eine Nachricht des Zeigens verarbeiten. Wird aus dem Verteiler in main.js gerufen. */
export async function zeigenSocket(nachricht) {
  if (nachricht?.type === SOCKET.SHOW_OFFER) {
    if (!nachricht.an?.includes(game.user.id)) return;
    laufend = {
      token: nachricht.token,
      von: nachricht.von,
      seiteUuid: nachricht.seiteUuid,
      bildSrc: nachricht.bildSrc ?? null,
      name: nachricht.name
    };
    new ZeigenAngebot(nachricht).render({ force: true });
    return;
  }

  if (nachricht?.type === SOCKET.SHOW_ANSWER) {
    // Beim Zeigenden: Stand nachtragen und, bei Ja, die Seite wirklich schicken.
    if (nachricht.an !== game.user.id || nachricht.token !== laufend?.token) return;
    laufend.stand?.set(nachricht.von, nachricht.antwort === "ja" ? "sieht" : nachricht.antwort);
    if (nachricht.antwort === "ja") await schicken(laufend, [nachricht.von]);
    for (const app of foundry.applications.instances.values()) {
      if (app instanceof ZeigenAuswahl) app.render();
    }
    return;
  }

  if (nachricht?.type === SOCKET.SHOW_CLOSE) {
    if (!darfSchliessen(nachricht, laufend)) return;
    const uuid = laufend.seiteUuid;
    const src = laufend.bildSrc ?? laufend.bild?.src ?? null;
    const warIch = laufend.von === game.user.id;
    laufend = null;
    if (!warIch) {
      if (src) bildSchliessen(src);
      else await journalSchliessen(uuid);
    }
    for (const app of foundry.applications.instances.values()) {
      if (app instanceof ZeigenAngebot || app instanceof ZeigenAuswahl) app.close();
    }
  }
}

/* ── Das Angebot beim Empfänger ──────────────────────────────────── */

/**
 * „Nadylos zeigt dir etwas."
 *
 * Klein, zwei Knöpfe, eine Zahl, die herunterläuft. Kein Journal, das
 * ungefragt den Schirm übernimmt.
 */
export class ZeigenAngebot extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-angebot",
    window: { title: "INPERSON.Show.OfferTitle", icon: "fa-solid fa-hand-holding" },
    position: { width: 380, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "themed", "theme-light", "inperson-angebot"],
    actions: { ja: ZeigenAngebot.#onJa, nein: ZeigenAngebot.#onNein }
  };

  static PARTS = { body: { template: `modules/${MODULE_ID}/templates/zeigen-angebot.hbs` } };

  constructor(nachricht, optionen = {}) {
    super(optionen);
    this.nachricht = nachricht;
    this.endet = Date.now() + ANGEBOT_MS;
    this.beantwortet = false;
  }

  async _prepareContext() {
    return {
      von: this.nachricht.vonName,
      was: this.nachricht.name || game.i18n.localize("INPERSON.Show.AnImage"),
      sekunden: Math.max(0, Math.round((this.endet - Date.now()) / 1000))
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const zahl = this.element.querySelector(".inperson-angebot-zeit");
    this.uhr = setInterval(() => {
      const rest = Math.max(0, Math.round((this.endet - Date.now()) / 1000));
      if (zahl) zahl.textContent = String(rest);
      if (rest <= 0) this.#antworten("abgelaufen");
    }, 250);
  }

  _onClose(options) {
    clearInterval(this.uhr);
    // Weggetippt zählt wie abgelehnt, nie wie Zustimmung.
    if (!this.beantwortet) this.#melden("nein");
    super._onClose(options);
  }

  #melden(antwort) {
    this.beantwortet = true;
    game.socket.emit(SOCKET.NAME, {
      type: SOCKET.SHOW_ANSWER,
      token: this.nachricht.token,
      an: this.nachricht.von,
      von: game.user.id,
      antwort
    });
    if (antwort !== "ja") laufend = null;
  }

  #antworten(antwort) {
    if (this.beantwortet) return;
    this.#melden(antwort);
    this.close();
  }

  static #onJa() { this.#antworten("ja"); }
  static #onNein() { this.#antworten("nein"); }
}

/* ── Das Auswahlfenster beim Zeigenden ───────────────────────────── */

/**
 * An wen, und danach: wer liest gerade mit.
 *
 * Dasselbe Fenster in zwei Zuständen. Nach dem Abschicken bleibt es stehen und
 * wird zur Anzeige des Vorgangs, denn irgendwo muss der Knopf zum Beenden
 * wohnen, und der gehört dorthin, wo der Vorgang begonnen hat.
 */
export class ZeigenAuswahl extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ninjos-inperson-tools-zeigen",
    tag: "form",
    window: { title: "INPERSON.Show.Title", icon: "fa-solid fa-eye" },
    position: { width: 420, height: "auto" },
    classes: ["ninjos-inperson-tools", "inperson-panel", "themed", "theme-light", "inperson-zeigen"],
    actions: {
      senden: ZeigenAuswahl.#onSenden,
      alle: ZeigenAuswahl.#onAlle,
      beenden: ZeigenAuswahl.#onBeenden
    }
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

  async _prepareContext() {
    const vorgang = laufend?.von === game.user.id ? laufend : null;
    if (vorgang) {
      const stand = [...vorgang.stand.entries()].map(([id, wie]) => ({
        name: game.users.get(id)?.name ?? game.i18n.localize("INPERSON.Show.Tv"),
        wie,
        text: game.i18n.localize(`INPERSON.Show.State.${wie}`)
      }));
      return { laeuft: true, was: vorgang.name, stand };
    }
    const leute = empfaengerListe().map(e => ({ ...e, an: this.gewaehlt.has(e.id) }));
    return {
      laeuft: false,
      was: this.seite?.name ?? "",
      leute,
      hatLeute: leute.length > 0,
      alleAn: leute.length > 0 && leute.every(e => e.an)
    };
  }

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
    const vorgang = await zeigenStarten(this.seite, [...this.gewaehlt]);
    if (!vorgang) {
      knopf.textContent = game.i18n.localize("INPERSON.Show.TooFast");
      setTimeout(() => this.close(), 1400);
      return;
    }
    this.render();
  }

  static #onBeenden() {
    zeigenBeenden();
    this.close();
  }

  _onClose(options) {
    // Das Fenster zu heisst: Zeigen vorbei. Sonst bliebe bei den anderen ein
    // Journal stehen, das niemand mehr beenden kann.
    if (laufend?.von === game.user.id) zeigenBeenden();
    super._onClose(options);
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

/**
 * Das Auge im Kopf des Bildfensters, sichtbar neben dem Kreuz.
 *
 * Foundry legt seinen eigenen Knopf „Zeigen" ins Drei-Punkte-Menü. Am Tisch ist
 * das ein Griff zu viel, und er fragt nicht, an wen. Einen Haken für Knöpfe
 * direkt im Rahmen bietet Foundry nicht (`_getFrameButtons` hat keinen), also
 * setzt dieser Teil den Knopf beim Zeichnen selbst vor das Kreuz, mit denselben
 * Klassen wie Foundrys eigene Rahmenknöpfe. Der Klick läuft über `data-action`
 * und `options.actions` wie jeder andere Knopf im Fenster.
 *
 * Foundrys Eintrag im Menü bleibt stehen. Wer ihn gewohnt ist, findet ihn.
 */
function bildKnopfSetzen(app, element) {
  if (!game.user.isGM) return;
  const kopf = element?.querySelector?.(":scope > .window-header");
  const kreuz = kopf?.querySelector(":scope > [data-action=close]");
  if (!kreuz || kopf.querySelector("[data-action=inpersonZeigenBild]")) return;
  if (!bildAusFenster(app)) return;

  app.options.actions ??= {};
  app.options.actions.inpersonZeigenBild ??= async function () {
    const bild = bildAusFenster(this);
    if (!bild) return;
    // Das Auswahlfenster gibt es nur einmal. Steht es noch vom letzten Zeigen
    // offen, geht es zuerst zu, und damit endet das alte Zeigen bei allen.
    const alt = foundry.applications.instances.get(ZeigenAuswahl.DEFAULT_OPTIONS.id);
    if (alt) await alt.close();
    new ZeigenAuswahl(bild).render({ force: true });
  };

  const name = game.i18n.localize("INPERSON.Show.ImageButton");
  const knopf = document.createElement("button");
  knopf.type = "button";
  knopf.className = "header-control icon fa-solid fa-eye";
  knopf.dataset.action = "inpersonZeigenBild";
  knopf.dataset.tooltip = name;
  knopf.setAttribute("aria-label", name);
  kreuz.before(knopf);
}

export function installZeigen() {
  installZeigenSocket();

  Hooks.on("renderImagePopout", (app, element) => {
    try { bildKnopfSetzen(app, element); }
    catch (err) { console.warn(`${MODULE_ID} | Knopf im Bildfenster`, err); }
  });

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
