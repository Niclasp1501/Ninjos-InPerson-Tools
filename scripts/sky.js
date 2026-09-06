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
 * Leiste an dessen Vorhandensein und an dessen Dateinamen, und auf 28 Pixel
 * verkleinert waren die Bilder ohnehin nicht mehr rund. Und der Bogen läuft
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
const RADIUS = 80;
const BREITE = RADIUS * 2;
const HOEHE = RADIUS + 2;
const GESTIRN = 14;
/** Dämmerung: so lange vor Aufgang bzw. nach Untergang blendet der Himmel, in Stunden. */
const DAEMMERUNG = 1;

/**
 * Eine laufende Nummer je gezeichneter Kuppel, für die Kennungen im SVG.
 *
 * Verläufe und Ausschnitte werden über `url(#name)` angesprochen, und diese
 * Namen gelten im ganzen Dokument, nicht nur im eigenen Bild. Standen zwei
 * Kuppeln nebeneinander, holten sich beide den Verlauf der ersten - im
 * Prüfbild vom 06.09.2026 waren dadurch sämtliche Nachtkuppeln taghell. In
 * der Leiste steht nur eine, aber falsch ist es trotzdem, und die
 * Einstellungsseite könnte morgen eine Vorschau danebenstellen.
 */
let laufnummer = 0;

/** Kennung für dieses eine Bild. */
function kennung(name) {
  return `${MODULE_ID}-${name}-${laufnummer}`;
}

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

  // Calendaria hängt dem Weltkalender sunrise()/sunset() an. Dann gilt
  // dessen Antwort - der Spielleiter sieht Calendarias Kuppel, und beide
  // sollen zur selben Minute hell werden. Gemessen: 04:41 dort, 04:34 bei
  // unserer eigenen Welle.
  try {
    if (typeof calendar?.sunrise === "function" && typeof calendar?.sunset === "function") {
      const auf = Number(calendar.sunrise());
      const unter = Number(calendar.sunset());
      if (Number.isFinite(auf) && Number.isFinite(unter) && unter > auf) {
        return { aufgang: auf, untergang: unter, geschaetzt: false };
      }
    }
  } catch { /* dann selbst rechnen */ }

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
function mondphaseRechnen(calendar, mond) {
  const jahr = tageProJahr(calendar);
  const k = game.time.components;
  const heute = (k.year ?? 0) * jahr + tagImJahr(calendar, k)
    + ((k.hour ?? 0) * 60 + (k.minute ?? 0)) / (24 * 60);

  const bezug = mond.referenceDate ?? { year: 0, month: 0, dayOfMonth: 0 };
  const bezugstag = (bezug.year ?? 0) * jahr
    + tagImJahr(calendar, { month: bezug.month ?? 0, dayOfMonth: bezug.dayOfMonth ?? 0 });

  const phasen = Object.values(mond.phases ?? {});
  // referencePhase ist ein Index in die Phasenliste (so führt Calendaria es),
  // cycleDayAdjust eine Verschiebung in Tagen.
  const startphase = phasen[mond.referencePhase ?? 0]?.start ?? 0;
  const versatz = Number.isFinite(mond.cycleDayAdjust) ? mond.cycleDayAdjust : 0;
  const roh = (heute - bezugstag + versatz) / mond.cycleLength + startphase;
  const anteil = ((roh % 1) + 1) % 1;
  const treffer = phasen.find(p => anteil >= (p.start ?? 0) && anteil < (p.end ?? 1));

  return {
    anteil,
    name: treffer?.name ? game.i18n.localize(treffer.name) : null,
    mondname: mond.name ? game.i18n.localize(mond.name) : null,
    farbe: aufhellen(mond.color) || "#e9e9e4"
  };
}

/**
 * Alle Monde dieser Welt, jeder mit seiner eigenen Phase.
 *
 * Faerûn hat einen, aber ein Kalender darf beliebig viele führen - und wer
 * eine Welt mit zwei Monden spielt, will beide am Himmel sehen. Bis
 * 14.2611.64 zeichneten wir stur den ersten.
 *
 * **Verstecken wird geachtet.** Calendaria kann Monde vor Spielern verbergen
 * (`hideMoonsFromPlayers`), und dann darf unsere Kuppel sie erst recht nicht
 * zeigen: Sie steht auf dem Tablet eines Spielers. Ohne Erlaubnis kommt eine
 * leere Liste zurück, und am Himmel steht nichts - der Bogen bleibt, die
 * Sterne bleiben, nur der Mond fehlt.
 */
export function mondphasen(calendar) {
  try {
    const darf = globalThis.CALENDARIA?.permissions?.canViewMoons;
    if (typeof darf === "function" && !darf()) return [];
  } catch { /* keine Auskunft heißt: zeigen, wie ohne Calendaria */ }

  const monde = Object.values(calendar?.moons ?? {}).filter(m => m?.cycleLength);
  if (!monde.length) return [];

  // Läuft Calendaria, sind dessen Antworten die richtigen - nicht, weil unsere
  // Rechnung falsch wäre (sie trifft dieselbe Phase), sondern weil der
  // Spielleiter dessen Anzeige sieht und beide dasselbe zeigen müssen. Die
  // Farbe steht dort nicht mit drin; die holen wir über den Index nach.
  const fremd = globalThis.CALENDARIA?.api?.getAllMoonPhases?.();
  if (Array.isArray(fremd) && fremd.length) {
    return fremd
      .filter(p => Number.isFinite(p?.position))
      .map(p => {
        const roh = monde[p.moonIndex] ?? monde[0];
        return {
          anteil: ((p.position % 1) + 1) % 1,
          name: p.name ?? null,
          // Die feinere Auskunft, wenn Calendaria sie mitliefert:
          // "Aufsteigend Abnehmender Mond" statt nur "Abnehmender Mond".
          unterphase: p.subPhaseName ?? null,
          mondname: p.moonName ?? (roh?.name ? game.i18n.localize(roh.name) : null),
          farbe: aufhellen(roh?.color) || "#e9e9e4"
        };
      });
  }

  return monde.filter(m => m.visibility !== "hidden").map(m => mondphaseRechnen(calendar, m));
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
  [28, 62], [40, 42], [56, 26], [74, 16], [92, 14], [110, 24],
  [124, 42], [134, 62], [64, 50], [98, 38], [80, 34], [46, 60],
  [116, 58], [70, 66], [104, 66], [86, 52], [36, 72], [120, 72]
];

/**
 * Der Mond, gezeichnet - nicht das Bild des Kalendermoduls.
 *
 * Das Bild hatte ich zwischendurch genommen, weil es "das Original" war. Auf
 * 28 Pixel herunterskaliert war es weder rund noch scharf: eine Rasterdatei,
 * für 64 Pixel gemacht. Ein Kreis im SVG ist auf jedem Schirm ein Kreis, und
 * die Phase kommt als Fläche aus demselben Anteil, aus dem auch der Name kommt.
 *
 * Aufbau von hinten nach vorn: Hof, dunkle Scheibe (damit bei Neumond etwas
 * am Himmel steht), die beleuchtete Fläche mit einem Verlauf, der zum
 * Schattenrand hin leicht abdunkelt, und ein feiner heller Rand.
 */
