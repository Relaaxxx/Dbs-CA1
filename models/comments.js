const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

module.exports.createComment = function createComment(memberId, reviewId, commentText, parentCommentId = null) {
  const sql = 'SELECT create_comment($1, $2, $3, $4)';
  return query(sql, [memberId, reviewId, commentText, parentCommentId])
    .catch(error => {
      throw error;
    });
};

module.exports.getComments = function getComments(reviewId) {
  const sql = 'SELECT * FROM get_comments($1)';
  return query(sql, [reviewId])
    .then(result => result.rows)
    .catch(error => {
      throw error;
    });
};

module.exports.deleteComment = function deleteComment(commentId, memberId) {
  const sql = 'SELECT delete_comment($1, $2)';
  return query(sql, [commentId, memberId])
    .catch(error => {
      throw error;
    });
};