#!/usr/bin/env node
/**
 * check-tokens.mjs
 * Scans src/ for CSS custom property references (var(--...)) and verifies
 * each token is defined in the tokens.css file for that app.
 *
 * Usage:
 *   node scripts/check-tokens.mjs [--app admin|customer|rider]
 *   Default: checks all apps.
 *
 * Exit code 0 = all tokens defined. Exit code 1 = missing tokens found.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');

const APPS = ['admin', 'customer', 'rider'];
const args = process.argv.slice(2);
const appArg = args.find((a, i) => args[i - 1] === '--app');
const appsToCheck = appArg ? [appArg] : APPS;

// Regex: matches var(--token-name) capturing the name
const TOKEN_REF_RE = /var\(\s*(--[\w-]+)/g;

/** Recursively collect all .ts/.tsx/.css files under a dir */
function collectFiles(dir, results = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const e of entries) {
    const full = join(dir, e);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      if (e === 'node_modules' || e === 'dist' || e === '.turbo') continue;
      collectFiles(full, results);
    } else if (/\.(ts|tsx|css)$/.test(e)) {
      results.push(full);
    }
  }
  return results;
}

/** Parse all --name: definitions from a CSS file */
function parseDefinedTokens(cssPath) {
  let src;
  try { src = readFileSync(cssPath, 'utf8'); } catch { return new Set(); }
  const defined = new Set();
  // Match property declarations: --foo-bar: ...
  const defRe = /(--[\w-]+)\s*:/g;
  let m;
  while ((m = defRe.exec(src)) !== null) {
    defined.add(m[1]);
  }
  return defined;
}

let totalMissing = 0;

for (const app of appsToCheck) {
  const appDir = join(ROOT, 'apps', app, 'src');
  const tokensPath = join(appDir, 'styles', 'tokens.css');

  const defined = parseDefinedTokens(tokensPath);
  if (defined.size === 0) {
    console.warn(`[${app}] WARNING: tokens.css not found or empty at ${tokensPath}`);
    continue;
  }

  const files = collectFiles(appDir);
  const missing = []; // { file, line, token }

  for (const file of files) {
    // Skip tokens.css itself (it defines, not references)
    if (file === tokensPath) continue;

    let src;
    try { src = readFileSync(file, 'utf8'); } catch { continue; }

    const lines = src.split('\n');
    lines.forEach((line, idx) => {
      let m;
      TOKEN_REF_RE.lastIndex = 0;
      while ((m = TOKEN_REF_RE.exec(line)) !== null) {
        const token = m[1];
        if (!defined.has(token)) {
          missing.push({
            file: file.replace(ROOT + '\\', '').replace(ROOT + '/', ''),
            line: idx + 1,
            token,
          });
        }
      }
    });
  }

  if (missing.length === 0) {
    console.log(`[${app}] ✅  All tokens defined (${defined.size} tokens, ${files.length} files scanned)`);
  } else {
    console.error(`\n[${app}] ❌  ${missing.length} undefined token reference(s):\n`);
    // Group by token name for readability
    const byToken = {};
    for (const { file, line, token } of missing) {
      if (!byToken[token]) byToken[token] = [];
      byToken[token].push(`  ${file}:${line}`);
    }
    for (const [token, locs] of Object.entries(byToken)) {
      console.error(`  ${token}`);
      locs.slice(0, 5).forEach((l) => console.error(l));
      if (locs.length > 5) console.error(`  ... and ${locs.length - 5} more`);
    }
    totalMissing += missing.length;
  }
}

if (totalMissing > 0) {
  console.error(`\n${totalMissing} total undefined token reference(s). Fix before merging.\n`);
  process.exit(1);
}