function mondBild(cx, cy, mond, deckkraft = 1, groesse = 1) {
  const x = Number(cx);
  const y = Number(cy);
  const r = GESTIRN * groesse;
  const anteil = mond?.anteil ?? 0.5;
  const farbe = mond?.farbe ?? "#e9e9e4";
  const id = kennung("moon");
  const lichtSeite = anteil < 0.5 ? "70%" : "30%";
  return `<g opacity="${deckkraft.toFixed(2)}">
    <defs><radialGradient id="${id}" cx="${lichtSeite}" cy="35%" r="75%">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="${farbe}"/><stop offset="1" stop-color="${farbe}" stop-opacity="0.82"/>
    </radialGradient></defs>
    <circle class="inperson-sky-mondhof" cx="${cx}" cy="${cy}" r="${(r * 1.8).toFixed(1)}" fill="#dfe8ff" opacity="0.14"/>
    <circle cx="${cx}" cy="${cy}" r="${(r * 1.25).toFixed(1)}" fill="#dfe8ff" opacity="0.1"/>
    <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="#1f2635"/>
    <path d="${mondPfad(x, y, r, anteil)}" fill="url(#${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="0.7"/></g>`;
}

/**
 * Der beleuchtete Teil des Mondes als Pfad.
 *
 * Anteil 0 ist Neumond, 0,5 Vollmond; zunehmend (< 0,5) ist rechts hell,
 * abnehmend links. Der Rand ist ein Halbkreis auf der hellen Seite, der
 * Schattenrand eine Halbellipse mit Breite |cos|·r: bei einer Sichel wölbt sie
 * sich zur hellen Seite, bei mehr als halb zur dunklen.
 *
 * Die Bogenrichtung war falsch herum - bei 0,64 (abnehmend, 82 % hell) stand
 * eine Sichel rechts. In SVG heißt sweep=1 im Uhrzeigersinn: von oben nach
 * unten über die rechte Seite. Von unten zurück nach oben über die rechte
 * Seite ist dann sweep=0.
 */
