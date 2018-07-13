const Comment = require('../models').Comment

module.exports = {
	loadComment: function(req, res, next) {
		Comment.findOne({
			where: {
				id: req.params.commentId
			}
		})
		.then(comment => {
			if (!comment) {
				res.status(404).send()
			} else {
				res.locals.comment = comment
				next()
			}
		})
	},
	userOwnsComment: function(req, res, next) {
		if (res.locals.comment.userId !== res.locals.user.id) {
			res.status(403).send()
		} else {
			next()
		}
	}
}