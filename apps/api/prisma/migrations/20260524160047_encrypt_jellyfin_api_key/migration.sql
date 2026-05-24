/*
  Warnings:

  - You are about to drop the column `apiKey` on the `jellyfin_configs` table. All the data in the column will be lost.
  - Added the required column `encryptedApiKey` to the `jellyfin_configs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "jellyfin_configs" ADD COLUMN "encryptedApiKey" TEXT;
