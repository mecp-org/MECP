/**
 * Validate MECP_Comprehensive_Brief.md for basic protocol invariants.
 * Standalone — no dependency on @mecp/engine.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRIEF = join(ROOT, 'MECP_Comprehensive_Brief.md');
const LANGS_DIR = join(ROOT, 'languages');
const CODE_REGEX = /^[A-Z]\d{2}$/;
const ENVELOPE_RE = /^MECP\/[0-3]\/[A-Z]\d{2}( [A-Z]\d{2})*( [^\n]*)?$/;
const UNIT_TOKENS = new Set(['min', 'h', 'd', 's', 'm', 'km', 'g', 'kg', 'l', 'ml']);

function read(file) {
  return readFileSync(file, 'utf8');
}

function extractCodeSet(brief) {
  const codes = new Set();
  for (const m of brief.matchAll(/^\| ([A-Z]\d{2}) \|/gm)) {
    codes.add(m[1]);
  }
  return codes;
}

function extractFencedMecpBlocks(brief) {
  return [...brief.matchAll(/^```\s*\n(MECP\/[^\n]+)\n```/gm)].map((m, i) => ({ text: m[1], index: i }));
}

function main() {
  const brief = read(BRIEF);
  const codes = extractCodeSet(brief);
  const langFiles = readdirSync(LANGS_DIR).filter(f => f.endsWith('.json'));
  const knownLangs = new Set(langFiles.map(f => f.replace(/\.json$/, '').toLowerCase()));

  const errors = [];

  // 1. Envelope example check (skip format templates with <placeholders>)
  const examples = extractFencedMecpBlocks(brief).filter(({ text }) => !text.includes('<'));
  for (const { text } of examples) {
    const m = text.match(ENVELOPE_RE);
    if (!m) {
      errors.push(`Example does not match envelope regex: ${text}`);
      continue;
    }
    // Extract and check every code token
    const tokens = m[0].split(/\s+/).slice(2);
    for (const token of tokens) {
      if (CODE_REGEX.test(token)) {
        if (!codes.has(token)) {
          errors.push(`Example uses code ${token} which is not in the code table`);
        }
      }
    }
    // Byte length
    if (Buffer.byteLength(text, 'utf8') > 200) {
      errors.push(`Example exceeds 200 UTF-8 bytes`);
    }
    // @lang tags
    const langString = tokens.join(' ');
    for (const m of langString.matchAll(/@([A-Za-z][A-Za-z0-9-]{1,7})/g)) {
      const tag = m[1];
      const isLang = knownLangs.has(tag.toLowerCase());
      const isBcp = /^[a-z]{2,3}(-[A-Za-z][A-Za-z0-9]{1,7})*$/i.test(tag);
      if (!isLang && !isBcp) {
        errors.push(`@${tag} is neither a known language pack nor a BCP-47 tag`);
      }
    }
  }

  // 2. Closed vocabulary in Appendix A (exist after PR A)
  if (!brief.includes('## Appendix A. SI Units')) {
    errors.push('Brief must include "Appendix A. SI Units"');
  }
  if (!brief.includes('### 5.3 Lineage: GMDSS')) {
    errors.push('Brief must include "### 5.3 Lineage: GMDSS"');
  }
  if (!brief.includes('### 6.2 Protocol Vocabulary')) {
    errors.push('Brief must include "### 6.2 Protocol Vocabulary"');
  }

  // 3. Closed unit tokens on the wire (SI only: min h d s)
  // Flag English unit words only inside concrete fenced MECP examples
  for (const { text } of examples) {
    for (const m of text.matchAll(/\b(\d+)\s*(minute|minutes|hour|hours|day|days)\b/gi)) {
      errors.push(
        `Example uses English unit "${m[1]} ${m[2]}" — SI symbols only on the wire (min h d s): ${text}`,
      );
    }
  }

  if (errors.length > 0) {
    console.error(`Brief validation failed with ${errors.length} error(s):\n`);
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log('Brief validation passed.');
}

main();
