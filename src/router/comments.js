const Joi = require('@hapi/joi')
const { CommentController } = require('../controllers')

module.exports = {
	name: 'comment-router',
	register: async server => {
		server.route({
			method: 'POST',
			path: '/groups/{groupId}/lunchbreaks/{date}/comments',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				},
				validate: {
					payload: Joi.object({
						text: Joi.string()
							.min(1)
							.required()
					})
				}
			},
			handler: CommentController.createComment
		})

		server.route({
			method: 'PUT',
			path: '/groups/{groupId}/lunchbreaks/{date}/comments/{commentId}',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				},
				validate: {
					payload: Joi.object({
						text: Joi.string()
							.min(1)
							.required()
					})
				}
			},
			handler: CommentController.updateComment
		})

		server.route({
			method: 'DELETE',
			path: '/groups/{groupId}/lunchbreaks/{date}/comments/{commentId}',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				}
			},
			handler: CommentController.deleteComment
		})
	}
}
