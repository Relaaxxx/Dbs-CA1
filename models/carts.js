const { PrismaClient } = require('@prisma/client');
const { EMPTY_RESULT_ERROR } = require('../errors');

const prisma = new PrismaClient();

module.exports = {
    // Create or add a cart item
    createCartItem: async function(memberId, productId, quantity) {
        memberId = Number(memberId);
        productId = Number(productId);
        quantity = Number(quantity);

        if (isNaN(memberId) || isNaN(productId) || isNaN(quantity)) {
            throw new Error("Invalid input values");
        }

        // Find or create cart
        let cart = await prisma.cart.findFirst({
            where: { memberId }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { memberId }
            });
        }

        // Check if cart item exists
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId
            }
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity,
                    addedAt: new Date()
                }
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                    addedAt: new Date()
                }
            });
        }

        return { cartId: cart.id };
    },

    // Update cart item quantity
    updateCartItem: async function(cartItemId, quantity) {
        cartItemId = Number(cartItemId);
        quantity = Number(quantity);

        const updatedItem = await prisma.cartItem.update({
            where: { id: cartItemId },
            data: {
                quantity,
                addedAt: new Date()
            }
        });

        if (!updatedItem) throw new EMPTY_RESULT_ERROR("Cart item not found");
        return updatedItem;
    },

    // Retrieve cart items for a member
    retrieveCartItems: async function(memberId) {
        memberId = Number(memberId);
        const cart = await prisma.cart.findFirst({
            where: { memberId },
            include: {
                cartItems: {
                    include: { product: true }
                }
            }
        });

        if (!cart || cart.cartItems.length === 0) {
            throw new EMPTY_RESULT_ERROR("No cart items found");
        }

        return cart.cartItems.map(ci => ({
            cart_item_id: ci.id,
            quantity: ci.quantity,
            added_at: ci.addedAt,
            product_id: ci.product.id,
            description: ci.product.description,
            unit_price: ci.product.unitPrice,
            country: ci.product.country
        }));
    },

    // Delete a cart item
    deleteCartItem: async function(cartItemId) {
        cartItemId = Number(cartItemId);
        await prisma.cartItem.delete({ where: { id: cartItemId } });
    },

    // Get cart summary
    getCartSummary: async function(memberId) {
        memberId = Number(memberId);

        const cart = await prisma.cart.findFirst({
            where: { memberId },
            include: { cartItems: { include: { product: true } } }
        });

        if (!cart || cart.cartItems.length === 0) {
            throw new EMPTY_RESULT_ERROR("Cart summary not found");
        }

        const total_quantity = cart.cartItems.reduce((sum, ci) => sum + Number(ci.quantity), 0);
        const total_price = cart.cartItems.reduce((sum, ci) => sum + Number(ci.quantity) * Number(ci.product.unitPrice), 0);

        return { total_quantity, total_price };
    }
};
