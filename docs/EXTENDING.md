# Extending MECP

How to change the protocol, codebook, or freetext conventions. For translations and bug reports, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Path

1. **Read the normative wire format** — [`SPEC.md`](../SPEC.md) (§6). Section numbers are stable; cite as `MECP v{semver} §{section}`.
2. **Skim the ADRs** — [`docs/adr/`](adr/) (index in [`adr/README.md`](adr/README.md)). New vocabulary or units usually need a new ADR.
3. **Open an issue first** — never silently edit normative text in a feature PR. Link the issue when you open the PR.
4. **Write or update an ADR** under [`docs/adr/`](adr/) when the change is a design decision (new token, unit, Private Use policy, encode/decode split, etc.).
5. **Update the sources of truth:**
   - Wire rules / conventions → [`SPEC.md`](../SPEC.md)
   - Shared code text → [`languages/en.json`](../languages/en.json) (and translations)
   - Decode pins → [`freetext/tests.json`](../freetext/tests.json) / [`freetext/patterns.json`](../freetext/patterns.json)
   - Rationale only → [`MECP_Comprehensive_Brief.md`](../MECP_Comprehensive_Brief.md)
6. **Note the change** under `## [Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md).
7. **Validate** — `npm run validate` (also runs on pre-commit and in CI).

## Hard rules (summary)

Full detail is in [CONTRIBUTING.md](../CONTRIBUTING.md) and the ADRs:

- Codes are permanent: append only; never renumber or redefine.
- New vocabulary MUST be ASCII and either inherited from GMDSS/SMCP or justified in an ADR.
- Quantities use SI symbols (ADR 0002).
- Every freetext convention needs Encode, Decode, Additional Validation, and Scope.
- Patterns use `[0-9]`, never `\d`; ASCII-only case folding; RE2 subset only.
- The encoder must be able to emit it, and every deployed decoder’s input must still decode (ADR 0004).
