/**
 * Vor dem Tag prüfen — und zwar den Commit, nicht den Schreibtisch.
 *
 * Am 05.09.2026 schlug der Release-Workflow für v14.2611.56 fehl, obwohl
 * `node tools/validate.mjs` unmittelbar davor sauber durchlief. Der Grund war
 * nicht die Prüfung, sondern *was* sie ansah: das Arbeitsverzeichnis. Dort
 * lag eine Änderung an `scripts/willkommen.js`, die zu den bereits
 * committeten Sprachdateien passte — nur war sie selbst nicht committet. Der
 * Arbeitsstand war stimmig, der Commit nicht, und den bekommt GitHub.
 *
 * Also: einen wegwerfbaren Arbeitsbaum auf HEAD auschecken und dort prüfen.
 * Was hier durchkommt, kommt auch im Workflow durch — es ist derselbe Stand
 * und dieselbe Prüfung.
 *
 *   node tools/release.mjs           nur prüfen
 *   node tools/release.mjs --push    prüfen, Tag setzen, schieben
 *
 * Ohne `--push` wird nichts verändert.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));
const schieben = process.argv.includes("--push");

const git = (...args) => execFileSync("git", args, { cwd: WURZEL, encoding: "utf8" }).trim();
const sage = (zeichen, text) => console.log(`${zeichen} ${text}`);

let fehler = 0;
const scheitern = text => { fehler++; sage("✗", text); };

/* ── 1. Was soll ausgeliefert werden ─────────────────────────────── */

const version = JSON.parse(readFileSync(join(WURZEL, "module.json"), "utf8")).version;
const tag = `v${version}`;
sage("→", `Version ${version}`);

// Das Schema aus der Anleitung: <Foundry-Generation>.<JJMM>.<laufend>.
if (!/^\d+\.\d{4}\.\d+$/.test(version)) scheitern(`Version ${version} passt nicht zum Schema <gen>.<JJMM>.<lauf>`);

/* ── 2. Gibt es den Tag schon? ───────────────────────────────────── */

if (git("tag", "-l", tag)) {
  scheitern(`Tag ${tag} gibt es lokal bereits — Version erhöhen oder den Tag löschen`);
} else {
  try {
    if (git("ls-remote", "--tags", "origin", tag)) scheitern(`Tag ${tag} liegt schon auf origin`);
  } catch {
    sage("⚠", "origin nicht erreichbar — der Fernstand wurde nicht geprüft");
  }
}

/* ── 3. Weicht der Schreibtisch vom Commit ab? ───────────────────── */

// Nur Dateien, die tatsächlich ausgeliefert werden. Notizen und Werkzeuge
// dürfen abweichen; sie landen weder im Zip noch auf dem Server.
const AUSGELIEFERT = /^(module\.json|README\.md|CHANGELOG\.md|LICENSE|scripts\/|styles\/|templates\/|lang\/|assets\/)/;
const offen = git("status", "--porcelain")
  .split("\n")
  .filter(Boolean)
  .map(z => z.slice(3).trim())
  .filter(p => AUSGELIEFERT.test(p));

if (offen.length) {
  scheitern(`nicht committet, wird aber ausgeliefert: ${offen.join(", ")}`);
  sage(" ", "Genau diese Lücke hat v14.2611.56 zerlegt: lokal stimmig, im Commit nicht.");
}

/* ── 4. Den Commit prüfen, nicht den Schreibtisch ────────────────── */

const baum = join(tmpdir(), `ipt-release-${process.pid}`);
rmSync(baum, { recursive: true, force: true });
try {
  git("worktree", "add", "-q", "--detach", baum, "HEAD");

  const laufen = (was, datei) => {
    try {
      execFileSync(process.execPath, [datei], { cwd: baum, encoding: "utf8", stdio: "pipe" });
      sage("✓", `${was} auf HEAD`);
    } catch (err) {
      scheitern(`${was} auf HEAD`);
      console.log((err.stdout ?? "").trim());
      console.log((err.stderr ?? "").trim());
    }
  };

  laufen("validate.mjs", join(baum, "tools", "validate.mjs"));
  for (const datei of readdirSync(join(baum, "tools")).filter(d => /^test-.*\.mjs$/.test(d)).sort()) {
    laufen(datei, join(baum, "tools", datei));
  }

  // Trägt der Commit dieselbe Version wie der Schreibtisch?
  const versionImCommit = JSON.parse(readFileSync(join(baum, "module.json"), "utf8")).version;
  if (versionImCommit !== version) {
    scheitern(`HEAD trägt ${versionImCommit}, das Arbeitsverzeichnis ${version}`);
  }
} finally {
  try { git("worktree", "remove", "--force", baum); } catch { /* dann eben von Hand */ }
  if (existsSync(baum)) rmSync(baum, { recursive: true, force: true });
}

/* ── 5. Ergebnis ─────────────────────────────────────────────────── */

if (fehler) {
  console.log(`\n${fehler} Grund${fehler === 1 ? "" : "e"}, ${tag} noch nicht zu setzen.`);
  process.exit(1);
}

if (!schieben) {
  console.log(`\nAlles bereit für ${tag}. Setzen mit:  node tools/release.mjs --push`);
  process.exit(0);
}

/* ── 6. Tag setzen und schieben ──────────────────────────────────── */

const zweig = git("rev-parse", "--abbrev-ref", "HEAD");
git("push", "origin", zweig);
sage("✓", `${zweig} geschoben`);
git("tag", "-a", tag, "-m", `Release ${version}`);
git("push", "origin", tag);
sage("✓", `${tag} geschoben — der Workflow baut jetzt das Release`);
