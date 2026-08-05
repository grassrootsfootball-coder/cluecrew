# NVR tag-vocabulary gap — corpus confirm/refute
2026-08-05 · against `NVR-TAG-VOCABULARY-GAP.md` · evidence: Pass-2 distractor patterns (7 papers, GL/CGP/Bond) + `nvr-blueprint-evidence`

The test in each case is whether a real paper *constructs a distractor that way*, not whether the behaviour sounds plausible. Firewall: everything below is an abstraction across papers; no source item is described reconstructably.

## Verdicts at a glance

| template | brief's candidate | corpus verdict | outcome |
|---|---|---|---|
| `turntable-rotation` | turned the wrong way (wrong direction) | **CONFIRMED** | new id `nvr-rotation-wrong-direction` |
| `turntable-reflection` | flipped about own centre, ignoring the mirror line | **REFUTED** | corpus supports a different fourth: `nvr-partial-reflection` |
| `folding-net` | opposite-by-mirror (face across the flat-sheet centre) | **REFUTED** | corpus supports a different fourth: `nvr-net-duplicated-face` |
| `lineup-like` (T1-3) | matched the exemplar's exact rotation/size | **REFUTED** | no distinct fourth exists at T1-3 — a finding, not a gap |
| `lineup-odd` | decorative tagging | **CONFIRMED** | retag honestly; 1-2 modes; no new id |
| `lineup-counting` | single error mode | **CONFIRMED** | keep `count-by-glance`; retag count+2; no new id |

Two of the four thin families get a genuine new error mode; two do not — and where they don't, that is the honest state of the papers, not a shortfall to paper over.

## 1 · turntable-rotation — CONFIRMED

Wrong direction of turn is a real, separately-constructed distractor across three engine families, and the papers keep it distinct from the magnitude slip you already tag as phase-slip:

- **Matrix** items offer a shape *anticlockwise for clockwise* — listed as its own one-parameter-wrong option, alongside but separate from *90° for 45°* (magnitude) and *reflection for rotation* (the mirror).
- **Analogy** items run a feature cycle *anticlockwise instead of clockwise*, distinct from *two places instead of one* (step count).
- **Series** items offer a sub-element *wrong-way rotated*.

So the answer to your direct question — is "wrong direction" distinct from the magnitude slip of phase-slip — is yes, in GL and CGP papers both. The duplicated over/under pair on `turntable-rotation` can honestly lose one to a wrong-direction distractor. Draft below.

## 2 · turntable-reflection — candidate REFUTED, replacement offered

The specific candidate — *flipped across the shape's own centre, not the given mirror line* — is not attested. Reflection distractors in the papers vary by transformation **type** (rotation-for-reflection), by **axis orientation** (top-bottom for left-right), and by **partial application**; none varies by the mirror line's **position** the way "flip in place" requires. Two further problems: in GL, reflection appears almost only as the mirror-vs-rotation discriminator (no positioned distant line for "in place" to differ from), and geometrically your duplicated pair is two *rotations* (180° and 90°) — both genuinely rotation-for-reflection, the same error parameterised by angle, not a flip at all.

What the corpus *does* construct as a distinct fourth is a **partial reflection**: a near-correct mirror with one internal element left unflipped. That is a different picture from a turn, so it de-duplicates the pair honestly. It becomes the replacement id (below), and wiring it means changing one constructed option from a turn to a partial flip, not just relabelling.

## 3 · folding-net — candidate REFUTED, replacement offered

*Opposite-by-mirror* — reading the face across the flat sheet's centre as the folded-opposite — is not a pattern the papers construct. The net items are cube-matching tasks, and their distinct distractors are the forced-opposite **adjacency** error (dominant), a **duplicated face**, the post-fold **mark-orientation** error, and the rare impossible-corner. "Opposite by mirror" would need opposite-face-identification items, which the corpus doesn't show, and as described it overlaps the adjacency blindspot rather than standing clear of it.

