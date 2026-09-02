/*
  Warnings:

  - You are about to drop the column `gst` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `gstin` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "gst",
ADD COLUMN     "gstin" TEXT NOT NULL;
