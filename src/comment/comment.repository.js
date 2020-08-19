const CommentModel = require('./comment.model')

class CommentRepository {
	async getComment(id) {
		return CommentModel.query()
			.throwIfNotFound()
			.findById(id)
			.withGraphFetched('author.user')
	}

	async getLunchbreakId(commentId) {
		const { lunchbreakId } = await CommentModel.query()
			.findById(commentId)
			.select('lunchbreakId')

		return lunchbreakId
	}

	async getGroupId(id) {
		const comment = await CommentModel.query()
			.findById(id)
			.withGraphFetched('lunchbreak.group')

		return comment.lunchbreak.group.id
	}
}

module.exports = new CommentRepository()
