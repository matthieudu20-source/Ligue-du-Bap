/*
  Warnings:

  - Added the required column `licenseNumber` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- Supprimer les joueurs existants car ils n'ont pas de numéro de licence
-- (Ils devront se réinscrire avec leur numéro de licence)
DELETE FROM "Player";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "singleRankingPoints" INTEGER
);
INSERT INTO "new_Player" ("createdAt", "email", "id", "nickname", "passwordHash", "updatedAt") SELECT "createdAt", "email", "id", "nickname", "passwordHash", "updatedAt" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_nickname_key" ON "Player"("nickname");
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");
CREATE UNIQUE INDEX "Player_licenseNumber_key" ON "Player"("licenseNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
