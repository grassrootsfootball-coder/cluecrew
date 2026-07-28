# Marketing claim audit — L1 / L2 / L3 / L5 / L6

Phase 5 gate item #7. Every public-facing claim on the marketing site, checked
against the manifesto's claims laws. Audited against the **live rendered copy**
(not the source), 2026-07-28.

## The laws being tested

| Law | Test applied |
|---|---|
| **L1** | No claimed, implied or gamified pass rate or "guaranteed" outcome. Process claims only. |
| **L2** | No "learning styles" framing. Approved wording only: "every concept, multiple ways — your child chooses how it clicks." |
| **L3** | No implied affiliation with GL, CEM, ISEB, any school, consortium or the DfE. Exam-board names factual only. |
| **L5** | Total contract value, renewal behaviour and cancellation route stated before purchase. No drip pricing, no dark patterns. |
| **L6** | No third-party marks ("For Dummies" etc.). |

## Findings

| Page | Claim as published | Verdict |
|---|---|---|
| `/` | "makes the 11+ make sense … clear teaching, calm design, and a price any family can reach" | ✅ L1 — mission, no outcome |
| `/` | "15 calm minutes a day … Sessions end on time, every time — we never reward bingeing" | ✅ L1 process; also a D2 commitment we actually enforce in code |
| `/` | "Every concept, multiple ways … your child chooses how it clicks" | ✅ **L2 exact approved framing** |
| `/` | "the engine notices what needs another way in" | ✅ L1 — describes behaviour that exists (P1 different-way-in) |
| `/`, `/pricing` | "£8.99/month over 24 months — total £215.76, shown before you ever pay" | ✅ L5 — TCV published pre-purchase |
| `/pricing` | "Cancelling is two clicks… Full refund within 14 days… fair exit… we email 14 and 3 days before anything renews" | ✅ L5 — all four DMCC elements |
| `/faq` | "Will ClueCrew get my child into a grammar school? **No one can promise that**… We never make outcome claims, and we would be wary of anyone who does." | ✅ **L1 — refuses the outcome claim explicitly.** The strongest trust line on the site |
| `/faq` | "Short, frequent, calm practice outperforms weekend marathons" | ✅ L1 — evidence claim about spacing, not about this child's result |
| `/faq` | "we are independent and unaffiliated with GL Assessment, CEM, ISEB, any school or consortium" | ✅ **L3 — disclaims affiliation outright** |
| `/faq` | "No conversational AI ever talks to your child… every one of those passes human review" | ✅ Accurate to S3 and the CMS publish gate |
| `/safeguarding` | "the columns do not exist, so they cannot leak, be hacked, or be requested" | ✅ Verifiable in `schema.prisma`; strong but true |
| `/bursary` | "preparation matters more than bank balance… the identical product, nothing cut down and nothing labelled" | ✅ Access framing, not charity framing; backed by the `isBursary` CI grep |
| `/11-plus/*` | "The Kent Test is a GL-style assessment…", sourced and dated | ✅ L3 — factual descriptor, with source URL and last-verified date |
| `/11-plus/*` | "Schools change providers — always confirm with the school for your entry year." | ✅ Verbatim caveat renders on every region result |
| `/accessibility` | "Target: WCAG 2.2 AA across every page" — stated as target, with known limitations listed | ✅ Honest; not a certification claim |
| All | Scanned for "guarantee", "learning style", "tutor-proof", "beat the exam", third-party marks | ✅ CI `scan:vocab` green |

**No L1/L2/L3/L5/L6 violations found.** Two claims are strong but substantiated
by code rather than opinion (the schema claim and the bursary-identity claim);
both are the kind we would want challenged, and both survive challenge.

## Still needs a human (gate #7)

> "external read by someone who'll tell us the truth"

An outside reader — ideally a parent who is not invested in the project — should
read `/`, `/pricing` and `/bursary` cold and answer:

1. Did anything read as a promise about their child's result?
2. Did the bursary page feel like access, or like charity?
3. Was the total price clear before they would have entered card details?

That read is not something this audit can substitute for.
