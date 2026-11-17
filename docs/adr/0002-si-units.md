# ADR 0002: MECP uses SI units

**Status:** Accepted
**Date:** 2026-11-15

## Context

MECP convention values include quantities — today, only duration (R03 ETA).
The question is which unit symbols are normative: English words (`minutes`,
`hours`), ISO 8601 designators (`PT1M`), or SI symbols (`min`, `h`).

The decision has a portability cost. English words translate; ISO 8601
designators are long; SI symbols are identical in every language.

## Decision

MECP uses SI unit symbols for all convention values that are quantities.

- Time: `s`, `min`, `h`, `d`

SI symbols are not translated. `45min` is not an English word; `分` is the
translation of it. The wire carries the symbol; the reader's device renders the
localised form.

This is not a MECP-specific choice. IMO Resolution A.351(IX) (1975) made SI the
unit system of the International Convention for the Safety of Life at Sea
(SOLAS) and later IMO instruments. MECP inherits from GMDSS, and GMDSS uses SI.

The only maritime exceptions are speed and distance (knots, nautical miles,
cables), which are operational units for navigation, not SI. MECP does not use
them; a duration is always encoded with an SI symbol.

## Consequences

- `45min`, `1h30min`, `2h`, `1d` are encodable forms: no space between number
  and unit. Spaced forms (`45 min`, `1h 30min`) are decode-only.
- `45m` is rejected — `m` is metre, not minute.
- `45 minutes`, `45分`, `45 دقیقه` are never encodable. They are freetext.
- A bare number (`45`) is decode-only, read as minutes, and only valid as the
  first freetext token after `R03`. A unit-bearing value may appear anywhere.
- Decoders MUST accept every encoded form. Decoders MAY accept localised words
  as local aliases, but those aliases are not part of the protocol.
- The rendering layer replaces tokens with localised forms.

## What would violate this

A convention that requires a translated unit word in a conforming message (e.g.
`R03 45分` or `R03 45 Minuten` as a required encoding).
