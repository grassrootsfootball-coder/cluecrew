-- AlterTable
ALTER TABLE "AttributionEvent" ADD COLUMN     "reviewerId" TEXT;

-- CreateTable
CREATE TABLE "Reviewer" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "resolvesActor" TEXT,
    "heldFrom" TIMESTAMP(3) NOT NULL,
    "heldUntil" TIMESTAMP(3),
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reviewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reviewer_resolvesActor_heldFrom_idx" ON "Reviewer"("resolvesActor", "heldFrom");

-- AddForeignKey
ALTER TABLE "AttributionEvent" ADD CONSTRAINT "AttributionEvent_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
