/*
  Warnings:

  - The primary key for the `OtpRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `firstName` to the `OtpRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `OtpRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OtpRequest" DROP CONSTRAINT "OtpRequest_pkey",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "OtpRequest_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "OtpRequest_id_seq";
