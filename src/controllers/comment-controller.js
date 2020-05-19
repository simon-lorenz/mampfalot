const { Comment } = require('../models')
const { CommentRepository, GroupMemberRepository } = require('../repositories')
const { AuthorizationError } = require('../util/errors')

class CommentController {
	constructor(user) {
		this.user = user
	}

	async createComment(LunchbreakController, groupId, date, values) {
		const lunchbreak = await LunchbreakController.findOrCreateLunchbreak(groupId, date)

		if (!this.user.isGroupMember(groupId)) {
			throw new AuthorizationError('Comment', null, 'CREATE')
		}

		const memberId = await GroupMemberRepository.getMemberId(groupId, this.user.username)

		const { id } = await Comment.create({
			lunchbreakId: lunchbreak.id,
			memberId,
			text: values.text
		})

		return await CommentRepository.getComment(id)
	}

	async updateComment(commentId, values) {
		const comment = await CommentRepository.getComment(commentId)

		if (comment.author.username !== this.user.username) {
			throw new AuthorizationError('Comment', comment.id, 'UPDATE')
		}

		await Comment.update(
			{
				text: values.text
			},
			{
				where: {
					id: commentId
				}
			}
		)

		return await CommentRepository.getComment(commentId)
	}

	async deleteComment(lunchbreakController, commentId) {
		const comment = await CommentRepository.getComment(commentId)

		if (comment.author.username !== this.user.username) {
			throw new AuthorizationError('Comment', comment.id, 'DELETE')
		}

		const lunchbreakId = await CommentRepository.getLunchbreakId(commentId)

		await Comment.destroy({
			where: {
				id: commentId
			}
		})

		await lunchbreakController.checkForAutoDeletion(lunchbreakId)
	}
}

module.exports = CommentController
