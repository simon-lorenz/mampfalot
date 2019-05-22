'use strict'

const { Group, GroupMembers, Place, User } = require('../models')
const ResourceLoader = require('../classes/resource-loader')
const user = require('../classes/user')
const { AuthorizationError } = require('../classes/errors')
const { Op } = require('sequelize')

class GroupController {

	async getGroupById(id) {
		const group = await ResourceLoader.loadGroupById(id)
		await user.can.readGroup(group)
		return group
	}

	async getGroupsByUser(userId) {
		if (user.id !== userId)
			throw new AuthorizationError('GroupCollection', null, 'READ')

		// The problem here is to find all groups of which our user is a member of and
		// get a result which still includes all group members and not only our user.
		// I will do this in two steps, since I don't know how to get this done with
		// one sql statement alone. If there is a simple solution, please tell me.

		// 1. Get all ids of groups the user is a member of
		let memberships = await GroupMembers.findAll({
			attributes: ['groupId'],
			where: {
				userId: userId
			}
		})

		memberships = memberships.map(membership => membership.groupId)

		// 2. Get all groups with those ids
		return await Group.findAll({
			where: {
				id: {
					[Op.in]: memberships
				}
			},
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
		})
	}

	async createGroup(values) {
		const newGroup = await Group.create({
			name: values.name,
			lunchTime: values.lunchTime,
			voteEndingTime: values.voteEndingTime,
			utcOffset: Number(values.utcOffset),
			pointsPerDay: Number(values.pointsPerDay),
			maxPointsPerVote: Number(values.maxPointsPerVote),
			minPointsPerVote: Number(values.minPointsPerVote)
		})

		await GroupMembers.create({
			groupId: newGroup.id,
			userId: user.id,
			isAdmin: true
		})

		return await ResourceLoader.loadGroupById(newGroup.id)
	}

	async updateGroup(id, values) {
		const group = await this.getGroupById(id)

		await user.can.updateGroup(group)

		await group.update({
			name: values.name,
			voteEndingTime: values.voteEndingTime,
			lunchTime: values.lunchTime,
			utcOffset: Number(values.utcOffset),
			pointsPerDay: Number(values.pointsPerDay),
			minPointsPerVote: Number(values.minPointsPerVote),
			maxPointsPerVote: Number(values.maxPointsPerVote)
		})

		return await this.getGroupById(id)
	}

	async deleteGroup(id) {
		const group = await this.getGroupById(id)
		await user.can.deleteGroup(group)
		await group.destroy()
	}

}

module.exports = new GroupController()
