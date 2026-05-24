-- CreateTable
CREATE TABLE "jellyfin_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serverUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "jellyfinUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jellyfin_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jellyfin_configs_userId_key" ON "jellyfin_configs"("userId");

-- AddForeignKey
ALTER TABLE "jellyfin_configs" ADD CONSTRAINT "jellyfin_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