export function mondPfad(cx, cy, r, anteil) {
  const k = Math.cos(2 * Math.PI * anteil);        // 1 bei Neumond, -1 bei Vollmond
  const rx = Math.abs(k) * r;
  const zunehmend = anteil < 0.5;
  const aussen = zunehmend ? 1 : 0;                // Halbkreis über die helle Seite
  // Sichel (k > 0): Schattenrand wölbt sich zur hellen Seite - also zurück
  // über dieselbe Seite wie der Außenbogen, was die entgegengesetzte
  // sweep-Richtung ist. Mehr als halb: über die dunkle Seite.
  const innen = k > 0 ? 1 - aussen : aussen;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${aussen} ${cx} ${cy + r}`
    + ` A ${rx.toFixed(2)} ${r} 0 0 ${innen} ${cx} ${cy - r} Z`;
}

/**
 * Der Bogen als SVG.
 *
 * Der Himmel ist die Fläche unter dem Bogen und wechselt die Farbe mit der
 * Tageszeit; das Gestirn wandert von links (Aufgang) nach rechts (Untergang) -
 * tagsüber die Sonne über dem Bogen, nachts der Mond.
 * @returns {{svg: string, hinweis: string}|null}
 */
export function himmelsbogen(wetter = null) {
  const calendar = game.time?.calendar;
  const k = game.time?.components;
  if (!calendar || !k) return null;
  // Neue Nummer fuer alle Kennungen dieses Bildes - siehe kennung().
  laufnummer++;

  const stunden = calendar.days?.hoursPerDay ?? 24;
  const jetzt = (k.hour ?? 0) + (k.minute ?? 0) / 60;
  const { aufgang, untergang, geschaetzt } = sonnenzeiten(calendar);
  const tag = jetzt >= aufgang && jetzt < untergang;

  // Wie hell ist es? 0 Nacht, 1 Tag, dazwischen Dämmerung: eine Stunde vor
  // dem Aufgang beginnt der Himmel zu blauen, eine Stunde nach dem Untergang
  // ist er wieder dunkel. Calendaria blendet ebenso - um 05:00, kurz nach
  // dem Aufgang, war seine Kuppel noch dunkel, unsere schon Tag.
  const nachAufgang = jetzt - aufgang;
  const vorUntergang = untergang - jetzt;
  const helligkeit = Math.max(0, Math.min(1,
    Math.min(nachAufgang + DAEMMERUNG, vorUntergang + DAEMMERUNG) / (2 * DAEMMERUNG)
  ));
  const daemmert = helligkeit > 0 && helligkeit < 1;

  // Anteil des zurückgelegten Wegs: tagsüber von Auf- bis Untergang, nachts
  // von Unter- bis Aufgang über Mitternacht hinweg. In der Dämmerung steht die
  // Sonne knapp unter dem Horizont - die Kuppel schneidet sie ab, ihr Schein
  // bleibt.
  const tagesanteil = (jetzt - aufgang) / Math.max(0.001, untergang - aufgang);
  const nachtanteil = ((jetzt < aufgang ? jetzt + stunden : jetzt) - untergang)
    / Math.max(0.001, stunden - (untergang - aufgang));

  const boden = RADIUS;
  const bahn = RADIUS - GESTIRN - 5;
  const ort = anteil => ({
    x: RADIUS - bahn * Math.cos(Math.PI * anteil),
    y: boden - bahn * Math.sin(Math.PI * anteil)
  });

  const mischen = (a, b, t) => {
    const c = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const [p, q] = [c(a), c(b)];
    return "#" + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  // Nacht wie Calendarias Sternenfeld (tiefes Nachtblau nach fast Schwarz),
  // Tag aus dessen Kuppel abgelesen (Himmelblau nach Dunst am Horizont).
  const nacht = ["#0d1033", "#0a0a1a", "#05050f"];
  // Nebeneinandergehalten war unser Tageshimmel eine Spur zu satt und zu
  // blau; Calendarias wirkt matter und geht zum Horizont in einen Dunst über
  // statt in helles Blau. Abgelesen aus dem Vergleichsbild vom 06.09.2026.
  const tagfarben = ["#86b4d2", "#aecee2", "#cfe0e8"];
  const tageszeit = nacht.map((f, i) => mischen(f, tagfarben[i], helligkeit));

  // Und darüber das Wetter: Bei Regen wird der Himmel grau, beim Sandsturm
  // ockerfarben, beim Gewitter fast schwarz. Ohne das blieb er immer blau und
  // die Tropfen hingen davor wie aufgeklebt - der auffälligste Unterschied
  // zu Calendarias Kuppel. Die Stärke sagt, wie weit die Tageszeit weichen
  // muss; bei "windig" sind es 15 %, beim Nullfront 95 %.
  const art = wetterArt(wetter);
  const himmel = art?.toenung
    ? tageszeit.map((f, i) => mischen(f, art.toenung.farben[i], art.toenung.staerke))
    : tageszeit;
  // Morgen- und Abendrot am Horizont, am stärksten mitten in der Dämmerung.
  const rot = Math.sin(Math.PI * helligkeit);

  // Die Sterne funkeln, seit die Nacht sonst das einzige stille Bild war: Am
  // Tag zieht die Sonne, bei Regen fällt etwas - nachts stand alles. Jeder
  // Stern bekommt seine Grundhelligkeit als Variable und eine eigene
  // Verzögerung, damit sie nicht im Gleichtakt blinken.
  const sterne = helligkeit >= 1 ? "" : `<g class="inperson-sky-sterne">${STERNE
    .map(([sx, sy], i) => {
      const grund = ((i % 2 ? 0.85 : 0.5) * (1 - helligkeit)).toFixed(2);
      return `<circle cx="${sx}" cy="${sy}" r="${i % 3 === 0 ? 1.4 : 1}" fill="#ffffff"
        style="--stern:${grund};animation-delay:-${(i * 0.37).toFixed(2)}s"/>`;
    })
    .join("")}</g>`;

  const id = kennung("sky");
  let gestirn = "";

  // Sonne: sichtbar von einer Stunde vor Aufgang bis eine Stunde nach
  // Untergang; darunter hält der Kuppelrand sie auf.
  if (helligkeit > 0) {
    const { x, y } = ort(tagesanteil);
    gestirn += `
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(GESTIRN * 1.9).toFixed(1)}" fill="url(#${id}-sonnenschein)"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(GESTIRN * 0.85).toFixed(1)}" fill="#ffdf82"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(GESTIRN * 0.5).toFixed(1)}" fill="#fff6d2"/>`;
  }
  // Mond: solange es nicht voller Tag ist.
  // Alle Monde der Welt, einer hinter dem anderen auf derselben Bahn - so
  // hält es Calendaria auch. Bei mehreren wird jeder etwas kleiner, sonst
  // schieben sie sich auf 160 Pixeln übereinander. Wer noch nicht
  // aufgegangen ist, bleibt unter dem Horizont; der vorderste steht immer da,
  // damit bei Neumond nicht der ganze Himmel leer wirkt.
  const monde = helligkeit < 1 ? mondphasen(calendar) : [];
  if (helligkeit < 1) {
    // Abstand und Größe sind gemessen, nicht geraten: Die Bahn ist ein
    // Halbkreis mit Radius 61, also gut 190 Pixel lang. Bei 0,11 Abstand
    // standen zwei Monde 21 Pixel auseinander und waren zusammen 25 breit -
    // sie klebten aneinander. 0,17 sind 33 Pixel und lassen auch bei vier
    // Monden eine Lücke.
    const liste = monde.length ? monde : [null];
    const groesse = Math.max(0.55, 1 - 0.12 * (liste.length - 1));
    liste.forEach((mond, i) => {
      const anteilDavon = nachtanteil - i * 0.17;
      if (i > 0 && anteilDavon < 0) return;
      const { x, y } = ort(Math.max(0, anteilDavon));
      gestirn += mondBild(x.toFixed(1), y.toFixed(1), mond, 1 - helligkeit, groesse);
    });
  }

  const svg = `<svg class="inperson-sky" viewBox="0 0 ${BREITE} ${HOEHE}" width="${BREITE}" height="${HOEHE}" role="img" aria-label="${escape(hinweisText(aufgang, untergang, monde, geschaetzt))}">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${himmel[0]}"/><stop offset="0.55" stop-color="${himmel[1]}"/><stop offset="1" stop-color="${himmel[2]}"/>
      </linearGradient>
      <linearGradient id="${id}-rot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.45" stop-color="#ff9a4a" stop-opacity="0"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="${(0.55 * rot).toFixed(2)}"/>
      </linearGradient>
      <radialGradient id="${id}-sonnenschein">
        <stop offset="0" stop-color="#ffe7a0" stop-opacity="0.75"/><stop offset="0.45" stop-color="#ffd76a" stop-opacity="0.3"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}-rand" cx="50%" cy="100%" r="100%">
        <stop offset="0.7" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.45"/>
      </radialGradient>
      <clipPath id="${id}-kuppel"><path d="M 0 ${boden} A ${RADIUS} ${RADIUS} 0 0 1 ${BREITE} ${boden} Z"/></clipPath>
    </defs>
    <g clip-path="url(#${id}-kuppel)">
      <rect x="0" y="0" width="${BREITE}" height="${HOEHE}" fill="url(#${id})"/>
      ${daemmert ? `<rect x="0" y="0" width="${BREITE}" height="${HOEHE}" fill="url(#${id}-rot)"/>` : ""}
      ${sterne}
      ${gestirn}
      ${wetterBild(art, helligkeit)}
      <rect x="0" y="0" width="${BREITE}" height="${HOEHE}" fill="url(#${id}-rand)"/>
    </g>
    <path d="M 0 ${boden} A ${RADIUS} ${RADIUS} 0 0 1 ${BREITE} ${boden}" fill="none" stroke="#4a4a4a" stroke-width="1.8"/>
  </svg>`;

  return { svg, hinweis: hinweisText(aufgang, untergang, monde, geschaetzt) };
}

/* ── Wetter ─────────────────────────────────────────────────────── */

/**
 * Feste Zufallszahlen: Die Kuppel zeichnet sich jede Minute neu, und Tropfen,
 * die dabei umsortiert würden, sähe man springen.
 */
function reihe(saat, n) {
  const aus = [];
  let x = saat;
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    aus.push(x / 2147483648);
  }
  return aus;
}

/**
 * Alle 41 Wetter von Calendaria, jedes mit einem eigenen Bild.
 *
 * Calendaria zeichnet seine Kuppel mit einer PixiJS-Partikelszene. Die
 * übernehmen wir nicht — eine zweite Grafik-Engine auf einem Tablet, dessen
 * Spielfeld wir gerade abschalten, ist der falsche Preis. Stattdessen ein
 * knappes Dutzend Bausteine aus Strichen, Punkten und Flächen, die das CSS
 * bewegt; jedes Wetter ist ein Rezept daraus. Der Eindruck ist derselbe, die
 * Kosten sind es nicht.
 *
 * Der Schlüssel ist die Effektvorlage, weil die in Calendarias
 * Welteinstellung tatsächlich gespeichert wird — das Feld hudEffect, das dort
 * dieselbe Aufgabe hat, fällt beim Speichern heraus. Wer eigenes Wetter
 * anlegt, landet über Niederschlagsart und Wind trotzdem bei einem Bild.
 *
 * Die Farben sind Calendarias eigene, aufgehellt: Auf einem nachtblauen
 * Himmel muss ein Tropfen heller sein als in einer Farbtabelle.
 */
