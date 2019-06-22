'use strict'

const { Comment, Lunchbreak, GroupMembers, User } = require('../models')
const user = require('../classes/user')

class CommentController {

	async getComment(id) {
		let result = await Comment.findByPk(id, {
			attributes: ['id', 'lunchbreakId', ['comment', 'text'], 'createdAt', 'updatedAt'],
			include: [
				{
					model: GroupMembers,
					as: 'author',
					include: [ User ]
				}
			]
		})

		await user.can.readComment(result)

		result = result.toJSON()

		return {
			id: result.id,
			text: result.text,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
			author: {
				username: result.author.user.username,
				firstName: result.author.user.firstName,
				lastName: result.author.user.lastName,
				config: {
					color: result.author.color,
					isAdmin: result.author.isAdmin
				}
			}
		}
	}

	async createComment(groupId, date, values) {
		const lunchbreak = await Lunchbreak.findOne({
			attributes: ['id'],
			where: {
				groupId,
				date
			}
		})

		const member = await GroupMembers.findOne({
			attributes: ['id'],
			where: {
				groupId,
				userId: user.id
			}
		})

		const comment = Comment.build({
			lunchbreakId: lunchbreak.id,
			memberId: member.id,
			comment: values.text
		})

		await user.can.createComment(comment)

		const { id } = await comment.save()

		return await this.getComment(id)
	}

}

module.exports = new CommentController()
