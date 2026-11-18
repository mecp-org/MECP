# ADR 0005: Beacon codes are semantic; client behaviour is non-normative

**Status:** Accepted
**Date:** 2026-11-18
**Issue:** [#42](https://github.com/mecp-org/MECP/issues/42)

## Context

Category B (Beacon) was introduced as a PLB-style distress mechanism. The
brief’s §B narrative mixed two layers:

1. **Wire meaning** — what B01, B02 and B03 assert.
2. **Client behaviour** — retransmit intervals, ACK-driven rate reduction, and
   drill auto-stop.

MECP elsewhere defines message meaning, not mandatory receipt behaviour.
Embedding a state machine in the protocol brief broke that layering. It also
left address binding, authenticity and airtime unspecified while implying
clients must follow a single timing policy — a poor fit for MeshCore and other
meshes that police channel load.

## Decision

### Normative (protocol)

B01, B02 and B03 remain codes in the language packs. Their protocol meaning is:

| Code | Meaning |
|------|---------|
| B01 | Automated distress beacon active — the sender may be unresponsive; the message typically carries position |
| B02 | Beacon acknowledged |
| B03 | Cancel beacon — the sender reports they are OK |

The protocol does **not** require any retransmit schedule, rate change on B02,
or automatic shutdown when combined with D01. Those are client choices.

MECP does **not** define addressing or authorization for B02/B03. A channel
message containing those codes is a semantic claim only.

MECP does **not** add a general “bot codes” category in this decision. B01
already marks an automated distress signal. A broader machine-origin marker
requires a separate ADR if needed later.

### Non-normative (client / transport guidance)

Clients and operators MAY follow the guidance below. Divergence does not make
a message non-conforming MECP.

**Retransmit policy (B01).** A common reference pattern used by mecp-app is
decaying intervals: about every 5 minutes initially, 15 minutes after 6 hours,
and 30 minutes after 24 hours, with GPS when available. Clients MAY use slower
or event-driven schedules on airtime-sensitive meshes.

**ACK rate reduction (B02).** A beaconing client MAY slow its B01 schedule after
receiving a B02 it treats as bound to its beacon. The protocol does not require
that response.

**Drill (D01 + B01).** Clients MAY auto-stop a drill beacon after a small fixed
number of transmissions (mecp-app uses three) so practice does not look like a
live incident.

**Binding B02 / B03.** Prefer a transport binding so the ack or cancel names a
specific beacon sender — for example a direct message (DM) to that node, or a
platform mention convention such as MeshCore `@[Name#hash]` at the start of the
text. An unbound channel B02/B03 is ambiguous: receivers cannot reliably know
which beacon it refers to.

**Authenticity.** Treat B02 and B03 as claims. On a public channel, any station
can send them. Clients SHOULD prefer authenticated or peer-bound paths (DM,
signed packets, known contacts) before mutating local beacon state (slowing or
cancelling). Unauthenticated channel B02/B03 SHOULD be treated as advisory at
most. Wire codes never authorize a state change by themselves.

**Airtime.** Periodic B01 floods can trip anti-spam measures and draw community
pushback on busy meshes (especially MeshCore). Prefer conservative intervals,
dedicated or opt-in emergency channels where available, and app/companion
conventions rather than expecting upstream firmware SOS support.

## Consequences

- Brief §B describes code meanings only and points here for client guidance.
- Reference apps (e.g. mecp-app) may keep their beacon state machines; those
  behaviours are implementation detail, not protocol requirements.
- Proposals that mandate retransmit timing, require channel-wide B02/B03 to
  control another node’s beacon, or expand B into a general bot taxonomy are
  out of scope unless a new ADR supersedes this one.

## What would violate this

- Specifying mandatory B01 intervals, mandatory rate reduction on B02, or
  mandatory D01+B01 auto-stop in the normative protocol brief.
- Claiming MECP codes alone authenticate B02/B03 or address a specific beacon
  without transport binding.
- Treating a general “bot codes” redesign as implied by category B.
