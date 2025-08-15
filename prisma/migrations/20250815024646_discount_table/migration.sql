-- AlterTable
ALTER TABLE "discount" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- RenameForeignKey
ALTER TABLE "discountProduct" RENAME CONSTRAINT "fk_discount_product_discount" TO "discountProduct_discount_id_fkey";

-- RenameForeignKey
ALTER TABLE "discountProduct" RENAME CONSTRAINT "fk_discount_product_product" TO "discountProduct_product_id_fkey";
