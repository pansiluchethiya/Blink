-- CreateTable
CREATE TABLE "stories" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL DEFAULT '',
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "caption" VARCHAR(280) NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "viewedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_logs" (
    "id" UUID NOT NULL,
    "callerId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'voice',
    "status" TEXT NOT NULL DEFAULT 'missed',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stories_ownerId_expiresAt_idx" ON "stories"("ownerId", "expiresAt");

-- CreateIndex
CREATE INDEX "stories_expiresAt_archived_idx" ON "stories"("expiresAt", "archived");

-- CreateIndex
CREATE INDEX "call_logs_callerId_createdAt_idx" ON "call_logs"("callerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "call_logs_receiverId_createdAt_idx" ON "call_logs"("receiverId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
