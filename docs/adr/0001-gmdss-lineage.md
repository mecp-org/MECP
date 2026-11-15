# ADR 0001: MECP is a descendant of GMDSS

**Status:** Accepted
**Date:** 2026-11-15

## Context

MECP was designed for LoRa mesh emergency communication. It is not the first
protocol to solve cross-language emergency messaging over radio. The Global
Maritime Distress and Safety System (GMDSS) already did, and its vocabulary has
survived international negotiation since the 1970s.

The question is whether MECP invents its own vocabulary or reuses GMDSS's.

## Decision

MECP treats GMDSS as its parent standard. It reuses vocabulary that has already
survived international negotiation rather than inventing a new one. Where MECP
extends GMDSS (e.g. the `pax` convention, the code table), the extension is
recorded and justified.

Three dispositions come with that inheritance:

1. **Fixed, language-neutral vocabulary on the wire.** GMDSS does not translate
   its signal words. SMCP is English by design (IMO Resolution A.918(22));
   English proficiency is a GMDSS operator licensing requirement. DSC sends
   preformatted codes. NAVTEX broadcasts English on 518 kHz and other languages
   on a separate 490 kHz channel. AIS text is 6-bit ASCII. CAP, the closest
   civil analogue, defaults `<language>` to `en-US` and represents other
   languages as separate `<info>` blocks, never as translated enumerations.
   MECP follows: codes, sigils, and convention keywords are ASCII tokens. A
   localised form is ordinary freetext.

2. **SI units.** IMO Resolution A.351(IX) (1975) made SI the unit system of
   SOLAS and later instruments. See ADR 0002.

3. **Localisation at the edges.** The structure carries the meaning; the
   reader's device supplies the language. A decoder looks a code up in its own
   language pack and renders it.

GMDSS can assume trained, English-licensed operators. MECP cannot. That is why
MECP carries structure rather than prose, and why freetext may stay in any
language.

## Consequences

- New protocol vocabulary must be ASCII and either inherited from GMDSS/SMCP or
  justified by a new ADR.
- The spec does not enumerate localised forms. Recognising them is a client
  choice, not a protocol requirement.
- A proposal that would translate a protocol token is rejected on lineage
  grounds, not on taste.

## What would violate this

A protocol token that exists in a translated form on the wire (e.g. a decoder
required to accept `45分` as a duration value rather than as freetext).
