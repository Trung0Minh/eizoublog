-- CreateEnum
CREATE TYPE "PostRevisionKind" AS ENUM ('AUTO_CHECKPOINT', 'BASELINE', 'DELETE_GUARD', 'MANUAL_SAVE', 'PUBLISH', 'RESTORE');

-- CreateEnum
CREATE TYPE "PostAuditAction" AS ENUM ('CONFLICT', 'DELETE', 'MODERATION', 'PURGE', 'RESTORE', 'SAVE');

-- CreateEnum
CREATE TYPE "DurabilitySeverity" AS ENUM ('CRITICAL', 'HEALTHY', 'UNKNOWN', 'WARNING');

-- CreateEnum
CREATE TYPE "MediaCleanupStatus" AS ENUM ('COMPLETE', 'FAILED', 'PENDING');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'DURABILITY_ALERT';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "posts"
SET "removedAt" = "updatedAt"
WHERE "status" = 'REMOVED'::"PostStatus";

-- CreateTable
CREATE TABLE "post_revisions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "sourceVersion" INTEGER NOT NULL,
    "kind" "PostRevisionKind" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "post_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_audit_events" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "PostAuditAction" NOT NULL,
    "sourceVersion" INTEGER,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "durability_status" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "severity" "DurabilitySeverity" NOT NULL DEFAULT 'UNKNOWN',
    "databaseBytes" BIGINT,
    "capacityBytes" BIGINT,
    "latestBackupAt" TIMESTAMP(3),
    "latestMediaBackupAt" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issues" JSONB NOT NULL,

    CONSTRAINT "durability_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_cleanup_jobs" (
    "id" TEXT NOT NULL,
    "objectKeys" JSONB NOT NULL,
    "status" "MediaCleanupStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_cleanup_jobs_pkey" PRIMARY KEY ("id")
);

-- These tables are server-internal. RLS without policies keeps them inaccessible
-- through Supabase's public data API while Prisma's database role can still use them.
ALTER TABLE "post_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "durability_status" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_cleanup_jobs" ENABLE ROW LEVEL SECURITY;

-- CreateIndex
CREATE INDEX "post_revisions_postId_createdAt_idx" ON "post_revisions"("postId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "post_revisions_expiresAt_idx" ON "post_revisions"("expiresAt");

-- CreateIndex
CREATE INDEX "post_audit_events_postId_createdAt_idx" ON "post_audit_events"("postId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "post_audit_events_action_createdAt_idx" ON "post_audit_events"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "media_cleanup_jobs_status_nextAttemptAt_idx" ON "media_cleanup_jobs"("status", "nextAttemptAt");

-- Seed a recovery point for every post that exists when durability protection is enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH baseline AS (
    SELECT
        "id",
        "version",
        jsonb_build_object(
            'title', "title",
            'slug', "slug",
            'excerpt', "excerpt",
            'coverUrl', "coverUrl",
            'coverAlt', "coverAlt",
            'content', "content",
            'contentText', "contentText",
            'status', "status",
            'draftVisibility', "draftVisibility",
            'publishedAt', "publishedAt",
            'moderationLockedAt', "moderationLockedAt",
            'removedFromStatus', "removedFromStatus",
            'removedAt', "removedAt",
            'lastSavedAt', "lastSavedAt",
            'authorId', "authorId",
            'categoryId', "categoryId",
            'version', "version"
        ) AS snapshot
    FROM "posts"
)
INSERT INTO "post_revisions" (
    "id", "postId", "sourceVersion", "kind", "snapshot", "checksum", "actorId", "expiresAt"
)
SELECT
    gen_random_uuid()::text,
    "id",
    "version",
    'BASELINE'::"PostRevisionKind",
    snapshot,
    encode(digest(snapshot::text, 'sha256'), 'hex'),
    NULL,
    NULL
FROM baseline;

INSERT INTO "durability_status" ("id", "severity", "checkedAt", "issues")
VALUES (
    'primary',
    'UNKNOWN'::"DurabilitySeverity",
    CURRENT_TIMESTAMP,
    '["Durability monitoring is not configured"]'::jsonb
);

-- This guard remains effective even if a future code path bypasses the normal API.
CREATE OR REPLACE FUNCTION capture_post_recovery_revision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    recovery_snapshot jsonb;
    last_checkpoint timestamp(3);
BEGIN
    recovery_snapshot := jsonb_build_object(
        'title', OLD."title",
        'slug', OLD."slug",
        'excerpt', OLD."excerpt",
        'coverUrl', OLD."coverUrl",
        'coverAlt', OLD."coverAlt",
        'content', OLD."content",
        'contentText', OLD."contentText",
        'status', OLD."status",
        'draftVisibility', OLD."draftVisibility",
        'publishedAt', OLD."publishedAt",
        'moderationLockedAt', OLD."moderationLockedAt",
        'removedFromStatus', OLD."removedFromStatus",
        'removedAt', OLD."removedAt",
        'lastSavedAt', OLD."lastSavedAt",
        'authorId', OLD."authorId",
        'categoryId', OLD."categoryId",
        'version', OLD."version"
    );

    IF TG_OP = 'DELETE' THEN
        INSERT INTO "post_revisions" (
            "id", "postId", "sourceVersion", "kind", "snapshot", "checksum", "actorId", "expiresAt"
        ) VALUES (
            gen_random_uuid()::text,
            OLD."id",
            OLD."version",
            'DELETE_GUARD'::"PostRevisionKind",
            recovery_snapshot,
            encode(digest(recovery_snapshot::text, 'sha256'), 'hex'),
            NULL,
            NULL
        );
        RETURN OLD;
    END IF;

    IF OLD."title" IS DISTINCT FROM NEW."title"
        OR OLD."excerpt" IS DISTINCT FROM NEW."excerpt"
        OR OLD."coverUrl" IS DISTINCT FROM NEW."coverUrl"
        OR OLD."coverAlt" IS DISTINCT FROM NEW."coverAlt"
        OR OLD."content" IS DISTINCT FROM NEW."content"
        OR OLD."contentText" IS DISTINCT FROM NEW."contentText"
        OR OLD."categoryId" IS DISTINCT FROM NEW."categoryId" THEN
        SELECT MAX("createdAt") INTO last_checkpoint
        FROM "post_revisions"
        WHERE "postId" = OLD."id"
          AND "kind" = 'AUTO_CHECKPOINT'::"PostRevisionKind";

        IF last_checkpoint IS NULL OR last_checkpoint < CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN
            INSERT INTO "post_revisions" (
                "id", "postId", "sourceVersion", "kind", "snapshot", "checksum", "actorId", "expiresAt"
            ) VALUES (
                gen_random_uuid()::text,
                OLD."id",
                OLD."version",
                'AUTO_CHECKPOINT'::"PostRevisionKind",
                recovery_snapshot,
                encode(digest(recovery_snapshot::text, 'sha256'), 'hex'),
                NULL,
                CURRENT_TIMESTAMP + INTERVAL '90 days'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "posts_recovery_revision_guard"
BEFORE UPDATE OR DELETE ON "posts"
FOR EACH ROW EXECUTE FUNCTION capture_post_recovery_revision();
