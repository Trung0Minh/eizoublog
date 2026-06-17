ALTER TABLE "award_event_rooms"
ADD COLUMN IF NOT EXISTS "postId" TEXT;

CREATE INDEX IF NOT EXISTS "award_event_rooms_postId_idx"
ON "award_event_rooms"("postId");

ALTER TABLE "award_event_rooms"
ADD CONSTRAINT "award_event_rooms_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
