const { Op } = require('sequelize')
const Boom = require('@hapi/boom')
const GroupModel = require('./group.model')
const GroupMemberModel = require('../group-member/group-member.model')
const LunchbreakModel = require('../lunchbreak/lunchbreak.model')
const UserModel = require('../user/user.model')
const ParticipantModel = require('../participant/participant.model')
const PlaceModel = require('../place/place.model')

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
		const group = await GroupModel.findByPk(id, {
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
		})

		if (group) {
			return group
		} else {
			throw Boom.notFound()
		}
	}

	async getGroupsOfUser(userId) {
		// 1. Get all ids of groups the user is a member of
		let memberships = await GroupMemberModel.findAll({
			attributes: ['groupId'],
			where: {
				userId: userId
			}
		})

		memberships = memberships.map(membership => membership.groupId)

		// 2. Get all groups with those ids
		return GroupModel.findAll({
			where: {
				id: {
					[Op.in]: memberships
				}
			},
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
		})
	}

	async getGroupMembershipsOfUser(userId) {
		const { groups } = await UserModel.findByPk(userId, {
			attributes: [],
			include: [
				{
					model: GroupModel,
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
		const config = await GroupModel.findByPk(id, {
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
		const participant = await ParticipantModel.findByPk(participantId, {
			include: [
				{
					model: LunchbreakModel,
					attributes: ['id'],
					include: [
						{
							model: GroupModel,
							attributes: ['voteEndingTime', 'utcOffset', 'pointsPerDay', 'minPointsPerVote', 'maxPointsPerVote'],
							include: [PlaceModel]
						}
					]
				}
			]
		})

		return participant.lunchbreak.group
	}
}

module.exports = new GroupRepository()
