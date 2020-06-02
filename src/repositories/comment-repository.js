const Boom = require('@hapi/boom')
const { Comment, GroupMembers, User, Lunchbreak, Group } = require('../models')

class CommentRepository {
	async getComment(id) {
		const comment = await Comment.findByPk(id, {
			attributes: ['id', 'lunchbreakId', 'text', 'createdAt', 'updatedAt'],
			include: [
				{
					model: GroupMembers,
					as: 'author',
					include: [User]
				}
			]
		})

		if (comment === null) {
			throw Boom.notFound()
		} else {
			return {
				id: comment.id,
				text: comment.text,
				createdAt: comment.createdAt,
				updatedAt: comment.updatedAt,
				author: {
					username: comment.author.user.username,
					firstName: comment.author.user.firstName,
					lastName: comment.author.user.lastName,
					config: {
						color: comment.author.color,
						isAdmin: comment.author.isAdmin
					}
				}
			}
		}
	}

	async getLunchbreakId(commentId) {
		const comment = await Comment.findByPk(commentId, { attributes: ['lunchbreakId'] })
		return comment.lunchbreakId
	}

	async getGroupId(id) {
		const group = await Group.findOne({
			include: [
				{
					model: Lunchbreak,
					include: [
						{
							model: Comment,
							where: {
								id
							}
						}
					]
				}
			]
		})
		return group.id
	}
}

module.exports = new CommentRepository()
