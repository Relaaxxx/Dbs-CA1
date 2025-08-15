const express = require('express');
const cartController = require('../controllers/cartsController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// Apply JWT middleware to all routes in this router
router.use(jwtMiddleware.verifyToken);
router.post('/', cartController.createCartItems);
router.put('/', cartController.updateCartItems);
router.get('/:memberId', cartController.retrieveCartItems);
router.delete('/:cartItemId', cartController.deleteCartItems);
router.get('/summary/:memberId', cartController.getCartSummary);


module.exports = router;
