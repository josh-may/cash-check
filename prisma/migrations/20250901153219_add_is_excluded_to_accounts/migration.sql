-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "tag" TEXT NOT NULL DEFAULT 'Main',
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("availableBalance", "createdAt", "currentBalance", "id", "isoCurrencyCode", "mask", "name", "officialName", "plaidAccountId", "plaidItemId", "subtype", "tag", "type", "updatedAt") SELECT "availableBalance", "createdAt", "currentBalance", "id", "isoCurrencyCode", "mask", "name", "officialName", "plaidAccountId", "plaidItemId", "subtype", "tag", "type", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_plaidAccountId_key" ON "Account"("plaidAccountId");
CREATE INDEX "Account_plaidItemId_idx" ON "Account"("plaidItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
