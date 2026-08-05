-- CreateTable
CREATE TABLE "NvrTemplateSignature" (
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "signedBy" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sampleSheetHash" TEXT NOT NULL,
    "lastDriftCheckAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "NvrTemplateSignature_pkey" PRIMARY KEY ("templateId","version")
);
