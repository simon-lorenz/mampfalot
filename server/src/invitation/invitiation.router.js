const InvitationController = require('./invitation.controller')

module.exports = {
	name: 'inivitation-router',
	register: async server => {
		server.route({
			method: 'GET',
			path: '/groups/{groupId}/invitations',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				}
			},
			handler: InvitationController.getInvitations
		})

		server.route({
			method: 'POST',
			path: '/groups/{groupId}/invitations/{username}',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}']
					}
				}
			},
			handler: InvitationController.createInvitation
		})

		server.route({
			method: 'DELETE',
			path: '/groups/{groupId}/invitations/{username}',
			options: {
				auth: {
					access: {
						scope: ['admin:{params.groupId}']
					}
				}
			},
			handler: InvitationController.deleteInvitation
		})
	}
}
