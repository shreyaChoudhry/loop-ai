-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "code" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "User_email_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_workspaceId_email_key" ON "User"("workspaceId", "email");