/** Für die Prüfung sichtbar: tools/test-sky.mjs geht die Tabelle durch. */
export const WETTER_VORLAGEN = {
  // Standard
  "partly-cloudy":    { wolken: 0.3 , himmel: "clouds-light" },
  cloudy:             { wolken: 0.65 , himmel: "clouds-heavy" },
  overcast:           { wolken: 1 , himmel: "clouds-overcast" },
  drizzle:            { regen: 0.3 , himmel: "rain" },
  rain:               { regen: 0.65, wolken: 0.4 , himmel: "rain" },
  sunshower:          { regen: 0.35 , himmel: "rain" },
  fog:                { nebel: 0.8 , himmel: "fog" },
  mist:               { nebel: 0.45 , himmel: "fog" },
  windy:              { fahnen: 0.6, wolken: 0.35 , himmel: "gust" },
  snow:               { flocken: 0.6 , himmel: "snow" },
  sleet:              { regen: 0.45, koerner: 0.35 , himmel: "sleet" },
  "heat-wave":        { flimmern: 1 , himmel: "haze" },
  // Schwer
  thunderstorm:       { regen: 0.9, wolken: 0.8, blitz: "#ffffff" , himmel: "lightning" },
  blizzard:           { flocken: 1, fahnen: 0.7, wolken: 0.6 , himmel: "snow-heavy" },
  hail:               { koerner: 0.8, wolken: 0.5 , himmel: "hail" },
  tornado:            { wirbel: 1, wolken: 0.9, regen: 0.5, fahnen: 0.6 , himmel: "tornado" },
  hurricane:          { regen: 1, wolken: 0.9, fahnen: 1 , himmel: "hurricane" },
  "ice-storm":        { koerner: 0.7, flocken: 0.3, wolken: 0.5, farbe: "#cfeaff" , himmel: "ice" },
  monsoon:            { regen: 1, wolken: 0.8, fahnen: 0.4 , himmel: "rain-heavy" },
  // Umwelt
  ashfall:            { flocken: 0.55, nebel: 0.25, farbe: "#a2988c" , himmel: "ashfall" },
  sandstorm:          { fahnen: 1, nebel: 0.55, farbe: "#d9b57a" , himmel: "sand" },
  "luminous-sky":     { aurora: 1 , himmel: "aurora" },
  "sakura-bloom":     { blaetter: 0.5, farbe: "#ffc2ce" , himmel: "petals" },
  "autumn-leaves":    { blaetter: 0.5, farbe: "#e08a44" , himmel: "leaves" },
  "rolling-fog":      { nebel: 1 , himmel: "fog" },
  "wildfire-smoke":   { rauch: 0.8, nebel: 0.35, farbe: "#a97a52" , himmel: "smoke" },
  "dust-devil":       { fahnen: 0.7, wirbel: 0.5, farbe: "#d3ad76" , himmel: "sand" },
  // Fantasy
  "black-sun":        { dunkel: 0.85 , himmel: "void" },
  "ley-surge":        { funken: 0.9, blitz: "#7fc6ff", farbe: "#5ab8ff" , himmel: "ley-surge" },
  "aether-haze":      { nebel: 0.6, funken: 0.25, farbe: "#b98ade" , himmel: "aether" },
  nullfront:          { rauschen: 0.8 , himmel: "nullstatic" },
  "permafrost-surge": { flocken: 0.5, koerner: 0.35, nebel: 0.3, farbe: "#bfe6f5" , himmel: "ice" },
  gravewind:          { schemen: 0.8, farbe: "#9fd8b8" , himmel: "spectral" },
  veilfall:           { regen: 0.35, nebel: 0.3, farbe: "#c3b4e8" , himmel: "veil" },
  "arcane-winds":     { fahnen: 0.7, funken: 0.45, farbe: "#c98ceb" , himmel: "arcane-wind" },
  "acid-rain":        { regen: 0.6, farbe: "#9ade6a" , himmel: "rain-acid" },
  "blood-rain":       { regen: 0.7, farbe: "#cf4a5e" , himmel: "rain-blood" },
  "meteor-shower":    { meteore: 1 , himmel: "meteors" },
  "spore-cloud":      { flocken: 0.55, langsam: true, nebel: 0.2, farbe: "#a8c85e" , himmel: "spores" },
  "divine-light":     { strahlen: 1 , himmel: "divine" },
  "plague-miasma":    { nebel: 0.85, farbe: "#8fa055" , himmel: "miasma" }
};


/**
 * Wie das Wetter den Himmel einfärbt.
 *
 * Das war der auffälligste Unterschied zu Calendarias Kuppel und der Grund
 * für die Frage "warum sieht das bei uns anders aus": Nicht die Tropfen sind
 * es, sondern der Himmel dahinter. Bei Regen wird er dort grau, bei Sandsturm
 * ockerfarben, beim Gewitter fast schwarz - wir hatten immer denselben
 * blauen Verlauf mit Strichen davor.
 *
 * Die Werte stammen aus Calendaria (MIT, siehe LICENSE): je Effekt eine
 * Stärke und drei Farben für oben, Mitte und unten. Sie hier nachzubauen
 * hätte geraten geheißen; genommen sind sie gemessen, und beide Kuppeln
 * zeigen denselben Himmel - was der eigentliche Zweck ist, wenn Spielleiter
 * und Tisch nebeneinander sitzen.
 */
