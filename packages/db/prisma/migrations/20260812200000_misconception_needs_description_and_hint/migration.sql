-- A MISCONCEPTION WITHOUT A DESCRIPTION AND A HINT IS A PLACEHOLDER, NOT A PROPOSAL
-- (annie, 2026-08-12). Refused at CREATION, never at use.
--
-- Undescribed tags carried 9% of distractors across four clusters, then 29% across the next four,
-- with nothing about the passages changing. A tag with no stated meaning cannot REFUSE a use --
-- there is nothing to contradict -- so it becomes the sink for anything that needs a name.
--
-- This lives in the DATABASE because there are twenty-odd creation doors (CMS action, seed,
-- generate-content, and a long tail of import/apply scripts). A rule enumerated in each of them is
-- a rule that drifts: that is R42's finding and it has recurred five times. One constraint no door
-- can bypass, with `checkMisconceptionProposal` in packages/core giving the CMS door a readable
-- refusal instead of a stack trace.
--
-- The floor is calibrated, not invented: across the 270 rows present when this landed, the shortest
-- description was 25 characters and the shortest childHint 40. Twelve sits far below both, so no
-- existing row is affected and no legitimately terse entry is at risk. It is not a quality bar --
-- a reviewer judges quality -- it is the line under which a value cannot be a statement at all.
ALTER TABLE "Misconception"
  ADD CONSTRAINT "misconception_needs_description_and_hint"
  CHECK (length(btrim("description")) >= 12 AND length(btrim("childHint")) >= 12);
