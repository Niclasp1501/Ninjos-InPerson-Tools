#!/usr/bin/env node
/**
 * Validator for Ninjo's In-Person Tools.
 *
 * Runs in CI before a release is cut, and automates the checks that were done
 * by hand while the module was built - each one because something actually
 * slipped through at some point:
 *
 *   - JS syntax             a broken file only shows as a white screen at runtime
 *   - JSON validity         a stray comma kills the whole module
 *   - i18n keys             a missing key renders as "INPERSON.Panel.Foo"
 *   - locale parity         German and English must carry the same keys
 *   - CSS classes           a renamed class silently loses its styling
 *   - manifest paths        every referenced file has to exist
 *
 * Usage: node tools/validate.mjs
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const PREFIX = "INPERSON.";

let errors = 0;
let warnings = 0;
const fail = m => { console.error(`✗ ${m}`); errors++; };
const warn = m => { console.warn(`⚠ ${m}`); warnings++; };
const ok = m => console.log(`✓ ${m}`);

const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const listDir = d => {
  const full = path.join(ROOT, d);
  return fs.existsSync(full) ? fs.readdirSync(full).map(f => `${d}/${f}`) : [];
};

/* ── 1. Manifest ─────────────────────────────────────────────────── */

let manifest;
try {
  manifest = JSON.parse(read("module.json"));
  ok("module.json is valid JSON");
} catch (err) {
  fail(`module.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

for (const [field, files] of [["esmodules", manifest.esmodules], ["styles", manifest.styles]]) {
  for (const f of files ?? []) {
    if (fs.existsSync(path.join(ROOT, f))) ok(`${field}: ${f}`);
    else fail(`${field} references a missing file: ${f}`);
  }
}
for (const lang of manifest.languages ?? []) {
  if (fs.existsSync(path.join(ROOT, lang.path))) ok(`lang: ${lang.path}`);
  else fail(`languages references a missing file: ${lang.path}`);
}

if (!/^\d+\.\d{4}\.\d+(-beta\.\d+)?$/.test(manifest.version ?? "")) {
  fail(`version "${manifest.version}" does not match <foundry-major>.<YYMM>.<patch>`);
} else if (!manifest.version.startsWith(`${manifest.compatibility?.verified ?? ""}.`)) {
  warn(`version starts with ${manifest.version.split(".")[0]} but verified is ${manifest.compatibility?.verified}`);
} else {
  ok(`version ${manifest.version} matches the scheme`);
}

/* ── 2. JavaScript syntax ────────────────────────────────────────── */

const scripts = listDir("scripts").filter(f => f.endsWith(".js"));
for (const f of scripts) {
  try {
    // --check parses without executing. Modules need the .mjs hint, so the
    // file is handed over on stdin with an explicit module type.
    execFileSync(process.execPath, ["--input-type=module", "--check"], {
      input: read(f),
      stdio: ["pipe", "pipe", "pipe"]
    });
  } catch (err) {
    fail(`${f}: ${String(err.stderr || err.message).split("\n")[0]}`);
  }
}
if (scripts.length) ok(`${scripts.length} script files parse`);

/* ── 3. Translations ─────────────────────────────────────────────── */

const locales = {};
for (const lang of manifest.languages ?? []) {
  try {
    locales[lang.lang] = JSON.parse(read(lang.path));
  } catch (err) {
    fail(`${lang.path} is not valid JSON: ${err.message}`);
  }
}

const used = new Set();
const sources = [...scripts, ...listDir("templates").filter(f => f.endsWith(".hbs"))];
for (const f of sources) {
  for (const m of read(f).matchAll(new RegExp(`["'](${PREFIX.replace(".", "\\.")}[A-Za-z0-9_.]+)["']`, "g"))) {
    used.add(m[1]);
  }
}
// Reason keys are assembled at runtime from a state name.
for (const r of ["disabled", "forcedOn", "forcedOff", "selfOn", "selfOff",
                 "monitor", "isGM", "default", "defaultOff"]) {
  used.add(`${PREFIX}Reason.${r}`);
}

for (const [code, table] of Object.entries(locales)) {
  const keys = new Set(Object.keys(table));
  const missing = [...used].filter(k => !keys.has(k));
  if (missing.length) fail(`${code}: ${missing.length} keys used but not translated: ${missing.slice(0, 5).join(", ")}`);
  else ok(`${code}: all ${used.size} used keys are present`);

  const unused = [...keys].filter(k => !used.has(k));
  if (unused.length) warn(`${code}: ${unused.length} keys are never used: ${unused.slice(0, 5).join(", ")}`);
}

const codes = Object.keys(locales);
if (codes.length === 2) {
  const [a, b] = codes;
  const onlyA = Object.keys(locales[a]).filter(k => !(k in locales[b]));
  const onlyB = Object.keys(locales[b]).filter(k => !(k in locales[a]));
  if (onlyA.length || onlyB.length) {
    fail(`locale mismatch: ${onlyA.length} only in ${a}, ${onlyB.length} only in ${b}`);
  } else ok(`${a} and ${b} carry the same keys`);
}

/* ── 4. CSS classes ──────────────────────────────────────────────── */

const css = (manifest.styles ?? []).map(read).join("\n");
const markup = [...listDir("templates").filter(f => f.endsWith(".hbs")), ...scripts].map(read).join("\n");
// Negative lookbehind: the module id "ninjos-inperson-tools" contains
// "inperson-tools" as a substring and would otherwise be reported as an
// unstyled class.
const inMarkup = new Set([...markup.matchAll(/(?<![a-z-])inperson-[a-z-]+/g)].map(m => m[0]));
const inCss = new Set([...css.matchAll(/[.#][a-z-]*?(inperson-[a-z-]+)/g)].map(m => m[1]));
const unstyled = [...inMarkup].filter(c => !inCss.has(c));
if (unstyled.length) warn(`classes used without a CSS rule: ${unstyled.join(", ")}`);
else ok(`all ${inMarkup.size} module classes have a rule`);

/* ── Summary ─────────────────────────────────────────────────────── */

console.log(`\n${errors} errors, ${warnings} warnings`);
process.exit(errors ? 1 : 0);
