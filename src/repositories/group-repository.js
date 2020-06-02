const { Op } = require('sequelize')
const Boom = require('@hapi/boom')
const { Group, Place, User, GroupMembers, Participant, Lunchbreak } = require('../models')

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
			throw Boom.notFound()
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

	async getGroupMembershipsOfUser(userId) {
		const { groups } = await User.findByPk(userId, {
			attributes: [],
			include: [
				{
					model: Group,
					attributes: ['id'],
					through: {
						attributes: ['isAdmin'],
						as: 'config'
					}
				}
			]
		})

		return groups.map(group => {
			return {
				id: group.id,
				isAdmin: group.config.isAdmin
			}
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

		return config.toJSON()
	}

	/**
	 * Retrieve the configuration of a group.
	 * @param {*} participantId
	 * @returns {GroupConfig}
	 */
	async getGroupConfigByParticipant(participantId) {
		const participant = await Participant.findByPk(participantId, {
			include: [
				{
					model: Lunchbreak,
					attributes: ['id'],
					include: [
						{
							model: Group,
							attributes: ['voteEndingTime', 'utcOffset', 'pointsPerDay', 'minPointsPerVote', 'maxPointsPerVote'],
							include: [Place]
						}
					]
				}
			]
		})

		return participant.lunchbreak.group
	}
}

module.exports = new GroupRepository()