const HIMMELSTOENUNG = {
  "clouds-light": { staerke: 0.5, farben: ["#a0aab9", "#afb9c8", "#bec8d7"] },
  "clouds-heavy": { staerke: 0.7, farben: ["#737882", "#828791", "#969ba5"] },
  "clouds-overcast": { staerke: 0.85, farben: ["#5f5f64", "#6e6e73", "#828287"] },
  rain: { staerke: 0.75, farben: ["#464b5a", "#555a69", "#646978"] },
  "rain-heavy": { staerke: 0.85, farben: ["#323746", "#414452", "#50525f"] },
  snow: { staerke: 0.6, farben: ["#b9c3d2", "#c3cddc", "#d2dae6"] },
  "snow-heavy": { staerke: 0.7, farben: ["#c3c8d7", "#cdd2e1", "#d7dceb"] },
  fog: { staerke: 0.8, farben: ["#afb2b4", "#b9bcbe", "#c8cacd"] },
  lightning: { staerke: 0.9, farben: ["#232337", "#2d3044", "#3c3e50"] },
  sand: { staerke: 0.85, farben: ["#b9a064", "#c8af73", "#d7be82"] },
  ashfall: { staerke: 0.85, farben: ["#5a4632", "#785f46", "#96785a"] },
  embers: { staerke: 0.85, farben: ["#a06e3c", "#b47d46", "#c38c50"] },
  ice: { staerke: 0.6, farben: ["#a0c3dc", "#afcde6", "#bed7f0"] },
  hail: { staerke: 0.8, farben: ["#464b5f", "#5a5f73", "#6e7382"] },
  tornado: { staerke: 0.9, farben: ["#2d3228", "#3c4132", "#4b4e41"] },
  hurricane: { staerke: 0.9, farben: ["#323741", "#414450", "#50525f"] },
  nullstatic: { staerke: 0.95, farben: ["#0c0a10", "#120f16", "#19161e"] },
  gust: { staerke: 0.15, farben: ["#b4bec8", "#bec8d2", "#c8d2dc"] },
  aurora: { staerke: 0.85, farben: ["#0a0823", "#143c32", "#0f193c"] },
  aether: { staerke: 0.8, farben: ["#64285a", "#823c78", "#a05096"] },
  void: { staerke: 0.95, farben: ["#0f0a0c", "#160f12", "#1e1619"] },
  spectral: { staerke: 0.8, farben: ["#1e2832", "#2d3c32", "#3c5041"] },
  arcane: { staerke: 0.7, farben: ["#2850a0", "#3c78c8", "#64b4e6"] },
  "arcane-wind": { staerke: 0.8, farben: ["#502864", "#6e3c82", "#8c50a0"] },
  veil: { staerke: 0.75, farben: ["#50466e", "#6e648c", "#8c82aa"] },
  petals: { staerke: 0.4, farben: ["#8c82b4", "#b496aa", "#dcb4be"] },
  sleet: { staerke: 0.75, farben: ["#505564", "#5f6473", "#737887"] },
  haze: { staerke: 0.5, farben: ["#c8b48c", "#d7c39b", "#e6d2aa"] },
  leaves: { staerke: 0.35, farben: ["#a0825a", "#b49664", "#c8aa78"] },
  smoke: { staerke: 0.9, farben: ["#3c3228", "#504132", "#645541"] },
  "rain-acid": { staerke: 0.8, farben: ["#28501e", "#37642d", "#46783c"] },
  "rain-blood": { staerke: 0.85, farben: ["#501419", "#641e23", "#78282d"] },
  meteors: { staerke: 0.6, farben: ["#0f0a1e", "#1e142d", "#32233c"] },
  spores: { staerke: 0.7, farben: ["#3c5028", "#4b6437", "#5a7846"] },
  divine: { staerke: 0.6, farben: ["#c8b464", "#dcc882", "#f0dca0"] },
  miasma: { staerke: 0.85, farben: ["#323c1e", "#414e28", "#505f37"] },
  "ley-surge": { staerke: 0.75, farben: ["#321e78", "#503ca0", "#7864c8"] },
};

