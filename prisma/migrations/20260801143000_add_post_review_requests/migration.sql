ALTER TYPE "NotificationType" ADD VALUE 'POST_REVIEW_DECISION';
ALTER TYPE "NotificationType" ADD VALUE 'POST_REVIEW_REQUEST';

CREATE TYPE "PostReviewRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE "PostReviewRequestContext" AS ENUM ('NORMAL_POST', 'AWARD_EVENT_ROOM');

CREATE TABLE "post_review_requests" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "PostReviewRequestStatus" NOT NULL DEFAULT 'PENDING',
    "context" "PostReviewRequestContext" NOT NULL,
    "eventId" TEXT,
    "eventRoomId" TEXT,
    "snapshot" JSONB NOT NULL,
    "requestedPostVersion" INTEGER NOT NULL,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_review_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "post_review_requests_postId_status_createdAt_idx" ON "post_review_requests"("postId", "status", "createdAt" DESC);
CREATE INDEX "post_review_requests_requesterId_status_createdAt_idx" ON "post_review_requests"("requesterId", "status", "createdAt" DESC);
CREATE INDEX "post_review_requests_status_createdAt_idx" ON "post_review_requests"("status", "createdAt" DESC);

ALTER TABLE "post_review_requests" ADD CONSTRAINT "post_review_requests_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_review_requests" ADD CONSTRAINT "post_review_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_review_requests" ADD CONSTRAINT "post_review_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
