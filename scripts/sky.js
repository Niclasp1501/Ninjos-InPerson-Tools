/**
 * Der Himmelsbogen: wo Sonne und Mond gerade stehen.
 *
 * Ein Blick auf die Uhrzeit sagt "21:01". Ein Blick auf den Bogen sagt "die
 * Sonne ist seit einer Stunde weg und der Mond ist fast voll" - und das ist die
 * Auskunft, die am Tisch tatsächlich gebraucht wird, wenn jemand fragt, ob man
 * noch weiterreisen kann.
 *
 * **Gerechnet, nicht abgeschrieben.** Alles kommt aus dem Weltkalender, den
 * jeder Client hat:
 *
 *   calendar.daylight   longestDay 16, shortestDay 8, Sonnenwenden als Tag im Jahr
 *   calendar.moons      je Mond: Zykluslänge, Bezugsdatum, Phasen mit Anteilen
 *
 * Zwei Dinge sind bewusst *nicht* übernommen. Die Mondsicheln zeichnen wir
 * selbst statt die Bilddateien eines anderen Moduls zu laden - sonst hinge die
 * Leiste an dessen Vorhandensein und an dessen Dateinamen. Und der Bogen läuft
 * ohne jedes Kalendermodul: fehlen die Angaben, fällt er auf 06:00/18:00 zurück
 * und lässt den Mond weg, statt zu verschwinden.
 */

import { MODULE_ID } from "./const.js";

/**
 * Eine Halbkuppel, die über die Leiste hinausragt.
 *
 * Das war der Punkt, den ich dreimal falsch hatte: Der Bogen gehört nicht *in*
 * die Leiste, sondern *auf* sie. Im Original ist die Leiste dünn und die Kuppel
 * steht oben darauf wie ein Uhrglas — so bleibt die Leiste flach und der
 * Himmel bekommt trotzdem seine Höhe. Ein Bogen in der Leiste hatte sie auf 86
 * Pixel aufgeblasen.
 *
 * Halbkreis mit Radius 60: 120 breit, 62 hoch, der Horizont ist die Unterkante.
 */
const RADIUS = 60;
const BREITE = RADIUS * 2;
const HOEHE = RADIUS + 2;
const GESTIRN = 11;

/* ── Rechnen ─────────────────────────────────────────────────────── */

/** Tage im Jahr, aus den Monatslängen. */
function tageProJahr(calendar) {
  const monate = Array.from(calendar?.months?.values ?? []);
  const summe = monate.reduce((n, m) => n + (m.days ?? 0), 0);
  return summe > 0 ? summe : 365;
}

/** Tag im Jahr, eins-basiert. */
function tagImJahr(calendar, k) {
  const monate = Array.from(calendar?.months?.values ?? []);
  let tag = (k.dayOfMonth ?? 0) + 1;
  for (let i = 0; i < (k.month ?? 0) && i < monate.length; i++) tag += monate[i].days ?? 0;
  return tag;
}

/**
 * Sonnenauf- und -untergang für den heutigen Tag, in Stunden.
 *
 * Die Taglänge schwingt zwischen kürzestem und längstem Tag; eine Kosinuswelle
 * mit der Wintersonnenwende als Tiefpunkt trifft beide Sonnenwenden exakt und
 * alles dazwischen nah genug. Um Mittag herum aufgeteilt, weil ein Kalender
 * ohne Zeitzonen keinen Grund für etwas anderes hat.
 */
function sonnenzeiten(calendar) {
  const licht = calendar?.daylight;
  const stunden = calendar?.days?.hoursPerDay ?? 24;
  if (!licht?.enabled || licht.longestDay == null || licht.shortestDay == null) {
    return { aufgang: stunden / 4, untergang: (stunden * 3) / 4, geschaetzt: true };
  }

  const jahr = tageProJahr(calendar);
  const tag = tagImJahr(calendar, game.time.components);
  const winter = licht.winterSolstice ?? 0;
  const welle = (1 - Math.cos((2 * Math.PI * (tag - winter)) / jahr)) / 2;   // 0 im Winter, 1 im Sommer
  const laenge = licht.shortestDay + (licht.longestDay - licht.shortestDay) * welle;

  return { aufgang: stunden / 2 - laenge / 2, untergang: stunden / 2 + laenge / 2, geschaetzt: false };
}

/**
 * Die Phase des ersten Mondes, als Anteil 0..1 und mit Namen.
 *
 * `moons` ist ein Objekt, kein Feld - was mich einmal glauben ließ, diese Welt
 * habe gar keinen Mond.
 */
