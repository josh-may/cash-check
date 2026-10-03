-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plaidItemId" TEXT NOT NULL,
    "plaidTransactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "isoCurrencyCode" TEXT,
    "unofficialCurrencyCode" TEXT,
    "category" TEXT NOT NULL,
    "categoryId" TEXT,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "merchantName" TEXT,
    "pending" BOOLEAN NOT NULL,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "category", "categoryId", "createdAt", "date", "id", "isoCurrencyCode", "merchantName", "name", "pending", "plaidItemId", "plaidTransactionId", "unofficialCurrencyCode", "updatedAt") SELECT "accountId", "amount", "category", "categoryId", "createdAt", "date", "id", "isoCurrencyCode", "merchantName", "name", "pending", "plaidItemId", "plaidTransactionId", "unofficialCurrencyCode", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "Transaction"("plaidTransactionId");
CREATE INDEX "Transaction_plaidItemId_idx" ON "Transaction"("plaidItemId");
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
