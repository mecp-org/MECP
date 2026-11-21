/**
 * Conformance harness for §6.1 freetext patterns.
 * - Asserts every pattern string in freetext/patterns.json appears verbatim in the brief
 * - Decodes every convention in each freetext/tests.json input
 *   with RE2-compatible JS RegExp (no lookaround) and compares the result with expect;
 *   an absent key or a null value means the value is not decoded, and expect: null means
 *   not an MECP message
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRIEF = readFileSync(join(ROOT, 'MECP_Comprehensive_Brief.md'), 'utf8');
const patterns = JSON.parse(readFileSync(join(ROOT, 'freetext/patterns.json'), 'utf8'));
const tests = JSON.parse(readFileSync(join(ROOT, 'freetext/tests.json'), 'utf8'));

/** §6.1 rule 5 decode order (claimed tokens; later overlaps fail). */
const DECODE_ORDER = [
  'appDesignator',
  'gps',
  'timestamp',
  'language',
  'callsign',
  'reference',
  'pax',
  'duration',
];

/** Boundary class B, read from §6.1 rule 4 so the harness cannot drift from the brief. */
function boundaryClass() {
  const rule = BRIEF.split('\n').find((line) => line.startsWith('4. Decoding patterns'));
  if (!rule?.includes(', a space') || !/one of `[^`]+`/.test(rule)) {
    throw new Error('Cannot read the boundary list B from §6.1 rule 4 in the brief; update boundaryClass() to match its wording.');
  }
  const controls = [...rule.slice(0, rule.indexOf(', a space')).matchAll(/`(\\[tnfr])`/g)].map((m) => m[1]);
  const ascii = rule.match(/one of `([^`]+)`/)[1].split(' ').map((c) => c.replace(/[\\[\]^-]/g, '\\$&'));
  const codePoints = [...rule.matchAll(/U\+([0-9A-F]{4})(?:–U\+([0-9A-F]{4}))?/g)].map(([, lo, hi]) =>
    hi ? `\\u${lo}-\\u${hi}` : `\\u${lo}`,
  );
  return `[${controls.join('')} ${ascii.join('')}${codePoints.join('')}]`;
}
const B_CLASS = boundaryClass();
const B_ONE = new RegExp(`^${B_CLASS}$`);
const MESSAGE_RE = new RegExp(patterns.message.decode);

/** §6.1 decoder preprocessing: remove at most one trailing `\n`, `\r`, or `\r\n`. */
function stripTrailingLineEnding(input) {
  if (input.endsWith('\r\n')) return input.slice(0, -2);
  if (input.endsWith('\n') || input.endsWith('\r')) return input.slice(0, -1);
  return input;
}

function extractEnvelope(input) {
  const m = stripTrailingLineEnding(input).match(MESSAGE_RE);
  if (!m) return null;
  return { severity: m[1], codes: m[2].split(' '), freetext: m[3] ?? '' };
}

/** Token extent: match minus one-code-point boundary on each side (rule 7). */
function tokenSpan(m, absIndex) {
  const full = m[0];
  let lo = absIndex;
  let hi = absIndex + full.length;
  if (full.length > 0 && B_ONE.test(full[0])) lo += 1;
  if (hi > lo && B_ONE.test(full[full.length - 1])) hi -= 1;
  return [lo, hi];
}

function overlapsClaimed(lo, hi, claimed) {
  for (let i = lo; i < hi; i++) {
    if (claimed.has(i)) return true;
  }
  return false;
}

function claimRange(claimed, lo, hi) {
  for (let i = lo; i < hi; i++) claimed.add(i);
}

/**
 * Find the first decode match that passes validate() and does not overlap claimed.
 * Wrapped as (?:^|B)(pattern)(?:B|$). On validation/overlap failure, resume after the
 * token (full match minus trailing B), per rule 6.
 */
function firstValidMatch(pattern, freetext, validate, claimed) {
  // `d` gives capture indices so Additional Validation can inspect characters
  // before group 1 (e.g. R03 decimal-fraction rejection).
  const re = new RegExp(`(?:^|${B_CLASS})(?:${pattern})(?:${B_CLASS}|$)`, 'd');
  let pos = 0;
  while (pos <= freetext.length) {
    const slice = freetext.slice(pos);
    const m = slice.match(re);
    if (!m) return null;

    const abs = pos + m.index;
    const full = m[0];
    const usedRightB = B_ONE.test(full[full.length - 1]);
    const [lo, hi] = tokenSpan(m, abs);
    const resume = Math.max(abs + full.length - (usedRightB ? 1 : 0), abs + 1);

    if (overlapsClaimed(lo, hi, claimed)) {
      pos = resume;
      continue;
    }
    if (validate && !validate(m, { freetext, pos })) {
      pos = resume;
      continue;
    }
    m.index = abs;
    m.tokenLo = lo;
    m.tokenHi = hi;
    return m;
  }
  return null;
}

/** True when group 1 is the fractional part of a decimal (digit + .|, before it). */
function isDecimalFraction(freetext, group1Start) {
  const before = freetext[group1Start - 1];
  const before2 = freetext[group1Start - 2];
  return (before === '.' || before === ',') && before2 >= '0' && before2 <= '9';
}

/** True when group 1 is `@H:MM` minutes (glued forms where timestamp cannot claim). */
function isColonTimestampMinutes(freetext, group1Start, digits) {
  if (freetext[group1Start - 1] !== ':') return false;
  if (!/^[0-5][0-9]$/.test(digits)) return false;
  return /@([01]?[0-9]|2[0-3])$/.test(freetext.slice(0, group1Start - 1));
}

function validateGps(m) {
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function validatePax(m, { freetext, pos }) {
  const group1Start = pos + m.indices[1][0];
  if (isDecimalFraction(freetext, group1Start)) return false;
  if (isColonTimestampMinutes(freetext, group1Start, m[1])) return false;
  return true;
}

function validateCallsign(m) {
  return m[1].length <= 12;
}

function toMinutes(kind, m) {
  const a = Number(m[1]);
  const b = m[2] !== undefined ? Number(m[2]) : 0;
  switch (kind) {
    case 'hm':
      return a * 60 + b;
    case 'h':
      return a * 60;
    case 'min':
    case 'bare':
      return a;
    case 'd':
      return a * 1440;
    default:
      return NaN;
  }
}

function scopeApplies(spec, codes) {
  if (spec.scopeCategory) {
    return codes.some((c) => c[0] === spec.scopeCategory && /^[A-Z][0-9]{2}$/.test(c));
  }
  if (spec.scope) return codes.includes(spec.scope);
  return true;
}

/** @returns {{ value: object, lo: number, hi: number } | null} */
function decodeConvention(name, freetext, codes, claimed) {
  const spec = patterns[name];
  if (!spec) throw new Error(`unknown convention ${name}`);
  if (!scopeApplies(spec, codes)) return null;

  if (name === 'appDesignator') {
    // First freetext token only (Additional Validation: match index 0).
    const m = firstValidMatch(spec.decode, freetext, null, claimed);
    if (!m || m.index !== 0) return null;
    return { value: { appDesignator: m[1] }, lo: m.tokenLo, hi: m.tokenHi };
  }

  if (name === 'duration') {
    const kinds = ['hm', 'h', 'min', 'd', 'bare'];
    let best = null;
    spec.decode.forEach((pat, i) => {
      // The bare number (last) is a fallback, used only when no unit-bearing value matches.
      if (best && kinds[i] === 'bare') return;
      const kind = kinds[i];
      const m = firstValidMatch(
        pat,
        freetext,
        (mm, ctx) => {
          if (!(toMinutes(kind, mm) > 0)) return false;
          const group1Start = ctx.pos + mm.indices[1][0];
          if (isColonTimestampMinutes(freetext, group1Start, mm[1])) return false;
          if (kind === 'bare') {
            // Group 2 present (47.3769), or `.`/`,` used as B before more digits (1.5h).
            if (mm[2] !== undefined) return false;
            const group1End = ctx.pos + mm.indices[1][1];
            const sep = freetext[group1End];
            const next = freetext[group1End + 1];
            if ((sep === '.' || sep === ',') && next >= '0' && next <= '9') return false;
            // Clock-shaped `H:MM` without `@` is not a bare ETA (`R03 14:30`).
            if (sep === ':' && /^[0-5][0-9]/.test(freetext.slice(group1End + 1))) return false;
            // Overlap with an earlier person-count claim is handled by rule 5 claiming.
            return true;
          }
          // Patterns 1–4: reject a number that is only the fractional part of a decimal.
          return !isDecimalFraction(freetext, group1Start);
        },
        claimed,
      );
      // First by position; on a tie the earlier pattern (already in best) wins.
      if (m && (!best || m.index < best.m.index)) best = { m, kind };
    });
    if (!best) return null;
    return {
      value: { duration: toMinutes(best.kind, best.m) },
      lo: best.m.tokenLo,
      hi: best.m.tokenHi,
    };
  }

  const validate =
    spec.validate === 'gps'
      ? validateGps
      : spec.validate === 'callsign'
        ? validateCallsign
        : spec.validate === 'pax'
          ? validatePax
          : null;
  const m = firstValidMatch(spec.decode, freetext, validate, claimed);
  if (!m) return null;
  let value;
  if (name === 'timestamp') {
    value = { timestamp: `${String(Number(m[1])).padStart(2, '0')}:${m[2]}` };
  } else if (name === 'pax') {
    value = { pax: Number(m[1]) };
  } else if (name === 'gps') {
    value = { gps: { lat: Number(m[1]), lon: Number(m[2]) } };
  } else if (name === 'language') {
    value = { language: m[1].toLowerCase().replace(/_/g, '-') };
  } else if (name === 'callsign') {
    value = { callsign: m[1].toUpperCase() };
  } else if (name === 'reference') {
    value = { reference: m[1] };
  } else {
    return null;
  }
  return { value, lo: m.tokenLo, hi: m.tokenHi };
}

function assertPatternsInBrief() {
  const missing = [];
  for (const [name, spec] of Object.entries(patterns)) {
    const list = [];
    if (typeof spec.encode === 'string') list.push(spec.encode);
    if (Array.isArray(spec.encode)) list.push(...spec.encode);
    if (typeof spec.decode === 'string') list.push(spec.decode);
    if (Array.isArray(spec.decode)) list.push(...spec.decode);
    for (const p of list) {
      if (!BRIEF.includes(p)) missing.push(`${name}: ${p}`);
    }
  }
  return missing;
}

/** JSON with object keys sorted, so key order does not affect comparison. */
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

function deepEqual(a, b) {
  return canonical(a) === canonical(b);
}

/** Every convention value a decoder extracts from a message, or null if it is not an MECP message. */
function decodeMessage(input) {
  const env = extractEnvelope(input);
  if (!env) return null;
  const got = {};
  const claimed = new Set();
  for (const name of DECODE_ORDER) {
    const result = decodeConvention(name, env.freetext, env.codes, claimed);
    if (!result) continue;
    Object.assign(got, result.value);
    claimRange(claimed, result.lo, result.hi);
  }
  return got;
}

const errors = [];
for (const m of assertPatternsInBrief()) {
  errors.push(`pattern not found verbatim in brief: ${m}`);
}

for (const name of DECODE_ORDER) {
  if (!patterns[name]) errors.push(`DECODE_ORDER names unknown convention: ${name}`);
}
for (const name of Object.keys(patterns)) {
  if (name !== 'message' && !DECODE_ORDER.includes(name)) {
    errors.push(`convention ${name} missing from DECODE_ORDER`);
  }
}

for (const t of tests) {
  const got = decodeMessage(t.input);
  // "x": null states that x is not decoded, the same as leaving x out.
  const expect = t.expect && Object.fromEntries(Object.entries(t.expect).filter(([, v]) => v !== null));
  if (!deepEqual(got, expect)) {
    errors.push(`${t.title} (${JSON.stringify(t.input)}): expected ${JSON.stringify(t.expect)}, got ${JSON.stringify(got)}`);
  }
}

if (errors.length) {
  console.error(`freetext check failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`freetext check passed (${tests.length} cases, patterns present in brief).`);
