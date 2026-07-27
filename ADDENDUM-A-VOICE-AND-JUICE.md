# ADDENDUM A: VOICE AND JUICE
### ClueCrew Build Bible — Addendum to the Manifesto — v1.0
**Applies to Phases 4–6 retroactively. Sits under the manifesto (§6 voice, D-laws) and makes it executable. Where the manifesto describes the voice, this document demonstrates it. Examples here are law: match their register, don't just read them.**

---

## PART 1 — THE VOICE BIBLE

### 1.1 The five rules

1. **Talk to a capable kid, not a small child.** No baby talk, no exclamation-mark spam, no "Wow, amazing job superstar!" Detectives get spoken to like colleagues.
2. **Short. Concrete. Active.** Reading age ≤9 means common words and one idea per sentence. Cut every subordinate clause you can.
3. **Praise the method, never the child.** "You tracked the jumps" beats "You're so clever." (Growth-mindset framing; also the only kind of praise that survives a hard question.)
4. **In-world, always.** Loading is dusting for prints. Errors are cold trails. Finishing is a shift ending. The world never breaks.
5. **Never frame a limit as a restriction.** The session cap is a shift completed, not a quota reached. This one is a D2 requirement, not a style note.

### 1.2 Before and after — replace these strings

| Screen | ❌ What's there now (typical) | ✅ What it should say |
|---|---|---|
| HQ greeting | "Welcome back, Amara. You have 3 cases in progress." | "You're back. Three cases on the board." |
| HQ, first ever visit | "No cases completed yet." | "Your board's empty. Let's fix that." |
| Warm-up start | "Warm-up: review previous material" | "Warm-up first. Let's see what stuck." |
| Mode shelf header | "Select a learning mode" | "How do you want to crack this one?" |
| Mode: Watch | "Watch it" | "Watch me solve one" |
| Mode: Walk | "Walk it" | "Walk through it with me" |
| Mode: See | "See it" | "Show me with pictures" |
| Mode: Hear | "Hear it" | "Read it to me" |
| Mode: Try | "Try it" | "Just let me try" |
| Correct | "Correct!" | *Rotate, method-specific:* "You tracked the jumps." · "You spotted the swap." · "Straight through it." · "You found the hidden one." |
| Not yet | "Incorrect. The correct answer is B." | "Not yet." + the distractor's authored `childHint` verbatim, e.g. "You went forwards. This code runs backwards." |
| After a miss, options | "Retry / View explanation" | "Have another go" / "Show me a way in" |
| Second miss | *(nothing)* | "Tricky one. Want to see it another way?" |
| Third miss (frustration break) | "You have made 3 incorrect attempts." | "Let's park this one. We'll come back to it." |
| Case cracked | "Case complete. Mastery: 82%" | "CRACKED." *(stamp lands)* "That one's closed." |
| Word collected | "New word added: transport" | "New word for the vault: **transport**" |
| Root family complete | "Collection complete" | "Whole PORT family. That's the shelf finished." |
| Rank up | "You have been promoted to Detective." | "You made Detective. Badge is yours." |
| Streak alive | "Streak: 5 days" | "Lantern's still lit." |
| Streak rekindled | "Streak broken. Starting over." — **BANNED** | "Lantern's lit again." |
| Wind-down | "Session complete. Daily limit reached." — **BANNED** | "That's the shift done. Good work today." |
| Loading | "Loading…" | "Dusting for prints…" · "Checking the files…" · "Opening the case…" |
| Error | "An error occurred. Please try again." | "Trail's gone cold. Let's try that again." |
| Offline | "No internet connection." | "Lost the signal. We'll wait here a sec." |
| Boss Case intro | "Mock Exam: Verbal Reasoning" | "Big one today. Real exam rules: no tools, just you." |
| Boss Case timer, final min | *(red countdown)* — **BANNED** | Amber bead + "Last minute. Finish what you can." |
| Boss Case end | "Time's up. Score: 34/50" | "Time. Pens down, Detective." *(no score to child)* |
| Boss Case result, child | *(score)* | "Two you nailed: hidden words, letter jumps. One for next time: mirror codes." |
| Locked district | "Coming soon" | "Locked. Not your patch yet." |

