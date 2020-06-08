const GroupModel = require('../group/group.model')
const InvitationModel = require('./invitation.model')
const UserModel = require('../user/user.model')
const PlaceModel = require('../place/place.model')

class InvitationRepository {
	async getInvitationsOfGroup(groupId) {
		return InvitationModel.findAll({
			attributes: [],
			where: {
				groupId: groupId
			},
			include: [
				{
					model: UserModel,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: UserModel,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName']
				}
			]
		})
	}

	async getInvitationOfGroupToUser(groupId, username) {
		return InvitationModel.findOne({
			attributes: [],
			where: {
				groupId: groupId
			},
			include: [
				{
					model: UserModel,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: UserModel,
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
		return InvitationModel.findAll({
			attributes: [],
			where: {
				toId: userId
			},
			include: [
				{
					model: GroupModel,
					include: [
						{
							model: PlaceModel,
							attributes: ['id', 'name', 'foodType']
						},
						{
							model: UserModel,
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
					model: UserModel,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: UserModel,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName']
				}
			]
		})
	}
}

module.exports = new InvitationRepository()
