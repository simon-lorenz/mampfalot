const Joi = require('@hapi/joi')
const UserController = require('./user.controller')
const GroupController = require('../group/group.controller')
const InvitationController = require('../invitation/invitation.controller')
const ParticipantController = require('../participant/participant.controller')

module.exports = {
	name: 'user-router',
	register: async server => {
		server.route({
			method: 'POST',
			path: '/users',
			options: {
				auth: false,
				validate: {
					payload: Joi.object({
						username: Joi.string()
							.pattern(/^[a-z-_0-9]*$/)
							.min(3)
							.max(255)
							.required(),
						firstName: Joi.string(),
						lastName: Joi.string(),
						email: Joi.string()
							.email({ tlds: process.env.NODE_ENV === 'production' })
							.required(),
						password: Joi.string()
							.min(8)
							.max(255)
							.required()
					})
				}
			},
			handler: UserController.createUser
		})

		server.route({
			method: 'GET',
			path: '/users/{username}/forgot-password',
			options: {
				auth: false
			},
			handler: UserController.initializePasswordResetProcess
		})

		server.route({
			method: 'POST',
			path: '/users/{username}/forgot-password',
			options: {
				auth: false,
				validate: {
					payload: Joi.object({
						token: Joi.string().required(),
						newPassword: Joi.string()
							.min(8)
							.max(255)
							.required()
					})
				}
			},
			handler: UserController.finalizePasswordResetProcess
		})

		server.route({
			method: 'GET',
			path: '/users/{email}/forgot-username',
			options: {
				auth: false
			},
			handler: UserController.initializeUsernameReminderProcess
		})

		server.route({
			method: 'GET',
			path: '/users/{username}/verify',
			options: {
				auth: false
			},
			handler: UserController.initializeVerificationProcess
		})

		server.route({
			method: 'POST',
			path: '/users/{username}/verify',
			options: {
				auth: false,
				validate: {
					payload: Joi.object({
						token: Joi.string().required()
					})
				}
			},
			handler: UserController.finalizeVerificationProcess
		})

		server.route({
			method: 'GET',
			path: '/users/me',
			handler: UserController.getAuthenticatedUser
		})

		server.route({
			method: 'PUT',
			path: '/users/me',
			options: {
				validate: {
					payload: Joi.object({
						username: Joi.string()
							.pattern(/^[a-z-_0-9]*$/)
							.min(3)
							.max(255)
							.required(),
						firstName: Joi.string()
							.allow(null)
							.required(),
						lastName: Joi.string()
							.allow(null)
							.required(),
						email: Joi.string()
							.email({ tlds: process.env.NODE_ENV === 'production' })
							.required(),
						password: Joi.string()
							.min(8)
							.max(255),
						currentPassword: Joi.alternatives().conditional('password', {
							then: Joi.string().required(),
							otherwise: Joi.string()
						})
					})
				}
			},
			handler: UserController.updateAuthenticatedUser
		})

		server.route({
			method: 'DELETE',
			path: '/users/me',
			handler: UserController.deleteAuthenticatedUser
		})

		server.route({
			method: 'GET',
			path: '/users/me/invitations',
			handler: InvitationController.getInvitationsOfAuthenticatedUser
		})

		server.route({
			method: 'DELETE',
			path: '/users/me/invitations/{groupId}',
			options: {
				validate: {
					query: Joi.object({
						accept: Joi.boolean().required()
					})
				}
			},
			handler: InvitationController.deleteInvitationOfAuthenticatedUser
		})

		server.route({
			method: 'GET',
			path: '/users/me/groups',
			handler: GroupController.getGroupsOfAuthenticatedUser
		})

		server.route({
			method: 'GET',
			path: '/users/me/participations/{groupId}',
			options: {
				validate: {
					query: Joi.object({
						from: Joi.string().required(),
						to: Joi.string().required()
					})
				}
			},
			handler: ParticipantController.getParticipationsOfAuthenticatedUser
		})
	}
}
