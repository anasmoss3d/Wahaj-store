-- AlterTable
ALTER TABLE "Addon" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nameEn" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nameEn" TEXT;

-- AlterTable
ALTER TABLE "Color" ADD COLUMN     "nameEn" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "metaDescriptionEn" TEXT,
ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "seoTitleEn" TEXT;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "altEn" TEXT;

-- AlterTable
ALTER TABLE "Size" ADD COLUMN     "nameEn" TEXT;
