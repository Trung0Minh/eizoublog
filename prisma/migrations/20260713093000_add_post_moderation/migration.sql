ALTER TYPE "PostStatus" ADD VALUE 'REMOVED';

ALTER TYPE "NotificationType" ADD VALUE 'POST_MODERATION';

ALTER TABLE "posts"
ADD COLUMN "moderationLockedAt" TIMESTAMP(3),
ADD COLUMN "removedFromStatus" "PostStatus";
