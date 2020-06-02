const Boom = require('@hapi/boom')
const { Participant, Lunchbreak, Vote, GroupMembers, Place } = require('../models')
const { Op } = require('sequelize')

class ParticipationLoader {
	async loadParticipation(groupId, date, userId) {
		const participation = await Participant.findOne({
			include: [
				{
					model: GroupMembers,
					attributes: [],
					as: 'member',
					where: {
						userId: userId
					}
				},
				{
					model: Lunchbreak,
					attributes: ['id', 'date'],
					where: {
						date: date,
						groupId: groupId
					}
				},
				{
					model: Vote,
					attributes: ['id', 'points'],
					include: [
						{
							model: Place,
							attributes: ['id', 'name', 'foodType']
						}
					]
				},
				{
					model: Place,
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
		return await Participant.findAll({
			attributes: ['amountSpent'],
			include: [
				{
					model: GroupMembers,
					attributes: [],
					as: 'member',
					where: {
						userId: userId
					}
				},
				{
					model: Lunchbreak,
					attributes: ['date'],
					where: {
						date: {
							[Op.between]: [from, to]
						},
						groupId: groupId
					}
				},
				{
					model: Place,
					as: 'result',
					attributes: ['id', 'name', 'foodType']
				},
				{
					model: Vote,
					attributes: ['id', 'points'],
					include: [
						{
							model: Place,
							attributes: ['id', 'name', 'foodType']
						}
					]
				}
			]
		})
	}
}

module.exports = new ParticipationLoader()
