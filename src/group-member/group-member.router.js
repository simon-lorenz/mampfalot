const Joi = require('@hapi/joi')
const GroupMemberController = require('./group-member.controller')

module.exports = {
	name: 'group-member-router',
	register: async server => {
		server.route({
			method: 'PUT',
			path: '/groups/{groupId}/members/{username}',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}', 'user:{params.username}']
					}
				},
				validate: {
					payload: Joi.object({
						color: Joi.string()
							.pattern(/^#[a-f0-9]{6}$/)
							.required(),
						isAdmin: Joi.boolean().required()
					})
				}
			},
			handler: GroupMemberController.updateMember
		})

		server.route({
			method: 'DELETE',
			path: '/groups/{groupId}/members/{username}',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}', 'user:{params.username}']
					}
				}
			},
			handler: GroupMemberController.deleteMember
		})
	}
}
