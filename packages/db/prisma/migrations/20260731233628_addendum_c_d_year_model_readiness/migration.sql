-- ADDENDUM-D §1: yearGroup (static, goes stale every 1 September) becomes
-- yearGroupAtCapture + capturedAcademicYear, from which the effective year
-- group is always DERIVED (core/year.ts). Hand-written so existing children
-- keep their data: the capture year is inferred from when the row was created
-- (September–December capture belongs to that calendar year's academic year;
-- January–August belongs to the previous one).

ALTER TABLE "ChildProfile" ADD COLUMN "yearGroupAtCapture" INTEGER;
ALTER TABLE "ChildProfile" ADD COLUMN "capturedAcademicYear" INTEGER;

UPDATE "ChildProfile" SET
  "yearGroupAtCapture" = "yearGroup",
  "capturedAcademicYear" = CASE
    WHEN EXTRACT(MONTH FROM "createdAt") >= 9 THEN EXTRACT(YEAR FROM "createdAt")::int
    ELSE EXTRACT(YEAR FROM "createdAt")::int - 1
  END;

ALTER TABLE "ChildProfile" ALTER COLUMN "yearGroupAtCapture" SET NOT NULL;
ALTER TABLE "ChildProfile" ALTER COLUMN "capturedAcademicYear" SET NOT NULL;
ALTER TABLE "ChildProfile" DROP COLUMN "yearGroup";

-- ADDENDUM-C §5: the nightly readiness picture (parent-facing only).
CREATE TABLE "ReadinessSnapshot" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "blueprintId" TEXT NOT NULL,
  "coveragePct" INTEGER NOT NULL,
  "crackedPct" INTEGER NOT NULL,
  "transferPct" INTEGER NOT NULL,
  "tier" INTEGER NOT NULL,
  "intensityColumn" TEXT NOT NULL,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadinessSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReadinessSnapshot_childId_district_computedAt_idx"
  ON "ReadinessSnapshot"("childId", "district", "computedAt");

ALTER TABLE "ReadinessSnapshot" ADD CONSTRAINT "ReadinessSnapshot_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
