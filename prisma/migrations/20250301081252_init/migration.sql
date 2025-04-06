-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fname" TEXT NOT NULL,
    "lname" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "tinNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "fsNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "ercaNumber" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activation" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Winner" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Winner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptsFromSMS" (
    "id" TEXT NOT NULL,
    "tinNumber" TEXT NOT NULL,
    "fsNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptsFromSMS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DrawReceipts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DrawReceipts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_tinNumber_key" ON "Merchant"("tinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_uniqueCode_key" ON "Receipt"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "Activation_receiptId_key" ON "Activation"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "Draw_drawDate_key" ON "Draw"("drawDate");

-- CreateIndex
CREATE UNIQUE INDEX "Winner_receiptId_key" ON "Winner"("receiptId");

-- CreateIndex
CREATE INDEX "_DrawReceipts_B_index" ON "_DrawReceipts"("B");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activation" ADD CONSTRAINT "Activation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DrawReceipts" ADD CONSTRAINT "_DrawReceipts_A_fkey" FOREIGN KEY ("A") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DrawReceipts" ADD CONSTRAINT "_DrawReceipts_B_fkey" FOREIGN KEY ("B") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
