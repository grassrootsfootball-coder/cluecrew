-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "reviewMethod" TEXT,
ADD COLUMN     "reviewRecordNote" TEXT,
ADD COLUMN     "reviewRecordedBy" TEXT;

-- AlterTable
ALTER TABLE "Misconception" ADD COLUMN     "approvalMethod" TEXT,
ADD COLUMN     "approvalNote" TEXT,
ADD COLUMN     "recordedBy" TEXT;

-- The distinction is enforced in the STORAGE layer, not only in the action
-- that writes it (David's ruling, 2026-08-02: "never collapsed"). A future
-- script, a console session or a second code path cannot merge the two
-- identities without the database refusing the row.
--
-- 1. A recorded decision must name whose judgement it was.
-- 2. The recorder and the decider must be different people. If they are the
--    same person, that person decided in-platform and should approve as
--    themselves — recording your own verbal approval is self-approval with
--    an extra step.
ALTER TABLE "Misconception"
  ADD CONSTRAINT "misconception_recorded_approval_named"
  CHECK ("recordedBy" IS NULL OR ("approvedBy" IS NOT NULL AND "recordedBy" <> "approvedBy"));

ALTER TABLE "Misconception"
  ADD CONSTRAINT "misconception_method_needs_approver"
  CHECK ("approvalMethod" IS NULL OR "approvedBy" IS NOT NULL);

ALTER TABLE "Item"
  ADD CONSTRAINT "item_recorded_review_named"
  CHECK ("reviewRecordedBy" IS NULL OR ("reviewedBy" IS NOT NULL AND "reviewRecordedBy" <> "reviewedBy"));

ALTER TABLE "Item"
  ADD CONSTRAINT "item_review_method_needs_reviewer"
  CHECK ("reviewMethod" IS NULL OR "reviewedBy" IS NOT NULL);
