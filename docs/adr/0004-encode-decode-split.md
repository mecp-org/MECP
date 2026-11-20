# ADR 0004: Encode/decode split with bounded leniency

**Status:** Accepted
**Date:** 2026-11-15

## Context

MECP conventions have an **encoding** pattern and a **decoding** pattern.
The encoder must produce canonical output; the decoder may accept a broader
set of forms. The question is how permissive decoding may be before it becomes
unpredictable.

Leniency has a cost: every extra accepted form is a form that can produce a
false positive, and clients diverge. A bounded leniency policy keeps the two
sides reconcilable.

## Decision

MECP has a canonical encoding and a permissive decode.

- **Encode** — canonical forms only. `R03 45min` (not `R03 45`), `pax` as a
  protocol keyword (not `pessoas` or `人`).
- **Decode** — MUST accept every canonical form and SHOULD accept the bounded
  variants matched by the decoding patterns:
  - After `R03`, `ETA 45min`, `ETA45min` and `ETA 45` are accepted as aliases
    for `45min`.
  - `45 min` and `1h 30min` are accepted as spaced forms of `45min` and
    `1h30min`.
  - A bare number is accepted only as the first freetext token after `R03`.
  - Localised words (`分`, `dakika`) may be accepted as local aliases, but they
    are not part of the protocol.

The bounded leniency rules:

1. **All decode aliases MUST be listed in the spec.** No silent aliases.
2. **Position matters only where self-identification fails** (bare number).
   When several values match, the first by position wins (§6.1 rule 5); a
   bare number is used only when no unit-bearing value matches. Across
   conventions, a bare R03 number also yields when those digits start a
   person-count match (`R03 4 pax` is pax, not minutes; see [#48](https://github.com/mecp-org/MECP/issues/48)).
3. **Validation is normative before a match is used** (6.1 rule 6).
4. **Encoders emit canonical forms only**, so every conforming encoder
   interoperates with every conforming decoder without ambiguity.

## Consequences

- A decoder may be more permissive than an encoder, but not more permissive
  than the spec.
- A client that accepts a form not listed in the spec is a non-conforming
  decoder, and its behaviour is not portable. The only exceptions are the MAY
  clauses in §6.1 rule 4 (non-ASCII boundaries) and Appendix A (local aliases).
- The leniency policy prevents the drift that would occur if each client
  invented its own variants (e.g. one client accepts `1h 30m`, another
  accepts `90 minutes`).

## What would violate this

- An encode pattern that accepts a non-canonical form (e.g. `R03 45` with a
  unit implied).
- A decode pattern that is not listed in the spec (e.g. `1h 30m` silently
  accepted).
- A position rule for a self-identifying form (e.g. requiring `45min` to be
  the first token).
- A decode rule that accepts a token whose meaning changes the protocol (e.g.
  `pax` = `people` without qualification).
