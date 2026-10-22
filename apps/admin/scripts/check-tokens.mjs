// scripts/check-tokens.mjs (run from apps/admin)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk('src').filter((f) => ['.ts', '.tsx', '.css'].includes(extname(f)));
const names = (src) => [...src.matchAll(/(--[a-z0-9-]+)[ ]*:/gi)].map((m) => m[1]);

const tokenFile = files.find((f) => f.endsWith('tokens.css'));
if (!tokenFile) {
  console.error('Could not find tokens.css');
  process.exit(1);
}
const owned = new Set(names(readFileSync(tokenFile, 'utf8')));
const defined = new Set(owned);
let failures = 0;

for (const f of files.filter((f) => f.endsWith('.css') && f !== tokenFile)) {
  for (const n of names(readFileSync(f, 'utf8'))) {
    defined.add(n);
    if (owned.has(n)) {
      console.error(`${f}: redefines ${n} (owned by tokens.css)`);
      failures++;
    }
  }
}
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/var[(](--[a-z0-9-]+)/gi)) {
    if (!defined.has(m[1])) {
      console.error(`${f}: undefined token ${m[1]}`);
      failures++;
    }
  }
  if (f !== tokenFile && /#[0-9a-fA-F]{6}/.test(src)) {
    console.error(`${f}: raw hex colour, use a token`);
    failures++;
  }
}
if (failures > 0) {
  console.error(`Total token violations: ${failures}`);
  process.exit(1);
} else {
  console.log('✓ Token check passed: 0 violations');
}
