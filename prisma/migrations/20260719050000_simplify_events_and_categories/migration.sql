ALTER TABLE "award_events" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "AwardEventStatus_new" AS ENUM ('OPEN', 'CLOSED');

ALTER TABLE "award_events"
ALTER COLUMN "status" TYPE "AwardEventStatus_new"
USING (
  CASE
    WHEN "status"::text IN ('CLOSED', 'ARCHIVED') THEN 'CLOSED'
    ELSE 'OPEN'
  END
)::"AwardEventStatus_new";

DROP TYPE "AwardEventStatus";
ALTER TYPE "AwardEventStatus_new" RENAME TO "AwardEventStatus";

ALTER TABLE "award_events"
  ALTER COLUMN "status" SET DEFAULT 'OPEN',
  DROP COLUMN "publishedAt";

DROP INDEX IF EXISTS "categories_parentId_name_idx";
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_parentId_fkey";
ALTER TABLE "categories" DROP COLUMN "parentId";
