'use strict'

const user = require('../classes/user')
const { Participant, GroupMembers, Lunchbreak, Vote, Place } = require('../models')
const { NotFoundError, RequestError } = require('../classes/errors')
const { Op } = require('sequelize')

class ParticipationLoader {

	static async loadParticipation(groupId, date, userId) {
		const participation = Participant.findOne({
			include: [
				{
					model: GroupMembers,
					as: 'member',
					where: {
						userId: userId
					}
				},
				{
					model: Lunchbreak,
					where: {
						date: date,
						groupId: groupId
					}
				}
			]
		})

		if (participation)
			return participation
		else
			throw new NotFoundError('Participation')

	}

	static async loadParticipations(groupId, from, to, userId) {
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
							[Op.between]: [ from, to ]
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

class ParticipationController {

	async deleteParticipation(groupId, date) {
		const participation = await ParticipationLoader.loadParticipation(groupId, date, user.id)
		await participation.destroy()
	}

	async getParticipations(groupId, from, to) {
		from = new Date(from)
		to = new Date(to)

		if (from >= to)
			throw new RequestError('The given timespan is invalid.')

		if (from.getFullYear() !== to.getFullYear())
			throw new RequestError('The query values from and to have to be in the same year.')

		const participations = await ParticipationLoader.loadParticipations(groupId, from, to, user.id)
		return participations.map(participation => {
			participation = participation.toJSON()
			participation.date = participation.lunchbreak.date
			delete participation.lunchbreak
			return participation
		})
	}

}

module.exports = new ParticipationController()
