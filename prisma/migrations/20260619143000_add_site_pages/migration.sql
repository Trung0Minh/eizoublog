-- CreateTable
CREATE TABLE IF NOT EXISTS "site_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "contentText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_slug_key" ON "site_pages"("slug");

-- Keep editable public pages under the same RLS posture as other public tables.
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
