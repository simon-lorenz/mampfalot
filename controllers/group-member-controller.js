'use strict'

const { GroupMembers } = require('../models')
const ResourceLoader = require('../classes/resource-loader')

class GroupMemberController {

	constructor(user) {
		this.user = user
	}

	async removeMember(groupId, username) {
		const member = await GroupMembers.findOne({
			where: {
				userId: await ResourceLoader.getUserIdByUsername(username),
				groupId: groupId
			}
		})

		await this.user.can.deleteGroupMember(member, username)
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

		await this.user.can.updateGroupMember(member, username)

		await member.save()

		return await ResourceLoader.loadMember(groupId, username)
	}

}

module.exports = GroupMemberController
