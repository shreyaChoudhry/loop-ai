/*
  Warnings:

  - The values [RESOLVED] on the enum `FeedbackStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FeedbackStatus_new" AS ENUM ('NEW', 'REVIEWED', 'ACTIONED');
ALTER TABLE "public"."Feedback" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Feedback" ALTER COLUMN "status" TYPE "FeedbackStatus_new" USING ("status"::text::"FeedbackStatus_new");
ALTER TYPE "FeedbackStatus" RENAME TO "FeedbackStatus_old";
ALTER TYPE "FeedbackStatus_new" RENAME TO "FeedbackStatus";
DROP TYPE "public"."FeedbackStatus_old";
ALTER TABLE "Feedback" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;
