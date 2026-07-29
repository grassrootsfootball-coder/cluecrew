# Accessibility audit — WCAG 2.2 AA (BUILD-PHASE-5 §7)

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-07-27 | Automated pass wired into CI; manual checklist first pass; AT session pending |
| 0.2 | 2026-07-28 | Contrast defect found and fixed on Crew HQ locked doors; axe now zero critical AND zero serious across all route families |
| 0.3 | 2026-07-29 | /crew/play (mid-session) brought under audit; prohibited-ARIA and rail contrast defects found and fixed; axe rule set widened |

### F-002 — Prohibited ARIA on generic elements, and rail contrast (fixed 2026-07-29)

Adding a mid-session Lighthouse page (`/crew/play`, parked on a practice item)
scored **90** on accessibility where every other page scored 100. Two defects,
both on the screen children use most:

1. **`aria-prohibited-attr`.** `aria-label` was set on generic `<div>`/`<span>`
   elements: the progress beads, the stowaway engine's tiled words (PLANT /
   RAIN), the Crew HQ streak lantern, and the locked district doors. ARIA
   prohibits `aria-label` on `role=generic`, so screen readers **discard it** —
   and because the inner tiles are `aria-hidden`, those elements had no
   accessible name at all. Fixed with `role="img"` where the label is the
   content (beads, tiled word, lantern), and by deleting the redundant label on
   the locked doors, whose visible text is already announced.
2. **Rail contrast.** `.crew-rail .jump` used the canonical `vr-teal` as a text
   colour: 3.2:1 on cream, below AA. District accents are accent colours, not
   text colours. Now derived from the same token by mixing toward ink
   (~5.5:1) rather than inventing a new hex, keeping manifesto §6 intact.

**Why the existing axe suite missed all of this.** Two gaps, both closed:
`/crew/play` was never audited (it needs a session driven to a practice item),
and `AxeBuilder.withTags(['wcag2a','wcag2aa','wcag22aa'])` does not carry
`aria-prohibited-attr`, so the suite reported a clean 100 on pages that had the
defect. The suite now parks a session and audits `/crew/play`, and includes the
ARIA rules explicitly. Result: 100/100/100 with zero failing audits.

## Findings and fixes

### F-001 — Locked district doors failed AA contrast (fixed 2026-07-28)

`.crew-door.locked` dimmed the whole card with `opacity: 0.55`, which compounded
with the sub-label's own `.cc-muted { opacity: 0.75 }` to an effective 0.41 —
measured at **2.37:1** for "Locked. Not your patch yet." and **3.42:1** for the
`? ? ?` glyph, against the 4.5:1 requirement. Container opacity is the trap: it
dims text you did not intend to dim.

Fix: the locked state now reads through a dashed border and a 5% ink wash, with
only the decorative padlock glyph dimmed. Text uses a `.door-sub` colour
(75% ink over cream ≈ 6.2:1). The doors still read as locked and mysterious —
verified by screenshot — and the text is legible. Re-run: zero critical, zero
serious.

## Automated (axe, in CI — `apps/web/e2e/a11y.spec.ts`)

- Scope: marketing, auth, Parent HQ, Casebook, child app (HQ, district, vault, case intro).
- Gate: **zero critical violations** fails the build. Serious findings print for this document.
- Status (2026-07-28): **zero critical and zero serious** across marketing, auth,
  Parent HQ, Casebook and the child app. One serious finding was raised and
  fixed in this pass — see F-001.

## Manual checklist (2.2-specific criteria included)

| Check | Status | Notes |
|---|---|---|
| Focus order follows visual order on all forms and the Daily Loop | ✅ self-audit | Single-column layouts; loop is one activity at a time |
| Focus appearance (2.4.13): visible, ≥2px, high-contrast | ✅ | `crew-tap`/buttons use 3px amber outline with offset |
| Target size (2.5.8): ≥24px CSS (we hold ≥48px in the child app) | ✅ | `.crew-tap`/`.crew-tile` enforce 48px + 8px spacing |
| Dragging alternative (2.5.7) | ✅ by design | All interactions are tap-tap; no drag exists yet |
| Contrast: ink on cream 12.9:1; amber buttons use ink text | ✅ | District accents used as borders/accents, not body text |
| Contrast: coral not-yet panel text | ✅ | Ink text on 12% coral tint |
| Reflow at 400% zoom, no horizontal scroll | ✅ self-audit | Flex/grid wrap; rail wraps; tables scroll in own container |
| Reduced motion: all animation stilled incl. mascot & shimmer | ✅ | `.crew-app.reduced-motion` kills animation/transitions |
| Colour never sole carrier | ✅ | Cracked = stamp+text; correct = ✔+text; not-yet = text+hint |
| Audio never sole carrier; global mute | ✅ | Cues accompany visual beats; mute is one tap, persistent |
| Keyboard-only full child loop | ✅ self-audit | All activities are buttons; needs AT-session confirmation |
| Screen-reader labels on mascot, rail, beads, cards | ✅ | aria-labels present; needs AT-session confirmation |
| No justified text; dyslexia toggle app-wide | ✅ | CSS-enforced |

## Waivers

None to date.

## Outstanding (needs a human)

1. **Assistive-technology session** (gate #8): one full child loop + parent signup
   with a real screen reader (VoiceOver) and switch-style keyboard-only use.
   Findings land here; blockers fixed before gate close.
2. Confirmation of the self-audit rows above by someone who did not build it.

## Statement

Public statement page: `/accessibility` (live).