### 1.3 Banned in child-facing strings (extends manifesto D1)
`fail`, `failure`, `wrong`, `incorrect`, `error` (in child UI), `behind`, `weak`, `limit`, `quota`, `restricted`, `you must`, `you should have`, `unfortunately`, plus any praise of the child rather than the work ("clever", "smart", "gifted", "genius").

### 1.4 Rotation requirement
Every repeated beat (correct, not-yet opener, loading, wind-down) needs **≥6 authored variants** so nothing feels canned by day three. Variants live in `/content/voice/*.json`, pass the reading-age lint, and are selected without immediate repeats.

---

## PART 2 — THE JUICE SPEC

**Definition:** juice is the immediate, physical satisfaction of interacting. It is not points. Everything below is compatible with the evidence base and none of it adds extrinsic reward.

### 2.1 The universal rules
- **100ms rule:** every tap gets a visible response within 100ms — scale to 0.96, colour shift, or lift. Nothing may ever feel dead.
- **Overshoot everything:** things that appear should overshoot and settle (spring easing, ~1.08 scale then rest). Linear easing is banned; the world has weight.
- **Nothing cuts:** screens slide, cards fly, panels settle. No hard swaps.
- **Numbers count:** counters tick up with a small bounce, never snap to value.
- **Anticipation before payoff:** a 150–250ms beat before a reveal makes the reveal land. Free tension.
- **Everything is interruptible.** Juice must never cost a child time or block a tap.

### 2.2 Per-moment specification

| Moment | Required juice |
|---|---|
| Option tap | Press-down scale, ripple from finger, immediate lock |
| Correct | Option tile pops (1.12 → 1.0), amber spark burst from the tile, mascot `celebrating`, chime, progress bead fills with overshoot |
| Not yet | Tile shakes gently (2 cycles, ≤6px, never violent), coral glow fades in over 200ms, mascot `encouraging`, soft low chime — **never a buzzer, never red, never a shake that feels like a slap** |
| Progress beads | Fill with a pop and a tiny glow trail; beads never drain |
| Case cracked | **The set piece.** Screen dims 15%, stamp descends with anticipation, lands with overshoot + rotation jitter + dust puff + a real THUMP, ink spreads for 300ms, amber spark burst, mascot `proud`, case file flips shut. ~2.5s, skippable after first view |
| Word collected | Card flies in an arc to the vault icon, vault counter bounces, soft page-flick sound |
| Root family complete | Shelf lights up left to right, cards flip in sequence |
| Rank up | Full-screen: badge scales in with overshoot, amber-only confetti, ribbon unfurls, mascot `proud`, held chord. ~3s |
| Streak lantern | Idle flicker always; on session complete, warms and pulses once |
| Alphabet Rail | Letters lift and glow as the finger passes; selected pair connected by a drawn amber arc; scrubbing feels notched, not smooth |
| Mascot idle | **Never static.** Breathing loop, occasional blink, head turns toward whatever the child last touched, small idle break every ~20s |
| Session wind-down | Today's words fan out in an arc, lantern pulse, mascot `sleeping` settles, lights dim warmly |
| Boss Case | Deliberately restrained. Plain rendering keeps its calm; juice here is limited to bead progress and a soft "time" chime. The contrast is the point (P4) |

### 2.3 Sound (currently absent; blocks perceived quality more than art does)
Minimum set before child testing repeats: tap tick, correct (3 variants), not-yet (soft, warm), bead fill, stamp thump, word flick, rank fanfare, wind-down. Mixed quiet, one-tap mute, never sole carrier of meaning. **If budget forces a choice between more illustration and sound design, choose sound.**

### 2.4 What stays banned (manifesto D3 and the evidence)
No leaderboards or child-vs-child comparison. No loss animations, draining bars, breaking streaks, or lives. No variable-ratio/loot-box rewards. No "one more?" prompts at the cap. No red. No countdown urgency styling outside a Boss Case's final minute, and even that is amber.

### 2.5 Accessibility
Every juice effect respects `prefers-reduced-motion`: replace motion with instant state changes and keep the sound and colour beats. Juice is never load-bearing for meaning.

---

## PART 3 — APPLYING THIS

Voice strings and juice are retrofits to Phase 4 and requirements for Phases 5–6. The Phase 5 gate item "full-product copy pass by one person in one sitting" now means: pass against this document. CI's banned-vocabulary scan extends to §1.3.

---
*Changelog: v1.0 — created in response to build review: voice too flat, product under-juiced.*
