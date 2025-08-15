const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const reviewsModel = require('../models/reviews');

// Create Review
module.exports.createReview = function (req, res) {
  const { product_id, content, rating } = req.body;
  const memberId = req.user.memberId;

  return reviewsModel
    .createReview(memberId, product_id, parseInt(rating), content)
    .then(() => {
      return res.status(201).json({ message: 'Review created successfully' });
    })
    .catch(error => {
      console.error('Create Review Error:', error.message);
      return res.status(500).json({ error: error.message });
    });
};

// Retrieve All Reviews for Member
module.exports.getAllReviews = function (req, res) {
  const memberId = req.user.memberId;

  return reviewsModel
    .getReviews(memberId)
    .then(reviews => {
      return res.status(200).json(reviews); // Return array directly
    })
    .catch(error => {
      console.error('Get Reviews Error:', error.message);
      return res.status(500).json({ error: error.message });
    });
};

// Update Review
module.exports.updateReview = function (req, res) {
  const { review_id, content, rating } = req.body;
  const memberId = req.user.memberId;

  return reviewsModel
    .updateReview(parseInt(review_id), memberId, parseInt(rating), content)
    .then(() => {
      return res.status(200).json({ message: 'Review updated successfully' });
    })
    .catch(error => {
      console.error('Update Review Error:', error.message);
      return res.status(500).json({ error: error.message });
    });
};

// Delete Review
module.exports.deleteReview = function (req, res) {
  const { review_id } = req.body;
  const memberId = req.user.memberId;

  return reviewsModel
    .deleteReview(parseInt(review_id), memberId)
    .then(() => {
      return res.status(200).json({ message: 'Review deleted successfully' });
    })
    .catch(error => {
      console.error('Delete Review Error:', error.message);
      return res.status(500).json({ error: error.message });
    });
};