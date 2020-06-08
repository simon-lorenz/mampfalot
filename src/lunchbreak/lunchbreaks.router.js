const Joi = require('@hapi/joi')
const LunchbreakController = require('./lunchbreak.controller')

module.exports = {
	name: 'lunchbreak-router',
	register: async server => {
		server.route({
			method: 'GET',
			path: '/groups/{groupId}/lunchbreaks',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				},
				validate: {
					query: Joi.object({
						from: Joi.required(),
						to: Joi.required()
					})
				}
			},
			handler: LunchbreakController.getLunchbreaks
		})

		server.route({
			method: 'GET',
			path: '/groups/{groupId}/lunchbreaks/{date}',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				}
			},
			handler: LunchbreakController.getLunchbreak
		})
	}
}
