# Reviewer brief — vr19-spas (R1047)

Follow `content/agent-review/REVIEWER.md` (the general reviewer brief: identity `rev-agent-01`,
Task 1 for drafts, Task 2 for rows). Specific to this door:

- Three LIVE rows of `vr-19-word-number-codes` asked a child to encode SPAS, a British playground slur.
  The family's word list now has SITS in its place; `packet.json` gives each row before and after.
- Task 1: every draft in `drafts.json` → ATTEST or REFUSE. Compare against the family's house form:
  the other 22 rows' executions (read them in the packet's `before` options for the old SPAS form).
- Task 2: every row → SIGN or HOLD, as the child would meet the `after` row: the code maps every
  letter of the word, the key is the only correct option, every distractor is wrong and is what its
  tag says, the tier-1 word is suitable for a 9–11-year-old and plain British English.
- Copy each row's `preImageSha256` from the packet into your verdict.

Output: `content/agent-review/vr19-spas/verdicts.json`, shape as in REVIEWER.md plus `preImageSha256`
on each row entry.
