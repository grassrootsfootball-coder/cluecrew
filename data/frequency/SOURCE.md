# Frequency data — pinned here, never committed

**Licence state: UNESTABLISHED, not refused.** SUBTLEX-UK publishes no licence, no copyright
statement and no redistribution grant; the one stated condition is citation. Rights are reserved by
default, so the bytes stay out of git and the digest lives in source.

## To fetch (one command, run by a person, not by CI)

    curl -L -o data/frequency/SUBTLEX-UK.txt.zip \
      https://psychology.nottingham.ac.uk/subtlex-uk/SUBTLEX-UK.txt.zip

Then record its sha256 in `packages/core/src/frequency-signal.ts` as `expectedDigest`, with the
retrieval date. The check refuses to run against a file whose digest does not match.

**Cited on every use:** van Heuven, W. J. B., Mandera, P., Keuleers, E., & Brysbaert, M. (2014).
SUBTLEX-UK: A new and improved word frequency database for British English. *Quarterly Journal of
Experimental Psychology*, 67(6), 1176–1190.

## What it may and may not do (David's corpus-firewall ruling, 2026-08-19)

- Aggregate statistics are not source text. A word and a number echoes nothing.
- Firewall depth unchanged: it informs a CHECK on already-authored items and never reaches the
  generator.
- Pinned and cited like any artefact — digest, version, retrieval date.
- **It may NOT be used to select or generate item content. It measures items that already exist.**
