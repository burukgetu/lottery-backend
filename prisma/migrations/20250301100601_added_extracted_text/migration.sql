/*
  Warnings:

  - Added the required column `extractedText` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "extractedText" TEXT NOT NULL;
