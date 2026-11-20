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

Two responses that do not fit MECP’s layering:

1. **Adopt `B04` into the shared codebook** — folding a single app’s product
   schema into the universal table, including a base64 JSON blob that fights
   compact LoRa airtime and the fixed ASCII vocabulary ([ADR 0003](0003-fixed-ascii-vocabulary.md)).
2. **One-off-reserve `B04`** — permanently banking a shared-category slot for one
   deployment’s local meaning, which scales poorly if every app asks for the same
   favour.

Category B remains PLB-style distress vocabulary only ([ADR 0005](0005-beacon-semantics-vs-client.md)).
Unallocated IDs in shared categories (including `B04`–`B99`) stay available for
future shared proposals evaluated on their merits.

Apps still need a sanctioned place for local codes. IANA-style Private Use
([RFC 8126](https://www.rfc-editor.org/rfc/rfc8126.html)) carves a range with no
central assignments; sites avoid collisions within their own scope. MECP can do
the same with an unused category letter.

A first-token “app designator” in freetext was considered so foreign clients
could optionally dispatch. That pattern is positional (like the R03 bare-number
duration). Review feedback preferred not to add another positional freetext
convention, and preferred either a future glyph-based marker or no designator
in this ADR. This decision omits a designator; apps may still put whatever
local markers they need in ordinary freetext.

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
- Unallocated IDs in **shared** categories (`M`, `T`, `W`, `S`, `P`, `C`, `R`,
  `D`, `L`, `X`, `H`, `B`) remain for future shared vocabulary. Apps that need
  local meaning SHOULD use `U` rather than minting IDs under those letters.
  A later proposal that wants a shared code is judged on substance, not on
  whether someone already shipped a private meaning under that ID.

### No app designator in this ADR

MECP does **not** define a normative app-designator convention (positional first
token or new glyph) here. Optional client support for Private Use remains
app-local: recognise `Uxx` and whatever freetext contract the peer uses.
A glyph-based designator MAY be proposed in a later ADR if cross-client
dispatch proves necessary.

### Path to shared meaning

Cross-app emergency vocabulary still goes through the normal New Code Proposal
and a new ADR — the same bar as Beacon `B01`–`B03`. Private Use is not a
substitute for that process when shared meaning is the goal.

## Consequences

- Brief §7 notes letter `U` as Private Use outside the 109/12 shared counts.
- REM (and any other app) can migrate local status to `Uxx` without MECP
  adopting their payload schema.
- A future proposal that needs a shared “household/community status” code is
  evaluated on its merits; this ADR does not bank `B04` for that purpose, and
  does not treat prior private use of an ID as either a claim on that ID or a
  reason to refuse a good shared proposal.
- Clients that already emit non-table codes remain wire-valid under §6.1 rule 5;
  only shared meaning and language-pack coverage are withheld until a proposal
  lands.

## What would violate this

- Adding `B04` / REMCS1 (or equivalent app JSON blobs) as normative MECP
  vocabulary without a superseding ADR that deliberately adopts them.
- One-off-reserving `B04` (or any other single shared-category ID) solely to
  mirror one app’s private deployment.
- Giving `U01`–`U99` MECP-defined meanings or language-pack strings in this
  decision’s scope.
- Requiring every client to understand every app’s Private Use payload.
- Treating this ADR as having adopted a positional or glyph app-designator
  convention.
