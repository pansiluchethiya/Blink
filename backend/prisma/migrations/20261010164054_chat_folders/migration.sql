-- CreateTable
CREATE TABLE "folders" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" VARCHAR(24) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#F59E0B',
    "memberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folders_ownerId_idx" ON "folders"("ownerId");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
