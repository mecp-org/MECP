# MECP — Mesh Emergency Communication Protocol

**Cross-language emergency communication for LoRa mesh networks.**

MECP is a structured text encoding that lets people who share no common spoken language exchange meaningful information over bandwidth-constrained radio links. It works like a multilingual phrasebook that happens to be machine-parseable.

A user in Scotland composes a message by tapping through a menu in English. The client generates a compact ASCII string like `MECP/0/M01 M07 P05 2pax 56.68,-5.02`. That string travels over LoRa mesh radio. A recipient in Slovakia sees each code rendered in Slovak. No internet. No translation API. Just a lookup table shipped with the app.

This repository is the **protocol home**: message format, code table, and official language packs.

## Protocol version

See [Releases](https://github.com/mecp-org/MECP/releases) for the current protocol version. Clients claim adherence by that version string (also the matching git tag, GitHub Release, and `version` field in `package.json`). The normative wire format lives in [MECP_Comprehensive_Brief.md](MECP_Comprehensive_Brief.md).

## Implementations

Reference implementations live in [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app):

- **TypeScript engine** (`@mecp/engine`) — encode/decode, beacon helpers, tests
- **Web tool (PWA)** — offline compose/decode HTML tool
- **Expo / React Native app** — Meshtastic AIDL client (compose, inbox, beacon)
- **Examples** — Python, Arduino/ESP32, shell
- **Design plan** — product/UX design notes

That repo submodules this protocol repository for language packs (`vendor/mecp`). mecp-app was built against pre-release spec items and is not yet compliant with the current spec. Third-party implementations are listed in the section below.

## Quick Start

**Decode a message:**
```
MECP/0/M01 M07 P05 2pax 48.6520,20.1305
```
= MAYDAY: Injury, Fracture/immobile, 2 people, at GPS 48.6520, 20.1305

Try the offline web tool or mobile app in [mecp-app](https://github.com/mecp-org/mecp-app).

## Message Format

```
MECP/<severity>/<codes> [freetext]
```

| Severity | Label | Meaning |
|----------|-------|---------|
| 0 | MAYDAY | Life-threatening, immediate response |
| 1 | URGENT | Serious, hours matter |
| 2 | SAFETY | Hazard advisory |
| 3 | ROUTINE | Non-emergency |

## Code Categories

| Cat | Name | Example |
|-----|------|---------|
| M | Medical | M01 Injury, M07 Fracture |
| T | Terrain/Infrastructure | T04 Flooding, T07 Fire |
| W | Weather | W01 Storm approaching |
| S | Supplies | S01 Need water |
| P | Position/Movement | P05 At GPS coordinates |
| C | Coordination | C01 Send rescue |
| R | Response | R01 Acknowledged |
| D | Drill/Test | D01 This is a drill |
| L | Life/Leisure | L01 Beer, L04 Summit reached |
| X | Threat/Security | X01 Dangerous person nearby |
| H | Have/Offer Resources | H03 Have medical supplies |
| B | Beacon | B01 Distress beacon active |

See `languages/en.json` for the complete code table, or [MECP_Comprehensive_Brief.md](MECP_Comprehensive_Brief.md) for protocol detail.

## Examples

```
MECP/0/M01 M07 P05 2pax 48.6520,20.1305   Emergency: injury + fracture, 2 people, GPS
MECP/2/T04 T01 P02 Poprad                   Warning: flooding, road blocked, evacuating
MECP/3/L01 L06 running late                  Social: beer, running late
MECP/0/D01 M01 M07 P05 2pax 48.65,20.13     Drill: realistic practice, no real response
MECP/2/H03 H07 P05 5pax 48.65,20.13         Offering: medical supplies + shelter for 5
MECP/0/B01 M01 P05 48.65,20.13 @1430        Beacon: automated distress signal with GPS
MECP/2/B02 R01                               Beacon acknowledged
MECP/2/B03                                   Cancel beacon — I am OK
```

## Project Structure

```
languages/                   Official translation packs (JSON, one per language)
freetext/                    §6.1 convention patterns and decode test cases
docs/adr/                    Architecture decision records
scripts/                     Validators run by `npm run validate`
MECP_Comprehensive_Brief.md  Protocol narrative and design rationale
```

Clients and reference code: [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app).

## Why This Exists

LoRa mesh networks are growing across Europe. Communities operate nationally — Slovakia runs MeshCore, Scotland runs Meshtastic, German groups run both. These networks carry only plain text (about 230 bytes per message). There is no translation layer and no standardized vocabulary.

The failure scenario: a traveller with a mesh device in a foreign country during a crisis. Mobile networks are down. No internet. No common language. The radio link exists but is useless.

Maritime radio solved this decades ago with GMDSS. MECP is the mesh equivalent.

## Why Social Codes?

Emergency-only protocols fail because nobody learns them until the emergency. GMDSS works because sailors use it daily. MECP includes social codes (`L01` Beer, `L04` Summit reached) so people learn the interface through daily use. When someone needs `MECP/0/M07 P05 48.6520,20.1305`, their thumbs already know the path.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The highest-impact contribution is adding a verified language translation.

## Licenses

| Component | License |
|-----------|---------|
| Protocol specification | CC0 1.0 (public domain) |
| Language files | CC BY 4.0 |

The protocol is free forever. Anyone may implement MECP without restriction. App and engine code in [mecp-app](https://github.com/mecp-org/mecp-app) is GPLv3.

## Supported Languages (21)

Czech, Dutch, English, Farsi, French, German, Italian, Japanese, Norwegian, Polish, Portuguese, Russian, Serbian (Cyrillic), Simplified Chinese, Slovak, Spanish, Swedish, Traditional Chinese, Turkish, Ukrainian, Greek

## Known implementations

- **mecp-app** — [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app): reference MECP stack with an Expo/React Native Meshtastic client, offline web PWA, TypeScript `@mecp/engine`, and language examples.
- **mesh-client** — [Colorado-Mesh/mesh-client](https://github.com/Colorado-Mesh/mesh-client): cross-platform Electron desktop client for Meshtastic, MeshCore, and Reticulum with MECP compose, decode, and incident handling.
- **TAK bridge** — [Colorado-Mesh/meshcore-tak-bridge](https://github.com/Colorado-Mesh/meshcore-tak-bridge): Android bridge from a MeshCore companion radio to ATAK that surfaces inbound MECP messages in English and as severity-coloured map markers.
- **REM** — [FreeTAKTeam/reticulum_mobile_emergency_management](https://github.com/FreeTAKTeam/reticulum_mobile_emergency_management): Android situational-awareness app for Reticulum mesh that uses MECP for events, household status, and cross-language field messaging.
- **Wadamesh** — [wadamesh.com/apps.html#mecp](https://www.wadamesh.com/apps.html#mecp): on-device MeshCore store app that composes and decodes MECP emergency messages on the radio itself.
