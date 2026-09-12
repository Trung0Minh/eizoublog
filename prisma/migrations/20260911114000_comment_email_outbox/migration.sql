-- CreateTable
CREATE TABLE "comment_email_deliveries" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postTitle" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "firstAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_email_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_email_deliveries_status_nextAttemptAt_claimedAt_idx" ON "comment_email_deliveries"("status", "nextAttemptAt", "claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "comment_email_deliveries_commentId_to_key" ON "comment_email_deliveries"("commentId", "to");

-- Notification payloads contain private recipient addresses; server access only.
ALTER TABLE public.comment_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.comment_email_deliveries FROM PUBLIC, anon, authenticated;
