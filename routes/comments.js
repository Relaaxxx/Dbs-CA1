// See https://expressjs.com/en/guide/routing.html for routing

const express = require('express');
const commentsController = require('../controllers/commentsController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token

// Create a comment (supports top-level or reply comment)
router.post('/create', commentsController.createComment);

// Retrieve comments for a specific review (used if loading separately)
router.get('/review/:review_id', commentsController.getComments);

// Delete a comment (by the member who owns it)
router.post('/delete', commentsController.deleteComment);
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file eg. router.use(...)

router.use(jwtMiddleware.verifyToken);


module.exports = router;