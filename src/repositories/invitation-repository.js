const { Invitation, User, Group, Place } = require('../models')

class InvitationRepository {
	getInvitationsOfGroup(groupId) {
		return Invitation.findAll({
			attributes: [],
			where: {
				groupId: groupId
			},
			include: [
				{
					model: User,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: User,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName']
				}
			]
		})
	}

	getInvitationOfGroupToUser(groupId, username) {
		return Invitation.findOne({
			attributes: [],
			where: {
				groupId: groupId
			},
			include: [
				{
					model: User,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: User,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName'],
					where: {
						username: username
					}
				}
			]
		})
	}

	async getInvitationsOfUser(userId) {
		return Invitation.findAll({
			attributes: [],
			where: {
				toId: userId
			},
			include: [
				{
					model: Group,
					include: [
						{
							model: Place,
							attributes: ['id', 'name', 'foodType']
						},
						{
							model: User,
							attributes: ['username', 'firstName', 'lastName'],
							as: 'members',
							through: {
								as: 'config',
								attributes: ['color', 'isAdmin']
							}
						}
					]
				},
				{
					model: User,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: User,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName']
				}
			]
		})
	}
}

module.exports = new InvitationRepository()
