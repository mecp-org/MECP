/**
 * Validate language JSON files against the English reference schema.
 * Used by CI via `npm run validate-languages`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATEGORIES,
  CODE_REGEX,
  VALID_SEVERITIES,
  type LanguageFile,
} from '../src/types';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LANGUAGES_DIR = join(ROOT, 'languages');
const REFERENCE = 'en.json';
const TEMPLATE = '_template.json';

const REQUIRED_STRING_FIELDS = [
  'language',
  'language_name',
  'language_name_en',
  'language_name_latin',
  'flag_emoji',
] as const;

const REQUIRED_OBJECT_FIELDS = [
  'severities',
  'categories',
  'codes',
  'ui',
  'deprecations',
] as const;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function loadJson(filename: string): unknown {
  const path = join(LANGUAGES_DIR, filename);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`${filename}: invalid JSON (${(err as Error).message})`);
  }
}

function sortedKeys(obj: JsonObject): string[] {
  return Object.keys(obj).sort();
}

function diffKeys(expected: string[], actual: string[]): { missing: string[]; extra: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  return {
    missing: expected.filter((k) => !actualSet.has(k)),
    extra: actual.filter((k) => !expectedSet.has(k)),
  };
}

function validateLanguageFile(
  filename: string,
  data: unknown,
  reference: LanguageFile,
  options: { requireFilenameMatch: boolean; allowTodoPlaceholders: boolean },
): string[] {
  const errors: string[] = [];
  const prefix = filename;

  if (!isObject(data)) {
    return [`${prefix}: root value must be a JSON object`];
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = data[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${prefix}: missing or empty string field "${field}"`);
    }
  }

  const direction = data.text_direction;
  if (direction !== 'ltr' && direction !== 'rtl') {
    errors.push(`${prefix}: text_direction must be "ltr" or "rtl"`);
  }

  for (const field of REQUIRED_OBJECT_FIELDS) {
    if (!isObject(data[field])) {
      errors.push(`${prefix}: missing object field "${field}"`);
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  const file = data as unknown as LanguageFile;

  if (options.requireFilenameMatch) {
    const stem = filename.replace(/\.json$/, '');
    if (file.language !== stem) {
      errors.push(
        `${prefix}: language field "${file.language}" must match filename stem "${stem}"`,
      );
    }
  }

  // Severities
  const expectedSev = VALID_SEVERITIES.map(String);
  const { missing: missingSev, extra: extraSev } = diffKeys(
    expectedSev,
    sortedKeys(file.severities as unknown as JsonObject),
  );
  if (missingSev.length) errors.push(`${prefix}: missing severities: ${missingSev.join(', ')}`);
  if (extraSev.length) errors.push(`${prefix}: unexpected severities: ${extraSev.join(', ')}`);

  for (const key of expectedSev) {
    const sev = file.severities[key];
    if (!sev) continue;
    if (typeof sev.local !== 'string' || sev.local.trim() === '') {
      errors.push(`${prefix}: severities.${key}.local must be a non-empty string`);
    }
    if (typeof sev.label !== 'string' || sev.label.trim() === '') {
      errors.push(`${prefix}: severities.${key}.label must be a non-empty string`);
    }
  }

  // Categories
  const expectedCats = Object.keys(CATEGORIES);
  const { missing: missingCats, extra: extraCats } = diffKeys(
    expectedCats,
    sortedKeys(file.categories as unknown as JsonObject),
  );
  if (missingCats.length) errors.push(`${prefix}: missing categories: ${missingCats.join(', ')}`);
  if (extraCats.length) errors.push(`${prefix}: unexpected categories: ${extraCats.join(', ')}`);

  for (const key of expectedCats) {
    const cat = file.categories[key];
    if (!cat) continue;
    if (typeof cat.name !== 'string' || cat.name.trim() === '') {
      errors.push(`${prefix}: categories.${key}.name must be a non-empty string`);
    }
    if (typeof cat.icon !== 'string' || cat.icon.trim() === '') {
      errors.push(`${prefix}: categories.${key}.icon must be a non-empty string`);
    } else if (CATEGORIES[key as keyof typeof CATEGORIES].icon !== cat.icon) {
      errors.push(
        `${prefix}: categories.${key}.icon must be "${CATEGORIES[key as keyof typeof CATEGORIES].icon}"`,
      );
    }
  }

  // Codes — must match English key set exactly
  const { missing: missingCodes, extra: extraCodes } = diffKeys(
    sortedKeys(reference.codes),
    sortedKeys(file.codes as unknown as JsonObject),
  );
  if (missingCodes.length) {
    errors.push(`${prefix}: missing codes (${missingCodes.length}): ${missingCodes.join(', ')}`);
  }
  if (extraCodes.length) {
    errors.push(`${prefix}: unexpected codes (${extraCodes.length}): ${extraCodes.join(', ')}`);
  }

  for (const [code, text] of Object.entries(file.codes)) {
    if (!CODE_REGEX.test(code)) {
      errors.push(`${prefix}: invalid code key "${code}" (expected ${CODE_REGEX})`);
    }
    if (typeof text !== 'string' || text.trim() === '') {
      errors.push(`${prefix}: codes.${code} must be a non-empty string`);
    } else if (!options.allowTodoPlaceholders && text.startsWith('TODO:')) {
      errors.push(`${prefix}: codes.${code} still has a TODO placeholder`);
    }
  }

  // UI strings — must match English key set exactly
  const { missing: missingUi, extra: extraUi } = diffKeys(
    sortedKeys(reference.ui),
    sortedKeys(file.ui as unknown as JsonObject),
  );
  if (missingUi.length) {
    errors.push(`${prefix}: missing ui keys (${missingUi.length}): ${missingUi.slice(0, 20).join(', ')}${missingUi.length > 20 ? ', ...' : ''}`);
  }
  if (extraUi.length) {
    errors.push(`${prefix}: unexpected ui keys (${extraUi.length}): ${extraUi.slice(0, 20).join(', ')}${extraUi.length > 20 ? ', ...' : ''}`);
  }

  for (const [key, text] of Object.entries(file.ui)) {
    if (typeof text !== 'string' || text.trim() === '') {
      errors.push(`${prefix}: ui.${key} must be a non-empty string`);
    } else if (!options.allowTodoPlaceholders && text.startsWith('TODO:')) {
      errors.push(`${prefix}: ui.${key} still has a TODO placeholder`);
    }
  }

  // Deprecations must be an object of strings (may be empty)
  for (const [code, note] of Object.entries(file.deprecations)) {
    if (!CODE_REGEX.test(code)) {
      errors.push(`${prefix}: deprecations key "${code}" is not a valid code`);
    }
    if (typeof note !== 'string' || note.trim() === '') {
      errors.push(`${prefix}: deprecations.${code} must be a non-empty string`);
    }
  }

  return errors;
}

function main(): void {
  const files = readdirSync(LANGUAGES_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort();

  if (!files.includes(REFERENCE)) {
    console.error(`Missing reference language file: ${REFERENCE}`);
    process.exit(1);
  }

  const reference = loadJson(REFERENCE) as LanguageFile;
  const allErrors: string[] = [];

  // Validate English against schema first
  allErrors.push(
    ...validateLanguageFile(REFERENCE, reference, reference, {
      requireFilenameMatch: true,
      allowTodoPlaceholders: false,
    }),
  );

  for (const filename of files) {
    if (filename === REFERENCE) continue;

    const data = loadJson(filename);
    const isTemplate = filename === TEMPLATE;
    allErrors.push(
      ...validateLanguageFile(filename, data, reference, {
        requireFilenameMatch: !isTemplate,
        allowTodoPlaceholders: isTemplate,
      }),
    );
  }

  if (allErrors.length > 0) {
    console.error(`Language validation failed with ${allErrors.length} error(s):\n`);
    for (const err of allErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const languageCount = files.filter((f) => f !== TEMPLATE).length;
  console.log(
    `Validated ${languageCount} language file(s)` +
      (files.includes(TEMPLATE) ? ' and template' : '') +
      ` against ${REFERENCE} (${Object.keys(reference.codes).length} codes, ${Object.keys(reference.ui).length} ui keys).`,
  );
}

main();
