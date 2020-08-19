const InvitationModel = require('./invitation.model')

class InvitationRepository {
	async getInvitationsOfGroup(groupId) {
		return InvitationModel.query()
			.withGraphFetched('[group.[members, places], from, to]')
			.where('invitations.groupId', '=', groupId)
	}

	async getInvitationOfGroupToUser(groupId, username) {
		return await InvitationModel.query()
			.throwIfNotFound()
			.withGraphJoined('[group.[members, places], from, to]')
			.where('invitations.groupId', '=', groupId)
			.where('to.username', '=', username)
			.first()
	}

	async getInvitationsOfUser(userId) {
		return InvitationModel.query()
			.withGraphFetched('[group.[members, places], from, to]')
			.where('toId', '=', userId)
	}
}

module.exports = new InvitationRepository()
