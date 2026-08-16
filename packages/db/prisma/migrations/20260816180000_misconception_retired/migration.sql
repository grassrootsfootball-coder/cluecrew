-- An entry that WAS active and has been superseded. Distinct from REJECTED, which was never
-- approved. Cowork recorded retirement as an object while this store read `status`, so a
-- retirement was invisible here.
ALTER TYPE "MisconceptionStatus" ADD VALUE 'RETIRED';
