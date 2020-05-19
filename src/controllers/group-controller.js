const { Group, GroupMembers } = require('../models')
const { AuthorizationError } = require('../util/errors')
const { GroupRepository } = require('../repositories')

class GroupController {
	constructor(user) {
		this.user = user
	}

	async getGroupById(id) {
		const group = await GroupRepository.getGroup(id)

		if (!this.user.isGroupMember(id)) {
			throw new AuthorizationError('Group', id, 'READ')
		}

		return group
	}

	async getGroupsByUser(userId) {
		if (this.user.id !== userId) {
			throw new AuthorizationError('GroupCollection', null, 'READ')
		}

		return GroupRepository.getGroupsOfUser(userId)
	}

	async createGroup(values) {
		const { id } = await Group.create({
			name: values.name,
			lunchTime: values.lunchTime,
			voteEndingTime: values.voteEndingTime,
			utcOffset: Number(values.utcOffset),
			pointsPerDay: Number(values.pointsPerDay),
			maxPointsPerVote: Number(values.maxPointsPerVote),
			minPointsPerVote: Number(values.minPointsPerVote)
		})

		await GroupMembers.create({
			groupId: id,
			userId: this.user.id,
			isAdmin: true
		})

		return await GroupRepository.getGroup(id)
	}

	async updateGroup(id, values) {
		const group = await GroupRepository.getGroup(id)

		if (!this.user.isGroupAdmin(id)) {
			throw new AuthorizationError('Group', id, 'UPDATE')
		}

		await group.update(
			{
				name: values.name,
				voteEndingTime: values.voteEndingTime,
				lunchTime: values.lunchTime,
				utcOffset: Number(values.utcOffset),
				pointsPerDay: Number(values.pointsPerDay),
				minPointsPerVote: Number(values.minPointsPerVote),
				maxPointsPerVote: Number(values.maxPointsPerVote)
			},
			{
				where: {
					id: id
				}
			}
		)

		return GroupRepository.getGroup(id)
	}

	async deleteGroup(id) {
		const group = await this.getGroupById(id)

		if (!this.user.isGroupAdmin(id)) {
			throw new AuthorizationError('Group', id, 'DELETE')
		}

		await group.destroy()
	}
}

module.exports = GroupController
