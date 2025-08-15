const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const commentModel = require('../models/comments');

// Add Comment
module.exports.createComment = function (req, res) {
  const memberId = req.user.memberId;

  const { review_id, comment, parent_comment_id } = req.body;

  return commentModel
    .createComment(
      memberId,
      parseInt(review_id),
      comment,
      parent_comment_id ? parseInt(parent_comment_id) : null
    )
    .then(() => {
      return res.redirect('back'); // Redirects to the same product/review page
    })
    .catch(error => {
      console.error('Create Comment Error:', error.message);
      return res.status(500).send(`Create Comment Error: ${error.message}`);
    });
};

// View Comments for a Review
module.exports.getComments = function (req, res) {
  const { review_id } = req.params;

  return commentModel
    .getComments(parseInt(review_id))
    .then(comments => {
      return res.render('comments/list', { comments });
    })
    .catch(error => {
      console.error('Get Comments Error:', error.message);
      return res.status(500).send(`Get Comments Error: ${error.message}`);
    });
};

// Delete Comment
module.exports.deleteComment = function (req, res) {
  const memberId = req.session.member.id;
  const { comment_id } = req.body;

  return commentModel
    .deleteComment(parseInt(comment_id), memberId)
    .then(() => {
      return res.redirect('back');
    })
    .catch(error => {
      console.error('Delete Comment Error:', error.message);
      return res.status(500).send(`Delete Comment Error: ${error.message}`);
    });
};
