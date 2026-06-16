DO $$
BEGIN
    CREATE TYPE "CoAuthorStatus" AS ENUM ('PENDING', 'ACCEPTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "post_authors"
ADD COLUMN IF NOT EXISTS "status" "CoAuthorStatus" NOT NULL DEFAULT 'PENDING';
