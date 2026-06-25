CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

CREATE INDEX "invites_createdById_idx" ON "invites"("createdById");

CREATE INDEX "comments_authorId_createdAt_idx" ON "comments"("authorId", "createdAt" DESC);

CREATE INDEX "newsletter_broadcast_recipients_subscriberId_idx"
  ON "newsletter_broadcast_recipients"("subscriberId");
