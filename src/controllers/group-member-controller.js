const { GroupMembers } = require('../models')
const { GroupMemberRepository, UserRepository } = require('../repositories')
const { AuthorizationError } = require('../util/errors')

class GroupMemberController {
	constructor(user) {
		this.user = user
	}

	async removeMember(groupId, username) {
		const member = await GroupMemberRepository.getMember(groupId, username)

		if (this.user.username === member.username || this.user.isGroupAdmin(groupId)) {
			if (member.config.isAdmin) {
				const admins = await GroupMemberRepository.getAdmins(groupId)

				if (admins.length === 1) {
					const err = new AuthorizationError('GroupMember', username, 'DELETE')
					err.message = 'You are the last administrator of this group and cannot leave the group.'
					throw err
				}
			}
		} else {
			throw new AuthorizationError('GroupMember', username, 'DELETE')
		}

		const userId = await UserRepository.getUserIdByUsername(username)
		await GroupMembers.destroy({
			where: { groupId, userId }
		})
	}

	async updateMember(groupId, username, values) {
		const member = await GroupMemberRepository.getMember(groupId, username)

		if (this.user.isGroupAdmin(groupId) === false && username !== this.user.username) {
			throw new AuthorizationError('GroupMember', username, 'UPDATE')
		}

		if (Boolean(values.isAdmin) === true && this.user.isGroupAdmin(groupId) === false) {
			throw new AuthorizationError('GroupMember', username, 'UPDATE')
		}

		if (values.isAdmin === false) {
			const admins = await GroupMemberRepository.getAdmins(groupId)
			if (admins.length === 1) {
				const err = new AuthorizationError('GroupMember', username, 'UPDATE')
				err.message = 'This user is the last admin of this group and cannot revoke his rights.'
				throw err
			}
		}

		await GroupMembers.update(
			{ color: values.color, isAdmin: Boolean(values.isAdmin) },
			{
				where: {
					id: member.id
				}
			}
		)

		return await GroupMemberRepository.getMemberFormatted(groupId, username)
	}
}

module.exports = GroupMemberController
