# Freetext conformance suite

Shared §6.1 decode vectors for MECP implementers. The normative wire rules live in [`SPEC.md`](../SPEC.md). Pin a **release tag** (or the release zip), run every case against your decoder in CI, and bump the pin when you want new discrepancy cases.

## Files

| File | Role |
|------|------|
| `tests.json` | Decode cases |
| `patterns.json` | Reference encode/decode patterns (optional if you only need vectors) |
| `manifest.json` | `protocolVersion`, `schemaVersion`, file pointers |

## Pin a version

Replace `vX.Y.Z` with the protocol version you claim (same as the git tag / GitHub Release):

```text
https://raw.githubusercontent.com/mecp-org/MECP/vX.Y.Z/freetext/tests.json
https://raw.githubusercontent.com/mecp-org/MECP/vX.Y.Z/freetext/patterns.json
https://raw.githubusercontent.com/mecp-org/MECP/vX.Y.Z/freetext/manifest.json
```

Or download the release asset `freetext-conformance-vX.Y.Z.zip` from
[Releases](https://github.com/mecp-org/MECP/releases).

Do **not** pin floating `main` — new cases land there continuously and would break clients without a deliberate upgrade.

## Case shape (`schemaVersion` 1)

Each element of `tests.json` is:

```json
{
  "convention": "timestamp",
  "input": "MECP/3/L06 @1400",
  "expect": { "timestamp": "14:00" }
}
```

- `convention` — which convention to decode (`timestamp`, `reference`, `pax`, `gps`, `callsign`, `language`, `duration`, `appDesignator`), or `message` for envelope validity only.
- `input` — full MECP wire string.
- `expect` — for a named convention, the decoded fields (empty object `{}` means that convention does not decode). For `message`, `{ "valid": true }` or `{ "valid": false }`.

Assert `manifest.schemaVersion` is a version your runner understands before looping cases. When the case shape changes, MECP bumps `schemaVersion` in the next cut-release.

## Integrate in CI (sketch)

```bash
VER=v1.4.0   # bump when you want new pins
BASE=https://raw.githubusercontent.com/mecp-org/MECP/${VER}/freetext
curl -fsSL "$BASE/manifest.json" -o manifest.json
curl -fsSL "$BASE/tests.json" -o tests.json
# optional: curl -fsSL "$BASE/patterns.json" -o patterns.json

# Your runner: for each case, decode input with your engine and compare to expect.
# Fail the job on any mismatch. Refuse to run if schemaVersion is unsupported.
```

When MECP finds a new edge case it lands in a PR, ships in the next cut, and appears under the new tag. Bumping `VER` in your CI is how unknown clients pick up those pins.

## Reference harness

This repo’s oracle is `npm run test-freetext` (`scripts/check-freetext.mjs`). It is the normative RE2-style reference, not a required client dependency.
