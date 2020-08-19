const Joi = require('joi')
const ParticipantController = require('./participant.controller')

module.exports = {
	name: 'participation-router',
	register: async server => {
		server.route({
			method: 'POST',
			path: '/groups/{groupId}/lunchbreaks/{date}/participation',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				},
				validate: {
					payload: Joi.object({
						amountSpent: Joi.number()
							.required()
							.allow(null),
						votes: Joi.array()
							.items(
								Joi.object({
									place: Joi.object({
										id: Joi.number().required(),
										name: Joi.string().required(),
										foodType: Joi.string().required()
									}).required(),
									points: Joi.number()
										.integer()
										.required()
								})
							)
							.unique('place.id')
							.required(),
						result: Joi.object({
							id: Joi.number().required(),
							name: Joi.string(),
							foodType: Joi.string()
						})
							.required()
							.allow(null)
					})
				}
			},
			handler: ParticipantController.createParticipation
		})

		server.route({
			method: 'PUT',
			path: '/groups/{groupId}/lunchbreaks/{date}/participation',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				},
				validate: {
					payload: Joi.object({
						amountSpent: Joi.number()
							.required()
							.allow(null),
						votes: Joi.array()
							.items(
								Joi.object({
									place: Joi.object({
										id: Joi.number().required(),
										name: Joi.string().required(),
										foodType: Joi.string().required()
									}).required(),
									points: Joi.number()
										.integer()
										.required()
								})
							)
							.unique('place.id'),
						result: Joi.object({
							id: Joi.number().required(),
							name: Joi.string(),
							foodType: Joi.string()
						})
							.required()
							.allow(null)
					})
				}
			},
			handler: ParticipantController.updateParticipation
		})

		server.route({
			method: 'DELETE',
			path: '/groups/{groupId}/lunchbreaks/{date}/participation',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				}
			},
			handler: ParticipantController.deleteParticipation
		})
	}
}
