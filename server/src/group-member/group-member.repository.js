const GroupMemberModel = require('./group-member.model')

class GroupMemberRepository {
	/**
	 *
	 * @param {Number} groupId
	 * @param {String} username
	 */
	async getMember(groupId, username) {
		const member = await GroupMemberModel.query()
			.throwIfNotFound()
			.withGraphJoined('user')
			.where({
				username,
				groupId
			})
			.first()

		return member
	}

	async getMembers(groupId) {
		const members = await GroupMemberModel.query()
			.throwIfNotFound()
			.withGraphJoined('user')
			.where({
				groupId
			})

		return members.map(member => member.toJSON())
	}

	async getMemberId(groupId, username) {
		const { id } = await GroupMemberModel.query()
			.select(['group_members.id', 'group_members.groupId'])
			.withGraphJoined('user')
			.where('group_members.groupId', '=', groupId)
			.where('user.username', '=', username)
			.first()

		return id
	}

	async getAdmins(groupId) {
		return GroupMemberModel.query().where({
			groupId,
			isAdmin: true
		})
	}
}

module.exports = new GroupMemberRepository()
