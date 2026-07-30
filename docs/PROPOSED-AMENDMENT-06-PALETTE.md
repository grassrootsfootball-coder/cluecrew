# Proposed amendment to Manifesto §6 — Colour tokens

**Status: PROPOSED. Nothing here has shipped.** The palette in
`packages/ui/src/tokens.ts` is unchanged and will stay unchanged until David
accepts or rejects this. Drafted by Claude Code on David's instruction,
2026-07-30.

Measured with `pnpm audit:palette`, which reads the eight tokens out of
`packages/ui/src/tokens.ts` itself rather than a copy, so it can never audit a
palette the product no longer ships. Re-run it any time. Contrast is the WCAG
2.x ratio; ΔE is CIE76 perceptual distance, where under about 25 reads as
"these are the same sort of colour".

---

## What the measurements say

### 1. The AA sentence in §6 is not true, and cannot be

§6 currently ends: *"All text/background pairs must pass AA; check before
merge."* Measured against `cream`, the default background:

| Token | on cream | AA body (4.5) | AA large (3.0) |
|---|---|---|---|
| `ink` | 13.2:1 | pass | pass |
| `nvr-violet` | 4.16:1 | **fail** | pass |
| `english-rose` | 3.34:1 | **fail** | pass |
| `maths-green` | 3.11:1 | **fail** | pass |
| `vr-teal` | 3.09:1 | **fail** | pass |
| `coral` | 2.47:1 | **fail** | **fail** |
| `amber` | 1.88:1 | **fail** | **fail** |

Seven of the eight tokens fail as body text on the default background. Only
`ink` passes. The rule as written forbids the palette it sits next to.

This is not a bug in the product — the build uses these as **surfaces**
(fills, borders, accents) with `ink` on top, which is correct and measures
well: `ink` on `amber` is 7.02:1, `ink` on `coral` is 5.34:1. The defect is in
the sentence, which promises something untrue and gives a reviewer no usable
test. A rule nobody can apply is a rule that gets skipped.

### 2. Two district accents are close, and several merge for colour-blind children

| Pair | ΔE |
|---|---|
| `vr-teal` vs `maths-green` | **22.1 — close** |
| `nvr-violet` vs `english-rose` | 41.2 |
| `vr-teal` vs `nvr-violet` | 59.3 |
| others | 69–74 |

Simulating the three common types of colour vision deficiency, the four
district accents collapse into each other:

- **protanopia** — `vr-teal`/`nvr-violet` (ΔE 14.5), `nvr-violet`/`maths-green` (22.8), `maths-green`/`english-rose` (23.6)
- **deuteranopia** — `nvr-violet`/`maths-green` (ΔE 14)
- **tritanopia** — `nvr-violet`/`maths-green` (ΔE 8.5), `vr-teal`/`maths-green` (18.5), `vr-teal`/`nvr-violet` (21.3)

Roughly 1 in 12 boys has some red-green colour vision deficiency. For an
audience of 8–11-year-olds that is a real share of the children using this,
and they are not going to tell anyone they cannot tell the districts apart.

Today this costs nothing, because districts are also named in words everywhere
they appear. The risk is the day someone ships a colour-only district cue —
a coloured dot, a bare progress bar, a map key — and it is invisible to those
children and to every reviewer with typical vision.

### 3. `coral` is genuinely not red, which is worth recording

D1 forbids red. `coral` sits ΔE 58.7 from pure red, so it comfortably clears
that bar, and `ink` on `coral` is 5.34:1. No change proposed — but the number
is here so nobody has to re-litigate it.

---

## Proposed replacement wording for §6

> ### Colour tokens (canonical — use these names in code and CSS variables)
>
> *(table unchanged)*
>
> District accents appear only inside their district and in navigation.
>
> **Contrast.** `ink` is the only token permitted for body text. Every other
> token is a surface: fills, borders, accents, with `ink` on top. Required
> before merge:
> - text against its background — **4.5:1**, or **3:1** at 24px+ or 19px+ bold;
> - any colour carrying meaning without text (borders, state fills, focus
>   rings, progress) against what sits next to it — **3:1**.
>
> **Colour is never the only carrier of meaning.** Anything a colour tells a
> child must also be told by a word, a shape, a position or an icon. Measured
> under the three common types of colour vision deficiency, the four district
> accents merge into one another — `nvr-violet` and `maths-green` come as
> close as ΔE 8.5 — so a colour-only district cue is invisible to roughly one
> boy in twelve. District names are load-bearing; district colours are
> decoration on top of them.

**Optional, and separable from the above:** move `maths-green` from `#5B9A68`
towards a warmer, lighter green so it separates from `vr-teal` (ΔE 22.1) for
children with typical vision too. This is the only token change proposed, and
it is a preference rather than a defect — say no and the wording above still
stands on its own.

---

## What each choice costs

| Decision | Work it creates |
|---|---|
| Accept the wording only | Add the 3:1 non-text check to the palette audit script and run it in CI. No visual change; nothing to re-review. |
| Accept the wording + the green | The above, plus a sweep of anywhere `maths-green` renders. Maths district is not built yet, so this is close to free **now** and gets steadily more expensive later. |
| Reject | Nothing changes. The untrue AA sentence stays in §6 — worth fixing separately even if the rest is rejected. |

## If accepted

1. §6 text replaced as above; changelog entry in §10 in David's name.
2. `packages/ui/src/tokens.ts` comment updated to match (it currently repeats
   the same untrue "All text/background pairs must pass WCAG AA" line).
3. `scripts/audit-palette.mjs` (already in the repo, reporting only) extended
   with the 3:1 non-text check and wired into CI beside `scan:vocab`, so the
   rule is enforced rather than remembered.
