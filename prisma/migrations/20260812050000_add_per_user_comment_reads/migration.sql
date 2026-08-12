CREATE TABLE "comment_reads" (
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reads_pkey" PRIMARY KEY ("commentId","userId")
);

CREATE INDEX "comment_reads_userId_readAt_idx" ON "comment_reads"("userId", "readAt");

ALTER TABLE "comment_reads"
ADD CONSTRAINT "comment_reads_commentId_fkey"
FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reads"
ADD CONSTRAINT "comment_reads_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
