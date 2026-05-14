-- CreateTable
CREATE TABLE "room_invites" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "maxUses" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_invites_code_key" ON "room_invites"("code");

-- CreateIndex
CREATE INDEX "room_invites_roomId_idx" ON "room_invites"("roomId");

-- CreateIndex
CREATE INDEX "room_invites_code_idx" ON "room_invites"("code");

-- AddForeignKey
ALTER TABLE "room_invites" ADD CONSTRAINT "room_invites_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