The honest distinct fourth is the **duplicated face** — a motif shown on two faces when the net carries it once. It is attested as a common net distractor, clearly separate from adjacency-blindspot and mark-orientation, and was described in Pass-2 without ever getting a ratified id. It becomes the replacement (below); wiring it changes one option's construction.

## 4 · lineup-like (T1-3) — REFUTED, and there is no honest fourth

*Matched the exemplar's exact rotation/size* cannot generate a distinct wrong option. In a group defined by kind+shading, rotation and size are the free axes, so an option matching an exemplar's exact rotation/size is either the key (kind+shading correct) or an option that breaks kind/shading — which is already `surface-similarity` or `single-axis-fixation`, both tagged here. The papers document no separate "over-specific match" mode.

At T1-3, like-classification genuinely has three error modes (surface-similarity, partial-rule-match, single-axis-fixation); the relational clause that supplies a real fourth only exists at T4-5, exactly as your table says. This is a finding, not a gap. The clean resolution is the one your `checkItem` plan already anticipates: put T1-3 like-classification on the allow-list as a legitimately parameterised family (the two look-alikes can key off different surface axes — one shape-family, one shading), the same way phase-slip and counting sit there. No new id.

## 5 · lineup-odd is decorative — CONFIRMED

The corpus agrees, and for the reason your brief gives. In odd-one-out the four wrong options are the group members, so there is no per-option constructed error to name — the real misconception is set-level: the set is engineered so a child fixated on the free-roaming axis (rotation or size) or on a salient surface property is pulled to a specific member. Tagging those four by `index % 2` is decorative. Retag all four honestly to `single-axis-fixation` (or `surface-similarity`) and accept that odd-one-out carries one to two modes. A constructor decision, not a new id.

## 6 · lineup-counting has one honest error — CONFIRMED

The corpus does not distinguish off-by-one from off-by-several as separate diagnoses. Miscounting is `count-by-glance` whatever the magnitude — the papers treat the size of the miss as a parameter of one estimate-instead-of-count error, exactly as rotation treats over/under-a-step. The `surface-similarity` currently sitting on the count+2 option is a mild mislabel of the same miscount; retag it to `count-by-glance` and let the template keep `count-by-glance ×3`. (The count-then-position pairing that adds an arrangement error belongs to plan views, not to counting a line-up.) No new id.

## Proposed misconceptions (house format)

Three ratified additions, in `nvr-proposed-misconceptions.json` for import as PROPOSED. Each child hint is ≤16 words, ban-list clean, names the trap as a class (survives a distractor swap):

**`nvr-rotation-wrong-direction`** · turntable-rotation (also machine series/matrix/analogy)
Turns the correct amount but the wrong way round — anticlockwise when clockwise was asked. Distinct from the magnitude phase-slip and from a mirror.
Hint: *"Check which way to turn, like clock hands. A turn the other way is the trap."*

**`nvr-partial-reflection`** · turntable-reflection (also machine-analogy)
A near-correct mirror with one internal element left unflipped. Distinct from rotation-for-reflection and from wrong-mirror-axis.
Hint: *"Fold along the mirror line so every part flips. One piece left unflipped is the trap."*

**`nvr-net-duplicated-face`** · folding-net
A cube showing the same motif on two faces when the net carries it once. Distinct from adjacency-blindspot and mark-orientation.
Hint: *"Each mark sits on one face only. A shape showing twice can't be the right cube."*

## Net effect on the six templates

- `turntable-rotation`, `turntable-reflection`, `folding-net`: each gets a genuine distinct fourth error — the distinctness check can be enforced on all three once these import (reflection and net also need one constructor slot rebuilt, since their fourth is a new picture, not a relabel).
- `lineup-like` (T1-3), `lineup-odd`, `lineup-counting`: no new id. These go on the `checkItem` allow-list as legitimately parameterised / low-mode families — the honest alternative your brief named, chosen here because the corpus supports it.
