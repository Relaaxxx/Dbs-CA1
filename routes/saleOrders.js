const express = require('express');
const saleOrdersController = require('../controllers/saleOrdersController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)

router.use(jwtMiddleware.verifyToken);

router.get('/', saleOrdersController.retrieveAll);


module.exports = router;