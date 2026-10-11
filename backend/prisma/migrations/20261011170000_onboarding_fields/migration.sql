-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'birthday';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "birthday" TIMESTAMP(3),
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isMinor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "phoneHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneHash_key" ON "users"("phoneHash");