function mondphase(calendar) {
  const monde = Object.values(calendar?.moons ?? {});
  const mond = monde.find(m => m?.visibility !== "hidden") ?? monde[0];
  if (!mond?.cycleLength) return null;

  const jahr = tageProJahr(calendar);
  const k = game.time.components;
  const heute = (k.year ?? 0) * jahr + tagImJahr(calendar, k)
    + ((k.hour ?? 0) * 60 + (k.minute ?? 0)) / (24 * 60);

  const bezug = mond.referenceDate ?? { year: 0, month: 0, dayOfMonth: 0 };
  const bezugstag = (bezug.year ?? 0) * jahr
    + tagImJahr(calendar, { month: bezug.month ?? 0, dayOfMonth: bezug.dayOfMonth ?? 0 });

  const roh = (heute - bezugstag) / mond.cycleLength + (mond.referencePhase ?? 0);
  const anteil = ((roh % 1) + 1) % 1;

  const phasen = Object.values(mond.phases ?? {});
  const treffer = phasen.find(p => anteil >= (p.start ?? 0) && anteil < (p.end ?? 1));

  return {
    anteil,
    bild: treffer?.icon ?? null,
    name: treffer?.name ? game.i18n.localize(treffer.name) : null,
    mondname: mond.name ? game.i18n.localize(mond.name) : null,
    farbe: aufhellen(mond.color) || "#e9e9e4"
  };
}

/**
 * Die Mondfarbe fürs Dunkle aufhellen.
 *
 * Calendaria gibt für Selûne `#C0C0C0` an - auf einem tiefblauen Himmel wirkt
 * das grau statt mondhell. Der Farbton bleibt, die Helligkeit steigt.
 */
function aufhellen(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? "")) return null;
  const kanal = i => {
    const wert = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(wert + (255 - wert) * 0.55).toString(16).padStart(2, "0");
  };
  return `#${kanal(0)}${kanal(1)}${kanal(2)}`;
}

/* ── Zeichnen ────────────────────────────────────────────────────── */

/**
 * Sterne an festen Stellen.
 *
 * Bewusst kein Zufall zur Laufzeit: Die Leiste zeichnet sich jede Minute neu,
 * und Sterne, die dabei springen, sind das Erste, was am Tisch auffällt.
 */
const STERNE = [
  [22, 50], [30, 34], [42, 22], [56, 14], [70, 12], [84, 20],
  [96, 34], [104, 50], [48, 40], [76, 30], [62, 28], [36, 48], [88, 46]
];

/**
 * Der Mond, mit dem Bild des Kalendermoduls wenn es eines gibt.
 *
 * Zuerst hatte ich die Sichel selbst gezeichnet, um nicht an fremden Dateien zu
 * hängen. Am Tisch sah das schlechter aus als das Original - und das Original
 * *ist* das Bild, das in den Phasendaten steht. Also wird es genommen, wenn es
 * da ist, und selbst gezeichnet, wenn nicht. Die Leiste läuft weiterhin ohne
 * jedes Kalendermodul; sie sieht dann nur etwas schlichter aus.
 */
