# Contributing to MECP

Thank you for your interest in MECP. This project saves lives by enabling cross-language communication over mesh networks. Every contribution matters.

This repository holds the **protocol** and **language packs**. Client implementations live in [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app).

## How to Contribute

### Translations (Most Needed)

The highest-impact contribution is adding or verifying a language translation.

1. Copy `languages/_template.json` to `languages/XX.json` (ISO 639-1 code)
2. Translate every code and UI string
3. Use the English file (`languages/en.json`) as the reference for context on each code
4. Validate the file schema: `npm run validate-languages`
5. Submit a pull request with the title: `lang: Add [Language Name] translation`
6. A native speaker must review before merge

**Warning:** Machine-translated emergency phrases are dangerous. "Fracture" mistranslated as "crack" in the wrong sense could cause real problems. Every translation must be verified by a native speaker who understands emergency/medical terminology.

### Proposing New Codes

MECP codes are permanent. A code once assigned never changes meaning. This is by design — a printed reference card from 2026 must still be valid in 2036.

1. Open an issue using the "New Code Proposal" template
2. Include: proposed code, English text, category, rationale
3. Community discussion period (minimum 7 days)
4. Codes are only appended, never renumbered or redefined

### Changing the Protocol

The protocol lives in [`MECP_Comprehensive_Brief.md`](MECP_Comprehensive_Brief.md). Changes to it require:

1. **New vocabulary MUST be ASCII** and either inherited from GMDSS/SMCP or justified in a new ADR under [`docs/adr/`](docs/adr/).
2. **No localised token may appear in normative text.** Localised input is freetext; recognition is a local alias, not the protocol.
3. **Quantities use SI symbols.** New units require a new ADR under [`docs/adr/`](docs/adr/).
4. **Every convention needs Encode, Decode, Additional Validation, and Scope** (which code it attaches to).
5. **Patterns use `[0-9]`, never `\d`; ASCII-only case folding; RE2 subset only.**
6. **The encoder must be able to emit it, and every deployed decoder's input must still decode.**

When proposing a change:

1. Open an issue first (e.g. "Add …") — never silently edit normative text in a feature PR.
2. Link the issue and the ADR that governs the decision.
3. Include the before/after message strings that must keep working.

### Bug Reports

Use the "Bug Report" issue template. Include:
- What you expected to happen
- What actually happened
- The exact MECP string that caused the issue (if applicable)
- Your browser/device/OS
- MECP version (e.g. `1.2.0` or tag `v1.2.0`)

For engine, web, or mobile app bugs, open the issue against [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app).

## Validation

Run the full suite before opening a PR (also runs on git pre-commit and in CI):

```bash
npm run validate
```

That runs language-pack checks, brief/spec invariants, freetext conformance, and markdownlint.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind. This is emergency infrastructure.

## License

- Protocol specification: CC0 (public domain)
- Language files: CC BY 4.0
