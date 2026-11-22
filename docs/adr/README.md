# Architecture decision records

Design decisions that govern the MECP protocol. New vocabulary, units, or wire-format policy usually require a new ADR — see [`docs/EXTENDING.md`](../EXTENDING.md).

| ADR | Title |
|-----|-------|
| [0001](0001-gmdss-lineage.md) | MECP is a descendant of GMDSS |
| [0002](0002-si-units.md) | MECP uses SI units |
| [0003](0003-fixed-ascii-vocabulary.md) | The protocol vocabulary is fixed and language-neutral on the wire |
| [0004](0004-encode-decode-split.md) | Encode/decode split with bounded leniency |
| [0005](0005-beacon-semantics-vs-client.md) | Beacon codes are semantic; client behaviour is non-normative |
| [0006](0006-private-use-and-b04.md) | Private Use letter U; do not adopt B04 / REMCS1 |
