ALTER TABLE "users"
ADD COLUMN "displayRoleName" TEXT,
ADD COLUMN "displayRoleColor" TEXT,
ADD COLUMN "displayRoleLocked" BOOLEAN NOT NULL DEFAULT false;
