const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const checkoutModel = require('../models/checkout');

// Controller to get cart with discount applied
module.exports.getCheckout = async function(req, res) {
  try {
    let memberId = req.params.memberId || req.body.memberId;
    memberId = Number(memberId);
    if (isNaN(memberId)) return res.status(400).json({ error: 'Invalid memberId' });

    const result = await checkoutModel.calculateCheckoutWithDiscount(memberId);
    

    result.items.forEach(item => {
    if (item.discountedPrice === item.unitPrice * item.quantity) {
        item.discountedPrice = 0;
    }
});

    res.json({
      totalPrice: result.totalPrice,
      items: result.items,
    });
    console.log(result);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.placeOrder = async function(req, res) {
    const memberId = Number(req.params.memberId);
    if (isNaN(memberId)) return res.status(400).json({ error: "Invalid member ID" });

    try {
        await checkoutModel.placeOrder(memberId);
        res.json({ message: "Order processed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};