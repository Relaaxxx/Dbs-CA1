const { PrismaClient } = require('@prisma/client');
const { EMPTY_RESULT_ERROR } = require('../errors');

const prisma = new PrismaClient();

module.exports = {
  calculateCheckoutWithDiscount: async function(memberId) {
    // Get cart items
    const cart = await prisma.cart.findFirst({
      where: { memberId },
      include: {
        cartItems: { include: { product: true } }
      }
    });

    if (!cart) return { total: 0, items: [] };

    let totalPrice = 0;
    const itemsWithDiscount = [];

    for (const item of cart.cartItems) {
      const unitPrice = Number(item.product.unitPrice);
      const quantity = Number(item.quantity);
      let discountedPrice = unitPrice * quantity;

      // Check if discount exists for this product
      const discount = await prisma.discountProduct.findFirst({
        where: { productId: item.productId },
        include: { discount: true }
      });

      if (discount && quantity >= discount.discount.minQuantity) {
        // Apply Buy 2 Get 20% off
        discountedPrice = discountedPrice * (1 - Number(discount.discount.discountRate) / 100);
      }

      totalPrice += discountedPrice;

      itemsWithDiscount.push({
        productId: item.productId,
        quantity,
        unitPrice,
        discountedPrice
      });
    }

    return { totalPrice, items: itemsWithDiscount };
  }
};

module.exports.placeOrder = async function(memberId) {
    try {
        // Call the stored procedure
        await prisma.$executeRaw`CALL place_orders(${memberId})`;
    } catch (err) {
        console.error('Error executing stored procedure:', err);
        throw err;
    }
};
