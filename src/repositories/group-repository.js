const { Op } = require('sequelize')
const { Group, Place, User, GroupMembers } = require('../models')
const { NotFoundError } = require('../util/errors')

/**
 * @typedef {Object} GroupConfig
 * @property {string} voteEndingTime - The X Coordinate
 * @property {number} utcOffset
 * @property {number} pointsPerDay
 * @property {number} minPointsPerVote
 * @property {number} maxPointsPerVote
 */

class GroupRepository {
	async getGroup(id) {
		const group = await Group.findByPk(id, {
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

		if (group) {
			return group
		} else {
			throw new NotFoundError('Group', id)
		}
	}

	async getGroupsOfUser(userId) {
		// 1. Get all ids of groups the user is a member of
		let memberships = await GroupMembers.findAll({
			attributes: ['groupId'],
			where: {
				userId: userId
			}
		})

		memberships = memberships.map(membership => membership.groupId)

		// 2. Get all groups with those ids
		return Group.findAll({
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

	/**
	 * Retrieve the configuration of a group.
	 * @param {*} id
	 * @returns {GroupConfig}
	 */
	async getGroupConfig(id) {
		const config = await Group.findByPk(id, {
			attributes: ['voteEndingTime', 'utcOffset', 'pointsPerDay', 'minPointsPerVote', 'maxPointsPerVote']
		})

		if (config) {
			return config.toJSON()
		} else {
			throw new NotFoundError('Group', id)
		}
	}
}

module.exports = new GroupRepository()
