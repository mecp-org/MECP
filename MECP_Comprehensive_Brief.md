# MECP: Mesh Emergency Communication Protocol
## A Comprehensive Briefing Document

**Version:** 1.1
**Date:** February 2026
**Repository:** [github.com/mecp-org/MECP](https://github.com/mecp-org/MECP) (protocol + languages)
**Implementations:** [github.com/mecp-org/mecp-app](https://github.com/mecp-org/mecp-app) (engine, web, Expo app, examples)
**License:** CC0 (protocol) | CC BY 4.0 (translations) | GPLv3 (implementations in mecp-app)
**Status:** Protocol and 20 language packs published; clients in mecp-app

---

## Table of Contents

1. [What This Document Is](#1-what-this-document-is)
2. [The Technology: LoRa and Long-Range Radio](#2-the-technology-lora-and-long-range-radio)
3. [The Ecosystem: Who Built What](#3-the-ecosystem-who-built-what)
4. [The Gap: What's Missing](#4-the-gap-whats-missing)
5. [The Solution: MECP](#5-the-solution-mecp)
6. [How MECP Works](#6-how-mecp-works)
7. [The Full Code Table](#7-the-full-code-table)
8. [The Drill and Leisure Philosophy](#8-the-drill-and-leisure-philosophy)
9. [What We've Built So Far](#9-what-weve-built-so-far)
10. [How the Mesh Community Can Use This](#10-how-the-mesh-community-can-use-this)
11. [What Comes Next](#11-what-comes-next)
12. [Sources and References](#12-sources-and-references)

---

## 1. What This Document Is

This is a zero-assumptions briefing. It assumes the reader has never heard of LoRa, mesh networking, or off-grid communication. It starts from first principles and builds toward a specific problem -- how do you send a rich, life-saving message through a radio channel that only allows roughly 230 bytes of text? -- and the protocol we created to solve it.

By the end of this document, you will understand:

- What LoRa mesh networking is and why it matters
- Who the key people and communities are that built this technology
- What problem remains unsolved across all existing platforms
- How MECP solves it, in detail
- Where the project stands today and how anyone can use it right now

---

## 2. The Technology: LoRa and Long-Range Radio

### What LoRa Is

LoRa stands for **Long Range**. It is a radio modulation technology -- a way of encoding data into radio waves -- that allows small, inexpensive devices to send small amounts of data over very long distances (typically 2-15 km in real-world conditions, sometimes much further with line of sight) while consuming extremely little power.

A LoRa device is roughly the size of a credit card. It costs between $15 and $60. It runs on a small battery for days or weeks. It requires no cell tower, no Wi-Fi, no internet connection, and no subscription. It simply transmits and receives radio signals on unlicensed frequency bands (868 MHz in Europe, 915 MHz in North America) that anyone can use without a licence.

### How LoRa Was Invented

In **2009**, two French engineers -- **Nicolas Sornin** and **Olivier Seller** -- began adapting a technique called Chirp Spread Spectrum (CSS), previously used in sonar and military radar, for civilian data transmission. In **2010**, they partnered with **Francois Sforza** and founded a company called **Cycleo** in Grenoble, France.

In **2012**, the US semiconductor company **Semtech Corporation** acquired Cycleo and commercialised the technology, producing the key radio chips (SX1272, SX1276, SX1301) that power virtually all LoRa devices today.

In **January 2015**, the first LoRaWAN specification was published, and the **LoRa Alliance** -- an open, non-profit industry body -- was formally established to standardise the protocol stack built on top of LoRa radio. As of late 2025, the Alliance has **360 member companies** and reports **125 million LoRaWAN end devices** deployed globally.

### What "Mesh" Means

A mesh network is a network where every device can relay messages for other devices. If device A wants to send a message to device C, but C is out of range, device B (which is in range of both) automatically relays the message. No central infrastructure is required. The more devices that exist in an area, the more resilient and far-reaching the network becomes.

This is fundamentally different from how mobile phones work. A phone connects to a cell tower, which connects to a fibre-optic backbone, which connects to the internet. Remove any part of that chain -- as happens routinely in natural disasters, power outages, or remote wilderness -- and the phone becomes useless.

A mesh network has no single point of failure. If one device goes down, messages route around it. This makes mesh networks exceptionally resilient and valuable precisely when traditional infrastructure fails.

### The Critical Constraint: 230 Bytes

LoRa achieves its extraordinary range by trading bandwidth. A LoRa radio transmits data very slowly -- often just a few hundred bits per second. The maximum packet size is **256 bytes**, and after protocol headers and encryption overhead, the usable payload for a text message is approximately **230 bytes**.

To put that in perspective: this paragraph alone is over 230 bytes. A single tweet (280 characters) would not fit. A GPS coordinate pair (e.g., `48.8566,2.3522`) consumes about 15 bytes. A timestamp takes 6 bytes. Every byte matters.

This constraint is not a bug -- it is the physics of long-range, low-power radio. It is the fundamental design parameter that everything in this document revolves around.

---

## 3. The Ecosystem: Who Built What

Several independent projects and companies have built communication systems on top of LoRa and similar radio technologies. Understanding each one -- who created it, what it does, and where it falls short -- is essential context for understanding why MECP exists.

### 3.1 Meshtastic

**Creator:** [Kevin Hester](https://github.com/geeksville) (GitHub: geeksville), an engineer and entrepreneur in the US.
**Founded:** 2019, as a personal project for off-grid communication during hiking and skiing.
**Website:** [meshtastic.org](https://meshtastic.org/)
**GitHub:** [github.com/meshtastic](https://github.com/meshtastic) (~7,000 stars on the firmware repo, 262+ contributors)

**What it is:** Meshtastic is open-source firmware that turns cheap LoRa radio modules into an encrypted, decentralised mesh communication network. You buy an off-the-shelf LoRa board (from manufacturers like LILYGO, Heltec, RAK Wireless, or Seeed Studio -- typically $20-60), flash Meshtastic firmware onto it, and pair it with your phone via Bluetooth. You can then send text messages, share GPS positions, and exchange telemetry data with anyone else running Meshtastic within mesh range -- no internet, no cell service, no subscription.

**How it works technically:**

- **Managed flooding:** When a node receives a message, it rebroadcasts it to extend range. Before rebroadcasting, it listens briefly to check if another node already relayed the same packet, avoiding redundant transmissions.
- **SNR-based priority:** Nodes that received the original signal weakly (low signal-to-noise ratio, meaning they're farther from the sender) get priority to rebroadcast, since their retransmission is most likely to extend geographic coverage.
- **Encryption:** All LoRa payloads are encrypted with AES256-CTR. Each channel has its own encryption key. Packet headers remain unencrypted so that nodes can relay messages they cannot themselves decrypt.
- **Maximum text payload:** 233 bytes (the remaining 23 bytes of the 256-byte LoRa packet are consumed by Meshtastic protocol headers).

**Community size (as of 2025-2026):**

- Reddit r/meshtastic: ~84,000 members
- Discord: ~46,500 members
- Active devices tracked on global node maps: ~40,000+

**Hardware it runs on:** ESP32, nRF52840, and RP2040-based boards. Specific devices include the LILYGO T-Beam, T-Echo, T-Deck, and T-Lora Pager; Heltec LoRa 32 V3, Vision Master, and MeshPocket; RAK Wireless WisBlock; Seeed SenseCAP; and many others. Prices range from $15 for a bare module to $60 for a complete device with GPS, screen, and case.

**What it does well:** Meshtastic has the largest community, the widest hardware support, and the most mature firmware of any open-source LoRa mesh project. It makes off-grid communication genuinely accessible to hobbyists and communities worldwide.

**What it does not do:** Meshtastic has no structured message format for emergencies. Messages are free-form text. There are no standardised severity levels, no incident codes, no structured fields for casualties or coordinates. If you need to communicate "three people injured, one unconscious, flooding, need helicopter evacuation, we are at these coordinates" -- you type it out in plain text and hope it fits in 233 bytes and that the recipient speaks your language.

### 3.2 goTenna

**Founders:** Siblings **[Daniela Perdomo](https://www.linkedin.com/in/danielaperdomo/)** (CEO) and **[Jorge Perdomo](https://www.jorgeperdomo.com/)** (lead hardware designer), based in New York City.
**Founded:** 2012-2014. Daniela conceived the idea after watching New York City residents lose mobile connectivity during **Hurricane Sandy** in 2012. The first goTenna device shipped in summer 2014.
**Website:** [gotennapro.com](https://gotennapro.com/)

**Products:**

- **goTenna v1** (2014): Point-to-point off-grid messaging antenna, paired with a smartphone via Bluetooth.
- **goTenna Mesh** (2016): The first commercially viable consumer mesh networking device. Enabled multi-hop relay between devices.
- **goTenna Pro / Pro X / Pro X2** (2018+): Military and public-safety grade. MIL-STD-810 compliant, 5W RF power, tunable VHF/UHF, AES-256 encryption, integration with military situational awareness tools like ATAK (Android Tactical Assault Kit). Range tested to 126 miles point-to-point with aerial relay.

**Market position:** goTenna serves over 300 military, law enforcement, and public safety agencies globally. Notable contracts include a $15M Air Force STRATFI contract and a $99M IDIQ with US Customs and Border Protection.

**Current state:** In **October 2025**, **Forterra** (an autonomous mission systems company) acquired goTenna. The consumer mesh product line is now a small part of a larger defence-focused business. The consumer goTenna Mesh is no longer actively marketed.

**Relevance to MECP:** goTenna demonstrated real-world demand for off-grid mesh communication, particularly in disaster response and military contexts. However, its protocol is entirely proprietary and closed-source. goTenna devices cannot communicate with Meshtastic, Reticulum, or any other mesh platform. There is no open emergency messaging standard.

### 3.3 Reticulum / Sideband / NomadNet

**Creator:** [Mark Qvist](https://github.com/markqvist), an independent developer and hardware designer who also created the RNode open-source LoRa radio transceiver.
**Founded:** Protocol placed in the public domain in 2016.
**GitHub:** [github.com/markqvist/Reticulum](https://github.com/markqvist/Reticulum) (~4,700 stars)

**What it is:** Reticulum is a cryptography-first networking stack for building "unstoppable networks." Unlike Meshtastic, which is specifically a LoRa mesh protocol, Reticulum is **transport-agnostic** -- it works over LoRa, packet radio, serial connections, WiFi, Ethernet, free-space optical links, I2P (an anonymity network), and essentially any medium that can carry data.

**Key components:**

- **Reticulum:** The core networking stack. All addressing is cryptographic (no cleartext node IDs). End-to-end encryption with forward secrecy is mandatory and built into the protocol itself, not bolted on.
- **LXMF (Lightweight Extensible Message Format):** A delay-tolerant, disruption-tolerant message transfer protocol built on Reticulum. Think of it as email that works over any transport, with zero configuration required. (~507 GitHub stars)
- **Sideband:** A graphical messaging client (Android, Linux, macOS, Windows) for LXMF. Supports text, file transfers, images, voice messages, real-time voice calls, telemetry, and mapping.
- **NomadNet:** A terminal-based messenger and content distribution platform on Reticulum. (~764 GitHub stars)

**How it differs from Meshtastic:**

| Aspect | Meshtastic | Reticulum |
|--------|-----------|-----------|
| Transport | LoRa only | Any medium (LoRa, WiFi, serial, etc.) |
| Routing | Managed flooding | Direct links + propagation nodes |
| Encryption | AES256-CTR per channel | Per-identity E2E with forward secrecy |
| Addressing | Node IDs (cleartext headers) | Fully cryptographic (no cleartext IDs) |
| Complexity | Low barrier to entry | Higher technical sophistication required |
| Community | Large (84K+ Reddit) | Smaller, technically focused |
| Emergency features | None structured | None structured |

**Relevance to MECP:** Reticulum represents the most technically sophisticated approach to off-grid networking, but like Meshtastic, it has no standardised emergency message format. Messages are free-form. The same gap exists.

### 3.4 APRS (Automatic Packet Reporting System)

**Creator:** **Bob Bruninga, WB4APR** (1948-2022), a senior research engineer at the United States Naval Academy. He passed away on February 7, 2022, from cancer.
**Founded:** Developed from 1982 onward; renamed to APRS in 1992.
**Website:** [aprs.org](https://www.aprs.org/)

**What it is:** APRS is a tactical real-time digital communications protocol for amateur (ham) radio. It enables position reporting, weather station data, short messaging, telemetry, and object tracking over VHF packet radio (typically 144.390 MHz in North America). It uses the AX.25 protocol at the link layer and operates at approximately 1200 baud.

**Why it matters:** APRS is the closest historical predecessor to modern LoRa mesh messaging. It demonstrated, decades before Meshtastic existed, that short structured messages over radio could provide genuine situational awareness. Many LoRa mesh projects explicitly cite APRS as inspiration.

**Key limitation:** APRS requires a ham radio licence. LoRa operates on unlicensed ISM bands that anyone can use. This single difference -- no licence required -- is why LoRa mesh has achieved mass adoption where APRS remained niche.

**Legacy:** After Bruninga's death, the **APRS Foundation Inc.** was formed in March 2022 as a 501(c)(3) public charity to preserve and advance the protocol.

### 3.5 Other Notable Projects

**disaster.radio** — A solar-powered, long-range mesh network built by the **sudomesh** community (Oakland, CA). Uses ESP32 boards with LoRa radios. Users connect via local Wi-Fi hotspot to a browser-based chat. The project is currently **paused and seeking a new maintainer**. ([GitHub](https://github.com/sudomesh/disaster-radio))

**Project OWL / ClusterDuck Protocol** — Won the inaugural IBM Call for Code Global Challenge in 2018 (100,000+ participants from 156 nations). Uses LoRa "DuckLink" nodes that form an ad-hoc mesh, relaying data to a gateway connected to cloud analytics. Deployed 63 nodes across Puerto Rico in 2019 for earthquake and flood response. Now hosted by the Linux Foundation. ([project-owl.com](https://www.project-owl.com/))

**QMesh** — An experimental voice-over-LoRa mesh network by GitHub user [faydr](https://github.com/faydr/QMesh), using Codec2 voice encoding and synchronized flooding. Targets amateur radio emergency communication (EMCOMM). Still in early development.

**Ripple / R2** — A LoRa mesh for SMS-like encrypted messaging by [spleenware](https://github.com/spleenware/ripple), using ESP32 boards with OLED displays and BlackBerry keyboards. The successor R2 system features a redesigned routing engine.

### 3.6 Summary: The Landscape

| Project | Type | Founded | Open Source | Licence Required | Emergency Protocol |
|---------|------|---------|------------|-----------------|-------------------|
| Meshtastic | LoRa mesh firmware | 2019 | Yes | No | **None** |
| goTenna | Commercial mesh device | 2014 | No | No | Proprietary |
| Reticulum | Transport-agnostic stack | 2016 | Yes | No | **None** |
| APRS | VHF packet radio | 1992 | Yes | **Yes (ham)** | Partial (position only) |
| disaster.radio | LoRa mesh (paused) | ~2018 | Yes | No | **None** |
| Project OWL | LoRa + cloud mesh | 2018 | Yes | No | **None** |

The hardware exists. The networking exists. The communities exist. What does not exist is a shared, structured, compact, multilingual emergency message format.

---

## 4. The Gap: What's Missing

### 4.1 The Problem Statement

Every mesh networking platform described above handles the transport layer -- getting bytes from point A to point B. None of them define what those bytes should contain when someone's life is at stake.

When you send a message on Meshtastic today, you type free-form text: *"Help, my friend fell, broken leg, we're near the summit."* This presents several critical problems:

**Problem 1: Byte budget.** That sentence is 56 bytes. Add a GPS coordinate (15 bytes), a timestamp (6 bytes), and a language hint (4 bytes) and you've used 81 bytes -- over a third of your budget -- for a message that conveys very little structured information. What's the severity? How many people are affected? Is the person conscious? Is evacuation needed? Each additional detail costs precious bytes.

**Problem 2: Language barriers.** LoRa mesh networks are increasingly deployed across Europe, where a hiking group in the Alps might include speakers of German, Italian, French, and Slovenian. In a disaster scenario, a Turkish-speaking family might need to communicate with a Slovak rescue team. Free-form text in any single language is useless to anyone who doesn't speak that language. Machine translation requires internet access -- which is precisely the thing that is unavailable in off-grid scenarios.

**Problem 3: No structure for triage.** Emergency responders need to rapidly assess and prioritise. A wall of free-text messages provides no machine-readable severity level, no structured casualty count, no standardised incident type codes. Every message must be read, interpreted, and mentally categorised by a human -- a process that does not scale when dozens of messages arrive simultaneously during a disaster.

**Problem 4: No interoperability.** There is no cross-platform emergency message standard for the off-grid mesh space. Meshtastic nodes cannot talk to Reticulum nodes. goTenna is entirely proprietary. Even within a single platform, there is no agreed-upon way to structure an emergency message.

### 4.2 What Existing Standards Cannot Do

There are established emergency messaging standards in the traditional telecommunications world:

- **CAP (Common Alerting Protocol):** An OASIS XML standard for emergency alerts. A minimal CAP message is several kilobytes -- roughly 10-50x larger than an entire LoRa packet.
- **EDXL (Emergency Data Exchange Language):** An OASIS suite for emergency data exchange. Also XML-based, designed for high-bandwidth IP networks.

Both are designed for systems with essentially unlimited bandwidth. They are architecturally incompatible with a 230-byte radio packet. You cannot shrink XML into a LoRa message. You need something designed from the ground up for extreme byte constraints.

---

## 5. The Solution: MECP

### 5.1 What MECP Is

**MECP (Mesh Emergency Communication Protocol)** is a structured text-encoding protocol designed specifically for LoRa mesh networks. It defines a compact, human-readable, machine-parseable message format that can express rich emergency information within a strict **200-byte limit**.

The format is:

```
MECP/<severity>/<codes> [freetext]
```

For example:

```
MECP/0/M01 M07 T04 3pax 48.8566,2.3522 @1430 @en
```

This 53-byte message communicates:

- **MECP/0/** — This is a MAYDAY (life-threatening) severity message
- **M01** — Injury reported
- **M07** — Fracture, person immobile
- **T04** — Flooding in the area
- **3pax** — 3 people affected
- **48.8566,2.3522** — GPS coordinates (Paris, in this example)
- **@1430** — Timestamp: 14:30
- **@en** — Language: English

A recipient -- or their device -- can decode every field immediately, regardless of what language they speak, because the codes are universal. The recipient's device looks up M01 in their own language file and displays the localised meaning.

### 5.2 Design Principles

**Compact by design.** MECP enforces a 200-byte maximum (leaving 30+ bytes of headroom below LoRa's ~233-byte payload limit for Meshtastic protocol overhead, encryption, and future metadata). Every element of the format is designed to minimise byte usage while maximising information density.

**Human-readable and machine-parseable.** An MECP message can be read and roughly understood by a person looking at raw text on a screen, and it can be fully decoded by software into structured data with severity levels, incident types, GPS coordinates, timestamps, and affected person counts.

**Language-independent codes.** The code table (M01, T04, C01, etc.) is universal. Each code maps to a localised description in 20 languages. The protocol itself is language-neutral -- the same message means the same thing whether decoded in Japanese, Farsi, or Norwegian.

**Graduated severity.** Four severity levels (0-3) provide immediate triage capability. A device can colour-code, sort, or alert differently based on severity before a human even reads the message content.

**Free-text fallback.** After the structured codes, any remaining byte budget can be used for free-form text. The protocol does not force users into codes-only communication -- it structures the critical information and leaves room for human context.

**Protocol is public domain.** The MECP protocol specification, message format, and code table are released under **CC0 (Creative Commons Zero)** -- public domain. Anyone can implement MECP in any software or firmware, on any platform, without restriction, permission, or licence fees. This is a deliberate choice to maximise adoption. The goal is not to own the protocol but to establish a shared standard.

---

## 6. How MECP Works
Patterns use regular expression syntax from the [Google RE2 engine](https://github.com/google/re2) (no lookaround or backreferences).
This deliberately limited regular expression syntax is compatible across many languages and libraries.

### 6.1 Message Format

Every MECP message follows this structure:

```
MECP/<severity>/<code1> <code2> ... [optional freetext]
```

A message matches this pattern:

```
^MECP/([0-3])/([A-Z][0-9]{2}(?: [A-Z][0-9]{2})*)(?: ([\s\S]*))?$
```
1. Severity
2. Codes
3. Optional Freetext

#### `MECP/`
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
3. Note that any non-code text ends the code section. All remaining text is freetext.

#### Optional Freetext
1. May include structured conventions.
2. Each convention has an **encoding** pattern and a **decoding** pattern. Encoders MUST emit text that matches the encoding pattern. Decoders SHOULD accept anything that matches the decoding pattern. Every encoded value also matches its decoding pattern.
3. Encoding patterns can be assumed to be prefixed with `(?:^| )` and suffixed with `(?: |$)`: conventions are separated by a single ASCII space.
4. Decoding patterns can be assumed to be prefixed with `(?:^|[\t\n\f\r ])` and suffixed with `(?:[\t\n\f\r ,.;:]|$)`.
5. Decoders search the freetext for each decoding pattern, and only its first match by position is used. `^` and `$` refer to the start and end of the freetext.
6. Decoding patterns spell out case-insensitivity with character classes such as `[Pp][Aa][Xx]`, since an inline `(?i)` flag is not portable.
7. Note that Unicode whitespace (NBSP, U+2000–U+200A, U+3000, U+FEFF, etc.) is handled inconsistently by different languages and systems, and should therefore be avoided.
8. Successful matches should be substituted in place when rendering free text.

#### Person count

- **Encode:** `([1-9][0-9]*)pax`
- **Decode:** `([0-9]+) ?[Pp][Aa][Xx]`
- **Example:** `MECP/1/S01 4pax`
- **Also decoded:** `4 pax`, `4PAX`, `4Pax.`
- **Meaning:** "URGENT, 4 people need water"

#### GPS coordinates

- **Encode:** `(-?(?:0|[1-9][0-9]{0,2})\.[0-9]{1,6}),(-?(?:0|[1-9][0-9]{0,2})\.[0-9]{1,6})`
- **Decode:** `([+-]?[0-9]+\.[0-9]+), ?([+-]?[0-9]+\.[0-9]+)`
- **Example:** `MECP/0/M04 P05 -41.2865,174.7762`
- **Also decoded:** `+48.8566, 2.3522`, `48.85661234,2.35221234`
- **Meaning:** "MAYDAY, cardiac emergency at GPS coordinates -41.2865,174.7762"
- **Additional Validation:**
    - -90 ≤ group 1 ≤ 90
    - -180 ≤ group 2 ≤ 180
    - Decode accepts `0,0`, but encode does not.

#### Timestamp

- **Encode:** `@((?:[01][0-9]|2[0-3])[0-5][0-9])`
- **Decode:** `@([01]?[0-9]|2[0-3]):?([0-5][0-9])` (group 1 is the hour, group 2 the minute)
- **Example:** `MECP/2/T01 @0630`
- **Also decoded:** `@630`, `@6:30`, `@06:30`
- **Meaning:** "SAFETY, road / trail blocked as of 06:30"

#### Language hint

- **Encode:** `@([a-z]{2,3}(?:-[a-z]{2})?)`
- **Decode:** `@([A-Za-z]{2,3}(?:[-_][A-Za-z]{2})?)` (normalise to lowercase and `-`)
- **Example:** `MECP/3/L04 Gipfel erreicht @de`
- **Also decoded:** `@DE`, `@zh_CN`, `@zh-TW`
- **Meaning:** "ROUTINE, summit reached: 'Gipfel erreicht' (German)"

#### Callsign

- **Encode:** `~([A-Z0-9]+(?:/[A-Z0-9]+)*)`
- **Decode:** `~([A-Za-z0-9/]+)` (normalise to uppercase)
- **Example:** `MECP/3/L20 ~VK2/OK1ABC/P`
- **Also decoded:** `~vk2/ok1abc/p`
- **Meaning:** "ROUTINE, node test from VK2/OK1ABC/P"
- **Additional Validation:** when encoding, group 1 is at most 12 characters.

#### Reference

- **Encode:** `#([A-Za-z0-9]+)`
- **Decode:** `#([A-Za-z0-9_-]+)`
- **Example:** `MECP/2/C08 #basecamp`
- **Also decoded:** `#base-camp`, `#base_camp`
- **Meaning:** "SAFETY, rendezvous at basecamp"

#### ETA

- **Encode:** `ETA ([1-9][0-9]*)min`
- **Decode:** `[Ee][Tt][Aa] ?([0-9]+)(?: ?[Mm][Ii][Nn](?:[Ss]|[Uu][Tt][Ee][Ss])?)?` (group 1 is the amount in minutes)
- **Example:** `MECP/1/R02 ETA 20min`
- **Also decoded:** `ETA 20`, `eta 20 min`, `ETA20`, `ETA 20 minutes`, `ETA 20 mins`
- **Meaning:** "URGENT, help is coming, arriving in 20 minutes"

### 6.2 Example Messages

Each example below exercises something the single-convention examples in 6.1 do not.

**Codes only, no freetext:**
```
MECP/1/T05
```
*"URGENT: Landslide / rockfall."*

**Life-threatening emergency, several conventions together:**
```
MECP/0/M01 M07 P01 2pax 47.3769,12.1048 @0845 ~OE7ABC @de
```
*"MAYDAY: Injury reported, fracture/immobile person, group is stranded. 2 people affected. Location: 47.3769,12.1048. Time: 08:45. From OE7ABC. Language: German."*

**Response, in a different convention order:**
```
MECP/1/R02 C08 ETA 40min #hut2 ~OE7XYZ @de
```
*"URGENT: Help is coming, rendezvous at hut2. ETA 40 minutes. From OE7XYZ. Language: German."*

**Loosely formatted sender, conventions inside prose:**
```
MECP/2/T05 Rockfall near #base-camp, 3 PAX turned back @6:30.
```
*"SAFETY: Landslide / rockfall. 'Rockfall near base-camp, 3 people turned back at 06:30.'"* Not a valid encoding, but decoders accept the reference, person count and timestamp despite the hyphen, case, missing leading zero, colon and trailing punctuation.

**Invalid values and first match:**
```
MECP/3/L06 @2460 @1400 @1530
```
*"ROUTINE: Running late. Time: 14:00."* `@2460` is not a timestamp, so the first match is `@1400`; `@1530` is ignored.

**Look-alikes that are not conventions:**
```
MECP/3/L02 L10 Great view 2,5 km past the hut! @en
```
*"ROUTINE: Coffee available, beautiful view. 'Great view 2,5 km past the hut!' Language: English."* `2,5` has no decimal point, so it is not GPS.

**Drill message:**
```
MECP/3/D01 M01 M09 5pax This is a training exercise
```
*"ROUTINE: This is a drill. Simulated injury, simulated multiple casualties. 5 people. 'This is a training exercise.'"*

### 6.3 The Encoder and Decoder

Reference encoder/decoder implementations (TypeScript `@mecp/engine`, Python, Arduino, shell) live in [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app). They provide `encode` / `decode` helpers, drill and beacon detection, and the 200-byte limit — but the **wire format documented in this brief is authoritative**. Anyone may reimplement MECP from this specification alone (CC0).

---

## 7. The Full Code Table

MECP defines **109 codes** across **12 categories**. Each code is a single letter (category) plus two digits.

### M — Medical (15 codes)
| Code | Meaning |
|------|---------|
| M01 | Injury (general) |
| M02 | Person unconscious |
| M03 | Breathing difficulty |
| M04 | Cardiac emergency |
| M05 | Hypothermia / exposure |
| M06 | Severe bleeding |
| M07 | Fracture / immobile |
| M08 | Burns |
| M09 | Multiple casualties |
| M10 | Deceased |
| M11 | Animal bite / sting |
| M12 | Allergic reaction |
| M13 | Poisoning / ingestion |
| M14 | Person(s) located alive |
| M15 | Area searched — no find |

### T — Terrain / Infrastructure (17 codes)
| Code | Meaning |
|------|---------|
| T01 | Road / trail blocked |
| T02 | Bridge out / impassable |
| T03 | Building / structure collapsed |
| T04 | Flooding |
| T05 | Landslide / rockfall |
| T06 | Power outage |
| T07 | Fire (structure or wildfire) |
| T08 | Avalanche |
| T09 | Path impassable (general) |
| T10 | Shelter available |
| T11 | Drowning risk / water rescue |
| T12 | Water contamination |
| T13 | Earthquake damage |
| T14 | Gas leak |
| T15 | Chemical spill / hazmat |
| T16 | Vehicle accident |
| T17 | Vehicle fire |

### W — Weather / Environment (6 codes)
| Code | Meaning |
|------|---------|
| W01 | Storm / severe weather |
| W02 | Visibility zero / whiteout |
| W03 | Extreme cold |
| W04 | Extreme heat |
| W05 | Air quality danger |
| W06 | Tsunami warning |

### S — Supplies (6 codes)
| Code | Meaning |
|------|---------|
| S01 | Need water |
| S02 | Need food |
| S03 | Need medication |
| S04 | Need battery / power |
| S05 | Need fuel |
| S06 | Need tools / equipment |

### P — Position / Movement (7 codes)
| Code | Meaning |
|------|---------|
| P01 | Stranded / cannot move |
| P02 | Evacuating |
| P03 | Sheltering in place |
| P04 | En route to location |
| P05 | At GPS coordinates |
| P06 | Lost / disoriented |
| P07 | Group separated |

### C — Coordination (8 codes)
| Code | Meaning |
|------|---------|
| C01 | Send rescue / assistance |
| C02 | Need transport / vehicle |
| C03 | Relay this message |
| C04 | Confirm received |
| C05 | How many people? |
| C06 | What is your status? |
| C07 | Can you reach location? |
| C08 | Rendezvous at location |

### R — Response (7 codes)
| Code | Meaning |
|------|---------|
| R01 | Acknowledged |
| R02 | Help is coming |
| R03 | ETA (estimated time of arrival) |
| R04 | Cannot assist |
| R05 | Redirecting to other resource |
| R06 | Stand by |
| R07 | Situation resolved |

### D — Drill / Test (4 codes)
| Code | Meaning |
|------|---------|
| D01 | This is a drill |
| D02 | This is a test |
| D03 | End of drill / exercise |
| D04 | Ignore previous — sent in error |

### L — Life / Leisure (20 codes)
| Code | Meaning |
|------|---------|
| L01 | Beer / drinks available |
| L02 | Coffee available |
| L03 | Food ready / meal time |
| L04 | Summit reached |
| L05 | Camp set up |
| L06 | Running late |
| L07 | Good signal here |
| L08 | Photo opportunity |
| L09 | Wildlife spotted |
| L10 | Beautiful view |
| L11 | Trail conditions good |
| L12 | Trail conditions bad |
| L13 | Need a break |
| L14 | Heading home |
| L15 | Good morning |
| L16 | Good night |
| L17 | Thank you |
| L18 | Having fun |
| L19 | Festival / event |
| L20 | Node test |

### X — Threat / Security (7 codes)
| Code | Meaning |
|------|---------|
| X01 | Dangerous person nearby |
| X02 | Area unsafe |
| X03 | Gunfire heard |
| X04 | Civil unrest |
| X05 | Theft / robbery |
| X06 | Authorities present |
| X07 | Checkpoint |

### H — Have / Offer Resources (8 codes)
| Code | Meaning |
|------|---------|
| H01 | Have water |
| H02 | Have food |
| H03 | Have medical supplies |
| H04 | Have power / charging |
| H05 | Have fuel |
| H06 | Have tools |
| H07 | Have shelter for [N] pax |
| H08 | Have transport |

### B — Beacon (3 codes)
| Code | Meaning |
|------|---------|
| B01 | Automated distress beacon active — sender may be unresponsive |
| B02 | Beacon acknowledged — reduce transmission rate |
| B03 | Cancel beacon — I am OK |

The Beacon category provides a PLB-style (Personal Locator Beacon) distress mechanism for mesh networks. When activated, B01 automatically retransmits the sender's GPS position at decaying intervals (every 5 minutes initially, slowing to 15 minutes after 6 hours, and 30 minutes after 24 hours). This ensures that even if the sender becomes unconscious, their position continues broadcasting. B02 allows responders to acknowledge the beacon (which reduces the sender's transmission rate to conserve battery), and B03 lets the sender cancel when they are safe. Combined with D01 (drill), beacon can be practised safely with automatic shutdown after 3 transmissions.

---

## 8. The Drill and Leisure Philosophy

A deliberate and non-obvious design decision in MECP is the inclusion of "mundane" codes: **Drill (D)** and **Life/Leisure (L)** categories.

### Why Drill Codes Exist

Emergency communication systems fail when people encounter them for the first time during an actual emergency. If the first time you ever compose an MECP message is when someone is bleeding on a mountainside, you will fumble. Drill codes (D01-D04) allow communities to run regular practice exercises:

```
MECP/3/D01 M01 M07 C01 2pax Training scenario @en
```

This message is clearly flagged as a drill (D01 sets a machine-readable `isDrill` flag in the decoder), so it won't trigger real emergency responses, but it lets participants practice the exact same compose flow they would use in a real emergency.

Note: D04 ("Ignore previous -- sent in error") does **not** set the drill flag. It is a retraction code, not a drill indicator.

### Why Leisure Codes Exist

The most effective emergency tools are the ones people already use daily. If MECP were only for emergencies, people would install the app, forget how to use it, and be lost when they actually need it.

The Leisure category gives people a reason to send MECP messages regularly:

```
MECP/3/L02 L10 Ridge above camp @en
```

*"Coffee available, beautiful view. Ridge above camp."*

```
MECP/3/L01 L04 Summit! Beer tonight @en
```

*"Beer available, summit reached. Beer tonight!"*

These messages use the exact same format, the same compose flow, and the same encoding as an emergency message. Every social message sent is muscle memory built. When the emergency comes, the user already knows exactly how to compose a severity-0 MAYDAY with the right codes -- because they've been sending severity-3 coffee updates all week.

This is not frivolity. It is deliberate UX strategy borrowed from emergency services training doctrine: **train as you fight**.

---

## 9. What We've Built So Far

### 9.1 Language Files (20 Languages)

**Location:** `languages/` directory (this repository)
**Licence:** CC BY 4.0

Every MECP code, severity level, category name, and UI string has been translated into 20 languages:

| Language | Code | Script | Direction |
|----------|------|--------|-----------|
| English | en | Latin | LTR |
| Slovak | sk | Latin | LTR |
| German | de | Latin | LTR |
| Dutch | nl | Latin | LTR |
| French | fr | Latin | LTR |
| Spanish | es | Latin | LTR |
| Polish | pl | Latin | LTR |
| Italian | it | Latin | LTR |
| Portuguese | pt | Latin | LTR |
| Czech | cs | Latin | LTR |
| Norwegian | no | Latin | LTR |
| Swedish | sv | Latin | LTR |
| Turkish | tr | Latin | LTR |
| Serbian | sr | Cyrillic | LTR |
| Ukrainian | uk | Cyrillic | LTR |
| Russian | ru | Cyrillic | LTR |
| Japanese | ja | CJK | LTR |
| Simplified Chinese | zh-cn | CJK | LTR |
| Traditional Chinese | zh-tw | CJK | LTR |
| Farsi (Persian) | fa | Arabic | **RTL** |

Each language file is a JSON document containing: localised severity labels, all 12 category names, all 109 code descriptions, and 40+ UI strings for the application interface (including 14 beacon-specific UI keys).

### 9.2 Implementations ([mecp-org/mecp-app](https://github.com/mecp-org/mecp-app))

All client code lives in a separate repository:

- **TypeScript engine** (`@mecp/engine`) — encode/decode, beacon helpers, tests
- **Web tool (PWA)** — offline compose/decode HTML tool
- **Expo / React Native app** — Meshtastic AIDL client (compose, inbox, beacon)
- **Examples** — Python, Arduino/ESP32, shell
- **Design plan** — product/UX design notes

That repo submodules this protocol repository for language packs (`vendor/mecp`).

### 9.3 Project Infrastructure (this repository)

- **Languages:** `languages/*.json` with CI via `scripts/validate-languages.mjs`
- **GitHub repository:** [github.com/mecp-org/MECP](https://github.com/mecp-org/MECP) — public, open-source
- **Issue templates:** Bug reports, new code proposals, translation reviews
- **Contributing guide:** Translation and code-proposal process
- **Code of Conduct:** Contributor Covenant
- **Changelog:** Maintained

---

## 10. How the Mesh Community Can Use This

### For Meshtastic Users

**Right now, today:**

1. Open the web tool from [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app) (`web/index.html`) in your phone's browser.
2. Compose an MECP message using the visual interface.
3. Copy the resulting message string to your clipboard.
4. Paste it into the Meshtastic app as a text message and send.
5. Any recipient can paste the received message back into the MECP web tool to decode it in their own language.

This workflow requires no new hardware, no firmware changes, and no special configuration. MECP messages are plain text -- they work on any Meshtastic channel, with any firmware version, on any hardware. The encoding is the protocol.

**When the mobile app is ready:**

The React Native app will integrate directly with the Meshtastic Android app via AIDL, providing a seamless compose → send → receive → decode experience without clipboard workarounds.

### For Firmware Developers

Reference implementations are in [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app). You can:

- Import `@mecp/engine` from that repository into any JavaScript/TypeScript project
- Use the Python / Arduino / shell examples there
- Implement your own encoder/decoder in any language using this protocol brief (CC0, public domain -- no permission needed)

The protocol is intentionally simple to implement. The decoder is roughly 80 lines of code. The encoder is similarly compact. Any developer who can parse a comma-separated string can implement MECP.

### For Translation Contributors

The language files are CC BY 4.0 licensed. To add a new language:

1. Copy `languages/_template.json`
2. Translate all 109 code descriptions, 4 severity labels, 12 category names, and UI strings
3. Submit a pull request

The project has GitHub issue templates specifically for translation reviews.

### For Emergency Response Organisations

MECP can be adopted as a messaging standard for any organisation that uses or plans to use LoRa mesh networks for field communications. The protocol is public domain -- you can implement it in your own tools, train your teams on the code table, and print reference cards without any licensing constraints.

The 109-code table covers the scenarios most commonly encountered in disaster response, search and rescue, wilderness safety, and community emergency communication. The four severity levels align with existing emergency triage conventions.

---

## 11. What Comes Next

The project roadmap includes:

- **Mobile app completion:** Finalising the Meshtastic Bluetooth integration, iOS support, and app store distribution
- **Formal protocol specification:** Publishing `spec/mecp-protocol-v1.0.md` as a standalone, implementer-ready document
- **Community feedback:** The code table (109 codes, 12 categories) is open for community review and proposals via GitHub issues
- **Additional language support:** The template system makes adding new languages straightforward -- community contributions welcome
- **Cross-platform adoption:** Encouraging other mesh networking platforms (Reticulum/Sideband, etc.) to support MECP message encoding/decoding

---

## 12. Sources and References

### LoRa Technology
- Semtech Blog: [A Brief History of LoRa: Three Inventors Share Their Story](https://blog.semtech.com/a-brief-history-of-lora-three-inventors-share-their-personal-story-at-the-things-conference)
- Wikipedia: [LoRa](https://en.wikipedia.org/wiki/LoRa)
- LoRa Alliance: [125 Million LoRaWAN End Devices Deployed Globally (Dec 2025)](https://www.globenewswire.com/news-release/2025/12/10/3202982/0/en/LoRa-Alliance-Reports-125-Million-LoRaWAN-End-Devices-Deployed-Globally.html)
- Semtech: [LoRa Packet Size Considerations](https://lora-developers.semtech.com/documentation/tech-papers-and-guides/the-book/packet-size-considerations/)

### Meshtastic
- Official site: [meshtastic.org](https://meshtastic.org/)
- Kevin Hester (geeksville): [GitHub profile](https://github.com/geeksville)
- Hackster.io: [Meshtastic — A Hiking/Skiing GPS Mesh Communicator](https://www.hackster.io/punkgeek/meshtastic-a-hiking-skiing-gps-mesh-communicator-84f999)
- Encryption: [Meshtastic Encryption Docs](https://meshtastic.org/docs/overview/encryption/)
- Mesh Algorithm: [Meshtastic Mesh Algorithm Docs](https://meshtastic.org/docs/overview/mesh-algo/)
- Hardware: [Meshtastic Supported Devices](https://meshtastic.org/docs/hardware/devices/)
- Community: [r/meshtastic](https://www.reddit.com/r/meshtastic/) | [Discord](https://discord.com/invite/meshtastic)
- Wikipedia: [Meshtastic](https://en.wikipedia.org/wiki/Meshtastic)

### goTenna
- Wikipedia: [goTenna](https://en.wikipedia.org/wiki/GoTenna)
- Jorge Perdomo: [goTenna Mesh (personal site)](https://www.jorgeperdomo.com/creations/gotenna-mesh)
- Daniela Perdomo: [Crain's 40 Under 40](https://www.crainsnewyork.com/awards/40-under-40-2020-daniela-perdomo)
- Forterra acquisition: [Press release (Oct 2025)](https://www.globenewswire.com/news-release/2025/10/09/3164289/0/en/Forterra-Acquires-goTenna-Advancing-Autonomous-Mission-Systems-with-Next-Generation-Communication-Technology.html)
- Products: [goTenna Pro](https://gotennapro.com/pages/products)

### Reticulum / LXMF / Sideband
- Mark Qvist: [GitHub profile](https://github.com/markqvist)
- Reticulum: [GitHub](https://github.com/markqvist/Reticulum) | [Manual](https://markqvist.github.io/Reticulum/manual/)
- LXMF: [GitHub](https://github.com/markqvist/LXMF)
- Sideband: [GitHub](https://github.com/markqvist/Sideband)
- NomadNet: [GitHub](https://github.com/markqvist/NomadNet)

### APRS
- Official site: [aprs.org](https://www.aprs.org/)
- Wikipedia: [Automatic Packet Reporting System](https://en.wikipedia.org/wiki/Automatic_Packet_Reporting_System)
- ARRL obituary: [APRS Developer Bob Bruninga, WB4APR, SK](https://www.arrl.org/news/aprs-developer-bob-bruninga-wb4apr-sk)
- APRS Foundation: [aprsfoundation.org](https://www.aprsfoundation.org/aprs-foundation-inc-at-last/)

### Other Projects
- disaster.radio: [GitHub (sudomesh)](https://github.com/sudomesh/disaster-radio) | [Website](https://disaster.radio/learn/)
- Project OWL: [project-owl.com](https://www.project-owl.com/) | [Linux Foundation announcement](https://www.linuxfoundation.org/press/press-release/the-linux-foundation-open-sources-hardware-of-disaster-relief-project-that-won-first-call-for-code-global-challenge-led-by-ibm)
- QMesh: [Hackaday.io](https://hackaday.io/project/161491-qmesh-a-lora-based-voice-mesh-network) | [GitHub](https://github.com/faydr/QMesh)
- Ripple: [GitHub](https://github.com/spleenware/ripple) | [R2 Mesh on Hackster.io](https://www.hackster.io/scottpowell69/the-r2-mesh-system-695f4b)

### Emergency Mesh Deployments
- VOA: [Mesh Networks Can Keep People Connected During Natural Disasters](https://www.voanews.com/a/mesh-networks-can-keep-people-connected-during-natural-disasters/4012781.html)
- Meshmerize: [Emergency Network Deployment](https://meshmerize.net/emergency-network-deployment-mesh-in-disaster-management/)
- Hackaday: [Meshtastic For The Greater Good](https://hackaday.com/2023/06/26/meshtastic-for-the-greater-good/)
- InfoQ: [Project OWL IoT Disaster Relief](https://www.infoq.com/news/2020/03/project-owl-iot-disaster-relief/)

### Standards
- OASIS CAP/EDXL: [Specifications overview](https://xml.coverpages.org/ni2005-09-08-a.html)
- IEEE: [LoRa-based Mesh Network for Off-grid Emergency Communications](https://ieeexplore.ieee.org/document/9342944/)

### MECP Project
- Repository: [github.com/mecp-org/MECP](https://github.com/mecp-org/MECP)
- Licence (code): [GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)
- Licence (protocol): [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- Licence (translations): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

---

*This document is part of the MECP project. The protocol specification and code table are released under CC0 (public domain). This briefing document itself may be freely shared and adapted.*
