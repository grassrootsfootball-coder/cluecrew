-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_chosenOptionId_fkey" FOREIGN KEY ("chosenOptionId") REFERENCES "ItemOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
