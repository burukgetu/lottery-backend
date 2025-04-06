-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_phoneNumber_key" ON "TelegramUser"("phoneNumber");
