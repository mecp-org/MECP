/**
 * Cut a protocol release: bump versions, stamp the freetext suite, build the
 * conformance zip. Intended for .github/workflows/cut-release.yml; does not
 * commit, tag, or create the GitHub Release (the workflow does that).
 *
 * Usage: node scripts/cut-release.mjs <semver>
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER = /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-[0-9A-Za-z.-]+)?$/;

const version = process.argv[2];
if (!version || !SEMVER.test(version)) {
  console.error('Usage: node scripts/cut-release.mjs <semver>');
  process.exit(1);
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function write(rel, text) {
  writeFileSync(join(ROOT, rel), text);
}

function detectSchemaVersion(testsJson) {
  const tests = JSON.parse(testsJson);
  if (!Array.isArray(tests) || tests.length === 0) {
    throw new Error('freetext/tests.json is empty or not an array');
  }
  const hasTitle = tests.some((t) => typeof t.title === 'string');
  const hasConvention = tests.some((t) => typeof t.convention === 'string');
  if (hasTitle && !hasConvention) return 2;
  if (hasConvention) return 1;
  throw new Error('freetext/tests.json cases have neither title nor convention');
}

function bumpPackageJson(ver) {
  const pkgPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.version = ver;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function bumpPackageLock(ver) {
  const lockPath = join(ROOT, 'package-lock.json');
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  lock.version = ver;
  if (lock.packages?.['']) lock.packages[''].version = ver;
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

function bumpVersionLine(rel, ver, label) {
  const text = read(rel);
  const next = text.replace(/^\*\*Version:\*\* .+$/m, `**Version:** ${ver}`);
  if (next === text) throw new Error(`Could not find **Version:** line in ${label}`);
  write(rel, next);
}

function bumpBrief(ver) {
  bumpVersionLine('MECP_Comprehensive_Brief.md', ver, 'the brief');
  bumpVersionLine('SPEC.md', ver, 'SPEC.md');
}

function foldChangelog(ver) {
  const rel = 'CHANGELOG.md';
  const text = read(rel);
  if (text.includes(`## [${ver}]`)) {
    throw new Error(`CHANGELOG already has ## [${ver}]`);
  }
  // Consume Unreleased through its trailing --- so we do not double the rule.
  const unreleasedRe = /^## \[Unreleased\]\n([\s\S]*?)\n---\n+/m;
  const m = text.match(unreleasedRe);
  if (!m) throw new Error('Could not find ## [Unreleased] section in CHANGELOG.md');
  const body = m[1].trim();
  if (!body) throw new Error('## [Unreleased] is empty — nothing to ship');

  const today = new Date().toISOString().slice(0, 10);
  const replacement =
    `## [Unreleased]\n\n---\n\n## [${ver}] - ${today}\n\n${body}\n\n---\n\n`;
  write(rel, text.replace(unreleasedRe, replacement));
  // For gh release --notes-file (not committed).
  write('.release-notes.md', `${body}\n`);
}

function stampManifest(ver, schemaVersion) {
  const rel = 'freetext/manifest.json';
  const manifest = {
    protocolVersion: ver,
    schemaVersion,
    generatedAt: new Date().toISOString(),
    tests: 'tests.json',
    patterns: 'patterns.json',
  };
  write(rel, `${JSON.stringify(manifest, null, 2)}\n`);
}

function buildZip(ver) {
  const zipName = `freetext-conformance-v${ver}.zip`;
  const zipPath = join(ROOT, zipName);
  if (existsSync(zipPath)) {
    // overwrite on re-run
  }
  const files = ['manifest.json', 'README.md', 'tests.json', 'patterns.json'];
  for (const f of files) {
    if (!existsSync(join(ROOT, 'freetext', f))) {
      throw new Error(`missing freetext/${f}`);
    }
  }
  execFileSync('zip', ['-q', '-j', zipPath, ...files.map((f) => join('freetext', f))], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  return zipName;
}

const schemaVersion = detectSchemaVersion(read('freetext/tests.json'));
bumpPackageJson(version);
bumpPackageLock(version);
bumpBrief(version);
foldChangelog(version);
stampManifest(version, schemaVersion);
const zipName = buildZip(version);

console.log(
  JSON.stringify(
    {
      version,
      tag: `v${version}`,
      schemaVersion,
      zip: zipName,
    },
    null,
    2,
  ),
);
