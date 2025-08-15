// See https://expressjs.com/en/guide/routing.html for routing

const express = require('express');
const reviewsController = require('../controllers/reviewsController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token

// Create a new review (e.g., POST from /review/create form)
router.post('/create', reviewsController.createReview);

// Retrieve all reviews for the logged-in user
router.get('/retrieve/all', reviewsController.getAllReviews);

// Update a review (e.g., POST from /review/update form)
router.post('/update', reviewsController.updateReview);

// Delete a review (e.g., POST from /review/delete form)
router.post('/delete', reviewsController.deleteReview);

// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)

router.use(jwtMiddleware.verifyToken);


module.exports = router;