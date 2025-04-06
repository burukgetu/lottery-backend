-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_userId_fkey";

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "telegramUserId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_telegramUserId_fkey" FOREIGN KEY ("telegramUserId") REFERENCES "TelegramUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
