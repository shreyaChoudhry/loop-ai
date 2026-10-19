-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PublicStatus" AS ENUM ('UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'NOT_PLANNED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "apiKey" TEXT,
ADD COLUMN IF NOT EXISTS "digestEmail" TEXT,
ADD COLUMN IF NOT EXISTS "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "digestLastSentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "portalAccentColor" TEXT DEFAULT '#6655e8',
ADD COLUMN IF NOT EXISTS "portalDescription" TEXT,
ADD COLUMN IF NOT EXISTS "portalEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "portalLogoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "portalName" TEXT,
ADD COLUMN IF NOT EXISTS "showNotPlanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Request" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "status" "PublicStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "authorEmail" TEXT,
    "notifyOnUpdate" BOOLEAN NOT NULL DEFAULT true,
    "canonicalRequestId" TEXT,
    "duplicateReason" TEXT,
    "effort" INTEGER DEFAULT 3,
    "impact" INTEGER DEFAULT 3,
    "shippedAt" TIMESTAMP(3),
    "releaseNote" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Vote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "voterToken" TEXT NOT NULL,
    "voterEmail" TEXT,
    "notifyOnUpdate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "oldStatus" "PublicStatus",
    "newStatus" "PublicStatus" NOT NULL,
    "comment" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FollowUpFeedback" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "satisfied" BOOLEAN NOT NULL,
    "comment" TEXT,
    "authorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NotificationRecord" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "PublicStatus" NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Request_workspaceId_idx" ON "Request"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Request_workspaceId_status_idx" ON "Request"("workspaceId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Request_workspaceId_voteCount_idx" ON "Request"("workspaceId", "voteCount");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Request_canonicalRequestId_idx" ON "Request"("canonicalRequestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Vote_workspaceId_idx" ON "Vote"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Vote_requestId_idx" ON "Vote"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Vote_voterEmail_idx" ON "Vote"("voterEmail");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_requestId_voterToken_key" ON "Vote"("requestId", "voterToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RequestStatusHistory_requestId_idx" ON "RequestStatusHistory"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RequestStatusHistory_createdAt_idx" ON "RequestStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FollowUpFeedback_requestId_idx" ON "FollowUpFeedback"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationRecord_requestId_idx" ON "NotificationRecord"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationRecord_recipient_idx" ON "NotificationRecord"("recipient");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationRecord_requestId_recipient_status_key" ON "NotificationRecord"("requestId", "recipient", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_apiKey_key" ON "Workspace"("apiKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Workspace_slug_idx" ON "Workspace"("slug");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Request" ADD CONSTRAINT "Request_canonicalRequestId_fkey" FOREIGN KEY ("canonicalRequestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Request" ADD CONSTRAINT "Request_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Vote" ADD CONSTRAINT "Vote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Vote" ADD CONSTRAINT "Vote_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "FollowUpFeedback" ADD CONSTRAINT "FollowUpFeedback_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "NotificationRecord" ADD CONSTRAINT "NotificationRecord_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
