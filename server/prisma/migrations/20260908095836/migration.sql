/*
  Warnings:

  - You are about to drop the column `lineAmount` on the `LineItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LineItem" DROP COLUMN "lineAmount",
ADD COLUMN     "cgstAmount" DECIMAL(12,2),
ADD COLUMN     "hsnCode" TEXT,
ADD COLUMN     "igstAmount" DECIMAL(12,2),
ADD COLUMN     "lineTotal" DECIMAL(12,2),
ADD COLUMN     "sgstAmount" DECIMAL(12,2),
ADD COLUMN     "taxableValue" DECIMAL(12,2);
