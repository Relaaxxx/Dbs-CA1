// See https://expressjs.com/en/guide/routing.html for routing

const express = require('express');
const productsController = require('../controllers/productsController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)

router.use(jwtMiddleware.verifyToken);

router.get('/:code', productsController.retrieveById);

router.get('/', productsController.retrieveAll);

module.exports = router;
