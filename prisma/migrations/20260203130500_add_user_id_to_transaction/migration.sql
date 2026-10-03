-- Add userId to Transaction and backfill from PlaidItem ownership.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plaidItemId" TEXT,
    "userId" TEXT,
    "plaidTransactionId" TEXT,
    "accountId" TEXT,
    "tag" TEXT,
    "amount" REAL NOT NULL,
    "isoCurrencyCode" TEXT,
    "unofficialCurrencyCode" TEXT,
    "category" TEXT,
    "categoryId" TEXT,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "merchantName" TEXT,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'plaid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Transaction" (
    "id",
    "plaidItemId",
    "userId",
    "plaidTransactionId",
    "accountId",
    "tag",
    "amount",
    "isoCurrencyCode",
    "unofficialCurrencyCode",
    "category",
    "categoryId",
    "date",
    "name",
    "merchantName",
    "pending",
    "isExcluded",
    "source",
    "createdAt",
    "updatedAt"
)
SELECT
    t."id",
    t."plaidItemId",
    (
      SELECT p."userId"
      FROM "PlaidItem" p
      WHERE p."id" = t."plaidItemId"
    ) AS "userId",
    t."plaidTransactionId",
    t."accountId",
    t."tag",
    t."amount",
    t."isoCurrencyCode",
    t."unofficialCurrencyCode",
    t."category",
    t."categoryId",
    t."date",
    t."name",
    t."merchantName",
    t."pending",
    t."isExcluded",
    t."source",
    t."createdAt",
    t."updatedAt"
FROM "Transaction" t;

DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";

CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "Transaction"("plaidTransactionId");
CREATE INDEX "Transaction_plaidItemId_idx" ON "Transaction"("plaidItemId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX "Transaction_tag_idx" ON "Transaction"("tag");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
