-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('TRAINEE', 'JUNIOR_DETECTIVE', 'DETECTIVE', 'SENIOR_DETECTIVE', 'CHIEF_INSPECTOR');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('TWO_YEAR', 'ONE_YEAR', 'SUMMER');

-- CreateEnum
CREATE TYPE "District" AS ENUM ('VR', 'NVR', 'MATHS', 'ENGLISH');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'REVIEWED', 'LIVE', 'RETIRED');

-- CreateTable
CREATE TABLE "ParentAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "displayName" TEXT NOT NULL,
    "regionCode" TEXT,
    "targetSchools" JSONB,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ParentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "crewName" TEXT NOT NULL,
    "yearGroup" INTEGER NOT NULL,
    "examYear" INTEGER,
    "settings" JSONB NOT NULL,
    "rank" "Rank" NOT NULL DEFAULT 'TRAINEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentEvent" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubId" TEXT,
    "status" TEXT NOT NULL,
    "commitmentEndsAt" TIMESTAMP(3),
    "renewalReminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionType" (
    "id" TEXT NOT NULL,
    "district" "District" NOT NULL,
    "name" TEXT NOT NULL,
    "glCode" TEXT,
    "mechanic" TEXT NOT NULL,

    CONSTRAINT "QuestionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "questionTypeId" TEXT NOT NULL,
    "difficultyTier" INTEGER NOT NULL,
    "calibratedDifficulty" DOUBLE PRECISION,
    "stem" JSONB NOT NULL,
    "explanation" JSONB NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT',
    "authoredBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOption" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "misconceptionId" TEXT,

    CONSTRAINT "ItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Misconception" (
    "id" TEXT NOT NULL,
    "district" "District" NOT NULL,
    "description" TEXT NOT NULL,
    "childHint" TEXT NOT NULL,

    CONSTRAINT "Misconception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "questionTypeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "narrativeIntro" JSONB NOT NULL,
    "modes" JSONB NOT NULL,
    "orderInDistrict" INTEGER NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFile" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),

    CONSTRAINT "CaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "chosenOptionId" TEXT,
    "correct" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "unitKind" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "intervalDays" DOUBLE PRECISION NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.3,
    "lapses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "headword" TEXT NOT NULL,
    "definitionChild" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "rootFamily" TEXT,
    "imageRef" TEXT,
    "tier" INTEGER NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordVaultEntry" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "WordVaultEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "secondsActive" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "childId" TEXT,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "props" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateDailyStat" (
    "id" TEXT NOT NULL,
    "district" "District" NOT NULL,
    "questionTypeId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "attempts" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,

    CONSTRAINT "AggregateDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentAccount_email_key" ON "ParentAccount"("email");

-- CreateIndex
CREATE INDEX "ParentAccount_deletedAt_idx" ON "ParentAccount"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_parentId_key" ON "Subscription"("parentId");

-- CreateIndex
CREATE INDEX "Item_questionTypeId_status_idx" ON "Item"("questionTypeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CaseFile_childId_caseId_key" ON "CaseFile"("childId", "caseId");

-- CreateIndex
CREATE INDEX "Attempt_childId_createdAt_idx" ON "Attempt"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewSchedule_childId_dueAt_idx" ON "ReviewSchedule"("childId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_childId_unitKind_unitId_key" ON "ReviewSchedule"("childId", "unitKind", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "WordVaultEntry_childId_wordId_key" ON "WordVaultEntry"("childId", "wordId");

-- CreateIndex
CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");

-- CreateIndex
CREATE INDEX "Event_childId_createdAt_idx" ON "Event"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_parentId_createdAt_idx" ON "Event"("parentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AggregateDailyStat_district_questionTypeId_day_key" ON "AggregateDailyStat"("district", "questionTypeId", "day");

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentEvent" ADD CONSTRAINT "ConsentEvent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_questionTypeId_fkey" FOREIGN KEY ("questionTypeId") REFERENCES "QuestionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOption" ADD CONSTRAINT "ItemOption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOption" ADD CONSTRAINT "ItemOption_misconceptionId_fkey" FOREIGN KEY ("misconceptionId") REFERENCES "Misconception"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_questionTypeId_fkey" FOREIGN KEY ("questionTypeId") REFERENCES "QuestionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordVaultEntry" ADD CONSTRAINT "WordVaultEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordVaultEntry" ADD CONSTRAINT "WordVaultEntry_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
