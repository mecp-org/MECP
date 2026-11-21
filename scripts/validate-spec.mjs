/**
 * Validate SPEC.md, MECP_Comprehensive_Brief.md, and README examples for protocol invariants.
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

function main() {
  const brief = readFileSync(join(ROOT, 'MECP_Comprehensive_Brief.md'), 'utf8');
  const spec = readFileSync(join(ROOT, 'SPEC.md'), 'utf8');
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const errors = [];

  const categories = new Set(EN_CODES.map((c) => c[0]));
  if (!brief.includes(`**${EN_CODES.length} codes** across **${categories.size} categories**`)) {
    errors.push(`Brief §7 must say "**${EN_CODES.length} codes** across **${categories.size} categories**"`);
  }
  if (!spec.includes(`**Version:** ${VERSION}\n`)) {
    errors.push(`SPEC version must match package.json (${VERSION})`);
  }
  if (!brief.includes(`**Version:** ${VERSION}\n`)) {
    errors.push(`Brief version must match package.json (${VERSION})`);
  }

  for (const heading of [
    '### 6.1 Message Format',
    '### 6.2 Protocol Vocabulary',
    '### 6.3 Example Messages',
    '### 6.4 The Encoder and Decoder',
    '### 6.5 Codes, Beacon, and Private Use',
  ]) {
    if (!spec.includes(heading)) errors.push(`SPEC must include "${heading}"`);
  }

  for (const heading of ['## Appendix A. SI Units', '### 5.3 Lineage: GMDSS']) {
    if (!brief.includes(heading)) errors.push(`Brief must include "${heading}"`);
  }

  // Brief §6 must point at SPEC and must not still hold the full normative dump.
  if (!brief.includes('[`SPEC.md`](SPEC.md)') && !brief.includes('[SPEC.md](SPEC.md)')) {
    errors.push('Brief §6 must link to SPEC.md');
  }
  if (brief.includes('### 6.1 Message Format')) {
    errors.push('Brief must not duplicate ### 6.1 Message Format (lives in SPEC.md)');
  }

  const examples = [
    ...extractMecpExamples(spec),
    ...extractMecpExamples(brief),
    ...extractMecpExamples(readme),
  ].filter((t) => !t.includes('<'));
  for (const text of examples) {
    const m = text.match(MESSAGE_RE);
    if (!m) {
      errors.push(`Example does not match the §6.1 message pattern: ${text}`);
      continue;
    }
    for (const code of m[2].split(' ')) {
      // U01–U99 are Private Use (ADR 0006): well-formed, not in the shared codebook.
      if (/^U[0-9]{2}$/.test(code)) continue;
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

  if (errors.length > 0) {
    console.error(`Spec validation failed with ${errors.length} error(s):\n`);
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log(
    `Spec validation passed (${EN_CODES.length} codes in en.json, ${examples.length} examples).`,
  );
}

main();
