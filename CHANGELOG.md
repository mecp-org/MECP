# Changelog

All notable changes to MECP will be documented in this file.

## [Unreleased]

### Protocol
- Clarify §6.1 top-level message requirements ([#35](https://github.com/mecp-org/MECP/issues/35)): wire limits, decoder trailing CR/LF strip, encoder refuse-or-truncate-to-fit, decoder size leniency; forbid `\f` alongside other line breaks; message pattern excludes U+0085/U+2028/U+2029
- Callsign: an AX.25/APRS SSID is outside the alphabet, so `~W1AW-9` stays freetext and is not read as `~W1AW` ([#36](https://github.com/mecp-org/MECP/issues/36)). Patterns are unchanged; two conformance cases pin the behaviour.
- §6.1 rule 4: restore the explicit ASCII boundary list (whitespace plus `, . ; : ! ? ' " ( ) [ ] { }`) and limit the MAY clause to non-ASCII space/punctuation ([#38](https://github.com/mecp-org/MECP/issues/38)). Matches the harness; no decode behaviour change.
- **Meaning change:** rule 2: decoders MUST accept every encoded (canonical) form and SHOULD accept anything matching the decoding pattern. Appendix A and ADRs 0002/0004 agree.
- **Meaning change:** `@HHMM` timestamps are in the sender's local time.
- **Meaning change:** R03 seconds are not rounded: `30s` is 0.5 min, below 1, so it is ignored (`60s` is 1 min).
- **Meaning change:** with several R03 durations, the first by position wins; pattern order only breaks ties at the same position, and a bare number is used only when no unit-bearing value matches (`R03 2d 45min` is 2 days).
- **Meaning change:** Appendix A and ADR 0002 drop the unused distance, weight and volume units; only the time units `s`, `min`, `h`, `d` remain.
- **Meaning change:** R03 code text is `ETA [time]` (was `ETA [minutes]`) in every language pack, since any SI time unit is valid. The bare-number pattern drops its redundant `(?:B|$)` suffix (rule 4 already implies it).
- §6.2 no longer lists severity words (the wire carries digits 0–3); `+` is listed as a non-boundary character, not a sigil; `ETA` is described as a prefix on an R03 duration

### Languages
- R03 `ETA [time]` and the timestamp UI strings (`attach_timestamp`, `site_what_example_time`) say local time instead of UTC in all 21 packs and the template. **These translations need native-speaker review.**
- `el.json` reformatted (LF line endings, no blank lines), content unchanged

### Docs
- Example glosses use the `en.json` code texts; README examples put `P05` before the person count so it is decoded as a code; one payload figure (Meshtastic's 233 bytes, §3.1); fixed the §5.1 byte count
- Removed restated rules and counts from the brief (§6.1 GPS and Duration validation, §9.1 UI string count, §9.3 list); ADR 0004 names the MAY exceptions
- CODE_OF_CONDUCT no longer offers a reporting channel, since the linked private reporting is not enabled

### Infrastructure
- `check-freetext` strips one trailing `\n` / `\r` / `\r\n` before matching; envelope tests cover trailing CR/LF, interior/forbidden breaks, and oversize decode
- `check-freetext` reads the boundary set from §6.1 rule 4 instead of a hard-coded copy; `0s` and `30s` are no longer decoded as 1 minute; new duration cases pin seconds and first-by-position
- `validate-spec` checks inline and README examples, flags a code that lands in freetext, and checks the brief version and the §7 code/category counts
- `validate-languages` takes category icons from `en.json`

---

## [1.3.0] - 2026-11-15

### Protocol
- R03 duration encoding is strict: no space between number and unit (`45min`, `2h`, `1h30min`). Decoders still accept spaced forms (`45 min`, `1h 30min`). Brief §6.1, Appendix A and ADRs 0002/0004 now agree.

### Docs
- README implementation snapshot refreshed for mesh-client MECP 1.2.1 adherence ([Colorado-Mesh/mesh-client#1472](https://github.com/Colorado-Mesh/mesh-client/pull/1472))
- Brief §7 lists codes only; `languages/en.json` is the single source of truth for code text
- Removed content duplicated across README, the brief and CONTRIBUTING; fixed stale file layout and roadmap

### Infrastructure
- `validate-spec` checks every code in brief examples against `en.json`, uses the §6.1 message pattern, and checks §7 lists exactly the `en.json` codes
- `validate-languages` rejects `TODO:` placeholders in any string field, not only codes and UI strings

---

## [1.2.1] - 2026-11-15

### Protocol
- R03 duration no longer caps at 1440 minutes ([#28](https://github.com/mecp-org/MECP/issues/28)): any positive total is valid in any SI time unit (`2d`, `48h`, `2880min`).

---

## [1.2.0] - 2026-11-15

### Added
- **M16** Medical supply drop needed (Medical category) — requested by mesh-client user [@rneese1969](https://github.com/rneese1969) via [Colorado-Mesh/mesh-client#1073](https://github.com/Colorado-Mesh/mesh-client/issues/1073); proposal [xiang-dev-1/MECP#4](https://github.com/xiang-dev-1/MECP/issues/4)

### Protocol
- Code table now: **12 categories, 109 codes** (was 108 codes)
- Freetext conventions are now specified by regular expression with separate encoding and decoding patterns ([#18](https://github.com/mecp-org/MECP/pull/18)). Decoding rules are normative: Additional Validation failures are ignored, never fatal, and freetext is preserved verbatim. Input is a single UTF-8 line with a 200-byte limit.
- **Breaking for existing implementations:** mecp-app's `#tag` truncation, Wadamesh's missing timestamp range check, and REM's unbounded callsigns are now non-conformant.
- Duration after `R03` is now a scoped freetext convention ([#21](https://github.com/mecp-org/MECP/issues/21), closes [#17](https://github.com/mecp-org/MECP/issues/17)): encode `R03 45min` (SI symbols required); decode also accepts `ETA` aliases and a bare first-token number; without `R03`, `45min` is ordinary freetext.

### Infrastructure
- This repository is now **protocol + language packs only**; engine, web tool, examples, and mobile app live in [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app)
- Canonical protocol version **1.2.0** (`package.json` version, brief header, git tag `v1.2.0`, GitHub Release) for client adherence claims
- Default branch renamed from `master` to `main`
- Unified validation: `npm run validate` (languages, spec, freetext, markdownlint) on git pre-commit and in CI
- Language validation is a standalone script: `scripts/validate-languages.mjs` (`npm run validate-languages`)
- Spec validation: `scripts/validate-spec.mjs` (`npm run validate-spec`)
- Freetext conformance harness: `freetext/patterns.json` + `freetext/tests.json` + `scripts/check-freetext.mjs` (`npm run test-freetext`) — asserts patterns appear verbatim in the brief and runs decode cases
- Markdown lint: `markdownlint-cli2` (`npm run lint:md`)

---

## [1.1.0] - 2026-02-27

### Added
- **B (Beacon) category** with 3 new codes: B01 (Automated distress beacon active), B02 (Beacon acknowledged), B03 (Cancel beacon — I am OK)
- Engine helpers: `isBeacon()`, `isBeaconAck()`, `isBeaconCancel()`
- Beacon system in mobile app: background GPS transmission with rate decay (5min → 15min → 30min), ACK loop, beacon status screen, received beacon cards in inbox
- Beacon service using expo-location foreground service for reliable background transmission
- Drill beacon support: D01+B01 auto-stops after 3 transmissions
- 14 new UI translation keys for beacon functionality across all 20 languages
- Beacon detection in Python, Arduino, and Shell reference implementations

### Protocol
- Code table now: **12 categories, 108 codes** (was 11 categories, 105 codes)
- New category B (Beacon) joins existing categories
- B01 messages carry GPS coordinates and timestamp, retransmitted at decaying intervals
- B02 acknowledges a beacon and reduces sender's transmission rate
- B03 cancels an active beacon

---

## [1.0.0] - 2026-02-25

### Added
- MECP protocol specification v1.0
- Complete code table: 11 categories, 105 codes
- MECP engine (TypeScript) with encoder, decoder, and full test suite
- Web encoder/decoder (PWA-enhanced single HTML file)
- Language files: 20 languages
- Language file template for contributors
- GitHub issue templates for code proposals and translation reviews
- Example implementations: Python, Arduino/ESP32, Shell
- Printable reference card support

### Protocol
- Categories: M (Medical), T (Terrain), W (Weather), S (Supplies), P (Position), C (Coordination), R (Response), D (Drill), L (Life/Leisure), X (Threat/Security), H (Have/Offer Resources)
- Severity levels: 0 (MAYDAY), 1 (URGENT), 2 (SAFETY), 3 (ROUTINE)
- Freetext conventions: GPS coordinates, person count (Npax), ETA, incident tags (#), language hints (@xx), timestamps (@HHMM), callsigns (~)
- Maximum message size: 200 bytes UTF-8
