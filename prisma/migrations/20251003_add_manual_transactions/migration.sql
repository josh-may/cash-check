-- AlterTable: Make Transaction fields nullable for manual transactions
-- This is a SAFE migration that preserves all existing data

-- Step 1: Create a new table with the updated schema
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plaidItemId" TEXT,
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
    CONSTRAINT "Transaction_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 2: Copy ALL existing data (this preserves everything)
INSERT INTO "new_Transaction" (
    "id",
    "plaidItemId",
    "plaidTransactionId",
    "accountId",
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
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "plaidItemId",
    "plaidTransactionId",
    "accountId",
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
    "createdAt",
    "updatedAt"
FROM "Transaction";

-- Step 3: Drop old table and rename new one
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";

-- Step 4: Recreate indexes
CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "Transaction"("plaidTransactionId");
CREATE INDEX "Transaction_plaidItemId_idx" ON "Transaction"("plaidItemId");
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX "Transaction_tag_idx" ON "Transaction"("tag");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
