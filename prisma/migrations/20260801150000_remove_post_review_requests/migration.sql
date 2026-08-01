DELETE FROM "notifications"
WHERE "type" IN ('POST_REVIEW_REQUEST', 'POST_REVIEW_DECISION');

DROP TABLE IF EXISTS "post_review_requests";

DROP TYPE IF EXISTS "PostReviewRequestStatus";
DROP TYPE IF EXISTS "PostReviewRequestContext";
