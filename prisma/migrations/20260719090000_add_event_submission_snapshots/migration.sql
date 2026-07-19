ALTER TABLE "award_event_rooms"
ADD COLUMN "submittedContent" JSONB,
ADD COLUMN "submittedPostId" TEXT,
ADD COLUMN "submittedPostTitle" TEXT,
ADD COLUMN "submittedPostVersion" INTEGER,
ADD COLUMN "submittedWriterIntro" TEXT;

UPDATE "award_event_rooms" AS room
SET
  "submittedContent" = post."content",
  "submittedPostId" = post."id",
  "submittedPostTitle" = post."title",
  "submittedPostVersion" = post."version",
  "submittedWriterIntro" = NULLIF(BTRIM(room."writerIntro"), '')
FROM "posts" AS post
WHERE
  room."status" = 'SUBMITTED'
  AND room."postId" = post."id";
