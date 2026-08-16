-- 1. PROVENANCE OF THE TEXT ON A LIBRARY ROW.
--
-- A hint Anne WROTE and a hint a drafting agent wrote that Anne APPROVED UNCHANGED are both
-- approved by her, and only one is in her words. `approvedBy: Anne` reads identically for both.
-- NULL here means UNKNOWN, never ABSENT: an entry whose source cannot be seen is unknown, which is
-- the distinction Cowork lost when it treated absence on its own disk as evidence.
ALTER TABLE "Misconception" ADD COLUMN "textProvenance" JSONB;

-- 2. MIGRATION ORDER, CORRECTED.
--
-- `20260816122500_addendum_36_and_write_log_no_default` DROPS the default on ContentWriteLog.at;
-- `20260816125500_write_log_utc` SETS it. I hand-picked both timestamps and got them the wrong way
-- round, so replaying the migration history converges on the UTC expression default while this
-- database has none.
--
-- THE LIVE DATABASE WAS RIGHT AND THE HISTORY WAS WRONG, which is the worse direction: every check
-- in this repo reads the live database, so `check:db-invariants` passed 13 of 13 while a database
-- REBUILT FROM MIGRATIONS would have failed that exact invariant. A record that does not reproduce
-- the state it describes is R80's family — the instrument was fine and the thing it measures
-- against had drifted.
--
-- Restated LAST so replay and reality converge. Not a new decision: R83's decision, in the right
-- order this time.
ALTER TABLE "ContentWriteLog" ALTER COLUMN "at" DROP DEFAULT;
