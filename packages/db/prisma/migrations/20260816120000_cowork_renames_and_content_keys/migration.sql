-- RENAMES, not drop-and-add: 78 rows hold a draft self-assessment and a generated migration would
-- have dropped the column and recreated it empty.
--
-- The test Cowork set and David ratified: does the NAME ASSERT A STATE THE WRITER COULD NOT
-- CONFER? "preReview" places the claim on the review timeline; "verdict" is what a reviewer
-- returns. Both were the conflation this whole column exists to prevent, restated as identifiers.
ALTER TABLE "Item" RENAME COLUMN "authoringPreReview" TO "draftSelfAssessment";
ALTER TABLE "Item" RENAME COLUMN "authoringPreReviewHash" TO "draftSelfAssessmentHash";

-- THE NINE CONTENT KEYS. Each holds a fact that exists nowhere else. stemRedraft carries `why`
-- (which crosses by ruling) and `before` (which does not) -- see scripts/carry-content-keys.ts
-- for why `before` is nonetheless preserved here.
ALTER TABLE "Item"
    ADD COLUMN "itemModel"                TEXT,
    ADD COLUMN "passageFlag"              TEXT,
    ADD COLUMN "r4Note"                   TEXT,
    ADD COLUMN "banListException"         JSONB,
    ADD COLUMN "banListExceptionResolved" TEXT,
    ADD COLUMN "importDoorFix"            JSONB,
    ADD COLUMN "stemRedraft"              JSONB,
    ADD COLUMN "draftingMethod"           TEXT;
