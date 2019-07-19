'use strict'

const { Comment, Lunchbreak, GroupMembers, User } = require('../models')
const { NotFoundError } = require('../classes/errors')

class CommentController {

	constructor(user) {
		this.user = user
	}

	async loadComment(id) {
		const comment = await Comment.findByPk(id, {
			attributes: ['id', 'lunchbreakId', 'text', 'createdAt', 'updatedAt'],
			include: [
				{
					model: GroupMembers,
					as: 'author',
					include: [ User ]
				}
			]
		})

		if (comment === null)
			throw new NotFoundError('Comment', id)
		else
			return comment
	}

	formatComment(comment) {
		comment = comment.toJSON()
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

	async getComment(id) {
		const comment = await this.loadComment(id)
		await this.user.can.readComment(comment)
		return this.formatComment(comment)
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
				userId: this.user.id
			}
		})

		const comment = Comment.build({
			lunchbreakId: lunchbreak.id,
			memberId: member.id,
			text: values.text
		})

		await this.user.can.createComment(comment)

		const { id } = await comment.save()

		return await this.getComment(id)
	}

	async updateComment(commentId, values) {
		const comment = await this.loadComment(commentId)
		await this.user.can.updateComment(this.formatComment(comment))
		comment.text = values.text
		await comment.save()
		return await this.getComment(commentId)
	}

	async deleteComment(commentId) {
		const comment = await this.loadComment(commentId)
		await this.user.can.deleteComment(this.formatComment(comment))
		await comment.destroy()
	}

}

module.exports = CommentController
