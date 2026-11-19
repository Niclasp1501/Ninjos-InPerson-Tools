/**
 * Ersatzknopf „Vorschaubild erzeugen“ im Szenenverzeichnis.
 *
 * Ninjo, 19.11.2026: „foundry bietet teilweise keinen Knopf mehr an, wenn ich
 * das Vorschaubild einer Szene aktualisieren will … wenn ich es per Skript
 * ausführe, klappt das.“ Die Begleitleiste zeigt genau diese Vorschaubilder,
 * deshalb sitzt der Ersatz hier.
 *
 * Foundry 14.370 (`scene-directory.mjs`, Eintrag „SCENE.GenerateThumb“) zeigt
 * seinen Eintrag nur, wenn die Startebene (bzw. die gerade angesehene Ebene)
 * ein Hintergrundbild hat. Liegt die Karte als Kachel oder auf einer anderen
 * Ebene, fehlt er, obwohl `Scene#createThumbnail` Kacheln und Ebenen
 * zeichnen kann. Dieser Eintrag erscheint genau dann, wenn Foundrys eigener
 * fehlt, und macht beim Klick dasselbe wie Foundry.
 *
 * Welche Ebene gezeichnet wird: zuerst die, die Foundry nähme (angesehene
 * Ebene, sonst Startebene). Ist dort nichts zu sehen, die erste Ebene von
 * unten, die einen Hintergrund oder eine sichtbare Kachel trägt.
 *
 * Videos (Nachtrag 19.11.2026): `createThumbnail` zeichnet das erste Bild
 * eines Videos, und die Intros wie „SC GdA Intro“ blenden aus Schwarz ein.
 * Vor dem Zeichnen wird deshalb jedes beteiligte Video auf seine Mitte
 * gespult. Weil Foundry seinen eigenen Knopf auch bei einem Video als
 * Hintergrund anbietet und der dann schwarz liefert, gibt es für diesen Fall
 * einen zweiten Eintrag mit eigenem Namen („aus der Videomitte“). Zwei gleich
 * benannte Einträge stehen so nie im Menü.
 */

import { MODULE_ID } from "./const.js";
import { still } from "./stille.js";

/**
 * Welche Ebene soll ins Vorschaubild? Ausgelagert für die Prüfung ohne Foundry.
 *
 * @param {{id: string, hatBild: boolean}[]} ebenen  von unten nach oben sortiert
 * @param {string|null} bevorzugt  die Ebene, die Foundry nähme
 * @returns {string|null}  Kennung der Ebene, oder null, wenn nirgends etwas ist
 */
export function ebeneWaehlen(ebenen, bevorzugt) {
  const liste = Array.isArray(ebenen) ? ebenen : [];
  const erste = liste.find(e => e.id === bevorzugt);
  if (erste?.hatBild) return erste.id;
  return liste.find(e => e.hatBild)?.id ?? null;
}

/** Ist diese Quelle ein Video? Ausgelagert für die Prüfung ohne Foundry. */
export function istVideo(src, endungen) {
  if (!src || !endungen?.length) return false;
  const pfad = String(src).split("?")[0].toLowerCase();
  return endungen.some(e => pfad.endsWith(`.${String(e).toLowerCase()}`));
}

const videoEndungen = () => Object.keys(CONST.VIDEO_FILE_EXTENSIONS ?? {});

/** Alle Bildquellen, die beim Zeichnen dieser Ebene beteiligt sein können. */
function quellen(scene, levelId) {
  const liste = [];
  for (const level of scene.levels ?? []) {
    if (level.background?.src) liste.push(level.background.src);
    if (level.foreground?.src) liste.push(level.foreground.src);
  }
  for (const t of scene.tiles) {
    if (!t.texture?.src || t.hidden) continue;
    if (levelId && t.includedInLevel && !t.includedInLevel(levelId)) continue;
    liste.push(t.texture.src);
  }
  return [...new Set(liste)];
}

function videoQuellen(scene, levelId) {
  const endungen = videoEndungen();
  return quellen(scene, levelId).filter(src => istVideo(src, endungen));
}

/** Auf `seeked` warten, höchstens `frist` Millisekunden. */
function gespult(video, frist = 3000) {
  return new Promise(fertig => {
    const zeit = setTimeout(fertig, frist);
    video.addEventListener("seeked", () => { clearTimeout(zeit); fertig(); }, { once: true });
  });
}

/**
 * Jedes Video auf seine Mitte spulen und angehalten lassen, bis gezeichnet
 * ist. Gibt eine Funktion zurück, die den alten Stand wiederherstellt: Zeit
 * zurück, und was vorher lief, läuft weiter. Läuft die Szene gerade auf dem
 * Bildschirm, springt das Video damit nur kurz.
 */
async function videosAufMitte(srcs) {
  const zurueck = [];
  if (!srcs.length) return () => {};
  await foundry.canvas.TextureLoader.loader.load(srcs);
  for (const src of srcs) {
    try {
      const tex = foundry.canvas.getTexture(src);
      const video = tex ? game.video.getVideoSource(tex) : null;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) continue;
      const lief = !video.paused;
      const vorher = video.currentTime;
      video.pause();
      const warten = gespult(video);
      video.currentTime = video.duration * 0.5;
      await warten;
      tex.baseTexture.update();
      zurueck.push(() => {
        video.currentTime = vorher;
        if (lief) video.play().catch(() => {});
      });
    } catch (fehler) {
      console.warn(`${MODULE_ID} | Video ${src} ließ sich nicht spulen.`, fehler);
    }
  }
  return () => zurueck.forEach(f => { try { f(); } catch { /* egal */ } });
}

