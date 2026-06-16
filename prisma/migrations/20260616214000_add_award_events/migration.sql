-- CreateEnum
CREATE TYPE "AwardEventStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AwardEventRoomStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "AwardEventRoomVisibility" AS ENUM ('PRIVATE', 'PARTICIPANTS');

-- CreateTable
CREATE TABLE "award_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "intro" JSONB,
    "introText" TEXT,
    "coverUrl" TEXT,
    "coverAlt" TEXT,
    "status" "AwardEventStatus" NOT NULL DEFAULT 'DRAFT',
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "finalPostId" TEXT,
    "categoryId" TEXT,

    CONSTRAINT "award_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_event_rooms" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "writerId" TEXT NOT NULL,
    "writerIntro" TEXT,
    "content" JSONB NOT NULL,
    "contentText" TEXT,
    "visibility" "AwardEventRoomVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "AwardEventRoomStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "excludedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "award_event_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_event_room_comments" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "award_event_room_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_event_tags" (
    "eventId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "award_event_tags_pkey" PRIMARY KEY ("eventId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "award_events_slug_key" ON "award_events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "award_events_finalPostId_key" ON "award_events"("finalPostId");

-- CreateIndex
CREATE INDEX "award_events_status_createdAt_idx" ON "award_events"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "award_events_createdById_idx" ON "award_events"("createdById");

-- CreateIndex
CREATE INDEX "award_events_categoryId_idx" ON "award_events"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "award_event_rooms_eventId_writerId_key" ON "award_event_rooms"("eventId", "writerId");

-- CreateIndex
CREATE INDEX "award_event_rooms_eventId_status_order_idx" ON "award_event_rooms"("eventId", "status", "order");

-- CreateIndex
CREATE INDEX "award_event_rooms_writerId_updatedAt_idx" ON "award_event_rooms"("writerId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "award_event_room_comments_roomId_createdAt_idx" ON "award_event_room_comments"("roomId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "award_event_room_comments_authorId_createdAt_idx" ON "award_event_room_comments"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "award_event_tags_tagId_idx" ON "award_event_tags"("tagId");

-- AddForeignKey
ALTER TABLE "award_events" ADD CONSTRAINT "award_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_events" ADD CONSTRAINT "award_events_finalPostId_fkey" FOREIGN KEY ("finalPostId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_events" ADD CONSTRAINT "award_events_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_event_rooms" ADD CONSTRAINT "award_event_rooms_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "award_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_event_rooms" ADD CONSTRAINT "award_event_rooms_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_event_room_comments" ADD CONSTRAINT "award_event_room_comments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "award_event_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_event_room_comments" ADD CONSTRAINT "award_event_room_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_event_tags" ADD CONSTRAINT "award_event_tags_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "award_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_event_tags" ADD CONSTRAINT "award_event_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.award_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_event_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_event_room_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_event_tags ENABLE ROW LEVEL SECURITY;
