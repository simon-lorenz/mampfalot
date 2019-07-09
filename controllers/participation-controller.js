'use strict'

const user = require('../classes/user')
const { Participant, GroupMembers, Lunchbreak, Vote, Place } = require('../models')
const { NotFoundError, RequestError, AuthorizationError } = require('../classes/errors')
const { Op } = require('sequelize')
const { voteEndingTimeReached } = require('../util/util')

class ParticipationLoader {

	static async loadParticipation(groupId, date, userId) {
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
					attributes: ['date'],
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

	async createParticipation(groupId, date, values) {
		const lunchbreak = await Lunchbreak.findOne({
			attributes: ['id'],
			where: {
				date, groupId
			}
		})

		if (await voteEndingTimeReached(lunchbreak.id))
			throw new RequestError('The end of voting has been reached, therefore you cannot participate anymore.')

		const member = await GroupMembers.findOne({
			attributes: ['id'],
			where: {
				groupId,
				userId: user.id
			}
		})

		if (member === null)
			throw new AuthorizationError('Participation', null, 'CREATE')

		let participation

		try {
			participation = await ParticipationLoader.loadParticipation(groupId, date, user.id)
			participation.resultId = values.result ? values.result.id : null
			participation.amountSpent = values.amountSpent
		} catch (error) {
			if (error instanceof NotFoundError) {
				participation = Participant.build({
					lunchbreakId: lunchbreak.id,
					memberId: member.id,
					resultId: values.result ? values.result.id : null,
					amountSpent: values.amountSpent
				})
			} else {{
				throw error
			}}
		}

		await participation.save()

		values.votes.map(vote => {
			vote.participantId = participation.id
			vote.placeId = vote.place ? vote.place.id : null
		})

		await Vote.bulkCreate(values.votes, { validate: true })

		let result = await ParticipationLoader.loadParticipation(groupId, date, user.id)

		result = result.toJSON()
		result.date = result.lunchbreak.date
		delete result.lunchbreak
		delete result.id
		delete result.lunchbreakId
		delete result.memberId
		delete result.resultId
		return result
	}

}

module.exports = new ParticipationController()