/** Ein RGB-Tripel aus fremden Daten als Farbe, oder nichts. */
function tripelAlsFarbe(wert) {
  if (!Array.isArray(wert) || wert.length < 3) return null;
  const teil = i => Math.max(0, Math.min(255, Math.round(Number(wert[i]) || 0)));
  return `#${[0, 1, 2].map(i => teil(i).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Hat der Spielleiter für dieses Wetter eine eigene Himmelsfarbe hinterlegt?
 *
 * Calendaria kennt zwei Wege dorthin, und beide stehen in Welteinstellungen,
 * die uns offenstehen: selbst angelegtes Wetter trägt seine Farben direkt,
 * und für die eingebauten gibt es eine Liste von Übersteuerungen. Fehlt eine
 * der drei Farben, füllt die Vorlage sie auf - genau wie dort.
 */
function toenungUebersteuert(wetter, vorlage) {
  const id = String(wetter?.id ?? "");
  if (!id) return null;

  const ausSatz = satz => {
    if (!satz) return null;
    const farben = ["top", "mid", "bottom"].map((k, i) => tripelAlsFarbe(satz[k]) ?? vorlage?.farben?.[i]);
    if (farben.some(f => !f)) return null;
    return { staerke: Number.isFinite(satz.strength) ? satz.strength : (vorlage?.staerke ?? 0.7), farben };
  };

  try {
    const eigene = game.settings.get("calendaria", "customWeatherPresets");
    const treffer = Array.isArray(eigene) ? eigene.find(p => p?.id === id) : null;
    if (treffer?.category === "custom") {
      const aus = ausSatz(treffer.skyOverrides);
      if (aus) return aus;
    }
  } catch { /* Einstellung gibt es nicht */ }

  try {
    const ueber = game.settings.get("calendaria", "weatherVisualOverrides");
    const aus = ausSatz(ueber?.[id]?.skyOverrides);
    if (aus) return aus;
  } catch { /* Einstellung gibt es nicht */ }

  return null;
}

/** Nur echte Farbangaben durchlassen - der Wert kommt aus fremden Daten. */
function farbeOk(wert) {
  return /^#[0-9a-f]{6}$/i.test(String(wert ?? "")) ? String(wert) : null;
}

/** Calendarias Dichte- und Tempostufen als Faktor. */
function stufe(wert, ersatz = 1) {
  return { "very-low": 0.45, low: 0.7, medium: 1, high: 1.35, "very-high": 1.7 }[wert] ?? ersatz;
}

/**
 * Aus dem gemeldeten Wetter ein Rezept machen.
 *
 * Erst die Vorlage, dann - für selbst angelegtes Wetter - der Rückfall auf
 * Niederschlagsart und Wind. Was gar nichts hergibt, bleibt ein klarer
 * Himmel; auch das ist ein Wetter.
 */
export function wetterArt(wetter) {
  if (!wetter) return null;
  const preset = String(wetter.fxPreset ?? wetter.id ?? "").toLowerCase();
  const dichte = stufe(wetter.fxDensity);
  const tempo = stufe(wetter.fxSpeed);
  const wind = Math.max(0, Math.min(1, (Number(wetter.wind?.speed) || 0) / 5));
  const eigen = farbeOk(wetter.fxColor);

  let rezept = WETTER_VORLAGEN[preset];
  if (!rezept) {
    // Eigenes Wetter: aus dem, was jedes Wetter hat.
    const typ = String(wetter.precipitation?.type ?? "").toLowerCase();
    const menge = Math.max(0.2, Math.min(1, Number(wetter.precipitation?.intensity) || 0.5));
    if (typ === "rain" || typ === "drizzle") rezept = { regen: menge };
    else if (typ === "snow") rezept = { flocken: menge };
    else if (typ === "sleet" || typ === "hail") rezept = { koerner: menge };
    else if (wind > 0.5) rezept = { fahnen: wind };
    else return null;
  }

  const vorlage = HIMMELSTOENUNG[rezept.himmel] ?? null;
  return {
    ...rezept,
    wind, dichte, tempo,
    farbe: eigen ?? rezept.farbe ?? null,
    toenung: toenungUebersteuert(wetter, vorlage) ?? vorlage
  };
}

/* ── Die Bausteine ───────────────────────────────────────────────
   Jeder gibt SVG zurück und bewegt sich über eine Klasse aus dem
   Stylesheet. Zahlen und Verzögerungen stammen aus reihe(), damit die
   Kuppel beim Neuzeichnen nicht springt. */

/** Fallende Striche: Regen in jeder Stärke. */
function malRegen({ menge, farbe, wind, dichte, tempo }) {
  const n = Math.round((10 + 24 * menge) * dichte);
  const z = reihe(7, n * 2);
  const laenge = 8 + 9 * menge;
  const dauer = Math.max(0.35, (1.15 - 0.55 * menge) / tempo);
  const striche = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(z[i * 2] * BREITE);
    const verzug = (z[i * 2 + 1] * dauer).toFixed(2);
    striche.push(`<line x1="${x}" y1="${-laenge}" x2="${x}" y2="0" style="animation-delay:-${verzug}s"/>`);
  }
  return `<g class="inperson-sky-regen" transform="rotate(${Math.round(-6 - 20 * wind)} ${RADIUS} ${RADIUS})"
    stroke="${farbe ?? "#dfeeff"}" stroke-opacity="${(0.35 + 0.35 * menge).toFixed(2)}" stroke-width="1"
    stroke-linecap="round" style="--dauer:${dauer.toFixed(2)}s">${striche.join("")}</g>`;
}

/** Schwebende Punkte: Schnee, Asche, Sporen. */
function malFlocken({ menge, farbe, wind, dichte, tempo, langsam }) {
  const n = Math.round((8 + 20 * menge) * dichte);
  const z = reihe(13, n * 3);
  const dauer = Math.max(1.6, ((langsam ? 8 : 5) - 2.5 * menge) / tempo);
  const punkte = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(z[i * 3] * BREITE);
    const rr = (0.9 + z[i * 3 + 1] * 1.4).toFixed(1);
    const verzug = (z[i * 3 + 2] * dauer).toFixed(2);
    punkte.push(`<circle cx="${x}" cy="-3" r="${rr}" style="animation-delay:-${verzug}s"/>`);
  }
  return `<g class="inperson-sky-flocken" transform="rotate(${Math.round(-3 - 10 * wind)} ${RADIUS} ${RADIUS})"
    fill="${farbe ?? "#ffffff"}" fill-opacity="0.9" stroke="#20304a" stroke-opacity="0.3" stroke-width="0.4"
    style="--dauer:${dauer.toFixed(2)}s">${punkte.join("")}</g>`;
}

/** Harte Körner: Hagel, Graupel, Eis - kurz und schnell. */
function malKoerner({ menge, farbe, wind, dichte, tempo }) {
  const n = Math.round((8 + 16 * menge) * dichte);
  const z = reihe(29, n * 2);
  const dauer = Math.max(0.28, 0.6 / tempo);
  const korn = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(z[i * 2] * BREITE);
    const verzug = (z[i * 2 + 1] * dauer).toFixed(2);
    korn.push(`<ellipse cx="${x}" cy="-4" rx="1.4" ry="2.2" style="animation-delay:-${verzug}s"/>`);
  }
  return `<g class="inperson-sky-koerner" transform="rotate(${Math.round(-4 - 14 * wind)} ${RADIUS} ${RADIUS})"
    fill="${farbe ?? "#eaf6ff"}" fill-opacity="0.95" stroke="#20304a" stroke-opacity="0.35" stroke-width="0.4"
    style="--dauer:${dauer.toFixed(2)}s">${korn.join("")}</g>`;
}

/** Ziehende Wolkenbänke, die den Himmel dunkler machen. */
function malWolken({ deckung }) {
  const teile = [`<rect x="0" y="0" width="${BREITE}" height="${HOEHE}" fill="#000000" opacity="${(0.28 * deckung).toFixed(2)}"/>`];
  const bank = [[46, 28, 1], [118, 20, 0.85], [86, 42, 0.7], [26, 46, 0.6]];
  const wieviel = deckung >= 0.9 ? 4 : deckung >= 0.6 ? 3 : 2;
  const deck = (0.25 + 0.4 * deckung).toFixed(2);
  for (let i = 0; i < wieviel; i++) {
    const [cx, cy, sx] = bank[i];
    teile.push(`<g class="inperson-sky-wolke" style="animation-duration:${38 + i * 9}s;animation-delay:-${i * 11}s">
      <ellipse cx="${cx}" cy="${cy}" rx="${26 * sx}" ry="${9 * sx}" fill="#ffffff" opacity="${deck}"/>
      <ellipse cx="${cx - 12 * sx}" cy="${cy + 3}" rx="${16 * sx}" ry="${8 * sx}" fill="#ffffff" opacity="${deck}"/>
      <ellipse cx="${cx + 14 * sx}" cy="${cy + 4}" rx="${18 * sx}" ry="${7 * sx}" fill="#ffffff" opacity="${deck}"/>
    </g>`);
  }
  return teile.join("");
}

/** Nebel, Dunst, Miasma: ein Band über dem Horizont, das wabert. */
function malNebel({ dichte, farbe, hell }) {
  const ton = farbe ?? (hell > 0.5 ? "#e6ecf0" : "#8d95a6");
  return `<g class="inperson-sky-nebel" style="--dichte:${dichte.toFixed(2)}">
    <rect x="-40" y="${RADIUS * 0.45}" width="${BREITE + 80}" height="${RADIUS}" fill="${ton}"/>
    <rect class="inperson-sky-nebel-schwade" x="-40" y="${RADIUS * 0.3}" width="${BREITE + 80}" height="${RADIUS * 0.4}" fill="${ton}"/>
  </g>`;
}

/** Waagerechte Fahnen: Wind, Sand, arkane Böen. */
function malFahnen({ staerke, farbe, dichte, tempo }) {
  const n = Math.round((6 + 10 * staerke) * dichte);
  const z = reihe(41, n * 3);
  const dauer = Math.max(0.5, 1.6 / (tempo * (0.6 + staerke)));
  const striche = [];
  for (let i = 0; i < n; i++) {
    const y = Math.round(10 + z[i * 3] * (RADIUS - 12));
    const laenge = Math.round(14 + z[i * 3 + 1] * 30 * staerke);
    const verzug = (z[i * 3 + 2] * dauer).toFixed(2);
    striche.push(`<line x1="0" y1="${y}" x2="${laenge}" y2="${y}" style="animation-delay:-${verzug}s"/>`);
  }
  return `<g class="inperson-sky-fahnen" stroke="${farbe ?? "#dfeeff"}" stroke-opacity="${(0.3 + 0.4 * staerke).toFixed(2)}"
    stroke-width="1.4" stroke-linecap="round" style="--dauer:${dauer.toFixed(2)}s">${striche.join("")}</g>`;
}

/** Taumelnde Blätter und Blüten. */
function malBlaetter({ menge, farbe, dichte, tempo }) {
  // Viele kleine statt weniger großer: Nebeneinander mit Calendaria fielen
  // drei dicke Blätter auf, wo dort ein Dutzend kleiner trieb.
  const n = Math.round((14 + 20 * menge) * dichte);
  const z = reihe(53, n * 3);
  const dauer = Math.max(3, 7 / tempo);
  const stueck = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(z[i * 3] * BREITE);
    const gr = (1.9 + z[i * 3 + 1] * 1.6).toFixed(1);
    const verzug = (z[i * 3 + 2] * dauer).toFixed(2);
    stueck.push(`<ellipse cx="${x}" cy="-4" rx="${gr}" ry="${(gr / 2).toFixed(1)}" style="animation-delay:-${verzug}s"/>`);
  }
  return `<g class="inperson-sky-blaetter" fill="${farbe ?? "#e08a44"}" fill-opacity="0.95"
    stroke="#3a2a18" stroke-opacity="0.3" stroke-width="0.4"
    style="--dauer:${dauer.toFixed(2)}s">${stueck.join("")}</g>`;
}

/** Aufsteigende Funken: Ley-Linien, arkane Winde, Ätherdunst. */
function malFunken({ menge, farbe, dichte, tempo }) {
  const n = Math.round((6 + 12 * menge) * dichte);
  const z = reihe(67, n * 3);
  const dauer = Math.max(1.4, 3.2 / tempo);
  const funke = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(z[i * 3] * BREITE);
    const rr = (1.1 + z[i * 3 + 1] * 1.4).toFixed(1);
    const verzug = (z[i * 3 + 2] * dauer).toFixed(2);
    funke.push(`<circle cx="${x}" cy="${RADIUS - 2}" r="${rr}" style="animation-delay:-${verzug}s"/>`);
  }
  // Der weiche Rand ist der Schein: ein Funke ohne Hof ist ein Staubkorn.
  return `<g class="inperson-sky-funken" fill="${farbe ?? "#8fd0ff"}"
    stroke="${farbe ?? "#8fd0ff"}" stroke-opacity="0.35" stroke-width="2"
    style="--dauer:${dauer.toFixed(2)}s">${funke.join("")}</g>`;
}

/** Aufsteigender Rauch. */
function malRauch({ menge, farbe, tempo }) {
  const z = reihe(83, 12);
  const dauer = Math.max(4, 9 / tempo);
  const blasen = [];
  for (let i = 0; i < 6; i++) {
    const x = Math.round(16 + z[i * 2] * (BREITE - 32));
    const rr = Math.round(9 + z[i * 2 + 1] * 12 * menge);
    blasen.push(`<circle cx="${x}" cy="${RADIUS + 6}" r="${rr}" style="animation-delay:-${(i * dauer / 6).toFixed(2)}s"/>`);
  }
  return `<g class="inperson-sky-rauch" fill="${farbe ?? "#a97a52"}" style="--dauer:${dauer.toFixed(2)}s">${blasen.join("")}</g>`;
}

