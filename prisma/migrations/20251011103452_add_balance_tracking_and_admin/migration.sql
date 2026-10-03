-- Add balance tracking and admin features
-- This migration adds: isSuperAdmin to User, status to PlaidItem, minimumBalance to Account, and Balance model

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Step 1: Add isSuperAdmin to User table
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stripeCurrentPeriodEnd" DATETIME,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "stripeSubscriptionId" TEXT
);

INSERT INTO "new_User" (
    "id", "email", "firstName", "lastName", "password", "hasPaid",
    "createdAt", "updatedAt", "stripeCurrentPeriodEnd",
    "stripeCustomerId", "stripePriceId", "stripeSubscriptionId"
)
SELECT
    "id", "email", "firstName", "lastName", "password", "hasPaid",
    "createdAt", "updatedAt", "stripeCurrentPeriodEnd",
    "stripeCustomerId", "stripePriceId", "stripeSubscriptionId"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- Step 2: Add status to PlaidItem table
CREATE TABLE "new_PlaidItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'good',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "PlaidItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_PlaidItem" (
    "id", "userId", "accessToken", "itemId",
    "createdAt", "updatedAt", "lastSyncedAt"
)
SELECT
    "id", "userId", "accessToken", "itemId",
    "createdAt", "updatedAt", "lastSyncedAt"
FROM "PlaidItem";

DROP TABLE "PlaidItem";
ALTER TABLE "new_PlaidItem" RENAME TO "PlaidItem";

CREATE UNIQUE INDEX "PlaidItem_itemId_key" ON "PlaidItem"("itemId");
CREATE INDEX "PlaidItem_userId_idx" ON "PlaidItem"("userId");

-- Step 3: Add minimumBalance to Account table
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plaidItemId" TEXT NOT NULL,
    "plaidAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "mask" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "currentBalance" REAL,
    "availableBalance" REAL,
    "isoCurrencyCode" TEXT,
    "minimumBalance" REAL,
    "tag" TEXT NOT NULL DEFAULT 'Main',
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Account" (
    "id", "plaidItemId", "plaidAccountId", "name", "officialName", "mask",
    "type", "subtype", "currentBalance", "availableBalance", "isoCurrencyCode",
    "tag", "isExcluded", "createdAt", "updatedAt"
)
SELECT
    "id", "plaidItemId", "plaidAccountId", "name", "officialName", "mask",
    "type", "subtype", "currentBalance", "availableBalance", "isoCurrencyCode",
    "tag", "isExcluded", "createdAt", "updatedAt"
FROM "Account";

DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";

CREATE UNIQUE INDEX "Account_plaidAccountId_key" ON "Account"("plaidAccountId");
CREATE INDEX "Account_plaidItemId_idx" ON "Account"("plaidItemId");

-- Step 4: Create Balance table
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "month" DATETIME NOT NULL,
    "balance" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Balance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Balance_accountId_month_key" ON "Balance"("accountId", "month");
CREATE INDEX "Balance_accountId_idx" ON "Balance"("accountId");
CREATE INDEX "Balance_month_idx" ON "Balance"("month");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
