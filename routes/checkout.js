const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token 
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)
router.get('/:memberId', checkoutController.getCheckout);
router.post('/placeorder/:memberId', checkoutController.placeOrder);

router.use(jwtMiddleware.verifyToken);

module.exports = router;
