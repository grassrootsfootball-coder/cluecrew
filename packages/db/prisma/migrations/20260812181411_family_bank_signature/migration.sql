-- CreateTable
CREATE TABLE "FamilyBankSignature" (
    "familyId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankHash" TEXT NOT NULL,
    "entryHashes" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "FamilyBankSignature_pkey" PRIMARY KEY ("familyId")
);
