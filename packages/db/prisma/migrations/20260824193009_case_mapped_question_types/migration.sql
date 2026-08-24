-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "mappedQuestionTypeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
