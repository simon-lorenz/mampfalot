const Joi = require('joi')
const GroupController = require('./group.controller')

module.exports = {
	name: 'group-router',
	register: async server => {
		server.route({
			method: 'POST',
			path: '/groups',
			options: {
				validate: {
					payload: Joi.object({
						name: Joi.string().required(),
						lunchTime: Joi.string().required(),
						voteEndingTime: Joi.string().required(),
						utcOffset: Joi.number()
							.min(-720)
							.max(720)
							.multiple(60)
							.required(),
						pointsPerDay: Joi.number()
							.min(1)
							.max(1000)
							.required(),
						maxPointsPerVote: Joi.number()
							.min(Joi.ref('minPointsPerVote'))
							.max(Joi.ref('pointsPerDay'))
							.required(),
						minPointsPerVote: Joi.number()
							.min(1)
							.max(Joi.ref('pointsPerDay'))
							.required()
					})
				}
			},
			handler: GroupController.createGroup
		})

		server.route({
			method: 'GET',
			path: '/groups/{groupId}',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				}
			},
			handler: GroupController.getGroup
		})

		server.route({
			method: 'PUT',
			path: '/groups/{groupId}',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}']
					}
				},
				validate: {
					payload: Joi.object({
						name: Joi.string().required(),
						lunchTime: Joi.string().required(),
						voteEndingTime: Joi.string().required(),
						utcOffset: Joi.number()
							.min(-720)
							.max(720)
							.multiple(60)
							.required(),
						pointsPerDay: Joi.number()
							.min(1)
							.max(1000)
							.required(),
						maxPointsPerVote: Joi.number()
							.min(Joi.ref('minPointsPerVote'))
							.max(Joi.ref('pointsPerDay'))
							.required(),
						minPointsPerVote: Joi.number()
							.min(1)
							.max(Joi.ref('pointsPerDay'))
							.required()
					})
				}
			},
			handler: GroupController.updateGroup
		})

		server.route({
			method: 'DELETE',
			path: '/groups/{groupId}',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}']
					}
				}
			},
			handler: GroupController.deleteGroup
		})
	}
}