/** Der Trichter eines Wirbelsturms oder Staubteufels. */
function malWirbel({ staerke }) {
  const breite = 10 + 16 * staerke;
  return `<g class="inperson-sky-wirbel" opacity="${(0.35 + 0.35 * staerke).toFixed(2)}">
    <path d="M ${RADIUS - breite} 6 Q ${RADIUS} ${RADIUS * 0.6} ${RADIUS - breite / 4} ${RADIUS} L ${RADIUS + breite / 4} ${RADIUS} Q ${RADIUS} ${RADIUS * 0.6} ${RADIUS + breite} 6 Z" fill="#c9cdd6"/>
  </g>`;
}

/** Schemen: langsam vorbeiziehende Schwaden. */
function malSchemen({ menge, farbe, tempo }) {
  const z = reihe(97, 9);
  const dauer = Math.max(6, 14 / tempo);
  const wisch = [];
  for (let i = 0; i < 3; i++) {
    const y = Math.round(18 + z[i * 3] * (RADIUS - 30));
    const rx = Math.round(16 + z[i * 3 + 1] * 14);
    wisch.push(`<ellipse cx="-20" cy="${y}" rx="${rx}" ry="${Math.round(rx / 2.6)}" style="animation-delay:-${(i * dauer / 3).toFixed(2)}s"/>`);
  }
  return `<g class="inperson-sky-schemen" fill="${farbe ?? "#9fd8b8"}" fill-opacity="${(0.3 * menge + 0.16).toFixed(2)}"
    style="--dauer:${dauer.toFixed(2)}s">${wisch.join("")}</g>`;
}

/** Sternschnuppen, einzeln und selten. */
function malMeteore() {
  const z = reihe(101, 9);
  const bahnen = [];
  for (let i = 0; i < 4; i++) {
    const x = Math.round(16 + z[i * 2] * (BREITE - 64));
    const y = Math.round(6 + z[i * 2 + 1] * 30);
    const dauer = 3.5 + i * 1.1;
    bahnen.push(`<g style="animation-delay:-${(z[i * 2] * dauer).toFixed(2)}s;animation-duration:${dauer}s">
      <line x1="${x}" y1="${y}" x2="${x + 30}" y2="${y + 23}"/>
      <circle cx="${x + 30}" cy="${y + 23}" r="1.6" fill="#fff4d8" stroke="none"/>
    </g>`);
  }
  return `<g class="inperson-sky-meteore" stroke="#ffe0b0" stroke-width="1.6" stroke-linecap="round">${bahnen.join("")}</g>`;
}

