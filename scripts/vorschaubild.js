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
  try {
    const { thumb } = await scene.createThumbnail({ level }) ?? {};
    if (!thumb) throw new Error(game.i18n.localize("INPERSON.Thumb.NoResult"));
    await scene.update({ thumb }, { diff: false });
    still(game.i18n.format("INPERSON.Thumb.Done", { scene: scene.name }));
  } catch (fehler) {
    console.error(`${MODULE_ID} | Vorschaubild für ${scene.name} fehlgeschlagen.`, fehler);
    ui.notifications.error(game.i18n.format("INPERSON.Thumb.Failed", {
      scene: scene.name, error: fehler?.message ?? String(fehler)
    }));
  }
}

/** Bei `init`, auf jedem Rechner; sichtbar wird der Eintrag nur der Spielleitung. */
export function vorschaubildEinrichten() {
  Hooks.on("getSceneContextOptions", (_app, eintraege) => {
    if (!Array.isArray(eintraege)) return;
    eintraege.push({
      label: "INPERSON.Thumb.Generate",
      icon: "fa-solid fa-image",   // dasselbe Symbol wie Foundrys eigener Eintrag
      visible: li => {
        try {
          if (!game.user.isGM || !game.user.can("FILES_UPLOAD")) return false;
          if (game.settings.get("core", "noCanvas")) return false;
          const scene = szeneAusZeile(li);
          return !!scene && !foundryZeigtEigenen(scene);
        } catch (fehler) {
          console.warn(`${MODULE_ID} | Vorschaubild-Eintrag ließ sich nicht prüfen.`, fehler);
          return false;
        }
      },
      onClick: (_event, li) => {
        const scene = szeneAusZeile(li);
        if (scene) return erzeugen(scene);
      }
    });
  });
}

/** Für Makros und Prüfungen: dasselbe wie der Klick im Menü. */
export const vorschaubildErzeugen = erzeugen;
