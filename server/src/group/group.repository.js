const GroupModel = require('./group.model')

const GroupMemberModel = require('../group-member/group-member.model')
const UserModel = require('../user/user.model')

/**
 * @typedef {Object} GroupConfig
 * @property {string} voteEndingTime
 * @property {number} utcOffset
 * @property {number} pointsPerDay
 * @property {number} minPointsPerVote
 * @property {number} maxPointsPerVote
 */

class GroupRepository {
	async getGroup(id) {
		return GroupModel.query()
			.throwIfNotFound()
			.withGraphFetched('[members, places]')
			.where('groups.id', '=', id)
			.first()
	}

	async getGroupsOfUser(userId) {
		let memberships = await GroupMemberModel.query()
			.select('groupId')
			.withGraphJoined('user')
			.where('group_members.userId', '=', userId)

		memberships = memberships.map(membership => membership.groupId)

		return GroupModel.query()
			.withGraphFetched('[members, places]')
			.whereIn('groups.id', memberships)
	}

	async getGroupMembershipsOfUser(userId) {
		const user = await UserModel.query()
			.where('users.id', '=', userId)
			.withGraphJoined('groups')
			.first()

		return user.groups.map(group => {
			return {
				id: group.id,
				isAdmin: group.isAdmin
			}
		})
	}

	/**
	 * Retrieve the configuration of a group.
	 * @param {*} id
	 * @returns {GroupConfig}
	 */
	async getGroupConfig(id) {
		return GroupModel.query()
			.select(['voteEndingTime', 'utcOffset', 'pointsPerDay', 'minPointsPerVote', 'maxPointsPerVote'])
			.where({ id })
			.first()
	}

	/**
	 * Retrieve the configuration of a group.
	 * @param {*} participantId
	 * @returns {GroupConfig}
	 */
	async getGroupConfigByParticipant(participantId) {
		const member = await GroupMemberModel.query()
			.withGraphJoined('[group.places, participations]')
			.where('participations.id', '=', participantId)
			.first()

		return member.group
	}
}

module.exports = new GroupRepository()
