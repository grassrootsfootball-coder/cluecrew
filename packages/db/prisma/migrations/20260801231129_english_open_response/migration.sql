-- CreateEnum
CREATE TYPE "EnglishCreditModel" AS ENUM ('POINT', 'GRADUATED');

-- CreateEnum
CREATE TYPE "EnglishSampleStatus" AS ENUM ('SAMPLED', 'ACTIONED', 'DISMISSED');

-- CreateTable
CREATE TABLE "EnglishOpenResponse" (
    "itemId" TEXT NOT NULL,
    "passageRef" TEXT NOT NULL,
    "lineRefs" JSONB NOT NULL,
    "tariff" INTEGER NOT NULL,
    "requiredPoints" INTEGER,
    "acceptableAnswers" JSONB NOT NULL,
    "creditModel" "EnglishCreditModel" NOT NULL DEFAULT 'POINT',
    "bands" JSONB NOT NULL,
    "evidenceCapRule" BOOLEAN NOT NULL DEFAULT false,
    "ownWordsRequired" BOOLEAN NOT NULL DEFAULT false,
    "spagRider" INTEGER,
    "spagRiderLabel" TEXT,
    "spagRiderChecks" JSONB,
    "misconceptionIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnglishOpenResponse_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "EnglishUnmatchedAnswer" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "normalisedAnswer" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "bestCoverage" DOUBLE PRECISION NOT NULL,
    "reasons" TEXT[],
    "status" "EnglishSampleStatus" NOT NULL DEFAULT 'SAMPLED',
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purgeAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnglishUnmatchedAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnglishUnmatchedAnswer_itemId_status_createdAt_idx" ON "EnglishUnmatchedAnswer"("itemId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EnglishUnmatchedAnswer_purgeAt_idx" ON "EnglishUnmatchedAnswer"("purgeAt");

-- AddForeignKey
ALTER TABLE "EnglishOpenResponse" ADD CONSTRAINT "EnglishOpenResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnglishUnmatchedAnswer" ADD CONSTRAINT "EnglishUnmatchedAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
