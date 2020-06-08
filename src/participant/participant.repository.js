const Boom = require('@hapi/boom')
const GroupMemberModel = require('../group-member/group-member.model')
const LunchbreakModel = require('../lunchbreak/lunchbreak.model')
const ParticipantModel = require('./participant.model')
const PlaceModel = require('../place/place.model')
const VoteModel = require('../vote/vote.model')
const { Op } = require('sequelize')

class ParticipationRepository {
	async loadParticipation(groupId, date, userId) {
		const participation = await ParticipantModel.findOne({
			include: [
				{
					model: GroupMemberModel,
					attributes: [],
					as: 'member',
					where: {
						userId: userId
					}
				},
				{
					model: LunchbreakModel,
					attributes: ['id', 'date'],
					where: {
						date: date,
						groupId: groupId
					}
				},
				{
					model: VoteModel,
					attributes: ['id', 'points'],
					include: [
						{
							model: PlaceModel,
							attributes: ['id', 'name', 'foodType']
						}
					]
				},
				{
					model: PlaceModel,
					as: 'result',
					attributes: ['id', 'name', 'foodType']
				}
			]
		})

		if (participation) {
			return participation
		} else {
			throw Boom.notFound()
		}
	}

	async loadParticipations(groupId, from, to, userId) {
		return await ParticipantModel.findAll({
			attributes: ['amountSpent'],
			include: [
				{
					model: GroupMemberModel,
					attributes: [],
					as: 'member',
					where: {
						userId: userId
					}
				},
				{
					model: LunchbreakModel,
					attributes: ['date'],
					where: {
						date: {
							[Op.between]: [from, to]
						},
						groupId: groupId
					}
				},
				{
					model: PlaceModel,
					as: 'result',
					attributes: ['id', 'name', 'foodType']
				},
				{
					model: VoteModel,
					attributes: ['id', 'points'],
					include: [
						{
							model: PlaceModel,
							attributes: ['id', 'name', 'foodType']
						}
					]
				}
			]
		})
	}
}
module.exports = new ParticipationRepository()
