/**
 * Validate MECP_Comprehensive_Brief.md for basic protocol invariants.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
const MESSAGE_RE = new RegExp(readJson('freetext/patterns.json').message.decode);
const EN_CODES = Object.keys(readJson('languages/en.json').codes);

function extractFencedMecpBlocks(brief) {
  return [...brief.matchAll(/^```\s*\n(MECP\/[^\n]+)\n```/gm)].map((m) => m[1]);
}

/** Codes listed in §7, one backticked line per category. */
function extractSection7Codes(brief) {
  const section = brief.slice(brief.indexOf('## 7. '), brief.indexOf('## 8. '));
  return [...section.matchAll(/^`[A-Z]\d{2}`(?: `[A-Z]\d{2}`)*$/gm)].flatMap((m) =>
    m[0].replaceAll('`', '').split(' '),
  );
}

function main() {
  const brief = readFileSync(join(ROOT, 'MECP_Comprehensive_Brief.md'), 'utf8');
  const errors = [];

  const listed = extractSection7Codes(brief);
  const listedSet = new Set(listed);
  const missing = EN_CODES.filter((c) => !listedSet.has(c));
  const extra = listed.filter((c) => !EN_CODES.includes(c));
  if (missing.length) errors.push(`§7 is missing codes from en.json: ${missing.join(', ')}`);
  if (extra.length) errors.push(`§7 lists codes not in en.json: ${extra.join(', ')}`);
  if (listedSet.size !== listed.length) errors.push('§7 lists a code more than once');

  // Skip format templates with <placeholders>
  const examples = extractFencedMecpBlocks(brief).filter((text) => !text.includes('<'));
  for (const text of examples) {
    const m = text.match(MESSAGE_RE);
    if (!m) {
      errors.push(`Example does not match the §6.1 message pattern: ${text}`);
      continue;
    }
    for (const code of m[2].split(' ')) {
      if (!EN_CODES.includes(code)) errors.push(`Example uses code ${code} which is not in en.json: ${text}`);
    }
    if (Buffer.byteLength(text, 'utf8') > 200) {
      errors.push(`Example exceeds 200 UTF-8 bytes: ${text}`);
    }
    for (const u of text.matchAll(/\b(\d+)\s*(minute|minutes|hour|hours|day|days)\b/gi)) {
      errors.push(`Example uses English unit "${u[1]} ${u[2]}" — SI symbols only on the wire (min h d s): ${text}`);
    }
  }

  for (const heading of ['## Appendix A. SI Units', '### 5.3 Lineage: GMDSS', '### 6.2 Protocol Vocabulary']) {
    if (!brief.includes(heading)) errors.push(`Brief must include "${heading}"`);
  }

  if (errors.length > 0) {
    console.error(`Brief validation failed with ${errors.length} error(s):\n`);
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log(`Brief validation passed (${listed.length} codes in §7, ${examples.length} examples).`);
}

main();
