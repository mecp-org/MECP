/**
 * Conformance harness for §6.1 freetext patterns.
 * - Asserts every pattern string in freetext/patterns.json appears verbatim in the brief
 * - Runs freetext/tests.json cases with RE2-compatible JS RegExp (no lookaround)
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRIEF = readFileSync(join(ROOT, 'MECP_Comprehensive_Brief.md'), 'utf8');
const patterns = JSON.parse(readFileSync(join(ROOT, 'freetext/patterns.json'), 'utf8'));
const tests = JSON.parse(readFileSync(join(ROOT, 'freetext/tests.json'), 'utf8'));

/** Boundary class B from §6.1 rule 4. */
const B_CLASS =
  '[\\t\\n\\f\\r ,.;:!?\'"()\\[\\]{}\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000\\u060C\\u061B\\u061F\\u06D4\\u00AB\\u00BB\\u2013\\u2014\\u2018-\\u201D\\u2026\\u3001\\u3002\\u300C-\\u300F\\u3010\\u3011\\uFF01\\uFF08\\uFF09\\uFF0C\\uFF0E\\uFF1A\\uFF1B\\uFF1F]';
const B_ONE = new RegExp(`^${B_CLASS}$`);

function extractEnvelope(input) {
  const m = input.match(
    /^MECP\/([0-3])\/([A-Z][0-9]{2}(?: [A-Z][0-9]{2})*)(?: ([^ \t\n\f\r](?:.*[^ \t\n\f\r])?))?$/,
  );
  if (!m) return null;
  return { severity: m[1], codes: m[2].split(' '), freetext: m[3] ?? '' };
}

/**
 * Find the first decode match that passes validate().
 * Wrapped as (?:^|B)(pattern)(?:B|$). On validation failure, resume after the
 * token (full match minus trailing B), per rule 6.
 */
function firstValidMatch(pattern, freetext, validate) {
  const re = new RegExp(`(?:^|${B_CLASS})(?:${pattern})(?:${B_CLASS}|$)`);
  let pos = 0;
  while (pos <= freetext.length) {
    const slice = freetext.slice(pos);
    const m = slice.match(re);
    if (!m) return null;

    const abs = pos + m.index;
    const full = m[0];
    const leftIsB = full.length > 0 && B_ONE.test(full[0]) && abs > 0;
    // At abs===0, ^ may match with no left B even if first char looks like B
    // (unlikely for our conventions). Prefer: left B only when not at start
    // OR when match used B because we're not at freetext start.
    const usedLeftB = abs > 0 && B_ONE.test(full[0]);
    const usedRightB = full.length > 0 && B_ONE.test(full[full.length - 1]);

    let tokenStart = abs + (usedLeftB ? 1 : 0);
    let tokenEnd = abs + full.length - (usedRightB ? 1 : 0);
    // Degenerate: entire match was only boundaries
    if (tokenEnd < tokenStart) tokenEnd = tokenStart;

    if (validate && !validate(m)) {
      pos = Math.max(tokenEnd, abs + 1);
      continue;
    }
    return m;
  }
  return null;
}

function validateGps(m) {
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
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
    case 's':
      return Math.max(1, Math.ceil(a / 60));
    default:
      return NaN;
  }
}

function decodeConvention(name, freetext, codes) {
  const spec = patterns[name];
  if (!spec) throw new Error(`unknown convention ${name}`);
  if (spec.scope && !codes.includes(spec.scope)) return null;

  if (name === 'duration') {
    const kinds = ['hm', 'h', 'min', 'd', 's', 'bare'];
    for (let i = 0; i < spec.decode.length; i++) {
      const kind = kinds[i];
      const pat = spec.decode[i];
      if (kind === 'bare') {
        const re = new RegExp(`^(?:[Ee][Tt][Aa] ?)?([0-9]+)(?:${B_CLASS}|$)`);
        const m = freetext.match(re);
        if (!m) continue;
        const mins = toMinutes('bare', m);
        if (mins >= 1) return { duration: mins };
        continue;
      }
      const m = firstValidMatch(pat, freetext, (mm) => {
        const mins = toMinutes(kind, mm);
        return mins >= 1;
      });
      if (m) return { duration: toMinutes(kind, m) };
    }
    return null;
  }

  const validate =
    spec.validate === 'gps' ? validateGps : spec.validate === 'callsign' ? validateCallsign : null;
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

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const errors = [];
for (const m of assertPatternsInBrief()) {
  errors.push(`pattern not found verbatim in brief: ${m}`);
}

for (const t of tests) {
  if (t.convention === 'message') {
    const got = { valid: !!extractEnvelope(t.input) };
    if (!deepEqual(got, t.expect)) {
      errors.push(`${t.input}: expected ${JSON.stringify(t.expect)}, got ${JSON.stringify(got)}`);
    }
    continue;
  }
  const env = extractEnvelope(t.input);
  if (!env) {
    errors.push(`${t.input}: envelope failed unexpectedly`);
    continue;
  }
  const got = decodeConvention(t.convention, env.freetext, env.codes) ?? {};
  if (!deepEqual(got, t.expect)) {
    errors.push(`${t.convention} ${t.input}: expected ${JSON.stringify(t.expect)}, got ${JSON.stringify(got)}`);
  }
}

if (errors.length) {
  console.error(`freetext check failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`freetext check passed (${tests.length} cases, patterns present in brief).`);
