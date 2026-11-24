# MECP Specification

**Version:** 1.4.1
**Normative:** This document is the authoritative wire format for MECP.
**Codebook:** Shared code IDs and English text live in [`languages/en.json`](languages/en.json).
**Rationale:** Design narrative lives in [`MECP_Comprehensive_Brief.md`](MECP_Comprehensive_Brief.md).
**Citation:** Prefer `MECP v{semver} §{section}` (e.g. `MECP v1.4.1 §6.1 rule 4`). Section numbers are stable; older `S6…` / unversioned `§6…` refer to the same clauses at the cited release tag.

---

## 6. How MECP Works

Patterns use the [RE2](https://github.com/google/re2)-compatible regular expression syntax subset — no lookaround, no backreferences — which is portable across many languages and libraries.

### 6.1 Message Format

Every MECP message follows this structure:

```
MECP/<severity>/<code1> <code2> ... [optional freetext]
```

A message matches this pattern:

```
^MECP/([0-3])/([A-Z][0-9]{2}(?: [A-Z][0-9]{2})*)(?: ([^ \t\n\f\r\u0085\u2028\u2029](?:[^\n\f\r\u0085\u2028\u2029]*[^ \t\n\f\r\u0085\u2028\u2029])?))?$
```
1. Severity
2. Codes
3. Optional Freetext

**Wire (conforming message).** A conforming MECP message is a single line of UTF-8. It MUST NOT contain `\r`, `\n`, `\f` (U+000C), U+0085, U+2028 or U+2029. It MUST NOT exceed 200 bytes of UTF-8: the limit counts bytes, not characters, so a 200-character Japanese or Chinese message is about 600 bytes and does not fit. When present, freetext MUST be non-empty and MUST NOT begin or end with a space.

**Decoder preprocessing.** Before matching the message pattern, a decoder MUST remove at most one trailing line ending — `\n`, `\r`, or `\r\n`. After that strip, if any forbidden line-break character remains, the input is not a valid MECP message.

**Encoders.** An encoder MUST NOT emit a non-conforming message: it MUST NOT emit forbidden line-break characters, a byte-order mark, or more than 200 UTF-8 bytes. Encoders MUST count bytes. If structured input would exceed 200 bytes, the encoder MUST refuse to produce a transmittable string, or MAY truncate freetext only; when truncating, it MUST NOT split a UTF-8 sequence or a grapheme cluster. Returning an oversized string with a warning is conforming only if that string is not transmitted.

**Decoders.** Decoders MUST NOT reject a message solely because it exceeds 200 bytes. Decoders SHOULD replace an invalid UTF-8 sequence with U+FFFD rather than rejecting the message. Test vectors longer than 200 bytes are valid for encoder conformance; on decode, an otherwise well-formed oversize input SHOULD still parse.

#### Prefix
Identifies this as an MECP-formatted message (5 bytes).

#### Severity
A single digit 0-3:

| Level | Name | Meaning | Colour |
|-------|------|---------|--------|
| 0 | MAYDAY | Life-threatening emergency | Red |
| 1 | URGENT | Time-critical, not immediately life-threatening | Orange |
| 2 | SAFETY | Important safety information | Amber |
| 3 | ROUTINE | Normal/non-emergency communication | Blue |

#### Codes
1. One or more codes from the MECP code table, separated by spaces.
2. Each code is a letter (category) followed by two digits: `M01`, `T04`, `C01`, `L01`, etc.
3. The code section ends at the first space-delimited token that does not match the code pattern. Codes are case-sensitive: a lowercase token is not a code and therefore ends the code section.
4. The match is greedy, so `MECP/1/T05 T05 damaged` contains two `T05` codes and the freetext `damaged`.
5. A well-formed code that is not in the code table is still a code. Decoders MUST preserve and display it, and MUST NOT treat it as freetext.

#### Optional Freetext
1. May include structured conventions.
2. Each convention has an **encoding** pattern and a **decoding** pattern. Each encoded convention value MUST match its encoding pattern; decoders MUST accept every encoded (canonical) form and SHOULD accept anything that matches the decoding pattern. Every encoded value also matches its decoding pattern.
3. Encoding patterns can be assumed to be prefixed with `(?:^| )` and suffixed with `(?: |$)`: conventions are separated by a single ASCII space.
4. Decoding patterns can be assumed to be prefixed with `(?:^|B)` and suffixed with `(?:B|$)`, where `B` is `\t`, `\n`, `\f`, `\r`, a space, or one of `, . ; : ! ? ' " ( ) [ ] { }`, plus these code points: U+00A0, U+1680, U+2000–U+200A, U+202F, U+205F, U+3000; U+060C, U+061B, U+061F, U+06D4; U+00AB, U+00BB, U+2013, U+2014, U+2018–U+201D, U+2026; U+3001, U+3002, U+300C–U+300F, U+3010, U+3011; U+FF01, U+FF08, U+FF09, U+FF0C, U+FF0E, U+FF1A, U+FF1B, U+FF1F. The sigils `@ # ~` and the characters `+ - _` are not boundaries. Decoders MAY also treat any other non-ASCII Unicode space or punctuation code point as a boundary. A boundary is never more than one code point wide.
5. Decoders apply conventions in this order: app designator, GPS coordinates, timestamp, language hint, callsign, reference, person count, duration. For each convention they search the freetext for its decoding pattern. Only the first match by position is used; matching is case-sensitive except where a pattern spells out character classes such as `[Pp][Aa][Xx]`. `^` and `$` refer to the start and end of the freetext. Patterns MUST use `[0-9]`, never `\d`: `\d` is ASCII-only in Go and JavaScript but matches Arabic-Indic and fullwidth digits in Python and Rust, so `@١٤٣٠` would decode on one client and not on another. Case folding MUST be ASCII-only and locale-independent (`A`–`Z` ↔ `a`–`z`); implementations MUST NOT use locale-sensitive APIs such as JavaScript `toLocaleLowerCase()`, Java `toLowerCase()` without `Locale.ROOT`, or C# `ToLower()` without `CultureInfo.InvariantCulture`, because in a Turkish locale `IT` folds to `ıt` and `izmir` uppercases to `İZMİR`. A successful match **claims** its token (rule 7). A match whose token overlaps any claimed character fails under rule 6, and the search resumes after that failed match. Characters never claimed remain ordinary freetext (the structural remainder clients may treat as a “tail”). This order puts self-identifying structure (coordinates, time, tags) ahead of digit-leading forms (`pax`, duration), so a MAYDAY with `47.3769,8.5417 pax` keeps the GPS fix and does not invent thousands of people from the longitude fraction, and `@6:30 pax` is a time rather than 30 people.
6. Additional Validation is normative. Before using a match, a decoder MUST apply the validation for that convention. If the match fails, the decoder MUST ignore it and resume searching from the end of the failed match. A convention that fails Additional Validation MUST NOT invalidate the message, and its text MUST be left in the freetext unchanged. An encoder MUST apply the same validation and MUST NOT emit a value that fails it.
7. When rendering, a decoder replaces the matched **token** — the match excluding the one-code-point boundary on each side, where present — with its human-readable form, then re-emits the boundary characters. Boundaries are separators and MUST be preserved. The same token extent is what rule 5 claims. Decoders SHOULD also expose each extracted value structurally.
8. Unicode whitespace (NBSP, U+2000–U+200A, U+3000, U+FEFF, etc.) is handled inconsistently across languages and platforms. Encoders MUST NOT emit it.
9. A convention MAY be scoped to a code or to a category letter: its patterns apply only when that scope is present in the code section, and its value MUST NOT be decoded otherwise. Duration is scoped to `R03`. App designator is scoped to any Private Use code `U[0-9]{2}`. Every other convention in this section is unscoped.

#### Person count

- **Encode:** `([1-9][0-9]*)pax`
- **Decode:** `0*([1-9][0-9]*) ?[Pp][Aa][Xx]`
- **Example:** `MECP/1/S01 4pax`
- **Also decoded:** `4 pax`, `4PAX`, `4Pax.`, `04pax`
- **Meaning:** "URGENT, 4 people need water"
- **Protocol keyword:** `pax` is a protocol keyword, not an English word. It is never translated on the wire and is not affected by the language hint; a localised form (`4人`, `4 Personen`) is ordinary freetext.
- **Additional Validation:** group 1 MUST NOT be the fractional part of a decimal: if the character before group 1 is `.` or `,` and the character before that is a digit, the match fails (`1.5 pax` and `2,5 pax` are not person counts). Group 1 MUST NOT be the minute field of an hour-colon clock when those minutes were not already claimed: if the character before group 1 is `:`, and immediately before that colon is a valid hour (`[01]?[0-9]` or `2[0-3]`) that is not itself the tail of a longer digit run, and group 1 is exactly `[0-5][0-9]`, the match fails (rule 6). The `@` before the hour is optional, so both `@6:30pax` and `14:30 pax` fail. Spaced `@6:30 pax` and `47.3769,8.5417 pax` are also handled by the claim order in rule 5. A separate count still decodes: `MECP/1/S01 @06:30 4 pax` is 4 people at 06:30.

#### GPS coordinates

- **Encode:** `(-?(?:0|[1-9][0-9]{0,2})\.[0-9]{1,6}),(-?(?:0|[1-9][0-9]{0,2})\.[0-9]{1,6})`
- **Decode:** `([+-]?[0-9]+\.[0-9]+), ?([+-]?[0-9]+\.[0-9]+)`
- **Example:** `MECP/0/M04 P05 -41.2865,174.7762`
- **Also decoded:** `+48.8566, 2.3522`, `48.85661234,2.35221234`
- **Meaning:** "MAYDAY, cardiac event at GPS coordinates -41.2865,174.7762"
- **Additional Validation:**
    - -90 ≤ group 1 ≤ 90
    - -180 ≤ group 2 ≤ 180

#### Timestamp

- **Encode:** `@((?:[01][0-9]|2[0-3])[0-5][0-9])`
- **Decode:** `@([01]?[0-9]|2[0-3]):?([0-5][0-9])` (group 1 is the hour, group 2 the minute)
- **Example:** `MECP/2/T01 @0630`
- **Also decoded:** `@630`, `@6:30`, `@06:30`, `@123` (read as 01:23 — three digits are HMM)
- **Time zone:** the sender's local time. The message carries no zone, so a receiver cannot convert it and displays it as sent.
- **Meaning:** "SAFETY, road blocked as of 06:30"

#### Language hint

- **Encode:** `@([a-z]{2,3}(?:-[a-z0-9]{2,8})*)`
- **Decode:** `@([A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*)` (normalise to lowercase and `-`, ASCII only)
- **Resolving:** match the exact tag first, then the primary subtag; `zh-Hans` resolves to `zh-cn`, `zh-Hant` to `zh-tw`. An unknown hint is preserved and displayed but matches no language pack. Encoders SHOULD emit the pack code (`en`, `de`, `zh-cn`), not the raw device locale.
- **Example:** `MECP/3/L04 Gipfel erreicht @de`
- **Also decoded:** `@DE`, `@zh_CN`, `@zh-TW`, `@zh-Hans-CN`, `@sr-Latn-RS`
- **Meaning:** "ROUTINE, summit reached: 'Gipfel erreicht' (German)"

#### Callsign

- **Encode:** `~([A-Z0-9]+(?:/[A-Z0-9]+)*)`
- **Decode:** `~([A-Za-z0-9/]+)` (normalise to uppercase)
- **Example:** `MECP/3/L20 ~VK2/OK1ABC/P`
- **Also decoded:** `~vk2/ok1abc/p`
- **Meaning:** "ROUTINE, node test from VK2/OK1ABC/P"
- **Additional Validation:** group 1 is at most 12 characters, in both directions.
- **Not decoded:** `~W1AW-9`. An AX.25 or APRS SSID is outside the alphabet, and `-` is not a boundary (rule 4), so this is not a callsign and is not read as `~W1AW` either. It MUST be left as freetext, and the message is still valid.

#### Reference

- **Encode:** `#([a-z0-9]+(?:-[a-z0-9]+)*)`
- **Decode:** `#([A-Za-z0-9_-]+)`
- **Identity:** case-insensitive; `_` normalises to `-`; a missing separator is a distinct tag (`#basecamp` is not `#base-camp`). Encoders SHOULD emit lowercase letters, digits and `-` only. Tags are ASCII identifiers: `#避難所`, `#база` and `#café` are not references and MUST be left as freetext.
- **Example:** `MECP/2/C08 #basecamp`
- **Also decoded:** `#base-camp`, `#base_camp`
- **Meaning:** "SAFETY, rendezvous at basecamp"

#### App designator (any U code)

Letter `U` is Private Use (see [§6.5](#65-codes-beacon-and-private-use)). Codes `U01`–`U99` carry no MECP meaning; apps use them locally. When the code section contains one or more `U` codes, the **first freetext token** is the app designator so foreign clients MAY dispatch without understanding the rest of the payload. This convention is **scoped to any `U[0-9]{2}`** (rule 9): without a `U` code, a leading word is ordinary freetext and MUST NOT be decoded as a designator. Codes must stay contiguous (rule 3), so the designator cannot sit between `U` codes. See [ADR 0006](docs/adr/0006-private-use-and-b04.md).

- **Encode:** `([a-z][a-z0-9-]{0,31})` — ASCII lowercase letter, then up to 31 letters, digits or hyphens (encoders MUST emit lowercase).
- **Decode:** `^([a-z][a-z0-9-]{0,31})` — **first freetext token only** (the `^` anchors the start of the freetext; rule 4 supplies the trailing boundary). `MECP/2/U04 rem #site-a` is designator `rem`; `MECP/2/U04 #site-a rem` is not a designator (`#site-a` fails, and a later `rem` MUST NOT be taken).
- **Example:** `MECP/2/U04 rem #site-a`
- **Also decoded:** `MECP/1/M01 U04 rem needs help` (designator `rem`; `M01` remains a shared code)
- **Meaning:** the designator names the app or product that defines the `U` codes and the remainder of the freetext. MECP does not register designator strings.
- **Encoder duty:** an encoder that emits any `U` code SHOULD emit a designator. A `U` message with no freetext is still a valid MECP message but is not dispatchable by designator.
- **Decoder duty:** decoders MAY expose the designator structurally and MAY interpret the remainder of freetext only when they recognise that designator; unknown designators stay opaque. Other conventions (`#`, `~`, `@`, `pax`, …) still apply to the whole freetext.
- **Additional Validation:** the match MUST begin at the first freetext character (index 0). Group 1 MUST match the encode alphabet (already enforced by the pattern). A match that fails MUST be ignored (rule 6); `#tag` or `REM` as the first token is not a designator. The alphabet starts with a letter, so it does not collide with an R03 bare-number duration.

#### Duration (R03 only)

`R03` already means ETA, so a duration is its value. This convention is **scoped to `R03`** (rule 9): if the code section does not contain `R03`, a duration-like token is ordinary freetext and MUST NOT be decoded. Position is otherwise free for unit-bearing forms — `MECP/2/C01 R03 P05 47.3769,12.1048 45min` and `MECP/2/R03 45min` are equally valid. See [#21](https://github.com/mecp-org/MECP/issues/21).

- **Encode** (SI symbols only, no space between number and unit; a bare number is not encodable):
  - `([1-9][0-9]*)min` — minutes (canonical: `45min`)
  - `([1-9][0-9]*)h(?:([0-5]?[0-9])min)?` — hours with optional minutes (`2h`, `1h30min`)
  - `([1-9][0-9]*)d` — days
- **Decode** (a match that fails Additional Validation counts as no match, per rule 6; the first match by position among patterns 1–4 wins, per rule 5, and where two match at the same position the earlier one in this list wins; pattern 5 applies only when none of 1–4 matches):
  1. `(?:[Ee][Tt][Aa] ?)?([0-9]+) ?[Hh] ?([0-9]+) ?[Mm][Ii][Nn]` — hours and minutes (`1h 30min`, `ETA 1h30min`)
  2. `(?:[Ee][Tt][Aa] ?)?([0-9]+) ?[Hh]` — hours only
  3. `(?:[Ee][Tt][Aa] ?)?([0-9]+) ?[Mm][Ii][Nn]` — minutes (`45min`, `ETA 45min`, `ETA45min`)
  4. `(?:[Ee][Tt][Aa] ?)?([0-9]+) ?[Dd]` — days
  5. Bare number (decode-only, **first freetext token only**): `^(?:[Ee][Tt][Aa] ?)?([0-9]+)([.,][0-9]+)?` — group 1 read as minutes. `MECP/2/R03 45` is 45 minutes; `MECP/2/C01 R03 1pax 45` is not (the trailing `45` is not the first freetext token). Person count is earlier in the rule 5 order, so `MECP/2/R03 4 pax` claims the digits as people and the bare number fails as an overlap; a unit-bearing duration elsewhere still decodes (`R03 4 pax 45min` is 4 people and 45 minutes).
- **Example:** `MECP/2/C01 R03 45min @en`
- **Also decoded:** `R03 45`, `R03 ETA 45`, `R03 ETA 45min`, `R03 ETA45min`, `R03 45 min`, `R03 1h30min`, `R03 1h 30min`, `R03 2h`, `R03 2d`
- **Meaning:** "SAFETY, send rescue, ETA 45 minutes, English"
- **Additional Validation:** the duration MUST be greater than zero, so `0min` and a bare `0` are not durations. For pattern 5, group 2 MUST be absent, so the `47` of `R03 47.3769,12.1048` is not a duration; if `.` or `,` after group 1 is taken as a boundary instead, and the next character is a digit, the match also fails (`1.5h` is not 1 minute). For pattern 5, group 1 MUST NOT be followed by `:` whose next two characters are a minute value `[0-5][0-9]` — further characters after those two do not revive the match, so `R03 14:30` and `R03 14:300` both fail (a clock time without `@` stays freetext; encoders still emit `@1430` / `@14:30` for timestamps). Ordinary punctuation after a bare number is fine (`R03 45: on the way`). For patterns 1–4, the number MUST NOT be the fractional part of a decimal: if the character before group 1 is `.` or `,` and the character before that is a digit, the match fails. For every pattern, group 1 MUST NOT be the minute field of an hour-colon clock: if the character before group 1 is `:`, and immediately before that colon is a valid hour (`[01]?[0-9]` or `2[0-3]`) that is not itself the tail of a longer digit run, and group 1 is exactly `[0-5][0-9]`, the match fails. The `@` before the hour is optional, so `@6:30h`, `@14:30min` and `14:30h` are not durations when the timestamp cannot claim because the unit letter is not a boundary. There is no upper bound — `2d`, `48h` and `2880min` are the same duration. `30s` is not a duration: seconds are not a unit of this convention. Localised unit words (`分`, `dakika`, `minutos`) are not part of these patterns — they remain freetext unless a client recognises them as a local alias.

### 6.2 Protocol Vocabulary

The tokens above, the sigils and the unit symbols form a **closed vocabulary**. Adding a token or a unit is a spec change, not a client detail, and requires an ADR.

| Token | Meaning | Source |
|---|---|---|
| `pax` | person count | MECP (recorded decision, #18) |
| `ETA` | decode-only prefix on an `R03` duration | IMO SMCP |
| `min`, `h`, `d` | duration units | SI Brochure / NIST SP 330 |
| `@`, `#`, `~` | sigils | MECP |

Every token in this table is an ASCII token, identical in every language. A localised form (`4人`, `45分`, `45 دقیقه`) is ordinary freetext; a decoder MAY recognise local equivalents as aliases, but those aliases are not part of the protocol and are not enumerated by this standard. See §5.3.

### 6.3 Example Messages

Each example below exercises something the single-convention examples in 6.1 do not.

**Codes only, no freetext:**
```
MECP/1/T05
```
*"URGENT: Landslide."*

**Life-threatening emergency, several conventions together:**
```
MECP/0/M01 M07 P01 2pax 47.3769,12.1048 @0845 ~OE7ABC @de
```
*"MAYDAY: Injury, fracture / immobile, stranded / stuck. 2 people affected. Location: 47.3769,12.1048. Time: 08:45. From OE7ABC. Language: German."*

**Response, in a different convention order:**
```
MECP/1/R02 C08 #hut2 ~OE7XYZ @de
```
*"URGENT: Help coming, rendezvous at hut2. From OE7XYZ. Language: German."*

**Safety coordination (Duration scoped to R03):**
```
MECP/2/C01 R03 45min @en
```
*"SAFETY: Send rescue. ETA 45 minutes, English."* `45min` is the Duration convention (canonical encode). `MECP/3/L06 45min` without `R03` leaves `45min` as ordinary freetext.

**Loosely formatted sender, conventions inside prose:**
```
MECP/2/T05 Rockfall near #base-camp, 3 PAX turned back @6:30.
```
*"SAFETY: Landslide. 'Rockfall near base-camp, 3 people turned back at 06:30.'"* Not a valid encoding, but decoders accept the reference, person count and timestamp despite the hyphen, case, missing leading zero, colon and trailing punctuation.

**Invalid values and first match:**
```
MECP/3/L06 @2460 @1400 @1530
```
*"ROUTINE: Running late. Time: 14:00."* `@2460` is not a timestamp, so the first match is `@1400`; `@1530` is ignored.

**Look-alikes that are not conventions:**
```
MECP/3/L02 L10 Great view 2,5 km past the hut! @en
```
*"ROUTINE: Coffee, beautiful view. 'Great view 2,5 km past the hut!' Language: English."* `2,5` has no decimal point, so it is not GPS.

**Drill message:**
```
MECP/3/D01 M01 M09 5pax This is a training exercise
```
*"ROUTINE: This is a drill. Simulated injury, simulated multiple casualties. 5 people. 'This is a training exercise.'"*

### 6.4 The Encoder and Decoder

Encoder/decoder implementations are listed in the [README](README.md#known-implementations). The **wire format documented in this specification is authoritative**. Anyone may reimplement MECP from this specification alone (CC0).

### 6.5 Codes, Beacon, and Private Use

The shared codebook is [`languages/en.json`](languages/en.json) (120 codes across 12 categories). Each code is a letter (category) plus two digits.

The Beacon category is a PLB-style (Personal Locator Beacon) distress vocabulary for mesh networks. **B01** means an automated distress beacon is active — the sender may be unresponsive; the message typically carries GPS position. **B02** means a beacon has been acknowledged. **B03** means the sender is cancelling their beacon and reports they are OK. Combined with D01 (drill), beacon practice stays clearly marked as non-emergency.

MECP defines these meanings only. Retransmit schedules, slowing after B02, drill auto-stop, how B02/B03 are bound to a specific sender, authenticity, and airtime policy are **non-normative client and transport concerns** — see [ADR 0005](docs/adr/0005-beacon-semantics-vs-client.md).

### Private Use — letter U (not in the 120)

Letter **`U`** is reserved for **Private Use** ([ADR 0006](docs/adr/0006-private-use-and-b04.md)). Codes `U01`–`U99` are well-formed MECP codes (§6.1 rule 5) but carry **no shared MECP semantics**, are **not** in [`languages/en.json`](languages/en.json), and have **no** language-pack strings. Apps MAY use them for local meaning. Unallocated IDs in the twelve shared categories (including `B04`–`B99`) remain available for future shared proposals. When any `U` code is present, the first freetext token is the [app designator](#app-designator-any-u-code) (§6.1).

### 6.6 Canonical Form

The canonical form of an MECP message is the single string that an encoder emits for the message's decoded content. An encoder that claims canonical output MUST emit exactly this string. Vectors are in [`freetext/canonical.json`](freetext/canonical.json).

To produce it, decode the message (§6.1), then emit:

1. `MECP/`, the severity, `/`, then the codes in ascending ASCII order, separated by single spaces. Duplicate codes are kept.
2. Each decoded convention value in the rule 5 decode order, each preceded by a single space, in this form:

   | Convention | Canonical form | Example |
   |---|---|---|
   | App designator | As decoded | `rem` |
   | GPS coordinates | Each coordinate rounded to 6 fractional digits, half away from zero; no `+`, no leading zeros; trailing fractional zeros removed, keeping at least one fractional digit; no `-` on a value that rounds to zero | `48.8566,2.3522` |
   | Timestamp | `@HHMM` | `@0630` |
   | Language hint | Lowercase, `-` between subtags | `@zh-cn` |
   | Callsign | Uppercase | `~DL/OK1ABC` |
   | Reference | Lowercase, `_` replaced by `-` | `#base-camp` |
   | Person count | `Npax`, no leading zeros | `4pax` |
   | Duration | `Nd` for whole days, else `Nh` for whole hours, else `NhMmin` above 60 minutes, else `Nmin`; no leading zeros | `1h30min` |

3. The remaining freetext, if any, preceded by a single space: the freetext with every claimed token removed (boundaries stay, rule 7), each run of tabs, spaces, U+00A0, U+1680, U+2000–U+200A, U+202F, U+205F, U+3000 and U+FEFF replaced by one space, and leading and trailing spaces removed.

For example, `MECP/2/T05 Rockfall near #base-camp, 3 PAX turned back @6:30.` has the canonical form `MECP/2/T05 @0630 #base-camp 3pax Rockfall near , turned back .`

An input that is not an MECP message has no canonical form. The canonical form does not depend on the 200-byte limit; an encoder applies that limit (§6.1) to the canonical string.
