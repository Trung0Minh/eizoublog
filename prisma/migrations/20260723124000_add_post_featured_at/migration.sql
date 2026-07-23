-- Add featured timestamp for admin-curated homepage posts.
ALTER TABLE "posts" ADD COLUMN "featuredAt" TIMESTAMP(3);

CREATE INDEX "posts_status_featuredAt_publishedAt_idx"
  ON "posts"("status", "featuredAt" DESC, "publishedAt" DESC);
