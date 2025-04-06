/*
  Warnings:

  - Added the required column `tinNumber` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "tinNumber" TEXT NOT NULL;