function mondBild(cx, cy, mond) {
  const hof = `<circle cx="${cx}" cy="${cy}" r="${GESTIRN * 1.7}" fill="#e8f0ff" opacity="0.16"/>`;
  const d = GESTIRN * 2;

  if (mond?.bild) {
    return `${hof}<image href="${escape(mond.bild)}" x="${(cx - GESTIRN).toFixed(1)}" y="${(cy - GESTIRN).toFixed(1)}"
      width="${d}" height="${d}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return `${hof}
    <circle cx="${cx}" cy="${cy}" r="${GESTIRN}" fill="#25313f"/>
    <path d="${mondPfad(Number(cx), Number(cy), GESTIRN, mond?.anteil ?? 0.5)}" fill="${mond?.farbe ?? "#e9e9e4"}"/>
    <circle cx="${cx}" cy="${cy}" r="${GESTIRN}" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="0.6"/>`;
}

/** Der beleuchtete Teil des Mondes als Pfad. */
function mondPfad(cx, cy, r, anteil) {
  const k = Math.cos(2 * Math.PI * anteil);        // 1 bei Neumond, -1 bei Vollmond
  const rx = Math.abs(k) * r;
  const aussen = anteil < 0.5 ? 1 : 0;
  const innen = k > 0 ? aussen : 1 - aussen;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${aussen} ${cx} ${cy + r}`
    + ` A ${rx} ${r} 0 0 ${innen} ${cx} ${cy - r} Z`;
}

/**
 * Der Bogen als SVG.
 *
 * Der Himmel ist die Fläche unter dem Bogen und wechselt die Farbe mit der
 * Tageszeit; das Gestirn wandert von links (Aufgang) nach rechts (Untergang) -
 * tagsüber die Sonne über dem Bogen, nachts der Mond.
 * @returns {{svg: string, hinweis: string}|null}
 */
export function himmelsbogen() {
  const calendar = game.time?.calendar;
  const k = game.time?.components;
  if (!calendar || !k) return null;

  const stunden = calendar.days?.hoursPerDay ?? 24;
  const jetzt = (k.hour ?? 0) + (k.minute ?? 0) / 60;
  const { aufgang, untergang, geschaetzt } = sonnenzeiten(calendar);
  const tag = jetzt >= aufgang && jetzt < untergang;

  // Anteil des zurückgelegten Wegs: tagsüber von Auf- bis Untergang, nachts
  // von Unter- bis Aufgang über Mitternacht hinweg.
  const anteil = tag
    ? (jetzt - aufgang) / Math.max(0.001, untergang - aufgang)
    : ((jetzt < aufgang ? jetzt + stunden : jetzt) - untergang)
      / Math.max(0.001, stunden - (untergang - aufgang));

  // Die Bahn ist ein innerer Halbkreis um den Mittelpunkt der Kuppel: links am
  // Horizont auf, oben im Scheitel, rechts wieder unter.
  const boden = RADIUS;
  const bahn = RADIUS - GESTIRN - 5;
  const x = RADIUS - bahn * Math.cos(Math.PI * anteil);
  const y = boden - bahn * Math.sin(Math.PI * anteil);

  const mond = tag ? null : mondphase(calendar);
  // Nacht: tiefes Blau oben, ein Schimmer Grün am Horizont - so sieht ein
  // Nachthimmel über einer Landschaft aus und nicht wie ein schwarzer Kasten.
  const himmel = tag
    ? ["#7db9e0", "#d9ecf6"]
    : ["#0a1622", "#1d4a45"];

  const sterne = tag ? "" : STERNE
    .map(([sx, sy], i) => `<circle cx="${sx}" cy="${sy}" r="${i % 3 === 0 ? 1.6 : 1.1}" fill="#ffffff" opacity="${i % 2 ? 0.85 : 0.5}"/>`)
    .join("");

  const cx = x.toFixed(1);
  const cy = y.toFixed(1);
  const gestirn = tag
    ? `<circle cx="${cx}" cy="${cy}" r="${GESTIRN * 1.7}" fill="#ffd76a" opacity="0.22"/>
       <circle cx="${cx}" cy="${cy}" r="${GESTIRN}" fill="#ffdd7a"/>`
    // Der Mond bekommt einen Hof und eine helle Sichel. Die unbeleuchtete
    // Scheibe bleibt als dunkler Kreis stehen, sonst schwebt bei Neumond nichts
    // mehr am Himmel und man weiß nicht, ob der Bogen kaputt ist.
    : mondBild(cx, cy, mond);

  const id = `${MODULE_ID}-sky`;
  const svg = `<svg class="inperson-sky" viewBox="0 0 ${BREITE} ${HOEHE}" width="${BREITE}" height="${HOEHE}" role="img" aria-label="${escape(hinweisText(aufgang, untergang, mond, geschaetzt))}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${himmel[0]}"/><stop offset="1" stop-color="${himmel[1]}"/>
    </linearGradient></defs>
    <path d="M 0 ${boden} A ${RADIUS} ${RADIUS} 0 0 1 ${BREITE} ${boden} Z" fill="url(#${id})"/>
    ${sterne}
    <path d="M 0 ${boden} A ${RADIUS} ${RADIUS} 0 0 1 ${BREITE} ${boden}" fill="none" stroke="#D4AF37" stroke-opacity="0.45" stroke-width="1"/>
    ${gestirn}
  </svg>`;

  return { svg, hinweis: hinweisText(aufgang, untergang, mond, geschaetzt) };
}

/**
 * Stunden als Uhrzeit.
 *
 * Erst auf Minuten runden, dann teilen - andersherum wird aus 19,99993 Stunden
 * "19:60", weil die Minuten für sich gerundet auf 60 kommen. Genau das stand im
 * ersten Lauf des Rechentests.
 */
function uhr(stunden) {
  const proTag = (game.time?.calendar?.days?.hoursPerDay ?? 24) * 60;
  const minuten = ((Math.round(stunden * 60) % proTag) + proTag) % proTag;
  return `${String(Math.floor(minuten / 60)).padStart(2, "0")}:${String(minuten % 60).padStart(2, "0")}`;
}

function hinweisText(aufgang, untergang, mond, geschaetzt) {
  const zeilen = [
    game.i18n.format("INPERSON.Clock.SunTimes", { up: uhr(aufgang), down: uhr(untergang) })
  ];
  if (mond?.name) {
    zeilen.push(mond.mondname ? `${mond.mondname}: ${mond.name}` : mond.name);
  }
  if (geschaetzt) zeilen.push(game.i18n.localize("INPERSON.Clock.SunGuessed"));
  return zeilen.join(" · ");
}

const escape = s => foundry.utils.escapeHTML?.(String(s ?? "")) ?? String(s ?? "");
