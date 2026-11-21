# MECP: Mesh Emergency Communication Protocol
## A Comprehensive Briefing Document

**Version:** 1.4.1
**Date:** November 2026
**Repository:** [github.com/mecp-org/MECP](https://github.com/mecp-org/MECP) (protocol + languages)
**Implementations:** see the [README](README.md#known-implementations)
**License:** CC0 (protocol) | CC BY 4.0 (translations) | GPLv3 (implementations in mecp-app)
**Status:** Protocol and 21 language packs published; clients in mecp-app

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

Both are designed for systems with essentially unlimited bandwidth. They are architecturally incompatible with a radio packet of about 230 bytes. You cannot shrink XML into a LoRa message. You need something designed from the ground up for extreme byte constraints.

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

This 48-byte message communicates:

- **MECP/0/** — This is a MAYDAY (life-threatening) severity message
- **M01** — Injury
- **M07** — Fracture / immobile
- **T04** — Flooding
- **3pax** — 3 people affected
- **48.8566,2.3522** — GPS coordinates (Paris, in this example)
- **@1430** — Timestamp: 14:30
- **@en** — Language: English

A recipient -- or their device -- can decode every field immediately, regardless of what language they speak, because the codes are universal. The recipient's device looks up M01 in their own language file and displays the localised meaning.

### 5.2 Design Principles

**Compact by design.** MECP enforces a 200-byte maximum (leaving 30+ bytes of headroom below Meshtastic's 233-byte text payload, §3.1, for future metadata). Every element of the format is designed to minimise byte usage while maximising information density.

**Human-readable and machine-parseable.** An MECP message can be read and roughly understood by a person looking at raw text on a screen, and it can be fully decoded by software into structured data with severity levels, incident types, GPS coordinates, timestamps, and affected person counts.

**Language-independent codes.** The code table (M01, T04, C01, etc.) is universal. Each code maps to a localised description in 21 languages. The protocol itself is language-neutral -- the same message means the same thing whether decoded in Japanese, Farsi, or Norwegian.

**Graduated severity.** Four severity levels (0-3) provide immediate triage capability. A device can colour-code, sort, or alert differently based on severity before a human even reads the message content.

**Free-text fallback.** After the structured codes, any remaining byte budget can be used for free-form text. The protocol does not force users into codes-only communication -- it structures the critical information and leaves room for human context.

**Protocol is public domain.** The MECP protocol specification, message format, and code table are released under **CC0 (Creative Commons Zero)** -- public domain. Anyone can implement MECP in any software or firmware, on any platform, without restriction, permission, or licence fees. This is a deliberate choice to maximise adoption. The goal is not to own the protocol but to establish a shared standard.

### 5.3 Lineage: GMDSS

MECP is a descendant of the maritime distress system, not a new invention. Its severity ladder follows the GMDSS/ITU priority order — distress, urgency, safety, routine — and its conventions reuse vocabulary from the Global Maritime Distress and Safety System (GMDSS) and the IMO Standard Marine Communication Phrases (SMCP). The point of that inheritance is to reuse a vocabulary that has already survived international negotiation instead of inventing one.

Three dispositions come with it:

1. **Fixed, language-neutral vocabulary on the wire.** GMDSS does not translate its signal words: SMCP is English by design (IMO Resolution A.918(22)), DSC carries preformatted codes, NAVTEX broadcasts English on 518 kHz and other languages on a separate 490 kHz channel, and AIS text is 6-bit ASCII. CAP, the closest civil analogue, types its language as BCP-47 with a default of `en-US` and represents other languages as separate `<info>` blocks rather than translated fields. MECP follows: codes, sigils and convention keywords are ASCII tokens. A localised form (`4人`, `45分`) is ordinary freetext, not part of the protocol; a client MAY recognise local equivalents, but their meaning is then a local convention, not MECP.

2. **SI units.** IMO Resolution A.351(IX) (1975) made SI the unit system of SOLAS and later instruments. SI symbols are the same in every language, so `45min` is not an English word but the symbol a Japanese or Farsi reader also expects. Convention values use SI symbols and are never translated.

3. **Localisation at the edges.** The structure carries the meaning; the reader's device supplies the language. A decoder looks a code up in its own language file and renders it, and the same applies to convention values.

GMDSS can assume trained, English-licensed operators; MECP cannot. That is why the protocol carries structure rather than prose, and why freetext may stay in any language.

---

## 6. How MECP Works

The normative wire format — message pattern, freetext conventions, vocabulary, and encoder/decoder duties — lives in [`SPEC.md`](SPEC.md) (§6). Section numbers there match historical citations (`MECP v{semver} §6.1`, older `S6…`).

This briefing keeps the surrounding rationale; implementers should treat [`SPEC.md`](SPEC.md) as authoritative.

## 7. The Full Code Table

MECP defines **120 codes** across **12 categories**. Each code is a single letter (category) plus two digits. The English text of each code is in [`languages/en.json`](languages/en.json), the single source of truth. Category letters: M, T, W, S, P, C, R, D, L, X, H, B.

Beacon semantics (B01–B03) and Private Use letter **U** are documented in [`SPEC.md`](SPEC.md) §6.5 and [ADR 0005](docs/adr/0005-beacon-semantics-vs-client.md) / [ADR 0006](docs/adr/0006-private-use-and-b04.md).

## 8. The Drill and Leisure Philosophy

A deliberate and non-obvious design decision in MECP is the inclusion of "mundane" codes: **Drill (D)** and **Life/Leisure (L)** categories.

### Why Drill Codes Exist

Emergency communication systems fail when people encounter them for the first time during an actual emergency. If the first time you ever compose an MECP message is when someone is bleeding on a mountainside, you will fumble. Drill codes (D01–D05) allow communities to run regular practice exercises:

```
MECP/3/D01 M01 M07 C01 2pax Training scenario @en
```

This message is clearly flagged as a drill (D01 sets a machine-readable `isDrill` flag in the decoder), so it won't trigger real emergency responses, but it lets participants practice the exact same compose flow they would use in a real emergency.

`isDrill` is set only by the start codes **D01** (drill) and **D02** (test). **D03** (end of drill) and **D05** (end of test) close an exercise and do **not** set the flag by themselves. **D04** ("Ignore previous — sent in error") also does not: it is a retraction code, not a drill indicator.

### Why Leisure Codes Exist

The most effective emergency tools are the ones people already use daily. If MECP were only for emergencies, people would install the app, forget how to use it, and be lost when they actually need it.

The Leisure category gives people a reason to send MECP messages regularly:

```
MECP/3/L02 L10 Ridge above camp @en
```

*"Coffee, beautiful view. Ridge above camp."*

```
MECP/3/L01 L04 Summit! Beer tonight @en
```

*"Beer / drinks, summit reached. Beer tonight!"*

These messages use the exact same format, the same compose flow, and the same encoding as an emergency message. Every social message sent is muscle memory built. When the emergency comes, the user already knows exactly how to compose a severity-0 MAYDAY with the right codes -- because they've been sending severity-3 coffee updates all week.

This is not frivolity. It is deliberate UX strategy borrowed from emergency services training doctrine: **train as you fight**.

---

## 9. What We've Built So Far

### 9.1 Language Files (21 Languages)

**Location:** `languages/` directory (this repository)
**Licence:** CC BY 4.0

Every MECP code, severity level, category name, and UI string has been translated into 21 languages:

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
| Greek | el | Greek | LTR |
| Serbian | sr | Cyrillic | LTR |
| Ukrainian | uk | Cyrillic | LTR |
| Russian | ru | Cyrillic | LTR |
| Japanese | ja | CJK | LTR |
| Simplified Chinese | zh-cn | CJK | LTR |
| Traditional Chinese | zh-tw | CJK | LTR |
| Farsi (Persian) | fa | Arabic | **RTL** |

Each language file is a JSON document containing: localised severity labels, all 12 category names, all 120 code descriptions, and UI strings for the application interface.

### 9.2 Implementations

The [README](README.md#known-implementations) lists mecp-app and third-party clients and their per-form decode behaviour.

### 9.3 Project Infrastructure (this repository)

`npm run validate` (language packs, SPEC/brief invariants, freetext conformance, markdownlint) runs on pre-commit and in CI. See [CONTRIBUTING.md](CONTRIBUTING.md).

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

Implementations include [mecp-org/mecp-app](https://github.com/mecp-org/mecp-app). You can:

- Import `@mecp/engine` from that repository into any JavaScript/TypeScript project
- Use the Python / Arduino / shell examples there
- Implement your own encoder/decoder in any language using [`SPEC.md`](SPEC.md) (CC0, public domain -- no permission needed)

The protocol is intentionally simple to implement. The decoder is roughly 80 lines of code. The encoder is similarly compact. Any developer who can parse a comma-separated string can implement MECP.

### For Translation Contributors

The language files are CC BY 4.0 licensed. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add or review a language.

### For Emergency Response Organisations

MECP can be adopted as a messaging standard for any organisation that uses or plans to use LoRa mesh networks for field communications. The protocol is public domain -- you can implement it in your own tools, train your teams on the code table, and print reference cards without any licensing constraints.

The 120-code table covers the scenarios most commonly encountered in disaster response, search and rescue, wilderness safety, and community emergency communication. The four severity levels align with existing emergency triage conventions.

---

## 11. What Comes Next

The project roadmap includes:

- **Mobile app completion:** Finalising the Meshtastic Bluetooth integration, iOS support, and app store distribution
- **Community feedback:** The code table (120 codes, 12 categories) is open for community review and proposals via GitHub issues
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

---

## Appendix A. SI Units

IMO Resolution A.351(IX) (1975) made SI the unit system of SOLAS and later IMO instruments. MECP therefore uses SI units for any convention value that is a quantity of time.

**The wire carries SI symbols only.** SI symbols are identical in every language: `45min` is not an English word, `分` is the translation of it. Convention values are never translated.

| Quantity | SI symbols accepted | Notes |
|---|---|---|
| Time | `min`, `h`, `d` | minutes, hours, days |

The only maritime exceptions are **speed and distance** (knots, nautical miles, cables) — operational units for navigation, not SI. They are not used by MECP conventions; where a duration is encoded, an SI symbol is required on the wire (`R03 45min`, never `R03 45` with an implied unit, never `R03 45 minutes`, never `R03 45分`).

A decoder MUST accept every encoded form (§6.1 rule 2). A decoder MAY accept localised unit words as local aliases (e.g. `分`, `dakika`, `minutos`), but those are freetext by default — not part of the protocol, not enumerated here, and never required. The rendering layer replaces tokens with localised forms.

**The unit vocabulary is closed.** `45m` is rejected — `m` is metre, not minute. `45m`, `45 minutes` and `45分` are never encodable and never part of a conforming message. Spaced forms (`45 min`, `1h 30min`) are decode-only; encoders emit `45min`, `1h30min`. A bare number (`R03 45`) is decode-only, read as minutes, and only valid as the first freetext token when `R03` is present; a unit-bearing value (`45min`) may appear anywhere in the freetext.
