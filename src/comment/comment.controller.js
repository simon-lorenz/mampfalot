const Boom = require('@hapi/boom')
const CommentModel = require('./comment.model')
const CommentRepository = require('../comment/comment.repository')
const GroupMemberRepository = require('../group-member/group-member.repository')
const LunchbreakController = require('../lunchbreak/lunchbreak.controller')

async function createComment(request, h) {
	const { groupId, date } = request.params

	const lunchbreak = await LunchbreakController.findOrCreateLunchbreak(groupId, date)
	const memberId = await GroupMemberRepository.getMemberId(groupId, request.auth.credentials.username)

	const { id } = await CommentModel.create({
		lunchbreakId: lunchbreak.id,
		memberId,
		text: request.payload.text
	})

	return h.response(await CommentRepository.getComment(id)).code(201)
}

async function updateComment(request, h) {
	const { commentId } = request.params
	const comment = await CommentRepository.getComment(commentId)

	if (comment.author.username !== request.auth.credentials.username) {
		throw Boom.forbidden()
	}

	await CommentModel.update(
		{
			text: request.payload.text
		},
		{
			where: {
				id: commentId
			}
		}
	)

	return CommentRepository.getComment(commentId)
}

async function deleteComment(request, h) {
	const { commentId } = request.params
	const comment = await CommentRepository.getComment(commentId)

	if (comment.author.username !== request.auth.credentials.username) {
		throw Boom.forbidden()
	}

	const lunchbreakId = await CommentRepository.getLunchbreakId(commentId)

	await CommentModel.destroy({
		where: {
			id: commentId
		}
	})

	await LunchbreakController.checkForAutoDeletion(lunchbreakId)

	return h.response().code(204)
}

module.exports = {
	createComment,
	updateComment,
	deleteComment
}
