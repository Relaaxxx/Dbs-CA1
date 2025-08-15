const { EMPTY_RESULT_ERROR } = require('../errors');
const cartsModel = require('../models/carts');

// Create or add cart item
module.exports.createCartItems = async function(req, res) {
    try {
        const { memberId, productId, quantity } = req.body;
        const result = await cartsModel.createCartItem(memberId, productId, quantity);
        res.json({ message: 'Cart item added', cartId: result.cartId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Update cart item quantity
module.exports.updateCartItems = async function(req, res) {
    try {
        const { cartItemId, quantity } = req.body;
        const updatedItem = await cartsModel.updateCartItem(cartItemId, quantity);
        res.json({ message: 'Cart item updated', cartItem: updatedItem });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Retrieve cart items
module.exports.retrieveCartItems = async function(req, res) {
    let memberId = req.params.memberId || req.body.memberId;
    memberId = Number(memberId); // Convert to integer
    if (isNaN(memberId)) throw new Error("Invalid memberId");
    try {
        const memberId = req.params.memberId;
        const cartItems = await cartsModel.retrieveCartItems(memberId);
        res.json({ cartItems });
    } catch (err) {
        console.error(err);
        if (err instanceof EMPTY_RESULT_ERROR) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
};

// Delete a cart item
module.exports.deleteCartItems = async function(req, res) {
    try {
        const cartItemId = req.params.cartItemId;
        await cartsModel.deleteCartItem(cartItemId);
        res.json({ message: 'Cart item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Get cart summary
module.exports.getCartSummary = async function(req, res) {
    try {
        let memberId = req.params.memberId || req.body.memberId;
        memberId = Number(memberId); // Convert to integer
        if (isNaN(memberId)) throw new Error("Invalid memberId");

        const summary = await cartsModel.getCartSummary(memberId);
        res.json({ cartSummary: summary });
    } catch (err) {
        console.error(err);
        if (err instanceof EMPTY_RESULT_ERROR) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
};

