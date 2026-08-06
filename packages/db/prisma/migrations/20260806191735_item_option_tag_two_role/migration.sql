-- CreateEnum
CREATE TYPE "MisconceptionTagRole" AS ENUM ('TOPIC', 'PROCESS');

-- CreateTable
CREATE TABLE "ItemOptionTag" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "misconceptionId" TEXT NOT NULL,
    "role" "MisconceptionTagRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemOptionTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemOptionTag_misconceptionId_idx" ON "ItemOptionTag"("misconceptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemOptionTag_optionId_role_key" ON "ItemOptionTag"("optionId", "role");

-- AddForeignKey
ALTER TABLE "ItemOptionTag" ADD CONSTRAINT "ItemOptionTag_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ItemOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOptionTag" ADD CONSTRAINT "ItemOptionTag_misconceptionId_fkey" FOREIGN KEY ("misconceptionId") REFERENCES "Misconception"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
