const Joi = require('@hapi/joi')
const PlaceController = require('./place.controller')

module.exports = {
	name: 'place-router',
	register: async server => {
		server.route({
			method: 'POST',
			path: '/groups/{groupId}/places',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}']
					}
				},
				validate: {
					payload: Joi.object({
						foodType: Joi.string().required(),
						name: Joi.string().required()
					})
				}
			},
			handler: PlaceController.createPlace
		})

		server.route({
			method: 'PUT',
			path: '/groups/{groupId}/places/{placeId}',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}']
					}
				},
				validate: {
					payload: Joi.object({
						foodType: Joi.string().required(),
						name: Joi.string().required()
					})
				}
			},
			handler: PlaceController.updatePlace
		})

		server.route({
			method: 'DELETE',
			path: '/groups/{groupId}/places/{placeId}',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}']
					}
				}
			},
			handler: PlaceController.deletePlace
		})
	}
}
