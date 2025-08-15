const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

module.exports.createReview = function createReview(memberId, productId, rating, content) {
  const sql = 'SELECT create_review($1, $2, $3, $4)';
  return query(sql, [memberId, productId, rating, content])
    .catch(error => {
      throw error;
    });
};

module.exports.updateReview = function updateReview(reviewId, memberId, rating, content) {
  const sql = 'SELECT update_review($1, $2, $3, $4)';
  return query(sql, [reviewId, memberId, rating, content])
    .catch(error => {
      throw error;
    });
};

module.exports.deleteReview = function deleteReview(reviewId, memberId) {
  const sql = 'SELECT delete_review($1, $2)';
  return query(sql, [reviewId, memberId])
    .catch(error => {
      throw error;
    });
};

module.exports.getReviews = function getReviews(memberId) {
  const sql = 'SELECT * FROM get_reviews($1)';
  return query(sql, [memberId])
    .then(result => result.rows)
    .catch(error => {
      throw error;
    });
};