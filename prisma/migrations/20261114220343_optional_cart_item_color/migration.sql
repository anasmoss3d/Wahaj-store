-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productColorId_fkey";

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "productColorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productColorId_fkey" FOREIGN KEY ("productColorId") REFERENCES "ProductColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
