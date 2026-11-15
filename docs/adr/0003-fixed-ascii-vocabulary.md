# ADR 0003: The protocol vocabulary is fixed and language-neutral on the wire

**Status:** Accepted
**Date:** 2026-11-15

## Context

MECP carries structure rather than prose. Codes, sigils and convention keywords
are ASCII tokens. Localised forms (e.g. `4人`, `45分`) are ordinary freetext.

The question is whether this is a convention or a bug: should the protocol
allow a translated token? Should the spec enumerate localisations?

## Decision

MECP's vocabulary is fixed on the wire and never translated. Recognising
local equivalents is a client choice (local alias list), not a protocol
requirement.

This is inherited from GMDSS: GMDSS does not translate its signal words, and
localised input appears on a separate channel (NAVTEX 490 kHz) or as freetext.
MECP follows that pattern: codes, sigils, and keywords are ASCII; localised
forms are ordinary freetext.

Consequences:

- Tokens such as `pax`, `ETA`, `min`, `#`, `~` are not translated.
- Unit vocabulary is a handful of SI symbols rather than twenty languages' worth
  of words, so the standard does not change when a translation does.
- The rendering layer replaces tokens with localised forms.

## Consequences

- `pax` is a protocol keyword; `45分` is freetext.
- Unit vocabulary is a handful of SI symbols rather than twenty languages' worth
  of words, so the standard does not change when a translation does.
- The encoding of a duration never depends on the language packs.

## What would violate this

- A protocol token that requires a translated word on the wire.
- An enumerated list of unit tokens, one per supported language, making those
  tokens normative and changing the protocol when a translation changes.
- A spec that says "A duration token may be localised" or "The unit may be
  expressed in the user's language".
