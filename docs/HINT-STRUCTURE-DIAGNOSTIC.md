# Diagnostic: a hint that presumes a structure its bank doesn't contain

Reviewer's general diagnostic, 2026-08-05. `vr03-reversed-relation` was the known
instance; this scans every district for the same pattern.

## Method

For each of the 208 ACTIVE misconceptions, flag any whose **child hint asserts a
concrete structure (a size ordering, a mirror line, a clockwise turn, a code
table) that its own description does not** — the sharpest automatable proxy for
"the hint presumes more structure than the tag is defined for." A keyword net is
only a first pass; the real test is per-tag judgment, so every hit below is
assessed by hand against what its bank actually contains.

## Result — one genuine instance

Seven hints tripped the net; six are false positives (their bank genuinely
contains the structure, the terse description just omitted it):

| tag | presumes | verdict |
|---|---|---|
| **`vr03-reversed-relation`** (VR) | a size ordering ("little one / big one") | **GENUINE** — see below |
| `maths-36-multiplying-to-convert-to-a-larger-unit` | size | false positive — unit conversion IS about magnitude |
| `maths-44-reading-the-wrong-protractor-scale` | size | false positive — the task IS angle size vs 90° |
| `maths-72-wrong-operation-chosen` | size | false positive — a general "bigger/smaller/shared" heuristic, not an item structure |
| `nvr-mirror-for-rotation` | a clockwise turn | false positive — used only on rotation-bearing templates |
| `nvr-partial-reflection` | a mirror line | false positive — reflection task, mirror line shown |
| `nvr-wrong-mirror-axis` | a mirror line | false positive — reflection task, description names the axis |

**`vr03-reversed-relation` is the one real case.** Its hint — *"Check the
direction — which one is the little one, which is the big one?"* — presumes the
pair is a size ordering. But the vr-03 analogy bank is overwhelmingly non-size
relations: young→adult (kitten:cat), maker→home (bird:nest), tool→action
(pen:write), part→whole (leaf:tree). Almost no item is a size comparison, so the
hint fits almost none of the bank. This is being reworded as part of the vr-03 tag
family (`same-topic` / `reversed-relation` / new `wrong-link`).

## Caveats

- NVR misconceptions are not item-stored (items generate on demand), so the scan
  cannot read their bank's structure — the three NVR hits were judged against the
  templates that use each tag, all of which contain the named structure.
- The net keys on vocabulary; a hint that presumes a structure in *different words*
  (no size/line/turn keyword) would slip past. The reviewer's reading remains the
  real net — this just confirms no second obvious instance is hiding in the copy.

## Bonus defect found

`maths-36-multiplying-to-convert-to-a-larger-unit` carries a wrong worked example
in its **description**: "e.g., 100cm = 10,000m". 100 cm = 1 m. The hint is correct;
the description's example is not. Flagged for correction (separate from the hint
diagnostic).
