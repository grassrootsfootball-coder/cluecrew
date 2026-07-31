-- Addendum D §2 new-case pacing needs to know when each case opened.
ALTER TABLE "CaseFile" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