/** Foundrys eigene Bedingung aus `scene-directory.mjs`, Zeile 79 bis 97. */
function foundryZeigtEigenen(scene) {
  if (game.settings.get("core", "noCanvas")) return false;
  if (scene.isView) return !!canvas.level?.background?.src;
  return !!scene.initialLevel?.background?.src;
}

/** Ebenen der Szene von unten nach oben, je mit „gibt es hier etwas zu zeichnen“. */
function ebenenMitBild(scene) {
  const sortiert = scene.levels?.sorted ?? scene.levels?.contents ?? [];
  // Dieselbe Auswahl wie in `Scene#createThumbnail`: Bild gesetzt, nicht verborgen.
  const kacheln = scene.tiles.filter(t => t.texture?.src && !t.hidden);
  return sortiert.map(level => ({
    id: level.id,
    hatBild: !!level.background?.src || !!level.foreground?.src
      || kacheln.some(t => t.includedInLevel?.(level.id) ?? true)
  }));
}

function szeneAusZeile(li) {
  // Nur Zeilen des Szenenverzeichnisses: Die Navigationsleiste ruft denselben
  // Hook, trägt aber `data-scene-id`, und dort bietet Foundry den Knopf nie an.
  const id = li?.dataset?.entryId;
  return id ? game.scenes.get(id) : null;
}

async function erzeugen(scene) {
  const ebenen = ebenenMitBild(scene);
  const level = ebeneWaehlen(ebenen, scene._view ?? scene.initialLevel?.id ?? null);
  if (!level) {
    ui.notifications.warn(game.i18n.format("INPERSON.Thumb.NothingToDraw", { scene: scene.name }));
    return;
  }
  let wiederherstellen = () => {};
  try {
    wiederherstellen = await videosAufMitte(videoQuellen(scene, level));
    const { thumb } = await scene.createThumbnail({ level }) ?? {};
    wiederherstellen();
    wiederherstellen = () => {};
    if (!thumb) throw new Error(game.i18n.localize("INPERSON.Thumb.NoResult"));
    await scene.update({ thumb }, { diff: false });
    still(game.i18n.format("INPERSON.Thumb.Done", { scene: scene.name }));
  } catch (fehler) {
    wiederherstellen();
    console.error(`${MODULE_ID} | Vorschaubild für ${scene.name} fehlgeschlagen.`, fehler);
    ui.notifications.error(game.i18n.format("INPERSON.Thumb.Failed", {
      scene: scene.name, error: fehler?.message ?? String(fehler)
    }));
  }
}

/**
 * Darf der Eintrag überhaupt erscheinen, und bietet Foundry seinen eigenen an?
 * null heißt: gar nicht anbieten.
 */
function lage(li) {
  if (!game.user.isGM || !game.user.can("FILES_UPLOAD")) return null;
  if (game.settings.get("core", "noCanvas")) return null;
  const scene = szeneAusZeile(li);
  if (!scene) return null;
  return { scene, foundry: foundryZeigtEigenen(scene) };
}

function pruefen(li, test) {
  try {
    const l = lage(li);
    return !!l && test(l);
  } catch (fehler) {
    console.warn(`${MODULE_ID} | Vorschaubild-Eintrag ließ sich nicht prüfen.`, fehler);
    return false;
  }
}

/** Hat die Ebene, die Foundry zeichnen würde, ein Video? */
function foundryZeichnetVideo(scene) {
  const level = scene._view ?? scene.initialLevel?.id ?? null;
  return videoQuellen(scene, level).length > 0;
}

/** Bei `init`, auf jedem Rechner; sichtbar werden die Einträge nur der Spielleitung. */
export function vorschaubildEinrichten() {
  Hooks.on("getSceneContextOptions", (_app, eintraege) => {
    if (!Array.isArray(eintraege)) return;
    const klick = (_event, li) => {
      const scene = szeneAusZeile(li);
      if (scene) return erzeugen(scene);
    };
    // Foundry bietet nichts an: unser Eintrag unter Foundrys Namen.
    eintraege.push({
      label: "INPERSON.Thumb.Generate",
      icon: "fa-solid fa-image",   // dasselbe Symbol wie Foundrys eigener Eintrag
      visible: li => pruefen(li, l => !l.foundry),
      onClick: klick
    });
    // Foundry bietet seinen an, zeichnet aber ein Video und damit Schwarz.
    eintraege.push({
      label: "INPERSON.Thumb.GenerateVideo",
      icon: "fa-solid fa-film",
      visible: li => pruefen(li, l => l.foundry && foundryZeichnetVideo(l.scene)),
      onClick: klick
    });
  });
}

/** Für Makros und Prüfungen: dasselbe wie der Klick im Menü. */
export const vorschaubildErzeugen = erzeugen;
