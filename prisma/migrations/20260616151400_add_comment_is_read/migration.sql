-- AlterTable
ALTER TABLE "comments" ADD COLUMN "authorId" TEXT;
ALTER TABLE "comments" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