/** Polarlicht: zwei weiche Bänder, die langsam atmen. */
function malAurora() {
  const id = kennung("aurora");
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#57e0a0" stop-opacity="0"/>
      <stop offset="0.45" stop-color="#57e0a0" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#4aa8e0" stop-opacity="0"/>
    </linearGradient></defs>
    <g class="inperson-sky-aurora">
      <path d="M -10 46 Q 40 12 80 34 T 170 22 L 170 62 Q 120 40 80 58 T -10 66 Z" fill="url(#${id})"/>
      <path class="inperson-sky-aurora-zwei" d="M -10 58 Q 50 26 96 44 T 170 36 L 170 70 Q 110 52 70 66 T -10 74 Z" fill="url(#${id})"/>
    </g>`;
}

/** Lichtstrahlen aus dem Scheitel. */
function malStrahlen() {
  const strahl = [];
  for (let i = 0; i < 5; i++) {
    const versatz = -44 + i * 22;
    strahl.push(`<path d="M ${RADIUS} 0 L ${RADIUS + versatz - 9} ${RADIUS} L ${RADIUS + versatz + 9} ${RADIUS} Z" style="animation-delay:-${(i * 0.7).toFixed(1)}s"/>`);
  }
  const id = kennung("divine");
  return `<defs><radialGradient id="${id}" cx="50%" cy="0%" r="70%">
      <stop offset="0" stop-color="#fff3c4" stop-opacity="0.75"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/>
    </radialGradient></defs>
    <g class="inperson-sky-strahlen" fill="#ffeaa0">${strahl.join("")}</g>
    <rect x="0" y="0" width="${BREITE}" height="${HOEHE}" fill="url(#${id})"/>`;
}

/** Hitzeflimmern: waagerechte Schlieren, die wandern. */
function malFlimmern({ menge }) {
  const linien = [];
  for (let i = 0; i < 6; i++) {
    const y = Math.round(RADIUS * 0.45 + i * 6);
    linien.push(`<rect x="-20" y="${y}" width="${BREITE + 40}" height="1.6" style="animation-delay:-${(i * 0.45).toFixed(2)}s"/>`);
  }
  return `<g class="inperson-sky-flimmern" fill="#ffd9a0" fill-opacity="${(0.18 * menge).toFixed(2)}">${linien.join("")}</g>`;
}

/** Rauschen: viele winzige Punkte, die flackern. */
function malRauschen({ menge }) {
  const n = Math.round(90 * menge);
  const z = reihe(113, n * 2);
  const punkte = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(z[i * 2] * BREITE);
    const y = Math.round(z[i * 2 + 1] * RADIUS);
    punkte.push(`<rect x="${x}" y="${y}" width="2" height="2" style="animation-delay:-${((i % 7) * 0.11).toFixed(2)}s"/>`);
  }
  // Der graue Schleier darunter: Auf einem hellen Mittagshimmel wären helle
  // Punkte unsichtbar, und eine Nullfront soll den Himmel gerade auslöschen.
  return `<rect x="0" y="0" width="${BREITE}" height="${HOEHE}" fill="#1b1b26" opacity="0.45"/>
    <g class="inperson-sky-rauschen" fill="#d4d4e0">${punkte.join("")}</g>`;
}

/** Finsternis: der Himmel wird geschluckt. */
function malDunkel({ staerke }) {
  const id = kennung("void");
  return `<defs><radialGradient id="${id}" cx="50%" cy="35%" r="65%">
      <stop offset="0" stop-color="#000000" stop-opacity="${(0.95 * staerke).toFixed(2)}"/>
      <stop offset="0.6" stop-color="#12081a" stop-opacity="${(0.8 * staerke).toFixed(2)}"/>
      <stop offset="1" stop-color="#12081a" stop-opacity="${(0.35 * staerke).toFixed(2)}"/>
    </radialGradient></defs>
    <rect x="0" y="0" width="${BREITE}" height="${HOEHE}" fill="url(#${id})"/>
    <circle class="inperson-sky-dunkel-ring" cx="${RADIUS}" cy="${RADIUS * 0.42}" r="15" fill="none" stroke="#6a3d8f" stroke-opacity="0.5" stroke-width="1.6"/>`;
}

/**
 * Das Wetter über den Himmel legen.
 *
 * Die Reihenfolge ist die Tiefe: Wolken hinten, Niederschlag davor, Nebel und
 * Blitz zuoberst - sonst regnete es hinter der Wolke.
 */
function wetterBild(art, helligkeit) {
  if (!art) return "";
  const { wind, dichte, tempo, farbe, langsam } = art;
  const teile = [];

  if (art.dunkel)   teile.push(malDunkel({ staerke: art.dunkel }));
  if (art.aurora)   teile.push(malAurora());
  if (art.wolken)   teile.push(malWolken({ deckung: art.wolken }));
  if (art.strahlen) teile.push(malStrahlen());
  if (art.meteore)  teile.push(malMeteore());
  if (art.wirbel)   teile.push(malWirbel({ staerke: art.wirbel }));
  if (art.rauch)    teile.push(malRauch({ menge: art.rauch, farbe, tempo }));
  if (art.schemen)  teile.push(malSchemen({ menge: art.schemen, farbe, tempo }));
  if (art.regen)    teile.push(malRegen({ menge: art.regen, farbe, wind, dichte, tempo }));
  if (art.flocken)  teile.push(malFlocken({ menge: art.flocken, farbe, wind, dichte, tempo, langsam }));
  if (art.koerner)  teile.push(malKoerner({ menge: art.koerner, farbe, wind, dichte, tempo }));
  if (art.blaetter) teile.push(malBlaetter({ menge: art.blaetter, farbe, dichte, tempo }));
  if (art.fahnen)   teile.push(malFahnen({ staerke: art.fahnen, farbe, dichte, tempo }));
  if (art.funken)   teile.push(malFunken({ menge: art.funken, farbe, dichte, tempo }));
  if (art.nebel)    teile.push(malNebel({ dichte: art.nebel, farbe, hell: helligkeit }));
  if (art.flimmern) teile.push(malFlimmern({ menge: art.flimmern }));
  if (art.rauschen) teile.push(malRauschen({ menge: art.rauschen }));
  if (art.blitz)    teile.push(`<rect class="inperson-sky-blitz" x="0" y="0" width="${BREITE}" height="${HOEHE}" fill="${farbeOk(art.blitz) ?? "#ffffff"}"/>`);

  return teile.join("");
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

function hinweisText(aufgang, untergang, monde, geschaetzt) {
  const zeilen = [];

  // Die Uhrzeiten sind abschaltbar: Nicht jeder Tisch möchte, dass am Blatt
  // abzulesen ist, wann es hell wird - manchmal ist "es dämmert bald" die
  // bessere Auskunft als "04:41". Der Mond bleibt; er steht am Himmel.
  let zeiten = true;
  try { zeiten = game.settings.get(MODULE_ID, "clockSkyTimes") !== false; } catch { /* vor der Registrierung */ }
  if (zeiten) {
    zeilen.push(game.i18n.format("INPERSON.Clock.SunTimes", { up: uhr(aufgang), down: uhr(untergang) }));
    if (geschaetzt) zeilen.push(game.i18n.localize("INPERSON.Clock.SunGuessed"));
  }

  // Jeder Mond mit Namen und Phase. Mehrere stehen untereinander, weil
  // "Selûne: Letztes Viertel · Tears: Neumond" in einer Zeile nicht mehr zu
  // lesen ist, sobald eine Welt drei Monde führt.
  // Bei einem Mond die feinere Unterphase, bei mehreren die kurze: Vier
  // Monde mal "Aufsteigend Abnehmender Mond" ergäben eine Zeile, die
  // niemand mehr liest.
  const liste = monde ?? [];
  for (const mond of liste) {
    const phase = (liste.length === 1 && mond?.unterphase) || mond?.name;
    if (!phase) continue;
    zeilen.push(mond.mondname ? `${mond.mondname}: ${phase}` : phase);
  }
  return zeilen.join(" · ");
}

const escape = s => foundry.utils.escapeHTML?.(String(s ?? "")) ?? String(s ?? "");
