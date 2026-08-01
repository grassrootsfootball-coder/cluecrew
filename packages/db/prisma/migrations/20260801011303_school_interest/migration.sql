-- Amendment 1 §1: Schools register-interest (demand measurement only).
CREATE TABLE "SchoolInterest" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "school" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchoolInterest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SchoolInterest_email_key" ON "SchoolInterest"("email");
