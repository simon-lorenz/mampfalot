'use strict'

const user = require('../classes/user')
const { GroupMembers } = require('../models')
const ResourceLoader = require('../classes/resource-loader')

class GroupMemberController {
	async removeMember(groupId, username) {
		const member = await GroupMembers.findOne({
			where: {
				userId: await ResourceLoader.getUserIdByUsername(username),
				groupId: groupId
			}
		})

		await user.can.deleteGroupMember(member, username)
		await member.destroy()
	}

	async updateMember(groupId, username, values) {
		const member = await GroupMembers.findOne({
			where: {
				userId: await ResourceLoader.getUserIdByUsername(username),
				groupId: groupId
			}
		})

		if (values.isAdmin !== undefined)
			member.isAdmin = values.isAdmin

		if (values.color !== undefined)
			member.color = values.color

		await user.can.updateGroupMember(member, username)

		await member.save()

		return await ResourceLoader.loadMember(groupId, username)
	}

}

module.exports = new GroupMemberController()
