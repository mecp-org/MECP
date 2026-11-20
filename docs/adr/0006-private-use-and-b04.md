# ADR 0006: Private Use letter U; do not adopt B04 / REMCS1

**Status:** Accepted
**Date:** 2026-11-20
**Issue:** [#50](https://github.com/mecp-org/MECP/issues/50)

## Context

FreeTAKTeam’s reticulum mobile emergency management app (REM) began emitting
messages of the form:

```
MECP/2/B04 #HH_… REMCS1:<base64url(canonical-json)>
```

with proposed English text “Household/community status”. That contract is an
app-local community-status payload (household id, composition, status enums,
power-saver flag), not a PLB-style beacon and not a cross-implementation
emergency code. Issue #50 asked MECP to adopt `B04`, reserve it, or otherwise
record a decision.

Two bad responses would be:

1. **Adopt `B04` into the shared codebook** — folding a single app’s product
   schema into the universal table, including a base64 JSON blob that fights
   compact LoRa airtime and the fixed ASCII vocabulary ([ADR 0003](0003-fixed-ascii-vocabulary.md)).
2. **One-off-reserve `B04`** — freezing a shared-category slot around whoever
   shipped first and teaching other apps to squat unallocated IDs in `M`…`B`.

Category B remains PLB-style distress vocabulary only ([ADR 0005](0005-beacon-semantics-vs-client.md)).
Unallocated IDs in shared categories (including `B04`–`B99`) stay MECP-owned for
future ADRs.

Apps still need a sanctioned place for local codes. IANA-style Private Use
([RFC 8126](https://www.rfc-editor.org/rfc/rfc8126.html)) carves a range with no
central assignments; sites avoid collisions within their own scope. MECP can do
the same with an unused category letter, plus a short app designator so foreign
clients can optionally dispatch without a vendor TLV.

## Decision

### Reject B04 / REMCS1

- MECP does **not** add `B04` (or “Household/community status”) to the codebook
  or language packs.
- MECP does **not** one-off-reserve `B04`.
- `REMCS1:` and any base64/JSON household payload are **not** MECP freetext
  conventions. They remain ordinary freetext under the 200-byte limit, with no
  protocol meaning.

### Private Use letter U

- Letter **`U`** is Private Use. Codes `U01`–`U99` carry **no MECP semantics**.
- They are **not** listed in §7’s 109-code shared table and have **no** language-pack
  strings. Decoders already MUST preserve well-formed unknown codes (§6.1).
- Apps MAY emit `Uxx` for local meaning. MECP does **not** register which app
  owns which `Uxx`. Collisions are the apps’ problem (classic Private Use).
- Apps MUST NOT assign meanings to unallocated IDs in **shared** categories
  (`M`, `T`, `W`, `S`, `P`, `C`, `R`, `D`, `L`, `X`, `H`, `B`).

### App designator (normative, scoped)

Codes in a message must stay contiguous (§6.1 rule 3), so a designator cannot
sit between `U` codes. When the code section contains one or more `U[0-9]{2}`
codes, the **first freetext token** is the app designator:

| | |
|---|---|
| Encode | `([a-z][a-z0-9-]{0,31})` (encoders MUST emit lowercase) |
| Decode | `^([a-z][a-z0-9-]{0,31})` at the start of freetext (first token only) |
| Encoder | SHOULD emit a designator when emitting any `U` code |
| Decoder | MAY expose the designator structurally; MAY interpret the remainder of freetext only when it recognises that designator |

MECP does **not** maintain a registry of designator strings (`rem`, `mecp-app`,
…). Other freetext conventions (`#`, `~`, `@`, `pax`, …) still apply to the whole
freetext. Example shape:

```
MECP/2/U04 rem #HH_0123456789abcdef …
```

### Path to shared meaning

Cross-app emergency vocabulary still goes through the normal New Code Proposal
and a new ADR — the same bar as Beacon `B01`–`B03`. Private Use is not a
back-door into the shared table.

## Consequences

- Brief §6.1 documents the scoped app-designator convention; §7 notes letter `U`
  as Private Use outside the 109/12 shared counts.
- The freetext harness pins the designator patterns and scope behaviour.
- REM (and any other app) can migrate local status to `Uxx` + designator without
  MECP adopting their payload schema.
- A future proposal that needs a shared “household/community status” code must
  justify it on its own merits; this ADR does not reserve `B04` for that purpose.

## What would violate this

- Adding `B04` / REMCS1 (or equivalent app JSON blobs) as normative MECP
  vocabulary without a superseding ADR that deliberately adopts them.
- One-off-reserving `B04` (or any other single shared-category ID) for an app
  that never went through the proposal process.
- Giving `U01`–`U99` MECP-defined meanings or language-pack strings in this
  decision’s scope.
- Requiring every client to understand every app’s Private Use payload.
