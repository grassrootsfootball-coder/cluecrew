-- The naming path for the web signature door: a staff account resolves to a named Reviewer, or
-- the action refuses. Never a role account.
ALTER TABLE "Reviewer" ADD COLUMN "staffEmail" TEXT;
CREATE UNIQUE INDEX "Reviewer_staffEmail_key" ON "Reviewer"("staffEmail");
