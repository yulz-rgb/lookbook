-- DropIndex
DROP INDEX IF EXISTS "Product_yachtId_sku_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN IF EXISTS "sku";
