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

/**
 * Find the first decode match that passes validate().
 * Wrapped as (?:^|B)(pattern)(?:B|$). On validation failure, resume after the
 * token (full match minus trailing B), per rule 6.
 */
function firstValidMatch(pattern, freetext, validate) {
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

    if (validate && !validate(m, { freetext, pos })) {
      pos = Math.max(abs + full.length - (usedRightB ? 1 : 0), abs + 1);
      continue;
    }
    m.index = abs;
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

function validateGps(m) {
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/** Reject minutes of `@H:MM` claimed as a person count (`@6:30 pax` is time only). */
function validatePax(m, { freetext, pos }) {
  const group1Start = pos + m.indices[1][0];
  if (freetext[group1Start - 1] !== ':') return true;
  const minutes = m[1];
  if (!/^[0-5][0-9]$/.test(minutes)) return true;
  const beforeColon = freetext.slice(0, group1Start - 1);
  return !/@([01]?[0-9]|2[0-3])$/.test(beforeColon);
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

function decodeConvention(name, freetext, codes) {
  const spec = patterns[name];
  if (!spec) throw new Error(`unknown convention ${name}`);
  if (!scopeApplies(spec, codes)) return null;

  if (name === 'appDesignator') {
    // First freetext token only (Additional Validation: match index 0).
    const m = firstValidMatch(spec.decode, freetext, null);
    if (!m || m.index !== 0) return null;
    return { appDesignator: m[1] };
  }

  if (name === 'duration') {
    const kinds = ['hm', 'h', 'min', 'd', 'bare'];
    let best = null;
    spec.decode.forEach((pat, i) => {
      // The bare number (last) is a fallback, used only when no unit-bearing value matches.
      if (best && kinds[i] === 'bare') return;
      const kind = kinds[i];
      const m = firstValidMatch(pat, freetext, (mm, ctx) => {
        if (!(toMinutes(kind, mm) > 0)) return false;
        if (kind === 'bare') {
          // Group 2 present (47.3769), or `.`/`,` used as B before more digits (1.5h).
          if (mm[2] !== undefined) return false;
          const group1Start = ctx.pos + mm.indices[1][0];
          const group1End = ctx.pos + mm.indices[1][1];
          const sep = freetext[group1End];
          const next = freetext[group1End + 1];
          if ((sep === '.' || sep === ',') && next >= '0' && next <= '9') return false;
          // Yield to person count on the same digits (`R03 4 pax` is pax, not minutes).
          const paxAtDigits = firstValidMatch(patterns.pax.decode, freetext.slice(group1Start), null);
          if (paxAtDigits && paxAtDigits.index === 0) return false;
          return true;
        }
        // Patterns 1–4: reject a number that is only the fractional part of a decimal.
        const group1Start = ctx.pos + mm.indices[1][0];
        return !isDecimalFraction(freetext, group1Start);
      });
      // First by position; on a tie the earlier pattern (already in best) wins.
      if (m && (!best || m.index < best.m.index)) best = { m, kind };
    });
    return best ? { duration: toMinutes(best.kind, best.m) } : null;
  }

  const validate =
    spec.validate === 'gps'
      ? validateGps
      : spec.validate === 'callsign'
        ? validateCallsign
        : spec.validate === 'pax'
          ? validatePax
          : null;
  const m = firstValidMatch(spec.decode, freetext, validate);
  if (!m) return null;
  if (name === 'timestamp') {
    return { timestamp: `${String(Number(m[1])).padStart(2, '0')}:${m[2]}` };
  }
  if (name === 'pax') return { pax: Number(m[1]) };
  if (name === 'gps') return { gps: { lat: Number(m[1]), lon: Number(m[2]) } };
  if (name === 'language') return { language: m[1].toLowerCase().replace(/_/g, '-') };
  if (name === 'callsign') return { callsign: m[1].toUpperCase() };
  if (name === 'reference') return { reference: m[1] };
  return null;
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
  for (const name of Object.keys(patterns)) {
    if (name === 'message') continue;
    Object.assign(got, decodeConvention(name, env.freetext, env.codes) ?? {});
  }
  return got;
}

const errors = [];
for (const m of assertPatternsInBrief()) {
  errors.push(`pattern not found verbatim in brief: ${m}`);
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
