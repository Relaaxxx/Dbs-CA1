-- RenameForeignKey
ALTER TABLE "discountProduct" RENAME CONSTRAINT "discountProduct_discount_id_fkey" TO "fk_discount_product_discount";

-- RenameForeignKey
ALTER TABLE "discountProduct" RENAME CONSTRAINT "discountProduct_product_id_fkey" TO "fk_discount_product_product";
