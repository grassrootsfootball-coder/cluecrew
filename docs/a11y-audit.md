# Accessibility audit — WCAG 2.2 AA (BUILD-PHASE-5 §7)

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-07-27 | Automated pass wired into CI; manual checklist first pass; AT session pending |

## Automated (axe, in CI — `apps/web/e2e/a11y.spec.ts`)

- Scope: marketing, auth, Parent HQ, Casebook, child app (HQ, district, vault, case intro).
- Gate: **zero critical violations** fails the build. Serious findings print for this document.
- Status: green at time of writing (see CI run for the current list of serious/moderate advisories).

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
