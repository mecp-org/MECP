/**
 * Validate MECP_Comprehensive_Brief.md (and the README's examples) for basic protocol invariants.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
const MESSAGE_RE = new RegExp(readJson('freetext/patterns.json').message.decode);
const EN_CODES = Object.keys(readJson('languages/en.json').codes);
const VERSION = readJson('package.json').version;

/** Inline `MECP/...` spans and fenced lines; README fenced lines carry a gloss after 2+ spaces. */
function extractMecpExamples(md) {
  const inline = [...md.matchAll(/`(MECP\/[^`\n]+)`/g)].map((m) => m[1]);
  const fenced = [...md.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)]
    .flatMap((m) => m[1].split('\n'))
    .filter((line) => line.startsWith('MECP/'))
    .map((line) => line.split(/ {2,}/)[0]);
  return [...inline, ...fenced];
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

  const categories = new Set(EN_CODES.map((c) => c[0]));
  if (!brief.includes(`**${EN_CODES.length} codes** across **${categories.size} categories**`)) {
    errors.push(`§7 must say "**${EN_CODES.length} codes** across **${categories.size} categories**"`);
  }
  if (!brief.includes(`**Version:** ${VERSION}\n`)) errors.push(`Brief version must match package.json (${VERSION})`);

  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  // Skip format templates with <placeholders>
  const examples = [...extractMecpExamples(brief), ...extractMecpExamples(readme)].filter((t) => !t.includes('<'));
  for (const text of examples) {
    const m = text.match(MESSAGE_RE);
    if (!m) {
      errors.push(`Example does not match the §6.1 message pattern: ${text}`);
      continue;
    }
    for (const code of m[2].split(' ')) {
      if (!EN_CODES.includes(code)) errors.push(`Example uses code ${code} which is not in en.json: ${text}`);
    }
    if (/(?:^| )[A-Z][0-9]{2}(?: |$)/.test(m[3] ?? '')) {
      errors.push(`Example has a code after the freetext starts, so it is not decoded as a code (rule 3): ${text}`);
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
