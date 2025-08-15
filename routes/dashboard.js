const express = require('express');
const membersController = require('../controllers/membersController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token and check if the user is an admin.
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)

router.use(jwtMiddleware.verifyToken, jwtMiddleware.verifyIsAdmin);

router.get('/salesOrderSummary', membersController.retrieveSalesOrderSummary);



module.exports = router;