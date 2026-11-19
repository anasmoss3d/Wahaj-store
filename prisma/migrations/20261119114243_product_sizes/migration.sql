-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "productSizeId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "selectedSizeName" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Size" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSize" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Size_active_sortOrder_idx" ON "Size"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductSize_productId_active_sortOrder_idx" ON "ProductSize"("productId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductSize_sizeId_idx" ON "ProductSize"("sizeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_productId_sizeId_key" ON "ProductSize"("productId", "sizeId");

-- CreateIndex
CREATE INDEX "CartItem_productSizeId_idx" ON "CartItem"("productSizeId");

-- AddForeignKey
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productSizeId_fkey" FOREIGN KEY ("productSizeId") REFERENCES "ProductSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;
