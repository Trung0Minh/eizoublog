CREATE TYPE "NewsletterBroadcastStatus" AS ENUM (
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'PARTIAL',
  'FAILED'
);

CREATE TYPE "NewsletterRecipientStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'FAILED'
);

CREATE TABLE "newsletter_broadcasts" (
  "id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "previewText" TEXT,
  "customBody" TEXT,
  "featuredCoverUrl" TEXT,
  "featuredExcerpt" TEXT,
  "featuredTitle" TEXT,
  "featuredUrl" TEXT,
  "status" "NewsletterBroadcastStatus" NOT NULL DEFAULT 'QUEUED',
  "totalCount" INTEGER NOT NULL DEFAULT 0,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "newsletter_broadcasts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "newsletter_broadcast_recipients" (
  "id" TEXT NOT NULL,
  "broadcastId" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "unsubscribeUrl" TEXT NOT NULL,
  "status" "NewsletterRecipientStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "newsletter_broadcast_recipients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "newsletter_broadcasts_status_createdAt_idx"
  ON "newsletter_broadcasts"("status", "createdAt" ASC);

CREATE INDEX "newsletter_broadcast_recipients_status_nextAttemptAt_claimedAt_idx"
  ON "newsletter_broadcast_recipients"("status", "nextAttemptAt", "claimedAt");

CREATE INDEX "newsletter_broadcast_recipients_broadcastId_status_idx"
  ON "newsletter_broadcast_recipients"("broadcastId", "status");

CREATE UNIQUE INDEX "newsletter_broadcast_recipients_broadcastId_subscriberId_key"
  ON "newsletter_broadcast_recipients"("broadcastId", "subscriberId");

ALTER TABLE "newsletter_broadcast_recipients"
  ADD CONSTRAINT "newsletter_broadcast_recipients_broadcastId_fkey"
  FOREIGN KEY ("broadcastId") REFERENCES "newsletter_broadcasts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "newsletter_broadcast_recipients"
  ADD CONSTRAINT "newsletter_broadcast_recipients_subscriberId_fkey"
  FOREIGN KEY ("subscriberId") REFERENCES "newsletter_subscribers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.newsletter_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_broadcast_recipients ENABLE ROW LEVEL SECURITY;
