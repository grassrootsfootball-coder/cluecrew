-- ADDENDUM 36: the two lines the execution note turns on.
ALTER TABLE "ItemOption"
    ADD COLUMN "attractorLine" INTEGER,
    ADD COLUMN "defeaterLine"  INTEGER;

-- THE WRITE LOG'S DEFAULT IS REMOVED, NOT RESTORED TO UTC.
--
-- Prisma cannot express `now() AT TIME ZONE 'UTC'`, so it read its own `@default(now())` as the
-- truth and reverted the column default to CURRENT_TIMESTAMP on the next `migrate dev` -- putting
-- back the local-time source of R80's 345 false "a change nobody decided" reports, forty minutes
-- after that entry was written. Nothing broke ONLY because the trigger sets `at` explicitly.
--
-- Setting it back to UTC would drift again on the next migration. Removing it leaves no fallback
-- at all: the trigger supplies the value, and an insert that does not is an error rather than a
-- silently local-time row.
ALTER TABLE "ContentWriteLog" ALTER COLUMN "at" DROP DEFAULT;
