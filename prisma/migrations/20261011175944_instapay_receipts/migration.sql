-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'INSTAPAY';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentReceiptUrl" TEXT;
