const Boom = require('@hapi/boom')
const CommentModel = require('./comment.model')
const GroupModel = require('../group/group.model')
const GroupMemberModel = require('../group-member/group-member.model')
const LunchbreakModel = require('../lunchbreak/lunchbreak.model')
const UserModel = require('../user/user.model')

class CommentRepository {
	async getComment(id) {
		const comment = await CommentModel.findByPk(id, {
			attributes: ['id', 'lunchbreakId', 'text', 'createdAt', 'updatedAt'],
			include: [
				{
					model: GroupMemberModel,
					as: 'author',
					include: [UserModel]
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
		const comment = await CommentModel.findByPk(commentId, { attributes: ['lunchbreakId'] })
		return comment.lunchbreakId
	}

	async getGroupId(id) {
		const group = await GroupModel.findOne({
			include: [
				{
					model: LunchbreakModel,
					include: [
						{
							model: CommentModel,
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
